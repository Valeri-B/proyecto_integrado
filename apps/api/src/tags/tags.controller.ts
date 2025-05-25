import { Controller, Post, Body, Get, Query, Patch, Param, Delete } from '@nestjs/common';
import { TagsService } from './tags.service';

@Controller('tags')
export class TagsController {
    constructor(private readonly tagsService: TagsService) { }

    @Post()
    async createTag(@Body() body: { userId: number; name: string; color?: string }) {
        return this.tagsService.createTag(body.userId, body.name, body.color);
    }

    @Get()
    async getTags(@Query('userId') userId: number) {
        return this.tagsService.getTags(Number(userId));
    }

    @Patch(':id')
    async updateTag(
        @Param('id') id: number,
        @Query('userId') userId: number,
        @Body() body: { name?: string; color?: string }
    ) {
        return this.tagsService.updateTag(Number(id), Number(userId), body);
    }

    @Delete(':id')
    async deleteTag(@Param('id') id: number, @Query('userId') userId: number) {
        return this.tagsService.deleteTag(Number(id), Number(userId));
    }
}