from fastapi import APIRouter

from app.api.routes import admin, chat, conversations, data, llm_config, tracking
from app.core.config import settings

api_router = APIRouter(prefix=settings.api_prefix)
api_router.include_router(chat.router)
api_router.include_router(conversations.router)
api_router.include_router(data.router)
api_router.include_router(llm_config.router)
api_router.include_router(admin.router)
api_router.include_router(tracking.router)
