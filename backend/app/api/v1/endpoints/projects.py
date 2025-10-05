"""Project (Organization) endpoints."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db import get_db
from app.models.project import Project
from app.models.role import UserRole, Role
from app.models.defect import Defect
from app.models.user import User
from app.schemas.project import Project as ProjectSchema, ProjectCreate, ProjectUpdate, ProjectDetail
from app.core.deps import get_current_user, user_has_role_in_project, get_user_role_in_project

router = APIRouter()


@router.get("/", response_model=List[ProjectSchema])
def get_projects(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all projects with statistics (superuser sees all, others see only their projects)."""
    if current_user.is_superuser:
        projects = db.query(Project).offset(skip).limit(limit).all()
    else:
        user_project_ids = db.query(UserRole.project_id).filter(
            UserRole.user_id == current_user.id
        ).distinct().all()
        user_project_ids = [pid[0] for pid in user_project_ids]
        
        projects = db.query(Project).filter(
            Project.id.in_(user_project_ids)
        ).offset(skip).limit(limit).all()
    
    result = []
    for project in projects:
        defects_count = db.query(func.count(Defect.id)).filter(
            Defect.project_id == project.id
        ).scalar()
        
        team_size = db.query(func.count(func.distinct(UserRole.user_id))).join(
            User, UserRole.user_id == User.id
        ).filter(
            UserRole.project_id == project.id,
            User.is_superuser == False
        ).scalar()
        
        last_defect_date = db.query(Defect.created_at).filter(
            Defect.project_id == project.id
        ).order_by(Defect.created_at.desc()).limit(1).scalar()
        
        project_data = ProjectSchema.model_validate(project)
        project_data.defects_count = defects_count or 0
        project_data.team_size = team_size or 0
        project_data.last_defect_date = last_defect_date
        
        result.append(project_data)
    
    return result


@router.get("/{project_id}", response_model=ProjectDetail)
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get project by ID with users."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    if not current_user.is_superuser:
        user_role = db.query(UserRole).filter(
            UserRole.project_id == project_id,
            UserRole.user_id == current_user.id
        ).first()
        
        if not user_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this organization"
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
    
    team_size = db.query(func.count(func.distinct(UserRole.user_id))).join(
        User, UserRole.user_id == User.id
    ).filter(
        UserRole.project_id == project.id,
        User.is_superuser == False
    ).scalar()
    
    last_defect_date = db.query(Defect.created_at).filter(
        Defect.project_id == project.id
    ).order_by(Defect.created_at.desc()).limit(1).scalar()
    
    current_user_role = get_user_role_in_project(current_user.id, project_id, db)
    
    project_data = ProjectDetail.model_validate(project)
    project_data.users = users_data
    project_data.defects_count = defects_count or 0
    project_data.team_size = team_size or 0
    project_data.last_defect_date = last_defect_date
    project_data.current_user_role = current_user_role
    
    return project_data


@router.post("/", response_model=ProjectSchema, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new project. Any user can create a project."""
    try:
        project_data = project_in.model_dump(exclude={"user_roles"})
        project_data["status"] = "active"
        project_data["is_active"] = True
        
        db_project = Project(**project_data)
        db.add(db_project)
        db.flush()
        
        if not current_user.is_superuser:
            supervisor_role = db.query(Role).filter(Role.name == "supervisor").first()
            if supervisor_role:
                creator_user_role = UserRole(
                    user_id=current_user.id,
                    role_id=supervisor_role.id,
                    project_id=db_project.id,
                    granted_by=current_user.id
                )
                db.add(creator_user_role)
        
        if project_in.user_roles:
            for user_role in project_in.user_roles:
                if not current_user.is_superuser and int(user_role.get("userId")) == current_user.id:
                    continue
                    
                role = db.query(Role).filter(Role.name == user_role.get("role")).first()
                if role:
                    ur = UserRole(
                        user_id=int(user_role.get("userId")),
                        role_id=role.id,
                        project_id=db_project.id,
                        granted_by=current_user.id
                    )
                    db.add(ur)
        
        db.commit()
        db.refresh(db_project)
        
        project_response = ProjectSchema.model_validate(db_project)
        project_response.defects_count = 0
        project_response.team_size = len(project_in.user_roles) if project_in.user_roles else 0
        project_response.last_defect_date = None
        
        return project_response
        
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update project. Only superuser or supervisor can update."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    if not current_user.is_superuser:
        if not user_has_role_in_project(current_user.id, project_id, ['supervisor'], db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only supervisors can edit organization"
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
                        granted_by=current_user.id
                    )
                    db.add(ur)
        
        db.commit()
        db.refresh(project)
        
        defects_count = db.query(func.count(Defect.id)).filter(
            Defect.project_id == project_id
        ).scalar()
        
        team_size = db.query(func.count(func.distinct(UserRole.user_id))).join(
            User, UserRole.user_id == User.id
        ).filter(
            UserRole.project_id == project_id,
            User.is_superuser == False
        ).scalar()
        
        last_defect_date = db.query(Defect.created_at).filter(
            Defect.project_id == project_id
        ).order_by(Defect.created_at.desc()).limit(1).scalar()
        
        project_response = ProjectSchema.model_validate(project)
        project_response.defects_count = defects_count or 0
        project_response.team_size = team_size or 0
        project_response.last_defect_date = last_defect_date
        
        return project_response
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update organization: {str(e)}"
        )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete project. Only superuser or supervisor can delete."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    if not current_user.is_superuser:
        if not user_has_role_in_project(current_user.id, project_id, ['supervisor'], db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only supervisors can delete organization"
            )
    
    db.delete(project)
    db.commit()
    
    return None
