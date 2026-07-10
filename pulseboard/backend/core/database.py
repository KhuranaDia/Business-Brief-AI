"""Database setup for PulseBoard.

Async SQLAlchemy 2.0 setup backed by PostgreSQL (asyncpg driver). Exposes the
``Brief`` model plus ``init_db`` and ``get_db`` helpers.
"""

from __future__ import annotations

import os
from datetime import datetime
from typing import AsyncGenerator
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from sqlalchemy import DateTime, Float, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

_RAW_DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/pulseboard",
)

# asyncpg needs the "postgresql+asyncpg://" scheme. Managed providers (Replit)
# hand out "postgresql://"; some tools use the bare "postgres://" alias. Rewrite
# either to the async driver form. A URL that already names a driver
# (e.g. "postgresql+asyncpg://" for the Docker default) is left untouched.
if _RAW_DATABASE_URL.startswith("postgres://"):
    _RAW_DATABASE_URL = _RAW_DATABASE_URL.replace(
        "postgres://", "postgresql+asyncpg://", 1
    )
elif _RAW_DATABASE_URL.startswith("postgresql://"):
    _RAW_DATABASE_URL = _RAW_DATABASE_URL.replace(
        "postgresql://", "postgresql+asyncpg://", 1
    )


def _normalize_url(url: str) -> tuple[str, dict]:
    """Strip libpq-style query params asyncpg can't accept and derive SSL.

    Managed Postgres providers (e.g. Replit/Neon) append params like
    ``?sslmode=require`` to ``DATABASE_URL``. asyncpg does not understand
    ``sslmode``/``channel_binding``/``sslrootcert`` as connect kwargs, so we
    remove them from the URL and translate SSL intent into ``connect_args``.
    A plain local URL (e.g. Docker) has no such params and is left untouched.
    """
    parsed = urlparse(url)
    query = parse_qs(parsed.query)
    connect_args: dict = {}

    sslmode = query.pop("sslmode", [None])[0]
    query.pop("channel_binding", None)
    query.pop("sslrootcert", None)

    if sslmode in ("require", "verify-ca", "verify-full", "prefer", "allow"):
        connect_args["ssl"] = True

    cleaned = parsed._replace(query=urlencode(query, doseq=True))
    return urlunparse(cleaned), connect_args


DATABASE_URL, _CONNECT_ARGS = _normalize_url(_RAW_DATABASE_URL)

engine = create_async_engine(
    DATABASE_URL, echo=False, pool_pre_ping=True, connect_args=_CONNECT_ARGS
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


class Brief(Base):
    """A stored morning brief and its supporting metadata."""

    __tablename__ = "briefs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    data_source_name: Mapped[str] = mapped_column(String(255), nullable=False)
    final_brief: Mapped[str] = mapped_column(Text, nullable=False)
    overall_health: Mapped[str] = mapped_column(String(32), nullable=False)
    anomalies: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    processing_time_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    agent_severities: Mapped[dict] = mapped_column(
        JSONB, nullable=False, default=dict
    )
    patterns: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    likely_root_cause: Mapped[str] = mapped_column(Text, nullable=False, default="")
    watch_list: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    agent_results: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "data_source_name": self.data_source_name,
            "final_brief": self.final_brief,
            "overall_health": self.overall_health,
            "anomalies": self.anomalies,
            "processing_time_seconds": self.processing_time_seconds,
            "agent_severities": self.agent_severities,
            "patterns": self.patterns,
            "likely_root_cause": self.likely_root_cause,
            "watch_list": self.watch_list,
            "agent_results": self.agent_results,
        }


async def init_db() -> None:
    """Create tables if they do not yet exist."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields an async database session."""
    async with AsyncSessionLocal() as session:
        yield session
