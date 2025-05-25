import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Tasks } from "./Tasks";

@Index("reminders_pkey", ["id"], { unique: true })
@Entity("reminders", { schema: "ntodo" })
export class Reminders {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id: number;

  @Column("timestamp without time zone", { name: "remind_at" })
  remindAt: Date;

  @Column("boolean", { name: "sent", nullable: true, default: () => "false" })
  sent: boolean | null;

  @Column("boolean", { name: "dismissed", nullable: true, default: () => "false" })
  dismissed: boolean | null;

  @ManyToOne(() => Tasks, (tasks) => tasks.reminders, { onDelete: "CASCADE" })
  @JoinColumn([{ name: "task_id", referencedColumnName: "id" }])
  task: Tasks;
}
