import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, Tag, Plus, X, AlertCircle, Calendar } from 'lucide-react';
import { useApi } from '../utils/hooks/useApi';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface TaskListProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onToggleTask, onDeleteTask }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-5 border ${
            task.completed
              ? 'border-green-100 dark:border-green-900'
              : 'border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-3">
              <button
                onClick={() => onToggleTask(task.id)}
                className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 transition-colors duration-200 ${
                  task.completed
                    ? 'bg-green-500 border-green-500 dark:bg-green-600 dark:border-green-600'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400'
                }`}
              >
                {task.completed && <Check className="w-4 h-4 text-white" />}
              </button>
              <div>
                <h3 className={`text-lg font-semibold ${
                  task.completed
                    ? 'text-gray-500 dark:text-gray-400 line-through'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {task.title}
                </h3>
                <p className={`mt-1 text-sm ${
                  task.completed
                    ? 'text-gray-400 dark:text-gray-500 line-through'
                    : 'text-gray-600 dark:text-gray-300'
                }`}>
                  {task.description}
                </p>
              </div>
            </div>
            <button
              onClick={() => onDeleteTask(task.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {task.priority && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                task.priority === 'high'
                  ? 'bg-red-50 text-red-700 dark:bg-red-900/50 dark:text-red-200'
                  : task.priority === 'medium'
                  ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-200'
                  : 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200'
              }`}>
                <AlertCircle className="w-3 h-3 mr-1 opacity-70" />
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </span>
            )}
            {task.dueDate && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/50 dark:text-purple-200">
                <Calendar className="w-3 h-3 mr-1 opacity-70" />
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
            {task.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200"
              >
                <Tag className="w-3 h-3 mr-1 opacity-70" />
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-400 dark:text-gray-500">
            Updated {new Date(task.updatedAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};

const Tasks: React.FC = () => {
  const { data, addTask, toggleTask, deleteTask } = useApi();
  const [showForm, setShowForm] = useState(false);
  const tasks = data?.tasks || [];

  const handleSubmit = async (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
    await addTask({ ...task, completed: false });
    setShowForm(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Tasks</h1>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Task
        </button>
      </div>

      {showForm && (
        <div className="mb-8">
          <TaskForm onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
        </div>
      )}

      <TaskList tasks={tasks} onToggleTask={toggleTask} onDeleteTask={deleteTask} />
    </div>
  );
};

interface TaskFormProps {
  onSubmit: (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<string | null>(null);
  const [tag, setTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      priority,
      tags,
      dueDate: dueDate || undefined
    });
  };

  const addTag = () => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-shadow duration-200"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-shadow duration-200"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-shadow duration-200"
        >
          <option value="">None</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-shadow duration-200"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            className="flex-1 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-shadow duration-200"
            placeholder="Add tags..."
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-colors duration-200"
          >
            Add
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200"
            >
              {t}
              <button
                type="button"
                onClick={() => removeTag(t)}
                className="ml-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-colors duration-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-all duration-200"
        >
          Save Task
        </button>
      </div>
    </form>
  );
};

export { TaskList };
export default Tasks;