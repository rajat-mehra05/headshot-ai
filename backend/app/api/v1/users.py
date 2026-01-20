from fastapi import APIRouter

from app.deps import CurrentUser
from app.schemas import UserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_current_user(user: CurrentUser) -> UserResponse:
    """Get the current authenticated user's profile."""
    return UserResponse(
        id=user.id,
        clerk_id=user.clerk_id,
        email=user.email,
        credits_balance=user.credits_balance,
        lifetime_credits_used=user.lifetime_credits_used,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )
