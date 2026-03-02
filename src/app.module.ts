import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProjectManagementModule } from './project-management/project-management.module';
import { TaskManagementModule } from './task-management/task-management.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AiModule } from './ai/ai.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/colabease'),
    ProjectManagementModule,
    TaskManagementModule,
    NotificationsModule,
    AiModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
