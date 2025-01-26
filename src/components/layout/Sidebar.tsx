import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HelpCircle,
  Wrench,
  Lock,
  GitBranch,
  FileText,
  CheckSquare,
  Coffee,
  FolderKanban,
  Network,
  Info,
  Music,
  MenuIcon,
  Terminal,
  Bot
} from 'lucide-react';

interface SidebarProps {
  theme: string;
}

const Sidebar: React.FC<SidebarProps> = ({ theme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);

  const menuItems = [
    { path: '/', label: 'Help & Overview', icon: HelpCircle },
    { path: '/tools', label: 'Security Tools', icon: Wrench },
    { path: '/crypto', label: 'Encryption Suite', icon: Lock },
    { path: '/mindmaps', label: 'Mind Maps', icon: Network },
    { path: '/repos', label: 'GitHub Repos', icon: GitBranch },
    { path: '/notes', label: 'Note Manager', icon: FileText },
    { path: '/tasks', label: 'Task Manager', icon: CheckSquare },
    { path: '/break', label: 'Take a Break', icon: Coffee },
    { path: '/projectManager', label: 'Project Manager', icon: FolderKanban },
    { path: '/ai-assistant', label: 'AI Assistant', icon: Bot },
    { path: '/about', label: 'About', icon: Info }
  ];

  return (
    <nav
      className={`
        ${isExpanded ? 'w-64' : 'w-16'}
        h-full py-6 flex flex-col border-r
        ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
        shadow-md
        transition-all duration-300 ease-in-out
      `}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="px-2 mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            flex justify-center items-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
            ${theme === 'dark' ? 'hover:bg-gray-700 focus:ring-offset-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 focus:ring-offset-white text-gray-600 hover:text-gray-900'}
            transition-colors duration-200 ease-in-out
            w-full
          `}
          aria-label="Toggle Sidebar"
        >
          <MenuIcon className="w-6 h-6" />
        </button>
      </div>
      <div className="flex flex-col space-y-1 px-2">
        {menuItems.map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`
              flex items-center gap-3 px-4 py-2 rounded-md text-left
              transition-colors duration-200 ease-in-out
              ${location.pathname === path
                ? theme === 'dark'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-700'
                : theme === 'dark'
                  ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }
              focus:outline-none focus:ring-2 focus:ring-blue-500
              ${theme === 'dark' ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'}
              w-full
            `}
            aria-current={location.pathname === path ? 'page' : undefined}
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
            <span className={`text-sm font-medium ${isExpanded ? '' : 'hidden'}`}>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Sidebar;
