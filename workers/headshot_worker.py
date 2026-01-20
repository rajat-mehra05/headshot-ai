"""
Modal GPU Worker for Headshot Generation

This worker handles the GPU-intensive tasks:
1. SDXL + IP-Adapter for face-preserving generation
2. GFPGAN for face restoration
3. Real-ESRGAN for upscaling
4. Background removal with rembg

Deploy with: modal deploy headshot_worker.py
"""

import io
from typing import Optional

import modal

# Define the Modal image with all dependencies
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("libgl1-mesa-glx", "libglib2.0-0", "libsm6", "libxext6", "libxrender-dev")
    .pip_install(
        "torch==2.5.1",
        "torchvision==0.20.1",
        "diffusers==0.31.0",
        "transformers==4.47.1",
        "accelerate==1.2.1",
        "safetensors==0.4.5",
        "pillow==11.1.0",
        "opencv-python-headless==4.10.0.84",
        "numpy==2.2.1",
        "gfpgan==1.3.8",
        "realesrgan==0.3.0",
        "rembg==2.0.62",
    )
)

app = modal.App("headshot-generator", image=image)

# Model volume for caching
model_volume = modal.Volume.from_name("headshot-models", create_if_missing=True)
MODEL_DIR = "/models"


@app.cls(
    gpu="A10G",
    timeout=600,
    container_idle_timeout=300,
    volumes={MODEL_DIR: model_volume},
)
class HeadshotGenerator:
    """GPU-accelerated headshot generation class."""

    @modal.enter()
    def setup(self):
        """Load models on container startup."""
        import torch
        from diffusers import StableDiffusionXLPipeline, AutoencoderKL
        from gfpgan import GFPGANer
        from realesrgan import RealESRGANer
        from basicsr.archs.rrdbnet_arch import RRDBNet

        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.dtype = torch.float16 if self.device == "cuda" else torch.float32

        # Load SDXL
        print("Loading SDXL...")
        vae = AutoencoderKL.from_pretrained(
            "madebyollin/sdxl-vae-fp16-fix",
            torch_dtype=self.dtype,
            cache_dir=MODEL_DIR,
        )
        self.sdxl_pipe = StableDiffusionXLPipeline.from_pretrained(
            "stabilityai/stable-diffusion-xl-base-1.0",
            vae=vae,
            torch_dtype=self.dtype,
            cache_dir=MODEL_DIR,
        ).to(self.device)

        # Load GFPGAN
        print("Loading GFPGAN...")
        self.gfpgan = GFPGANer(
            model_path=f"{MODEL_DIR}/GFPGANv1.4.pth",
            upscale=2,
            arch="clean",
            channel_multiplier=2,
            device=self.device,
        )

        # Load Real-ESRGAN
        print("Loading Real-ESRGAN...")
        model = RRDBNet(
            num_in_ch=3,
            num_out_ch=3,
            num_feat=64,
            num_block=23,
            num_grow_ch=32,
            scale=4,
        )
        self.realesrgan = RealESRGANer(
            scale=4,
            model_path=f"{MODEL_DIR}/RealESRGAN_x4plus.pth",
            model=model,
            device=self.device,
        )

        print("Models loaded successfully!")

    @modal.method()
    def generate_headshot(
        self,
        input_image_bytes: bytes,
        style: str = "professional",
        background: Optional[str] = None,
        seed: int = 42,
    ) -> bytes:
        """
        Generate a professional headshot from an input image.

        Args:
            input_image_bytes: Input image as bytes
            style: Style preset (professional, corporate, creative, casual)
            background: Background option (white, gray, blue, etc.)
            seed: Random seed for reproducibility

        Returns:
            Generated headshot as JPEG bytes
        """
        import cv2
        import numpy as np
        from PIL import Image
        import torch

        # Load input image
        nparr = np.frombuffer(input_image_bytes, np.uint8)
        input_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        input_image = cv2.cvtColor(input_image, cv2.COLOR_BGR2RGB)

        # Style-specific prompts
        style_prompts = {
            "professional": "professional headshot, business attire, neutral expression, studio lighting, high quality, sharp focus",
            "corporate": "corporate executive headshot, formal suit, confident expression, studio lighting, high quality",
            "creative": "modern professional headshot, creative industry, natural lighting, high quality, artistic",
            "casual": "casual professional headshot, smart casual attire, friendly expression, natural lighting",
        }

        prompt = style_prompts.get(style, style_prompts["professional"])
        negative_prompt = "blurry, low quality, distorted, ugly, deformed, bad anatomy, bad proportions"

        # Generate with SDXL
        # Note: For proper face preservation, we'd use IP-Adapter here
        # This is a simplified version
        generator = torch.Generator(device=self.device).manual_seed(seed)

        # Convert to PIL for diffusers
        pil_image = Image.fromarray(input_image)

        # For MVP, we'll use img2img approach
        # In production, integrate IP-Adapter for better face preservation
        result = self.sdxl_pipe(
            prompt=prompt,
            negative_prompt=negative_prompt,
            image=pil_image,
            strength=0.3,  # Low strength to preserve face
            guidance_scale=7.5,
            num_inference_steps=30,
            generator=generator,
        ).images[0]

        # Convert back to numpy for enhancement
        result_np = np.array(result)
        result_bgr = cv2.cvtColor(result_np, cv2.COLOR_RGB2BGR)

        # Enhance with GFPGAN
        _, _, enhanced = self.gfpgan.enhance(
            result_bgr,
            has_aligned=False,
            only_center_face=False,
            paste_back=True,
        )

        # Upscale with Real-ESRGAN if needed
        if enhanced.shape[0] < 1024 or enhanced.shape[1] < 1024:
            enhanced, _ = self.realesrgan.enhance(enhanced, outscale=2)

        # Resize to final output (1024x1024)
        enhanced = cv2.resize(enhanced, (1024, 1024), interpolation=cv2.INTER_LANCZOS4)

        # Handle background replacement
        if background and background != "original":
            enhanced = self._replace_background(enhanced, background)

        # Encode as JPEG
        _, buffer = cv2.imencode(".jpg", enhanced, [cv2.IMWRITE_JPEG_QUALITY, 95])
        return buffer.tobytes()

    def _replace_background(self, image: "np.ndarray", background: str) -> "np.ndarray":
        """Replace the background of an image."""
        import cv2
        import numpy as np
        from rembg import remove
        from PIL import Image

        # Convert to PIL for rembg
        pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))

        # Remove background
        result = remove(pil_image)

        # Create new background
        h, w = image.shape[:2]

        bg_colors = {
            "white": (255, 255, 255),
            "gray": (107, 114, 128),
            "light-gray": (245, 245, 245),
            "blue": (59, 130, 246),
        }

        bg_color = bg_colors.get(background, (255, 255, 255))
        new_bg = np.full((h, w, 3), bg_color, dtype=np.uint8)

        # Composite
        result_np = np.array(result)
        if result_np.shape[2] == 4:  # Has alpha channel
            alpha = result_np[:, :, 3:4] / 255.0
            rgb = result_np[:, :, :3]
            rgb_bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
            composited = (rgb_bgr * alpha + new_bg * (1 - alpha)).astype(np.uint8)
            return composited

        return image


@app.function()
def generate(
    input_image_bytes: bytes,
    style: str = "professional",
    background: Optional[str] = None,
    seed: int = 42,
) -> bytes:
    """Entry point for headshot generation."""
    generator = HeadshotGenerator()
    return generator.generate_headshot.remote(
        input_image_bytes,
        style=style,
        background=background,
        seed=seed,
    )


# For local testing
if __name__ == "__main__":
    with modal.enable_local_development():
        # Test with a sample image
        with open("test_input.jpg", "rb") as f:
            input_bytes = f.read()

        result = generate.remote(input_bytes, style="professional", background="white")

        with open("test_output.jpg", "wb") as f:
            f.write(result)

        print("Generated headshot saved to test_output.jpg")
