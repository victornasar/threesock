// Fixture: deliberately insecure server.
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import https from 'node:https';
import crypto from 'node:crypto';
import { exec } from 'node:child_process';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    cookie: { httpOnly: false },
  }),
);

const smtpPassword = 'Hunter2Rocks9';

app.get('/calc', (req, res) => res.send(String(eval(req.query.expr))));
app.get('/thumb', (req) => exec(`convert ${req.query.file} thumb.png`));
app.get('/user/:id', (req) => db.query(`SELECT * FROM users WHERE id = ${req.params.id}`));

export function hashPassword(password) {
  return crypto.createHash('md5').update(password).digest('hex');
}

export function readToken(token) {
  jwt.verify(token, process.env.JWT_KEY, { algorithms: ['none'] });
  return jwt.decode(token);
}

export function partner() {
  https.request('https://partner.internal.example.net', { rejectUnauthorized: false });
  return fetch('http://api.partner-service.com/v1/status');
}

export function encrypt(key, iv, data) {
  return crypto.createCipheriv('des-ede3-cbc', key, iv).update(data);
}

app.listen(3000);
