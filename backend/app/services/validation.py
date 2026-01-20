import io
from dataclasses import dataclass
from typing import Optional

import cv2
import mediapipe as mp
import numpy as np
from PIL import Image

from app.schemas import ValidationResponse


@dataclass
class ValidationConfig:
    min_face_size_ratio: float = 0.15  # Face must be at least 15% of image
    min_resolution: int = 512
    max_faces: int = 1
    blur_threshold: float = 100.0  # Laplacian variance threshold


class ImageValidator:
    def __init__(self, config: Optional[ValidationConfig] = None):
        self.config = config or ValidationConfig()
        self.face_detection = mp.solutions.face_detection.FaceDetection(
            model_selection=1,  # Full range model
            min_detection_confidence=0.7,
        )
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.7,
        )

    def validate(self, image_bytes: bytes) -> ValidationResponse:
        """Validate an image for headshot generation."""
        errors: list[str] = []
        suggestions: list[str] = []
        face_landmarks: Optional[dict] = None
        quality_score = 100

        try:
            # Load image
            image = Image.open(io.BytesIO(image_bytes))
            image_array = np.array(image)

            # Convert to RGB if needed
            if len(image_array.shape) == 2:
                image_array = cv2.cvtColor(image_array, cv2.COLOR_GRAY2RGB)
            elif image_array.shape[2] == 4:
                image_array = cv2.cvtColor(image_array, cv2.COLOR_RGBA2RGB)

            height, width = image_array.shape[:2]

            # Check resolution
            if width < self.config.min_resolution or height < self.config.min_resolution:
                errors.append(
                    f"Image resolution too low. Minimum {self.config.min_resolution}px required."
                )
                quality_score -= 20

            # Detect faces
            results = self.face_detection.process(image_array)

            if not results.detections:
                errors.append("No face detected. Please upload a clear photo of your face.")
                quality_score -= 50
            elif len(results.detections) > self.config.max_faces:
                errors.append(
                    f"Multiple faces detected ({len(results.detections)}). "
                    "Please upload a photo with only one person."
                )
                quality_score -= 30
            else:
                # Single face detected - check size
                detection = results.detections[0]
                bbox = detection.location_data.relative_bounding_box

                face_width = bbox.width
                face_height = bbox.height
                face_area_ratio = face_width * face_height

                if face_area_ratio < self.config.min_face_size_ratio:
                    errors.append(
                        "Face is too small in the image. Please use a closer photo."
                    )
                    quality_score -= 15

                # Get detailed landmarks
                mesh_results = self.face_mesh.process(image_array)
                if mesh_results.multi_face_landmarks:
                    landmarks = mesh_results.multi_face_landmarks[0]
                    face_landmarks = {
                        "nose_tip": [
                            landmarks.landmark[4].x,
                            landmarks.landmark[4].y,
                        ],
                        "left_eye": [
                            landmarks.landmark[33].x,
                            landmarks.landmark[33].y,
                        ],
                        "right_eye": [
                            landmarks.landmark[263].x,
                            landmarks.landmark[263].y,
                        ],
                        "mouth_center": [
                            landmarks.landmark[13].x,
                            landmarks.landmark[13].y,
                        ],
                    }

            # Check for blur
            gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

            if laplacian_var < self.config.blur_threshold:
                errors.append("Image appears blurry. Please upload a sharper photo.")
                quality_score -= 15

            # Check lighting (basic histogram analysis)
            hist = cv2.calcHist([gray], [0], None, [256], [0, 256])
            dark_pixels = np.sum(hist[:50]) / np.sum(hist)
            bright_pixels = np.sum(hist[200:]) / np.sum(hist)

            if dark_pixels > 0.5:
                suggestions.append("Image appears dark. Better lighting may improve results.")
                quality_score -= 5
            elif bright_pixels > 0.3:
                suggestions.append("Image appears overexposed. Softer lighting may improve results.")
                quality_score -= 5

            # Add general suggestions
            if not errors and quality_score >= 80:
                suggestions.append("Good quality photo! Ready for headshot generation.")
            elif not errors:
                suggestions.append("Photo quality is acceptable but could be improved.")

        except Exception as e:
            errors.append(f"Failed to process image: {str(e)}")
            quality_score = 0

        return ValidationResponse(
            passed=len(errors) == 0,
            errors=errors,
            suggestions=suggestions,
            face_landmarks=face_landmarks,
            quality_score=max(0, quality_score),
        )

    def __del__(self):
        self.face_detection.close()
        self.face_mesh.close()


# Singleton instance
_validator: Optional[ImageValidator] = None


def get_validator() -> ImageValidator:
    global _validator
    if _validator is None:
        _validator = ImageValidator()
    return _validator
