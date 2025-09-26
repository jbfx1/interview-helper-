import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import SupportForm from './SupportForm';
import { submitSupportRequest } from '../services/support';

vi.mock('../services/support', () => ({
  submitSupportRequest: vi.fn()
}));

describe('SupportForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows inline errors when submitting empty form', async () => {
    render(<SupportForm />);

    await userEvent.click(screen.getByRole('button', { name: /send message/i }));

    expect(await screen.findByText(/please fix the highlighted fields/i)).toBeInTheDocument();
    expect(screen.getByText(/tell us who you are/i)).toBeInTheDocument();
    expect(screen.getByText(/provide a valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/please add a short summary/i)).toBeInTheDocument();
  });

  it('submits successfully when fields are valid', async () => {
    vi.mocked(submitSupportRequest).mockResolvedValue({ status: 'ok', id: 'abc123' });

    render(<SupportForm />);

    await userEvent.type(screen.getByLabelText(/name/i), 'Ada Lovelace');
    await userEvent.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await userEvent.type(screen.getByLabelText(/topic/i), 'Mock interviews');
    await userEvent.type(screen.getByLabelText(/how can we help/i), 'Help me prepare for system design.');
    await userEvent.click(screen.getByLabelText(/urgent/i));

    await userEvent.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(submitSupportRequest).toHaveBeenCalledWith({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        topic: 'Mock interviews',
        message: 'Help me prepare for system design.',
        urgency: 'urgent'
      });
    });

    expect(await screen.findByText(/your request has been queued/i)).toBeInTheDocument();
  });

  it('reports an error when the API call fails', async () => {
    vi.mocked(submitSupportRequest).mockRejectedValue(new Error('Network down'));

    render(<SupportForm />);

    await userEvent.type(screen.getByLabelText(/name/i), 'Ada Lovelace');
    await userEvent.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await userEvent.type(screen.getByLabelText(/topic/i), 'Mock interviews');
    await userEvent.type(screen.getByLabelText(/how can we help/i), 'Help me prepare for system design.');

    await userEvent.click(screen.getByRole('button', { name: /send message/i }));

    expect(await screen.findByText(/network down/i)).toBeInTheDocument();
  });
});
