import { Controller, Post, Body, Get, Query, Delete, Param } from '@nestjs/common';
import { TasklistsService } from './tasklists.service';

@Controller('tasklists')
export class TasklistsController {
    constructor(private readonly tasklistsService: TasklistsService) {}

    @Post()
    async createTaskList(@Body() body: { userId: number; name: string }) {
        return this.tasklistsService.createTaskList(body.userId, body.name);
    }

    @Get()
    async getTaskLists(@Query('userId') userId: number) {
        return this.tasklistsService.getTaskLists(Number(userId));
    }

    @Delete(':id')
    async deleteTaskList(@Param('id') id: number) {
        return this.tasklistsService.deleteTaskList(Number(id));
    }
}
