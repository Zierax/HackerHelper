import axios from 'axios';

export interface Task {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
    tags: string[];
    createdAt: string;
  }
  
  export interface Note {
    id: string;
    title: string;
    content: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
  }
  
  export interface Node {
    id: string;
    label: string;
    color?: string;
    image?: string;  // Path to image
    file?: string;   // Path to file
    children?: Node[];
  }

const api = axios.create({
  baseURL: 'http://localhost:3002/api'
});

export const taskApi = {
  getAll: () => api.get<Task[]>('/tasks').then(res => res.data),
  create: (task: Omit<Task, 'id' | 'createdAt'>) => 
    api.post<Task>('/tasks', task).then(res => res.data),
  update: (id: string, task: Partial<Task>) => 
    api.patch<Task>(`/tasks/${id}`, task).then(res => res.data),
  delete: (id: string) => api.delete(`/tasks/${id}`)
};

export const noteApi = {
  getAll: () => api.get<Note[]>('/notes').then(res => res.data),
  create: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<Note>('/notes', note).then(res => res.data),
  update: (id: string, note: Partial<Note>) => 
    api.patch<Note>(`/notes/${id}`, note).then(res => res.data),
  delete: (id: string) => api.delete(`/notes/${id}`)
};

export const tagApi = {
  getAll: () => api.get<string[]>('/tags').then(res => res.data)
};

export const mindMapApi = {
  getAll: () => api.get<Node[]>('/mindmaps').then(res => res.data),
  create: (node: Omit<Node, 'id'>) => 
    api.post<Node>('/mindmaps', node).then(res => res.data),
  update: (id: string, node: Partial<Node>) => 
    api.patch<Node>(`/mindmaps/${id}`, node).then(res => res.data),
  delete: (id: string) => api.delete(`/mindmaps/${id}`)
};