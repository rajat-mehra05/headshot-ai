from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel


class JobStatus(str, Enum):
    PENDING = "pending"
    VALIDATING = "validating"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class CreditTransactionType(str, Enum):
    PURCHASE = "purchase"
    USAGE = "usage"
    REFUND = "refund"
    BONUS = "bonus"


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    clerk_id: str = Field(unique=True, index=True)
    email: str
    credits_balance: int = Field(default=0)
    lifetime_credits_used: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    jobs: list["Job"] = Relationship(back_populates="user")
    credit_transactions: list["CreditTransaction"] = Relationship(back_populates="user")


class CreditTransaction(SQLModel, table=True):
    __tablename__ = "credit_transactions"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    amount: int  # positive = add, negative = deduct
    type: CreditTransactionType
    stripe_payment_id: Optional[str] = None
    job_id: Optional[UUID] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: Optional[User] = Relationship(back_populates="credit_transactions")


class Job(SQLModel, table=True):
    __tablename__ = "jobs"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    status: JobStatus = Field(default=JobStatus.PENDING, index=True)

    # Input
    input_image_path: Optional[str] = None
    style_preset: Optional[str] = None
    background_option: Optional[str] = None

    # Validation
    validation_passed: Optional[bool] = None
    validation_errors: Optional[list[str]] = Field(default=None, sa_type_kwargs={"astext_type": None})
    face_landmarks: Optional[dict] = Field(default=None, sa_type_kwargs={"astext_type": None})

    # Output
    output_image_path: Optional[str] = None
    thumbnail_path: Optional[str] = None

    # Metadata
    credits_charged: int = Field(default=1)
    processing_time_ms: Optional[int] = None
    error_message: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    # Relationships
    user: Optional[User] = Relationship(back_populates="jobs")


class CreditPackage(SQLModel, table=True):
    __tablename__ = "credit_packages"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str
    credits: int
    price_cents: int
    stripe_price_id: Optional[str] = None
    is_active: bool = Field(default=True)
