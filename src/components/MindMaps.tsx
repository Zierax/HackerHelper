import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Edge,
  MiniMap,
  Node,
  NodeTypes,
  Panel,
  ReactFlowInstance,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import MindMapNode from './MindMapNode';
import { PlusCircle, Save, Upload, Download, Layout, ZoomIn, ZoomOut, Undo, Redo, Edit2, Trash2, Search, Filter, Settings, Share2, Grid, List } from 'lucide-react';

// Cache Manager Class
class MindMapCache {
  private static instance: MindMapCache;
  private cache: Map<string, {
    nodes: Node[];
    edges: Edge[];
    lastModified: number;
    name: string;
  }>;
  private maxAge: number = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  private constructor() {
    this.cache = new Map();
    // Initialize with default mindmap
    this.cache.set('default', {
      nodes: [
        {
          id: '1',
          type: 'mindmap',
          data: { 
            label: 'Main Topic',
            depth: 0,
            color: 'blue'
          },
          position: { x: 0, y: 0 },
        },
      ],
      edges: [],
      lastModified: Date.now(),
      name: 'Default Mind Map'
    });
  }

  public static getInstance(): MindMapCache {
    if (!MindMapCache.instance) {
      MindMapCache.instance = new MindMapCache();
    }
    return MindMapCache.instance;
  }

  public getMindMap(id: string) {
    return this.cache.get(id);
  }

  public getAllMindMaps() {
    return Array.from(this.cache.keys());
  }

  public getMindMapNames() {
    const names: Record<string, string> = {};
    this.cache.forEach((value, key) => {
      names[key] = value.name;
    });
    return names;
  }

  public saveMindMap(id: string, nodes: Node[], edges: Edge[], name?: string) {
    const existingMap = this.cache.get(id);
    this.cache.set(id, {
      nodes,
      edges,
      lastModified: Date.now(),
      name: name || existingMap?.name || `Mind Map ${id.slice(0, 6)}`
    });
    this.cleanup();
  }

  public deleteMindMap(id: string) {
    if (id === 'default') return false;
    return this.cache.delete(id);
  }

  public renameMindMap(id: string, newName: string) {
    const mindMap = this.cache.get(id);
    if (mindMap) {
      mindMap.name = newName;
      this.cache.set(id, mindMap);
      return true;
    }
    return false;
  }

  private cleanup() {
    const now = Date.now();
    this.cache.forEach((value, key) => {
      if (key !== 'default' && now - value.lastModified > this.maxAge) {
        this.cache.delete(key);
      }
    });
  }
}

const nodeTypes: NodeTypes = {
  mindmap: MindMapNode,
};

type HistoryState = {
  nodes: Node[];
  edges: Edge[];
};

const themes = {
  light: {
    background: 'bg-gray-50',
    node: 'bg-white',
    text: 'text-gray-800',
    border: 'border-blue-200',
    accent: 'bg-blue-500',
  },
  dark: {
    background: 'bg-gray-900',
    node: 'bg-gray-800',
    text: 'text-gray-200',
    border: 'border-blue-800',
    accent: 'bg-blue-600',
  },
  nature: {
    background: 'bg-green-50',
    node: 'bg-white',
    text: 'text-green-800',
    border: 'border-green-200',
    accent: 'bg-green-500',
  },
  ocean: {
    background: 'bg-blue-50',
    node: 'bg-white',
    text: 'text-blue-800',
    border: 'border-blue-200',
    accent: 'bg-blue-500',
  }
};

function MindMapFlow() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [currentMindMapId, setCurrentMindMapId] = useState<string>('default');
  const cacheManager = useRef(MindMapCache.getInstance());
  const [mindMapList, setMindMapList] = useState<string[]>(() => cacheManager.current.getAllMindMaps());
  const [mindMapNames, setMindMapNames] = useState<Record<string, string>>(() => cacheManager.current.getMindMapNames());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mindMapToDelete, setMindMapToDelete] = useState<string | null>(null);
  const [showRenameInput, setShowRenameInput] = useState(false);
  const [newName, setNewName] = useState('');
  
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [zoomLevel, setZoomLevel] = useState(1);

  const [currentTheme, setCurrentTheme] = useState<keyof typeof themes>('light');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');

  // Add viewport state and controls
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const { fitView, setCenter, setViewport: setReactFlowViewport } = useReactFlow();

  // Function to fit view with padding
  const fitViewWithPadding = useCallback(() => {
    fitView({ padding: 0.5, duration: 800 });
  }, [fitView]);

  // Function to handle zoom
  const handleZoom = useCallback((zoomLevel: number) => {
    if (reactFlowInstance) {
      const { x, y } = reactFlowInstance.getViewport();
      reactFlowInstance.setViewport({ x, y, zoom: zoomLevel }, { duration: 800 });
    }
  }, [reactFlowInstance]);

  // Center view when nodes change
  useEffect(() => {
    if (nodes.length > 0) {
      fitViewWithPadding();
    }
  }, [nodes, fitViewWithPadding]);

  // Filter and sort mindmaps
  const filteredMindMaps = useMemo(() => {
    return mindMapList
      .filter(id => {
        const mindMap = cacheManager.current.getMindMap(id);
        const matchesSearch = mindMapNames[id]?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPriority = filterPriority === 'all' || mindMap?.nodes.some(node => node.data.priority === filterPriority);
        return matchesSearch && matchesPriority;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return (mindMapNames[a] || '').localeCompare(mindMapNames[b] || '');
        } else {
          const mapA = cacheManager.current.getMindMap(a);
          const mapB = cacheManager.current.getMindMap(b);
          return (mapB?.lastModified || 0) - (mapA?.lastModified || 0);
        }
      });
  }, [mindMapList, mindMapNames, searchTerm, filterPriority, sortBy]);

  // Auto-save functionality using cache
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      cacheManager.current.saveMindMap(currentMindMapId, nodes, edges);
      setMindMapList(cacheManager.current.getAllMindMaps());
      setMindMapNames(cacheManager.current.getMindMapNames());
    }
  }, [nodes, edges, currentMindMapId]);

  // Save current state to history when nodes or edges change
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      const newState = { nodes, edges };
      setHistory(prev => {
        const newHistory = prev.slice(0, currentHistoryIndex + 1);
        return [...newHistory, newState];
      });
      setCurrentHistoryIndex(prev => prev + 1);
    }
  }, [nodes, edges]);

  const onConnect = useCallback((params: any) => {
    setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      animated: true,
      style: { stroke: themes[currentTheme].accent },
    }, eds));
  }, [setEdges, currentTheme]);

  const addNewMindMap = useCallback(() => {
    const newMindMapId = crypto.randomUUID();
    cacheManager.current.saveMindMap(newMindMapId, [
      {
        id: '1',
        type: 'mindmap',
        data: { 
          label: 'Main Topic',
          depth: 0,
          color: 'blue'
        },
        position: { x: 0, y: 0 },
      },
    ], []);
    setCurrentMindMapId(newMindMapId);
    setNodes([
      {
        id: '1',
        type: 'mindmap',
        data: { 
          label: 'Main Topic',
          depth: 0,
          color: 'blue'
        },
        position: { x: 0, y: 0 },
      },
    ]);
    setEdges([]);
    setHistory([{ nodes: [
      {
        id: '1',
        type: 'mindmap',
        data: { 
          label: 'Main Topic',
          depth: 0,
          color: 'blue'
        },
        position: { x: 0, y: 0 },
      },
    ], edges: [] }]);
    setCurrentHistoryIndex(0);
    setMindMapList(cacheManager.current.getAllMindMaps());
    setMindMapNames(cacheManager.current.getMindMapNames());
  }, [setNodes, setEdges]);

  const deleteMindMap = useCallback((id: string) => {
    if (id === 'default') {
      alert('Cannot delete the default mind map');
      return;
    }
    setMindMapToDelete(id);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!mindMapToDelete) return;

    if (cacheManager.current.deleteMindMap(mindMapToDelete)) {
      if (currentMindMapId === mindMapToDelete) {
        setCurrentMindMapId('default');
        const defaultMap = cacheManager.current.getMindMap('default');
        if (defaultMap) {
          setNodes(defaultMap.nodes);
          setEdges(defaultMap.edges);
        }
      }
      setMindMapList(cacheManager.current.getAllMindMaps());
      setMindMapNames(cacheManager.current.getMindMapNames());
    }

    setShowDeleteConfirm(false);
    setMindMapToDelete(null);
  }, [mindMapToDelete, currentMindMapId, setNodes, setEdges]);

  const renameMindMap = useCallback((id: string) => {
    if (id === 'default') {
      alert('Cannot rename the default mind map');
      return;
    }
    setCurrentMindMapId(id);
    const currentMap = cacheManager.current.getMindMap(id);
    setNewName(currentMap?.name || `Mind Map ${id.slice(0, 6)}`);
    setShowRenameInput(true);
  }, []);

  const confirmRename = useCallback(() => {
    if (!newName.trim()) return;
    
    if (cacheManager.current.renameMindMap(currentMindMapId, newName.trim())) {
      setMindMapNames(cacheManager.current.getMindMapNames());
    }
    setShowRenameInput(false);
    setNewName('');
  }, [currentMindMapId, newName]);

  const loadMindMap = useCallback((id: string) => {
    const mindMap = cacheManager.current.getMindMap(id);
    if (mindMap) {
      setNodes(mindMap.nodes);
      setEdges(mindMap.edges);
      setHistory([{ nodes: mindMap.nodes, edges: mindMap.edges }]);
      setCurrentHistoryIndex(0);
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    loadMindMap(currentMindMapId);
  }, [currentMindMapId, loadMindMap]);

  const undo = useCallback(() => {
    if (currentHistoryIndex > 0) {
      const prevState = history[currentHistoryIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setCurrentHistoryIndex(prev => prev - 1);
    }
  }, [currentHistoryIndex, history, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (currentHistoryIndex < history.length - 1) {
      const nextState = history[currentHistoryIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setCurrentHistoryIndex(prev => prev + 1);
    }
  }, [currentHistoryIndex, history, setNodes, setEdges]);

  const autoLayout = useCallback(() => {
    if (!reactFlowInstance) return;

    const layoutNodes = (nodes: Node[], parentNode: Node | null = null, level = 0, index = 0) => {
      const children = edges
        .filter(e => e.source === parentNode?.id)
        .map(e => nodes.find(n => n.id === e.target))
        .filter((n): n is Node => n !== undefined);

      if (parentNode) {
        const y = level * 150;
        const x = index * 250;
        parentNode.position = { x, y };
      }

      children.forEach((child, i) => {
        layoutNodes(nodes, child, level + 1, i);
      });

      return nodes;
    };

    const rootNode = nodes.find(n => !edges.some(e => e.target === n.id));
    if (rootNode) {
      const newNodes = layoutNodes([...nodes], rootNode);
      setNodes(newNodes);
    }
  }, [nodes, edges, reactFlowInstance, setNodes]);

  const onSave = useCallback(() => {
    if (reactFlowInstance) {
      cacheManager.current.saveMindMap(currentMindMapId, nodes, edges);
    }
  }, [reactFlowInstance, currentMindMapId, nodes, edges]);

  const onRestore = useCallback(() => {
    const restoreFlow = async () => {
      const mindMap = cacheManager.current.getMindMap(currentMindMapId);
      if (mindMap) {
        setNodes(mindMap.nodes);
        setEdges(mindMap.edges);
        setHistory([{ nodes: mindMap.nodes, edges: mindMap.edges }]);
        setCurrentHistoryIndex(0);
      }
    };
    restoreFlow();
  }, [setNodes, setEdges, currentMindMapId]);

  const onExport = useCallback(() => {
    if (reactFlowInstance) {
      const mindMap = cacheManager.current.getMindMap(currentMindMapId);
      if (mindMap) {
        const data = {
          nodes: mindMap.nodes,
          edges: mindMap.edges,
          name: mindMapNames[currentMindMapId],
          exportDate: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${mindMapNames[currentMindMapId] || 'mindmap'}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  }, [reactFlowInstance, currentMindMapId, mindMapNames]);

  const exportMindMap = useCallback(() => {
    if (reactFlowInstance) {
      const mindMap = cacheManager.current.getMindMap(currentMindMapId);
      if (mindMap) {
        const data = {
          nodes: mindMap.nodes,
          edges: mindMap.edges,
          name: mindMapNames[currentMindMapId],
          exportDate: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${mindMapNames[currentMindMapId] || 'mindmap'}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  }, [reactFlowInstance, currentMindMapId, mindMapNames]);

  return (
    <div className={`w-full h-screen ${themes[currentTheme].background} transition-colors duration-300`}>
      {/* Top Toolbar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between gap-4 bg-opacity-90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4 flex-1">
          {/* Mindmap Selection */}
          <select
            value={currentMindMapId}
            onChange={(e) => {
              setCurrentMindMapId(e.target.value);
              loadMindMap(e.target.value);
            }}
            className={`p-2 rounded-lg ${themes[currentTheme].node} shadow-lg border-2 ${themes[currentTheme].border} ${themes[currentTheme].text} min-w-[200px]`}
          >
            {filteredMindMaps.map(id => (
              <option key={id} value={id}>
                {mindMapNames[id] || `Mind Map ${id.slice(0, 6)}`}
              </option>
            ))}
          </select>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search mindmaps..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full p-2 pl-10 rounded-lg ${themes[currentTheme].node} shadow-lg border-2 ${themes[currentTheme].border} ${themes[currentTheme].text}`}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
            className={`p-2 rounded-lg ${themes[currentTheme].node} shadow-lg hover:shadow-xl transition-shadow`}
          >
            {viewMode === 'grid' ? <List size={20} /> : <Grid size={20} />}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className={`p-2 rounded-lg ${themes[currentTheme].node} shadow-lg hover:shadow-xl transition-shadow`}
          >
            <Settings size={20} />
          </button>
          <button
            onClick={exportMindMap}
            className={`p-2 rounded-lg ${themes[currentTheme].node} shadow-lg hover:shadow-xl transition-shadow`}
          >
            <Download size={20} />
          </button>
          <button
            onClick={addNewMindMap}
            className={`px-4 py-2 rounded-lg ${themes[currentTheme].accent} text-white shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2`}
          >
            <PlusCircle size={20} />
            New Map
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${themes[currentTheme].node} p-6 rounded-xl shadow-2xl max-w-md w-full`}>
            <h2 className={`text-xl font-semibold mb-4 ${themes[currentTheme].text}`}>Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className={`block mb-2 ${themes[currentTheme].text}`}>Theme</label>
                <select
                  value={currentTheme}
                  onChange={(e) => setCurrentTheme(e.target.value as keyof typeof themes)}
                  className={`w-full p-2 rounded-lg ${themes[currentTheme].node} border ${themes[currentTheme].border}`}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="nature">Nature</option>
                  <option value="ocean">Ocean</option>
                </select>
              </div>

              <div>
                <label className={`block mb-2 ${themes[currentTheme].text}`}>Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'date')}
                  className={`w-full p-2 rounded-lg ${themes[currentTheme].node} border ${themes[currentTheme].border}`}
                >
                  <option value="date">Last Modified</option>
                  <option value="name">Name</option>
                </select>
              </div>

              <div>
                <label className={`block mb-2 ${themes[currentTheme].text}`}>Filter Priority</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className={`w-full p-2 rounded-lg ${themes[currentTheme].node} border ${themes[currentTheme].border}`}
                >
                  <option value="all">All</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className={`px-4 py-2 rounded-lg ${themes[currentTheme].accent} text-white`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: themes[currentTheme].accent },
        }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        fitView
        fitViewOptions={{ padding: 0.5, duration: 800 }}
        onViewportChange={setViewport}
        className={`transition-colors duration-300 ${viewMode === 'grid' ? 'bg-dot-pattern' : ''}`}
      >
        <Background />
        <Controls 
          className={`${themes[currentTheme].node} shadow-lg`}
          showInteractive={false}
          position="bottom-right"
        />
        <MiniMap 
          className={`${themes[currentTheme].node} shadow-lg`}
          maskColor="rgba(0, 0, 0, 0.1)"
          position="bottom-left"
        />
        
        {/* Side Panel */}
        <Panel position="top-right" className="space-x-2">
          <button
            onClick={fitViewWithPadding}
            className={`p-2 rounded-lg ${themes[currentTheme].node} shadow-lg hover:shadow-xl transition-shadow`}
            title="Fit View"
          >
            <Layout size={20} />
          </button>
          <button
            onClick={() => handleZoom(viewport.zoom * 1.2)}
            className={`p-2 rounded-lg ${themes[currentTheme].node} shadow-lg hover:shadow-xl transition-shadow`}
            title="Zoom In"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={() => handleZoom(viewport.zoom / 1.2)}
            className={`p-2 rounded-lg ${themes[currentTheme].node} shadow-lg hover:shadow-xl transition-shadow`}
            title="Zoom Out"
          >
            <ZoomOut size={20} />
          </button>
        </Panel>

        {/* Bottom Panel */}
        <Panel position="bottom-right" className="space-x-2">
          <button
            onClick={undo}
            disabled={currentHistoryIndex <= 0}
            className={`p-2 rounded-lg ${themes[currentTheme].node} shadow-lg disabled:opacity-50`}
          >
            <Undo size={20} />
          </button>
          <button
            onClick={redo}
            disabled={currentHistoryIndex >= history.length - 1}
            className={`p-2 rounded-lg ${themes[currentTheme].node} shadow-lg disabled:opacity-50`}
          >
            <Redo size={20} />
          </button>
          <button
            onClick={onSave}
            className={`p-2 rounded-lg ${themes[currentTheme].node} shadow-lg`}
          >
            <Save size={20} />
          </button>
        </Panel>
      </ReactFlow>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${themes[currentTheme].node} p-6 rounded-xl shadow-2xl max-w-md w-full`}>
            <h2 className={`text-xl font-semibold mb-4 ${themes[currentTheme].text}`}>Delete Mindmap</h2>
            <p className={`mb-6 ${themes[currentTheme].text}`}>
              Are you sure you want to delete this mindmap? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`px-4 py-2 rounded-lg ${themes[currentTheme].node} border ${themes[currentTheme].border}`}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-red-500 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${themes[currentTheme].node} p-6 rounded-xl shadow-2xl max-w-md w-full`}>
            <h2 className={`text-xl font-semibold mb-4 ${themes[currentTheme].text}`}>Rename Mindmap</h2>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className={`w-full p-2 mb-6 rounded-lg ${themes[currentTheme].node} border ${themes[currentTheme].border}`}
              placeholder="Enter new name"
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowRenameInput(false)}
                className={`px-4 py-2 rounded-lg ${themes[currentTheme].node} border ${themes[currentTheme].border}`}
              >
                Cancel
              </button>
              <button
                onClick={confirmRename}
                className={`px-4 py-2 rounded-lg ${themes[currentTheme].accent} text-white`}
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MindMaps() {
  return (
    <ReactFlowProvider>
      <MindMapFlow />
    </ReactFlowProvider>
  );
}
