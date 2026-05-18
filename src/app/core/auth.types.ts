export type UserRole = 'ADMIN' | 'USER';

export interface AuthUser {
  username: string;
  role: UserRole;
  displayName: string;
  token: string;
  busId?: number | null;
}
