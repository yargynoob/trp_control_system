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
{ params }: {params: {id: string;};})
{
  try {
    const { id } = params;

    const result = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.status,
        p.address,
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

    const organization = result.rows[0];

    const formattedData = {
      id: organization.id,
      name: organization.name,
      description: organization.description,
      status: organization.status,
      address: organization.address,
      defectsCount: parseInt(organization.defects_count.toString()),
      teamSize: parseInt(organization.team_size.toString()),
      lastDefectDate: organization.last_defect_date
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