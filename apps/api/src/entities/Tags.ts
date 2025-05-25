import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Notes } from "./Notes";
import { Users } from "./Users";

@Index("tags_pkey", ["id"], { unique: true })
@Entity("tags", { schema: "ntodo" })
export class Tags {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id: number;

  @Column("character varying", { name: "name", length: 50 })
  name: string;

  @Column("character varying", { name: "color", nullable: true, length: 20 })
  color: string | null;

  @ManyToMany(() => Notes, (notes) => notes.tags)
  notes: Notes[];

  @ManyToOne(() => Users, (users) => users.tags, { onDelete: "CASCADE" })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: Users;
}
