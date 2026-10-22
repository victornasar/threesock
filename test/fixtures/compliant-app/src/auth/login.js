import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { Router } from 'express';
import { db } from '../db.js';

export const loginRouter = Router();

export async function hashPassword(password) {
  return argon2.hash(password, { type: argon2.argon2id });
}

export function authenticate(token) {
  return jwt.verify(token, process.env.JWT_PUBLIC_KEY, {
    algorithms: ['RS256'],
    audience: 'api.compliant-app.example',
  });
}

export async function findUser(id) {
  return db.query('SELECT id, email FROM users WHERE id = $1', [id]);
}
