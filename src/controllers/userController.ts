import { Request, Response } from 'express';
import db from '../config/db';
import { ResultSetHeader } from 'mysql2';
import { User } from '../types/userTypes';
import { PaginatedResponse, PaginationMeta, ApiResponse } from '../types/responseTypes';


export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (page < 1 || limit < 1) {
      res.status(400).json({
        success: false,
        error: 'Page and limit must be positive numbers'
      });
      return;
    }

    const offset = (page - 1) * limit;

    const [countResult] = await db.query<any[]>('SELECT COUNT(*) as total FROM users');
    const total = countResult[0].total;

    const [rows] = await db.query<User[]>(
      'SELECT * FROM users ORDER BY id DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    const totalPages = Math.ceil(total / limit);

    const paginationMeta: PaginationMeta = {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };

    const response: PaginatedResponse<User> = {
      success: true,
      data: rows,
      pagination: paginationMeta
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Email is required'
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
      return;
    }

    const ip_address = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
    const ipString = Array.isArray(ip_address) ? ip_address[0] : ip_address;

    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO users (email, ip_address) VALUES (?, ?)',
      [email, ipString]
    );

    const [rows] = await db.query<User[]>(
      'SELECT * FROM users WHERE id = ?',
      [result.insertId]
    );

    const response: ApiResponse<User> = {
      success: true,
      data: rows[0]
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error('Error creating user:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        success: false,
        error: 'Email already exists'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
