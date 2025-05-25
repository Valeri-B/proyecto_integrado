import { Controller, Post, Body, Get, Query, Patch, Param, Delete } from '@nestjs/common';
import { FoldersService } from './folders.service';

@Controller('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  async createFolder(@Body() body: { userId: number; name: string; color?: string; parentId?: number }) {
    return this.foldersService.createFolder(body.userId, body.name, body.color, body.parentId);
  }

  @Get()
  async getFolders(@Query('userId') userId: number) {
    return this.foldersService.getFolders(Number(userId));
  }

  @Get(':id/with-notes')
  async getFolderWithNotes(
    @Param('id') id: number,
    @Query('userId') userId: number
  ) {
    return this.foldersService.getFolderWithNotes(Number(id), Number(userId));
  }

  @Patch(':id')
  async updateFolder(
    @Param('id') id: number,
    @Query('userId') userId: number,
    @Body() body: { name?: string; color?: string }
  ) {
    return this.foldersService.updateFolder(Number(id), Number(userId), body);
  }

  @Patch(':id/move')
  async moveFolder(
    @Param('id') id: number,
    @Body() body: { parentId?: number, userId: number }
  ) {
    return this.foldersService.moveFolder(Number(id), body.userId, body.parentId);
  }

  @Delete(':id')
  async deleteFolder(@Param('id') id: number, @Query('userId') userId: number) {
    return this.foldersService.deleteFolder(Number(id), Number(userId));
  }
}
