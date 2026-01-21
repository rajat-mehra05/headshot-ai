from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models import CreditTransaction, CreditTransactionType, User


class CreditService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_balance(self, user_id: UUID) -> int:
        """Get user's current credit balance."""
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        return user.credits_balance if user else 0

    async def add_credits(
        self,
        user_id: UUID,
        amount: int,
        transaction_type: CreditTransactionType,
        stripe_payment_id: Optional[str] = None,
    ) -> CreditTransaction:
        """Add credits to a user's account."""
        # Update user balance
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one()

        user.credits_balance += amount
        self.db.add(user)

        # Create transaction record
        transaction = CreditTransaction(
            user_id=user_id,
            amount=amount,
            type=transaction_type,
            stripe_payment_id=stripe_payment_id,
        )
        self.db.add(transaction)

        await self.db.commit()
        await self.db.refresh(transaction)

        return transaction

    async def deduct_credits(
        self,
        user_id: UUID,
        amount: int,
        job_id: UUID,
    ) -> CreditTransaction:
        """
        Deduct credits from a user's account for a job.
        Raises ValueError if insufficient credits.
        """
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one()

        if user.credits_balance < amount:
            raise ValueError(
                f"Insufficient credits. Required: {amount}, Available: {user.credits_balance}"
            )

        # Update user balance
        user.credits_balance -= amount
        user.lifetime_credits_used += amount
        self.db.add(user)

        # Create transaction record
        transaction = CreditTransaction(
            user_id=user_id,
            amount=-amount,  # Negative for deduction
            type=CreditTransactionType.USAGE,
            job_id=job_id,
        )
        self.db.add(transaction)

        await self.db.commit()
        await self.db.refresh(transaction)

        return transaction

    async def refund_credits(
        self,
        user_id: UUID,
        amount: int,
        job_id: UUID,
    ) -> CreditTransaction:
        """Refund credits for a failed job."""
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one()

        # Update user balance
        user.credits_balance += amount
        user.lifetime_credits_used -= amount
        self.db.add(user)

        # Create transaction record
        transaction = CreditTransaction(
            user_id=user_id,
            amount=amount,  # Positive for refund
            type=CreditTransactionType.REFUND,
            job_id=job_id,
        )
        self.db.add(transaction)

        await self.db.commit()
        await self.db.refresh(transaction)

        return transaction

    async def get_transactions(
        self,
        user_id: UUID,
        limit: int = 50,
    ) -> list[CreditTransaction]:
        """Get user's credit transaction history."""
        result = await self.db.execute(
            select(CreditTransaction)
            .where(CreditTransaction.user_id == user_id)
            .order_by(CreditTransaction.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())