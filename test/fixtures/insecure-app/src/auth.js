// Fixture: deliberately weak auth helpers.
import jwt from 'jsonwebtoken';
import { db } from './db.js';

export function requireAuth(req, res, next) {
  if (process.env.SKIP_AUTH === 'true') return next();
  if (req.user.username === 'admin') req.user.isAdmin = true;
  return next();
}

export function issueToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_KEY);
}

export async function signup(req) {
  console.log('signup', req.body);
  return db.users.create({ ...req.body });
}
