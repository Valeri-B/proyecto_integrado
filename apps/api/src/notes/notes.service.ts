import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notes } from '../entities/Notes';
import { NoteContent } from '../schemas/note-content.schema';
import { Users } from '../entities/Users';
import { Folders } from '../entities/Folders';
import { Tasks } from '../entities/Tasks';
import { Tags } from '../entities/Tags';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Notes) private readonly noteRepo: Repository<Notes>,
    @InjectRepository(Users) private readonly userRepo: Repository<Users>,
    @InjectModel(NoteContent.name) private readonly noteContentModel: Model<NoteContent>,
    private readonly activityService: ActivityService,
  ) { }

  async createNote(userId: number, title: string, content: string, folderId?: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    let folder: Folders | null = null;
    if (folderId) {
      folder = await this.noteRepo.manager.getRepository(Folders).findOne({
        where: { id: folderId, user: { id: userId } }
      });
      if (!folder) throw new NotFoundException('Folder not found');
    }

    const note = this.noteRepo.create({ user, title, folder });
    const savedNote = await this.noteRepo.save(note);

    const noteContent = new this.noteContentModel({
      noteId: savedNote.id,
      content, // store as string
    });
    await noteContent.save();

    await this.activityService.log(userId, 'create_note');
    return savedNote;
  }

  async getNotes(userId: number) {
    return this.noteRepo.find({
      where: { user: { id: userId } },
      relations: ['user', 'folder', 'tags', 'tasks'],
    });
  }

  async getNotesByFolder(folderId: number, userId: number) {
    return this.noteRepo.find({
      where: { folder: { id: folderId }, user: { id: userId } },
      relations: ['user', 'folder', 'tags', 'tasks'],
    });
  }

  async getNoteById(noteId: number, userId: number) {
    const note = await this.noteRepo.findOne({
      where: { id: noteId, user: { id: userId } },
      relations: ['user', 'folder', 'tags', 'tasks'],
    });
    if (!note) throw new NotFoundException('Note not found');
    return note;
  }

  async getNoteContent(noteId: number) {
    const noteContent = await this.noteContentModel.findOne({ noteId });
    if (!noteContent) throw new NotFoundException('Note content not found');
    return { content: typeof noteContent.content === "string" ? noteContent.content : "" };
  }

  async updateNoteContent(noteId: number, content: string) {
    const noteContent = await this.noteContentModel.findOneAndUpdate(
      { noteId },
      { content, updatedAt: new Date() },
      { new: true }
    );
    if (!noteContent) throw new NotFoundException('Note content not found');
    return noteContent;
  }

  async updateNote(noteId: number, userId: number, data: Partial<{ title: string; folderId: number }>) {
    const note = await this.getNoteById(noteId, userId);

    if (data.folderId !== undefined) {
      let folder: Folders | null = null;
      if (data.folderId) {
        folder = await this.noteRepo.manager.getRepository(Folders).findOne({ where: { id: data.folderId, user: { id: userId } } });
        if (!folder) throw new NotFoundException('Folder not found');
      }
      note.folder = folder;
    }

    if (data.title !== undefined) note.title = data.title;

    return this.noteRepo.save(note);
  }

  async deleteNote(noteId: number, userId: number) {
    const note = await this.getNoteById(noteId, userId);
    await this.noteRepo.remove(note);
    await this.noteContentModel.deleteOne({ noteId });
    return { deleted: true };
  }

  async addTagToNote(noteId: number, tagId: number, userId: number) {
    const note = await this.noteRepo.findOne({ where: { id: noteId, user: { id: userId } }, relations: ['tags'] });
    if (!note) throw new NotFoundException('Note not found');
    const tag = await this.noteRepo.manager.getRepository(Tags).findOne({ where: { id: tagId, user: { id: userId } } }) as Tags;
    if (!tag) throw new NotFoundException('Tag not found');
    note.tags = [...(note.tags || []), tag];
    return this.noteRepo.save(note);
  }

  async removeTagFromNote(noteId: number, tagId: number, userId: number) {
    const note = await this.noteRepo.findOne({ where: { id: noteId, user: { id: userId } }, relations: ['tags'] });
    if (!note) throw new NotFoundException('Note not found');
    note.tags = (note.tags || []).filter(tag => tag.id !== tagId);
    return this.noteRepo.save(note);
  }

  async searchNotesByTags(userId: number, tagIds: number[]) {
    return this.noteRepo
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.tags', 'tag')
      .where('note.user = :userId', { userId })
      .andWhere('tag.id IN (:...tagIds)', { tagIds })
      .getMany();
  }

  async moveNote(noteId: number, userId: number, folderId?: number) {
    const note = await this.noteRepo.findOne({ where: { id: noteId, user: { id: userId } } });
    if (!note) throw new NotFoundException('Note not found');
    let folder: Folders | null = null;
    if (folderId) {
      folder = await this.noteRepo.manager.getRepository(Folders).findOne({ where: { id: folderId, user: { id: userId } } });
      if (!folder) throw new NotFoundException('Folder not found');
    }
    note.folder = folder;
    return this.noteRepo.save(note);
  }

  // Sincroniza las tareas de la nota con los checkboxes del contenido enriquecido
  private async syncTasksWithCheckboxes(noteId: number, content: Record<string, any>) {
    // 1. Extrae todos los checkboxes del JSON de Tiptap
    const checkboxes = this.extractCheckboxes(content);

    // 2. Obtiene las tareas actuales de la nota
    const taskRepo = this.noteRepo.manager.getRepository(Tasks);
    const existingTasks = await taskRepo.find({ where: { note: { id: noteId } } });

    // 3. Crea o actualiza tareas según los checkboxes
    for (const cb of checkboxes) {
      let task = existingTasks.find(t => t.content === cb.label);
      if (task) {
        // Actualiza el estado si ha cambiado
        if (task.isDone !== cb.checked) {
          task.isDone = cb.checked;
          await taskRepo.save(task);
        }
      } else {
        // Crea nueva tarea
        await taskRepo.save(taskRepo.create({
          note: { id: noteId },
          content: cb.label,
          isDone: cb.checked,
        }));
      }
    }

    // 4. Elimina tareas que ya no existen como checkbox en el contenido
    for (const task of existingTasks) {
      if (!checkboxes.some(cb => cb.label === task.content)) {
        await taskRepo.remove(task);
      }
    }
  }

  // Extrae los checkboxes del JSON de Tiptap
  private extractCheckboxes(content: Record<string, any>): { label: string; checked: boolean }[] {
    const checkboxes: { label: string; checked: boolean }[] = [];

    function traverse(node: any) {
      if (!node) return;
      if (node.type === 'taskItem' && typeof node.attrs?.checked === 'boolean') {
        // Tiptap usa 'taskItem' para checkboxes
        const label = node.content?.[0]?.text || '';
        checkboxes.push({ label, checked: node.attrs.checked });
      }
      if (Array.isArray(node.content)) {
        node.content.forEach(traverse);
      }
    }

    traverse(content);
    return checkboxes;
  }
}
