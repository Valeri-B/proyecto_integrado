import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { ActivityModule } from '../activity/activity.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tasks } from '../entities/Tasks';
import { Notes } from '../entities/Notes';
import { TaskLists } from '../entities/TaskLists';
import { Users } from '../entities/Users';
import { Tags } from '../entities/Tags'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Tasks, Notes, TaskLists, Users, Tags]), 
    ActivityModule,
  ],
  providers: [TasksService],
  controllers: [TasksController]
})
export class TasksModule {}
