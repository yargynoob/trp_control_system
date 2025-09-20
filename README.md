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
> [![Redis](https://img.shields.io/badge/Redis-%23DD0031.svg?logo=redis&logoColor=white)](https://redis.io/)
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
service redis(database)[Redis]
service backendServer(server)[Backend FastAPI]
service frontendServer(server)[Frontend NextJS]

internet:R <--> L:proxy
proxy:R <--> L:backendServer
proxy:R <--> L:frontendServer
backendServer:R <--> L:db
backendServer:R <--> L:redis
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
- Redis 6+
- Docker & Docker Compose

## Установка и запуск

### Разработка

1. Клонировать репозиторий
2. Скопировать и настроить переменные окружения из `.env.example`
3. Запустить через Docker Compose:

```bash
docker-compose -f docker-compose.dev.yml up
```

### Продакшн

```bash
docker-compose up -d
```

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
