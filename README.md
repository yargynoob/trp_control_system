# Система управления дефектами проектов (TRP Control System)
Веб-приложение для управления дефектами в проектах с возможностью создания, отслеживания и контроля устранения выявленных неполадок. Система обеспечивает полный цикл работы: от регистрации дефекта и назначения исполнителя до контроля статусов и формирования отчётности для руководства.

> ### Использованные технологии
> Frontend:
> [![npm](https://img.shields.io/badge/npm-CB3837?logo=npm&logoColor=fff)](https://www.npmjs.com/)
> [![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js&logoColor=white)](https://nextjs.org/)
> [![React](https://img.shields.io/badge/React-%2320232a.svg?logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
> [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
> [![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-%2338B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
> <br/>Backend: 
> [![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=fff)](https://www.python.org/)
> [![FastAPI](https://img.shields.io/badge/FastAPI-009485.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
> [![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-%23D71F00.svg?logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/)
> [![Postgres](https://img.shields.io/badge/Postgres-%23316192.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
> [![Alembic](https://img.shields.io/badge/Alembic-blue)](https://alembic.sqlalchemy.org/)
> <br/>Infrastructure: 
> [![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=fff)](https://www.docker.com/)
> [![Nginx](https://img.shields.io/badge/Nginx-%23009639.svg?logo=nginx&logoColor=white)](https://nginx.org/)
---

## Функционал
1. Регистрация пользователей и аутентификация.
2. Разграничение прав доступа посредством привилегий.
3. Управление проектами/объектами и их этапами.
4. Создание и редактирование дефектов (заголовок, описание, приоритет, исполнитель, сроки, вложения).
5. Хранение и управление статусами дефектов: Новая → В работе → На проверке → Закрыта/Отменена.
6. Ведение истории изменений дефектов.
7. Поиск, сортировка и фильтрация дефектов.
8. Экспорт отчётности в CSV/Excel.
9. Просмотр аналитических отчётов (графики, статистика).
10. Система комментариев и уведомлений о критических событиях.

 
## Основные роли
 1. **Инженеры**: Регистрация/исправление дефектов, обновление информации о дефектах, добавление и редактирование объектов.
 2. **Менеджеры**: Назначение задач по исправлению дефектов, формирование отчетов.
 3. **Руководители и заказчики**: Просмотр прогресса, отчетности.

## Use Case диаграммы
![Use Case](./images/UseCase0.png)
![Use Case](./images/UseCase1.png)

## Архитектура стеков
[Frontend часть](./frontend/README.md)
```mermaid
architecture-beta

service internet(internet)[Internet]
service proxy(internet)[Nginx]
service db(database)[PostgreSQL]
service backendServer(server)[Backend FastAPI]
service frontendServer(server)[Frontend NextJS]

internet:R <--> L:proxy
proxy:R <--> L:backendServer
proxy:R <--> L:frontendServer
backendServer:R <--> L:db
```

## Архитектура базы данных
![Database architecture](./images/ERD.png)

## Структура проекта

```
TRP_Clean/
├── backend/          # FastAPI приложение
├── frontend/         # Next.js приложение
├── docker/           # Docker конфигурации
├── docs/             # Документация проекта
├── database/         # Схемы и миграции БД
└── images/           # Диаграммы и изображения
```

## Требования к системе

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (для запуска через Docker)

## Установка и запуск

### 🐳 Docker (Рекомендуется)

**Самый быстрый способ запуска - всего 2 минуты!**

```bash
# 1. Клонируйте репозиторий
git clone <repository-url>
cd TRP_Clean

# 2. Создайте .env файл
cp .env.example .env
# Отредактируйте .env - установите пароли

# 3. Запустите автоматическую установку
# Windows:
docker-setup.bat

# Linux/Mac:
chmod +x docker-setup.sh
./docker-setup.sh
```

**Готово!** Откройте http://localhost  
Логин: admin / admin123

**Подробная документация:** [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)

---

### 💻 Ручная установка (без Docker)

Если вы хотите запустить проект без Docker, см. подробные инструкции в [DATABASE_SETUP.md](./DATABASE_SETUP.md).

**Быстрый старт (5 минут):**

```bash
# 1. Создайте базу данных
psql -U postgres -c "CREATE DATABASE \"TRP\" WITH ENCODING 'UTF8';"

# 2. Клонируйте репозиторий
git clone <repository-url>
cd TRP_Clean/backend

# 3. Настройте переменные окружения
cp .env.example .env
# Отредактируйте .env

# 4. Установите зависимости
pip install -r requirements.txt

# 5. Примените миграции
python -m alembic upgrade head

# 6. Инициализируйте базовые данные
python init_db.py

# 7. Запустите backend
uvicorn app.main:app --reload
```

Backend: http://localhost:8000  
API Docs: http://localhost:8000/docs  
Логин: admin / admin123

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:3000

---

### 🔧 Разработка

**Docker (с hot reload):**
```bash
docker-compose -f docker-compose.dev.yml up
```

**Без Docker:**
```bash
# Terminal 1 - Backend
cd backend
uvicorn app.main:app --reload

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

- Backend: http://localhost:8000
- Frontend: http://localhost:3000
- PostgreSQL: localhost:5169

## Страницы
1. **Страница авторизации**
   Форма входа с полями email и пароль, возможность регистрации новых пользователей.
2. **Страница проектов/объектов**
   Список проектов и объектов с возможностью создания новых. Форма для добавления проекта/объекта.
3. **Страница дефектов**
   Список дефектов с возможностью фильтрации по объектам, статусам, ответственным, срокам. Форма для добавления нового дефекта.
4. **Страница дефекта**
   Подробная информация о дефекте с фотографиями. Возможность редактирования дефекта при наличии привилегий. Просмотр истории изменений.
5. **Страница аналитики**
   Диаграммы и статистика по дефектам с возможностью фильтрации по датам, объектам и ответственным. Экспорт отчетов в CSV/Excel.

## API

API документация доступна по адресу: `http://localhost:8000/docs`

## Документация

- **[Docker Deployment](./DOCKER_DEPLOYMENT.md)** - полная инструкция по развертыванию с Docker (рекомендуется)
- [Настройка базы данных](./DATABASE_SETUP.md) - подробная инструкция по развертыванию БД без Docker
- [ER-диаграмма базы данных](./ER_диаграмма_базы_данных.md) - структура базы данных

## Управление проектом

### Команды Docker

```bash
# Запуск
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down

# Перезапуск
docker-compose restart

# Просмотр статуса
docker-compose ps
```

### Миграции базы данных

```bash
# С Docker
docker-compose exec backend python -m alembic upgrade head
docker-compose exec backend python -m alembic revision --autogenerate -m "description"

# Без Docker
cd backend
python -m alembic upgrade head
python -m alembic revision --autogenerate -m "description"
```

### Резервное копирование

```bash
# Backup базы данных
docker-compose exec db pg_dump -U postgres TRP > backup.sql

# Restore базы данных
docker-compose exec -T db psql -U postgres TRP < backup.sql
```
