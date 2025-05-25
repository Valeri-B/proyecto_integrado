import { Controller, Post, Body, Get, Param, Patch, Delete, Query, BadRequestException } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    @Post()
    async createTask(@Body() body: { userId?: number; taskListId?: number; content: string; dueDate?: Date }) {
        if (typeof body.userId !== "number") {
            throw new BadRequestException("userId is required and must be a number");
        }
        return this.tasksService.createTask(body.userId, body.taskListId, body.content, body.dueDate);
    }

    @Get()
    async getTasks(@Query('userId') userId: number, @Query('taskListId') taskListId?: number) {
        return this.tasksService.getTasks(Number(userId), taskListId ? Number(taskListId) : undefined);
    }

    @Patch(':id')
    async updateTask(@Param('id') id: number, @Body() body: { content?: string; dueDate?: Date; isDone?: boolean; taskListId?: number | null }) {
        return this.tasksService.updateTask(Number(id), body);
    }

    @Delete(':id')
    async deleteTask(@Param('id') id: number) {
        return this.tasksService.deleteTask(Number(id));
    }
}