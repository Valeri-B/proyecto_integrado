import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tags } from '../entities/Tags';
import { Users } from '../entities/Users';

@Injectable()
export class TagsService {
    constructor(
        @InjectRepository(Tags) private readonly tagRepo: Repository<Tags>,
        @InjectRepository(Users) private readonly userRepo: Repository<Users>,
    ) { }

    async createTag(userId: number, name: string, color?: string) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        const tag = this.tagRepo.create({ user, name, color });
        return this.tagRepo.save(tag);
    }

    async getTags(userId: number) {
        return this.tagRepo.find({ where: { user: { id: userId } } });
    }

    async updateTag(tagId: number, userId: number, data: Partial<{ name: string; color: string }>) {
        const tag = await this.tagRepo.findOne({ where: { id: tagId, user: { id: userId } } });
        if (!tag) throw new NotFoundException('Tag not found');
        Object.assign(tag, data);
        return this.tagRepo.save(tag);
    }

    async deleteTag(tagId: number, userId: number) {
        const tag = await this.tagRepo.findOne({ where: { id: tagId, user: { id: userId } } });
        if (!tag) throw new NotFoundException('Tag not found');
        await this.tagRepo.remove(tag);
        return { deleted: true };
    }
}