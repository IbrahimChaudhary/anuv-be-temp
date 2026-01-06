import { RowDataPacket } from "mysql2";

export type User = RowDataPacket & {
  id: number;
  email: string;
  created_at: Date;
  updated_at: Date;
};
