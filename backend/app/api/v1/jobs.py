from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from app.deps import CurrentUser, DbSession
from app.models import Job, JobStatus
from app.schemas import JobCreate, JobResponse
from app.services.credits import CreditService

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    request: JobCreate,
    user: CurrentUser,
    db: DbSession,
) -> JobResponse:
    """
    Create a new headshot generation job.

    This will:
    1. Deduct 1 credit from the user's balance
    2. Create a job record
    3. Queue the job for processing

    Returns 402 if insufficient credits.
    """
    credit_service = CreditService(db)

    # Check credits
    if user.credits_balance < 1:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Insufficient credits. Please purchase more credits.",
        )

    # Create job
    job = Job(
        user_id=user.id,
        input_image_path=request.input_image_path,
        style_preset=request.style_preset,
        background_option=request.background_option,
        status=JobStatus.PENDING,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Deduct credits
    try:
        await credit_service.deduct_credits(
            user_id=user.id,
            amount=1,
            job_id=job.id,
        )
    except ValueError as e:
        # Rollback job creation
        await db.delete(job)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=str(e),
        )

    # Queue the job for processing (Celery)
    # from app.tasks.generation import process_headshot_job
    # process_headshot_job.delay(str(job.id))

    return JobResponse(
        id=job.id,
        user_id=job.user_id,
        status=job.status,
        input_image_path=job.input_image_path,
        style_preset=job.style_preset,
        background_option=job.background_option,
        validation_passed=job.validation_passed,
        validation_errors=job.validation_errors,
        output_image_path=job.output_image_path,
        thumbnail_path=job.thumbnail_path,
        credits_charged=job.credits_charged,
        processing_time_ms=job.processing_time_ms,
        error_message=job.error_message,
        created_at=job.created_at,
        started_at=job.started_at,
        completed_at=job.completed_at,
    )


@router.get("", response_model=list[JobResponse])
async def list_jobs(
    user: CurrentUser,
    db: DbSession,
    limit: int = 50,
    offset: int = 0,
    status_filter: Optional[JobStatus] = None,
) -> list[JobResponse]:
    """List all jobs for the current user."""
    query = select(Job).where(Job.user_id == user.id)

    if status_filter:
        query = query.where(Job.status == status_filter)

    query = query.order_by(Job.created_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    jobs = result.scalars().all()

    return [
        JobResponse(
            id=job.id,
            user_id=job.user_id,
            status=job.status,
            input_image_path=job.input_image_path,
            style_preset=job.style_preset,
            background_option=job.background_option,
            validation_passed=job.validation_passed,
            validation_errors=job.validation_errors,
            output_image_path=job.output_image_path,
            thumbnail_path=job.thumbnail_path,
            credits_charged=job.credits_charged,
            processing_time_ms=job.processing_time_ms,
            error_message=job.error_message,
            created_at=job.created_at,
            started_at=job.started_at,
            completed_at=job.completed_at,
        )
        for job in jobs
    ]


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: UUID,
    user: CurrentUser,
    db: DbSession,
) -> JobResponse:
    """Get a specific job by ID."""
    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.user_id == user.id)
    )
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    return JobResponse(
        id=job.id,
        user_id=job.user_id,
        status=job.status,
        input_image_path=job.input_image_path,
        style_preset=job.style_preset,
        background_option=job.background_option,
        validation_passed=job.validation_passed,
        validation_errors=job.validation_errors,
        output_image_path=job.output_image_path,
        thumbnail_path=job.thumbnail_path,
        credits_charged=job.credits_charged,
        processing_time_ms=job.processing_time_ms,
        error_message=job.error_message,
        created_at=job.created_at,
        started_at=job.started_at,
        completed_at=job.completed_at,
    )


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_job(
    job_id: UUID,
    user: CurrentUser,
    db: DbSession,
) -> None:
    """
    Cancel a pending job and refund the credit.

    Only jobs with status 'pending' can be cancelled.
    """
    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.user_id == user.id)
    )
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    if job.status != JobStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel job with status '{job.status}'. Only pending jobs can be cancelled.",
        )

    # Refund credit
    credit_service = CreditService(db)
    await credit_service.refund_credits(
        user_id=user.id,
        amount=job.credits_charged,
        job_id=job.id,
    )

    # Update job status
    job.status = JobStatus.FAILED
    job.error_message = "Cancelled by user"
    job.completed_at = datetime.utcnow()
    db.add(job)
    await db.commit()
