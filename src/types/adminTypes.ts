import { RowDataPacket } from "mysql2";

export type Admin = RowDataPacket & {
    id: number;
    name: string;
    email: string;
    password: string;
    role: 'super_admin' | 'admin';
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
  }
  
  export type CreateAdminRequest = { 
    name: string;
    email: string;
    password: string;
  }
  
  export type LoginAdminRequest = {
    email: string;
    password: string;
  }
  
  export type AdminResponse = {
    id: number;
    name: string;
    email: string;
    role: 'super_admin' | 'admin';
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
  }
  
  export type JwtPayload = {
    id: number;
    email: string;
    role: 'super_admin' | 'admin';
  }
  
  declare global {
    namespace Express {
      interface Request {
        admin?: JwtPayload;
      }
    }
  }