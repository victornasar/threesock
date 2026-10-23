import { z } from 'zod';
import { db } from '../db.js';

const Profile = z.object({ name: z.string().min(1).max(200), email: z.string().email() });

export function register(app) {
  app.get('/me/export', async (req, res) => res.json(await exportUserData(req.user.id)));
  app.patch('/me', async (req, res) => res.json(await updateProfile(req.user.id, Profile.parse(req.body))));
  app.delete('/me', async (req, res) => {
    await deleteAccount(req.user.id);
    res.sendStatus(204);
  });
}

async function exportUserData(id) {
  return db.query('SELECT id, email, name FROM users WHERE id = $1', [id]);
}

async function updateProfile(id, profile) {
  return db.query('UPDATE users SET name = $2, email = $3 WHERE id = $1', [id, profile.name, profile.email]);
}

async function deleteAccount(id) {
  return db.query('DELETE FROM users WHERE id = $1', [id]);
}
