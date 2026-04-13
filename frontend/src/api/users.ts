// src/api/users.ts
import { API_BASE_URL } from "./baseUrl";

export interface User {
  user_id: number;
  branch_id: number;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
  branch_name?: string;
}

export interface CreateUserRequest {
  user_id: number;
  branch_id: number;
  username: string;
  full_name: string;
  password: string;
  role: string;
}

export async function getAllUsers(): Promise<User[]> {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('No authentication token found');

  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.status}`);
  }

  return response.json();
}

export async function createUser(userData: CreateUserRequest): Promise<{ message: string }> {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('No authentication token found');

  const response = await fetch(`${API_BASE_URL}/create-user`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to create user: ${response.status}`);
  }

  return response.json();
}

export async function updateUser(userId: number, userData: Partial<CreateUserRequest>): Promise<{ message: string }> {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('No authentication token found');

  const response = await fetch(`${API_BASE_URL}/update-users/${userId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to update user: ${response.status}`);
  }

  return response.json();
}

export async function deleteUser(userId: number): Promise<{ message: string }> {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('No authentication token found');

  const response = await fetch(`${API_BASE_URL}/delete-user/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to delete user: ${response.status}`);
  }

  return response.json();
}