import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuardService } from './auth-guard.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuardService)
  @Get('check-user')
  async checkUser(@Query('email') email: string) {
    const exists = await this.userService.checkExists(email);
    return { exists };
  }
}
