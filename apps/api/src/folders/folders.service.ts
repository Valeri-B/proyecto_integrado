import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Folders } from '../entities/Folders';
import { Users } from '../entities/Users';

@Injectable()
export class FoldersService {
  constructor(
    @InjectRepository(Folders) private readonly folderRepo: Repository<Folders>,
    @InjectRepository(Users) private readonly userRepo: Repository<Users>,
  ) { }

  async createFolder(userId: number, name: string, color?: string, parentId?: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    let parent: Folders | null = null;
    if (parentId) {
      parent = await this.folderRepo.findOne({ where: { id: parentId, user: { id: userId } } });
      if (!parent) throw new NotFoundException('Parent folder not found');
    }
    const folder = this.folderRepo.create({ user, name, color, parent });
    return this.folderRepo.save(folder);
  }

  async getFolders(userId: number) {
    return this.folderRepo.find({
      where: { user: { id: userId } },
      relations: ['parent'],
    });
  }

  async updateFolder(folderId: number, userId: number, data: Partial<{ name: string; color: string }>) {
    const folder = await this.folderRepo.findOne({ where: { id: folderId, user: { id: userId } } });
    if (!folder) throw new NotFoundException('Folder not found');
    Object.assign(folder, data);
    return this.folderRepo.save(folder);
  }

  async deleteFolder(folderId: number, userId: number) {
    const folder = await this.folderRepo.findOne({ where: { id: folderId, user: { id: userId } } });
    if (!folder) throw new NotFoundException('Folder not found');
    await this.folderRepo.remove(folder);
    return { deleted: true };
  }

  async getFolderWithNotes(folderId: number, userId: number) {
    return this.folderRepo.findOne({
      where: { id: folderId, user: { id: userId } },
      relations: ['notes'],
    });
  }

  async moveFolder(folderId: number, userId: number, parentId?: number) {
    const folder = await this.folderRepo.findOne({ where: { id: folderId, user: { id: userId } } });
    if (!folder) throw new NotFoundException('Folder not found');
    let parent: Folders | null = null;
    if (parentId) {
      parent = await this.folderRepo.findOne({ where: { id: parentId, user: { id: userId } } });
      if (!parent) throw new NotFoundException('Parent folder not found');
    }
    folder.parent = parent;
    return this.folderRepo.save(folder);
  }
}
