import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Sparkles } from 'lucide-react';

interface HeaderProps {
  theme: string;
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme }) => {
  return (
    <header
      className={`sticky top-0 z-50 flex-shrink-0 h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between border-b transition-colors duration-200 ease-in-out ${
        theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center">
        <Sparkles
          className={`w-6 h-6 mr-2 transition-colors duration-300 ${
            theme === 'light' ? 'text-indigo-500' : 'text-yellow-400'
          }`}
        />
        <h1
          className={`text-lg font-semibold transition-colors duration-300 ${
            theme === 'light' ? 'text-gray-700' : 'text-gray-300'
          }`}
        >
          <span className="font-thin">Hacker</span>Helper
        </h1>
      </div>
      <div className="flex items-center">
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            theme === 'dark' ? 'focus:ring-offset-gray-900 hover:bg-gray-800 text-gray-300' : 'focus:ring-offset-white hover:bg-gray-100 text-gray-700'
          } transition-colors duration-200 ease-in-out`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
};

export default Header;