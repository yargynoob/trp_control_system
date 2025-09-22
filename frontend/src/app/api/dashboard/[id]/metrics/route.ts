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
        COUNT(*) as total_defects,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'open' AND found_date < NOW() - INTERVAL '7 days' THEN 1 END) as overdue
      FROM defects 
      WHERE project_id = $1 AND is_active = true;
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({
        totalDefects: 0,
        inProgress: 0,
        overdue: 0
      });
    }

    const metrics = result.rows[0];
    
    const formattedData = {
      totalDefects: parseInt(metrics.total_defects.toString()),
      inProgress: parseInt(metrics.in_progress.toString()),
      overdue: parseInt(metrics.overdue.toString())
    };

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
