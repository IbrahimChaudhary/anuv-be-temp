import { RowDataPacket } from "mysql2";

export type Quiz = RowDataPacket & {
  id: number;
  question1: number;
  question2: number;
  question3: number;
  question4: number;
  playlist_id: string;
  ip_address: string | null;
  created_at: Date;
  updated_at: Date;
};
