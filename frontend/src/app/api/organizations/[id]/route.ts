import { NextResponse } from 'next/server';

import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'TRP',
  password: '12345678',
  port: 5169
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const result = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.address,
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
        WHERE d.project_id = $1
        GROUP BY d.project_id
      ) defect_stats ON p.id = defect_stats.project_id
      LEFT JOIN (
        SELECT 
          ur.project_id,
          COUNT(DISTINCT ur.user_id) as team_size
        FROM user_roles ur
        WHERE ur.project_id = $1
        GROUP BY ur.project_id
      ) team_stats ON p.id = team_stats.project_id
      WHERE p.id = $1;
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const usersResult = await pool.query(`
      SELECT 
        ur.user_id as "userId",
        r.name as role,
        (u.first_name || ' ' || u.last_name) as "userName"
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      JOIN users u ON ur.user_id = u.id
      WHERE ur.project_id = $1
    `, [id]);

    const organization = result.rows[0];

    const formattedData = {
      id: organization.id,
      name: organization.name,
      description: organization.description,
      status: organization.status,
      address: organization.address,
      defectsCount: parseInt(organization.defects_count.toString()),
      teamSize: parseInt(organization.team_size.toString()),
      lastDefectDate: organization.last_defect_date,
      users: usersResult.rows
    };

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
}

export async function PUT(
request: Request,
{ params }: {params: {id: string;};})
{
  try {
    const { id } = params;
    const body = await request.json();
    const { name, description, address, users } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      await client.query(`
        UPDATE projects 
        SET name = $1, description = $2, address = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [name, description || null, address || null, id]);

      if (users && Array.isArray(users)) {
        await client.query(`
          DELETE FROM user_roles WHERE project_id = $1
        `, [id]);

        for (const user of users) {
          const roleResult = await client.query(`
            SELECT id FROM roles WHERE name = $1
          `, [user.role]);

          if (roleResult.rows.length > 0) {
            const roleId = roleResult.rows[0].id;
            await client.query(`
              INSERT INTO user_roles (user_id, role_id, project_id, granted_by)
              VALUES ($1, $2, $3, 1)
            `, [parseInt(user.userId), roleId, id]);
          }
        }
      }

      await client.query('COMMIT');

      return NextResponse.json({
        message: 'Organization updated successfully'
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
      { error: 'Failed to update organization' },
      { status: 500 }
    );
  }
}

export async function DELETE(
request: Request,
{ params }: {params: {id: string;};})
{
  try {
    const { id } = params;


    const client = await pool.connect();

    try {
      await client.query('BEGIN');


      await client.query('DELETE FROM defects WHERE project_id = $1', [id]);


      await client.query('DELETE FROM user_roles WHERE project_id = $1', [id]);


      const result = await client.query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        );
      }

      await client.query('COMMIT');

      return NextResponse.json({
        message: 'Organization deleted successfully'
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
      { error: 'Failed to delete organization' },
      { status: 500 }
    );
  }
}