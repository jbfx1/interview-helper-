import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { submitSupportRequest } from './support';

const payload = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  topic: 'Mock interviews',
  message: 'Help me prepare for system design.',
  urgency: 'normal' as const
};

describe('submitSupportRequest', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    global.fetch = originalFetch;
  });

  it('throws when the API URL is missing', async () => {
    vi.stubEnv('VITE_SUPPORT_API_URL', '');
    await expect(submitSupportRequest(payload)).rejects.toThrow(/not configured/i);
  });

  it('sends the payload to the configured endpoint', async () => {
    vi.stubEnv('VITE_SUPPORT_API_URL', 'https://api.test/support');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'ok', id: '123' })
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const response = await submitSupportRequest(payload);

    expect(fetchMock).toHaveBeenCalledWith('https://api.test/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    expect(response).toEqual({ status: 'ok', id: '123' });
  });

  it('throws when the server returns an error response', async () => {
    vi.stubEnv('VITE_SUPPORT_API_URL', 'https://api.test/support');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      text: () => Promise.resolve('nope')
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(submitSupportRequest(payload)).rejects.toThrow(/nope/);
  });

  it('throws when the response is malformed', async () => {
    vi.stubEnv('VITE_SUPPORT_API_URL', 'https://api.test/support');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({})
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(submitSupportRequest(payload)).rejects.toThrow(/malformed/i);
  });
});
