import { Module } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { FoldersController } from './folders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Folders } from 'src/entities/Folders';
import { Users } from 'src/entities/Users';

@Module({
  imports: [
    TypeOrmModule.forFeature([Folders, Users]),
  ],
  providers: [FoldersService],
  controllers: [FoldersController],
})
export class FoldersModule { }
