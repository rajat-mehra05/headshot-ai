from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr

from app.models import CreditTransactionType, JobStatus


# User schemas
class UserResponse(BaseModel):
    id: UUID
    clerk_id: str
    email: str
    credits_balance: int
    lifetime_credits_used: int
    created_at: datetime
    updated_at: datetime


class UserCreate(BaseModel):
    clerk_id: str
    email: EmailStr


# Job schemas
class JobCreate(BaseModel):
    input_image_path: str
    style_preset: Optional[str] = None
    background_option: Optional[str] = None


class JobResponse(BaseModel):
    id: UUID
    user_id: UUID
    status: JobStatus
    input_image_path: Optional[str]
    style_preset: Optional[str]
    background_option: Optional[str]
    validation_passed: Optional[bool]
    validation_errors: Optional[list[str]]
    output_image_path: Optional[str]
    thumbnail_path: Optional[str]
    credits_charged: int
    processing_time_ms: Optional[int]
    error_message: Optional[str]
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]


# Validation schemas
class ValidationRequest(BaseModel):
    image_path: str


class ValidationResponse(BaseModel):
    passed: bool
    errors: list[str]
    suggestions: list[str]
    face_landmarks: Optional[dict] = None
    quality_score: Optional[int] = None


# Upload schemas
class PresignedUrlRequest(BaseModel):
    filename: str
    content_type: str


class PresignedUrlResponse(BaseModel):
    upload_url: str
    file_path: str
    expires_at: datetime


# Credits schemas
class CreditPackageResponse(BaseModel):
    id: UUID
    name: str
    credits: int
    price_cents: int
    stripe_price_id: Optional[str]
    is_active: bool


class CheckoutRequest(BaseModel):
    package_id: UUID


class CheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str


# Credit transaction schemas
class CreditTransactionResponse(BaseModel):
    id: UUID
    user_id: UUID
    amount: int
    type: CreditTransactionType
    stripe_payment_id: Optional[str]
    job_id: Optional[UUID]
    created_at: datetime


# Preset schemas
class StylePresetResponse(BaseModel):
    id: str
    name: str
    description: str
    preview_url: str


class BackgroundPresetResponse(BaseModel):
    id: str
    name: str
    type: str  # solid, gradient, transparent
    value: str
    preview_url: str


# Image schemas
class DownloadUrlResponse(BaseModel):
    url: str
    expires_at: datetime
