import { useState } from 'react';
import Home from './components/Home';
import BudgetPractice from './components/BudgetPractice';
import ProjectionBuilder from './components/ProjectionBuilder';

type Mode = 'home' | 'budget' | 'projection';

function App() {
  const [mode, setMode] = useState<Mode>('home');
  const [userName, setUserName] = useState('');

  const handleModeSelect = (selectedMode: 'budget' | 'projection') => {
    setMode(selectedMode);
  };

  const handleUserSet = (name: string) => {
    setUserName(name);
  };

  const handleBackToHome = () => {
    setMode('home');
  };

  return (
    <>
      {mode === 'home' && (
        <Home onModeSelect={handleModeSelect} onUserSet={handleUserSet} />
      )}
      {mode === 'budget' && (
        <BudgetPractice userName={userName} onBack={handleBackToHome} />
      )}
      {mode === 'projection' && (
        <ProjectionBuilder userName={userName} onBack={handleBackToHome} />
      )}
    </>
  );
}

export default App;
