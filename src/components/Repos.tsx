import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, Plus, Trash2, ChevronLeft, ChevronRight, Github, Star, Code, GitBranch, Eye, GitFork } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useOutletContext } from 'react-router-dom';

interface Repo {
  id: number;
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  forks_count?: number;
  watchers_count?: number;
  default_branch?: string;
}

const Repos: React.FC = () => {
  const { theme } = useOutletContext<{ theme: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Repo[]>([]);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const reposPerPage = 7;
  const isDarkMode = theme === 'dark';
  const cache = useRef<Record<string, Repo[]>>({});

  useEffect(() => {
    const storedRepos = localStorage.getItem('repos');
    if (storedRepos) {
      setRepos(JSON.parse(storedRepos));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('repos', JSON.stringify(repos));
  }, [repos]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsLoading(true);
    if (cache.current[searchQuery]) {
      setSearchResults(cache.current[searchQuery]);
      toast.success(`Found ${cache.current[searchQuery].length} repositories (from cache)`);
      setIsLoading(false);
      setCurrentPage(1);
      return;
    }

    try {
      const response = await fetch(`https://api.github.com/search/repositories?q=${searchQuery}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      cache.current[searchQuery] = data.items;
      setSearchResults(data.items);
      toast.success(`Found ${data.items.length} repositories`);
      setCurrentPage(1);
    } catch (error) {
      toast.error('Failed to fetch repositories');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  const addRepo = useCallback((repo: Repo) => {
    if (repos.some(r => r.id === repo.id)) {
      toast.error('Repository already added');
      return;
    }
    setRepos(prev => [...prev, repo]);
    toast.success('Repository added');
  }, [repos]);

  const removeRepo = useCallback((repoId: number) => {
    setRepos(prev => prev.filter(repo => repo.id !== repoId));
    toast.success('Repository removed');
  }, []);

  const indexOfLastRepo = currentPage * reposPerPage;
  const indexOfFirstRepo = indexOfLastRepo - reposPerPage;
  const currentRepos = searchResults.slice(indexOfFirstRepo, indexOfLastRepo);
  const totalPages = Math.ceil(searchResults.length / reposPerPage);

  const RepoCard: React.FC<{ repo: Repo; onAction: (repo: Repo) => void; actionIcon: typeof Plus | typeof Trash2 }> = ({ repo, onAction, actionIcon: ActionIcon }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-xl p-6 ${
        isDarkMode 
          ? 'bg-gray-800/50 hover:bg-gray-700/50' 
          : 'bg-white/90 hover:bg-white shadow-md'
      } backdrop-blur-sm border ${
        isDarkMode ? 'border-gray-700' : 'border-gray-300'
      } transition-all duration-300 group shadow-lg hover:shadow-xl`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <a 
              href={repo.html_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`text-lg font-medium hover:underline truncate ${
                isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-700 hover:text-blue-800'
              }`}
            >
              {repo.name}
            </a>
            {repo.language && (
              <span className={`px-2 py-1 rounded-full text-xs ${
                isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800'
              }`}>
                {repo.language}
              </span>
            )}
          </div>
          <p className={`mt-2 text-sm truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
            {repo.description || 'No description available'}
          </p>
          <div className={`flex items-center gap-6 mt-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span>{repo.stargazers_count.toLocaleString()}</span>
            </div>
            {repo.forks_count !== undefined && (
              <div className="flex items-center gap-2">
                <GitFork className="w-4 h-4" />
                <span>{repo.forks_count.toLocaleString()}</span>
              </div>
            )}
            {repo.watchers_count !== undefined && (
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{repo.watchers_count.toLocaleString()}</span>
              </div>
            )}
            {repo.default_branch && (
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                <span>{repo.default_branch}</span>
              </div>
            )}
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onAction(repo)}
          className={`p-3 rounded-xl transition-colors ${
            ActionIcon === Plus
              ? isDarkMode
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'bg-green-500 hover:bg-green-400 text-white'
              : isDarkMode
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-red-500 hover:bg-red-400 text-white'
          }`}
        >
          <ActionIcon className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );

  return (
    <div className={`min-h-screen ${
      isDarkMode 
        ? 'bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50'
    } transition-colors duration-500`}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-block p-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
            <Github className="w-16 h-16 text-white" />
          </div>
          <h1 className={`text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${
            isDarkMode ? 'from-blue-400 to-purple-500' : 'from-blue-600 to-purple-700'
          }`}>
            Repository Explorer
          </h1>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Search and manage GitHub repositories
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl ${
            isDarkMode 
              ? 'bg-gray-800/50 backdrop-blur-lg border border-gray-700'
              : 'bg-white/80 border-gray-200 shadow-lg'
          } shadow-2xl p-8 space-y-6`}
        >
          <div className="flex gap-4">
            <div className="flex-grow relative">
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                    : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
              />
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSearch}
              disabled={isLoading}
              className={`px-8 rounded-xl transition-all duration-300 ${
                isDarkMode
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white disabled:from-gray-700 disabled:to-gray-700'
                  : 'bg-blue-700 hover:bg-blue-600 text-white disabled:bg-gray-300'
              } shadow-lg shadow-blue-500/25`}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </motion.button>
          </div>

          <AnimatePresence>
            <div className="space-y-4">
              {currentRepos.map((repo) => (
                <RepoCard key={repo.id} repo={repo} onAction={addRepo} actionIcon={Plus} />
              ))}
            </div>
          </AnimatePresence>

          {searchResults.length > 0 && (
            <div className="flex justify-center items-center gap-6">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'text-gray-300 hover:bg-gray-700 disabled:text-gray-600'
                    : 'text-gray-700 hover:bg-gray-200 disabled:text-gray-400'
                } disabled:cursor-not-allowed`}
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>
              <span className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Page {currentPage} of {totalPages}
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'text-gray-300 hover:bg-gray-700 disabled:text-gray-600'
                    : 'text-gray-700 hover:bg-gray-200 disabled:text-gray-400'
                } disabled:cursor-not-allowed`}
              >
                <ChevronRight className="w-6 h-6" />
              </motion.button>
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {repos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`rounded-3xl ${
                isDarkMode 
                  ? 'bg-gray-800/50 backdrop-blur-lg border border-gray-700'
                  : 'bg-white/80 border-gray-200 shadow-lg'
              } shadow-2xl p-8 space-y-6`}
            >
              <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${
                  isDarkMode ? 'from-blue-400 to-purple-500' : 'from-blue-600 to-purple-700'
                }`}>
                  Selected Repositories
                </h2>
                <div className={`px-4 py-2 rounded-lg ${
                  isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800'
                }`}>
                  {repos.length} {repos.length === 1 ? 'Repository' : 'Repositories'}
                </div>
              </div>
              <div className="space-y-4">
                {repos.map((repo) => (
                  <RepoCard key={repo.id} repo={repo} onAction={removeRepo} actionIcon={Trash2} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Repos;
