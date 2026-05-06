import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { SubscribeNewsletterDto } from '@beauty-diary/shared';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { SubscribeNewsletterCommand } from '../application/commands/subscribe.command';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.NO_CONTENT)
  async subscribe(
    @Body(new ZodValidationPipe(SubscribeNewsletterDto)) body: SubscribeNewsletterDto,
  ): Promise<void> {
    await this.commandBus.execute(new SubscribeNewsletterCommand(body.email));
  }
}
