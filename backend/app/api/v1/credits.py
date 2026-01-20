from uuid import UUID

import stripe
from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from app.config import settings
from app.deps import CurrentUser, DbSession
from app.models import CreditPackage
from app.schemas import CheckoutRequest, CheckoutResponse, CreditPackageResponse

router = APIRouter(prefix="/credits", tags=["credits"])

# Initialize Stripe
stripe.api_key = settings.stripe_secret_key


@router.get("/packages", response_model=list[CreditPackageResponse])
async def list_packages(db: DbSession) -> list[CreditPackageResponse]:
    """List all available credit packages."""
    result = await db.execute(
        select(CreditPackage).where(CreditPackage.is_active == True)
    )
    packages = result.scalars().all()

    # If no packages in DB, return defaults
    if not packages:
        return [
            CreditPackageResponse(
                id=UUID("00000000-0000-0000-0000-000000000001"),
                name="Starter",
                credits=5,
                price_cents=999,
                stripe_price_id=None,
                is_active=True,
            ),
            CreditPackageResponse(
                id=UUID("00000000-0000-0000-0000-000000000002"),
                name="Popular",
                credits=15,
                price_cents=2499,
                stripe_price_id=None,
                is_active=True,
            ),
            CreditPackageResponse(
                id=UUID("00000000-0000-0000-0000-000000000003"),
                name="Pro",
                credits=50,
                price_cents=6999,
                stripe_price_id=None,
                is_active=True,
            ),
        ]

    return [
        CreditPackageResponse(
            id=pkg.id,
            name=pkg.name,
            credits=pkg.credits,
            price_cents=pkg.price_cents,
            stripe_price_id=pkg.stripe_price_id,
            is_active=pkg.is_active,
        )
        for pkg in packages
    ]


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout_session(
    request: CheckoutRequest,
    user: CurrentUser,
    db: DbSession,
) -> CheckoutResponse:
    """
    Create a Stripe Checkout session for purchasing credits.

    Returns a checkout URL that the client should redirect to.
    """
    # Get the package
    result = await db.execute(
        select(CreditPackage).where(
            CreditPackage.id == request.package_id,
            CreditPackage.is_active == True,
        )
    )
    package = result.scalar_one_or_none()

    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credit package not found",
        )

    if not package.stripe_price_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This package is not available for purchase yet",
        )

    try:
        # Create Stripe Checkout session
        session = stripe.checkout.Session.create(
            mode="payment",
            payment_method_types=["card"],
            line_items=[
                {
                    "price": package.stripe_price_id,
                    "quantity": 1,
                }
            ],
            metadata={
                "user_id": str(user.id),
                "package_id": str(package.id),
                "credits": str(package.credits),
            },
            success_url=f"{settings.cors_origins[0]}/dashboard?purchase=success",
            cancel_url=f"{settings.cors_origins[0]}/pricing?purchase=cancelled",
            customer_email=user.email,
        )

        return CheckoutResponse(
            checkout_url=session.url,
            session_id=session.id,
        )

    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Stripe error: {str(e)}",
        )
