import { NextResponse } from 'next/server';

import { Pool } from 'pg';

const pool = new Pool({
   user: 'postgres',
   host: 'localhost',
   database: 'TRP',
   password: '12345678',
   port: 5169,
 });

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.status,
        COUNT(d.id) as defects_count,
        COUNT(DISTINCT ur.user_id) as team_size,
        MAX(d.found_date) as last_defect_date
      FROM projects p
      LEFT JOIN defects d ON p.id = d.project_id AND d.is_active = true
      LEFT JOIN user_roles ur ON p.id = ur.project_id
      WHERE p.is_active = true
      GROUP BY p.id, p.name, p.description, p.status
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
