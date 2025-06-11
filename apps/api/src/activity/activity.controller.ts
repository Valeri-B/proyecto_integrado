import { Controller, Get, Post, Patch, Delete, Body, Query } from '@nestjs/common';
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

    @Patch('/user-heatmaps')
    async updateUserHeatmap(
        @Body() body: { userId: number, oldType: string, newType: string, color: string, tintedBg?: boolean }
    ) {
        return this.activityService.updateUserHeatmap(
            Number(body.userId),
            body.oldType,
            body.newType,
            body.color,
            body.tintedBg
        );
    }

    @Delete('/user-heatmaps')
    async deleteUserHeatmap(
        @Body() body: { userId: number, type: string }
    ) {
        return this.activityService.deleteUserHeatmap(Number(body.userId), body.type);
    }
}