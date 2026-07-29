from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_session
from app.providers.base import get_http_client


async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_session():
        yield session


SessionDep = Annotated[AsyncSession, Depends(db_session)]


async def require_admin(authorization: str = Header(None)) -> dict:
    """Gate admin-only routes by delegating the role check to user-service.

    user-service already verifies the caller against Clerk and reconciles the
    ADMIN_EMAILS allowlist onto the user row (see services/user-service) — we
    reuse that rather than re-implementing a second, possibly-divergent check.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization")

    try:
        resp = await get_http_client().get(
            f"{settings.user_service_url}/api/users/me",
            headers={"Authorization": authorization},
        )
    except Exception as exc:  # noqa: BLE001 - network failure talking to user-service
        raise HTTPException(status_code=502, detail=f"user-service unreachable: {exc}") from exc

    if resp.status_code == 401:
        raise HTTPException(status_code=401, detail="Invalid session")
    if resp.status_code == 404:
        raise HTTPException(status_code=403, detail="User not synchronized yet")
    resp.raise_for_status()

    user = resp.json()
    if user.get("role") != "Admin":
        raise HTTPException(status_code=403, detail="Admin role required")
    return user
