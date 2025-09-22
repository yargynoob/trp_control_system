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
        WHERE is_active = true 
        GROUP BY project_id
      ) defect_stats ON p.id = defect_stats.project_id
      LEFT JOIN (
        SELECT 
          project_id,
          COUNT(DISTINCT user_id) as team_size
        FROM user_roles 
        GROUP BY project_id
      ) team_stats ON p.id = team_stats.project_id
      WHERE p.is_active = true
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
