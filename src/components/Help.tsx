import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  Lock,
  Network,
  GitBranch,
  FileText,
  CheckSquare,
  Coffee,
  Music,
  FolderKanban,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

const Help: React.FC = () => {
  const navigate = useNavigate();
  const [showAbout, setShowAbout] = useState(true);

  const features = [
    {
      path: '/tools',
      label: 'Security Tools',
      icon: Wrench,
      description: 'Collection of security testing and analysis tools',
    },
    {
      path: '/crypto',
      label: 'Encryption Suite',
      icon: Lock,
      description: 'Encrypt and decrypt data using various algorithms',
    },
    {
      path: '/mindmaps',
      label: 'Mind Maps',
      icon: Network,
      description: 'Create and manage visual mind maps for your projects',
    },
    {
      path: '/repos',
      label: 'GitHub Repos',
      icon: GitBranch,
      description: 'Manage and analyze GitHub repositories',
    },
    {
      path: '/notes',
      label: 'Note Manager',
      icon: FileText,
      description: 'Take and organize notes for your projects',
    },
    {
      path: '/tasks',
      label: 'Task Manager',
      icon: CheckSquare,
      description: 'Track and manage your tasks and to-dos',
    },
    {
      path: '/break',
      label: 'Break Timer',
      icon: Coffee,
      description: 'Take timed breaks to maintain productivity',
    },
    {
      path: '/spotifyPlayer',
      label: 'Spotify Player',
      icon: Music,
      description: 'Control Spotify playback while you work',
    },
    {
      path: '/projectManager',
      label: 'Project Manager',
      icon: FolderKanban,
      description: 'Manage and organize your projects',
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold dark:text-white">Welcome to HackerHelper</h1>
        <button
          onClick={() => setShowAbout(!showAbout)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 
                   hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          {showAbout ? (
            <>
              <ChevronUp className="w-5 h-5" />
              <span>Hide About</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-5 h-5" />
              <span>Show About</span>
            </>
          )}
        </button>
      </div>

      {showAbout && (
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold dark:text-white">About the Author</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Created by Ziad, a Web2/Web3 Penetration Tester & Bug Hunter. Specializing in uncovering critical vulnerabilities
            and enhancing security across diverse platforms.
          </p>
          <button
            onClick={() => navigate('/about')}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Learn more about the author →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map(({ path, label, icon: Icon, description }) => (
          <div
            key={path}
            onClick={() => navigate(path)}
            className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 
                     dark:hover:border-blue-500 cursor-pointer transition-all duration-200 
                     bg-white dark:bg-gray-800 hover:shadow-lg group"
          >
            <div className="flex items-center gap-3 mb-3">
              <Icon className="w-6 h-6 text-blue-500 group-hover:text-blue-600" />
              <h2 className="text-xl font-semibold dark:text-white">{label}</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300">{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Help;
