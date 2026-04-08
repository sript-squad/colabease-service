import { Module } from '@nestjs/common';
import { AuthGuardService } from './auth-guard.service';
import { TokenHandleService } from './token-handle.service';

@Module({
    providers: [AuthGuardService, TokenHandleService],
    exports: [AuthGuardService],
})
export class AuthModule {}
    