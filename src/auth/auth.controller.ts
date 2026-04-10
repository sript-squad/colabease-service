import { Controller, Get, Patch, Query, UseGuards, Body, Req } from '@nestjs/common';
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

  @UseGuards(AuthGuardService)
  @Get('me')
  async getMe(@Req() req: any) {
    // req.user is populated by AuthGuardService with Cognito user info
    const email = req.user.email;
    return this.userService.findByEmail(email);
  }

  @UseGuards(AuthGuardService)
  @Patch('me')
  async updateMe(@Req() req: any, @Body() updateData: any) {
    const email = req.user.email;
    return this.userService.updateUser(email, updateData);
  }
}
