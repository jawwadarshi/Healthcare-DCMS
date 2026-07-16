export interface User {
  id: string;
  userId?: string;
  email: string;
  name: string;
  role: 'admin' | 'doctor' | 'staff' | 'patient';
  iat?: number;
  exp?: number;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, userData: Omit<User, 'iat' | 'exp'>) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedData<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}
