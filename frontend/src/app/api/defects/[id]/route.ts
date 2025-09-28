import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'TRP',
  password: '12345678',
  port: 5169
});

export async function PUT(
request: Request,
{ params }: {params: {id: string;};})
{
  try {
    const { id } = params;
    const body = await request.json();
    const { description } = body;

    const userResult = await pool.query('SELECT id FROM users WHERE is_active = true LIMIT 1');
    const userId = userResult.rows[0]?.id || 1;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const oldDefectResult = await client.query('SELECT description FROM defects WHERE id = $1', [id]);
      const oldDescription = oldDefectResult.rows[0]?.description;

      const result = await client.query(`
        UPDATE defects 
        SET description = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, title
      `, [description, id]);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Defect not found' },
          { status: 404 }
        );
      }

      await client.query(`
        INSERT INTO change_logs (defect_id, user_id, field_name, old_value, new_value, change_type)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [id, userId, 'description', oldDescription, description, 'update']);

      await client.query('COMMIT');

      return NextResponse.json({
        message: 'Defect updated successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to update defect' },
      { status: 500 }
    );
  }
}

export async function DELETE(
request: Request,
{ params }: {params: {id: string;};})
{
  try {
    const { id } = params;


    const client = await pool.connect();

    try {
      await client.query('BEGIN');


      await client.query('DELETE FROM file_attachments WHERE defect_id = $1', [id]);


      await client.query('DELETE FROM comments WHERE defect_id = $1', [id]);


      await client.query('DELETE FROM change_logs WHERE defect_id = $1', [id]);


      await client.query('DELETE FROM notifications WHERE defect_id = $1', [id]);


      const result = await client.query('DELETE FROM defects WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Defect not found' },
          { status: 404 }
        );
      }

      await client.query('COMMIT');

      return NextResponse.json({
        message: 'Defect deleted successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to delete defect' },
      { status: 500 }
    );
  }
}