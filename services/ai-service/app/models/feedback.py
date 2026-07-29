import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.base import TimestampMixin


class Feedback(Base, TimestampMixin):
    """Thumbs up/down on an AI reply, optionally tied back to the AgentRun."""

    __tablename__ = "feedback"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    run_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("agent_runs.id", ondelete="SET NULL"), nullable=True, index=True
    )
    user_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    rating: Mapped[str] = mapped_column(String(10))  # "up" | "down"
    category: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
