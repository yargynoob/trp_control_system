# Backend - FastAPI Application

## Структура проекта

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Основной файл приложения
│   ├── core/                # Конфигурация и настройки
│   │   ├── __init__.py
│   │   └── config.py        # Настройки приложения
│   ├── models/              # SQLAlchemy модели
│   │   ├── user.py          # Модель пользователя
│   │   ├── role.py          # Модели ролей
│   │   ├── project.py       # Модель проекта
│   │   ├── defect.py        # Модели дефектов
│   │   ├── comment.py       # Модель комментариев
│   │   ├── file_attachment.py  # Модель файлов
│   │   ├── change_log.py    # Модель истории изменений
│   │   └── notification.py  # Модель уведомлений
│   ├── schemas/             # Pydantic схемы
│   │   ├── user.py
│   │   ├── project.py
│   │   ├── defect.py
│   │   ├── comment.py
│   │   ├── file_attachment.py
│   │   ├── change_log.py
│   │   └── notification.py
│   ├── api/                 # API роуты
│   │   └── v1/
│   │       ├── router.py    # Главный роутер
│   │       └── endpoints/   # Endpoints
│   │           ├── users.py
│   │           ├── projects.py
│   │           ├── defects.py
│   │           ├── comments.py
│   │           ├── files.py
│   │           └── dashboard.py
│   └── db/                  # Настройки базы данных
│       ├── base.py          # Base класс для моделей
│       └── session.py       # Сессии БД
├── alembic/                 # Миграции базы данных
│   ├── env.py
│   └── versions/
├── uploads/                 # Загруженные файлы
├── Dockerfile               # Production Dockerfile
├── Dockerfile.dev           # Development Dockerfile
├── alembic.ini              # Конфигурация Alembic
├── requirements.txt         # Python зависимости
└── README.md
```

## Установка и запуск

### Локальная разработка

1. **Создать виртуальное окружение**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows
```

2. **Установить зависимости**
```bash
pip install -r requirements.txt
```

3. **Настроить переменные окружения**

Скопировать `.env.example` в `.env` и настроить параметры:
```bash
DATABASE_URL=postgresql://postgres:12345678@localhost:5169/TRP
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-here
DEBUG=True
```

4. **Запустить миграции Alembic**
```bash
# Создать первую миграцию (если нужно)
alembic revision --autogenerate -m "Initial migration"

# Применить миграции
alembic upgrade head
```

5. **Запустить сервер разработки**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

6. **Открыть документацию API**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Docker (Development)

```bash
# Из корневой директории проекта
docker-compose -f docker-compose.dev.yml up
```

### Docker (Production)

```bash
# Из корневой директории проекта
docker-compose up -d
```

## API Endpoints

### Organizations (Projects)
- `GET /api/v1/organizations` - Получить все организации
- `GET /api/v1/organizations/{id}` - Получить организацию по ID
- `POST /api/v1/organizations` - Создать организацию
- `PUT /api/v1/organizations/{id}` - Обновить организацию
- `DELETE /api/v1/organizations/{id}` - Удалить организацию

### Defects
- `GET /api/v1/defects` - Получить все дефекты (с фильтрами)
- `GET /api/v1/defects/{id}` - Получить дефект по ID
- `POST /api/v1/defects` - Создать дефект
- `PUT /api/v1/defects/{id}` - Обновить дефект
- `DELETE /api/v1/defects/{id}` - Удалить дефект
- `POST /api/v1/defects/update-overdue` - Обновить просроченные дефекты

### Users
- `GET /api/v1/users` - Получить всех пользователей
- `GET /api/v1/users/{id}` - Получить пользователя по ID
- `POST /api/v1/users` - Создать пользователя
- `PUT /api/v1/users/{id}` - Обновить пользователя
- `DELETE /api/v1/users/{id}` - Удалить пользователя

### Comments
- `GET /api/v1/comments/defect/{defect_id}` - Получить комментарии дефекта
- `POST /api/v1/comments` - Создать комментарий
- `PUT /api/v1/comments/{id}` - Обновить комментарий
- `DELETE /api/v1/comments/{id}` - Удалить комментарий

### Files
- `POST /api/v1/files/upload` - Загрузить файл
- `GET /api/v1/files/defect/{defect_id}` - Получить файлы дефекта
- `GET /api/v1/files/download/{id}` - Скачать файл
- `DELETE /api/v1/files/{id}` - Удалить файл

### Dashboard
- `GET /api/v1/dashboard/{project_id}/metrics` - Метрики проекта
- `GET /api/v1/dashboard/{project_id}/critical-defects` - Критические дефекты
- `GET /api/v1/dashboard/{project_id}/recent-actions` - Последние действия
- `GET /api/v1/dashboard/{project_id}/all-actions` - Все действия
- `GET /api/v1/dashboard/{project_id}/defects` - Дефекты проекта

## База данных

Используется PostgreSQL с следующими таблицами:
- `users` - Пользователи
- `roles` - Роли
- `user_roles` - Связь пользователей и ролей
- `projects` - Проекты/Организации
- `defects` - Дефекты
- `defect_statuses` - Статусы дефектов
- `priorities` - Приоритеты
- `defect_categories` - Категории дефектов
- `comments` - Комментарии
- `file_attachments` - Прикрепленные файлы
- `change_logs` - История изменений
- `notifications` - Уведомления

## Технологии

- **FastAPI** - Веб-фреймворк
- **SQLAlchemy** - ORM
- **Alembic** - Миграции БД
- **Pydantic** - Валидация данных
- **PostgreSQL** - База данных
- **Redis** - Кэширование (опционально)
- **Uvicorn** - ASGI сервер
