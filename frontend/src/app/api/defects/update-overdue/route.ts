import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'TRP',
  password: '12345678',
  port: 5169
});

export async function POST() {
  try {
    const result = await pool.query('SELECT update_overdue_defects_priority() as updated_count');
    const updatedCount = result.rows[0]?.updated_count || 0;

    return NextResponse.json({
      message: `Updated ${updatedCount} overdue defects to critical priority`,
      updatedCount
    });
  } catch (error) {
    console.error('Error updating overdue defects:', error);
    return NextResponse.json(
      { error: 'Failed to update overdue defects' },
      { status: 500 }
    );
  }
}
