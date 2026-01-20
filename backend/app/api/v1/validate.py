from fastapi import APIRouter, HTTPException, status

from app.deps import CurrentUser
from app.schemas import ValidationRequest, ValidationResponse
from app.services.storage import get_storage
from app.services.validation import get_validator

router = APIRouter(tags=["validation"])


@router.post("/validate", response_model=ValidationResponse)
async def validate_image(
    request: ValidationRequest,
    user: CurrentUser,  # Require auth but don't charge credits
) -> ValidationResponse:
    """
    Validate an uploaded image for headshot generation.

    This endpoint:
    - Checks for face detection (single face required)
    - Validates image quality (resolution, blur, lighting)
    - Returns detailed feedback and suggestions

    No credits are charged for validation.
    """
    storage = get_storage()
    validator = get_validator()

    try:
        # Download the image from storage
        image_bytes = storage.download_file("uploads", request.image_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image not found: {str(e)}",
        )

    # Validate the image
    result = validator.validate(image_bytes)

    return result
