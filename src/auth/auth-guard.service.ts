import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenHandleService } from './token-handle.service';

@Injectable()
export class AuthGuardService implements CanActivate {

    constructor(private readonly tokenHandleService: TokenHandleService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        const authHeader = request.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('No token provided');
        }

        const token = authHeader.split(' ')[1];

        const user = await this.tokenHandleService.verifyToken(token);
        console.log('Authenticated user:', user.email);

        request.user = user;

        return true;
    }


}
