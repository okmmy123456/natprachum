export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'natprachum-tci-jwt-secret-key-2024',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'natprachum-tci-refresh-secret-key-2024',
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};
