"""Project (Organization) endpoints."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db import get_db
from app.models.project import Project
from app.models.role import UserRole, Role
from app.models.defect import Defect
from app.schemas.project import Project as ProjectSchema, ProjectCreate, ProjectUpdate, ProjectDetail

router = APIRouter()


@router.get("/", response_model=List[ProjectSchema])
def get_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all projects with statistics."""
    projects = db.query(Project).offset(skip).limit(limit).all()
    
    result = []
    for project in projects:
        # Get defects count
        defects_count = db.query(func.count(Defect.id)).filter(
            Defect.project_id == project.id
        ).scalar()
        
        # Get team size
        team_size = db.query(func.count(func.distinct(UserRole.user_id))).filter(
            UserRole.project_id == project.id
        ).scalar()
        
        project_data = ProjectSchema.model_validate(project)
        project_data.defects_count = defects_count or 0
        project_data.team_size = team_size or 0
        
        result.append(project_data)
    
    return result


@router.get("/{project_id}", response_model=ProjectDetail)
def get_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get project by ID with users."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    user_roles = db.query(UserRole).filter(UserRole.project_id == project_id).all()
    users_data = []
    for ur in user_roles:
        users_data.append({
            "userId": str(ur.user_id),
            "role": ur.role.name,
            "userName": f"{ur.user.first_name} {ur.user.last_name}" if ur.user.first_name else ur.user.username
        })
    

    defects_count = db.query(func.count(Defect.id)).filter(
        Defect.project_id == project.id
    ).scalar()
    
    team_size = db.query(func.count(func.distinct(UserRole.user_id))).filter(
        UserRole.project_id == project.id
    ).scalar()
    
    project_data = ProjectDetail.model_validate(project)
    project_data.users = users_data
    project_data.defects_count = defects_count or 0
    project_data.team_size = team_size or 0
    
    return project_data


@router.post("/", response_model=ProjectSchema, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db)
):
    """Create new project."""
    try:
        project_data = project_in.model_dump(exclude={"user_roles"})
        project_data["status"] = "active"
        project_data["is_active"] = True
        
        db_project = Project(**project_data)
        db.add(db_project)
        db.flush()
        
        if project_in.user_roles:
            for user_role in project_in.user_roles:
                role = db.query(Role).filter(Role.name == user_role.get("role")).first()
                if role:
                    ur = UserRole(
                        user_id=int(user_role.get("userId")),
                        role_id=role.id,
                        project_id=db_project.id,
                        granted_by=1 
                    )
                    db.add(ur)
        
        db.commit()
        db.refresh(db_project)
        
        return db_project
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create organization: {str(e)}"
        )


@router.put("/{project_id}", response_model=ProjectSchema)
def update_project(
    project_id: int,
    project_in: ProjectUpdate,
    db: Session = Depends(get_db)
):
    """Update project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    try:
        update_data = project_in.model_dump(exclude_unset=True, exclude={"user_roles"})
        
        for field, value in update_data.items():
            setattr(project, field, value)
        
        if project_in.user_roles is not None:
            db.query(UserRole).filter(UserRole.project_id == project_id).delete()
            for user_role in project_in.user_roles:
                role = db.query(Role).filter(Role.name == user_role.get("role")).first()
                if role:
                    ur = UserRole(
                        user_id=int(user_role.get("userId")),
                        role_id=role.id,
                        project_id=project_id,
                        granted_by=1 
                    )
                    db.add(ur)
        
        db.commit()
        db.refresh(project)
        
        return project
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update organization: {str(e)}"
        )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Delete project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    db.delete(project)
    db.commit()
    
    return None
