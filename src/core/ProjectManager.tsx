import React, { useEffect, useState } from 'react';
import { Download, Upload, Trash2, Save, FolderKanban, RefreshCw, Share2 } from 'lucide-react';
import { useApi, ProjectData } from '../utils/hooks/useApi';
import useLocalStorage from '../utils/hooks/useLocalStorage';
import { toast } from 'react-hot-toast';

interface ProjectManagerProps {
  onImport: (data: ProjectData) => void;
  theme?: 'light' | 'dark';
}

export function ProjectManager({ onImport, theme = 'light' }: ProjectManagerProps) {
  const { data, loading, error, refetch } = useApi();
  const [storedData, setStoredData] = useLocalStorage<ProjectData | null>('projectData', null);
  const [projectName, setProjectName] = useState<string>('');
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    if (data && !loading && !error) {
      setStoredData(data);
    }
  }, [data, loading, error, setStoredData]);

  const validateProjectData = (): boolean => {
    if (!storedData) {
      toast.error('No project data available');
      return false;
    }
    return true;
  };

  const handleExport = () => {
    if (!validateProjectData()) return;
    try {
      const fileName = `${projectName.trim() || 'project'}-${new Date().toISOString().slice(0, 10)}.json`;
      const dataStr = JSON.stringify(storedData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Project exported successfully');
    } catch (error) {
      toast.error('Failed to export project');
      console.error('Export error:', error);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      toast.error('Please select a JSON file');
      return;
    }
    try {
      const text = await file.text();
      const importedData = JSON.parse(text) as ProjectData;
      if (!importedData || typeof importedData !== 'object') {
        throw new Error('Invalid project data format');
      }
      onImport(importedData);
      setProjectName(file.name.replace('.json', ''));
      toast.success('Project imported successfully');
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import project: Invalid file format');
    } finally {
      e.target.value = '';
    }
  };

  const handleClear = () => {
    if (!validateProjectData()) return;
    if (window.confirm('Are you sure you want to clear all project data? This action cannot be undone.')) {
      setStoredData(null);
      setProjectName('');
      toast.success('Project data cleared');
    }
  };

  const handleSave = () => {
    if (!validateProjectData()) return;
    try {
      localStorage.setItem('projectData', JSON.stringify(storedData));
      toast.success('Project saved successfully');
    } catch (error) {
      toast.error('Failed to save project');
      console.error('Save error:', error);
    }
  };

  const handleShare = async (method: 'copy' | 'email' | 'download' | 'qr') => {
    if (!validateProjectData()) return;
    
    try {
      const projectData = JSON.stringify(storedData);
      
      switch (method) {
        case 'copy':
          await navigator.clipboard.writeText(projectData);
          toast.success('Project data copied to clipboard');
          break;
          
        case 'email':
          const subject = encodeURIComponent(`${projectName || 'Project'} Data`);
          const body = encodeURIComponent(`Here's my project data:\n\n${projectData}`);
          window.location.href = `mailto:?subject=${subject}&body=${body}`;
          toast.success('Email client opened');
          break;
          
        case 'download':
          const blob = new Blob([projectData], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${projectName || 'project'}_share.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success('Project file ready for sharing');
          break;
          
        case 'qr':
          const qrData = `data:text/json;charset=utf-8,${encodeURIComponent(projectData)}`;
          window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`);
          toast.success('QR code generated');
          break;
      }
    } catch (error) {
      toast.error('Failed to share project');
      console.error('Share error:', error);
    }
    setShowShareMenu(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-2xl">
        <div className="flex items-center justify-center mb-8">
          <FolderKanban className={`w-8 h-8 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} mr-3`} />
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value.trim())}
            placeholder="Enter Project Name"
            className={`text-xl font-semibold px-4 py-2 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 outline-none w-full
              ${theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-black dark:text-black' 
                : 'bg-gray-50 border-gray-200'}`}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={handleExport}
            disabled={!storedData}
            className={`flex items-center justify-center gap-2 p-3 rounded-lg font-medium transition-all
              ${theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-black dark:text-black'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}
              ${!storedData ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105'}`}
          >
            <Download className="w-5 h-5" /> Export
          </button>

          <label className={`flex items-center justify-center gap-2 p-3 rounded-lg font-medium cursor-pointer transition-all
            ${theme === 'dark'
              ? 'bg-gray-700 hover:bg-gray-600 text-black dark:text-black'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}
            transform hover:scale-105`}
          >
            <Upload className="w-5 h-5" /> Import
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>

          <button
            onClick={handleSave}
            disabled={!storedData}
            className={`flex items-center justify-center gap-2 p-3 rounded-lg font-medium transition-all
              ${theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-black dark:text-black'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}
              ${!storedData ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105'}`}
          >
            <Save className="w-5 h-5" /> Save
          </button>

          <button
            onClick={refetch}
            disabled={loading}
            className={`flex items-center justify-center gap-2 p-3 rounded-lg font-medium transition-all
              ${theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-black dark:text-black'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}
              ${loading ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105'}`}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>

          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              disabled={!storedData}
              className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg font-medium transition-all
                ${theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-black dark:text-black'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}
                ${!storedData ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105'}`}
            >
              <Share2 className="w-5 h-5" /> Share
            </button>
            
            {showShareMenu && (
              <div className={`absolute top-full left-0 mt-2 w-48 rounded-md shadow-lg 
                ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} ring-1 ring-black ring-opacity-5 z-10`}>
                <div className="py-1">
                  <button
                    onClick={() => handleShare('copy')}
                    className={`block w-full text-left px-4 py-2 text-sm
                      ${theme === 'dark' ? 'text-gray-100 hover:bg-gray-700 dark:text-black' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Copy to Clipboard
                  </button>
                  <button
                    onClick={() => handleShare('email')}
                    className={`block w-full text-left px-4 py-2 text-sm
                      ${theme === 'dark' ? 'text-gray-100 hover:bg-gray-700 dark:text-black' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Share via Email
                  </button>
                  <button
                    onClick={() => handleShare('download')}
                    className={`block w-full text-left px-4 py-2 text-sm
                      ${theme === 'dark' ? 'text-gray-100 hover:bg-gray-700 dark:text-black' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Download Share File
                  </button>
                  <button
                    onClick={() => handleShare('qr')}
                    className={`block w-full text-left px-4 py-2 text-sm
                      ${theme === 'dark' ? 'text-gray-100 hover:bg-gray-700 dark:text-black' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Generate QR Code
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleClear}
            disabled={!storedData}
            className={`flex items-center justify-center gap-2 p-3 rounded-lg font-medium transition-all
              ${theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-black dark:text-black'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}
              ${!storedData ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105'}`}
          >
            <Trash2 className="w-5 h-5" /> Clear
          </button>
        </div>

        {loading && (
          <div className="text-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-600 dark:text-gray-300 animate-pulse" role="status">
              Loading project data...
            </p>
          </div>
        )}
        
        {error && (
          <div className="text-center p-4 bg-red-100 dark:bg-red-900 rounded-lg">
            <p className="text-red-600 dark:text-red-300" role="alert">
              Error: {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectManager;