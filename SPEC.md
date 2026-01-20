# AI Headshot SaaS - Technical Specification

## Overview

A production-grade AI-powered headshot web application focused on generating **high-quality, platform-compliant headshots** for professional use cases such as hiring platforms, portfolios, and company profiles.

### Product Principles
- **Validation before generation** - Protect user credits with upfront checks
- **Determinism over randomness** - Predictable, repeatable results
- **Guidance over surprise** - Clear feedback at every step
- **Professional tone** - This is a business tool, not a creative playground
- **Sub-30-second generation** - Fast enough to feel responsive

### Business Model
- Credits-based SaaS (B2C)
- Individual users only (no team features for MVP)
- Target: < 1K MAU initially

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool |
| Tailwind CSS | Styling |
| shadcn/ui | Component library (Radix + Tailwind) |
| TanStack Query | Server state management |
| Zustand | Client state management |
| React Hook Form + Zod | Forms & validation |
| Framer Motion | Animations |
| @clerk/clerk-react | Authentication |

#### Frontend Testing
- Vitest
- React Testing Library
- MSW (Mock Service Worker)

---

### Backend API
| Technology | Purpose |
|------------|---------|
| Python 3.11+ | Runtime |
| FastAPI | Web framework |
| Uvicorn | ASGI server |
| SQLModel | ORM (Pydantic v2 native) |
| Celery | Background job queue |
| Redis | Cache & message broker |

---

### AI / Computer Vision
| Technology | Purpose |
|------------|---------|
| MediaPipe | Face detection & landmarks |
| OpenCV | Image processing |
| SDXL + IP-Adapter | Face-preserving generation |
| GFPGAN | Face restoration |
| Real-ESRGAN | Image upscaling |
| rembg (U2Net) | Background removal |

---

### Infrastructure
| Service | Purpose |
|---------|---------|
| Clerk | Authentication |
| Supabase PostgreSQL | Database |
| Supabase Storage | S3-compatible object storage |
| Modal | Serverless GPU (inference) |
| Vercel | Frontend hosting |
| Railway / AWS ECS | Backend hosting |
| Stripe | Payments |
| Sentry | Error monitoring |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Vite + React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  Upload  │  │  Queue   │  │ Gallery  │  │  Credits/Billing │ │
│  │  + Valid │  │  Status  │  │  History │  │     (Stripe)     │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
└───────┼─────────────┼─────────────┼─────────────────┼───────────┘
        │             │             │                 │
        ▼             ▼             ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (FastAPI)                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Clerk JWT Auth  │  Rate Limiting  │  Request Validation │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐   │
│  │ /upload    │  │ /jobs      │  │ /images    │  │ /credits │   │
│  │ /validate  │  │ /jobs/{id} │  │ /download  │  │ /webhook │   │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └────┬─────┘   │
└────────┼───────────────┼───────────────┼──────────────┼─────────┘
         │               │               │              │
         ▼               ▼               ▼              ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Supabase  │  │    Redis    │  │  Supabase   │  │   Stripe    │
│  PostgreSQL │  │  + Celery   │  │   Storage   │  │   Webhooks  │
└─────────────┘  └──────┬──────┘  └─────────────┘  └─────────────┘
                        │
                        ▼
         ┌──────────────────────────────┐
         │      GPU WORKER (Modal)       │
         │  ┌─────────┐  ┌───────────┐  │
         │  │  SDXL + │  │  GFPGAN + │  │
         │  │IP-Adapter│  │Real-ESRGAN│  │
         │  └─────────┘  └───────────┘  │
         └──────────────────────────────┘
```

---

## Database Schema

```sql
-- Users (synced from Clerk via webhook)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    credits_balance INTEGER DEFAULT 0,
    lifetime_credits_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit Transactions (audit trail)
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    stripe_payment_id VARCHAR(255),
    job_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generation Jobs
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',

    -- Input
    input_image_path VARCHAR(500),
    style_preset VARCHAR(100),
    background_option VARCHAR(100),

    -- Validation
    validation_passed BOOLEAN,
    validation_errors JSONB,
    face_landmarks JSONB,

    -- Output
    output_image_path VARCHAR(500),
    thumbnail_path VARCHAR(500),

    -- Metadata
    credits_charged INTEGER DEFAULT 1,
    processing_time_ms INTEGER,
    error_message TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Credit Packages
CREATE TABLE credit_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    credits INTEGER NOT NULL,
    price_cents INTEGER NOT NULL,
    stripe_price_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true
);

-- Indexes
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
```

---

## API Endpoints

### Authentication
```
POST   /api/v1/auth/webhook          # Clerk user sync webhook
GET    /api/v1/users/me              # Get current user + credits
```

### Upload & Validation
```
POST   /api/v1/upload/presigned      # Get presigned URL for upload
POST   /api/v1/validate              # Validate image (free, no credits)
```

### Jobs
```
POST   /api/v1/jobs                  # Create generation job (deducts 1 credit)
GET    /api/v1/jobs                  # List user's jobs
GET    /api/v1/jobs/{id}             # Get job status + result
DELETE /api/v1/jobs/{id}             # Cancel pending job (refund credit)
```

### Images
```
GET    /api/v1/images/{id}/download  # Get signed download URL
DELETE /api/v1/images/{id}           # Delete image from storage
```

### Credits & Payments
```
GET    /api/v1/credits/packages      # List available packages
POST   /api/v1/credits/checkout      # Create Stripe checkout session
POST   /api/v1/webhooks/stripe       # Stripe payment webhook
```

### Presets
```
GET    /api/v1/presets/styles        # List style presets
GET    /api/v1/presets/backgrounds   # List background options
```

---

## AI Pipeline Flow

### 1. Upload
- Client uploads directly to Supabase Storage via presigned URL
- Max file size: 10MB
- Accepted formats: JPEG, PNG

### 2. Validation (No GPU required)
```
MediaPipe Face Detection
├── Reject: No face detected
├── Reject: Multiple faces detected
├── Reject: Face too small (< 15% of image)
└── Extract: Face landmarks for alignment

Image Quality Checks
├── Reject: Resolution < 512px
├── Reject: Heavy blur detected
├── Reject: Extreme lighting
└── Return: Quality score + suggestions
```

### 3. Job Creation
- Atomic credit deduction (prevents race conditions)
- Create job record with status: `pending`
- Enqueue Celery task

### 4. GPU Processing (Modal)
```
1. Download input from Supabase Storage
2. Face extraction + alignment using landmarks
3. SDXL + IP-Adapter generation
   └── Fixed seed + professional prompt template
4. GFPGAN face restoration
5. Real-ESRGAN upscale to 1024x1024
6. Background processing (if requested)
   └── rembg removal → solid/gradient replacement
7. EXIF metadata stripping
8. Upload result to Supabase Storage
```

### 5. Completion
- Update job status → `completed`
- Generate thumbnail
- Client polls for status or receives WebSocket notification

---

## Storage Strategy

### Supabase Storage Buckets
| Bucket | Purpose | Lifecycle |
|--------|---------|-----------|
| `uploads` | Raw user uploads | Delete after 24h |
| `outputs` | Generated headshots | Keep 30 days |
| `thumbnails` | Preview images | Keep 30 days |

### Security
- All URLs are signed (expiry: 1 hour for downloads)
- EXIF metadata stripped from all outputs
- Content-Type validation on upload

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/validate` | 20 | 1 minute |
| `/jobs` (POST) | 10 | 1 minute |
| `/upload/presigned` | 30 | 1 minute |
| Global per user | 100 | 1 minute |

---

## Error Handling

### Job Failures
- Automatic retry: 2 attempts with exponential backoff
- On final failure: Refund credit, notify user
- Store error details for debugging

### Validation Failures
- No credit charge
- Return actionable feedback (what to fix)
- Log for analytics

---

## Security Considerations

- Clerk JWT verification on all authenticated endpoints
- Input sanitization (file type, size, dimensions)
- SQL injection prevention via SQLModel parameterization
- Rate limiting per user
- Webhook signature verification (Clerk, Stripe)
- No PII in logs

---

## Observability

- **Structured logging**: JSON format, correlation IDs
- **Metrics**: Job duration, success rate, queue depth
- **Error tracking**: Sentry with user context
- **Credit analytics**: Usage patterns, conversion rates

---

## Project Structure

```
headshot-app/
├── SPEC.md
├── README.md
├── docker-compose.yml
├── .env.example
├── .gitignore
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── routes/
│       ├── components/
│       ├── hooks/
│       ├── stores/
│       ├── lib/
│       └── types/
│
├── backend/
│   ├── pyproject.toml
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   └── app/
│       ├── main.py
│       ├── config.py
│       ├── deps.py
│       ├── models/
│       ├── schemas/
│       ├── api/v1/
│       ├── services/
│       ├── tasks/
│       └── utils/
│
└── workers/
    ├── requirements.txt
    └── headshot_worker.py
```

---

## Cost Estimates (MVP Scale: < 1K MAU)

| Service | Free Tier | Est. Cost |
|---------|-----------|-----------|
| Vercel | 100GB bandwidth | $0 |
| Clerk | 10K MAU | $0 |
| Supabase | 500MB DB, 1GB storage | $0-25/mo |
| Modal | $30 free credits | $50-100/mo |
| Stripe | 2.9% + 30¢/txn | Variable |
| Sentry | 5K errors/mo | $0 |

**Total: ~$50-150/month**
