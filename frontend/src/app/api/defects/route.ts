import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'TRP',
  password: '12345678',
  port: 5169
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      location,
      defectType,
      priority,
      projectId,
      assigneeId,
      deadline
    } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Defect title is required' },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }


    const userResult = await pool.query('SELECT id FROM users WHERE is_active = true LIMIT 1');
    const reporterId = userResult.rows[0]?.id || 1;


    const statusResult = await pool.query('SELECT id FROM defect_statuses WHERE name = $1', ['new']);
    const priorityResult = await pool.query('SELECT id FROM priorities WHERE name = $1', [priority]);

    const statusId = statusResult.rows[0]?.id || 1;
    const priorityId = priorityResult.rows[0]?.id || 2;

    const result = await pool.query(`
      INSERT INTO defects (
        title, 
        description, 
        status_id, 
        priority_id, 
        project_id, 
        reporter_id, 
        assignee_id, 
        location, 
        due_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id;
    `, [
    title,
    description || null,
    statusId,
    priorityId,
    projectId,
    reporterId,
    assigneeId || null,
    location || null,
    deadline || null]
    );

    const defectId = result.rows[0].id;

    return NextResponse.json({
      id: defectId,
      message: 'Defect created successfully'
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to create defect' },
      { status: 500 }
    );
  }
}