import { NextResponse } from 'next/server';

import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'TRP',
  password: '12345678',
  port: 5169,
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
        p.status,
        p.address,
        p.client_name,
        COALESCE(defect_stats.defects_count, 0) as defects_count,
        COALESCE(team_stats.team_size, 0) as team_size,
        defect_stats.last_defect_date
      FROM projects p
      LEFT JOIN (
        SELECT 
          project_id,
          COUNT(*) as defects_count,
          MAX(found_date) as last_defect_date
        FROM defects 
        WHERE is_active = true AND project_id = $1
        GROUP BY project_id
      ) defect_stats ON p.id = defect_stats.project_id
      LEFT JOIN (
        SELECT 
          project_id,
          COUNT(DISTINCT user_id) as team_size
        FROM user_roles 
        WHERE project_id = $1
        GROUP BY project_id
      ) team_stats ON p.id = team_stats.project_id
      WHERE p.id = $1 AND p.is_active = true;
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
      clientName: organization.client_name,
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
