import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tasks } from '../entities/Tasks';
import { TaskLists } from '../entities/TaskLists';
import { Users } from '../entities/Users';

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Tasks) private readonly taskRepo: Repository<Tasks>,
        @InjectRepository(TaskLists) private readonly taskListRepo: Repository<TaskLists>,
        @InjectRepository(Users) private readonly userRepo: Repository<Users>,
    ) {}

    async createTask(userId: number, taskListId?: number, content?: string, dueDate?: Date) {
        if (!userId) throw new Error("userId is required");
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        let taskList: TaskLists | null = null;
        if (taskListId) {
            taskList = await this.taskListRepo.findOne({ where: { id: taskListId } });
        }
        const task = this.taskRepo.create({
            content,
            dueDate,
            isDone: false,
            taskList: taskList || null,
            user, // always set user
        });
        return this.taskRepo.save(task);
    }

    async getTasks(userId: number, taskListId?: number) {
        if (taskListId) {
            return this.taskRepo.find({ where: { taskList: { id: taskListId } } });
        }
        // Return ALL tasks for the user (with or without a list), include taskListId
        const tasks = await this.taskRepo.find({
            where: { user: { id: userId } },
            relations: ["taskList"],
        });
        // Map to include taskListId as a property
        return tasks.map(task => ({
            ...task,
            taskListId: task.taskList ? task.taskList.id : null,
        }));
    }

    async updateTask(taskId: number, data: Partial<{ content: string; dueDate: Date; isDone: boolean; taskListId: number | null }>) {
        const task = await this.taskRepo.findOne({ where: { id: taskId } });
        if (!task) throw new NotFoundException('Task not found');
        if (data.taskListId !== undefined) {
            task.taskList = data.taskListId ? await this.taskListRepo.findOne({ where: { id: data.taskListId } }) : null;
        }
        Object.assign(task, data);
        return this.taskRepo.save(task);
    }

    async deleteTask(taskId: number) {
        const task = await this.taskRepo.findOne({ where: { id: taskId } });
        if (!task) throw new NotFoundException('Task not found');
        await this.taskRepo.remove(task);
        return { deleted: true };
    }
}