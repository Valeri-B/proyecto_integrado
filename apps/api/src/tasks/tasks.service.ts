import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tasks } from '../entities/Tasks';
import { TaskLists } from '../entities/TaskLists';
import { Users } from '../entities/Users';
import { Tags } from '../entities/Tags';

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Tasks) private readonly taskRepo: Repository<Tasks>,
        @InjectRepository(TaskLists) private readonly taskListRepo: Repository<TaskLists>,
        @InjectRepository(Users) private readonly userRepo: Repository<Users>,
        @InjectRepository(Tags) private readonly tagRepo: Repository<Tags>,
    ) {}

    async createTask(userId: number, taskListId?: number, content?: string, dueDate?: Date, description?: string) {
        if (!userId) throw new Error("userId is required");
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        let taskList: TaskLists | null = null;
        if (taskListId) {
            taskList = await this.taskListRepo.findOne({ where: { id: taskListId } });
        }
        const task = this.taskRepo.create({
            content,
            description,
            dueDate,
            isDone: false,
            taskList: taskList || null,
            user,
        });
        return this.taskRepo.save(task);
    }

    async getTasks(userId: number, taskListId?: number) {
        if (taskListId) {
            return this.taskRepo.find({ where: { taskList: { id: taskListId } } });
        }
        const tasks = await this.taskRepo.find({
            where: { user: { id: userId } },
            relations: ["taskList"],
        });
        return tasks.map(task => ({
            ...task,
            taskListId: task.taskList ? task.taskList.id : null,
        }));
    }

    async updateTask(taskId: number, data: Partial<{ content: string; description: string; dueDate: Date; isDone: boolean; taskListId: number | null }>) {
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

    async addTagToTask(taskId: number, tagId: number, userId: number) {
        const task = await this.taskRepo.findOne({ where: { id: taskId, user: { id: userId } }, relations: ['tags'] });
        if (!task) throw new NotFoundException('Task not found');
        const tag = await this.tagRepo.findOne({ where: { id: tagId, user: { id: userId } } });
        if (!tag) throw new NotFoundException('Tag not found');
        task.tags = [...(task.tags || []), tag];
        return this.taskRepo.save(task);
    }

    async removeTagFromTask(taskId: number, tagId: number, userId: number) {
        const task = await this.taskRepo.findOne({ where: { id: taskId, user: { id: userId } }, relations: ['tags'] });
        if (!task) throw new NotFoundException('Task not found');
        task.tags = (task.tags || []).filter(tag => tag.id !== tagId);
        return this.taskRepo.save(task);
    }
}