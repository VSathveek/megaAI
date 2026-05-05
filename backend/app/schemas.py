"""Pydantic schemas for request/response validation."""
from pydantic import BaseModel
from datetime import datetime


class ROIData(BaseModel):
    """ROI data response schema."""
    id: int
    x_min: float
    y_min: float
    x_max: float
    y_max: float
    timestamp: datetime

    class Config:
        from_attributes = True


class ROIListResponse(BaseModel):
    """List of ROI data."""
    data: list[ROIData]
    count: int
