"""Face detection module using Mediapipe."""
import mediapipe as mp
import numpy as np
from PIL import Image, ImageDraw
import io
import base64


class FaceDetector:
    """Face detection handler using Mediapipe."""
    
    def __init__(self):
        """Initialize Mediapipe Face Detection."""
        self.mp_face_detection = mp.solutions.face_detection
        self.face_detection = self.mp_face_detection.FaceDetection(
            model_selection=0,  # 0 for short-range, 1 for full-range
            min_detection_confidence=0.5
        )
    
    def detect_and_draw(self, frame_bytes: bytes) -> tuple[str, dict | None]:
        """
        Detect faces in frame and draw ROI.
        
        Args:
            frame_bytes: Image bytes (JPG/PNG)
            
        Returns:
            Tuple of (base64_encoded_frame, roi_data)
            roi_data contains: {x_min, y_min, x_max, y_max} or None if no face
        """
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(frame_bytes))
        image_rgb = image.convert('RGB')
        image_np = np.array(image_rgb)
        
        # Get image dimensions
        height, width = image_np.shape[:2]
        
        # Run face detection
        results = self.face_detection.process(image_np)
        
        roi_data = None
        
        # Draw bounding boxes if faces detected
        if results.detections:
            # Assume exactly one face per frame (as per requirements)
            detection = results.detections[0]
            
            # Get normalized bounding box
            bbox = detection.location_data.relative_bounding_box
            
            # Convert to pixel coordinates
            x_min = int(bbox.xmin * width)
            y_min = int(bbox.ymin * height)
            x_max = int((bbox.xmin + bbox.width) * width)
            y_max = int((bbox.ymin + bbox.height) * height)
            
            # Ensure coordinates are within bounds
            x_min = max(0, x_min)
            y_min = max(0, y_min)
            x_max = min(width, x_max)
            y_max = min(height, y_max)
            
            roi_data = {
                "x_min": float(x_min),
                "y_min": float(y_min),
                "x_max": float(x_max),
                "y_max": float(y_max)
            }
            
            # Draw minimal axis-aligned bounding box using Pillow
            draw = ImageDraw.Draw(image_rgb)
            draw.rectangle(
                [(x_min, y_min), (x_max, y_max)],
                outline="red",
                width=2
            )
        
        # Convert processed image back to base64
        buffered = io.BytesIO()
        image_rgb.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return img_str, roi_data
    
    def __del__(self):
        """Cleanup resources."""
        if hasattr(self, 'face_detection'):
            self.face_detection.close()
