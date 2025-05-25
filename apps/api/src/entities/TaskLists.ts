import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Users } from "./Users";
import { Tasks } from "./Tasks";

@Index("task_lists_pkey", ["id"], { unique: true })
@Entity("task_lists", { schema: "ntodo" })
export class TaskLists {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id: number;

  @Column("varchar", { name: "name", length: 255 })
  name: string;

  @ManyToOne(() => Users, (users) => users.taskLists, { onDelete: "CASCADE" })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: Users;

  @OneToMany(() => Tasks, (tasks) => tasks.taskList)
  tasks: Tasks[];
}