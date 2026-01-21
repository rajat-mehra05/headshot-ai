import time
from datetime import datetime
from uuid import UUID

import structlog
from celery import Task
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlmodel import select

from app.config import settings
from app.models import Job, JobStatus
from app.services.credits import CreditService
from app.tasks import celery_app

logger = structlog.get_logger()

# Sync database engine for Celery tasks
sync_engine = create_engine(
    settings.database_url.replace("+asyncpg", ""),
    pool_pre_ping=True,
)


class HeadshotGenerationTask(Task):
    """Base task class with error handling."""

    autoretry_for = (Exception,)
    retry_kwargs = {"max_retries": 2}
    retry_backoff = True
    retry_backoff_max = 60


@celery_app.task(
    bind=True,
    base=HeadshotGenerationTask,
    name="tasks.process_headshot",
)
def process_headshot_job(self, job_id: str) -> dict:
    """
    Process a headshot generation job.

    This task:
    1. Downloads the input image
    2. Runs validation
    3. Sends to GPU worker (Modal) for generation
    4. Uploads the result
    5. Updates the job status

    If the task fails after all retries, credits are refunded.
    """
    start_time = time.time()
    log = logger.bind(job_id=job_id, task_id=self.request.id)

    with Session(sync_engine) as db:
        # Get the job
        job = db.exec(select(Job).where(Job.id == UUID(job_id))).first()

        if not job:
            log.error("Job not found")
            return {"status": "error", "message": "Job not found"}

        try:
            # Update status to processing
            job.status = JobStatus.PROCESSING
            job.started_at = datetime.utcnow()
            db.add(job)
            db.commit()

            log.info("Starting headshot generation", style=job.style_preset)

            # TODO: Implement actual GPU processing via Modal
            # For now, simulate processing
            #
            # from app.services.storage import get_storage
            # storage = get_storage()
            #
            # 1. Download input image
            # input_bytes = storage.download_file("uploads", job.input_image_path)
            #
            # 2. Call Modal GPU worker
            # result_bytes = modal_generate_headshot(
            #     input_bytes,
            #     style=job.style_preset,
            #     background=job.background_option,
            # )
            #
            # 3. Upload result
            # output_path = storage.upload_file(
            #     "outputs",
            #     f"{job.user_id}/{job.id}.jpg",
            #     result_bytes,
            # )
            #
            # 4. Generate thumbnail
            # thumbnail_bytes = create_thumbnail(result_bytes)
            # thumbnail_path = storage.upload_file(
            #     "thumbnails",
            #     f"{job.user_id}/{job.id}_thumb.jpg",
            #     thumbnail_bytes,
            # )

            # Simulate processing time
            time.sleep(5)

            # Mark as completed (placeholder - replace with actual paths)
            processing_time_ms = int((time.time() - start_time) * 1000)

            job.status = JobStatus.COMPLETED
            job.output_image_path = f"placeholder/{job.id}.jpg"
            job.thumbnail_path = f"placeholder/{job.id}_thumb.jpg"
            job.processing_time_ms = processing_time_ms
            job.completed_at = datetime.utcnow()
            db.add(job)
            db.commit()

            log.info(
                "Headshot generation completed",
                processing_time_ms=processing_time_ms,
            )

            return {
                "status": "completed",
                "job_id": job_id,
                "processing_time_ms": processing_time_ms,
            }

        except Exception as e:
            log.error("Headshot generation failed", error=str(e))

            # Check if we've exhausted retries
            if self.request.retries >= self.max_retries:
                # Final failure - refund credits
                log.info("Max retries exhausted, refunding credits")

                credit_service = CreditService(db)
                credit_service.refund_credits(
                    user_id=job.user_id,
                    amount=job.credits_charged,
                    job_id=job.id,
                )

                job.status = JobStatus.FAILED
                job.error_message = str(e)
                job.completed_at = datetime.utcnow()
                db.add(job)
                db.commit()

                return {
                    "status": "failed",
                    "job_id": job_id,
                    "error": str(e),
                    "credits_refunded": True,
                }

            # Re-raise to trigger retry
            raise