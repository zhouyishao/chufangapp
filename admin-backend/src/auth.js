import jwt from 'jsonwebtoken';
import { fail } from './response.js';

export const signAdminToken = (payload, secret) => {
  return jwt.sign(payload, secret, { expiresIn: '7d' });
};

export const requireAdminAuth = (secret) => (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    res.status(401).json(fail(401, 'unauthorized'));
    return;
  }

  const token = header.slice('bearer '.length).trim();
  try {
    const decoded = jwt.verify(token, secret);
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json(fail(401, 'unauthorized'));
  }
};

