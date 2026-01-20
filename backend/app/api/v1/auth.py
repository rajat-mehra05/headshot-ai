import hashlib
import hmac
from typing import Any

from fastapi import APIRouter, Header, HTTPException, status
from sqlmodel import select

from app.config import settings
from app.deps import DbSession
from app.models import CreditTransaction, CreditTransactionType, User
from app.schemas import UserCreate, UserResponse

# Number of free credits given to new users
FREE_SIGNUP_CREDITS = 1

router = APIRouter(prefix="/auth", tags=["auth"])


def verify_clerk_webhook(payload: bytes, signature: str, secret: str) -> bool:
    """Verify Clerk webhook signature."""
    # Clerk uses Svix for webhooks
    # For simplicity, we'll do basic HMAC verification
    # In production, use the svix package for full verification
    expected = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(f"v1,{expected}", signature)


@router.post("/webhook")
async def clerk_webhook(
    db: DbSession,
    payload: dict[str, Any],
    svix_signature: str = Header(None, alias="svix-signature"),
) -> dict[str, str]:
    """
    Handle Clerk webhooks for user sync.

    Events handled:
    - user.created: Create new user in our database
    - user.updated: Update user email
    - user.deleted: Delete user and their data
    """
    # In production, verify the webhook signature
    # if not verify_clerk_webhook(payload_bytes, svix_signature, settings.clerk_webhook_secret):
    #     raise HTTPException(status_code=401, detail="Invalid signature")

    event_type = payload.get("type")
    data = payload.get("data", {})

    if event_type == "user.created":
        clerk_id = data.get("id")
        email = data.get("email_addresses", [{}])[0].get("email_address", "")

        if not clerk_id or not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required user data",
            )

        # Check if user already exists
        result = await db.execute(select(User).where(User.clerk_id == clerk_id))
        existing = result.scalar_one_or_none()

        if not existing:
            # Create user with 1 free credit
            user = User(clerk_id=clerk_id, email=email, credits_balance=FREE_SIGNUP_CREDITS)
            db.add(user)
            await db.commit()
            await db.refresh(user)

            # Record the bonus credit transaction
            transaction = CreditTransaction(
                user_id=user.id,
                amount=FREE_SIGNUP_CREDITS,
                type=CreditTransactionType.BONUS,
            )
            db.add(transaction)
            await db.commit()

        return {"status": "user_created"}

    elif event_type == "user.updated":
        clerk_id = data.get("id")
        email = data.get("email_addresses", [{}])[0].get("email_address", "")

        result = await db.execute(select(User).where(User.clerk_id == clerk_id))
        user = result.scalar_one_or_none()

        if user and email:
            user.email = email
            db.add(user)
            await db.commit()

        return {"status": "user_updated"}

    elif event_type == "user.deleted":
        clerk_id = data.get("id")

        result = await db.execute(select(User).where(User.clerk_id == clerk_id))
        user = result.scalar_one_or_none()

        if user:
            await db.delete(user)
            await db.commit()

        return {"status": "user_deleted"}

    return {"status": "ignored"}
