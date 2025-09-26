import type { JSX } from 'react';
import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { z } from 'zod';
import { submitSupportRequest } from '../services/support';
import type { SupportRequestPayload } from '../types/support';
import './SupportForm.css';

const schema = z.object({
  name: z.string().min(2, 'Tell us who you are'),
  email: z.string().email('Provide a valid email so we can reply'),
  topic: z.string().min(3, 'Please add a short summary'),
  message: z.string().min(10, 'Let us know a bit more (10 characters minimum)'),
  urgency: z.enum(['normal', 'urgent'])
});

type FieldName = keyof SupportRequestPayload;

type FieldErrors = Partial<Record<FieldName, string>>;

const defaultValues: SupportRequestPayload = {
  name: '',
  email: '',
  topic: '',
  message: '',
  urgency: 'normal'
};

export default function SupportForm(): JSX.Element {
  const [values, setValues] = useState<SupportRequestPayload>(defaultValues);
  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    name: false,
    email: false,
    topic: false,
    message: false,
    urgency: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null);

  const errors: FieldErrors = useMemo(() => {
    const result = schema.safeParse(values);
    if (result.success) {
      return {};
    }

    const fieldErrors = result.error.flatten().fieldErrors;
    return Object.entries(fieldErrors).reduce<FieldErrors>((acc, [key, messages]) => {
      if (messages && messages.length > 0) {
        acc[key as FieldName] = messages[0];
      }
      return acc;
    }, {});
  }, [values]);

  const showError = (field: FieldName): string | undefined => {
    if (touched[field] || statusType === 'error') {
      return errors[field];
    }
    return undefined;
  };

  const handleChange = (field: FieldName) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { value } = event.target;
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: FieldName) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const resetForm = () => {
    setValues({ ...defaultValues });
    setTouched({
      name: false,
      email: false,
      topic: false,
      message: false,
      urgency: false
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);
    setStatusType(null);

    const result = schema.safeParse(values);
    if (!result.success) {
      setStatusMessage('Please fix the highlighted fields before submitting.');
      setStatusType('error');
      setTouched({
        name: true,
        email: true,
        topic: true,
        message: true,
        urgency: true
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await submitSupportRequest(result.data);
      setStatusMessage('Thanks! Your request has been queued. Reference #' + response.id);
      setStatusType('success');
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong submitting your request.';
      setStatusMessage(message);
      setStatusType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="support-form" onSubmit={handleSubmit} noValidate>
      <div className="support-form__group">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          value={values.name}
          onChange={handleChange('name')}
          onBlur={handleBlur('name')}
          aria-invalid={Boolean(showError('name'))}
          aria-describedby="name-error"
          autoComplete="name"
        />
        {showError('name') && (
          <p className="support-form__error" id="name-error">
            {showError('name')}
          </p>
        )}
      </div>

      <div className="support-form__group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange('email')}
          onBlur={handleBlur('email')}
          aria-invalid={Boolean(showError('email'))}
          aria-describedby="email-error"
          autoComplete="email"
        />
        {showError('email') && (
          <p className="support-form__error" id="email-error">
            {showError('email')}
          </p>
        )}
      </div>

      <div className="support-form__group">
        <label htmlFor="topic">Topic</label>
        <input
          id="topic"
          name="topic"
          type="text"
          value={values.topic}
          onChange={handleChange('topic')}
          onBlur={handleBlur('topic')}
          aria-invalid={Boolean(showError('topic'))}
          aria-describedby="topic-error"
        />
        {showError('topic') && (
          <p className="support-form__error" id="topic-error">
            {showError('topic')}
          </p>
        )}
      </div>

      <div className="support-form__group">
        <label htmlFor="message">How can we help?</label>
        <textarea
          id="message"
          name="message"
          rows={5}
          value={values.message}
          onChange={handleChange('message')}
          onBlur={handleBlur('message')}
          aria-invalid={Boolean(showError('message'))}
          aria-describedby="message-error"
        />
        {showError('message') && (
          <p className="support-form__error" id="message-error">
            {showError('message')}
          </p>
        )}
      </div>

      <fieldset className="support-form__group">
        <legend>How urgent is this?</legend>
        <div className="support-form__radio-group">
          <label>
            <input
              type="radio"
              name="urgency"
              value="normal"
              checked={values.urgency === 'normal'}
              onChange={handleChange('urgency')}
              onBlur={handleBlur('urgency')}
            />
            Normal
          </label>
          <label>
            <input
              type="radio"
              name="urgency"
              value="urgent"
              checked={values.urgency === 'urgent'}
              onChange={handleChange('urgency')}
              onBlur={handleBlur('urgency')}
            />
            Urgent
          </label>
        </div>
        {showError('urgency') && <p className="support-form__error">{showError('urgency')}</p>}
      </fieldset>

      <button type="submit" disabled={isSubmitting} className="support-form__submit">
        {isSubmitting ? 'Sending...' : 'Send message'}
      </button>

      {statusMessage && (
        <div className={`support-form__status support-form__status--${statusType}`} role="status">
          {statusMessage}
        </div>
      )}
    </form>
  );
}
