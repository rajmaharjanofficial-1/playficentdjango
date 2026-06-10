import React, { useState, useEffect } from 'react';

// Inline styles for 3D arcade neon aesthetic
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Orbitron:wght@400;700;900&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --neon-green: #39FF14;
    --neon-blue: #00D9FF;
    --neon-pink: #FF2D78;
    --neon-purple: #BF00FF;
    --neon-yellow: #FFE600;
    --bg-black: #050508;
    --card-bg: #0a0a12;
    --grid-color: rgba(57, 255, 20, 0.06);
  }

  body { margin: 0; background: var(--bg-black); }

  .auth-root {
    min-height: 100vh;
    width: 100%;
    background: var(--bg-black);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Press Start 2P', monospace;
    overflow: hidden;
    position: relative;
    padding: 1.5rem;
  }

  /* 3D perspective grid floor */
  .grid-floor {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: 55vh;
    background:
      linear-gradient(180deg, transparent 0%, rgba(57,255,20,0.03) 100%),
      repeating-linear-gradient(90deg, var(--grid-color) 0px, var(--grid-color) 1px, transparent 1px, transparent 60px),
      repeating-linear-gradient(0deg, var(--grid-color) 0px, var(--grid-color) 1px, transparent 1px, transparent 60px);
    transform: perspective(600px) rotateX(55deg);
    transform-origin: bottom center;
    pointer-events: none;
    z-index: 0;
  }

  /* Scanlines overlay */
  .scanlines {
    position: fixed;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,0,0,0.18) 2px,
      rgba(0,0,0,0.18) 4px
    );
    pointer-events: none;
    z-index: 1;
    mix-blend-mode: multiply;
  }

  /* Vignette */
  .vignette {
    position: fixed;
    inset: 0;
    background: radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.85) 100%);
    pointer-events: none;
    z-index: 1;
  }

  /* Floating orbs */
  .orb {
    position: fixed;
    border-radius: 50%;
    filter: blur(60px);
    pointer-events: none;
    z-index: 0;
    animation: orbFloat 8s ease-in-out infinite;
  }
  .orb-1 { width: 300px; height: 300px; background: rgba(57,255,20,0.07); top: -80px; left: -80px; }
  .orb-2 { width: 250px; height: 250px; background: rgba(0,217,255,0.07); bottom: -60px; right: -60px; animation-delay: -3s; }
  .orb-3 { width: 200px; height: 200px; background: rgba(255,45,120,0.06); top: 50%; left: 50%; transform: translate(-50%,-50%); animation-delay: -5s; }

  @keyframes orbFloat {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-30px) scale(1.05); }
  }

  /* Main container */
  .auth-container {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 460px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }

  /* Title section */
  .title-block {
    text-align: center;
    margin-bottom: 2rem;
    perspective: 600px;
  }

  .game-title {
    font-family: 'Orbitron', sans-serif;
    font-weight: 900;
    font-size: clamp(22px, 5vw, 38px);
    color: var(--neon-green);
    letter-spacing: 4px;
    text-transform: uppercase;
    line-height: 1.1;
    text-shadow:
      0 0 10px var(--neon-green),
      0 0 20px var(--neon-green),
      0 0 40px var(--neon-green),
      0 0 80px rgba(57,255,20,0.4);
    animation: titlePulse 3s ease-in-out infinite;
    display: block;
  }

  @keyframes titlePulse {
    0%, 100% { text-shadow: 0 0 10px var(--neon-green), 0 0 20px var(--neon-green), 0 0 40px var(--neon-green), 0 0 80px rgba(57,255,20,0.4); }
    50% { text-shadow: 0 0 5px var(--neon-green), 0 0 10px var(--neon-green), 0 0 20px var(--neon-green), 0 0 40px rgba(57,255,20,0.3); }
  }

  .game-subtitle {
    font-family: 'Orbitron', sans-serif;
    font-size: clamp(7px, 1.5vw, 10px);
    color: var(--neon-blue);
    letter-spacing: 8px;
    text-transform: uppercase;
    margin-top: 10px;
    text-shadow: 0 0 10px var(--neon-blue), 0 0 20px rgba(0,217,255,0.5);
    display: block;
    animation: subtitleBlink 4s ease-in-out infinite;
  }

  @keyframes subtitleBlink {
    0%,90%,100% { opacity: 1; }
    95% { opacity: 0.3; }
  }

  /* Score bar */
  .score-bar {
    display: flex;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 1rem;
    padding: 0 2px;
  }
  .score-item {
    font-family: 'Press Start 2P', monospace;
    font-size: 7px;
    color: rgba(57,255,20,0.5);
    letter-spacing: 1px;
  }
  .score-val { color: var(--neon-yellow); text-shadow: 0 0 8px var(--neon-yellow); }

  /* 3D Card */
  .card-3d-wrapper {
    width: 100%;
    perspective: 1200px;
  }

  .card-3d {
    width: 100%;
    background: var(--card-bg);
    border: 1px solid rgba(57,255,20,0.4);
    border-radius: 4px;
    padding: clamp(1.5rem, 5vw, 2.5rem);
    position: relative;
    transform: rotateX(2deg);
    transform-style: preserve-3d;
    transition: transform 0.3s ease;
    box-shadow:
      0 0 0 1px rgba(57,255,20,0.1),
      0 0 30px rgba(57,255,20,0.15),
      0 0 60px rgba(57,255,20,0.08),
      0 20px 60px rgba(0,0,0,0.8),
      inset 0 1px 0 rgba(57,255,20,0.2),
      inset 0 0 40px rgba(57,255,20,0.03);
  }

  .card-3d:hover { transform: rotateX(0deg) translateY(-2px); }

  /* Corner decorations */
  .corner { position: absolute; width: 20px; height: 20px; }
  .corner-tl { top: 8px; left: 8px; border-top: 2px solid var(--neon-green); border-left: 2px solid var(--neon-green); box-shadow: -2px -2px 8px rgba(57,255,20,0.4); }
  .corner-tr { top: 8px; right: 8px; border-top: 2px solid var(--neon-green); border-right: 2px solid var(--neon-green); box-shadow: 2px -2px 8px rgba(57,255,20,0.4); }
  .corner-bl { bottom: 8px; left: 8px; border-bottom: 2px solid var(--neon-green); border-left: 2px solid var(--neon-green); box-shadow: -2px 2px 8px rgba(57,255,20,0.4); }
  .corner-br { bottom: 8px; right: 8px; border-bottom: 2px solid var(--neon-green); border-right: 2px solid var(--neon-green); box-shadow: 2px 2px 8px rgba(57,255,20,0.4); }

  /* Tab switcher */
  .tab-switcher {
    display: flex;
    width: 100%;
    margin-bottom: 2rem;
    border: 1px solid rgba(57,255,20,0.25);
    border-radius: 2px;
    overflow: hidden;
    background: rgba(0,0,0,0.5);
  }

  .tab-btn {
    flex: 1;
    padding: 12px 8px;
    font-family: 'Press Start 2P', monospace;
    font-size: clamp(7px, 1.4vw, 9px);
    letter-spacing: 1px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    background: transparent;
    color: rgba(57,255,20,0.4);
    position: relative;
    overflow: hidden;
  }

  .tab-btn.active {
    background: rgba(57,255,20,0.12);
    color: var(--neon-green);
    text-shadow: 0 0 10px var(--neon-green);
    box-shadow: inset 0 -2px 0 var(--neon-green);
  }

  .tab-btn:not(.active):hover {
    color: rgba(57,255,20,0.7);
    background: rgba(57,255,20,0.05);
  }

  /* Form heading */
  .form-heading {
    font-family: 'Orbitron', sans-serif;
    font-weight: 700;
    font-size: clamp(11px, 2.5vw, 16px);
    color: var(--neon-green);
    text-align: center;
    letter-spacing: 3px;
    margin-bottom: 0.4rem;
    text-shadow: 0 0 15px rgba(57,255,20,0.6);
  }

  .form-divider {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 1.8rem;
  }
  .form-divider-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(57,255,20,0.4), transparent);
  }
  .form-divider-dot {
    width: 4px; height: 4px;
    background: var(--neon-green);
    border-radius: 50%;
    box-shadow: 0 0 6px var(--neon-green);
  }

  /* Error */
  .error-box {
    background: rgba(255,45,120,0.1);
    border: 1px solid rgba(255,45,120,0.5);
    color: #FF6B9D;
    padding: 10px 14px;
    font-size: clamp(6px, 1.2vw, 8px);
    margin-bottom: 1.2rem;
    border-radius: 2px;
    text-align: center;
    letter-spacing: 1px;
    box-shadow: 0 0 15px rgba(255,45,120,0.15);
    animation: errorShake 0.4s ease;
  }

  @keyframes errorShake {
    0%,100% { transform: translateX(0); }
    20% { transform: translateX(-5px); }
    40% { transform: translateX(5px); }
    60% { transform: translateX(-3px); }
    80% { transform: translateX(3px); }
  }

  /* Form fields */
  .field-group { margin-bottom: 1.4rem; }

  .field-label {
    font-family: 'Press Start 2P', monospace;
    font-size: clamp(6px, 1.1vw, 8px);
    color: rgba(0,217,255,0.7);
    letter-spacing: 2px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .field-label-icon { color: var(--neon-blue); font-size: 10px; }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-prefix {
    position: absolute;
    left: 12px;
    color: var(--neon-green);
    font-size: 10px;
    font-family: 'Press Start 2P', monospace;
    pointer-events: none;
    z-index: 2;
    text-shadow: 0 0 6px var(--neon-green);
    transition: color 0.2s;
  }

  .field-input {
    width: 100%;
    background: rgba(0,0,0,0.6);
    border: 1px solid rgba(57,255,20,0.3);
    border-radius: 2px;
    padding: 13px 14px 13px 32px;
    font-family: 'Press Start 2P', monospace;
    font-size: clamp(7px, 1.4vw, 9px);
    color: var(--neon-green);
    letter-spacing: 1px;
    outline: none;
    transition: all 0.2s ease;
    box-shadow: inset 0 0 15px rgba(0,0,0,0.5);
  }

  .field-input::placeholder { color: rgba(57,255,20,0.2); }

  .field-input:focus {
    border-color: var(--neon-blue);
    box-shadow:
      inset 0 0 15px rgba(0,0,0,0.5),
      0 0 15px rgba(0,217,255,0.2),
      0 0 30px rgba(0,217,255,0.1);
    color: #fff;
  }

  .field-input:focus + .input-prefix { color: var(--neon-blue); }
  .input-wrapper:focus-within .input-prefix { color: var(--neon-blue); }

  .field-input:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Input glow bar */
  .input-glow-bar {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--neon-blue), transparent);
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
  }
  .input-wrapper:focus-within .input-glow-bar { opacity: 1; }

  /* Submit button */
  .submit-btn {
    width: 100%;
    margin-top: 0.5rem;
    padding: 16px 20px;
    font-family: 'Press Start 2P', monospace;
    font-size: clamp(8px, 1.6vw, 11px);
    letter-spacing: 2px;
    cursor: pointer;
    border: none;
    border-radius: 2px;
    position: relative;
    overflow: hidden;
    transition: all 0.15s ease;
    background: linear-gradient(135deg, #39FF14 0%, #00D9FF 100%);
    color: #000;
    text-shadow: none;
    font-weight: 700;
    box-shadow:
      0 0 20px rgba(57,255,20,0.4),
      0 4px 0 rgba(0,0,0,0.5),
      0 6px 20px rgba(0,0,0,0.5);
    transform: translateY(0);
  }

  .submit-btn::before {
    content: '';
    position: absolute;
    top: 0; left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    transition: left 0.4s ease;
  }

  .submit-btn:hover::before { left: 150%; }

  .submit-btn:hover:not(:disabled) {
    box-shadow:
      0 0 30px rgba(57,255,20,0.7),
      0 0 60px rgba(57,255,20,0.3),
      0 4px 0 rgba(0,0,0,0.5);
  }

  .submit-btn:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow:
      0 0 15px rgba(57,255,20,0.4),
      0 1px 0 rgba(0,0,0,0.5);
  }

  .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .submit-btn.loading {
    background: linear-gradient(135deg, #00D9FF 0%, var(--neon-purple) 100%);
    box-shadow: 0 0 20px rgba(0,217,255,0.5), 0 4px 0 rgba(0,0,0,0.5);
  }

  /* Alt action */
  .alt-section {
    margin-top: 1.8rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(57,255,20,0.1);
    text-align: center;
  }

  .alt-label {
    font-size: clamp(6px, 1.1vw, 8px);
    color: rgba(57,255,20,0.35);
    letter-spacing: 2px;
    margin-bottom: 12px;
    display: block;
  }

  .alt-btn {
    width: 100%;
    padding: 13px;
    font-family: 'Press Start 2P', monospace;
    font-size: clamp(7px, 1.3vw, 9px);
    letter-spacing: 1px;
    background: transparent;
    border: 1px solid rgba(0,217,255,0.4);
    color: var(--neon-blue);
    cursor: pointer;
    border-radius: 2px;
    transition: all 0.2s ease;
    text-shadow: 0 0 8px rgba(0,217,255,0.5);
    box-shadow: 0 0 10px rgba(0,217,255,0.1), inset 0 0 15px rgba(0,217,255,0.03);
  }

  .alt-btn:hover {
    background: rgba(0,217,255,0.1);
    border-color: var(--neon-blue);
    box-shadow: 0 0 20px rgba(0,217,255,0.3), inset 0 0 15px rgba(0,217,255,0.05);
    color: #fff;
    text-shadow: 0 0 10px var(--neon-blue);
  }

  /* Footer */
  .auth-footer {
    margin-top: 1.5rem;
    display: flex;
    align-items: center;
    gap: 12px;
    justify-content: center;
  }
  .footer-dot {
    width: 4px; height: 4px;
    background: rgba(57,255,20,0.3);
    border-radius: 50%;
    animation: dotBlink 2s ease-in-out infinite;
  }
  .footer-dot:nth-child(2) { animation-delay: 0.6s; }
  .footer-dot:nth-child(3) { animation-delay: 1.2s; }
  @keyframes dotBlink {
    0%,100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.5); box-shadow: 0 0 6px var(--neon-green); background: var(--neon-green); }
  }
  .footer-text {
    font-size: 7px;
    color: rgba(57,255,20,0.25);
    letter-spacing: 2px;
  }

  /* Loading spinner */
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner { display: inline-block; animation: spin 0.8s linear infinite; }

  /* Responsive */
  @media (max-width: 480px) {
    .auth-root { padding: 1rem; align-items: flex-start; padding-top: 2rem; }
    .card-3d { padding: 1.5rem 1.2rem; }
    .card-3d { transform: none; }
    .game-title { font-size: 18px; }
  }

  @media (max-width: 360px) {
    .game-title { font-size: 15px; letter-spacing: 2px; }
    .card-3d { padding: 1.2rem 1rem; }
  }
`;

export default function AuthScreen() {
  // Replace with real useAuth if available
  const login = async (u, p) => ({ success: u && p ? true : false, error: 'Invalid credentials' });
  const register = async (u, p) => ({ success: u && p ? true : false, error: 'Username taken' });

  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [score] = useState('000000');
  const [hiScore] = useState('999999');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) { setError('FIELDS CANNOT BE EMPTY'); return; }
    setLoading(true);
    const result = isLogin ? await login(username, password) : await register(username, password);
    if (!result.success) setError(result.error);
    setLoading(false);
  };

  const switchMode = () => { setIsLogin(!isLogin); setError(''); setUsername(''); setPassword(''); };

  return (
    <>
      <style>{styles}</style>
      <div className="auth-root">
        {/* Background layers */}
        <div className="grid-floor" />
        <div className="scanlines" />
        <div className="vignette" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        <div className="auth-container">
          {/* Title */}
          <div className="title-block">
            <span className="game-title">TYPE TO SURVIVE</span>
            <span className="game-subtitle">◆ MASTER THE TERMINAL ◆</span>
          </div>

          {/* Score bar */}
          <div className="score-bar">
            <div className="score-item">SCORE <span className="score-val">{score}</span></div>
            <div className="score-item">HI-SCORE <span className="score-val">{hiScore}</span></div>
          </div>

          {/* 3D Card */}
          <div className="card-3d-wrapper">
            <div className="card-3d">
              <div className="corner corner-tl" />
              <div className="corner corner-tr" />
              <div className="corner corner-bl" />
              <div className="corner corner-br" />

              {/* Tab switcher */}
              <div className="tab-switcher">
                <button className={`tab-btn ${isLogin ? 'active' : ''}`} onClick={() => !isLogin && switchMode()}>
                  ⏵ ENTER GAME
                </button>
                <button className={`tab-btn ${!isLogin ? 'active' : ''}`} onClick={() => isLogin && switchMode()}>
                  ✦ NEW PLAYER
                </button>
              </div>

              {/* Heading */}
              <div className="form-heading">{isLogin ? 'ACCESS SYSTEM' : 'CREATE ACCOUNT'}</div>
              <div className="form-divider">
                <div className="form-divider-line" />
                <div className="form-divider-dot" />
                <div className="form-divider-line" />
              </div>

              {/* Error */}
              {error && <div className="error-box">⚠ {error}</div>}

              <form onSubmit={handleSubmit}>
                {/* Username */}
                <div className="field-group">
                  <div className="field-label">
                    <span className="field-label-icon">▶</span> USERNAME
                  </div>
                  <div className="input-wrapper">
                    <span className="input-prefix">{focusedField === 'user' ? '█' : '▶'}</span>
                    <input
                      type="text"
                      className="field-input"
                      placeholder="ENTER CALLSIGN"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      onFocus={() => setFocusedField('user')}
                      onBlur={() => setFocusedField(null)}
                      disabled={loading}
                      autoComplete="username"
                    />
                    <div className="input-glow-bar" />
                  </div>
                </div>

                {/* Password */}
                <div className="field-group">
                  <div className="field-label">
                    <span className="field-label-icon">▶</span> PASSWORD
                  </div>
                  <div className="input-wrapper">
                    <span className="input-prefix">{focusedField === 'pass' ? '█' : '▶'}</span>
                    <input
                      type="password"
                      className="field-input"
                      placeholder="ENTER ACCESS CODE"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('pass')}
                      onBlur={() => setFocusedField(null)}
                      disabled={loading}
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                    />
                    <div className="input-glow-bar" />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className={`submit-btn ${loading ? 'loading' : ''}`}
                  disabled={loading}
                >
                  {loading
                    ? <><span className="spinner">◈</span> PROCESSING...</>
                    : (isLogin ? '⏵ INSERT COIN TO PLAY' : '⏵ CREATE NEW SAVE')}
                </button>
              </form>

              {/* Alt action */}
              <div className="alt-section">
                <span className="alt-label">
                  {isLogin ? '— NO ACCOUNT? —' : '— ALREADY HAVE ONE? —'}
                </span>
                <button className="alt-btn" onClick={switchMode} disabled={loading}>
                  {isLogin ? '→ REGISTER NOW' : '→ SIGN IN'}
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="auth-footer">
            <div className="footer-dot" />
            <span className="footer-text">SECURE CONNECTION ACTIVE</span>
            <div className="footer-dot" />
            <span className="footer-text">v2.0.4</span>
            <div className="footer-dot" />
          </div>
        </div>
      </div>
    </>
  );
}