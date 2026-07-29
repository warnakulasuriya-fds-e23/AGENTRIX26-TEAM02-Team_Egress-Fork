import uuid

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.base import TimestampMixin


class PageVisit(Base, TimestampMixin):
    """One row per page load. visitor_id is a client-generated id persisted in
    localStorage — not a verified identity, just enough to dedupe "unique"
    visitors without requiring sign-in."""

    __tablename__ = "page_visits"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    visitor_id: Mapped[str] = mapped_column(String(64), index=True)
    user_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    path: Mapped[str] = mapped_column(String(255), default="/")
