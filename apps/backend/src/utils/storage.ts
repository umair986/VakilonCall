import fs from 'fs';
import path from 'path';
import { logger } from './logger';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

/**
 * Ensure the uploads directory and any nested subdirectory exist.
 */
function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Create root uploads dir on import
ensureDir(UPLOADS_DIR);

/**
 * Save a file buffer to the local uploads directory.
 * @returns The relative path from the uploads root (use for DB storage and URL generation).
 */
export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  _mimeType: string
): Promise<string> {
  const fullPath = path.join(UPLOADS_DIR, fileName);
  const dir = path.dirname(fullPath);
  ensureDir(dir);

  await fs.promises.writeFile(fullPath, buffer);
  logger.info({ fileName }, 'File uploaded locally');
  return fileName;
}

/**
 * Delete a file from the local uploads directory.
 */
export async function deleteFile(filePath: string): Promise<void> {
  const fullPath = path.join(UPLOADS_DIR, filePath);
  try {
    await fs.promises.unlink(fullPath);
    logger.info({ filePath }, 'File deleted locally');
  } catch (err) {
    logger.warn({ err, filePath }, 'Failed to delete local file (may not exist)');
  }
}

/**
 * Get a publicly-accessible URL for a stored file.
 * In local dev, this serves through the express static middleware.
 */
export function getPublicUrl(filePath: string): string {
  const port = process.env.PORT ?? '3000';
  return `http://localhost:${port}/uploads/${filePath}`;
}

/**
 * Get the absolute path to the uploads directory (for express.static).
 */
export function getUploadsDir(): string {
  return UPLOADS_DIR;
}
