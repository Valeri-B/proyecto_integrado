import { Controller, Post, Body, Get, Param, Patch, Delete, Query } from '@nestjs/common';
import { NotesService } from './notes.service';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) { }

  @Post()
  async createNote(@Body() body: { userId: number; title: string; content: string; folderId?: number }) {
    return this.notesService.createNote(body.userId, body.title, body.content, body.folderId);
  }

  @Get()
  async getNotes(@Query('userId') userId: number) {
    return this.notesService.getNotes(Number(userId));
  }

  @Get(':id')
  async getNote(@Param('id') id: number, @Query('userId') userId: number) {
    return this.notesService.getNoteById(Number(id), Number(userId));
  }

  @Patch(':id')
  async updateNote(
    @Param('id') id: number,
    @Query('userId') userId: number,
    @Body() body: { title?: string; folderId?: number }
  ) {
    return this.notesService.updateNote(Number(id), Number(userId), body);
  }

  @Delete(':id')
  async deleteNote(@Param('id') id: number, @Query('userId') userId: number) {
    return this.notesService.deleteNote(Number(id), Number(userId));
  }

  @Get(':id/content')
  async getNoteContent(@Param('id') id: number) {
    return this.notesService.getNoteContent(Number(id));
  }

  @Patch(':id/content')
  async updateNoteContent(
    @Param('id') id: number,
    @Body() body: { content: string }
  ) {
    return this.notesService.updateNoteContent(Number(id), body.content);
  }

  @Get('/folder/:folderId')
  async getNotesByFolder(
    @Param('folderId') folderId: number,
    @Query('userId') userId: number
  ) {
    return this.notesService.getNotesByFolder(Number(folderId), Number(userId));
  }

  @Post(':id/tags/:tagId')
  async addTagToNote(
    @Param('id') noteId: number,
    @Param('tagId') tagId: number,
    @Query('userId') userId: number
  ) {
    return this.notesService.addTagToNote(Number(noteId), Number(tagId), Number(userId));
  }

  @Delete(':id/tags/:tagId')
  async removeTagFromNote(
    @Param('id') noteId: number,
    @Param('tagId') tagId: number,
    @Query('userId') userId: number
  ) {
    return this.notesService.removeTagFromNote(Number(noteId), Number(tagId), Number(userId));
  }

  @Get('/search/by-tags')
  async searchNotesByTags(
    @Query('userId') userId: number,
    @Query('tagIds') tagIds: string
  ) {
    const tagIdArr = tagIds.split(',').map(Number);
    return this.notesService.searchNotesByTags(Number(userId), tagIdArr);
  }

  @Patch(':id/move')
  async moveNote(
    @Param('id') id: number,
    @Body() body: { folderId?: number, userId: number }
  ) {
    return this.notesService.moveNote(Number(id), body.userId, body.folderId);
  }
}
