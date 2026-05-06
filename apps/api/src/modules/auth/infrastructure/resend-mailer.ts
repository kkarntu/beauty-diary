import { Injectable, Logger } from '@nestjs/common';
import { EnvService } from '../../../config/env.service';
import type { Mailer, SendMailInput } from '../domain/ports/mailer';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

@Injectable()
export class ResendMailer implements Mailer {
  private readonly logger = new Logger(ResendMailer.name);

  constructor(private readonly env: EnvService) {}

  async send(input: SendMailInput): Promise<void> {
    const apiKey = this.env.resendApiKey;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not set');
    }

    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.env.smtp.from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Resend API ${res.status}: ${body.slice(0, 300)}`);
    }
  }
}
