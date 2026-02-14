import jwt from 'jsonwebtoken';

export function authMiddleware(req, res, next) {
  if (!process.env.JWT_SECRET) {
    return res.status(503).json({ error: 'Authentication unavailable' });
  }
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.slice(7);
  if (!token || token.length > 4096) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
