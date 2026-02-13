# Backend – Sideline Sports & Entertainment

Express API for admin authentication and article publishing.

## Setup

1. Create a PostgreSQL database (e.g. `createdb sideline` or via your DB client).

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables (optional; defaults are fine for local dev):

   Copy `.env.example` to `.env` and edit as needed:

   - `PORT` – API port (default: 4000)
   - `JWT_SECRET` – Secret for JWT signing (change in production)
   - `ADMIN_USERNAME` – Admin login username (default: `admin`)
   - `ADMIN_PASSWORD` – Admin login password (default: `admin123`)
   - `DATABASE_URL` – PostgreSQL connection string.
     - **Local:** use `postgresql://postgres:postgres@localhost:5432/sideline` (PostgreSQL must be running locally).
     - **Railway:** when deployed, Railway injects a URL with `postgres.railway.internal`; that hostname only works on Railway, not on your machine. To use Railway’s DB from your laptop, use the **public** connection URL from the Railway PostgreSQL service (Dashboard → your Postgres service → Connect → “Public network”).
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` – for article image uploads ([Cloudinary Console](https://console.cloudinary.com))

4. Run the server:

   ```bash
   npm start
   ```

   The API will be available at `http://localhost:4000`.

## Endpoints

### Auth

- `POST /api/auth/login` – Admin login. Body: `{ username, password }`. Returns `{ token, username }`.

### Articles

- `GET /api/articles` – Public. Returns all published articles.
- `POST /api/articles` – Protected (requires `Authorization: Bearer <token>`). Creates an article. Form fields:
  - `title` (required)
  - `image` (required, file)
  - `content` (required)
  - `category` (optional)
  - `author` (optional)

### Work with us

- `POST /api/work-with-us` – Public. Submits a “Work with us” application. Body: `{ name, phone, email, introduction }`. Stored in PostgreSQL. Rate limited by IP (5 per 15 min). Returns `201 { ok: true }` or `4xx` with `{ error }`.

## Data

- **PostgreSQL** – Set `DATABASE_URL` in `.env` (e.g. `postgresql://user:password@localhost:5432/sideline`). Tables are created automatically on startup.
- **Railway** – To host backend + PostgreSQL on Railway: create a new project, add a PostgreSQL service, then add a Web Service for the backend. Set the root to the `backend` folder (or deploy the repo and set start command to `cd backend && npm start`). Railway injects `DATABASE_URL` and `PORT`; add `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and the three `CLOUDINARY_*` variables in the service variables. Point your frontend’s API base URL to the Railway backend URL (or use a proxy).
- **Cloudinary** – Article images are uploaded to Cloudinary. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `.env` (from [Cloudinary Console](https://console.cloudinary.com)). New articles get a Cloudinary URL in `articles.image`; existing `/uploads/...` URLs still work if you serve the `uploads` folder.
- An admin user is created on first run using `ADMIN_USERNAME` and `ADMIN_PASSWORD`.
- **work_with_us** – Table stores name, phone, email, introduction, created_at for “Work with us” form submissions.
