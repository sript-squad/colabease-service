import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('suggest-tasks')
  async suggestTasks(@Body() body: { name: string; description?: string }) {
    const tasks = await this.aiService.suggestTasks(body.name, body.description);
    return { tasks };
  }
}
