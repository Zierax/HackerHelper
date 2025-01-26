import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ErrorBoundary from '../ErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';

const MainLayout: React.FC = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const location = useLocation();

  const toggleTheme = () => setTheme(prev => {
    const newTheme = prev === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    return newTheme;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const transitions = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  };

  return (
    <div className={`flex h-screen bg-gradient-to-br ${theme === 'dark' ? 'from-gray-900 to-gray-800' : 'from-blue-50 to-indigo-100'} transition-colors duration-500`}>
      <Sidebar theme={theme} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header theme={theme} toggleTheme={toggleTheme} />
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            className="flex-1 overflow-auto p-8 rounded-tl-3xl bg-opacity-50 backdrop-filter backdrop-blur-lg"
            {...transitions}
          >
            <ErrorBoundary>
              <Outlet context={{ theme }} /> {/* Pass theme via React Router context */}
            </ErrorBoundary>
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MainLayout;
