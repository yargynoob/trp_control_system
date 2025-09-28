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
        d.id as defect_id,
        d.title,
        d.created_at,
        d.updated_at,
        ds.name as status,
        ds.display_name as status_display,
        u_reporter.first_name || ' ' || u_reporter.last_name as reporter_name,
        u_assignee.first_name || ' ' || u_assignee.last_name as assignee_name
      FROM defects d
      LEFT JOIN defect_statuses ds ON d.status_id = ds.id
      LEFT JOIN users u_reporter ON d.reporter_id = u_reporter.id
      LEFT JOIN users u_assignee ON d.assignee_id = u_assignee.id
      WHERE d.project_id = $1
      ORDER BY d.created_at DESC
      LIMIT 10;
    `, [id]);

    const formattedData = result.rows.map((action: any, index: number) => {
      const createdAt = new Date(action.created_at);
      const updatedAt = new Date(action.updated_at);


      const isNew = createdAt.getTime() === updatedAt.getTime();
      const actionTime = isNew ? createdAt : updatedAt;

      const time = actionTime.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      });

      let actionText = '';
      const defectId = `DEF-${action.defect_id}`;

      if (isNew) {
        actionText = `создал дефект ${defectId} "${action.title}"`;
      } else {
        switch (action.status) {
          case 'new':
            actionText = `создал дефект ${defectId}`;
            break;
          case 'in_progress':
            actionText = `изменил статус ${defectId} на '${action.status_display}'`;
            break;
          case 'review':
            actionText = `отправил ${defectId} на проверку`;
            break;
          case 'closed':
            actionText = `закрыл дефект ${defectId}`;
            break;
          case 'cancelled':
            actionText = `отменил дефект ${defectId}`;
            break;
          default:
            actionText = `обновил дефект ${defectId}`;
        }
      }

      return {
        id: `${action.defect_id}-${index}`,
        time: time,
        user: action.reporter_name || 'Неизвестный пользователь',
        action: actionText
      };
    });

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent actions' },
      { status: 500 }
    );
  }
}