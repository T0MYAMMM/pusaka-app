---                                                                       
  Deploying to Railway                                                      
                                                                            
  Railway deploys each service separately. You'll create one Railway project
   with 4 services: Backend, Frontend, PostgreSQL, and Redis.               
                  
  ---
  Prerequisites

  npm install -g @railway/cli
  railway login

  ---
  1. Create the Railway project

  railway init          # choose "Empty project", name it "pusaka"

  ---
  2. Add PostgreSQL and Redis

  In the Railway dashboard → your project → + New → Database:

  1. Add PostgreSQL — Railway auto-provisions it and sets DATABASE_URL
  2. Add Redis — Railway auto-provisions it and sets REDIS_URL

  Copy both connection strings from the Railway dashboard — you'll need them
   in step 4.

  ---
  3. Deploy the backend

  Railway needs a few files in the backend to deploy correctly. Create them:

  backend/Procfile (tells Railway how to start the app):

  web: alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port $PORT

  backend/runtime.txt (pins Python version):

  python-3.12

  Then deploy:

  cd backend
  railway service create --name backend
  railway up

  ---
  4. Set backend environment variables

  In Railway dashboard → backend service → Variables, add:

  ┌─────────────────────────────┬────────────────────────────────────────┐
  │          Variable           │                 Value                  │
  ├─────────────────────────────┼────────────────────────────────────────┤
  │                             │ postgresql+asyncpg://... (from Railway │
  │ DATABASE_URL                │  PostgreSQL, replace postgresql://     │
  │                             │ with postgresql+asyncpg://)            │
  ├─────────────────────────────┼────────────────────────────────────────┤
  │ REDIS_URL                   │ redis://... (from Railway Redis)       │
  ├─────────────────────────────┼────────────────────────────────────────┤
  │ SECRET_KEY                  │ openssl rand -hex 32 output            │
  ├─────────────────────────────┼────────────────────────────────────────┤
  │ ENCRYPTION_KEY              │ openssl rand -hex 32 output            │
  ├─────────────────────────────┼────────────────────────────────────────┤
  │ APP_ENV                     │ production                             │
  ├─────────────────────────────┼────────────────────────────────────────┤
  │ FRONTEND_ORIGIN             │ https://your-frontend.railway.app      │
  │                             │ (fill in after step 6)                 │
  ├─────────────────────────────┼────────────────────────────────────────┤
  │ REQUIRE_EMAIL_VERIFICATION  │ true                                   │
  ├─────────────────────────────┼────────────────────────────────────────┤
  │ RATE_LIMITING_ENABLED       │ true                                   │
  ├─────────────────────────────┼────────────────────────────────────────┤
  │ RESEND_API_KEY              │ your Resend key                        │
  ├─────────────────────────────┼────────────────────────────────────────┤
  │ APP_BASE_URL                │ https://your-frontend.railway.app      │
  ├─────────────────────────────┼────────────────────────────────────────┤
  │ STRIPE_SECRET_KEY           │ sk_live_... or sk_test_...             │
  ├─────────────────────────────┼────────────────────────────────────────┤
  │ STRIPE_WEBHOOK_SECRET       │ whsec_...                              │
  ├─────────────────────────────┼────────────────────────────────────────┤
  │ STRIPE_PRO_PRICE_ID         │ price_...                              │
  ├─────────────────────────────┼────────────────────────────────────────┤
  │ STRIPE_TEAM_PRICE_ID        │ price_...                              │
  ├─────────────────────────────┼────────────────────────────────────────┤
  │ STRIPE_TEAM_GROWTH_PRICE_ID │ price_...                              │
  └─────────────────────────────┴────────────────────────────────────────┘

  DATABASE_URL note: Railway gives you postgresql://user:pass@host/db. The
  async SQLAlchemy driver needs postgresql+asyncpg:// — just replace the
  prefix.

  Also add asyncpg to requirements.txt since production uses PostgreSQL (not
   SQLite):

  echo "asyncpg==0.30.0" >> backend/requirements.txt

  ---
  5. Deploy the frontend

  cd frontend
  railway service create --name frontend
  railway up

  Railway auto-detects Next.js via Nixpacks — no config needed.

  ---
  6. Set frontend environment variables

  In Railway dashboard → frontend service → Variables:

  ┌──────────────────────────────────┬───────────────────────────────────┐
  │             Variable             │               Value               │
  ├──────────────────────────────────┼───────────────────────────────────┤
  │ NEXT_PUBLIC_API_URL              │ https://your-backend.railway.app  │
  ├──────────────────────────────────┼───────────────────────────────────┤
  │ NEXT_PUBLIC_APP_URL              │ https://your-frontend.railway.app │
  ├──────────────────────────────────┼───────────────────────────────────┤
  │ NEXT_PUBLIC_STRIPE_PRO_PRICE_ID  │ price_...                         │
  ├──────────────────────────────────┼───────────────────────────────────┤
  │ NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID │ price_...                         │
  └──────────────────────────────────┴───────────────────────────────────┘

  Then go back and update FRONTEND_ORIGIN and APP_BASE_URL in the backend
  service with the actual frontend URL.

  ---
  7. Set the Stripe webhook endpoint

  In the Stripe dashboard → Webhooks → Add endpoint:

  - URL: https://your-backend.railway.app/api/v1/billing/webhook
  - Events: checkout.session.completed, customer.subscription.updated,
  customer.subscription.deleted

  Copy the Signing secret (whsec_...) into the backend's
  STRIPE_WEBHOOK_SECRET variable.

  ---
  8. Verify

  # Check backend health
  curl https://your-backend.railway.app/health
  # → {"status": "ok"}

  # Check migrations ran
  railway logs --service backend | grep alembic

  ---
  Quickstart summary

  # One-time setup
  npm install -g @railway/cli && railway login && railway init

  # Add PostgreSQL + Redis via dashboard, then:
  echo "asyncpg==0.30.0" >> backend/requirements.txt
  echo "web: alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port
  \$PORT" > backend/Procfile
  echo "python-3.12" > backend/runtime.txt

  # Deploy
  railway service create --name backend  && cd backend && railway up
  railway service create --name frontend && cd ../frontend && railway up

  # Set env vars in dashboard, then redeploy if needed:
  railway redeploy