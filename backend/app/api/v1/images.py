from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from app.deps import CurrentUser, DbSession
from app.models import Job, JobStatus
from app.schemas import DownloadUrlResponse
from app.services.storage import get_storage

router = APIRouter(prefix="/images", tags=["images"])


@router.get("/{job_id}/download", response_model=DownloadUrlResponse)
async def get_download_url(
    job_id: UUID,
    user: CurrentUser,
    db: DbSession,
) -> DownloadUrlResponse:
    """
    Get a signed URL for downloading the generated headshot.

    The URL expires after 1 hour.
    """
    # Get the job
    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.user_id == user.id)
    )
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    if job.status != JobStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job is not completed yet",
        )

    if not job.output_image_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Output image not found",
        )

    storage = get_storage()
    url, expires_at = storage.get_presigned_download_url(
        bucket="outputs",
        file_path=job.output_image_path,
        expires_in=3600,  # 1 hour
    )

    return DownloadUrlResponse(url=url, expires_at=expires_at)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_image(
    job_id: UUID,
    user: CurrentUser,
    db: DbSession,
) -> None:
    """
    Delete a generated headshot and its associated data.

    This will:
    - Delete the output image from storage
    - Delete the thumbnail from storage
    - Mark the job as deleted (soft delete)
    """
    # Get the job
    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.user_id == user.id)
    )
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    storage = get_storage()

    # Delete files from storage
    if job.output_image_path:
        try:
            storage.delete_file("outputs", job.output_image_path)
        except Exception:
            pass  # Ignore if file doesn't exist

    if job.thumbnail_path:
        try:
            storage.delete_file("thumbnails", job.thumbnail_path)
        except Exception:
            pass  # Ignore if file doesn't exist

    # Clear the paths (soft delete - keep job record for history)
    job.output_image_path = None
    job.thumbnail_path = None
    db.add(job)
    await db.commit()
