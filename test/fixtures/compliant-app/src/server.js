import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import { loginRouter } from './auth/login.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: ['https://app.compliant-app.example'], credentials: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    cookie: { httpOnly: true, secure: true, sameSite: 'lax' },
  }),
);
app.use('/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 }), loginRouter);

export async function partnerStatus() {
  return fetch('https://api.partner-service.com/v1/status');
}

app.listen(3000);
