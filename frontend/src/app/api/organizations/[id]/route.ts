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
        COUNT(d.id) as defects_count,
        COUNT(DISTINCT ur.user_id) as team_size,
        MAX(d.found_date) as last_defect_date
      FROM projects p
      LEFT JOIN defects d ON p.id = d.project_id AND d.is_active = true
      LEFT JOIN user_roles ur ON p.id = ur.project_id
      WHERE p.id = $1 AND p.is_active = true
      GROUP BY p.id, p.name, p.description, p.status, p.address, p.client_name;
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
