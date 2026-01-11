/**
 * User Service
 * From 001-admin-user feature
 * Handles user CRUD operations, authentication, and password management
 */

import bcrypt from 'bcrypt';
import prisma from '../utils/prisma';
import { ValidationError, UnauthorizedError, NotFoundError } from '../utils/errors';
import type { User, UserDTO, CreateUserInput, UpdateUserInput, LoginCredentials, LoginResponse } from '../models/user';
import { toUserDTO } from '../models/user';

const BCRYPT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validate email format
 */
function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
  if (email.length > 255) {
    throw new ValidationError('Email cannot exceed 255 characters');
  }
}

/**
 * Validate password strength
 */
function validatePassword(password: string): void {
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters');
  }
  if (password.length > 72) {
    throw new ValidationError('Password cannot exceed 72 characters');
  }
}

/**
 * Create a new user
 */
export async function createUser(input: CreateUserInput): Promise<UserDTO> {
  validateEmail(input.email);
  validatePassword(input.password);

  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (existing) {
    throw new ValidationError('User with this email already exists');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      password_hash: passwordHash,
      role: input.role,
      status: 'active',
    },
  });

  return toUserDTO(user as User);
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(credentials: LoginCredentials, jwtSign: (payload: any) => string): Promise<LoginResponse> {
  const user = await prisma.user.findUnique({
    where: { email: credentials.email.toLowerCase() },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (user.status !== 'active') {
    throw new UnauthorizedError('User account is not active');
  }

  const isValidPassword = await verifyPassword(credentials.password, user.password_hash);
  if (!isValidPassword) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const token = jwtSign({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: toUserDTO(user as User),
    token,
  };
}

/**
 * Get user by ID
 */
export async function getUserById(id: number): Promise<UserDTO> {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return toUserDTO(user as User);
}

/**
 * Get all users with optional filters
 */
export async function getUsers(filters?: {
  role?: 'admin' | 'editor' | 'member';
  status?: 'active' | 'inactive' | 'deleted';
  search?: string;
}): Promise<UserDTO[]> {
  const where: any = {};

  if (filters?.role) {
    where.role = filters.role;
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.search) {
    where.email = {
      contains: filters.search,
      mode: 'insensitive',
    };
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { created_at: 'desc' },
  });

  return users.map(user => toUserDTO(user as User));
}

/**
 * Update user
 */
export async function updateUser(id: number, input: UpdateUserInput): Promise<UserDTO> {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const data: any = {};

  if (input.email !== undefined) {
    validateEmail(input.email);
    data.email = input.email.toLowerCase();
  }

  if (input.password !== undefined) {
    validatePassword(input.password);
    data.password_hash = await hashPassword(input.password);
  }

  if (input.role !== undefined) {
    data.role = input.role;
  }

  if (input.status !== undefined) {
    data.status = input.status;
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
  });

  return toUserDTO(updated as User);
}

/**
 * Delete user (soft delete by setting status to 'deleted')
 */
export async function deleteUser(id: number): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  await prisma.user.update({
    where: { id },
    data: { status: 'deleted' },
  });
}

/**
 * Change user password
 */
export async function changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const isValidPassword = await verifyPassword(oldPassword, user.password_hash);
  if (!isValidPassword) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  validatePassword(newPassword);

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password_hash: passwordHash },
  });
}
