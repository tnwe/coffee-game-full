# Coffee Game V2 Dockerfile - Multi-stage build for production

# ========== STAGE 1: Build Frontend ==========
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend dependency files
COPY frontend/package.json ./
RUN npm install

# Copy all frontend files and build
COPY frontend .
RUN npm run build

# ========== STAGE 2: Build Backend ==========
FROM python:3.11-slim AS backend-builder

WORKDIR /app

# Install system dependencies for building Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create and activate virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend application files
COPY backend/app ./app

# ========== STAGE 3: Production Image ==========
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for production
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=backend-builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy backend application from builder
COPY --from=backend-builder /app ./app

# Copy built frontend from frontend-builder
COPY --from=frontend-builder /app/frontend/dist ./app/frontend_dist

# Create data directory
RUN mkdir -p /app/data

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DATABASE_URL=sqlite:///./coffee_game.db

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/health', timeout=3).raise_for_status()" || exit 1

# Start the application
CMD ["uvicorn", "app.main_v2:app", "--host", "0.0.0.0", "--port", "8000"]
