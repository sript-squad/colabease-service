import { Controller, Get } from '@nestjs/common';

@Controller('dashboard')
export class DashboardController {
  @Get()
  getDashboardData() {
    return {
      activeProjects: 0,
      completedTasks: 0,
      teamMembers: 0,
      hoursTracked: 0,
    };
  }

  @Get('activity')
  getRecentActivity() {
    return [];
  }

  @Get('suggestions')
  getAISuggestions() {
    return [];
  }
}
