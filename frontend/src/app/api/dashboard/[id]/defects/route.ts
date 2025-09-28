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
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    let query = `
      SELECT 
        d.id,
        d.title,
        d.description,
        ds.name as status,
        pr.name as priority,
        d.location,
        d.created_at,
        d.updated_at,
        d.due_date,
        u_assignee.first_name || ' ' || u_assignee.last_name as assignee_name,
        u_reporter.first_name || ' ' || u_reporter.last_name as reporter_name,
        ds.display_name as status_display,
        pr.display_name as priority_display
      FROM defects d
      LEFT JOIN defect_statuses ds ON d.status_id = ds.id
      LEFT JOIN priorities pr ON d.priority_id = pr.id
      LEFT JOIN users u_assignee ON d.assignee_id = u_assignee.id
      LEFT JOIN users u_reporter ON d.reporter_id = u_reporter.id
      WHERE d.project_id = $1
    `;

    const queryParams = [id];

    if (search) {
      query += ` AND (d.title ILIKE $2 OR d.description ILIKE $2)`;
      queryParams.push(`%${search}%`);
    }

    query += ` ORDER BY d.created_at DESC`;

    const result = await pool.query(query, queryParams);

    const formattedData = result.rows.map((defect: any) => ({
      id: defect.id,
      title: defect.title,
      description: defect.description,
      status: defect.status,
      statusDisplay: defect.status_display,
      priority: defect.priority,
      priorityDisplay: defect.priority_display,
      assignee: defect.assignee_name,
      reporter: defect.reporter_name,
      location: defect.location,
      createdAt: defect.created_at,
      updatedAt: defect.updated_at,
      dueDate: defect.due_date
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch defects' },
      { status: 500 }
    );
  }
}