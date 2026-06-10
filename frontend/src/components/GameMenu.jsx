import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const difficulties = {
  easy: {
    label: 'EASY',
    description: 'Slower words, more time to react',
    color: '#39FF14',
    rgb: '57,255,20',
    glow: 'rgba(57,255,20,0.25)',
    icon: '◈',
    settings: { fallSpeed: 0.3, spawnInterval: 3500 }
  },
  normal: {
    label: 'NORMAL',
    description: 'Standard difficulty, balanced gameplay',
    color: '#00D9FF',
    rgb: '0,217,255',
    glow: 'rgba(0,217,255,0.25)',
    icon: '◉',
    settings: { fallSpeed: 0.6, spawnInterval: 2500 }
  },
  hard: {
    label: 'HARD',
    description: 'Faster words, challenging experience',
    color: '#FFD700',
    rgb: '255,215,0',
    glow: 'rgba(255,215,0,0.25)',
    icon: '◆',
    settings: { fallSpeed: 1.0, spawnInterval: 1800 }
  },
  insane: {
    label: 'INSANE',
    description: 'Extreme speed, for the brave only',
    color: '#FF3366',
    rgb: '255,51,102',
    glow: 'rgba(255,51,102,0.25)',
    icon: '☢',
    settings: { fallSpeed: 1.5, spawnInterval: 1200 }
  }
};

function FloatingParticle({ style }) {
  return <div style={style} />;
}

function ScanLine() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.015) 2px, rgba(0,255,0,0.015) 4px)',
      borderRadius: 'inherit'
    }} />
  );
}

function GridBg() {
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
      backgroundImage: `
        linear-gradient(rgba(57,255,20,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(57,255,20,0.04) 1px, transparent 1px)
      `,
      backgroundSize: '60px 60px',
      perspective: '600px',
      transformOrigin: 'bottom center',
      transform: 'rotateX(60deg) scaleY(2.5) translateY(20%)',
      opacity: 0.6
    }} />
  );
}

export default function GameMenu({ onStartGame, onGoToDashboard, onLogout }) {
  const { user } = useAuth();
  const [selectedDifficulty, setSelectedDifficulty] = useState('normal');
  const [hovered, setHovered] = useState(null);
  const [pulse, setPulse] = useState(false);
  const [btnHover, setBtnHover] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 1200);
    return () => clearInterval(t);
  }, []);

  const diff = difficulties[selectedDifficulty];

  const handleStartGame = () => {
    onStartGame(selectedDifficulty, diff.settings);
  };

  const particles = Array.from({ length: 12 }, (_, i) => ({
    left: `${(i * 7.3 + 5) % 100}%`,
    top: `${(i * 13.7 + 10) % 100}%`,
    width: i % 3 === 0 ? '3px' : '2px',
    height: i % 3 === 0 ? '3px' : '2px',
    borderRadius: '50%',
    position: 'fixed',
    background: i % 4 === 0 ? '#39FF14' : i % 4 === 1 ? '#00D9FF' : i % 4 === 2 ? '#FFD700' : '#FF3366',
    opacity: 0.3 + (i % 5) * 0.1,
    animation: `float${i % 3} ${3 + i * 0.4}s ease-in-out infinite`,
    animationDelay: `${i * 0.3}s`,
    pointerEvents: 'none',
    zIndex: 0
  }));

  return (
    <div style={{
      width: '100vw', minHeight: '100vh',
      background: '#050508',
      fontFamily: '"Press Start 2P", monospace',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', position: 'relative',
      padding: 'clamp(1rem, 3vw, 2rem) clamp(0.75rem, 3vw, 1.5rem)',
      boxSizing: 'border-box'
    }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @keyframes float0 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
        @keyframes float1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-24px)} }
        @keyframes titlePulse {
          0%,100%{ text-shadow: 0 0 20px #39FF14, 0 0 40px #39FF14, 0 0 80px #39FF14; }
          50%{ text-shadow: 0 0 10px #39FF14, 0 0 20px #39FF14, 0 0 40px #39FF14; }
        }
        @keyframes borderGlow {
          0%,100%{ box-shadow: 0 0 20px rgba(57,255,20,0.4), 0 0 40px rgba(57,255,20,0.2), inset 0 0 20px rgba(57,255,20,0.05); }
          50%{ box-shadow: 0 0 30px rgba(57,255,20,0.6), 0 0 60px rgba(57,255,20,0.3), inset 0 0 30px rgba(57,255,20,0.1); }
        }
        @keyframes startBtnPulse {
          0%,100%{ box-shadow: 0 0 20px rgba(57,255,20,0.5), 0 0 40px rgba(57,255,20,0.2); }
          50%{ box-shadow: 0 0 35px rgba(57,255,20,0.8), 0 0 70px rgba(57,255,20,0.4), 0 0 100px rgba(57,255,20,0.15); }
        }
        @keyframes scanMove {
          0%{ transform: translateY(-100%); }
          100%{ transform: translateY(100vh); }
        }
        @keyframes cornerSpin {
          0%{ transform: rotate(0deg); }
          100%{ transform: rotate(360deg); }
        }
        .diff-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .diff-card:hover { transform: perspective(400px) rotateX(-3deg) scale(1.03); }
        .diff-card.selected { transform: perspective(400px) rotateX(-2deg) scale(1.05); }
        .menu-btn { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .menu-btn:hover { transform: scale(1.06); }
        .menu-btn:active { transform: scale(0.96); }
      `}</style>

      {/* Perspective grid */}
      <GridBg />

      {/* Scan line moving */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '2px',
        background: 'linear-gradient(90deg, transparent, rgba(57,255,20,0.6), transparent)',
        animation: 'scanMove 4s linear infinite',
        pointerEvents: 'none', zIndex: 1
      }} />

      {/* Particles */}
      {particles.map((s, i) => <FloatingParticle key={i} style={s} />)}

      {/* Main container */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%', maxWidth: '680px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 'clamp(1.2rem, 3vw, 2rem)'
      }}>

        {/* ── HEADER ── */}
        <div style={{ textAlign: 'center', position: 'relative' }}>
          {/* Corner decorations */}
          <div style={{
            position: 'absolute', top: '-16px', left: '-20px',
            width: '20px', height: '20px',
            borderTop: '2px solid #39FF14', borderLeft: '2px solid #39FF14',
            opacity: 0.7
          }} />
          <div style={{
            position: 'absolute', top: '-16px', right: '-20px',
            width: '20px', height: '20px',
            borderTop: '2px solid #39FF14', borderRight: '2px solid #39FF14',
            opacity: 0.7
          }} />

          <div style={{
            fontSize: 'clamp(8px, 1.5vw, 11px)', color: '#39FF14',
            letterSpacing: '0.4em', opacity: 0.6, marginBottom: '8px'
          }}>
            ▸ ARCADE TYPING GAME ◂
          </div>

          <h1 style={{
            fontSize: 'clamp(20px, 6vw, 42px)', margin: 0,
            color: '#39FF14',
            animation: 'titlePulse 2s ease-in-out infinite',
            lineHeight: 1.1
          }}>
            TYPE<span style={{ color: '#00D9FF' }}>STORM</span>
          </h1>

          <div style={{
            height: '2px', margin: '10px auto 8px',
            width: 'clamp(80px, 20vw, 140px)',
            background: 'linear-gradient(90deg, transparent, #39FF14, #00D9FF, transparent)'
          }} />

          <p style={{
            fontSize: 'clamp(7px, 1.5vw, 10px)', color: '#00D9FF',
            letterSpacing: '0.2em', margin: 0,
            textShadow: '0 0 12px #00D9FF'
          }}>
            PLAYER: {user?.username?.toUpperCase() || 'PLAYER_01'}
          </p>
        </div>

        {/* ── MAIN CARD ── */}
        <div style={{
          width: '100%', position: 'relative',
          background: 'linear-gradient(160deg, rgba(57,255,20,0.04) 0%, rgba(0,10,5,0.98) 40%)',
          border: '1.5px solid rgba(57,255,20,0.5)',
          borderRadius: '4px',
          animation: 'borderGlow 2.5s ease-in-out infinite',
          padding: 'clamp(1rem, 4vw, 2rem)',
          boxSizing: 'border-box',
          transform: 'perspective(1000px) rotateX(1.5deg)',
          transformOrigin: 'top center'
        }}>
          <ScanLine />

          {/* Corner accents */}
          {[
            { top: -1, left: -1, borderTop: '2px solid #39FF14', borderLeft: '2px solid #39FF14' },
            { top: -1, right: -1, borderTop: '2px solid #39FF14', borderRight: '2px solid #39FF14' },
            { bottom: -1, left: -1, borderBottom: '2px solid #39FF14', borderLeft: '2px solid #39FF14' },
            { bottom: -1, right: -1, borderBottom: '2px solid #39FF14', borderRight: '2px solid #39FF14' }
          ].map((s, i) => (
            <div key={i} style={{
              position: 'absolute', width: '16px', height: '16px', ...s, zIndex: 2
            }} />
          ))}

          <h2 style={{
            textAlign: 'center', color: '#39FF14',
            fontSize: 'clamp(8px, 2vw, 12px)',
            letterSpacing: '0.3em', marginBottom: 'clamp(1rem, 3vw, 1.5rem)', marginTop: 0,
            textShadow: '0 0 8px #39FF14'
          }}>
            ⚙ SELECT DIFFICULTY
          </h2>

          {/* Difficulty grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(120px, 40%, 200px), 1fr))',
            gap: 'clamp(0.5rem, 2vw, 0.875rem)',
            marginBottom: 'clamp(1rem, 3vw, 1.5rem)'
          }}>
            {Object.entries(difficulties).map(([key, d]) => {
              const isSelected = selectedDifficulty === key;
              const isHov = hovered === key;
              return (
                <button
                  key={key}
                  className={`diff-card${isSelected ? ' selected' : ''}`}
                  onClick={() => setSelectedDifficulty(key)}
                  onMouseEnter={() => setHovered(key)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background: isSelected
                      ? `linear-gradient(135deg, ${d.glow}, rgba(0,0,0,0.8))`
                      : isHov
                        ? `rgba(${d.rgb},0.08)`
                        : 'rgba(0,0,0,0.5)',
                    border: `1.5px solid ${isSelected ? d.color : isHov ? d.color + '88' : '#333'}`,
                    borderRadius: '3px',
                    padding: 'clamp(0.6rem, 2vw, 1rem) clamp(0.5rem, 2vw, 0.875rem)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: isSelected ? d.color : isHov ? d.color + 'cc' : '#555',
                    boxShadow: isSelected
                      ? `0 0 20px ${d.glow}, 0 8px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)`
                      : isHov
                        ? `0 0 12px rgba(${d.rgb},0.3), 0 4px 20px rgba(0,0,0,0.5)`
                        : '0 4px 15px rgba(0,0,0,0.4)',
                    fontFamily: '"Press Start 2P", monospace',
                    position: 'relative', overflow: 'hidden',
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {/* Shine streak */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute', top: 0, left: '-60%',
                      width: '40%', height: '100%',
                      background: `linear-gradient(90deg, transparent, rgba(${d.rgb},0.15), transparent)`,
                      pointerEvents: 'none'
                    }} />
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: 'clamp(10px, 2vw, 14px)', opacity: isSelected ? 1 : 0.4 }}>
                      {d.icon}
                    </span>
                    <span style={{ fontSize: 'clamp(7px, 1.5vw, 10px)', fontWeight: 'bold', letterSpacing: '0.1em' }}>
                      {d.label}
                    </span>
                  </div>

                  <p style={{
                    margin: '0 0 8px', lineHeight: 1.6,
                    fontSize: 'clamp(6px, 1vw, 8px)',
                    color: isSelected ? d.color + 'cc' : '#444',
                    fontFamily: '"Press Start 2P", monospace'
                  }}>
                    {d.description}
                  </p>

                  <div style={{
                    display: 'flex', gap: '6px', flexWrap: 'wrap',
                    fontSize: 'clamp(5px, 0.9vw, 7px)'
                  }}>
                    <span style={{
                      background: isSelected ? `rgba(${d.rgb},0.2)` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isSelected ? d.color + '44' : '#222'}`,
                      borderRadius: '2px', padding: '2px 5px',
                      color: isSelected ? d.color : '#444'
                    }}>
                      {d.settings.fallSpeed}x
                    </span>
                    <span style={{
                      background: isSelected ? `rgba(${d.rgb},0.2)` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isSelected ? d.color + '44' : '#222'}`,
                      borderRadius: '2px', padding: '2px 5px',
                      color: isSelected ? d.color : '#444'
                    }}>
                      {d.settings.spawnInterval}ms
                    </span>
                  </div>

                  {isSelected && (
                    <div style={{
                      marginTop: '8px', paddingTop: '8px',
                      borderTop: `1px solid ${d.color}33`,
                      fontSize: 'clamp(6px, 0.9vw, 8px)',
                      color: d.color, display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                      <span>✓</span> SELECTED
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Stats bar */}
          <div style={{
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(57,255,20,0.2)',
            borderRadius: '3px',
            padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)',
            display: 'flex', justifyContent: 'space-around',
            marginBottom: 'clamp(0.875rem, 2.5vw, 1.25rem)',
            flexWrap: 'wrap', gap: '8px'
          }}>
            {[
              { label: 'SPEED', value: `${diff.settings.fallSpeed}×` },
              { label: 'INTERVAL', value: `${diff.settings.spawnInterval}ms` },
              { label: 'MODE', value: diff.label }
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 'clamp(5px, 0.9vw, 7px)', color: '#555',
                  letterSpacing: '0.2em', marginBottom: '4px'
                }}>{label}</div>
                <div style={{
                  fontSize: 'clamp(8px, 1.8vw, 12px)', color: diff.color,
                  textShadow: `0 0 8px ${diff.color}`
                }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Start button */}
          <button
            className="menu-btn"
            onClick={handleStartGame}
            onMouseEnter={() => setBtnHover('start')}
            onMouseLeave={() => setBtnHover(null)}
            style={{
              width: '100%',
              padding: 'clamp(0.75rem, 2.5vw, 1.1rem)',
              background: btnHover === 'start'
                ? 'linear-gradient(135deg, rgba(57,255,20,0.3), rgba(57,255,20,0.1))'
                : 'linear-gradient(135deg, rgba(57,255,20,0.15), rgba(57,255,20,0.05))',
              border: '2px solid #39FF14',
              borderRadius: '3px',
              color: '#39FF14',
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 'clamp(9px, 2vw, 13px)',
              letterSpacing: '0.2em',
              cursor: 'pointer',
              animation: 'startBtnPulse 1.8s ease-in-out infinite',
              position: 'relative', overflow: 'hidden'
            }}
          >
            {/* Button inner shine */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 60%)',
              pointerEvents: 'none'
            }} />
            ▶ &nbsp; START GAME
          </button>
        </div>

        {/* ── BOTTOM BUTTONS ── */}
        <div style={{
          display: 'flex', gap: 'clamp(0.6rem, 2vw, 1rem)',
          justifyContent: 'center', flexWrap: 'wrap', width: '100%'
        }}>
          {[
            {
              id: 'dash', label: '◈ DASHBOARD', onClick: onGoToDashboard,
              color: '#00D9FF', rgb: '0,217,255'
            },
            {
              id: 'logout', label: '⏻ LOGOUT', onClick: onLogout,
              color: '#FF3366', rgb: '255,51,102'
            }
          ].map(({ id, label, onClick, color, rgb }) => (
            <button
              key={id}
              className="menu-btn"
              onClick={onClick}
              onMouseEnter={() => setBtnHover(id)}
              onMouseLeave={() => setBtnHover(null)}
              style={{
                padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.75rem)',
                background: btnHover === id
                  ? `rgba(${rgb},0.2)`
                  : `rgba(${rgb},0.06)`,
                border: `1.5px solid ${btnHover === id ? color : color + '66'}`,
                borderRadius: '3px',
                color: btnHover === id ? color : color + 'aa',
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 'clamp(7px, 1.3vw, 10px)',
                letterSpacing: '0.15em',
                cursor: 'pointer',
                boxShadow: btnHover === id
                  ? `0 0 20px rgba(${rgb},0.4), 0 4px 20px rgba(0,0,0,0.5)`
                  : `0 0 8px rgba(${rgb},0.15)`
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          fontSize: 'clamp(5px, 0.9vw, 7px)', color: '#2a2a2a',
          letterSpacing: '0.3em', textAlign: 'center'
        }}>
          ▸ INSERT COIN TO CONTINUE ◂
        </div>
      </div>
    </div>
  );
}