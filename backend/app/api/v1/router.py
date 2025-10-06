"""Main API router."""

from fastapi import APIRouter

from app.api.v1.endpoints import users, projects, defects, comments, files, dashboard, auth, reports
from app.api.v1 import backup

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(projects.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(defects.router, prefix="/defects", tags=["defects"])
api_router.include_router(comments.router, prefix="/comments", tags=["comments"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(backup.router, prefix="/backup", tags=["backup"])
