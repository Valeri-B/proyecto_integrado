import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class NoteContent extends Document {
  @Prop({ required: true })
  noteId: number; // Relación con PostgreSQL

  @Prop({ type: Object, required: true })
  content: Record<string, any>; // JSON de Tiptap

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const NoteContentSchema = SchemaFactory.createForClass(NoteContent);