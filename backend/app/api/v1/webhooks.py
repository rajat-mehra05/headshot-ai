import stripe
from fastapi import APIRouter, Header, HTTPException, Request, status
from sqlmodel import select

from app.config import settings
from app.deps import DbSession
from app.models import CreditTransactionType, User
from app.services.credits import CreditService

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

stripe.api_key = settings.stripe_secret_key


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    db: DbSession,
    stripe_signature: str = Header(None),
) -> dict[str, str]:
    """
    Handle Stripe webhooks for payment events.

    Events handled:
    - checkout.session.completed: Add credits after successful payment
    """
    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(
            payload,
            stripe_signature,
            settings.stripe_webhook_secret,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payload",
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid signature",
        )

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        metadata = session.get("metadata", {})

        user_id = metadata.get("user_id")
        credits = int(metadata.get("credits", 0))
        payment_intent_id = session.get("payment_intent")

        if not user_id or not credits:
            return {"status": "missing_metadata"}

        # Find user
        from uuid import UUID
        result = await db.execute(
            select(User).where(User.id == UUID(user_id))
        )
        user = result.scalar_one_or_none()

        if not user:
            return {"status": "user_not_found"}

        # Add credits
        credit_service = CreditService(db)
        await credit_service.add_credits(
            user_id=user.id,
            amount=credits,
            transaction_type=CreditTransactionType.PURCHASE,
            stripe_payment_id=payment_intent_id,
        )

        return {"status": "credits_added", "credits": credits}

    return {"status": "ignored"}
