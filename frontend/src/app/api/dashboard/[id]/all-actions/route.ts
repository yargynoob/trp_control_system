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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const query = `
      SELECT 
        cl.id,
        cl.created_at,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        CASE 
          WHEN cl.change_type = 'create' THEN 'создал дефект'
          WHEN cl.change_type = 'update' AND cl.field_name = 'status_id' THEN 
            CONCAT('изменил статус с "', 
              CASE 
                WHEN old_status.display_name = 'Новая' THEN 'Новый'
                WHEN old_status.display_name = 'Закрыта' THEN 'Закрыт'
                WHEN old_status.display_name = 'Отменена' THEN 'Отменен'
                ELSE old_status.display_name
              END, 
              '" на "', 
              CASE 
                WHEN new_status.display_name = 'Новая' THEN 'Новый'
                WHEN new_status.display_name = 'Закрыта' THEN 'Закрыт'
                WHEN new_status.display_name = 'Отменена' THEN 'Отменен'
                ELSE new_status.display_name
              END, '"')
          WHEN cl.change_type = 'update' AND cl.field_name = 'priority_id' THEN 
            CONCAT('изменил приоритет с "', old_priority.display_name, '" на "', new_priority.display_name, '"')
          WHEN cl.change_type = 'update' AND cl.field_name = 'assignee_id' THEN 
            CONCAT('изменил исполнителя с "', old_user.first_name, ' ', old_user.last_name, '" на "', new_user.first_name, ' ', new_user.last_name, '"')
          WHEN cl.change_type = 'update' AND cl.field_name = 'description' THEN 'обновил описание дефекта'
          WHEN cl.change_type = 'update' AND cl.field_name = 'attachment' THEN 'добавил файл к дефекту'
          WHEN cl.change_type = 'delete' THEN 'удалил дефект'
          WHEN cl.change_type = 'status_change' THEN 
            CONCAT('изменил статус с "', 
              CASE 
                WHEN old_status.display_name = 'Новая' THEN 'Новый'
                WHEN old_status.display_name = 'Закрыта' THEN 'Закрыт'
                WHEN old_status.display_name = 'Отменена' THEN 'Отменен'
                ELSE old_status.display_name
              END, 
              '" на "', 
              CASE 
                WHEN new_status.display_name = 'Новая' THEN 'Новый'
                WHEN new_status.display_name = 'Закрыта' THEN 'Закрыт'
                WHEN new_status.display_name = 'Отменена' THEN 'Отменен'
                ELSE new_status.display_name
              END, '"')
          ELSE CONCAT('изменил поле ', cl.field_name)
        END as action,
        d.id as defect_id,
        d.title as defect_title
      FROM change_logs cl
      LEFT JOIN users u ON cl.user_id = u.id
      LEFT JOIN defects d ON cl.defect_id = d.id
      LEFT JOIN defect_statuses old_status ON cl.old_value = old_status.id::text
      LEFT JOIN defect_statuses new_status ON cl.new_value = new_status.id::text
      LEFT JOIN priorities old_priority ON cl.old_value = old_priority.id::text
      LEFT JOIN priorities new_priority ON cl.new_value = new_priority.id::text
      LEFT JOIN users old_user ON cl.old_value = old_user.id::text
      LEFT JOIN users new_user ON cl.new_value = new_user.id::text
      WHERE d.project_id = $1
      ORDER BY cl.created_at DESC
      LIMIT 100
    `;

    const result = await pool.query(query, [id]);

    const formattedData = result.rows.map((row: any) => ({
      id: row.id,
      time: new Date(row.created_at).toLocaleString('ru-RU'),
      user: row.user_name || 'Неизвестный пользователь',
      action: row.action,
      defectId: row.defect_id,
      defectTitle: row.defect_title
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch all actions' },
      { status: 500 }
    );
  }
}
