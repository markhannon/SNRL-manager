/**
 * useUsers Hook
 * From 001-admin-user feature
 * React hook for managing users state
 */

import { useState, useEffect } from 'react';
import * as userService from '../services/user.service';
import type { User } from '../services/user.service';

interface UseUsersOptions {
  role?: 'admin' | 'editor' | 'member';
  status?: 'active' | 'inactive' | 'deleted';
  search?: string;
}

export function useUsers(options?: UseUsersOptions) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getUsers(options);
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [options?.role, options?.status, options?.search]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
  };
}
