export interface SupportRequestPayload {
  name: string;
  email: string;
  topic: string;
  message: string;
  urgency: 'normal' | 'urgent';
}

export interface SupportResponse {
  status: 'ok';
  id: string;
}
