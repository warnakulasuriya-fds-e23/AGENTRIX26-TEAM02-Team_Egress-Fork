"""Admin-only stats: vector DB inventory, AI adoption, token usage & cost.

Every route here is gated by require_admin (delegates the role check to
user-service, which already verifies the caller against Clerk).
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select

from app.api.deps import SessionDep, require_admin
from app.core.config import settings
from app.core.pricing import estimate_cost
from app.db.qdrant import get_qdrant
from app.db.qdrant_collections import COLLECTION_SPECS
from app.models.agent_run import AgentRun
from app.models.feedback import Feedback
from app.models.page_visit import PageVisit

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/vector-db")
async def vector_db_stats() -> dict:
    """Point count per Qdrant collection — real inventory, queried live."""
    client = get_qdrant()
    collections = []
    total = 0
    for spec in COLLECTION_SPECS:
        try:
            info = await client.get_collection(spec.name)
            count = info.points_count or 0
        except Exception as exc:  # noqa: BLE001 - collection may not exist yet
            logger.warning("Could not read Qdrant collection '%s': %s", spec.name, exc)
            count = 0
        total += count
        collections.append(
            {
                "key": spec.key,
                "name": spec.name,
                "description": spec.description,
                "points_count": count,
            }
        )
    return {"total_points": total, "collections": collections}


@router.get("/ai-usage")
async def ai_usage_stats(session: SessionDep) -> dict:
    """Distinct users who've actually run the agent, vs. total runs/status split.

    Sourced from agent_runs.user_id, populated whenever the frontend sends a
    signed-in Clerk user id with /chat. Anonymous (no user_id) runs are counted
    separately since they can't be attributed to a registered user.
    """
    total_runs = (await session.execute(select(func.count(AgentRun.id)))).scalar_one()

    distinct_users = (
        await session.execute(
            select(func.count(func.distinct(AgentRun.user_id))).where(AgentRun.user_id.is_not(None))
        )
    ).scalar_one()

    anonymous_runs = (
        await session.execute(
            select(func.count(AgentRun.id)).where(AgentRun.user_id.is_(None))
        )
    ).scalar_one()

    status_rows = (
        await session.execute(select(AgentRun.status, func.count(AgentRun.id)).group_by(AgentRun.status))
    ).all()

    return {
        "total_runs": total_runs,
        "distinct_ai_users": distinct_users,
        "anonymous_runs": anonymous_runs,
        "runs_by_status": {status: count for status, count in status_rows},
    }


@router.get("/tokens")
async def token_usage_stats(days: int = 30) -> dict:
    """Aggregate token usage & estimated cost from LangSmith traces.

    Pulled live from LangSmith (already tracing every LLM call — see
    core/langsmith.py), not a locally-persisted table, so this reflects
    whatever's actually been sent to the provider. Cost is an estimate from
    core/pricing.py's list-price table, not the provider's actual invoice.
    """
    if not settings.langsmith_api_key:
        return {"available": False, "reason": "LangSmith not configured (LANGSMITH_API_KEY unset)"}

    try:
        from langsmith import Client

        client = Client(api_key=settings.langsmith_api_key)
        start_time = datetime.now(timezone.utc) - timedelta(days=days)

        by_model: dict[str, dict[str, float]] = {}
        total_prompt = 0
        total_completion = 0
        run_count = 0

        for run in client.list_runs(
            project_name=settings.langsmith_project,
            run_type="llm",
            start_time=start_time,
        ):
            prompt_tokens = getattr(run, "prompt_tokens", None) or 0
            completion_tokens = getattr(run, "completion_tokens", None) or 0
            if not prompt_tokens and not completion_tokens:
                continue

            extra = getattr(run, "extra", None) or {}
            invocation_params = extra.get("invocation_params", {}) if isinstance(extra, dict) else {}
            model = (
                invocation_params.get("model")
                or invocation_params.get("model_name")
                or (extra.get("metadata", {}) if isinstance(extra, dict) else {}).get("ls_model_name")
                or "unknown"
            )

            run_count += 1
            total_prompt += prompt_tokens
            total_completion += completion_tokens

            bucket = by_model.setdefault(
                model, {"runs": 0, "prompt_tokens": 0, "completion_tokens": 0, "estimated_cost_usd": 0.0}
            )
            bucket["runs"] += 1
            bucket["prompt_tokens"] += prompt_tokens
            bucket["completion_tokens"] += completion_tokens
            bucket["estimated_cost_usd"] += estimate_cost(model, prompt_tokens, completion_tokens)

        return {
            "available": True,
            "window_days": days,
            "llm_call_count": run_count,
            "total_prompt_tokens": total_prompt,
            "total_completion_tokens": total_completion,
            "total_tokens": total_prompt + total_completion,
            "estimated_cost_usd": round(sum(b["estimated_cost_usd"] for b in by_model.values()), 4),
            "by_model": {
                model: {
                    "runs": b["runs"],
                    "prompt_tokens": b["prompt_tokens"],
                    "completion_tokens": b["completion_tokens"],
                    "estimated_cost_usd": round(b["estimated_cost_usd"], 4),
                }
                for model, b in by_model.items()
            },
        }
    except Exception as exc:  # noqa: BLE001 - LangSmith API hiccup shouldn't 500 the dashboard
        logger.warning("LangSmith token stats fetch failed: %s", exc)
        return {"available": False, "reason": str(exc)}


@router.get("/visitors")
async def visitor_stats(session: SessionDep) -> dict:
    """Real visit counts from the page-visit beacon (see routes/tracking.py).

    "Active now" = distinct visitor_id with a beacon in the last 15 minutes —
    a heartbeat proxy, not a true live-session count (no websocket/presence).
    """
    now = datetime.now(timezone.utc)

    total_visits = (await session.execute(select(func.count(PageVisit.id)))).scalar_one()
    unique_visitors = (
        await session.execute(select(func.count(func.distinct(PageVisit.visitor_id))))
    ).scalar_one()
    registered_visitors = (
        await session.execute(
            select(func.count(func.distinct(PageVisit.visitor_id))).where(PageVisit.user_id.is_not(None))
        )
    ).scalar_one()
    active_now = (
        await session.execute(
            select(func.count(func.distinct(PageVisit.visitor_id))).where(
                PageVisit.created_at >= now - timedelta(minutes=15)
            )
        )
    ).scalar_one()
    last_24h = (
        await session.execute(
            select(func.count(func.distinct(PageVisit.visitor_id))).where(
                PageVisit.created_at >= now - timedelta(hours=24)
            )
        )
    ).scalar_one()

    return {
        "total_visits": total_visits,
        "unique_visitors": unique_visitors,
        "registered_visitors": registered_visitors,
        "active_now": active_now,
        "unique_last_24h": last_24h,
    }


@router.get("/agent-activity")
async def agent_activity(session: SessionDep, limit: int = 25) -> dict:
    """Recent AgentRun rows — a real activity log, not a mock feed."""
    rows = (
        await session.execute(
            select(AgentRun.id, AgentRun.run_type, AgentRun.status, AgentRun.user_id, AgentRun.created_at)
            .order_by(AgentRun.created_at.desc())
            .limit(limit)
        )
    ).all()
    return {
        "runs": [
            {
                "id": str(r.id),
                "run_type": r.run_type,
                "status": r.status,
                "user_id": r.user_id,
                "created_at": r.created_at.isoformat(),
            }
            for r in rows
        ]
    }


@router.get("/feedback")
async def feedback_stats(session: SessionDep, limit: int = 25) -> dict:
    """Aggregate thumbs up/down + category breakdown + recent items."""
    rating_rows = (
        await session.execute(select(Feedback.rating, func.count(Feedback.id)).group_by(Feedback.rating))
    ).all()
    category_rows = (
        await session.execute(
            select(Feedback.category, func.count(Feedback.id)).group_by(Feedback.category)
        )
    ).all()
    recent = (
        await session.execute(
            select(
                Feedback.id, Feedback.rating, Feedback.category, Feedback.comment, Feedback.created_at
            )
            .order_by(Feedback.created_at.desc())
            .limit(limit)
        )
    ).all()

    return {
        "by_rating": {rating: count for rating, count in rating_rows},
        "by_category": {(category or "uncategorized"): count for category, count in category_rows},
        "recent": [
            {
                "id": str(r.id),
                "rating": r.rating,
                "category": r.category,
                "comment": r.comment,
                "created_at": r.created_at.isoformat(),
            }
            for r in recent
        ],
    }


@router.get("/queries-by-month")
async def queries_by_month(session: SessionDep, months: int = 12) -> dict:
    """Monthly chat-run volume for the last N months — the "User Queries" chart."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=months * 31)
    bucket = func.date_trunc("month", AgentRun.created_at)
    rows = (
        await session.execute(
            select(bucket.label("month"), func.count(AgentRun.id))
            .where(AgentRun.created_at >= cutoff)
            .group_by(bucket)
            .order_by(bucket)
        )
    ).all()
    return {"months": [{"month": month.strftime("%Y-%m"), "count": count} for month, count in rows]}
