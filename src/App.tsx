import React from 'react';
import { TypingTest } from './components/TypingTest';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">MonkeyType Clone</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <TypingTest />
      </main>
    </div>
  );
}

export default App;