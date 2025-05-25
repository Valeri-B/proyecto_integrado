import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskLists } from '../entities/TaskLists';
import { Users } from '../entities/Users';
import { TasklistsService } from './tasklists.service';
import { TasklistsController } from './tasklists.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TaskLists, Users])],
  providers: [TasklistsService],
  controllers: [TasklistsController],
})
export class TasklistsModule {}
