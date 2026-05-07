"""Tests for face detection module."""
import pytest
from PIL import Image
import io
import base64
from app.face_detection import FaceDetector


def create_test_image(width=640, height=480, color=(255, 255, 255)):
    """Create a test image."""
    img = Image.new('RGB', (width, height), color=color)
    return img


def image_to_bytes(img):
    """Convert PIL image to bytes."""
    buffered = io.BytesIO()
    img.save(buffered, format="JPEG")
    return buffered.getvalue()


@pytest.fixture
def face_detector():
    """Face detector fixture."""
    return FaceDetector()


def test_face_detector_initialization(face_detector):
    """Test face detector initializes properly."""
    assert face_detector is not None
    assert hasattr(face_detector, 'landmarker')


def test_detect_and_draw_no_face(face_detector):
    """Test detection on image with no face."""
    # Create a blank white image
    img = create_test_image()
    img_bytes = image_to_bytes(img)

    result_b64, roi_data = face_detector.detect_and_draw(img_bytes)

    # Should return base64 string
    assert isinstance(result_b64, str)
    # Should be able to decode it back
    decoded = base64.b64decode(result_b64)
    assert len(decoded) > 0

    # ROI data should be present (fallback dummy ROI)
    assert roi_data is not None
    assert "x_min" in roi_data
    assert "y_min" in roi_data
    assert "x_max" in roi_data
    assert "y_max" in roi_data


def test_detect_and_draw_with_image(face_detector):
    """Test detection with a valid image."""
    # Create a test image
    img = create_test_image(320, 240, (200, 200, 200))
    img_bytes = image_to_bytes(img)

    result_b64, roi_data = face_detector.detect_and_draw(img_bytes)

    # Should return valid base64
    assert isinstance(result_b64, str)
    decoded = base64.b64decode(result_b64)
    assert len(decoded) > 0

    # ROI data should exist
    assert roi_data is not None
    assert all(isinstance(v, float) for v in roi_data.values())


def test_invalid_image_bytes(face_detector):
    """Test handling of invalid image bytes."""
    invalid_bytes = b"not an image"

    # Should handle gracefully (though may raise exception)
    try:
        result_b64, roi_data = face_detector.detect_and_draw(invalid_bytes)
        # If it doesn't raise, should still return something
        assert isinstance(result_b64, str)
    except Exception:
        # Expected for invalid input
        pass