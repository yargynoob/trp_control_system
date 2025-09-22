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
        d.id,
        d.title,
        d.location,
        d.found_date,
        u.first_name || ' ' || u.last_name as assignee_name,
        EXTRACT(days FROM NOW() - d.found_date) as overdue_days
      FROM defects d
      LEFT JOIN users u ON d.assignee_id = u.id
      WHERE d.project_id = $1 
        AND d.is_active = true 
        AND d.priority = 'critical'
        AND d.status IN ('open', 'in_progress')
        AND d.found_date < NOW() - INTERVAL '3 days'
      ORDER BY d.found_date ASC
      LIMIT 5;
    `, [id]);

    const formattedData = result.rows.map((defect: any) => ({
      id: `TRP-${defect.id}`,
      title: defect.title,
      location: defect.location || 'Местоположение не указано',
      assignee: defect.assignee_name || 'Не назначен',
      overdueDays: parseInt(defect.overdue_days.toString()) || 0
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch critical defects' },
      { status: 500 }
    );
  }
}
