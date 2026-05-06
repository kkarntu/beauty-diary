import { Injectable, type OnModuleInit } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import { EnvService } from '../../../config/env.service';
import type { Mailer, SendMailInput } from '../domain/ports/mailer';

@Injectable()
export class NodemailerMailer implements Mailer, OnModuleInit {
  private transporter!: Transporter;

  constructor(private readonly env: EnvService) {}

  onModuleInit(): void {
    const smtp = this.env.smtp;
    this.transporter = createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: smtp.user
        ? {
            user: smtp.user,
            pass: smtp.pass,
          }
        : undefined,
    });
  }

  async send(input: SendMailInput): Promise<void> {
    await this.transporter.sendMail({
      from: this.env.smtp.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
  }
}
