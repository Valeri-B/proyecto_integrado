import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Reminders } from "./Reminders";
import { Notes } from "./Notes";
import { TaskLists } from "./TaskLists";
import { Users } from "./Users"; // Add this

@Index("tasks_pkey", ["id"], { unique: true })
@Entity("tasks", { schema: "ntodo" })
export class Tasks {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id: number;

  @Column("text", { name: "content" })
  content: string;

  @Column("timestamp without time zone", { name: "due_date", nullable: true })
  dueDate: Date | null;

  @Column("boolean", {
    name: "is_done",
    nullable: true,
    default: () => "false",
  })
  isDone: boolean | null;

  @Column("timestamp without time zone", {
    name: "created_at",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date | null;

  @OneToMany(() => Reminders, (reminders) => reminders.task)
  reminders: Reminders[];

  @ManyToOne(() => Notes, (notes) => notes.tasks, { onDelete: "CASCADE" })
  @JoinColumn([{ name: "note_id", referencedColumnName: "id" }])
  note: Notes;

  @ManyToOne(
    () => TaskLists,
    (taskList) => taskList.tasks,
    { nullable: true, onDelete: "SET NULL" }
  )
  @JoinColumn([{ name: "task_list_id", referencedColumnName: "id" }])
  taskList: TaskLists | null;

  @ManyToOne(() => Users, (user) => user.tasks, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: Users | null;
}
