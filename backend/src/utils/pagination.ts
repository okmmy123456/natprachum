import { PaginationQuery } from '../types';

export const getPagination = (query: PaginationQuery) => {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 10));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

export const getSorting = (query: PaginationQuery, allowedFields: string[] = ['created_at']) => {
  const sortBy = allowedFields.includes(query.sort_by || '') ? query.sort_by! : 'created_at';
  const sortOrder = query.sort_order === 'ASC' ? 'ASC' : 'DESC';

  return { sortBy, sortOrder };
};
