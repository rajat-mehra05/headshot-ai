from fastapi import APIRouter

from app.deps import CurrentUser
from app.schemas import PresignedUrlRequest, PresignedUrlResponse
from app.services.storage import get_storage

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/presigned", response_model=PresignedUrlResponse)
async def get_presigned_upload_url(
    request: PresignedUrlRequest,
    user: CurrentUser,
) -> PresignedUrlResponse:
    """
    Get a presigned URL for uploading an image directly to storage.

    The client should:
    1. Call this endpoint to get the upload URL
    2. PUT the file directly to the upload URL
    3. Use the returned file_path for validation and job creation
    """
    # Validate content type
    allowed_types = ["image/jpeg", "image/png"]
    if request.content_type not in allowed_types:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid content type. Allowed: {', '.join(allowed_types)}",
        )

    storage = get_storage()
    upload_url, file_path, expires_at = storage.get_presigned_upload_url(
        user_id=str(user.id),
        filename=request.filename,
        content_type=request.content_type,
    )

    return PresignedUrlResponse(
        upload_url=upload_url,
        file_path=file_path,
        expires_at=expires_at,
    )
