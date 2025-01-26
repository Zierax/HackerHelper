import { useState, useEffect, useCallback } from 'react';
import { taskApi, Task } from '../api/taskApi';
import { noteApi, Note } from '../api/noteApi';

export interface ProjectData {
  tasks: Task[];
  notes: Note[];
  tags: string[];
  repos: string[];
  mindMaps: mindMapApi.Node[];
}

const STORAGE_KEY = 'hacker-helper-project-data';

export function useApi() {
  const [data, setData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadFromCache = () => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  };

  const saveToCache = (data: ProjectData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const fetchData = async () => {
    try {
      // Try to load from cache first
      const cached = loadFromCache();
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }

      // If no cache, initialize with empty data
      const initialData: ProjectData = {
        tasks: await taskApi.getAll(),
        notes: await noteApi.getAll(),
        tags: [],
        repos: [],
        mindMaps: []
      };
      setData(initialData);
      saveToCache(initialData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error('API Error:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    return fetchData();
  }, []);

  const addTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask = await taskApi.create(task);
    const updatedData = { ...data!, tasks: [...data!.tasks, newTask] };
    setData(updatedData);
    saveToCache(updatedData);
  };

  const updateTask = async (id: string, task: Partial<Task>) => {
    const updatedTask = await taskApi.update(id, task);
    const updatedData = { 
      ...data!, 
      tasks: data!.tasks.map(t => t.id === id ? updatedTask : t)
    };
    setData(updatedData);
    saveToCache(updatedData);
  };

  const deleteTask = async (id: string) => {
    await taskApi.delete(id);
    const updatedData = {
      ...data!,
      tasks: data!.tasks.filter(t => t.id !== id)
    };
    setData(updatedData);
    saveToCache(updatedData);
  };

  const addNote = async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote = await noteApi.create(note);
    const updatedData = { ...data!, notes: [...data!.notes, newNote] };
    setData(updatedData);
    saveToCache(updatedData);
  };

  const updateNote = async (id: string, note: Partial<Note>) => {
    const updatedNote = await noteApi.update(id, note);
    const updatedData = {
      ...data!,
      notes: data!.notes.map(n => n.id === id ? updatedNote : n)
    };
    setData(updatedData);
    saveToCache(updatedData);
  };

  const deleteNote = async (id: string) => {
    await noteApi.delete(id);
    const updatedData = {
      ...data!,
      notes: data!.notes.filter(n => n.id !== id)
    };
    setData(updatedData);
    saveToCache(updatedData);
  };

  const addRepo = async (repo: string) => {
    const updatedData = { ...data!, repos: [...data!.repos, repo] };
    setData(updatedData);
    saveToCache(updatedData);
  };

  const addMindMap = async (node: Omit<mindMapApi.Node, 'id'>) => {
    const newMindMap = await mindMapApi.create(node);
    const updatedData = { ...data!, mindMaps: [...data!.mindMaps, newMindMap] };
    setData(updatedData);
    saveToCache(updatedData);
  };

  return {
    data,
    loading,
    error,
    refetch,
    addTask,
    updateTask,
    deleteTask,
    addNote,
    updateNote,
    deleteNote,
    addRepo,
    addMindMap
  };
}