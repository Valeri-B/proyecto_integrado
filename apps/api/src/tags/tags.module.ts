import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tags } from '../entities/Tags';
import { Users } from '../entities/Users';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tags, Users]),
  ],
  providers: [TagsService],
  controllers: [TagsController],
})
export class TagsModule {}
