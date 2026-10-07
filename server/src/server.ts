import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import authRoutes from './routes/authRoutes';
import conversationRoutes from './routes/conversationRoutes';
import userRoutes from './routes/userRoutes';
import { initializeSocket } from './sockets/socketManager';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));

app.use(express.json());

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/users', userRoutes);

// HTTP server wraps Express so Socket.IO can share the same port
export const httpServer = createServer(app);
initializeSocket(httpServer);

const isMain = process.argv[1] &&
  (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js'));

if (isMain && process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`[server] Server running on http://localhost:${PORT}`);
  });
}

export default app;
