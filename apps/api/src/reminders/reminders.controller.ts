import { Controller, Post, Body, Get, Param, Delete, Query, Patch } from '@nestjs/common';
import { RemindersService } from './reminders.service';

@Controller('reminders')
export class RemindersController {
    constructor(private readonly remindersService: RemindersService) { }

    @Post()
    async createReminder(@Body() body: { taskId: number; remindAt: Date }) {
        return this.remindersService.createReminder(body.taskId, body.remindAt);
    }

    @Get(':taskId')
    async getReminders(@Param('taskId') taskId: number) {
        return this.remindersService.getReminders(Number(taskId));
    }

    @Get('/user/:userId/upcoming')
    async getUpcomingReminders(
        @Param('userId') userId: number,
        @Query('from') from: string,
        @Query('to') to: string
    ) {
        return this.remindersService.getUpcomingReminders(
            Number(userId),
            new Date(from),
            new Date(to)
        );
    }

    @Get('/user/:userId/active')
    async getActiveReminders(@Param('userId') userId: number) {
        return this.remindersService.getActiveReminders(Number(userId));
    }

    @Delete(':id')
    async deleteReminder(@Param('id') id: number) {
        return this.remindersService.deleteReminder(Number(id));
    }

    @Patch(':id/dismiss')
    async dismissReminder(@Param('id') id: number) {
        return this.remindersService.dismissReminder(Number(id));
    }
}