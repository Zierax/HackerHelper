import { v4 as uuidv4 } from 'uuid';

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'hacker-helper-notes';

const loadNotes = (): Note[] => {
  const storedNotes = localStorage.getItem(STORAGE_KEY);
  return storedNotes ? JSON.parse(storedNotes) : [];
};

const saveNotes = (notes: Note[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
};

export const noteApi = {
  create: async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> => {
    const notes = loadNotes();
    const now = new Date().toISOString();
    const newNote: Note = {
      ...note,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    notes.push(newNote);
    saveNotes(notes);
    return newNote;
  },

  update: async (id: string, updates: Partial<Note>): Promise<Note> => {
    const notes = loadNotes();
    const noteIndex = notes.findIndex(n => n.id === id);
    if (noteIndex === -1) {
      throw new Error('Note not found');
    }
    const updatedNote = { 
      ...notes[noteIndex], 
      ...updates,
      updatedAt: new Date().toISOString()
    };
    notes[noteIndex] = updatedNote;
    saveNotes(notes);
    return updatedNote;
  },

  delete: async (id: string): Promise<void> => {
    const notes = loadNotes();
    const filteredNotes = notes.filter(n => n.id !== id);
    saveNotes(filteredNotes);
  },

  getAll: async (): Promise<Note[]> => {
    return loadNotes();
  }
};
