import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import AuthScreen from './components/AuthScreen';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import GameMenu from './components/GameMenu';
import { useAuth } from './context/AuthContext';

const API_BASE = 'http://localhost:8000/api';

function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const [currentView, setCurrentView] = useState('menu');
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [difficultySettings, setDifficultySettings] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [pausedGameState, setPausedGameState] = useState(null);

  // Reset game state when user logs in
  useEffect(() => {
    if (user) {
      setCurrentView('menu');
      setGameOver(false);
      setScore(0);
      setWpm(0);
      setSubmitted(false);
      setSubmitting(false);
      setSubmitMessage('');
    }
  }, [user]);

  const fetchLeaderboard = async () => {
    try {
      const params = new URLSearchParams();
      params.append('difficulty', 'all');
      params.append('limit', 10);
      
      const res = await fetch(`${API_BASE}/leaderboard?${params}`, {
        credentials: 'include'
      });
      if (!res.ok) {
        console.error('Failed to fetch leaderboard:', res.statusText);
        return;
      }
      const data = await res.json();
      setLeaderboard(data);
    } catch (e) {
      console.error('Error fetching leaderboard:', e);
    }
  };

  const submitScore = async () => {
    if (!user || submitted || submitting) return;
    
    setSubmitting(true);
    setSubmitMessage('');
    setUnlockedAchievements([]);
    
    const difficulty = difficultySettings?.difficulty || 'normal';
    
    try {
      const res = await fetch(`${API_BASE}/score/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          username: user.username,
          score,
          wpm,
          difficulty,
          accuracy: 0.95, // Default value, can be enhanced
          duration: 60, // Default value, can be enhanced
          words_typed: Math.round(score / 10) // Estimate based on score
        })
      });
      
      if (!res.ok) {
        setSubmitMessage('Failed to submit score. Try again.');
        setSubmitting(false);
        return;
      }
      
      const data = await res.json();
      
      // Check if achievements were unlocked
      if (data.achievements_unlocked && data.achievements_unlocked.length > 0) {
        setUnlockedAchievements(data.achievements_unlocked);
      }
      
      setSubmitted(true);
      setSubmitMessage('✓ Score submitted to leaderboard!');
      await fetchLeaderboard();
      setRefreshTrigger(prev => prev + 1);
    } catch (e) {
      console.error('Error submitting score:', e);
      setSubmitMessage('Error submitting score. Please try again.');
    }
    
    setSubmitting(false);
  };

  const handleGameOver = (finalScore, finalWpm) => {
    setScore(finalScore);
    setWpm(finalWpm);
    setGameOver(true);
    fetchLeaderboard();
  };

  const handleLogout = async () => {
    await logout();
    setCurrentView('game');
  };

  const handlePlayGame = () => {
    setCurrentView('game');
    setGameOver(false);
    setScore(0);
    setWpm(0);
    setSubmitted(false);
    setUnlockedAchievements([]);
  };

  const handleStartGame = (difficulty, settings) => {
    setDifficultySettings({ difficulty, ...settings });
    setCurrentView('game');
    setGameOver(false);
    setScore(0);
    setWpm(0);
    setSubmitted(false);
    setUnlockedAchievements([]);
  };

  const handleGoToDashboard = () => {
    // Save paused game state if game is in progress (not over)
    if (currentView === 'game' && !gameOver) {
      setPausedGameState({
        score,
        wpm,
        difficultySettings,
        submitted,
        submitting,
        submitMessage,
        unlockedAchievements
      });
    }
    
    if (user?.role === 'admin') {
      setCurrentView('admin-dashboard');
    } else {
      setCurrentView('user-dashboard');
    }
  };

  const handleResumeGame = () => {
    if (pausedGameState) {
      setScore(pausedGameState.score);
      setWpm(pausedGameState.wpm);
      setDifficultySettings(pausedGameState.difficultySettings);
      setSubmitted(pausedGameState.submitted);
      setSubmitting(pausedGameState.submitting);
      setSubmitMessage(pausedGameState.submitMessage);
      setUnlockedAchievements(pausedGameState.unlockedAchievements);
      setCurrentView('game');
    }
  };

  if (authLoading) return <div className="w-screen h-screen bg-black text-neonGreen font-press-start flex items-center justify-center crt-overlay">LOADING CARTRIDGE...</div>;
  
  if (!user) return <AuthScreen />;

  // Game Menu
  if (currentView === 'menu') {
    return <GameMenu onStartGame={handleStartGame} onGoToDashboard={handleGoToDashboard} onLogout={handleLogout} />;
  }

  // Admin Dashboard
  if (currentView === 'admin-dashboard' && user.role === 'admin') {
    return <AdminDashboard onPlayGame={() => setCurrentView('menu')} onLogout={handleLogout} refreshTrigger={refreshTrigger} onResumeGame={pausedGameState ? handleResumeGame : null} />
  }

  // User Dashboard
  if (currentView === 'user-dashboard' && user.role === 'user') {
    return <UserDashboard 
      onPlayGame={() => setCurrentView('menu')} 
      onLogout={handleLogout} 
      refreshTrigger={refreshTrigger}
      onResumeGame={pausedGameState ? handleResumeGame : null}
    />
  }

  // Game View
  return (
    <div className="w-screen h-screen bg-black text-neonGreen font-press-start overflow-hidden relative">
      {!gameOver ? (
        <GameCanvas 
          onGameOver={handleGameOver} 
          updateScoreDisplay={(s, currentWpm) => {
            setScore(s); setWpm(currentWpm);
          }}
          difficultySettings={difficultySettings}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center z-50 absolute bg-black/95 backdrop-blur-sm">
          <div className="animate-pulse mb-4 text-6xl" style={{ textShadow: '0 0 30px #FF0000' }}>⚠️</div>
          <h1 className="text-5xl text-red-500 mb-8 animate-pulse" style={{ textShadow: '0 0 20px #FF0000, 0 0 40px #FF0000' }}>GAME OVER</h1>
          
          <div className="mb-8 border border-neonGreen p-6 rounded neon-border">
            <p className="text-2xl mb-4 text-neonGreen">FINAL SCORE: {score}</p>
            <p className="text-2xl text-neonYellow">WPM: {wpm.toFixed(1)}</p>
          </div>

          <div className="flex flex-col gap-6 items-center mb-8">
            {/* Submit Score Button */}
            <button 
              onClick={submitScore}
              disabled={submitted || submitting}
              className={`border-2 px-8 py-4 text-xl font-bold transition-all duration-200 neon-border ${
                submitted 
                  ? 'border-neonYellow text-neonYellow opacity-75 cursor-default' 
                  : submitting
                  ? 'border-neonBlue text-neonBlue opacity-75'
                  : 'border-neonGreen text-neonGreen hover:bg-neonGreen hover:text-black'
              }`}
              style={{ 
                boxShadow: submitted 
                  ? '0 0 20px #FFD700' 
                  : submitting
                  ? '0 0 15px #00D9FF'
                  : '0 0 20px #39FF14',
                minWidth: '200px'
              }}
            >
              {submitted ? '✓ SUBMITTED' : submitting ? 'SUBMITTING...' : 'SUBMIT SCORE'}
            </button>
            
            {/* Submission Message */}
            {submitMessage && (
              <p className={`text-lg ${submitted ? 'text-neonYellow' : 'text-red-500'}`} style={{
                textShadow: submitted ? '0 0 10px #FFD700' : '0 0 10px #FF0000'
              }}>
                {submitMessage}
              </p>
            )}

            {/* Achievements Unlocked Notification */}
            {unlockedAchievements.length > 0 && (
              <div className="mt-6 p-6 border-2 border-neonYellow" style={{ boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)' }}>
                <h3 className="text-2xl text-neonYellow mb-4" style={{ textShadow: '0 0 10px #FFD700' }}>
                  🏆 NEW ACHIEVEMENTS UNLOCKED!
                </h3>
                <div className="space-y-3">
                  {unlockedAchievements.map((achievement, idx) => (
                    <div key={idx} className="border-l-4 border-neonYellow pl-3 py-1">
                      <div className="text-neonGreen font-bold">{achievement.icon} {achievement.name}</div>
                      <div className="text-xs text-gray-400">{achievement.description}</div>
                      <div className="text-xs text-neonYellow mt-1">✓ {achievement.tier.toUpperCase()} TIER</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-6">
              <button 
                onClick={() => setCurrentView('menu')}
                className="border-2 border-neonBlue px-6 py-3 hover:bg-neonBlue hover:text-black transition-all duration-200 neon-border"
                style={{ boxShadow: '0 0 10px #00D9FF' }}
              >
                PLAY AGAIN
              </button>
              <button 
                onClick={handleGoToDashboard}
                className="border-2 border-neonGreen px-6 py-3 hover:bg-neonGreen hover:text-black transition-all duration-200 neon-border"
                style={{ boxShadow: '0 0 10px #39FF14' }}
              >
                HOME
              </button>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="border border-neonGreen p-6 w-96 text-sm neon-border" style={{ boxShadow: 'inset 0 0 15px rgba(57, 255, 20, 0.2)' }}>
            <h2 className="text-center mb-4 underline text-neonYellow pb-2 border-b border-neonGreen">⭐ HIGH SCORES</h2>
            <div className="space-y-2">
              {leaderboard.length > 0 ? (
                leaderboard.map((entry, idx) => (
                  <div key={idx} className={`flex justify-between px-2 py-1 ${idx === 0 ? 'text-neonYellow font-bold' : 'text-neonGreen'}`}>
                    <span>{'🏆'.repeat(Math.max(0, 3 - idx))} #{idx + 1}. {entry.username}</span>
                    <span className="text-neonBlue">{entry.score}</span>
                  </div>
                ))
              ) : (
                <p className="text-center text-neonBlue">No scores yet...</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* HUD overlay */}
      {!gameOver && (
        <div className="absolute top-4 left-4 z-10 flex gap-8 pointer-events-none items-center px-4 py-2 border border-neonGreen rounded" style={{ boxShadow: '0 0 15px rgba(57, 255, 20, 0.3)' }}>
          <div className="text-neonGreen" style={{ textShadow: '0 0 8px #39FF14' }}>SCORE: {score}</div>
          <div className="text-neonBlue" style={{ textShadow: '0 0 8px #00D9FF' }}>WPM: {Math.round(wpm)}</div>
          <div className="text-neonPink" style={{ textShadow: '0 0 8px #FF10F0' }}>PILOT: {user.username}</div>
          <button 
            onClick={handleGoToDashboard}
            className="pointer-events-auto border border-neonGreen px-3 py-1 text-xs hover:bg-neonGreen hover:text-black transition-all neon-border"
            style={{ boxShadow: '0 0 8px #39FF14' }}
          >
            {user.role === 'admin' ? 'ADMIN' : 'PROFILE'}
          </button>
          <button 
            onClick={handleLogout} 
            className="pointer-events-auto border border-neonGreen px-3 py-1 text-xs hover:bg-neonGreen hover:text-black transition-all neon-border"
            style={{ boxShadow: '0 0 8px #39FF14' }}
          >
            LOGOUT
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
