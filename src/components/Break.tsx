import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// Timer Component
const Timer: React.FC<{ duration: number; onTimerEnd: () => void }> = ({ duration, onTimerEnd }) => {
  const [timeLeft, setTimeLeft] = useState<number>(duration);
  const [isActive, setIsActive] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsActive(false);
            onTimerEnd();
            return duration;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, onTimerEnd, duration]);

  const startStopTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(duration);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-lg p-6 w-[300px] text-center"
    >
      <h2 className="text-2xl font-bold mb-3 text-foreground">Break Time</h2>
      <div className="text-5xl font-bold mb-6 text-indigo-600 dark:text-indigo-400">
        {formatTime(timeLeft)}
      </div>
      <div className="flex justify-center gap-3">
        <button
          onClick={startStopTimer}
          className="px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={resetTimer}
          className="px-5 py-2 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 transition-colors shadow-sm"
        >
          Reset
        </button>
      </div>
    </motion.div>
  );
};

// Break Component
const Break: React.FC = () => {
  const [showMessage, setShowMessage] = useState<boolean>(false);
  const [breakDuration, setBreakDuration] = useState<number>(5 * 60);
  const [customDuration, setCustomDuration] = useState<number>(0);

  const predefinedBreaks = [
    { name: 'Quick Stretch', duration: 2 * 60, icon: '🧘‍♂️' },
    { name: 'Coffee Break', duration: 5 * 60, icon: '☕' },
    { name: 'Power Nap', duration: 15 * 60, icon: '😴' },
    { name: 'Lunch Break', duration: 30 * 60, icon: '🍽️' },
    { name: 'Exercise', duration: 45 * 60, icon: '💪' }
  ];

  const handleBreakEnd = () => {
    setShowMessage(true);
    setTimeout(() => {
      alert("Time to get back to work! 💪");
      setShowMessage(false);
    }, 1000);
  };

  const handleCustomDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setCustomDuration(value > 0 ? value * 60 : 0);
  };

  const handleSetCustomDuration = () => {
    if (customDuration > 0) {
      setBreakDuration(customDuration);
    } else {
      setBreakDuration(5 * 60); // Default to 5 minutes if invalid
    }
  };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 overflow-hidden">
            <div className="max-w-3xl w-full">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-6 grid grid-cols-3 sm:grid-cols-5 gap-3"
                >
                    {predefinedBreaks.map((breakOption) => (
                        <button
                            key={breakOption.name}
                            onClick={() => setBreakDuration(breakOption.duration)}
                            className="p-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg hover:bg-white/20 transition-all"
                        >
                            <div className="text-xl mb-1">{breakOption.icon}</div>
                            <div className="text-sm font-medium">{breakOption.name}</div>
                            <div className="text-xs text-gray-500">{Math.floor(breakOption.duration / 60)}m</div>
                        </button>
                    ))}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-6 p-4 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg"
                >
                    <h3 className="text-lg font-medium mb-3">Custom Break</h3>
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            min="1"
                            onChange={handleCustomDurationChange}
                            placeholder="Minutes"
                            className="w-24 p-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/10"
                        />
                        <button
                            onClick={handleSetCustomDuration}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 transition-colors"
                        >
                            Set
                        </button>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="flex justify-center"
                >
                    <Timer duration={breakDuration} onTimerEnd={handleBreakEnd} />
                </motion.div>

                {showMessage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-6 text-center text-lg font-medium text-red-600 dark:text-red-400 animate-pulse"
                    >
                        Break time is over!
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Break;