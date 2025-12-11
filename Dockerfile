# Build+run in one image: install node inside and build frontend, then run backend
FROM python:3.11-slim

# Install node + npm
RUN apt-get update && apt-get install -y curl ca-certificates     && curl -fsSL https://deb.nodesource.com/setup_18.x | bash -     && apt-get install -y nodejs build-essential     && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy everything
COPY . .

# Install Python deps
RUN pip install --no-cache-dir -r backend/requirements.txt

# Build frontend (produces ../frontend_dist)
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Run the backend
WORKDIR /app/backend
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]