import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ActivityService } from './activity.service';

@Controller('activity')
export class ActivityController {
    constructor(private readonly activityService: ActivityService) { }

    @Get('/heatmap')
    async getUserActivityHeatmap(
        @Query('userId') userId: number,
        @Query('type') type?: string
    ) {
        return this.activityService.getUserActivityHeatmap(Number(userId), type);
    }

    @Post('/log')
    async logActivity(
        @Body() body: { userId: number, type: string, color?: string, timestamp?: string, date?: string }
    ) {
        return this.activityService.log(body.userId, body.type, body.color, body.timestamp, body.date);
    }

    @Get('/user-heatmaps')
    async getUserHeatmaps(
        @Query('userId') userId: number
    ) {
        return this.activityService.getUserHeatmaps(Number(userId));
    }
}