@echo off
REM TRP Control System - Quick Docker Setup Script for Windows

echo ==========================================
echo TRP Control System - Docker Setup
echo ==========================================

REM Check if .env exists
if not exist .env (
    echo Creating .env file from example...
    copy .env.example .env
    echo.
    echo ⚠️  ВАЖНО: Отредактируйте .env файл и установите пароли!
    echo Нажмите Enter когда будете готовы продолжить...
    pause >nul
)

REM Build images
echo Building Docker images...
docker-compose build

REM Start services
echo Starting services...
docker-compose up -d

REM Wait for database
echo Waiting for database to be ready...
timeout /t 15 /nobreak >nul

REM Run migrations
echo Running database migrations...
docker-compose exec -T backend python -m alembic upgrade head

REM Initialize data
echo Initializing base data...
docker-compose exec -T backend python init_db.py

echo.
echo ==========================================
echo ✅ Setup completed successfully!
echo ==========================================
echo.
echo Application is running at:
echo   Frontend: http://localhost
echo   Backend API: http://localhost/api/v1
echo   API Docs: http://localhost/docs
echo.
echo Default credentials:
echo   Username: admin
echo   Password: admin123
echo.
echo ⚠️  Don't forget to change the password!
echo.
echo To view logs:
echo   docker-compose logs -f
echo.
echo To stop services:
echo   docker-compose down
echo ==========================================
pause
