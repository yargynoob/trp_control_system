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
        'defect_change' as source_type,
        cl.id,
        cl.defect_id,
        cl.field_name,
        cl.old_value,
        cl.new_value,
        cl.change_type,
        cl.created_at,
        d.title as defect_title,
        (u.first_name || ' ' || u.last_name) as user_name
      FROM change_logs cl
      JOIN defects d ON cl.defect_id = d.id
      JOIN users u ON cl.user_id = u.id
      WHERE d.project_id = $1 AND cl.field_name != 'attachment'
      
      UNION ALL
      
      SELECT 
        'defect_created' as source_type,
        d.id,
        d.id as defect_id,
        'created' as field_name,
        null as old_value,
        d.title as new_value,
        'create' as change_type,
        d.created_at,
        d.title as defect_title,
        (u.first_name || ' ' || u.last_name) as user_name
      FROM defects d
      JOIN users u ON d.reporter_id = u.id
      WHERE d.project_id = $1
      
      ORDER BY created_at DESC
      LIMIT 10;
    `, [id]);

    const formattedData = result.rows.map((action: any, index: number) => {
      const createdAt = new Date(action.created_at);
      const time = createdAt.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      });

      let actionText = '';
      const defectId = `TRP-${action.defect_id}`;

      if (action.source_type === 'defect_created') {
        actionText = `создал дефект ${defectId} "${action.defect_title}"`;
      } else {
        switch (action.field_name) {
          case 'description':
            actionText = `изменил описание дефекта ${defectId}`;
            break;
          case 'attachment':
            actionText = `добавил файл "${action.new_value}" к дефекту ${defectId}`;
            break;
          case 'status':
            actionText = `изменил статус дефекта ${defectId} с "${action.old_value}" на "${action.new_value}"`;
            break;
          case 'assignee':
            actionText = `назначил дефект ${defectId} пользователю ${action.new_value}`;
            break;
          default:
            actionText = `обновил поле "${action.field_name}" дефекта ${defectId}`;
        }
      }

      return {
        id: `${action.id}-${index}`,
        time: time,
        user: action.user_name || 'Неизвестный пользователь',
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