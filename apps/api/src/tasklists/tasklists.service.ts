import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskLists } from '../entities/TaskLists';
import { Users } from '../entities/Users';

@Injectable()
export class TasklistsService {
    constructor(
        @InjectRepository(TaskLists) private readonly taskListRepo: Repository<TaskLists>,
        @InjectRepository(Users) private readonly userRepo: Repository<Users>,
    ) {}

    async createTaskList(userId: number, name: string) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        const list = this.taskListRepo.create({ user, name });
        return this.taskListRepo.save(list);
    }

    async getTaskLists(userId: number) {
        return this.taskListRepo.find({ where: { user: { id: userId } } });
    }

    async deleteTaskList(id: number) {
        const list = await this.taskListRepo.findOne({ where: { id } });
        if (!list) throw new NotFoundException('Task list not found');
        await this.taskListRepo.remove(list);
        return { deleted: true };
    }
}
