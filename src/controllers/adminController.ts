import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/db';
import { CreateAdminRequest, LoginAdminRequest, Admin, AdminResponse } from '../types/adminTypes';
import { generateToken, cookieOptions } from '../middleware/authMiddleware';
import { RowDataPacket, ResultSetHeader } from 'mysql2';


export const loginAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginAdminRequest = req.body;
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM admins WHERE email = ? AND is_active = TRUE',
      [email]
    );

    if (rows.length === 0) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
      return;
    }

    const admin = rows[0] as Admin;

    const isValidPassword = await bcrypt.compare(password, admin.password);

    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
      return;
    }

    const token = generateToken({
      id: admin.id,
      email: admin.email,
      role: admin.role
    });

    res.cookie('admin_token', token, cookieOptions);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

export const logoutAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie('admin_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};