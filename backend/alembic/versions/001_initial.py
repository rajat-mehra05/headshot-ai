"""Initial migration

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users table
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("clerk_id", sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column("email", sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column("credits_balance", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("lifetime_credits_used", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_clerk_id", "users", ["clerk_id"], unique=True)

    # Credit packages table
    op.create_table(
        "credit_packages",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
        sa.Column("credits", sa.Integer(), nullable=False),
        sa.Column("price_cents", sa.Integer(), nullable=False),
        sa.Column("stripe_price_id", sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.PrimaryKeyConstraint("id"),
    )

    # Jobs table
    op.create_table(
        "jobs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("status", sqlmodel.sql.sqltypes.AutoString(length=50), nullable=False, server_default="pending"),
        sa.Column("input_image_path", sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column("style_preset", sqlmodel.sql.sqltypes.AutoString(length=100), nullable=True),
        sa.Column("background_option", sqlmodel.sql.sqltypes.AutoString(length=100), nullable=True),
        sa.Column("validation_passed", sa.Boolean(), nullable=True),
        sa.Column("validation_errors", sa.JSON(), nullable=True),
        sa.Column("face_landmarks", sa.JSON(), nullable=True),
        sa.Column("output_image_path", sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column("thumbnail_path", sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column("credits_charged", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("processing_time_ms", sa.Integer(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_jobs_user_id", "jobs", ["user_id"])
    op.create_index("ix_jobs_status", "jobs", ["status"])

    # Credit transactions table
    op.create_table(
        "credit_transactions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("type", sqlmodel.sql.sqltypes.AutoString(length=50), nullable=False),
        sa.Column("stripe_payment_id", sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
        sa.Column("job_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_credit_transactions_user_id", "credit_transactions", ["user_id"])

    # Insert default credit packages
    op.execute("""
        INSERT INTO credit_packages (id, name, credits, price_cents, is_active)
        VALUES
            ('00000000-0000-0000-0000-000000000001', 'Starter', 5, 999, true),
            ('00000000-0000-0000-0000-000000000002', 'Popular', 15, 2499, true),
            ('00000000-0000-0000-0000-000000000003', 'Pro', 50, 6999, true)
    """)


def downgrade() -> None:
    op.drop_index("ix_credit_transactions_user_id", table_name="credit_transactions")
    op.drop_table("credit_transactions")
    op.drop_index("ix_jobs_status", table_name="jobs")
    op.drop_index("ix_jobs_user_id", table_name="jobs")
    op.drop_table("jobs")
    op.drop_table("credit_packages")
    op.drop_index("ix_users_clerk_id", table_name="users")
    op.drop_table("users")
