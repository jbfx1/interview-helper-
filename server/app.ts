import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { appendToQueue } from './queue';

const bodySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  topic: z.string().min(3),
  message: z.string().min(10),
  urgency: z.enum(['normal', 'urgent'])
});

export type SupportRequestBody = z.infer<typeof bodySchema>;

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/support', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid payload', details: parsed.error.format() });
      }

      const entry = {
        ...parsed.data,
        id: randomUUID(),
        createdAt: new Date().toISOString()
      };

      await appendToQueue(entry);

      return res.status(201).json({ status: 'ok', id: entry.id });
    } catch (error) {
      return next(error);
    }
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    res.status(500).json({ error: 'Unexpected error handling support request' });
  });

  return app;
}
