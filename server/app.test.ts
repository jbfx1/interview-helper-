import request from 'supertest';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { createApp } from './app';

const validPayload = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  topic: 'Mock interviews',
  message: 'Help me prepare for system design.',
  urgency: 'normal'
};

describe('support API', () => {
  let tempDir: string;
  let queueFile: string;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), 'support-'));
    queueFile = path.join(tempDir, 'queue.json');
    process.env.SUPPORT_QUEUE_FILE = queueFile;
  });

  afterEach(() => {
    delete process.env.SUPPORT_QUEUE_FILE;
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('persists support requests to the queue file', async () => {
    const app = createApp();

    const response = await request(app).post('/support').send(validPayload).expect(201);

    expect(response.body).toMatchObject({ status: 'ok' });
    const queue = JSON.parse(readFileSync(queueFile, 'utf-8'));
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({
      name: validPayload.name,
      email: validPayload.email,
      topic: validPayload.topic,
      message: validPayload.message,
      urgency: validPayload.urgency,
      id: expect.any(String),
      createdAt: expect.any(String)
    });
  });

  it('rejects invalid payloads', async () => {
    const app = createApp();

    const response = await request(app).post('/support').send({}).expect(400);

    expect(response.body.error).toBe('Invalid payload');
  });
});
