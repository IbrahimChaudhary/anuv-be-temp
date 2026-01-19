import { Request, Response } from 'express';
import db from '../config/db';
import { ResultSetHeader } from 'mysql2';
import { Quiz } from '../types/quizTypes';
import { PaginatedResponse, PaginationMeta, ApiResponse } from '../types/responseTypes';

export const getQuizzes = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const playlist_id = req.query.playlist_id as string;

    if (page < 1 || limit < 1) {
      res.status(400).json({
        success: false,
        error: 'Page and limit must be positive numbers'
      });
      return;
    }

    const offset = (page - 1) * limit;

    let countQuery = 'SELECT COUNT(*) as total FROM quiz';
    let dataQuery = 'SELECT * FROM quiz';
    const queryParams: any[] = [];

    if (playlist_id) {
      countQuery += ' WHERE playlist_id LIKE ?';
      dataQuery += ' WHERE playlist_id LIKE ?';
      queryParams.push(`%${playlist_id}%`);
    }

    dataQuery += ' ORDER BY id DESC LIMIT ? OFFSET ?';

    const [countResult] = await db.query<any[]>(countQuery, queryParams);
    const total = countResult[0].total;

    const [rows] = await db.query<Quiz[]>(
      dataQuery,
      [...queryParams, limit, offset]
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

    const response: PaginatedResponse<Quiz> = {
      success: true,
      data: rows,
      pagination: paginationMeta
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    const { question1, question2, question3, question4, playlist_id } = req.body;

    if (!question1 || !question2 || !question3 || !question4 || !playlist_id) {
      res.status(400).json({
        success: false,
        error: 'All question answers (1-4) and playlist_id are required'
      });
      return;
    }

    const answers = [question1, question2, question3, question4];
    for (let i = 0; i < answers.length; i++) {
      const answer = parseInt(answers[i]);
      if (isNaN(answer) || answer < 1 || answer > 5) {
        res.status(400).json({
          success: false,
          error: `Question ${i + 1} answer must be between 1 and 5`
        });
        return;
      }
    }

    // Capture IP address
    const ip_address = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
    const ipString = Array.isArray(ip_address) ? ip_address[0] : ip_address;

    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO quiz (question1, question2, question3, question4, playlist_id, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [question1, question2, question3, question4, playlist_id, ipString]
    );

    const [rows] = await db.query<Quiz[]>(
      'SELECT * FROM quiz WHERE id = ?',
      [result.insertId]
    );

    const response: ApiResponse<Quiz> = {
      success: true,
      data: rows[0]
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error('Error creating quiz:', error);

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
