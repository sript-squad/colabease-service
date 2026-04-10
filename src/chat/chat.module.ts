import { Module } from '@nestjs/common';
import { MessageController } from './message.controller';
import { ChatRoomController } from './chat-room.controller';
import { MessageService } from './message.service';
import { ChatRoomService } from './chat-room.service';
import { ChatGateway } from './chat.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { ChatRoom, ChatRoomSchema } from './schemas/chat-room.schema';
import { Message, MessageSchema } from './schemas/message.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ChatRoom.name, schema: ChatRoomSchema },
            { name: Message.name, schema: MessageSchema },
        ]),
        AuthModule, // provides TokenHandleService for WebSocket auth
    ],
    controllers: [MessageController, ChatRoomController],
    providers: [MessageService, ChatRoomService, ChatGateway]
})
export class ChatModule { }
