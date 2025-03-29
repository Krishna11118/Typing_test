import { create } from 'zustand';
import { sessions } from '../lib/api';

interface TypingState {
  text: string;
  input: string;
  wpm: number;
  accuracy: number;
  errors: number;
  timer: number;
  isRunning: boolean;
  startTime: number | null;
  errorWords: Map<string, number>;
  typingPatterns: {
    pauseStartTime: number | null;
    currentWordStartTime: number | null;
    speedMeasurements: Array<{ timestamp: number; wpm: number; afterError: boolean }>;
    recoveryTimes: Array<{ errorTimestamp: number; recoveryDuration: number }>;
  };
  setInput: (input: string) => void;
  startTest: () => void;
  endTest: () => void;
  saveSession: () => Promise<void>;
}

export const useTypingStore = create<TypingState>((set, get) => ({
  text: "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump! The five boxing wizards jump quickly.",
  input: "",
  wpm: 0,
  accuracy: 100,
  errors: 0,
  timer: 30,
  isRunning: false,
  startTime: null,
  errorWords: new Map(),
  typingPatterns: {
    pauseStartTime: null,
    currentWordStartTime: null,
    speedMeasurements: [],
    recoveryTimes: [],
  },

  setInput: (input) => {
    const state = get();
    const prevInput = state.input;
    
    set({ input });

    if (state.isRunning) {
      const currentTime = Date.now();
      const elapsedTime = (currentTime - (state.startTime || currentTime)) / 1000 / 60;
      
      // Calculate basic metrics
      const wordsTyped = input.trim().split(' ').length;
      const wpm = Math.round(wordsTyped / elapsedTime);
      
      const errors = input.split('').reduce((acc, char, i) => {
        return acc + (char !== state.text[i] ? 1 : 0);
      }, 0);
      
      const accuracy = Math.round(((input.length - errors) / input.length) * 100) || 100;

      // Track error words
      const words = input.split(' ');
      const correctWords = state.text.split(' ');
      const errorWords = new Map(state.errorWords);

      words.forEach((word, index) => {
        if (correctWords[index] && word !== correctWords[index]) {
          const count = errorWords.get(word) || 0;
          errorWords.set(word, count + 1);
        }
      });

      // Track typing patterns
      const typingPatterns = { ...state.typingPatterns };
      
      // Detect pauses (>1 second without typing)
      if (input.length === prevInput.length && !typingPatterns.pauseStartTime) {
        typingPatterns.pauseStartTime = Date.now();
      } else if (input.length > prevInput.length && typingPatterns.pauseStartTime) {
        const pauseDuration = Date.now() - typingPatterns.pauseStartTime;
        if (pauseDuration > 1000) {
          const currentWord = input.split(' ').pop() || '';
          typingPatterns.currentWordStartTime = Date.now();
        }
        typingPatterns.pauseStartTime = null;
      }

      // Track speed variations
      typingPatterns.speedMeasurements.push({
        timestamp: Date.now(),
        wpm,
        afterError: errors > state.errors
      });

      // Track recovery times after errors
      if (errors > state.errors) {
        typingPatterns.recoveryTimes.push({
          errorTimestamp: Date.now(),
          recoveryDuration: 0
        });
      } else if (typingPatterns.recoveryTimes.length > 0 && wpm > state.wpm) {
        const lastRecovery = typingPatterns.recoveryTimes[typingPatterns.recoveryTimes.length - 1];
        if (!lastRecovery.recoveryDuration) {
          lastRecovery.recoveryDuration = Date.now() - lastRecovery.errorTimestamp;
        }
      }
      
      set({ 
        wpm, 
        accuracy, 
        errors,
        errorWords,
        typingPatterns
      });
    }
  },

  startTest: () => {
    set({
      input: "",
      wpm: 0,
      accuracy: 100,
      errors: 0,
      isRunning: true,
      startTime: Date.now(),
      errorWords: new Map(),
      typingPatterns: {
        pauseStartTime: null,
        currentWordStartTime: null,
        speedMeasurements: [],
        recoveryTimes: [],
      }
    });
  },

  endTest: () => {
    set({ isRunning: false });
  },

  saveSession: async () => {
    const state = get();
    
    // Calculate psychological metrics
    const speedMeasurements = state.typingPatterns.speedMeasurements;
    const recoveryTimes = state.typingPatterns.recoveryTimes;
    
    const impulsivityScore = state.wpm * (state.errors / state.input.length);
    const deliberationScore = state.accuracy * (1 - state.errors / state.input.length);
    
    const avgRecoveryTime = recoveryTimes.reduce((acc, { recoveryDuration }) => 
      acc + (recoveryDuration || 0), 0) / (recoveryTimes.length || 1);
    
    const cognitiveLoadScore = Array.from(state.errorWords.entries())
      .filter(([word]) => word.length > 5)
      .reduce((acc, [, count]) => acc + count, 0);

    const lastSpeedMeasurements = speedMeasurements.slice(-5);
    const speedVariation = lastSpeedMeasurements.reduce((acc, { wpm }, i, arr) => 
      i > 0 ? acc + Math.abs(wpm - arr[i-1].wpm) : acc, 0) / (lastSpeedMeasurements.length - 1);

    await sessions.create({
      wpm: state.wpm,
      accuracy: state.accuracy,
      errors: state.errors,
      duration: state.timer,
      errorWords: Array.from(state.errorWords.entries()).map(([word, count]) => ({
        word,
        count
      })),
      typingPatterns: {
        pausesBefore: [],
        speedVariations: state.typingPatterns.speedMeasurements,
        recoveryTimes: state.typingPatterns.recoveryTimes
      },
      psychologicalMetrics: {
        impulsivityScore,
        deliberationScore,
        cognitiveLoadScore,
        resilienceScore: 100 - (avgRecoveryTime / 1000),
        anxietyScore: speedVariation
      }
    });
  },
}));