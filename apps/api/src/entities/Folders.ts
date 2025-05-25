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
import { Notes } from "./Notes";

@Index("folders_pkey", ["id"], { unique: true })
@Entity("folders", { schema: "ntodo" })
export class Folders {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id: number;

  @Column("character varying", { name: "name", length: 100 })
  name: string;

  @Column("character varying", { name: "color", nullable: true, length: 20 })
  color: string | null;

  @Column("timestamp without time zone", {
    name: "created_at",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date | null;

  @ManyToOne(() => Users, (users) => users.folders, { onDelete: "CASCADE" })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: Users;

  @OneToMany(() => Notes, (notes) => notes.folder)
  notes: Notes[];

  @ManyToOne(() => Folders, (folder) => folder.children, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn([{ name: "parent_id", referencedColumnName: "id" }])
  parent: Folders | null;

  @OneToMany(() => Folders, (folder) => folder.parent)
  children: Folders[];
}
