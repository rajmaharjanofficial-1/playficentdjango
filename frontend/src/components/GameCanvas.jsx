import React, { useEffect, useRef, useState, useCallback } from 'react';

/* ─── VOCABULARY ─────────────────────────────────────────── */
const VOCABULARY = [
  "REACT","DJANGO","PYTHON","VITE","TAILWIND","CODE","HACK","TYPE","FAST","GAME",
  "SPACE","LASER","ALIEN","BUG","FLOAT","GRID","JAVASCRIPT","TYPESCRIPT","NODEJS",
  "EXPRESS","MONGODB","REDIS","DOCKER","GITHUB","WEBPACK","BABEL","ESLINT","GIT",
  "COMMIT","BRANCH","MERGE","HTML","CSS","JSON","YAML","API","REST","GRAPHQL",
  "DATABASE","SCHEMA","QUERY","INDEX","CLASS","OBJECT","METHOD","ARRAY","STRING",
  "BOOLEAN","PROMISE","ASYNC","AWAIT","LOOP","SWITCH","DEBUG","COMPONENT","PROPS",
  "STATE","HOOK","EFFECT","REDUCER","RENDER","DEPLOY","BUILD","TEST","UNIT","MOCK",
  "SECURITY","TOKEN","SESSION","CACHE","FRONTEND","BACKEND","FULLSTACK","DEVOPS",
  "AGILE","SCRUM","SERVER","CLIENT","REQUEST","RESPONSE","ERROR","ROUTE","LOAD",
  "ABOUT","ABOVE","ACROSS","AFTER","AGAIN","AGENCY","AGENT","AGREE","AHEAD","ALARM",
  "ALBUM","ALERT","ALIGN","ALIVE","ALLOW","ALONE","ALTER","ANGEL","ANGER","ANGLE",
  "ANSWER","APPEAL","APPEAR","APPLE","APPLY","ARENA","ARGUE","ARISE","ARMOR","ARROW",
  "ARTIST","ASPECT","ASSERT","ASSET","ASSIGN","ASSUME","ASSURE","ATTACK","ATTEND",
  "AUDIO","AUDIT","AUTHOR","AUTUMN","AVENUE","AVOID","AWAKE","AWARD","AWARE",
  "BALANCE","BALLET","BALLOT","BAMBOO","BANANA","BANDIT","BANKER","BANNER","BARREL",
  "BARTER","BEHIND","BELOVED","BETTER","BEYOND","BINARY","BITTER","BIZARRE","BLISS",
  "BORDER","BOTTLE","BOTTOM","BOUNCE","BRIDGE","BRIGHT","BROKEN","BROKER","BRONZE",
  "BROWSE","RECENT","RECESS","RECIPE","RECKON","RECORD","REDUCE","REFORM","REFUGE",
  "REGARD","REGION","REGRET","REJECT","RELATE","RELAX","RELIEF","REMARK","REMEDY",
  "REMIND","REPAIR","REPEAT","RENDER","RENEW","RENTAL","REPLAY","REPLACE","REPORT",
];

/* ─── CONSTANTS ──────────────────────────────────────────── */
const DEFAULT_SPAWN_MS   = 2500;
const DEFAULT_FALL_SPEED = 0.45;
const LOSE_Y_OFFSET      = 110;

const POWER_UP_TYPES = {
  DOUBLE_POINTS: { name: '2X POINTS', color: '#FFD700', duration: 8000, icon: '⚡' },
  SLOW_MO:       { name: 'SLOW-MO',   color: '#00D9FF', duration: 6000, icon: '❄' },
  SHIELD:        { name: 'SHIELD',    color: '#FF10F0', duration: 1,    icon: '🛡' },
};

/* ─── INLINE STYLES (pure CSS-in-JS, no Tailwind needed for 3D effects) ── */
const GS = {
  root: {
    position: 'relative', width: '100%', height: '100%', overflow: 'hidden',
    background: 'radial-gradient(ellipse at 50% 110%, #0a1628 0%, #020510 60%, #000005 100%)',
    fontFamily: "'Press Start 2P', 'Courier New', monospace",
    cursor: 'default',
  },
  /* Perspective grid floor */
  grid: {
    position: 'absolute', bottom: 0, left: '50%',
    transform: 'translateX(-50%) perspective(600px) rotateX(72deg)',
    transformOrigin: 'bottom center',
    width: '300%', height: '55%',
    backgroundImage:
      'linear-gradient(rgba(57,255,20,0.15) 1px, transparent 1px),' +
      'linear-gradient(90deg, rgba(57,255,20,0.15) 1px, transparent 1px)',
    backgroundSize: '60px 60px',
    pointerEvents: 'none',
    zIndex: 0,
  },
  /* Horizon glow */
  horizon: {
    position: 'absolute', left: 0, right: 0,
    bottom: LOSE_Y_OFFSET - 4,
    height: '3px',
    background: 'linear-gradient(90deg, transparent 0%, #39FF14 30%, #00FFFF 50%, #39FF14 70%, transparent 100%)',
    boxShadow: '0 0 24px 6px #39FF14, 0 0 60px 12px rgba(57,255,20,0.3)',
    zIndex: 2,
    pointerEvents: 'none',
  },
  /* Vignette overlay */
  vignette: {
    position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
    background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,5,0.7) 100%)',
  },
  /* CRT scanline overlay */
  scanlines: {
    position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 50,
    backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 4px)',
    mixBlendMode: 'overlay',
  },
};

/* ─── HELPERS ────────────────────────────────────────────── */
const rnd = (min, max) => Math.random() * (max - min) + min;

/* ─── COMPONENT ──────────────────────────────────────────── */
export default function GameCanvas({ onGameOver, updateScoreDisplay, difficultySettings }) {
  const containerRef = useRef(null);
  const inputRef     = useRef(null);
  const requestRef   = useRef();
  const gameState    = useRef({
    baseSpeedY: difficultySettings?.fallSpeed || DEFAULT_FALL_SPEED,
    score: 0, wordsTyped: 0, startTime: Date.now(),
    words: [], isPaused: false, combo: 0,
    lastSpawnTime: Date.now(), activePowerUps: {}, powerUps: [],
  });

  const SPAWN_MS     = difficultySettings?.spawnInterval || DEFAULT_SPAWN_MS;

  const [tick,          setTick]          = useState(0);
  const [currentInput,  setCurrentInput]  = useState('');
  const [lasers,        setLasers]        = useState([]);
  const [explosions,    setExplosions]    = useState([]);
  const [particles,     setParticles]     = useState([]);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [combo,         setCombo]         = useState(0);
  const [shake,         setShake]         = useState(false);
  const [activePowerUp, setActivePowerUp] = useState({});
  const [isPaused,      setIsPaused]      = useState(false);

  /* ── Particle animation ── */
  useEffect(() => {
    const id = setInterval(() => {
      setParticles(prev => prev
        .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.12, life: p.life - 0.045 }))
        .filter(p => p.life > 0));
      setFloatingTexts(prev => prev
        .map(t => ({ ...t, y: t.y - 1.8, life: t.life - 0.025 }))
        .filter(t => t.life > 0));
    }, 28);
    return () => clearInterval(id);
  }, []);

  /* ── Spawn helpers ── */
  const spawnParticles = useCallback((x, y, count = 14) => {
    const colors = ['#39FF14','#00FF41','#FFD700','#00FFFF','#FF10F0'];
    setParticles(prev => [
      ...prev,
      ...Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        const s = rnd(2.5, 5.5);
        return { id: Math.random(), x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s,
                 life: 1, color: colors[i % colors.length] };
      }),
    ]);
  }, []);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 120);
  }, []);

  const spawnFloat = useCallback((x, y, text, color = '#39FF14') => {
    const id = Math.random();
    setFloatingTexts(prev => [...prev, { id, x, y, text, color, life: 1 }]);
  }, []);

  const applyPowerUp = useCallback((type) => {
    const cfg = POWER_UP_TYPES[type];
    gameState.current.activePowerUps[type] = Date.now() + cfg.duration;
    spawnFloat(window.innerWidth / 2, window.innerHeight * 0.4, `${cfg.icon} ${cfg.name}!`, cfg.color);
    triggerShake();
    setActivePowerUp({ ...gameState.current.activePowerUps });
    if (type !== 'SHIELD') {
      setTimeout(() => {
        delete gameState.current.activePowerUps[type];
        setActivePowerUp({ ...gameState.current.activePowerUps });
      }, cfg.duration);
    }
  }, [spawnFloat, triggerShake]);

  const spawnPowerUpDrop = useCallback((x, y) => {
    if (Math.random() > 0.25) return;
    const types = Object.keys(POWER_UP_TYPES);
    const type  = types[Math.floor(Math.random() * types.length)];
    gameState.current.powerUps.push({ id: Math.random(), x, y, type, active: true });
  }, []);

  const spawnWord = useCallback(() => {
    const active = gameState.current.words.filter(w => w.active);
    let x;
    let ok = false;
    let tries = 0;
    while (!ok && tries++ < 12) {
      x = rnd(60, (containerRef.current?.clientWidth || window.innerWidth) - 60);
      ok = !active.some(w => Math.abs(w.x - x) < 90);
    }
    const r = Math.random();
    const mult = r < 0.15 ? 2 : r < 0.18 ? 3 : 1;
    gameState.current.words.push({
      id: Math.random(), x, y: -60,
      text: VOCABULARY[Math.floor(Math.random() * VOCABULARY.length)],
      active: true, multiplier: mult,
    });
    gameState.current.lastSpawnTime = Date.now();
  }, []);

  useEffect(() => { gameState.current.startTime = Date.now(); spawnWord(); }, [spawnWord]);

  /* ── Keyboard: pause ── */
  useEffect(() => {
    const fn = (e) => {
      if (e.key === 'Escape') {
        setIsPaused(p => {
          gameState.current.isPaused = !p;
          return !p;
        });
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  /* ── Hit logic ── */
  const triggerHit = useCallback((word) => {
    const { x, y } = word;
    const srcX = (containerRef.current?.clientWidth  || window.innerWidth)  / 2;
    const srcY = (containerRef.current?.clientHeight || window.innerHeight) - 80;

    const lid = Math.random();
    setLasers(prev => [...prev, { id: lid, start: { x: srcX, y: srcY }, end: { x, y } }]);
    triggerShake();
    spawnParticles(x, y, 18);

    setTimeout(() => {
      setLasers(prev => prev.filter(l => l.id !== lid));
      const eid = Math.random();
      setExplosions(prev => [...prev, { id: eid, x, y }]);
      setTimeout(() => setExplosions(prev => prev.filter(e => e.id !== eid)), 550);
    }, 140);

    word.active = false;
    const gs = gameState.current;
    gs.combo++;
    gs.wordsTyped++;

    const baseScore  = 10 * (word.multiplier || 1);
    const comboMult  = Math.min(1 + gs.combo * 0.2, 5);
    const powerMult  = gs.activePowerUps['DOUBLE_POINTS'] ? 2 : 1;
    const final      = Math.floor(baseScore * comboMult * powerMult);
    gs.score        += final;

    spawnFloat(x, y, `+${final}`, word.multiplier > 1 ? '#FFD700' : '#39FF14');
    if (gs.combo % 10 === 0) spawnFloat(x, y - 36, `✦ x${gs.combo} COMBO!`, '#FF10F0');
    else if (gs.combo % 5 === 0) spawnFloat(x, y - 28, `x${gs.combo}`, '#FFD700');

    setCombo(gs.combo);
    spawnPowerUpDrop(x, y);

    const mins = (Date.now() - gs.startTime) / 60000;
    updateScoreDisplay?.(gs.score, gs.wordsTyped / mins);
  }, [spawnParticles, spawnFloat, spawnPowerUpDrop, triggerShake, updateScoreDisplay]);

  /* ── Input ── */
  const handleInputChange = useCallback((e) => {
    const val = e.target.value.toUpperCase();
    setCurrentInput(val);

    const active = gameState.current.words.filter(w => w.active);
    const matches = active.filter(w => w.text === val);

    if (matches.length) {
      matches.forEach(triggerHit);
      setCurrentInput('');
      if (inputRef.current) inputRef.current.value = '';
    } else if (val.length && !active.some(w => w.text.startsWith(val))) {
      gameState.current.combo = 0;
      setCombo(0);
    }
  }, [triggerHit]);

  /* ── Game loop ── */
  const gameLoop = useCallback(() => {
    if (!containerRef.current) { requestRef.current = requestAnimationFrame(gameLoop); return; }
    const gs  = gameState.current;
    const now = Date.now();

    if (!gs.isPaused) {
      let speedMult = 1 + gs.score * 0.015;
      if (gs.activePowerUps['SLOW_MO']) speedMult *= 0.5;
      const speed = gs.baseSpeedY * speedMult;

      gs.words.filter(w => w.active).forEach(w => { w.y += speed; });

      // Power-up drops drift toward gun
      if (gs.powerUps.length) {
        gs.powerUps = gs.powerUps.filter(p => p.active);
        gs.powerUps.forEach(pu => {
          const px = (containerRef.current.clientWidth  || window.innerWidth)  / 2;
          const py = (containerRef.current.clientHeight || window.innerHeight) - 80;
          const dx = px - pu.x, dy = py - pu.y;
          const d  = Math.hypot(dx, dy);
          if (d > 20) { pu.x += (dx / d) * 4; pu.y += (dy / d) * 4; }
          if (d < 60) { pu.active = false; applyPowerUp(pu.type); }
          if (pu.y > (containerRef.current.clientHeight || window.innerHeight)) pu.active = false;
        });
      }

      // Expire timed power-ups
      Object.keys(gs.activePowerUps).forEach(k => {
        if (k !== 'SHIELD' && gs.activePowerUps[k] < now) delete gs.activePowerUps[k];
      });

      // Spawn
      let si = SPAWN_MS;
      if (gs.combo > 20) si *= 0.85; else if (gs.combo > 10) si *= 0.9;
      if (now - gs.lastSpawnTime > si) spawnWord();

      // Lose check
      const h = containerRef.current.clientHeight;
      for (const w of gs.words.filter(x => x.active)) {
        if (w.y > h - LOSE_Y_OFFSET) {
          if (gs.activePowerUps['SHIELD']) {
            w.active = false;
            delete gs.activePowerUps['SHIELD'];
            setActivePowerUp({ ...gs.activePowerUps });
            spawnFloat(w.x, w.y, '🛡 BLOCKED!', '#FF10F0');
          } else {
            const mins = (Date.now() - gs.startTime) / 60000;
            onGameOver?.(gs.score, gs.wordsTyped / mins);
            return;
          }
        }
      }
    }

    setTick(t => t + 1);
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [SPAWN_MS, applyPowerUp, spawnWord, spawnFloat, onGameOver]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameLoop]);

  /* ── Render ── */
  const gs     = gameState.current;
  const W      = containerRef.current?.clientWidth  || (typeof window !== 'undefined' ? window.innerWidth  : 800);
  const H      = containerRef.current?.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 600);
  const mobile = W < 600;
  const wordFontSize = mobile ? '9px' : 'clamp(10px, 1.4vw, 14px)';

  return (
    <div
      ref={containerRef}
      style={{
        ...GS.root,
        transform: shake ? `translate(${rnd(-4,4)}px, ${rnd(-3,3)}px)` : 'none',
        transition: shake ? 'none' : 'transform 0.05s',
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* ── 3D grid floor ── */}
      <div style={GS.grid} />

      {/* ── Horizon line ── */}
      <div style={GS.horizon} />

      {/* ── Stars ── */}
      {Array.from({ length: 60 }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left:  `${rnd(0, 100)}%`,
            top:   `${rnd(0, 55)}%`,
            width:  i % 5 === 0 ? '2px' : '1px',
            height: i % 5 === 0 ? '2px' : '1px',
            borderRadius: '50%',
            background: '#fff',
            opacity: rnd(0.2, 0.8),
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      ))}

      {/* ── Vignette ── */}
      <div style={GS.vignette} />

      {/* ── Scanlines ── */}
      <div style={GS.scanlines} />

      {/* ─────────────── FALLING WORDS ─────────────── */}
      {gs.words.filter(w => w.active).map(word => {
        const isPrefix  = currentInput.length > 0 && word.text.startsWith(currentInput);
        const isSpecial = (word.multiplier || 1) > 1;
        const typed     = isPrefix ? word.text.slice(0, currentInput.length) : '';
        const rest      = isPrefix ? word.text.slice(currentInput.length)    : word.text;

        return (
          <div
            key={word.id}
            style={{
              position:   'absolute',
              left:        word.x,
              top:         word.y,
              transform:  'translate(-50%, -50%)',
              fontSize:    wordFontSize,
              fontFamily: "'Press Start 2P', monospace",
              fontWeight:  'bold',
              letterSpacing: '0.06em',
              userSelect: 'none',
              zIndex:      10,
              /* 3D depth via layered text-shadow */
              color:      isPrefix ? '#FFFFFF' : isSpecial ? '#FFD700' : '#39FF14',
              textShadow: isSpecial
                ? '0 0 12px #FFD700, 0 0 28px #FFD70088, 2px 3px 0 #7a5f00, 3px 5px 0 #3d2e00'
                : isPrefix
                  ? '0 0 14px #FFF, 0 0 30px #FFF8, 2px 3px 0 #444, 3px 5px 0 #222'
                  : '0 0 10px #39FF14, 0 0 24px #39FF1466, 2px 3px 0 #0a4400, 3px 5px 0 #041a00',
              /* subtle 3D box behind */
              background:  isSpecial
                ? 'linear-gradient(135deg, rgba(255,215,0,0.08) 0%, transparent 60%)'
                : isPrefix
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%)'
                  : 'transparent',
              padding:     '3px 6px',
              borderRadius: '3px',
              border:      isSpecial ? '1px solid rgba(255,215,0,0.3)' : 'none',
              whiteSpace:  'nowrap',
            }}
          >
            {isPrefix ? (
              <>
                <span style={{ color: '#00FFFF', textShadow: '0 0 10px #00FFFF, 2px 3px 0 #004455' }}>
                  {typed}
                </span>
                {rest}
              </>
            ) : (
              <>
                {word.text}
                {isSpecial && <span style={{ marginLeft: '4px', fontSize: '0.7em', opacity: 0.9 }}>✦</span>}
              </>
            )}
          </div>
        );
      })}

      {/* ─────────────── PARTICLES ─────────────── */}
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: p.x, top: p.y,
          width: 5, height: 5, borderRadius: '50%',
          background: p.color, opacity: p.life,
          boxShadow: `0 0 8px ${p.color}, 0 0 18px ${p.color}88`,
          transform: 'translate(-50%,-50%)',
          pointerEvents: 'none', zIndex: 20,
        }} />
      ))}

      {/* ─────────────── POWER-UP DROPS ─────────────── */}
      {gs.powerUps.filter(p => p.active).map(pu => {
        const cfg = POWER_UP_TYPES[pu.type];
        return (
          <div key={pu.id} style={{
            position: 'absolute', left: pu.x, top: pu.y,
            transform: 'translate(-50%,-50%)',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: mobile ? '8px' : '10px',
            color: cfg.color,
            textShadow: `0 0 14px ${cfg.color}, 0 0 30px ${cfg.color}88`,
            border: `2px solid ${cfg.color}`,
            borderRadius: '5px',
            background: `${cfg.color}18`,
            padding: '4px 8px',
            pointerEvents: 'none', zIndex: 25,
            animation: 'none',
            /* pulsing scale */
            boxShadow: `0 0 12px ${cfg.color}66`,
          }}>
            {cfg.icon} {cfg.name}
          </div>
        );
      })}

      {/* ─────────────── FLOATING SCORE TEXT ─────────────── */}
      {floatingTexts.map(t => (
        <div key={t.id} style={{
          position: 'absolute', left: t.x, top: t.y,
          fontFamily: "'Press Start 2P', monospace",
          fontSize: mobile ? '9px' : '11px',
          color: t.color, opacity: t.life,
          textShadow: `0 0 10px ${t.color}, 0 0 22px ${t.color}88`,
          transform: 'translate(-50%,-50%)',
          pointerEvents: 'none', zIndex: 35,
          fontWeight: 'bold',
        }}>
          {t.text}
        </div>
      ))}

      {/* ─────────────── LASERS ─────────────── */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 15 }}>
        <defs>
          <filter id="laserGlow">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {lasers.map(l => (
          <g key={l.id} filter="url(#laserGlow)">
            <line x1={l.start.x} y1={l.start.y} x2={l.end.x} y2={l.end.y}
              stroke="#39FF14" strokeWidth="4" opacity="0.9"/>
            <line x1={l.start.x} y1={l.start.y} x2={l.end.x} y2={l.end.y}
              stroke="#FFFFFF" strokeWidth="1.5" opacity="0.6"/>
            <line x1={l.start.x} y1={l.start.y} x2={l.end.x} y2={l.end.y}
              stroke="#00FFFF" strokeWidth="8" opacity="0.15"/>
          </g>
        ))}
      </svg>

      {/* ─────────────── EXPLOSIONS ─────────────── */}
      {explosions.map(e => (
        <div key={e.id} style={{
          position: 'absolute', left: e.x, top: e.y,
          transform: 'translate(-50%,-50%)',
          pointerEvents: 'none', zIndex: 30,
        }}>
          {/* Outer ring */}
          <div style={{
            position: 'absolute',
            width: 80, height: 80, left: -40, top: -40,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,215,0,0.6) 0%, rgba(255,140,0,0.3) 40%, transparent 70%)',
            boxShadow: '0 0 40px 10px rgba(255,215,0,0.5)',
            animation: 'explode 0.5s ease-out forwards',
          }}/>
          {/* Inner core */}
          <div style={{
            position: 'absolute',
            width: 32, height: 32, left: -16, top: -16,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #FFF 0%, #FFD700 40%, transparent 70%)',
            boxShadow: '0 0 20px 6px #FFD700',
          }}/>
        </div>
      ))}

      {/* ─────────────── COMBO DISPLAY ─────────────── */}
      {combo > 2 && (
        <div style={{
          position: 'absolute', top: mobile ? 12 : 20,
          left: '50%', transform: 'translateX(-50%)',
          fontFamily: "'Press Start 2P', monospace",
          fontSize: mobile ? '10px' : 'clamp(10px, 2vw, 15px)',
          color: '#FFD700',
          textShadow: '0 0 20px #FFD700, 0 0 40px #FFD70066, 2px 3px 0 #7a5f00',
          zIndex: 40,
          pointerEvents: 'none',
          letterSpacing: '0.1em',
        }}>
          ★ COMBO ×{combo}
        </div>
      )}

      {/* ─────────────── ACTIVE POWER-UPS HUD ─────────────── */}
      {Object.keys(activePowerUp).length > 0 && (
        <div style={{
          position: 'absolute', top: mobile ? 40 : 60,
          left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center',
          zIndex: 40, pointerEvents: 'none',
        }}>
          {Object.keys(activePowerUp).map(k => {
            const cfg = POWER_UP_TYPES[k];
            return (
              <div key={k} style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: mobile ? '8px' : '10px',
                color: cfg.color,
                textShadow: `0 0 16px ${cfg.color}`,
                border: `2px solid ${cfg.color}`,
                borderRadius: '4px',
                background: `${cfg.color}15`,
                padding: '5px 12px',
                boxShadow: `0 0 14px ${cfg.color}55`,
              }}>
                {cfg.icon} {cfg.name} ACTIVE
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────── SHIELD VISUAL ─────────────── */}
      {activePowerUp['SHIELD'] && (
        <svg
          style={{
            position: 'absolute', bottom: 5,
            left: '50%', transform: 'translateX(-50%)',
            pointerEvents: 'none', zIndex: 28, overflow: 'visible',
          }}
          width="220" height="160" viewBox="0 0 220 160"
        >
          <defs>
            <filter id="sg">
              <feGaussianBlur stdDeviation="4" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <radialGradient id="shieldFill" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#FF10F0" stopOpacity="0.08"/>
              <stop offset="100%" stopColor="#FF10F0" stopOpacity="0"/>
            </radialGradient>
          </defs>
          <ellipse cx="110" cy="120" rx="100" ry="55" fill="url(#shieldFill)" filter="url(#sg)"/>
          <ellipse cx="110" cy="120" rx="100" ry="55" fill="none" stroke="#FF10F0" strokeWidth="3" opacity="0.9" filter="url(#sg)"/>
          <ellipse cx="110" cy="120" rx="82" ry="44" fill="none" stroke="#FF10F0" strokeWidth="1.5" opacity="0.5"/>
          {[0,45,90,135,180,225,270,315].map(a => {
            const r = a * Math.PI / 180;
            return <circle key={a} cx={110 + 100*Math.cos(r)*0.85} cy={120 + 55*Math.sin(r)*0.85}
              r="5" fill="#FF10F0" opacity="0.95" filter="url(#sg)"/>;
          })}
        </svg>
      )}

      {/* ─────────────── GUNNER BASE ─────────────── */}
      <div style={{
        position: 'absolute', bottom: mobile ? 18 : 24,
        left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        zIndex: 30,
      }}>
        {/* Ship body — 3D layered */}
        <div style={{
          width: mobile ? 22 : 28,
          height: mobile ? 22 : 28,
          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
          background: 'linear-gradient(180deg, #A0FFA0 0%, #39FF14 60%, #1a8800 100%)',
          boxShadow: '0 0 18px #39FF14, 0 0 36px #39FF1488, 0 4px 0 #0a4400, 0 6px 0 #041a00',
          marginBottom: '4px',
          filter: 'drop-shadow(0 2px 6px #39FF14)',
        }}/>
        {/* Base platform */}
        <div style={{
          width: mobile ? 56 : 80,
          height: mobile ? 12 : 16,
          borderRadius: '4px 4px 2px 2px',
          background: 'linear-gradient(180deg, #60ff60 0%, #39FF14 40%, #1a8800 70%, #0a4400 100%)',
          boxShadow: '0 0 14px #39FF14, 0 0 28px #39FF1455, 0 4px 0 #0a4400, 0 6px 0 #041a00',
        }}/>
        {/* Input */}
        <input
          ref={inputRef}
          style={{
            marginTop: '10px',
            background: 'transparent',
            border: 'none',
            borderBottom: '2px solid #39FF14',
            color: '#FFFFFF',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: mobile ? '13px' : '18px',
            textAlign: 'center',
            outline: 'none',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            caretColor: '#39FF14',
            textShadow: '0 0 8px #39FF14',
            boxShadow: '0 3px 14px rgba(57,255,20,0.45)',
            width: mobile ? '120px' : '180px',
            paddingBottom: '4px',
          }}
          value={currentInput}
          onChange={handleInputChange}
          onKeyDown={e => { if (e.key === 'Enter') { setCurrentInput(''); if (inputRef.current) inputRef.current.value = ''; } }}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />
      </div>

      {/* ─────────────── PAUSE OVERLAY ─────────────── */}
      {isPaused && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 60,
            background: 'rgba(0,0,8,0.88)',
            backdropFilter: 'blur(6px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '24px',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* 3D title */}
          <div style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: mobile ? '20px' : 'clamp(22px, 5vw, 40px)',
            color: '#39FF14',
            textShadow: '0 0 30px #39FF14, 4px 6px 0 #0a4400, 6px 9px 0 #041a00',
            letterSpacing: '0.2em',
            marginBottom: '12px',
          }}>
            ── PAUSED ──
          </div>
          {[
            { label: 'RESUME',  action: () => { setIsPaused(false); gameState.current.isPaused = false; inputRef.current?.focus(); } },
            { label: 'RESTART', action: () => window.location.reload() },
          ].map(btn => (
            <button
              key={btn.label}
              onClick={btn.action}
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: mobile ? '11px' : '14px',
                color: '#39FF14',
                background: 'transparent',
                border: '2px solid #39FF14',
                borderRadius: '4px',
                padding: mobile ? '10px 24px' : '14px 40px',
                cursor: 'pointer',
                letterSpacing: '0.1em',
                textShadow: '0 0 10px #39FF14',
                boxShadow: '0 0 14px #39FF1444, inset 0 0 8px rgba(57,255,20,0.05)',
                transition: 'all 0.15s',
                width: mobile ? '180px' : '220px',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#39FF14';
                e.currentTarget.style.color = '#000';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#39FF14';
              }}
            >
              {btn.label}
            </button>
          ))}
          <div style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '9px', color: '#39FF1466', marginTop: '8px',
          }}>
            ESC TO TOGGLE
          </div>
        </div>
      )}

      {/* ─────────────── EXPLOSION KEYFRAME (injected once) ─────────────── */}
      <style>{`
        @keyframes explode {
          0%   { transform: scale(0.2); opacity: 1; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
      `}</style>
    </div>
  );
}