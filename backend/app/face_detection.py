"""Face detection module using Mediapipe."""
import mediapipe as mp
from mediapipe.tasks.python import vision
import numpy as np
from PIL import Image, ImageDraw
import io
import base64


class FaceDetector:
    """Face detection handler using Mediapipe FaceLandmarker."""
    
    def __init__(self):
        """Initialize Mediapipe Face Landmarker for face detection."""
        model_path = 'face_landmarker.task'
        base_options = mp.tasks.BaseOptions(model_asset_path=model_path)
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            num_faces=1,  # Assume exactly one face per frame
            min_face_detection_confidence=0.5
        )
        self.landmarker = vision.FaceLandmarker.create_from_options(options)
    
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
        
        roi_data = None
        
        if self.landmarker is not None:
            # Convert to MediaPipe Image format
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_np)
            
            # Run face landmarking
            detection_result = self.landmarker.detect(mp_image)
            
            # Draw bounding boxes if faces detected
            if detection_result.face_landmarks and len(detection_result.face_landmarks) > 0:
                # Get all face landmarks for the first (and only) face
                face_landmarks = detection_result.face_landmarks[0]
                
                # Extract x and y coordinates from landmarks
                x_coords = [landmark.x * width for landmark in face_landmarks]
                y_coords = [landmark.y * height for landmark in face_landmarks]
                
                # Get bounding box from landmarks
                x_min = int(min(x_coords))
                y_min = int(min(y_coords))
                x_max = int(max(x_coords))
                y_max = int(max(y_coords))
                
                # Add some padding
                padding = 10
                x_min = max(0, x_min - padding)
                y_min = max(0, y_min - padding)
                x_max = min(width, x_max + padding)
                y_max = min(height, y_max + padding)
                
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
        else:
            # Fallback: Create a dummy ROI in the center (for testing)
            # This is just a placeholder when mediapipe can't load
            roi_data = {
                "x_min": float(width // 4),
                "y_min": float(height // 4),
                "x_max": float(3 * width // 4),
                "y_max": float(3 * height // 4)
            }
        
        # Convert processed image back to base64
        buffered = io.BytesIO()
        image_rgb.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return img_str, roi_data
    
    def __del__(self):
        """Cleanup resources."""
        if hasattr(self, 'landmarker') and self.landmarker is not None:
            try:
                self.landmarker.close()
            except:
                pass
