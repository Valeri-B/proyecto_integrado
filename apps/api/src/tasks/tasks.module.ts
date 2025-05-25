import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { ActivityModule } from '../activity/activity.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tasks } from '../entities/Tasks';
import { Notes } from '../entities/Notes';
import { TaskLists } from '../entities/TaskLists';
import { Users } from '../entities/Users'; // <-- Add this line

@Module({
  imports: [
    TypeOrmModule.forFeature([Tasks, Notes, TaskLists, Users]), // <-- Add Users here
    ActivityModule,
  ],
  providers: [TasksService],
  controllers: [TasksController]
})
export class TasksModule {}
