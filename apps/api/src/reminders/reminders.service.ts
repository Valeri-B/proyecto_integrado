import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Reminders } from '../entities/Reminders';
import { Tasks } from '../entities/Tasks';

@Injectable()
export class RemindersService {
    constructor(
        @InjectRepository(Reminders) private readonly reminderRepo: Repository<Reminders>,
        @InjectRepository(Tasks) private readonly taskRepo: Repository<Tasks>,
    ) { }

    async createReminder(taskId: number, remindAt: Date) {
        const task = await this.taskRepo.findOne({ where: { id: taskId } });
        if (!task) throw new NotFoundException('Task not found');
        const reminder = this.reminderRepo.create({ task, remindAt });
        return this.reminderRepo.save(reminder);
    }

    async getReminders(taskId: number) {
        return this.reminderRepo.find({ where: { task: { id: taskId } } });
    }

    async deleteReminder(reminderId: number) {
        const reminder = await this.reminderRepo.findOne({ where: { id: reminderId } });
        if (!reminder) throw new NotFoundException('Reminder not found');
        await this.reminderRepo.remove(reminder);
        return { deleted: true };
    }

    async getUpcomingReminders(userId: number, from: Date, to: Date) {
        return this.reminderRepo
            .createQueryBuilder('reminder')
            .innerJoinAndSelect('reminder.task', 'task')
            .innerJoinAndSelect('task.note', 'note')
            .where('note.user = :userId', { userId })
            .andWhere('reminder.remindAt BETWEEN :from AND :to', { from, to })
            .getMany();
    }

    async getActiveReminders(userId: number) {
        const now = new Date();
        const reminders = await this.reminderRepo.find({
            where: {
                dismissed: false,
                task: { user: { id: userId } },
                remindAt: LessThanOrEqual(now),
            },
            relations: ['task'],
        });
        return reminders.map(r => ({
            id: r.id,
            taskId: r.task.id,
            remindAt: r.remindAt,
            content: r.task.content,
            isDone: r.task.isDone,
        }));
    }

    async dismissReminder(id: number) {
        const reminder = await this.reminderRepo.findOne({ where: { id } });
        if (!reminder) throw new NotFoundException('Reminder not found');
        reminder.dismissed = true;
        await this.reminderRepo.save(reminder);
        return { dismissed: true };
    }

    async upsertReminder(taskId: number, remindAt: Date) {
        const task = await this.taskRepo.findOne({ where: { id: taskId } });
        if (!task) throw new NotFoundException('Task not found');
        let reminder = await this.reminderRepo.findOne({ where: { task: { id: taskId }, dismissed: false } });
        if (reminder) {
            reminder.remindAt = remindAt;
            return this.reminderRepo.save(reminder);
        } else {
            reminder = this.reminderRepo.create({ task, remindAt });
            return this.reminderRepo.save(reminder);
        }
    }
}