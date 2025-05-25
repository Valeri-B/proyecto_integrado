import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Tags } from "./Tags";
import { Folders } from "./Folders";
import { Users } from "./Users";
import { Tasks } from "./Tasks";

@Index("notes_pkey", ["id"], { unique: true })
@Entity("notes", { schema: "ntodo" })
export class Notes {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id: number;

  @Column("character varying", { name: "title", length: 255 })
  title: string;

  @Column("boolean", {
    name: "is_archived",
    nullable: true,
    default: () => "false",
  })
  isArchived: boolean | null;

  @Column("timestamp without time zone", {
    name: "created_at",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date | null;

  @ManyToMany(() => Tags, (tags) => tags.notes)
  @JoinTable({
    name: "note_tags",
    joinColumns: [{ name: "note_id", referencedColumnName: "id" }],
    inverseJoinColumns: [{ name: "tag_id", referencedColumnName: "id" }],
    schema: "ntodo",
  })
  tags: Tags[];

  @ManyToOne(() => Folders, (folders) => folders.notes, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn([{ name: "folder_id", referencedColumnName: "id" }])
  folder: Folders | null;

  @ManyToOne(() => Users, (users) => users.notes, { onDelete: "CASCADE" })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: Users;

  @OneToMany(() => Tasks, (tasks) => tasks.note)
  tasks: Tasks[];
}
