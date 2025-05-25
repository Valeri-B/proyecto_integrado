import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { Notes } from '../entities/Notes';
import { Users } from '../entities/Users'; // Importa la entidad Users
import { NoteContent, NoteContentSchema } from '../schemas/note-content.schema';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notes, Users]), // Registra las entidades Notes y Users
    MongooseModule.forFeature([{ name: NoteContent.name, schema: NoteContentSchema }]), // Registra el esquema NoteContent
    ActivityModule,
  ],
  providers: [NotesService],
  controllers: [NotesController],
})
export class NotesModule {}
