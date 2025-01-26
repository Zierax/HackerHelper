import { v4 as uuidv4 } from 'uuid';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  dueDate?: string;
  createdAt: string;
}

const STORAGE_KEY = 'hacker-helper-tasks';

const loadTasks = (): Task[] => {
  const storedTasks = localStorage.getItem(STORAGE_KEY);
  return storedTasks ? JSON.parse(storedTasks) : [];
};

const saveTasks = (tasks: Task[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

export const taskApi = {
  create: async (task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> => {
    const tasks = loadTasks();
    const newTask: Task = {
      ...task,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    tasks.push(newTask);
    saveTasks(tasks);
    return newTask;
  },

  update: async (id: string, updates: Partial<Task>): Promise<Task> => {
    const tasks = loadTasks();
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }
    const updatedTask = { ...tasks[taskIndex], ...updates };
    tasks[taskIndex] = updatedTask;
    saveTasks(tasks);
    return updatedTask;
  },

  delete: async (id: string): Promise<void> => {
    const tasks = loadTasks();
    const filteredTasks = tasks.filter(t => t.id !== id);
    saveTasks(filteredTasks);
  },

  getAll: async (): Promise<Task[]> => {
    return loadTasks();
  }
};
