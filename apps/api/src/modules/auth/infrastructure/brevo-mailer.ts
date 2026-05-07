import { Injectable } from '@nestjs/common';
import { EnvService } from '../../../config/env.service';
import type { Mailer, SendMailInput } from '../domain/ports/mailer';

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

@Injectable()
export class BrevoMailer implements Mailer {
  constructor(private readonly env: EnvService) {}

  async send(input: SendMailInput): Promise<void> {
    const apiKey = this.env.brevoApiKey;
    if (!apiKey) {
      throw new Error('BREVO_API_KEY is not set');
    }

    const sender = parseFromHeader(this.env.smtp.from);

    const res = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender,
        to: [{ email: input.to }],
        subject: input.subject,
        htmlContent: input.html,
        textContent: input.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Brevo API ${res.status}: ${body.slice(0, 300)}`);
    }
  }
}

// Accepts either `name@host` or `Display Name <name@host>` and
// returns Brevo's `{name?, email}` shape.
function parseFromHeader(value: string): { name?: string; email: string } {
  const match = /^\s*(.+?)\s*<\s*([^>]+)\s*>\s*$/.exec(value);
  if (match) {
    return { name: match[1], email: match[2]! };
  }
  return { email: value.trim() };
}
