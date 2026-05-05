"""Database configuration and models."""
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, Integer, Float, DateTime
from datetime import datetime

# Use aiosqlite for async SQLite support
DATABASE_URL = "sqlite+aiosqlite:///./mega_ai.db"

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    connect_args={"check_same_thread": False},
)

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False, future=True
)

Base = declarative_base()


class FaceDetectionROI(Base):
    """Face detection Region of Interest (ROI) model."""
    __tablename__ = "face_detection_rois"

    id = Column(Integer, primary_key=True, index=True)
    x_min = Column(Float, nullable=False)
    y_min = Column(Float, nullable=False)
    x_max = Column(Float, nullable=False)
    y_max = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)


async def get_db():
    """Get database session."""
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
