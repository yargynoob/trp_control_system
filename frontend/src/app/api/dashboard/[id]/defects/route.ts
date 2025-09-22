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
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    let query = `
      SELECT 
        d.id,
        d.title,
        d.description,
        d.status,
        d.priority,
        d.severity,
        d.location,
        d.equipment,
        d.defect_type,
        d.found_date,
        d.updated_at,
        u_assignee.first_name || ' ' || u_assignee.last_name as assignee_name,
        u_reporter.first_name || ' ' || u_reporter.last_name as reporter_name
      FROM defects d
      LEFT JOIN users u_assignee ON d.assignee_id = u_assignee.id
      LEFT JOIN users u_reporter ON d.reporter_id = u_reporter.id
      WHERE d.project_id = $1 AND d.is_active = true
    `;

    const queryParams = [id];

    if (search) {
      query += ` AND (d.title ILIKE $2 OR d.description ILIKE $2)`;
      queryParams.push(`%${search}%`);
    }

    query += ` ORDER BY d.found_date DESC`;

    const result = await pool.query(query, queryParams);

    const formattedData = result.rows.map((defect: any) => ({
      id: defect.id,
      title: defect.title,
      description: defect.description,
      status: defect.status,
      priority: defect.priority,
      severity: defect.severity,
      assignee: defect.assignee_name,
      reporter: defect.reporter_name,
      location: defect.location,
      equipment: defect.equipment,
      defectType: defect.defect_type,
      foundDate: defect.found_date,
      updatedAt: defect.updated_at
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
