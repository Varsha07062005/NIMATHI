import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

// API base URL for server functions
export const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-2843aea9`;

// Auth helpers
export const authHeaders = (accessToken?: string) => ({
  'Content-Type': 'application/json',
  ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
});

// API helper functions
export const api = {
  // Health check
  health: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: authHeaders(publicAnonKey)
      });
      
      if (!response.ok) {
        return { error: `Server error: ${response.status}`, healthy: false };
      }
      
      const data = await response.json();
      return { ...data, healthy: true };
    } catch (error) {
      console.error('Health check error:', error);
      return { error: 'Cannot reach server', healthy: false };
    }
  },

  // Auth endpoints
  signup: async (petName: string, email: string, password: string) => {
    console.log('API signup request to:', `${API_BASE_URL}/auth/signup`);
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: authHeaders(publicAnonKey),
      body: JSON.stringify({ petName, email, password })
    });
    
    if (!response.ok) {
      console.error('Signup request failed:', response.status, response.statusText);
    }
    
    return response.json();
  },

  // User endpoints
  getUser: async (userId: string, accessToken: string) => {
    const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
      method: 'GET',
      headers: authHeaders(accessToken)
    });
    return response.json();
  },

  updateUser: async (userId: string, updates: any, accessToken: string) => {
    const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
      method: 'PUT',
      headers: authHeaders(accessToken),
      body: JSON.stringify(updates)
    });
    return response.json();
  },

  // Task endpoints
  getTasks: async (userId: string, accessToken: string) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${userId}`, {
      method: 'GET',
      headers: authHeaders(accessToken)
    });
    return response.json();
  },

  createTask: async (userId: string, taskData: any, accessToken: string) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${userId}`, {
      method: 'POST',
      headers: authHeaders(accessToken),
      body: JSON.stringify(taskData)
    });
    return response.json();
  },

  // Journal endpoints
  getJournalEntries: async (userId: string, accessToken: string) => {
    const response = await fetch(`${API_BASE_URL}/journal/${userId}`, {
      method: 'GET',
      headers: authHeaders(accessToken)
    });
    return response.json();
  },

  createJournalEntry: async (userId: string, entryData: any, accessToken: string) => {
    const response = await fetch(`${API_BASE_URL}/journal/${userId}`, {
      method: 'POST',
      headers: authHeaders(accessToken),
      body: JSON.stringify(entryData)
    });
    return response.json();
  },

  // Activity endpoints
  recordActivity: async (userId: string, activityData: any, accessToken: string) => {
    const response = await fetch(`${API_BASE_URL}/activity/${userId}`, {
      method: 'POST',
      headers: authHeaders(accessToken),
      body: JSON.stringify(activityData)
    });
    return response.json();
  },

  // Stress level tracking
  recordStressLevel: async (userId: string, level: number, date: string, accessToken: string) => {
    const response = await fetch(`${API_BASE_URL}/stress-level/${userId}`, {
      method: 'POST',
      headers: authHeaders(accessToken),
      body: JSON.stringify({ level, date })
    });
    return response.json();
  },

  // Feedback
  submitFeedback: async (feedbackData: any, accessToken?: string) => {
    const response = await fetch(`${API_BASE_URL}/feedback`, {
      method: 'POST',
      headers: authHeaders(accessToken || publicAnonKey),
      body: JSON.stringify(feedbackData)
    });
    return response.json();
  }
};