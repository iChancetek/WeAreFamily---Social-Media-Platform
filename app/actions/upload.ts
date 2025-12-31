'use server'

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function uploadFile(formData: FormData) {
    const file = formData.get('file') as File;

    if (!file) {
        throw new Error('No file uploaded');
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure unique filename
    const uniqueName = `${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;

    // Save to public/uploads
    const uploadDir = join(process.cwd(), 'public', 'uploads');

    // Ensure dir exists (redundant safety)
    await mkdir(uploadDir, { recursive: true });

    const path = join(uploadDir, uniqueName);
    await writeFile(path, buffer);

    return `/uploads/${uniqueName}`;
}
