import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLogs } from '../entities/ActivityLogs';

@Injectable()
export class ActivityService {
    constructor(
        @InjectRepository(ActivityLogs) private readonly activityRepo: Repository<ActivityLogs>,
    ) { }

    async log(userId: number, type: string, color?: string, timestamp?: string, date?: string) {
        await this.activityRepo.save({
            user: { id: userId },
            type,
            date: date || new Date().toISOString().slice(0, 10), // use provided date or fallback to UTC
            color: color || null,
            timestamp: timestamp ? new Date(timestamp) : new Date(),
        });
    }

    async getUserActivityHeatmap(userId: number, type?: string) {
        const qb = this.activityRepo
            .createQueryBuilder('log')
            .select("TO_CHAR(log.date, 'YYYY-MM-DD')", 'date') // <-- format date
            .addSelect('COUNT(*)', 'count')
            .addSelect('MAX(log.color)', 'color')
            .where('log.user = :userId', { userId });

        if (type) {
            qb.andWhere('log.type = :type', { type });
        }

        return qb
            .groupBy('log.date')
            .orderBy('log.date', 'ASC')
            .getRawMany();
    }

    async updateUserHeatmap(
        userId: number,
        oldType: string,
        newType: string,
        color: string,
        tintedBg?: boolean
    ) {
        // Update all logs for this user and type
        await this.activityRepo
            .createQueryBuilder()
            .update(ActivityLogs)
            .set({ type: newType, color, tintedBg: tintedBg ? "1" : "0" })
            .where('user_id = :userId', { userId })
            .andWhere('type = :oldType', { oldType })
            .execute();
        return { success: true };
    }

    async getUserHeatmaps(userId: number) {
        // Get all unique types and their latest color and tintedBg for this user
        const rows = await this.activityRepo
            .createQueryBuilder('log')
            .select('log.type', 'type')
            .addSelect('MAX(log.color)', 'color')
            .addSelect('MAX(log.tintedBg)', 'tintedBg')
            .where('log.user = :userId', { userId })
            .groupBy('log.type')
            .getRawMany();

        // Convert tintedBg to boolean
        return rows.map(row => ({
            ...row,
            tintedBg: row.tintedBg === "1"
        }));
    }

    async deleteUserHeatmap(userId: number, type: string) {
        await this.activityRepo
            .createQueryBuilder()
            .delete()
            .from(ActivityLogs)
            .where('user_id = :userId', { userId })
            .andWhere('type = :type', { type })
            .execute();
        return { success: true };
    }
}