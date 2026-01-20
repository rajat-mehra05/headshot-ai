from datetime import datetime, timedelta
from typing import Optional
from uuid import uuid4

from supabase import create_client, Client

from app.config import settings


class StorageService:
    def __init__(self):
        self.client: Client = create_client(
            settings.supabase_url,
            settings.supabase_service_key,
        )
        self.uploads_bucket = "uploads"
        self.outputs_bucket = "outputs"
        self.thumbnails_bucket = "thumbnails"

    def _ensure_bucket(self, bucket_name: str) -> None:
        """Ensure a bucket exists, create if not."""
        try:
            self.client.storage.get_bucket(bucket_name)
        except Exception:
            self.client.storage.create_bucket(
                bucket_name,
                options={
                    "public": False,
                    "file_size_limit": 10 * 1024 * 1024,  # 10MB
                },
            )

    def get_presigned_upload_url(
        self,
        user_id: str,
        filename: str,
        content_type: str,
        expires_in: int = 3600,
    ) -> tuple[str, str, datetime]:
        """
        Generate a presigned URL for uploading a file.
        Returns (upload_url, file_path, expires_at)
        """
        self._ensure_bucket(self.uploads_bucket)

        # Generate unique file path
        file_ext = filename.split(".")[-1] if "." in filename else "jpg"
        file_path = f"{user_id}/{uuid4()}.{file_ext}"

        # Create signed URL for upload
        result = self.client.storage.from_(self.uploads_bucket).create_signed_upload_url(
            file_path
        )

        expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

        return result["signedUrl"], file_path, expires_at

    def get_presigned_download_url(
        self,
        bucket: str,
        file_path: str,
        expires_in: int = 3600,
    ) -> tuple[str, datetime]:
        """
        Generate a presigned URL for downloading a file.
        Returns (download_url, expires_at)
        """
        result = self.client.storage.from_(bucket).create_signed_url(
            file_path,
            expires_in,
        )

        expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

        return result["signedUrl"], expires_at

    def download_file(self, bucket: str, file_path: str) -> bytes:
        """Download a file from storage."""
        return self.client.storage.from_(bucket).download(file_path)

    def upload_file(
        self,
        bucket: str,
        file_path: str,
        file_data: bytes,
        content_type: str = "image/jpeg",
    ) -> str:
        """Upload a file to storage. Returns the file path."""
        self._ensure_bucket(bucket)

        self.client.storage.from_(bucket).upload(
            file_path,
            file_data,
            {"content-type": content_type},
        )

        return file_path

    def delete_file(self, bucket: str, file_path: str) -> None:
        """Delete a file from storage."""
        self.client.storage.from_(bucket).remove([file_path])

    def move_to_outputs(self, upload_path: str, user_id: str) -> str:
        """Move a file from uploads to outputs bucket."""
        file_data = self.download_file(self.uploads_bucket, upload_path)

        file_ext = upload_path.split(".")[-1] if "." in upload_path else "jpg"
        output_path = f"{user_id}/{uuid4()}.{file_ext}"

        return self.upload_file(self.outputs_bucket, output_path, file_data)


# Singleton instance
_storage: Optional[StorageService] = None


def get_storage() -> StorageService:
    global _storage
    if _storage is None:
        _storage = StorageService()
    return _storage
