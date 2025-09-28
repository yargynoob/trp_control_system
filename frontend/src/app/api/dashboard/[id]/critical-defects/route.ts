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
        d.id,
        d.title,
        d.location,
        d.created_at,
        d.due_date,
        u.first_name || ' ' || u.last_name as assignee_name,
        pr.name as priority_name,
        ds.name as status_name,
        CASE 
          WHEN d.due_date IS NOT NULL AND d.due_date < CURRENT_DATE 
          THEN (CURRENT_DATE - d.due_date)
          ELSE 0
        END as overdue_days
      FROM defects d
      LEFT JOIN users u ON d.assignee_id = u.id
      LEFT JOIN priorities pr ON d.priority_id = pr.id
      LEFT JOIN defect_statuses ds ON d.status_id = ds.id
      WHERE d.project_id = $1 
        AND ds.name IN ('new', 'in_progress')
        AND (d.priority_id = 4 OR d.due_date < CURRENT_DATE)
      ORDER BY pr.urgency_level DESC, d.created_at ASC
      LIMIT 5;
    `, [id]);

    const formattedData = result.rows.map((defect: any) => {
      let overdueDays = 0;
      if (defect.overdue_days && defect.overdue_days !== 0) {

        if (typeof defect.overdue_days === 'number') {
          overdueDays = defect.overdue_days;
        } else {

          const match = defect.overdue_days.toString().match(/(\d+)/);
          overdueDays = match ? parseInt(match[1]) : 0;
        }
      }

      return {
        id: `DEF-${defect.id}`,
        title: defect.title,
        location: defect.location || 'Местоположение не указано',
        assignee: defect.assignee_name || 'Не назначен',
        overdueDays: Math.max(0, overdueDays)
      };
    });

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch critical defects' },
      { status: 500 }
    );
  }
}