import { NextResponse } from 'next/server';

import { Pool } from 'pg';

const pool = new Pool({
   user: 'postgres',
   host: 'localhost',
   database: 'TRP',
   password: '12345678',
   port: 5169,
 });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, address, userRoles } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const projectResult = await client.query(`
        INSERT INTO projects (name, description, address, status, is_active)
        VALUES ($1, $2, $3, 'active', true)
        RETURNING id;
      `, [name, description || null, address || null]);

      const projectId = projectResult.rows[0].id;

      if (userRoles && userRoles.length > 0) {
        for (const userRole of userRoles) {
          // Получаем ID роли по названию
          const roleResult = await client.query(`
            SELECT id FROM roles WHERE name = $1
          `, [userRole.role]);
          
          if (roleResult.rows.length > 0) {
            const roleId = roleResult.rows[0].id;
            await client.query(`
              INSERT INTO user_roles (user_id, role_id, project_id, granted_by)
              VALUES ($1, $2, $3, 1);
            `, [parseInt(userRole.userId), roleId, projectId]);
          }
        }
      }

      await client.query('COMMIT');

      return NextResponse.json({ 
        id: projectId,
        message: 'Organization created successfully' 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.status,
        COALESCE(defect_stats.defects_count, 0) as defects_count,
        COALESCE(team_stats.team_size, 0) as team_size,
        defect_stats.last_defect_date
      FROM projects p
      LEFT JOIN (
        SELECT 
          d.project_id,
          COUNT(*) as defects_count,
          MAX(d.created_at) as last_defect_date
        FROM defects d
        GROUP BY d.project_id
      ) defect_stats ON p.id = defect_stats.project_id
      LEFT JOIN (
        SELECT 
          ur.project_id,
          COUNT(DISTINCT ur.user_id) as team_size
        FROM user_roles ur
        GROUP BY ur.project_id
      ) team_stats ON p.id = team_stats.project_id
      ORDER BY p.id;
    `);

    const formattedData = result.rows.map((org: any) => ({
      id: org.id,
      name: org.name,
      description: org.description,
      status: org.status,
      defectsCount: parseInt(org.defects_count.toString()),
      teamSize: parseInt(org.team_size.toString()),
      lastDefectDate: org.last_defect_date
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}
