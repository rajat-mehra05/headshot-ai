from fastapi import APIRouter

from app.schemas import BackgroundPresetResponse, StylePresetResponse

router = APIRouter(prefix="/presets", tags=["presets"])

# Static presets - can be moved to database if needed
STYLE_PRESETS = [
    StylePresetResponse(
        id="professional",
        name="Professional",
        description="Clean, corporate look suitable for LinkedIn and business profiles",
        preview_url="/presets/professional.jpg",
    ),
    StylePresetResponse(
        id="corporate",
        name="Corporate",
        description="Formal business headshot with polished appearance",
        preview_url="/presets/corporate.jpg",
    ),
    StylePresetResponse(
        id="creative",
        name="Creative",
        description="Slightly more artistic while maintaining professionalism",
        preview_url="/presets/creative.jpg",
    ),
    StylePresetResponse(
        id="casual",
        name="Casual",
        description="Relaxed professional look for modern companies",
        preview_url="/presets/casual.jpg",
    ),
]

BACKGROUND_PRESETS = [
    BackgroundPresetResponse(
        id="white",
        name="White",
        type="solid",
        value="#FFFFFF",
        preview_url="/presets/bg-white.jpg",
    ),
    BackgroundPresetResponse(
        id="light-gray",
        name="Light Gray",
        type="solid",
        value="#F5F5F5",
        preview_url="/presets/bg-light-gray.jpg",
    ),
    BackgroundPresetResponse(
        id="gray",
        name="Gray",
        type="solid",
        value="#6B7280",
        preview_url="/presets/bg-gray.jpg",
    ),
    BackgroundPresetResponse(
        id="blue",
        name="Blue",
        type="solid",
        value="#3B82F6",
        preview_url="/presets/bg-blue.jpg",
    ),
    BackgroundPresetResponse(
        id="gradient-blue",
        name="Blue Gradient",
        type="gradient",
        value="linear-gradient(180deg, #3B82F6 0%, #1D4ED8 100%)",
        preview_url="/presets/bg-gradient-blue.jpg",
    ),
    BackgroundPresetResponse(
        id="transparent",
        name="Transparent",
        type="transparent",
        value="transparent",
        preview_url="/presets/bg-transparent.png",
    ),
]


@router.get("/styles", response_model=list[StylePresetResponse])
async def list_style_presets() -> list[StylePresetResponse]:
    """List all available style presets."""
    return STYLE_PRESETS


@router.get("/backgrounds", response_model=list[BackgroundPresetResponse])
async def list_background_presets() -> list[BackgroundPresetResponse]:
    """List all available background options."""
    return BACKGROUND_PRESETS
