"""Initialize database with required base data."""

import sys
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models.role import Role
from app.models.defect import DefectStatus, Priority
from app.models.user import User
from app.core.security import get_password_hash


def init_roles(db: Session) -> None:
    """Initialize roles."""
    roles_data = [
        {
            "name": "engineer",
            "display_name": "Инженер",
            "description": "Создание и редактирование дефектов",
            "permissions": {"create_defects": True, "edit_own_defects": True}
        },
        {
            "name": "manager",
            "display_name": "Менеджер",
            "description": "Управление дефектами и назначение исполнителей",
            "permissions": {"manage_defects": True, "assign_defects": True}
        },
        {
            "name": "supervisor",
            "display_name": "Руководитель",
            "description": "Полный доступ к проекту",
            "permissions": {"full_access": True}
        }
    ]
    
    for role_data in roles_data:
        existing_role = db.query(Role).filter(Role.name == role_data["name"]).first()
        if not existing_role:
            role = Role(**role_data)
            db.add(role)
            print(f"✓ Created role: {role_data['display_name']}")
        else:
            print(f"- Role already exists: {role_data['display_name']}")
    
    db.commit()


def init_defect_statuses(db: Session) -> None:
    """Initialize defect statuses."""
    statuses_data = [
        {
            "name": "open",
            "display_name": "Новый",
            "color_code": "#dc3545",
            "order_index": 1,
            "is_initial": True,
            "is_final": False
        },
        {
            "name": "in_progress",
            "display_name": "В работе",
            "color_code": "#ffc107",
            "order_index": 2,
            "is_initial": False,
            "is_final": False
        },
        {
            "name": "resolved",
            "display_name": "Решен",
            "color_code": "#28a745",
            "order_index": 3,
            "is_initial": False,
            "is_final": False
        },
        {
            "name": "closed",
            "display_name": "Закрыт",
            "color_code": "#6c757d",
            "order_index": 4,
            "is_initial": False,
            "is_final": True
        },
        {
            "name": "rejected",
            "display_name": "Отменен",
            "color_code": "#6c757d",
            "order_index": 5,
            "is_initial": False,
            "is_final": True
        }
    ]
    
    for status_data in statuses_data:
        existing_status = db.query(DefectStatus).filter(
            DefectStatus.name == status_data["name"]
        ).first()
        if not existing_status:
            status = DefectStatus(**status_data)
            db.add(status)
            print(f"✓ Created status: {status_data['display_name']}")
        else:
            print(f"- Status already exists: {status_data['display_name']}")
    
    db.commit()


def init_priorities(db: Session) -> None:
    """Initialize priorities."""
    priorities_data = [
        {
            "name": "low",
            "display_name": "Низкий",
            "color_code": "#28a745",
            "urgency_level": 1
        },
        {
            "name": "medium",
            "display_name": "Средний",
            "color_code": "#ffc107",
            "urgency_level": 2
        },
        {
            "name": "high",
            "display_name": "Высокий",
            "color_code": "#fd7e14",
            "urgency_level": 3
        },
        {
            "name": "critical",
            "display_name": "Критический",
            "color_code": "#dc3545",
            "urgency_level": 4
        }
    ]
    
    for priority_data in priorities_data:
        existing_priority = db.query(Priority).filter(
            Priority.name == priority_data["name"]
        ).first()
        if not existing_priority:
            priority = Priority(**priority_data)
            db.add(priority)
            print(f"✓ Created priority: {priority_data['display_name']}")
        else:
            print(f"- Priority already exists: {priority_data['display_name']}")
    
    db.commit()


def create_superuser(db: Session, username: str, email: str, password: str) -> None:
    """Create superuser."""
    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        print(f"- User already exists: {username}")
        return
    
    user = User(
        username=username,
        email=email,
        password_hash=get_password_hash(password),
        first_name="Admin",
        last_name="User",
        is_active=True,
        is_superuser=True
    )
    db.add(user)
    db.commit()
    print(f"✓ Created superuser: {username} ({email})")


def main():
    """Main initialization function."""
    print("=" * 50)
    print("Initializing TRP Control System Database")
    print("=" * 50)
    
    db = SessionLocal()
    
    try:
        print("\n1. Initializing roles...")
        init_roles(db)
        
        print("\n2. Initializing defect statuses...")
        init_defect_statuses(db)
        
        print("\n3. Initializing priorities...")
        init_priorities(db)
        
        print("\n4. Creating superuser...")
        # You can customize these values or pass as arguments
        create_superuser(
            db,
            username="admin",
            email="admin@example.com",
            password="admin123"  # Change this in production!
        )
        
        print("\n" + "=" * 50)
        print("✓ Database initialization completed successfully!")
        print("=" * 50)
        print("\nDefault superuser credentials:")
        print("Username: admin")
        print("Password: admin123")
        print("\n⚠️  IMPORTANT: Change the password after first login!")
        
    except Exception as e:
        print(f"\n✗ Error during initialization: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
