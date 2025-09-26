import { z } from 'zod';
import type { SupportRequestPayload, SupportResponse } from '../types/support';

const responseSchema = z.object({
  status: z.literal('ok'),
  id: z.string()
});

function getApiUrl(): string {
  const url = import.meta.env.VITE_SUPPORT_API_URL as string | undefined;
  if (!url) {
    throw new Error('Support API URL is not configured. Set VITE_SUPPORT_API_URL.');
  }
  return url;
}

export async function submitSupportRequest(payload: SupportRequestPayload): Promise<SupportResponse> {
  const response = await fetch(getApiUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Unable to submit support request');
  }

  const json = await response.json();
  const parsed = responseSchema.safeParse(json);

  if (!parsed.success) {
    throw new Error('Received malformed response from support API');
  }

  return parsed.data;
}

export { getApiUrl };
