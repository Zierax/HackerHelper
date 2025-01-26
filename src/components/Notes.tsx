import React, { useState } from 'react';
import { Tag, Plus, X } from 'lucide-react';
import { useApi } from '../utils/hooks/useApi';
import { Note } from '../utils/api/noteApi';

interface NoteListProps {
  notes: Note[];
  onDeleteNote: (id: string) => void;
}

const NotesList: React.FC<NoteListProps> = ({ notes, onDeleteNote }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {notes.map((note) => (
        <div
          key={note.id}
          className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-5 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800"
        >
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{note.title}</h3>
            <button
              onClick={() => onDeleteNote(note.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
            {note.content}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {note.tags.map((tag: string) => (
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
            Updated {new Date(note.updatedAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};

interface NoteFormProps {
  onSubmit: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const NoteForm: React.FC<NoteFormProps> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tag, setTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      content,
      tags
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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-shadow duration-200"
          required
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
          Save Note
        </button>
      </div>
    </form>
  );
};

const Notes: React.FC = () => {
  const { data, addNote, deleteNote } = useApi();
  const [showForm, setShowForm] = useState(false);
  const notes = data?.notes || [];

  const handleSubmit = async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addNote(note);
    setShowForm(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Notes</h1>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Note
        </button>
      </div>

      {showForm && (
        <div className="mb-8">
          <NoteForm onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
        </div>
      )}

      <NotesList notes={notes} onDeleteNote={deleteNote} />
    </div>
  );
};

export default Notes;