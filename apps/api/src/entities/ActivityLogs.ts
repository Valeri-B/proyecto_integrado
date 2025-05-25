import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Users } from "./Users";

@Index("activity_logs_pkey", ["id"], { unique: true })
@Entity("activity_logs", { schema: "ntodo" })
export class ActivityLogs {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id: number;

  @Column("character varying", { name: "type", length: 50 })
  type: string;

  @Column("date", { name: "date" })
  date: string;

  @Column("character varying", { name: "color", length: 20, nullable: true })
  color: string | null;

  @Column("timestamp without time zone", { name: "timestamp", nullable: true })
  timestamp: Date | null;

  @ManyToOne(() => Users, (users) => users.activityLogs, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: Users;
}
