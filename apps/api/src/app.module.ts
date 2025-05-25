import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Users } from './entities/Users';
import { Notes } from './entities/Notes';
import { ActivityLogs } from './entities/ActivityLogs';
import { Folders } from './entities/Folders';
import { Tags } from './entities/Tags';
import { Tasks } from './entities/Tasks';
import { Reminders } from './entities/Reminders';
import { NoteContent, NoteContentSchema } from './schemas/note-content.schema';
import { NotesModule } from './notes/notes.module';
import { AuthModule } from './auth/auth.module';
import { FoldersModule } from './folders/folders.module';
import { TasksModule } from './tasks/tasks.module';
import { RemindersModule } from './reminders/reminders.module';
import { TagsModule } from './tags/tags.module';
import { ActivityModule } from './activity/activity.module';
import { TasklistsModule } from './tasklists/tasklists.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: false,
      entities: [Users, Notes, ActivityLogs, Folders, Tags, Tasks, Reminders],
    }),
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/Ntodo'),
    TypeOrmModule.forFeature([Users, Notes, Folders, Tasks, Reminders]),
    MongooseModule.forFeature([{ name: NoteContent.name, schema: NoteContentSchema }]),
    NotesModule,
    AuthModule,
    FoldersModule,
    TasksModule,
    RemindersModule,
    TagsModule,
    ActivityModule,
    TasklistsModule,
  ],
  controllers: [],
})
export class AppModule { }
