import { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { Edit2, Plus, Trash2, Palette, Image as ImageIcon, FileText, Calendar, Clock, Flag } from 'lucide-react';

interface MindMapNodeData {
  label: string;
  depth?: number;
  color?: string;
  fontSize?: number;
  backgroundColor?: string;
  note?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  image?: string;
  completed?: boolean;
}

const NODE_COLORS = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200'
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-200'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-800 dark:text-purple-200'
  },
  pink: {
    bg: 'bg-pink-50 dark:bg-pink-900',
    border: 'border-pink-200 dark:border-pink-800',
    text: 'text-pink-800 dark:text-pink-200'
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-200'
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200'
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900',
    border: 'border-indigo-200 dark:border-indigo-800',
    text: 'text-indigo-800 dark:text-indigo-200'
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-800 dark:text-orange-200'
  }
};

const PRIORITY_COLORS = {
  low: 'text-green-500',
  medium: 'text-yellow-500',
  high: 'text-red-500'
};

function MindMapNode({ data, id }: NodeProps<MindMapNodeData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteValue, setNoteValue] = useState(data.note || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { setNodes, setEdges, getNode, getEdges } = useReactFlow();

  const onEditClick = useCallback((evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.stopPropagation();
    setIsEditing(true);
  }, []);

  const onEditKeyDown = useCallback((evt: React.KeyboardEvent<HTMLInputElement>) => {
    if (evt.key === 'Enter' || evt.key === 'Escape') {
      setIsEditing(false);
      if (evt.key === 'Enter' && editValue.trim()) {
        setNodes((nodes) =>
          nodes.map((node) =>
            node.id === id ? { ...node, data: { ...node.data, label: editValue.trim() } } : node
          )
        );
      } else if (evt.key === 'Escape') {
        setEditValue(data.label);
      }
    }
  }, [editValue, id, setNodes, data.label]);

  const addSubNode = useCallback(() => {
    const parentNode = getNode(id);
    if (!parentNode) return;

    // Get all existing child edges for this node
    const edges = getEdges();
    const childEdges = edges.filter(e => e.source === id);
    const yOffset = childEdges.length * 80;

    const newId = crypto.randomUUID();
    const newNode = {
      id: newId,
      type: 'mindmap',
      position: {
        x: parentNode.position.x + 250,
        y: parentNode.position.y + yOffset,
      },
      data: {
        label: 'New Sub-node',
        depth: (data.depth || 0) + 1,
        color: data.color || Object.keys(NODE_COLORS)[0],
      },
    };

    setNodes((nodes) => nodes.concat(newNode));
    setEdges((edges) =>
      edges.concat({
        id: `${id}-${newId}`,
        source: id,
        target: newId,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#2563eb' },
      })
    );
  }, [id, getNode, setNodes, setEdges, getEdges, data.depth, data.color]);

  const onDelete = useCallback(() => {
    // First get all descendant nodes recursively
    const edges = getEdges();
    const nodesToDelete = new Set<string>([id]);
    
    const findDescendants = (nodeId: string) => {
      const children = edges.filter(e => e.source === nodeId).map(e => e.target);
      children.forEach(childId => {
        nodesToDelete.add(childId);
        findDescendants(childId);
      });
    };
    
    findDescendants(id);

    setNodes((nodes) => nodes.filter((node) => !nodesToDelete.has(node.id)));
    setEdges((edges) => edges.filter((edge) => 
      !nodesToDelete.has(edge.source) && !nodesToDelete.has(edge.target)
    ));
  }, [id, setNodes, setEdges, getEdges]);

  const changeColor = useCallback((color: string) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, color } } : node
      )
    );
    setShowColorPicker(false);
  }, [id, setNodes]);

  const updateNodeData = useCallback((updates: Partial<MindMapNodeData>) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...updates } } : node
      )
    );
  }, [id, setNodes]);

  const toggleComplete = useCallback(() => {
    updateNodeData({ completed: !data.completed });
  }, [data.completed, updateNodeData]);

  const setPriority = useCallback((priority: 'low' | 'medium' | 'high') => {
    updateNodeData({ priority });
  }, [updateNodeData]);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateNodeData({ image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  }, [updateNodeData]);

  const saveNote = useCallback(() => {
    updateNodeData({ note: noteValue });
    setShowNoteInput(false);
  }, [noteValue, updateNodeData]);

  const getNodeColorStyle = () => {
    const colorKey = data.color || Object.keys(NODE_COLORS)[0];
    const colorSet = NODE_COLORS[colorKey as keyof typeof NODE_COLORS];
    return `${colorSet.bg} ${colorSet.border} ${colorSet.text}`;
  };

  return (
    <div 
      className={`group px-4 py-3 shadow-lg rounded-xl border-2 ${getNodeColorStyle()} transition-all duration-200 hover:shadow-xl ${
        data.completed ? 'opacity-75' : ''
      }`}
      style={{ fontSize: data.fontSize || 14 }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-blue-500"
      />

      <div className="flex flex-col gap-2 min-w-[200px]">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={data.completed}
            onChange={toggleComplete}
            className="mr-2 rounded border-gray-300"
          />
          {isEditing ? (
            <input
              type="text"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={onEditKeyDown}
              className="w-full px-2 py-1 text-sm bg-white border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              autoFocus
            />
          ) : (
            <>
              <div className={`flex-1 text-sm font-medium ${data.completed ? 'line-through' : ''}`}>
                {data.label}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
                  onClick={onEditClick}
                  title="Edit node"
                >
                  <Edit2 size={14} className="text-blue-600 dark:text-blue-400" />
                </button>
                <button
                  className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
                  onClick={addSubNode}
                  title="Add sub-node"
                >
                  <Plus size={14} className="text-blue-600 dark:text-blue-400" />
                </button>
                
                {/* Node Tools */}
                <div className="flex items-center gap-1">
                  <div className="relative">
                    <button
                      className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      title="Change color"
                    >
                      <Palette size={14} className="text-blue-600 dark:text-blue-400" />
                    </button>
                    {showColorPicker && (
                      <div className="absolute right-0 mt-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                        <div className="grid grid-cols-4 gap-1">
                          {Object.keys(NODE_COLORS).map((color) => (
                            <button
                              key={color}
                              onClick={() => changeColor(color)}
                              className={`w-6 h-6 rounded-full ${NODE_COLORS[color as keyof typeof NODE_COLORS].bg} border ${NODE_COLORS[color as keyof typeof NODE_COLORS].border}`}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
                    onClick={() => setShowNoteInput(true)}
                    title="Add note"
                  >
                    <FileText size={14} className="text-blue-600 dark:text-blue-400" />
                  </button>

                  <div className="relative">
                    <button
                      className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      title="Set due date"
                    >
                      <Calendar size={14} className="text-blue-600 dark:text-blue-400" />
                    </button>
                    {showDatePicker && (
                      <div className="absolute right-0 mt-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                        <input
                          type="datetime-local"
                          value={data.dueDate || ''}
                          onChange={(e) => updateNodeData({ dueDate: e.target.value })}
                          className="p-2 rounded border dark:border-gray-600 bg-white dark:bg-gray-700"
                        />
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <button
                      className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
                      onClick={() => document.getElementById(`image-upload-${id}`)?.click()}
                      title="Add image"
                    >
                      <ImageIcon size={14} className="text-blue-600 dark:text-blue-400" />
                    </button>
                    <input
                      id={`image-upload-${id}`}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>

                  <div className="relative">
                    <button
                      className={`p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors ${
                        data.priority ? PRIORITY_COLORS[data.priority] : ''
                      }`}
                      onClick={() => setPriority(data.priority === 'high' ? 'low' : data.priority === 'medium' ? 'high' : 'medium')}
                      title="Set priority"
                    >
                      <Flag size={14} />
                    </button>
                  </div>

                  <button
                    className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
                    onClick={onDelete}
                    title="Delete node"
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Node Content */}
        {data.image && (
          <div className="mt-2">
            <img src={data.image} alt="Node attachment" className="max-w-full h-auto rounded" />
          </div>
        )}

        {data.note && (
          <div className="mt-2 text-sm bg-white/50 dark:bg-gray-800/50 p-2 rounded">
            {data.note}
          </div>
        )}

        {data.dueDate && (
          <div className="mt-2 text-xs flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <Clock size={12} />
            {new Date(data.dueDate).toLocaleString()}
          </div>
        )}
      </div>

      {/* Note Input Modal */}
      {showNoteInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Add Note</h3>
            <textarea
              value={noteValue}
              onChange={(e) => setNoteValue(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 mb-4"
              rows={4}
              placeholder="Enter note..."
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNoteInput(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={saveNote}
                className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-blue-500"
      />
    </div>
  );
}

export default memo(MindMapNode);
