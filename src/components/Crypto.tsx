import React, { useState, useCallback } from 'react';
import {
  Lock, Unlock, Copy, Check, Shield, Key,
  FileText, Zap, Code, Terminal, RefreshCw
} from 'lucide-react';
import CryptoJS from 'crypto-js';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

export default function Crypto() {
  const [input, setInput] = useState('');
  const [key, setKey] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [algorithm, setAlgorithm] = useState('AES');
  const [copied, setCopied] = useState(false);
  const [encoding, setEncoding] = useState('base64');
  const [activeTab, setActiveTab] = useState<'crypto' | 'encoding'>('crypto');

  const algorithms = {
    AES: {
      encrypt: (text: string, key: string) => CryptoJS.AES.encrypt(text, key).toString(),
      decrypt: (text: string, key: string) => {
        try {
          return CryptoJS.AES.decrypt(text, key).toString(CryptoJS.enc.Utf8);
        } catch {
          return 'Decryption failed. Check your key and input.';
        }
      }
    },
    TripleDES: {
      encrypt: (text: string, key: string) => CryptoJS.TripleDES.encrypt(text, key).toString(),
      decrypt: (text: string, key: string) => {
        try {
          return CryptoJS.TripleDES.decrypt(text, key).toString(CryptoJS.enc.Utf8);
        } catch {
          return 'Decryption failed. Check your key and input.';
        }
      }
    },
    RC4: {
      encrypt: (text: string, key: string) => CryptoJS.RC4.encrypt(text, key).toString(),
      decrypt: (text: string, key: string) => {
        try {
          return CryptoJS.RC4.decrypt(text, key).toString(CryptoJS.enc.Utf8);
        } catch {
          return 'Decryption failed. Check your key and input.';
        }
      }
    },
    Rabbit: {
      encrypt: (text: string, key: string) => CryptoJS.Rabbit.encrypt(text, key).toString(),
      decrypt: (text: string, key: string) => {
        try {
          return CryptoJS.Rabbit.decrypt(text, key).toString(CryptoJS.enc.Utf8);
        } catch {
          return 'Decryption failed. Check your key and input.';
        }
      }
    }
  };

  const encodings = {
    base64: {
      encode: (text: string) => btoa(text),
      decode: (text: string) => atob(text)
    },
    hex: {
      encode: (text: string) => Array.from(text).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(''),
      decode: (text: string) => text.match(/.{1,2}/g)?.map(byte => String.fromCharCode(parseInt(byte, 16))).join('') || ''
    },
    binary: {
      encode: (text: string) => Array.from(text).map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' '),
      decode: (text: string) => text.split(' ').map(bin => String.fromCharCode(parseInt(bin, 2))).join('')
    },
    url: {
      encode: (text: string) => encodeURIComponent(text),
      decode: (text: string) => decodeURIComponent(text)
    },
    rot13: {
      encode: (text: string) => text.replace(/[a-zA-Z]/g, c => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26)),
      decode: (text: string) => text.replace(/[a-zA-Z]/g, c => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26))
    },
    morse: {
      encode: (text: string) => text.toUpperCase().split('').map(c => {
        const morse: {[key: string]: string} = {
          'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
          'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
          'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
          'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
          'Y': '-.--', 'Z': '--..', ' ': '/'
        };
        return morse[c] || c;
      }).join(' '),
      decode: (text: string) => text.split(' ').map(c => {
        const morse: {[key: string]: string} = {
          '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E', '..-.': 'F',
          '--.': 'G', '....': 'H', '..': 'I', '.---': 'J', '-.-': 'K', '.-..': 'L',
          '--': 'M', '-.': 'N', '---': 'O', '.--.': 'P', '--.-': 'Q', '.-.': 'R',
          '...': 'S', '-': 'T', '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X',
          '-.--': 'Y', '--..': 'Z', '/': ' '
        };
        return morse[c] || c;
      }).join('')
    }
  };

  const handleCrypto = useCallback(() => {
    if (!input || !key) return;
    const result = mode === 'encrypt'
      ? algorithms[algorithm as keyof typeof algorithms].encrypt(input, key)
      : algorithms[algorithm as keyof typeof algorithms].decrypt(input, key);
    setOutput(result);
  }, [input, key, mode, algorithm]);

  const handleEncode = useCallback(() => {
    if (!input) return;
    const result = encodings[encoding as keyof typeof encodings].encode(input);
    setOutput(result);
  }, [input, encoding]);

  const handleDecode = useCallback(() => {
    if (!input) return;
    const result = encodings[encoding as keyof typeof encodings].decode(input);
    setOutput(result);
  }, [input, encoding]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  return (
    <div className="min-h-screen p-4 sm:p-6 transition-all">
      <div className="max-w-4xl mx-auto neo-glass">
        <div className="flex">
          {['crypto', 'encoding'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-4 px-6 text-sm font-medium transition-all
                ${activeTab === tab
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'crypto' && (
            <motion.div
              key="crypto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 space-y-6"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Input Text
                  </label>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter text..."
                    className="w-full p-3 rounded-lg bg-white/5 backdrop-blur border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 min-h-[150px]"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Encryption Key
                    </label>
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      placeholder="Enter key..."
                      className="w-full p-3 rounded-lg bg-white/5 backdrop-blur border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Algorithm
                    </label>
                    <select
                      value={algorithm}
                      onChange={(e) => setAlgorithm(e.target.value)}
                      className="w-full p-3 rounded-lg bg-white/5 backdrop-blur border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500"
                    >
                      {Object.keys(algorithms).map((algo) => (
                        <option key={algo} value={algo}>{algo}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setMode('encrypt')}
                      className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 transition-all
                        ${mode === 'encrypt'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    >
                      <Lock className="w-4 h-4" /> Encrypt
                    </button>
                    <button
                      onClick={() => setMode('decrypt')}
                      className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 transition-all
                        ${mode === 'decrypt'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    >
                      <Unlock className="w-4 h-4" /> Decrypt
                    </button>
                  </div>

                  <button
                    onClick={handleCrypto}
                    disabled={!input || !key}
                    className="w-full p-3 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Process
                  </button>
                </div>
              </div>

              {output && (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Result
                  </label>
                  <div className="relative bg-white/5 backdrop-blur p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <pre className="text-sm whitespace-pre-wrap break-words">{output}</pre>
                    <button
                      onClick={handleCopy}
                      className="absolute top-2 right-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'encoding' && (
            <motion.div
              key="encoding"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 space-y-6"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Input Text
                  </label>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter text..."
                    className="w-full p-3 rounded-lg bg-white/5 backdrop-blur border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 min-h-[150px]"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Encoding Method
                    </label>
                    <select
                      value={encoding}
                      onChange={(e) => setEncoding(e.target.value)}
                      className="w-full p-3 rounded-lg bg-white/5 backdrop-blur border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500"
                    >
                      {Object.keys(encodings).map((enc) => (
                        <option key={enc} value={enc}>{enc.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleEncode}
                      disabled={!input}
                      className="flex-1 p-3 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Encode
                    </button>
                    <button
                      onClick={handleDecode}
                      disabled={!input}
                      className="flex-1 p-3 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Decode
                    </button>
                  </div>
                </div>
              </div>

              {output && (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Result
                  </label>
                  <div className="relative bg-white/5 backdrop-blur p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <pre className="text-sm whitespace-pre-wrap break-words">{output}</pre>
                    <button
                      onClick={handleCopy}
                      className="absolute top-2 right-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}