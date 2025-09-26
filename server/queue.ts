import { promises as fs } from 'fs';
import path from 'path';

export interface StoredSupportRequest {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  urgency: 'normal' | 'urgent';
  createdAt: string;
}

function resolveQueueFilePath(): string {
  const envPath = process.env.SUPPORT_QUEUE_FILE;
  if (envPath) {
    return path.isAbsolute(envPath) ? envPath : path.resolve(process.cwd(), envPath);
  }
  return path.resolve(process.cwd(), 'data', 'support-queue.json');
}

async function ensureFile(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, '[]', 'utf-8');
  }
}

export async function appendToQueue(entry: StoredSupportRequest): Promise<void> {
  const filePath = resolveQueueFilePath();
  await ensureFile(filePath);
  const queue = await readQueue();
  queue.push(entry);
  await fs.writeFile(filePath, JSON.stringify(queue, null, 2), 'utf-8');
}

export async function readQueue(): Promise<StoredSupportRequest[]> {
  const filePath = resolveQueueFilePath();
  await ensureFile(filePath);
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content) as StoredSupportRequest[];
}

export function queueFilePath(): string {
  return resolveQueueFilePath();
}
