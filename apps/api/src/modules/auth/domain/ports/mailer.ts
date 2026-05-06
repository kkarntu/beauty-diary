export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface Mailer {
  send(input: SendMailInput): Promise<void>;
}

export const MAILER = Symbol('MAILER');
