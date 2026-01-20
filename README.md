# Headshot AI

Professional AI-powered headshot generation SaaS application.

## Tech Stack

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- TanStack Query + Zustand
- Clerk (Authentication)

### Backend
- Python 3.11+ + FastAPI
- SQLModel + PostgreSQL (Supabase)
- Celery + Redis
- Supabase Storage

### AI/GPU
- Modal (Serverless GPU)
- SDXL + IP-Adapter
- GFPGAN + Real-ESRGAN
- rembg (Background removal)

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- Clerk account
- Supabase account
- Stripe account (for payments)

### Environment Setup

1. Copy environment template:
```bash
cp .env.example .env
```

2. Fill in the required values in `.env`

### Local Development

1. Start infrastructure services:
```bash
docker compose up -d redis postgres
```

2. Start the backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

3. Start the frontend:
```bash
cd frontend
npm install
npm run dev
```

4. (Optional) Start Celery worker:
```bash
cd backend
celery -A app.tasks worker --loglevel=info
```

### Running with Docker

```bash
docker compose --profile worker up -d
```

## Project Structure

```
headshot-app/
├── frontend/          # React + Vite frontend
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── api/v1/    # API endpoints
│   │   ├── models/    # SQLModel models
│   │   ├── schemas/   # Pydantic schemas
│   │   ├── services/  # Business logic
│   │   └── tasks/     # Celery tasks
│   └── alembic/       # Database migrations
├── workers/           # Modal GPU workers
└── docker-compose.yml
```

## API Documentation

When running locally, API docs are available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel deploy
```

### Backend (Railway/ECS)
Deploy using the Dockerfile in `/backend`

### GPU Workers (Modal)
```bash
cd workers
modal deploy headshot_worker.py
```

## License

MIT
