import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { generateToken } from '../config/jwt';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// Helper: Generate clean initials avatar SVG as data URI
const generateDefaultAvatar = (name: string): string => {
  const initials = name
    .split(' ')
    .map(p => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';
  
  const colors = ['#00a884', '#128c7e', '#25d366', '#34b7f1', '#075e54'];
  const charCode = name.charCodeAt(0) || 0;
  const bgColor = colors[charCode % colors.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="${bgColor}" rx="50"/><text x="50" y="60" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const register = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, identifier, password, email: rawEmail, phone: rawPhone } = req.body;

    const trimmedName = (name || '').trim();
    const idValue = (identifier || rawEmail || rawPhone || '').trim();

    if (!trimmedName) {
      res.status(400).json({ error: 'Display name is required' });
      return;
    }

    if (!idValue) {
      res.status(400).json({ error: 'Email or phone number is required' });
      return;
    }

    if (!password || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }

    const isEmail = idValue.includes('@');
    const email = isEmail ? idValue.toLowerCase() : null;
    const phone = !isEmail ? idValue.replace(/[^0-9+]/g, '') : null;

    if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email!)) {
      res.status(400).json({ error: 'Please enter a valid email address' });
      return;
    }

    if (!isEmail && (!phone || phone.length < 7)) {
      res.status(400).json({ error: 'Please enter a valid phone number' });
      return;
    }

    // Check existing
    const existing = await prisma.user.findFirst({
      where: isEmail ? { email } : { phone },
    });

    if (existing) {
      res.status(409).json({
        error: isEmail ? 'An account with this email already exists' : 'An account with this phone already exists',
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultAvatar = generateDefaultAvatar(trimmedName);

    const user = await prisma.user.create({
      data: {
        name: trimmedName,
        email,
        phone,
        password: hashedPassword,
        avatar: defaultAvatar,
        status: 'Hey there! I am using ChatApp',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        status: true,
        lastSeen: true,
        createdAt: true,
      },
    });

    const token = generateToken(user.id);
    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
};

export const login = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body;
    const idValue = (identifier || '').trim();

    if (!idValue || !password) {
      res.status(400).json({ error: 'Identifier and password are required' });
      return;
    }

    const isEmail = idValue.includes('@');
    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: idValue.toLowerCase() }
        : { phone: idValue.replace(/[^0-9+]/g, '') },
    });

    if (!user) {
      res.status(401).json({ error: 'Incorrect email, phone, or password. Please verify your details.' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ error: 'Incorrect email, phone, or password. Please verify your details.' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastSeen: new Date() },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        status: true,
        lastSeen: true,
        createdAt: true,
      },
    });

    const token = generateToken(user.id);
    res.status(200).json({ user: updatedUser, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        status: true,
        lastSeen: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { name, status, avatar } = req.body;
    const updateData: Record<string, string> = {};

    if (typeof name === 'string' && name.trim()) {
      updateData.name = name.trim();
    }
    if (typeof status === 'string') {
      updateData.status = status.trim();
    }
    if (typeof avatar === 'string' && avatar.trim()) {
      updateData.avatar = avatar.trim();
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        status: true,
        lastSeen: true,
        createdAt: true,
      },
    });

    res.status(200).json({ user });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ error: 'Internal server error updating profile' });
  }
};
