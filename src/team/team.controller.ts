import { Controller, Get, Post, Body } from '@nestjs/common';

@Controller('team')
export class TeamController {
  @Get()
  getTeamMembers() {
    return [];
  }

  @Post()
  addTeamMember(@Body() data: any) {
    return { email: data.email, role: data.role, id: 'temp-id' };
  }
}
