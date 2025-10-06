#!/bin/bash
# TRP Control System - Quick Docker Setup Script

set -e

echo "=========================================="
echo "TRP Control System - Docker Setup"
echo "=========================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  ВАЖНО: Отредактируйте .env файл и установите пароли!"
    echo "Нажмите Enter когда будете готовы продолжить..."
    read
fi

# Build images
echo "Building Docker images..."
docker-compose build

# Start services
echo "Starting services..."
docker-compose up -d

# Wait for database
echo "Waiting for database to be ready..."
sleep 10

# Run migrations
echo "Running database migrations..."
docker-compose exec -T backend python -m alembic upgrade head

# Initialize data
echo "Initializing base data..."
docker-compose exec -T backend python init_db.py

echo ""
echo "=========================================="
echo "✅ Setup completed successfully!"
echo "=========================================="
echo ""
echo "Application is running at:"
echo "  Frontend: http://localhost"
echo "  Backend API: http://localhost/api/v1"
echo "  API Docs: http://localhost/docs"
echo ""
echo "Default credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "⚠️  Don't forget to change the password!"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"
echo ""
echo "To stop services:"
echo "  docker-compose down"
echo "=========================================="
