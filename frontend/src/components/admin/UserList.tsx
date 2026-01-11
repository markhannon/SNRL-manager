import React from 'react';
import type { User } from '../../services/user.service';

/**
 * T058: UserList Component
 * Displays users in a table with search and filter capabilities
 */

interface UserListProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export function UserList({ users, onEdit, onDelete }: UserListProps) {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#d32f2f';
      case 'editor':
        return '#1976d2';
      case 'member':
        return '#388e3c';
      default:
        return '#757575';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4caf50';
      case 'inactive':
        return '#ff9800';
      case 'deleted':
        return '#9e9e9e';
      default:
        return '#757575';
    }
  };

  if (users.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
        No users found
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd', background: '#f5f5f5' }}>
            <th style={{ padding: '1rem', textAlign: 'left' }}>ID</th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Role</th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Created</th>
            <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '1rem' }}>{user.id}</td>
              <td style={{ padding: '1rem', fontWeight: 'bold' }}>{user.email}</td>
              <td style={{ padding: '1rem' }}>
                <span
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    background: getRoleBadgeColor(user.role),
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                  }}
                >
                  {user.role}
                </span>
              </td>
              <td style={{ padding: '1rem' }}>
                <span
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    background: getStatusBadgeColor(user.status),
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                  }}
                >
                  {user.status}
                </span>
              </td>
              <td style={{ padding: '1rem', color: '#666' }}>
                {new Date(user.created_at).toLocaleDateString()}
              </td>
              <td style={{ padding: '1rem', textAlign: 'right' }}>
                <button
                  onClick={() => onEdit(user)}
                  style={{
                    padding: '0.5rem 1rem',
                    marginRight: '0.5rem',
                    border: '1px solid #1976d2',
                    borderRadius: '4px',
                    background: 'white',
                    color: '#1976d2',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete user ${user.email}?`)) {
                      onDelete(user);
                    }
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #d32f2f',
                    borderRadius: '4px',
                    background: 'white',
                    color: '#d32f2f',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
