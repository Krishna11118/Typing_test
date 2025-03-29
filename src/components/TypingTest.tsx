import React, { useEffect, useRef } from 'react';
import { useTypingStore } from '../store/useTypingStore';

export function TypingTest() {
  const {
    text,
    input,
    wpm,
    accuracy,
    errors,
    timer,
    isRunning,
    setInput,
    startTest,
    endTest,
    saveSession,
  } = useTypingStore();

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [timeLeft, setTimeLeft] = React.useState(timer);

  useEffect(() => {
    let interval: number;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      endTest();
      saveSession();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, endTest, saveSession]);

  const handleStart = () => {
    setTimeLeft(timer);
    startTest();
    inputRef.current?.focus();
  };

  const renderText = () => {
    return text.split('').map((char, i) => {
      let color = 'text-gray-800';
      if (i < input.length) {
        color = input[i] === char ? 'text-green-600' : 'text-red-600';
      }
      return (
        <span key={i} className={color}>
          {char}
        </span>
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between mb-8">
        <div className="text-2xl font-bold">Time: {timeLeft}s</div>
        <div className="space-x-8">
          <span className="text-2xl">WPM: {wpm}</span>
          <span className="text-2xl">Accuracy: {accuracy}%</span>
          <span className="text-2xl">Errors: {errors}</span>
        </div>
      </div>

      <div className="mb-8 p-4 bg-gray-100 rounded-lg text-lg leading-relaxed">
        {renderText()}
      </div>

      <textarea
        ref={inputRef}
        className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={!isRunning}
        placeholder={isRunning ? "Start typing..." : "Click Start to begin the test"}
      />

      <div className="mt-8 flex justify-center">
        <button
          onClick={handleStart}
          disabled={isRunning}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Start Test
        </button>
      </div>
    </div>
  );
}