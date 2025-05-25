import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogs } from '../entities/ActivityLogs';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityLogs])],
  providers: [ActivityService],
  controllers: [ActivityController],
  exports: [ActivityService],
})
export class ActivityModule {}
