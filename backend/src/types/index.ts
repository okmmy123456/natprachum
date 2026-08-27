import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role_id: number;
    role_name: string;
  };
}

export interface JwtPayload {
  id: number;
  username: string;
  email: string;
  role_id: number;
  role_name: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface StandardResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
  meta?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
