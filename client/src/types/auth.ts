export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  status: string;
  lastSeen?: string;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AuthError {
  error: string;
}
