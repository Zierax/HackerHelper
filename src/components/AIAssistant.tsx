import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: selectedProvider,
          message: userMessage,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.response,
          timestamp: new Date()
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Error: ${data.error}`,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Error: Failed to get response from server',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-grow overflow-hidden flex flex-col max-w-6xl mx-auto w-full p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">AI Assistant</h2>
              <select 
                value={selectedProvider} 
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <option value="openai">OpenAI GPT-4</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="gemini">Google Gemini</option>
                <option value="groq">Groq</option>
              </select>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-grow overflow-y-auto p-6 space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex flex-col max-w-[80%] space-y-1`}>
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white ml-auto'
                        : 'bg-gray-200 dark:bg-gray-700 dark:text-white'
                    }`}
                  >
                    <pre className="whitespace-pre-wrap font-sans text-sm">
                      {message.content}
                    </pre>
                  </div>
                  <span className={`text-xs text-gray-500 dark:text-gray-400 ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center text-gray-500 dark:text-gray-400">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce"></div>
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
              />
              <button 
                type="submit" 
                disabled={loading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {loading ? (
                  <span className="flex items-center space-x-2">
                    <span>Sending</span>
                  </span>
                ) : (
                  'Send'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
