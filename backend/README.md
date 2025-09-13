# Backend - FastAPI Application

## Структура проекта

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Основной файл приложения
│   ├── core/                # Конфигурация и настройки
│   ├── models/              # SQLAlchemy модели
│   ├── schemas/             # Pydantic схемы
│   ├── api/                 # API роуты
│   ├── services/            # Бизнес-логика
│   └── db/                  # Настройки базы данных
├── alembic/                 # Миграции базы данных
├── tests/                   # Тесты
└── requirements.txt
```

## Запуск для разработки

```bash
# Установка зависимостей
pip install -r requirements.txt

# Запуск сервера разработки
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
