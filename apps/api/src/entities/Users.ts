import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ActivityLogs } from "./ActivityLogs";
import { Folders } from "./Folders";
import { Notes } from "./Notes";
import { Tags } from "./Tags";
import { TaskLists } from "./TaskLists";
import { Tasks } from "./Tasks";

@Index("users_email_key", ["email"], { unique: true })
@Index("users_pkey", ["id"], { unique: true })
@Entity("users", { schema: "ntodo" })
export class Users {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id: number;

  @Column("character varying", { name: "email", unique: true, length: 255 })
  email: string;

  @Column("text", { name: "password" })
  password: string;

  @Column("character varying", { name: "name", length: 100 })
  name: string;

  @Column("character varying", {
    name: "role",
    nullable: true,
    length: 20,
    default: () => "'user'",
  })
  role: string | null;

  @Column("timestamp without time zone", {
    name: "created_at",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date | null;

  @OneToMany(() => ActivityLogs, (activityLogs) => activityLogs.user)
  activityLogs: ActivityLogs[];

  @OneToMany(() => Folders, (folders) => folders.user)
  folders: Folders[];

  @OneToMany(() => Notes, (notes) => notes.user)
  notes: Notes[];

  @OneToMany(() => Tags, (tags) => tags.user)
  tags: Tags[];

  @OneToMany(() => TaskLists, (taskList) => taskList.user)
  taskLists: TaskLists[];

  @OneToMany(() => Tasks, (task) => task.user)
  tasks: Tasks[];
}
