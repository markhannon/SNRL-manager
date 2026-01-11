/**
 * User model types and DTOs
 * From 001-admin-user feature
 */

export enum UserRole {
  Admin = 'admin',
  Editor = 'editor',
  Member = 'member',
}

export enum UserStatus {
  Active = 'active',
  Inactive = 'inactive',
  Deleted = 'deleted',
}

export interface User {
  id: number;
  email: string;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  created_at: Date;
  updated_at: Date;
}

export interface UserDTO {
  id: number;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserInput {
  email?: string;
  password?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserDTO;
  token: string;
}

/**
 * Convert User entity to DTO (excludes password_hash)
 */
export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}
