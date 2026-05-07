"""Main FastAPI application."""
from fastapi import FastAPI, WebSocket, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging
import base64
import io

from app.database import init_db, AsyncSessionLocal, FaceDetectionROI
from app.schemas import ROIListResponse, ROIData
from app.face_detection import FaceDetector


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize face detector (reuse across requests)
face_detector = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown."""
    global face_detector
    
    # Startup
    logger.info("Initializing database...")
    await init_db()
    logger.info("Database initialized.")
    
    logger.info("Initializing face detector...")
    face_detector = FaceDetector()
    logger.info("Face detector ready.")
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    if face_detector:
        del face_detector


app = FastAPI(
    title="Mega AI - Real-Time Face Detection",
    description="Real-time face detection API with WebSocket streaming",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def get_db():
    """Get database session."""
    async with AsyncSessionLocal() as session:
        yield session


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "mega-ai-face-detection"}


@app.websocket("/ws/stream")
async def websocket_stream(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket client connected.")

    db: AsyncSession = AsyncSessionLocal()

    try:
        while True:
            data = await websocket.receive_text()

            # Validate input data
            if not data:
                logger.warning("Received empty data from WebSocket")
                await websocket.send_json({
                    "error": "Empty data received",
                    "frame": None,
                    "roi": None
                })
                continue

            try:
                # Validate base64 format
                frame_bytes = base64.b64decode(data)
                if len(frame_bytes) == 0:
                    raise ValueError("Decoded frame is empty")

                processed_frame_b64, roi_data = face_detector.detect_and_draw(frame_bytes)

                if roi_data:
                    new_roi = FaceDetectionROI(
                        x_min=roi_data["x_min"],
                        y_min=roi_data["y_min"],
                        x_max=roi_data["x_max"],
                        y_max=roi_data["y_max"]
                    )
                    try:
                        db.add(new_roi)
                        await db.commit()
                    except Exception as e:
                        await db.rollback()
                        logger.error(f"DB commit failed: {e}")
                        # Continue processing even if DB fails

                await websocket.send_json({
                    "frame": processed_frame_b64,
                    "roi": roi_data
                })

            except base64.binascii.Error as e:
                logger.error(f"Invalid base64 data: {e}")
                await websocket.send_json({
                    "error": "Invalid base64 data",
                    "frame": None,
                    "roi": None
                })
            except ValueError as e:
                logger.error(f"Invalid frame data: {e}")
                await websocket.send_json({
                    "error": f"Invalid frame data: {str(e)}",
                    "frame": None,
                    "roi": None
                })
            except Exception as e:
                logger.error(f"Error processing frame: {e}")
                # Only send error if connection is still open
                if websocket.client_state.value == 1:  # CONNECTED
                    await websocket.send_json({
                        "error": str(e),
                        "frame": None,
                        "roi": None
                    })

    except Exception as e:
        # WebSocketDisconnect is normal — don't log as error
        from starlette.websockets import WebSocketDisconnect
        if not isinstance(e, WebSocketDisconnect):
            logger.error(f"WebSocket error: {e}")

    finally:
        await db.close()
        # Only close if client hasn't already disconnected
        from starlette.websockets import WebSocketState
        if websocket.client_state != WebSocketState.DISCONNECTED:
            try:
                await websocket.close()
            except RuntimeError:
                pass  # Already closed, ignore
        logger.info("WebSocket client disconnected.")


@app.get("/data/roi", response_model=ROIListResponse)
async def get_roi_data(db: AsyncSession = Depends(get_db)):
    """
    GET endpoint to retrieve all historical face detection events.
    
    Returns:
        List of all stored ROI detections with timestamps.
    """
    try:
        # Query all ROI records ordered by timestamp descending
        result = await db.execute(
            select(FaceDetectionROI).order_by(FaceDetectionROI.timestamp.desc())
        )
        roi_records = result.scalars().all()
        
        # Convert to response schema
        roi_data = [ROIData.model_validate(record) for record in roi_records]

        
        return ROIListResponse(
            data=roi_data,
            count=len(roi_data)
        )
    
    except Exception as e:
        logger.error(f"Error retrieving ROI data: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve ROI data")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Mega AI - Real-Time Face Detection API",
        "endpoints": {
            "health": "/health",
            "websocket": "/ws/stream",
            "roi_data": "/data/roi",
            "docs": "/docs"
        }
    }
