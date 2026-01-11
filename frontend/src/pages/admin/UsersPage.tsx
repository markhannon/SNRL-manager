import React, { useState } from 'react';
import { UserList } from '../../components/admin/UserList';
import { UserForm } from '../../components/admin/UserForm';
import { useUsers } from '../../hooks/useUsers';
import * as userService from '../../services/user.service';
import type { User } from '../../services/user.service';

/**
 * T060: UsersPage Component
 * Admin page for managing users with CRUD operations
 */

export function UsersPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'admin' | 'editor' | 'member' | ''>('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'deleted' | ''>('active');

  const { users, loading, error, refetch } = useUsers({
    search: searchTerm || undefined,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
  });

  const handleCreate = async (data: any) => {
    await userService.createUser(data);
    setShowForm(false);
    refetch();
  };

  const handleUpdate = async (data: any) => {
    if (!editingUser) return;
    await userService.updateUser(editingUser.id, data);
    setEditingUser(null);
    refetch();
  };

  const handleDelete = async (user: User) => {
    await userService.deleteUser(user.id);
    refetch();
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowForm(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>User Management</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingUser(null);
          }}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '4px',
            background: '#1976d2',
            color: 'white',
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          {showForm ? 'Cancel' : '+ New User'}
        </button>
      </div>

      {/* Filters */}
      <div
        style={{
          marginBottom: '2rem',
          padding: '1.5rem',
          background: '#f9f9f9',
          borderRadius: '8px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        <div>
          <label htmlFor="search" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Search
          </label>
          <input
            id="search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by email..."
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
        </div>

        <div>
          <label htmlFor="role-filter" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Role
          </label>
          <select
            id="role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="member">Member</option>
          </select>
        </div>

        <div>
          <label htmlFor="status-filter" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
      </div>

      {showForm && (
        <div
          style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            background: '#f9f9f9',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Create New User</h2>
          <UserForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {editingUser && (
        <div
          style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            background: '#fff8e1',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Edit User: {editingUser.email}</h2>
          <UserForm user={editingUser} onSubmit={handleUpdate} onCancel={() => setEditingUser(null)} />
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '1rem',
            background: '#ffebee',
            color: '#c62828',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          Error: {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Loading users...</div>
      )}

      {!loading && !error && <UserList users={users} onEdit={handleEdit} onDelete={handleDelete} />}
    </div>
  );
}
