# Production Dockerfile for Backend

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/uploads /app/reports

# Create entrypoint script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
echo "Waiting for database..."\n\
until pg_isready -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER; do\n\
  echo "Database is unavailable - sleeping"\n\
  sleep 2\n\
done\n\
\n\
echo "Database is up - executing command"\n\
\n\
# Run migrations\n\
echo "Running database migrations..."\n\
python -m alembic upgrade head\n\
\n\
# Start application\n\
echo "Starting application..."\n\
exec uvicorn app.main:app --host 0.0.0.0 --port 8000\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Expose port
EXPOSE 8000

# Run entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]
