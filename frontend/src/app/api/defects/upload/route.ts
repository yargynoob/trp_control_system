import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs/promises';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'TRP',
  password: '12345678',
  port: 5169
});

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const defectId = formData.get('defectId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!defectId) {
      return NextResponse.json(
        { error: 'Defect ID is required' },
        { status: 400 }
      );
    }


    try {
      await fs.access(UPLOAD_DIR);
    } catch {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
    }


    const fileExtension = path.extname(file.name);
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, fileName);


    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filePath, buffer);


    const fileType = file.type.startsWith('image/') ? 'image' : 'document';


    const userResult = await pool.query('SELECT id FROM users WHERE is_active = true LIMIT 1');
    const uploadedBy = userResult.rows[0]?.id || 1;


    const result = await pool.query(`
      INSERT INTO file_attachments (
        defect_id, 
        filename, 
        original_name, 
        file_path, 
        file_size, 
        content_type,
        uploaded_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id;
    `, [
    parseInt(defectId),
    fileName,
    file.name,
    `/uploads/${fileName}`,
    file.size,
    file.type,
    uploadedBy]
    );

    return NextResponse.json({
      id: result.rows[0].id,
      message: 'File uploaded successfully',
      filePath: `/uploads/${fileName}`
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}