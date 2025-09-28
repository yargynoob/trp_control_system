import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'TRP',
  password: '12345678',
  port: 5169
});

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