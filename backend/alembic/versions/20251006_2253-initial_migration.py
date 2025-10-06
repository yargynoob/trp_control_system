"""initial migration

Revision ID: initial_rev_001
Revises: 
Create Date: 2025-10-06 22:53:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'initial_rev_001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('username', sa.String(length=150), nullable=False),
    sa.Column('email', sa.String(length=254), nullable=False),
    sa.Column('password_hash', sa.String(length=128), nullable=False),
    sa.Column('first_name', sa.String(length=30), nullable=True),
    sa.Column('last_name', sa.String(length=150), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('is_superuser', sa.Boolean(), nullable=True),
    sa.Column('date_joined', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_is_active'), 'users', ['is_active'], unique=False)
    op.create_index(op.f('ix_users_is_superuser'), 'users', ['is_superuser'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    # Create roles table
    op.create_table('roles',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=50), nullable=False),
    sa.Column('display_name', sa.String(length=100), nullable=False),
    sa.Column('description', sa.String(), nullable=True),
    sa.Column('permissions', postgresql.JSON(astext_type=sa.Text()), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_roles_id'), 'roles', ['id'], unique=False)

    # Create projects table
    op.create_table('projects',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=200), nullable=False),
    sa.Column('description', sa.String(), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=True),
    sa.Column('start_date', sa.Date(), nullable=True),
    sa.Column('end_date', sa.Date(), nullable=True),
    sa.Column('manager_id', sa.Integer(), nullable=True),
    sa.Column('address', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.CheckConstraint("status IN ('planning', 'active', 'completed', 'cancelled')", name='projects_status_check'),
    sa.ForeignKeyConstraint(['manager_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_projects_id'), 'projects', ['id'], unique=False)
    op.create_index(op.f('ix_projects_is_active'), 'projects', ['is_active'], unique=False)
    op.create_index(op.f('ix_projects_status'), 'projects', ['status'], unique=False)

    # Create defect_statuses table
    op.create_table('defect_statuses',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=20), nullable=False),
    sa.Column('display_name', sa.String(length=50), nullable=False),
    sa.Column('description', sa.String(), nullable=True),
    sa.Column('color_code', sa.String(length=7), nullable=True),
    sa.Column('order_index', sa.Integer(), nullable=False),
    sa.Column('is_initial', sa.Boolean(), nullable=True),
    sa.Column('is_final', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_defect_statuses_id'), 'defect_statuses', ['id'], unique=False)

    # Create priorities table
    op.create_table('priorities',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=20), nullable=False),
    sa.Column('display_name', sa.String(length=50), nullable=False),
    sa.Column('color_code', sa.String(length=7), nullable=True),
    sa.Column('urgency_level', sa.Integer(), nullable=False),
    sa.Column('description', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.CheckConstraint('urgency_level BETWEEN 1 AND 10', name='priorities_urgency_check'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_priorities_id'), 'priorities', ['id'], unique=False)

    # Create defect_categories table
    op.create_table('defect_categories',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('description', sa.String(), nullable=True),
    sa.Column('parent_id', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['parent_id'], ['defect_categories.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_defect_categories_id'), 'defect_categories', ['id'], unique=False)

    # Create user_roles table
    op.create_table('user_roles',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('role_id', sa.Integer(), nullable=False),
    sa.Column('project_id', sa.Integer(), nullable=False),
    sa.Column('granted_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('granted_by', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['granted_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'role_id', 'project_id', name='unique_user_role_project')
    )
    op.create_index(op.f('ix_user_roles_id'), 'user_roles', ['id'], unique=False)
    op.create_index(op.f('ix_user_roles_project_id'), 'user_roles', ['project_id'], unique=False)
    op.create_index(op.f('ix_user_roles_user_id'), 'user_roles', ['user_id'], unique=False)

    # Create defects table
    op.create_table('defects',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('number', sa.String(length=20), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('description', sa.String(), nullable=False),
    sa.Column('location', sa.String(length=500), nullable=True),
    sa.Column('project_id', sa.Integer(), nullable=False),
    sa.Column('category_id', sa.Integer(), nullable=True),
    sa.Column('status_id', sa.Integer(), nullable=False),
    sa.Column('priority_id', sa.Integer(), nullable=False),
    sa.Column('reporter_id', sa.Integer(), nullable=False),
    sa.Column('assignee_id', sa.Integer(), nullable=True),
    sa.Column('due_date', sa.Date(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('closed_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('estimated_hours', sa.Numeric(precision=5, scale=2), nullable=True),
    sa.Column('actual_hours', sa.Numeric(precision=5, scale=2), nullable=True),
    sa.CheckConstraint('estimated_hours IS NULL OR estimated_hours > 0', name='defects_hours_check'),
    sa.CheckConstraint('actual_hours IS NULL OR actual_hours > 0', name='defects_actual_hours_check'),
    sa.ForeignKeyConstraint(['assignee_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['category_id'], ['defect_categories.id'], ),
    sa.ForeignKeyConstraint(['priority_id'], ['priorities.id'], ),
    sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
    sa.ForeignKeyConstraint(['reporter_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['status_id'], ['defect_statuses.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_defects_assignee_id'), 'defects', ['assignee_id'], unique=False)
    op.create_index(op.f('ix_defects_category_id'), 'defects', ['category_id'], unique=False)
    op.create_index(op.f('ix_defects_created_at'), 'defects', ['created_at'], unique=False)
    op.create_index(op.f('ix_defects_id'), 'defects', ['id'], unique=False)
    op.create_index(op.f('ix_defects_number'), 'defects', ['number'], unique=True)
    op.create_index(op.f('ix_defects_priority_id'), 'defects', ['priority_id'], unique=False)
    op.create_index(op.f('ix_defects_project_id'), 'defects', ['project_id'], unique=False)
    op.create_index(op.f('ix_defects_reporter_id'), 'defects', ['reporter_id'], unique=False)
    op.create_index(op.f('ix_defects_status_id'), 'defects', ['status_id'], unique=False)

    # Create reports table
    op.create_table('reports',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('project_id', sa.Integer(), nullable=True),
    sa.Column('project_ids', postgresql.ARRAY(sa.Integer()), nullable=True),
    sa.Column('created_by', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('format', sa.String(length=20), nullable=False),
    sa.Column('file_path', sa.String(length=500), nullable=False),
    sa.Column('file_size', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_reports_created_at'), 'reports', ['created_at'], unique=False)
    op.create_index(op.f('ix_reports_created_by'), 'reports', ['created_by'], unique=False)
    op.create_index(op.f('ix_reports_id'), 'reports', ['id'], unique=False)
    op.create_index(op.f('ix_reports_project_id'), 'reports', ['project_id'], unique=False)

    # Create comments table
    op.create_table('comments',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('defect_id', sa.Integer(), nullable=False),
    sa.Column('author_id', sa.Integer(), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['author_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['defect_id'], ['defects.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_comments_author_id'), 'comments', ['author_id'], unique=False)
    op.create_index(op.f('ix_comments_created_at'), 'comments', ['created_at'], unique=False)
    op.create_index(op.f('ix_comments_defect_id'), 'comments', ['defect_id'], unique=False)
    op.create_index(op.f('ix_comments_id'), 'comments', ['id'], unique=False)

    # Create file_attachments table
    op.create_table('file_attachments',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('defect_id', sa.Integer(), nullable=True),
    sa.Column('comment_id', sa.Integer(), nullable=True),
    sa.Column('filename', sa.String(length=255), nullable=False),
    sa.Column('original_name', sa.String(length=255), nullable=False),
    sa.Column('file_path', sa.String(length=500), nullable=False),
    sa.Column('file_size', sa.BigInteger(), nullable=False),
    sa.Column('content_type', sa.String(length=100), nullable=True),
    sa.Column('uploaded_by', sa.Integer(), nullable=False),
    sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('is_deleted', sa.Boolean(), nullable=True),
    sa.CheckConstraint('file_size > 0 AND file_size <= 10485760', name='file_size_check'),
    sa.CheckConstraint('(defect_id IS NOT NULL AND comment_id IS NULL) OR (defect_id IS NULL AND comment_id IS NOT NULL)', name='file_relation_check'),
    sa.ForeignKeyConstraint(['comment_id'], ['comments.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['defect_id'], ['defects.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_file_attachments_comment_id'), 'file_attachments', ['comment_id'], unique=False)
    op.create_index(op.f('ix_file_attachments_defect_id'), 'file_attachments', ['defect_id'], unique=False)
    op.create_index(op.f('ix_file_attachments_id'), 'file_attachments', ['id'], unique=False)
    op.create_index(op.f('ix_file_attachments_uploaded_by'), 'file_attachments', ['uploaded_by'], unique=False)

    # Create change_logs table
    op.create_table('change_logs',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('defect_id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('field_name', sa.String(length=100), nullable=False),
    sa.Column('old_value', sa.Text(), nullable=True),
    sa.Column('new_value', sa.Text(), nullable=True),
    sa.Column('change_type', sa.String(length=20), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.CheckConstraint("change_type IN ('create', 'update', 'delete', 'status_change', 'comment')", name='change_type_check'),
    sa.ForeignKeyConstraint(['defect_id'], ['defects.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_change_logs_created_at'), 'change_logs', ['created_at'], unique=False)
    op.create_index(op.f('ix_change_logs_defect_id'), 'change_logs', ['defect_id'], unique=False)
    op.create_index(op.f('ix_change_logs_id'), 'change_logs', ['id'], unique=False)
    op.create_index(op.f('ix_change_logs_user_id'), 'change_logs', ['user_id'], unique=False)

    # Create notifications table
    op.create_table('notifications',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('recipient_id', sa.Integer(), nullable=False),
    sa.Column('sender_id', sa.Integer(), nullable=True),
    sa.Column('defect_id', sa.Integer(), nullable=True),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('message', sa.Text(), nullable=True),
    sa.Column('notification_type', sa.String(length=50), nullable=False),
    sa.Column('is_read', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
    sa.CheckConstraint("notification_type IN ('defect_assigned', 'status_changed', 'comment_added', 'due_date_approaching', 'overdue')", name='notification_type_check'),
    sa.ForeignKeyConstraint(['defect_id'], ['defects.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['recipient_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'], unique=False)
    op.create_index(op.f('ix_notifications_recipient_id'), 'notifications', ['recipient_id'], unique=False)


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index(op.f('ix_notifications_recipient_id'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_id'), table_name='notifications')
    op.drop_table('notifications')
    
    op.drop_index(op.f('ix_change_logs_user_id'), table_name='change_logs')
    op.drop_index(op.f('ix_change_logs_id'), table_name='change_logs')
    op.drop_index(op.f('ix_change_logs_defect_id'), table_name='change_logs')
    op.drop_index(op.f('ix_change_logs_created_at'), table_name='change_logs')
    op.drop_table('change_logs')
    
    op.drop_index(op.f('ix_file_attachments_uploaded_by'), table_name='file_attachments')
    op.drop_index(op.f('ix_file_attachments_id'), table_name='file_attachments')
    op.drop_index(op.f('ix_file_attachments_defect_id'), table_name='file_attachments')
    op.drop_index(op.f('ix_file_attachments_comment_id'), table_name='file_attachments')
    op.drop_table('file_attachments')
    
    op.drop_index(op.f('ix_comments_id'), table_name='comments')
    op.drop_index(op.f('ix_comments_defect_id'), table_name='comments')
    op.drop_index(op.f('ix_comments_created_at'), table_name='comments')
    op.drop_index(op.f('ix_comments_author_id'), table_name='comments')
    op.drop_table('comments')
    
    op.drop_index(op.f('ix_reports_project_id'), table_name='reports')
    op.drop_index(op.f('ix_reports_id'), table_name='reports')
    op.drop_index(op.f('ix_reports_created_by'), table_name='reports')
    op.drop_index(op.f('ix_reports_created_at'), table_name='reports')
    op.drop_table('reports')
    
    op.drop_index(op.f('ix_defects_status_id'), table_name='defects')
    op.drop_index(op.f('ix_defects_reporter_id'), table_name='defects')
    op.drop_index(op.f('ix_defects_project_id'), table_name='defects')
    op.drop_index(op.f('ix_defects_priority_id'), table_name='defects')
    op.drop_index(op.f('ix_defects_number'), table_name='defects')
    op.drop_index(op.f('ix_defects_id'), table_name='defects')
    op.drop_index(op.f('ix_defects_created_at'), table_name='defects')
    op.drop_index(op.f('ix_defects_category_id'), table_name='defects')
    op.drop_index(op.f('ix_defects_assignee_id'), table_name='defects')
    op.drop_table('defects')
    
    op.drop_index(op.f('ix_user_roles_user_id'), table_name='user_roles')
    op.drop_index(op.f('ix_user_roles_project_id'), table_name='user_roles')
    op.drop_index(op.f('ix_user_roles_id'), table_name='user_roles')
    op.drop_table('user_roles')
    
    op.drop_index(op.f('ix_defect_categories_id'), table_name='defect_categories')
    op.drop_table('defect_categories')
    
    op.drop_index(op.f('ix_priorities_id'), table_name='priorities')
    op.drop_table('priorities')
    
    op.drop_index(op.f('ix_defect_statuses_id'), table_name='defect_statuses')
    op.drop_table('defect_statuses')
    
    op.drop_index(op.f('ix_projects_status'), table_name='projects')
    op.drop_index(op.f('ix_projects_is_active'), table_name='projects')
    op.drop_index(op.f('ix_projects_id'), table_name='projects')
    op.drop_table('projects')
    
    op.drop_index(op.f('ix_roles_id'), table_name='roles')
    op.drop_table('roles')
    
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_is_superuser'), table_name='users')
    op.drop_index(op.f('ix_users_is_active'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
