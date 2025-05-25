import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reminders } from '../entities/Reminders';
import { Tasks } from '../entities/Tasks';
import { RemindersService } from './reminders.service';
import { RemindersController } from './reminders.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Reminders, Tasks])],
  providers: [RemindersService],
  controllers: [RemindersController],
})
export class RemindersModule { }