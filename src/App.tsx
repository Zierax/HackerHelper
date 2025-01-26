import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Loading } from './components/ui/loading';
import ErrorBoundary from './components/ErrorBoundary';
import { useStore } from './store';
import MainLayout from './components/layout/MainLayout';
import { ProjectData } from './utils/hooks/useApi';
import SecurityTools from './components/Tools';
import Help from './components/Help';
import About from './components/About';
import AIAssistant from './components/AIAssistant';

const Tools = lazy(() => import('./components/Tools'));
const ProjectManager = lazy(() => import('./core/ProjectManager'));
const Crypto = lazy(() => import('./components/Crypto'));
const MindMaps = lazy(() => import('./components/MindMaps'));
const Repos = lazy(() => import('./components/Repos'));
const Notes = lazy(() => import('./components/Notes'));
const Tasks = lazy(() => import('./components/Tasks'));
const Break = lazy(() => import('./components/Break'));

const LoadingComponent = () => (
  <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
    <Loading />
  </div>
);

function App() {
  const { setTasks, setNotes, setTags, setRepos, setMindMaps } = useStore();

  const handleProjectImport = (data: ProjectData) => {
    setTasks(data.tasks);
    setNotes(data.notes);
    setTags(data.tags);
    setRepos(data.repos);
    setMindMaps(data.mindMaps);
    console.log('Project imported successfully');
  };

  return (
    <Router>
      <ErrorBoundary>
        <Suspense fallback={<LoadingComponent />}>
          <div className="min-h-screen">
            <ToastContainer 
              position="bottom-right" 
              theme="dark" 
              limit={3}
              autoClose={3000}
            />
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Help />} />
                <Route path="tools" element={<SecurityTools />} />
                <Route path="crypto" element={<Crypto />} />
                <Route path="mindmaps" element={<MindMaps />} />
                <Route path="repos" element={<Repos />} />
                <Route path="notes" element={<Notes />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="break" element={<Break />} />
                <Route path="about" element={<About />} />
                <Route path="ai-assistant" element={<AIAssistant />} />
                <Route path="projectManager" element={<ProjectManager onImport={handleProjectImport} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </div>
        </Suspense>
      </ErrorBoundary>
    </Router>
  );
}

export default App;