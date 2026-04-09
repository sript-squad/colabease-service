import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuardService } from './auth-guard.service';
import { TokenHandleService } from './token-handle.service';
import { UserService } from './user.service';
import { User, UserSchema } from './schemas/user.schema';
import { AuthController } from './auth.controller';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ],
    providers: [AuthGuardService, TokenHandleService, UserService],
    controllers: [AuthController],
    exports: [AuthGuardService, TokenHandleService, UserService]
})
export class AuthModule { }