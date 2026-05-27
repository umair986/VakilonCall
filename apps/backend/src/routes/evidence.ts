import { Router } from 'express';
import { authMiddleware, requireRegistered } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { supabaseAdmin } from '../utils/supabase';
import multer from 'multer';
import type { Request, Response } from 'express';

export const evidenceRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/webp',
      'application/pdf',
      'audio/mpeg', 'audio/m4a', 'audio/wav',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  },
});

// POST /api/v1/evidence/upload — Upload a document to the evidence locker
evidenceRouter.post(
  '/upload',
  authMiddleware,
  requireRegistered,
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const doc_type = req.body?.doc_type as string;
      if (!doc_type) {
        sendError(res, 400, 'VALIDATION_ERROR', 'doc_type is required');
        return;
      }

      const file = req.file;
      if (!file) {
        sendError(res, 400, 'VALIDATION_ERROR', 'File is required');
        return;
      }

      // Upload to Supabase Storage
      const fileName = `evidence/${req.user!.id}/${doc_type}_${Date.now()}.${file.originalname.split('.').pop()}`;
      const { data, error } = await supabaseAdmin.storage
        .from('user-documents')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        logger.error({ err: error }, 'Supabase storage upload failed');
        sendError(res, 500, 'EVIDENCE_UPLOAD_FAILED', 'Failed to upload document');
        return;
      }

      const { data: urlData } = supabaseAdmin.storage
        .from('user-documents')
        .getPublicUrl(data.path);

      // Save record in DB
      const doc = await prisma.evidenceDocument.create({
        data: {
          user_id: req.user!.id,
          doc_type,
          file_url: urlData.publicUrl,
          file_name: file.originalname,
          is_encrypted: false,
          metadata: {
            size_bytes: file.size,
            mime_type: file.mimetype,
            uploaded_at: new Date().toISOString(),
          },
        },
      });

      sendSuccess(res, {
        id: doc.id,
        doc_type: doc.doc_type,
        file_name: doc.file_name,
        created_at: doc.created_at.toISOString(),
      }, 201);
    } catch (err) {
      logger.error({ err }, 'evidence upload error');
      sendError(res, 500, 'EVIDENCE_UPLOAD_FAILED', 'Failed to upload document');
    }
  }
);

// GET /api/v1/evidence/documents — List user's evidence documents
evidenceRouter.get(
  '/documents',
  authMiddleware,
  requireRegistered,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const docs = await prisma.evidenceDocument.findMany({
        where: { user_id: req.user!.id },
        orderBy: { created_at: 'desc' },
      });

      sendSuccess(
        res,
        docs.map((d) => ({
          id: d.id,
          doc_type: d.doc_type,
          file_name: d.file_name,
          file_url: d.file_url,
          created_at: d.created_at.toISOString(),
        }))
      );
    } catch (err) {
      logger.error({ err }, 'list evidence error');
      sendError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch documents');
    }
  }
);

// DELETE /api/v1/evidence/:id — Delete an evidence document
evidenceRouter.delete(
  '/:id',
  authMiddleware,
  requireRegistered,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const doc = await prisma.evidenceDocument.findUnique({
        where: { id: req.params.id as string },
      });

      if (!doc || doc.user_id !== req.user!.id) {
        sendError(res, 404, 'EVIDENCE_NOT_FOUND', 'Document not found');
        return;
      }

      // Delete from storage
      const storagePath = doc.file_url.split('/user-documents/')[1];
      if (storagePath) {
        await supabaseAdmin.storage
          .from('user-documents')
          .remove([storagePath]);
      }

      // Delete from DB
      await prisma.evidenceDocument.delete({
        where: { id: doc.id },
      });

      sendSuccess(res, { message: 'Document deleted' });
    } catch (err) {
      logger.error({ err }, 'delete evidence error');
      sendError(res, 500, 'INTERNAL_ERROR', 'Failed to delete document');
    }
  }
);
