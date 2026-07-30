"""Public, unauthenticated endpoints: page-visit beacon and reply feedback.

No auth here on purpose — visitors may not be signed in. Contrast with
admin.py, where every route requires the Admin role.
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.api.deps import SessionDep
from app.models.feedback import Feedback
from app.models.page_visit import PageVisit

router = APIRouter(tags=["tracking"])


class TrackVisitRequest(BaseModel):
    visitor_id: str = Field(..., min_length=1, max_length=64)
    path: str = Field(default="/", max_length=255)
    user_id: str | None = None


@router.post("/track-visit", status_code=204)
async def track_visit(request: TrackVisitRequest, session: SessionDep) -> None:
    session.add(PageVisit(visitor_id=request.visitor_id, path=request.path, user_id=request.user_id))


class FeedbackRequest(BaseModel):
    run_id: uuid.UUID | None = None
    user_id: str | None = None
    rating: str = Field(..., pattern="^(up|down)$")
    category: str | None = Field(default=None, max_length=50)
    comment: str | None = None


@router.post("/feedback", status_code=204)
async def submit_feedback(request: FeedbackRequest, session: SessionDep) -> None:
    session.add(
        Feedback(
            run_id=request.run_id,
            user_id=request.user_id,
            rating=request.rating,
            category=request.category,
            comment=request.comment,
        )
    )
