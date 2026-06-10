import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000/api';

// ── Neon palette & shared style tokens ──────────────────────────────────────
const C = {
  green:  '#39FF14',
  blue:   '#00D9FF',
  yellow: '#FFD700',
  pink:   '#FF2D78',
  red:    '#FF3333',
  bg:     '#050810',
  panel:  '#0A0F1E',
  border: 'rgba(57,255,20,0.35)',
};

const glow = (color, px = 12) => `0 0 ${px}px ${color}, 0 0 ${px * 2}px ${color}40`;

// CSS injected once for animations, 3-D effects, scanlines, etc.
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Share+Tech+Mono&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  body { margin: 0; background: ${C.bg}; }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: ${C.bg}; }
  ::-webkit-scrollbar-thumb { background: ${C.green}40; border-radius: 3px; }

  /* scanline overlay */
  .scanlines::after {
    content: '';
    position: fixed; inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,0,0,0.18) 2px,
      rgba(0,0,0,0.18) 4px
    );
    pointer-events: none;
    z-index: 9999;
  }

  /* vignette */
  .vignette::before {
    content: '';
    position: fixed; inset: 0;
    background: radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.82) 100%);
    pointer-events: none;
    z-index: 9998;
  }

  @keyframes pulse-green {
    0%, 100% { text-shadow: 0 0 8px ${C.green}, 0 0 18px ${C.green}; }
    50%       { text-shadow: 0 0 18px ${C.green}, 0 0 40px ${C.green}, 0 0 60px ${C.green}60; }
  }
  @keyframes flicker {
    0%,19%,21%,23%,25%,54%,56%,100% { opacity: 1; }
    20%,22%,24%,55% { opacity: 0.5; }
  }
  @keyframes slide-in {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes rotate-border {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes count-up {
    from { opacity: 0; transform: scale(0.6); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes grid-scroll {
    from { background-position: 0 0; }
    to   { background-position: 0 40px; }
  }
  @keyframes border-run {
    0%   { box-shadow: 0 0 8px ${C.green}40; }
    50%  { box-shadow: 0 0 24px ${C.green}, 0 0 48px ${C.green}60; }
    100% { box-shadow: 0 0 8px ${C.green}40; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .anim-slide-in  { animation: slide-in 0.35s ease both; }
  .anim-flicker   { animation: flicker 4s infinite; }
  .anim-pulse     { animation: pulse-green 2.5s ease-in-out infinite; }

  /* 3-D card tilt via perspective */
  .card-3d {
    transform-style: preserve-3d;
    perspective: 800px;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }
  .card-3d:hover {
    transform: rotateX(-4deg) rotateY(4deg) translateY(-4px);
  }

  /* stat card glow pulse */
  .stat-card { animation: border-run 3s ease-in-out infinite; }

  /* sidebar item */
  .nav-item {
    position: relative;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Press Start 2P', monospace;
    font-size: 10px;
    padding: 12px 16px;
    border-left: 3px solid transparent;
    letter-spacing: 0.05em;
    color: #4a7a4a;
  }
  .nav-item:hover { color: ${C.green}; border-left-color: ${C.green}60; }
  .nav-item.active {
    color: ${C.green};
    border-left-color: ${C.green};
    background: linear-gradient(90deg, ${C.green}18 0%, transparent 100%);
    text-shadow: ${glow(C.green, 8)};
  }
  .nav-item.active::after {
    content: '▶';
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 8px;
    color: ${C.green};
  }

  /* table rows */
  .trow { transition: background 0.15s; }
  .trow:hover { background: ${C.green}0d !important; }

  /* button base */
  .btn {
    font-family: 'Press Start 2P', monospace;
    font-size: 9px;
    cursor: pointer;
    border: 2px solid;
    padding: 8px 14px;
    transition: all 0.18s;
    letter-spacing: 0.04em;
    position: relative;
    overflow: hidden;
  }
  .btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: currentColor;
    opacity: 0;
    transition: opacity 0.15s;
  }
  .btn:hover::after { opacity: 0.12; }
  .btn-green  { color: ${C.green};  border-color: ${C.green};  background: ${C.green}10; }
  .btn-green:hover  { box-shadow: ${glow(C.green)}; }
  .btn-red    { color: ${C.red};    border-color: ${C.red};    background: ${C.red}10; }
  .btn-red:hover    { box-shadow: ${glow(C.red)}; }
  .btn-yellow { color: ${C.yellow}; border-color: ${C.yellow}; background: ${C.yellow}10; }
  .btn-yellow:hover { box-shadow: ${glow(C.yellow)}; }
  .btn-primary {
    color: #000; background: ${C.green};
    border-color: ${C.green};
    text-shadow: none;
    box-shadow: ${glow(C.green)};
  }
  .btn-primary:hover { background: #58ff3a; }

  /* inputs */
  .inp {
    font-family: 'Share Tech Mono', monospace;
    font-size: 12px;
    background: #05090f;
    border: 1px solid ${C.green}50;
    color: ${C.green};
    padding: 8px 10px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    width: 100%;
  }
  .inp:focus { border-color: ${C.green}; box-shadow: 0 0 8px ${C.green}40; }
  .inp::placeholder { color: #2a4a2a; }

  select.inp option { background: #0a0f1e; color: ${C.green}; }

  /* scrollable table wrapper */
  .table-wrap {
    overflow-x: auto;
    border: 1px solid ${C.green}40;
    border-radius: 2px;
    box-shadow: 0 0 20px ${C.green}18, inset 0 0 30px rgba(0,0,0,0.5);
  }
  .game-table { width: 100%; border-collapse: collapse; }
  .game-table th {
    font-family: 'Press Start 2P', monospace;
    font-size: 9px;
    color: ${C.green};
    background: ${C.green}14;
    padding: 12px 14px;
    text-align: left;
    border-bottom: 1px solid ${C.green}40;
    white-space: nowrap;
    letter-spacing: 0.06em;
  }
  .game-table td {
    font-family: 'Share Tech Mono', monospace;
    font-size: 12px;
    color: #9ecca0;
    padding: 10px 14px;
    border-bottom: 1px solid ${C.green}18;
    white-space: nowrap;
  }

  /* 3D header bar */
  .header-3d {
    background: linear-gradient(180deg, #0d1628 0%, ${C.panel} 100%);
    border-bottom: 2px solid ${C.green}60;
    box-shadow: 0 4px 0 ${C.green}30, 0 6px 0 ${C.green}15, 0 8px 0 ${C.green}08, 0 10px 30px rgba(0,0,0,0.8);
    position: relative;
  }
  .header-3d::after {
    content: '';
    position: absolute;
    left: 0; right: 0; bottom: -6px;
    height: 4px;
    background: linear-gradient(90deg, transparent, ${C.green}30, transparent);
  }

  /* grid bg */
  .grid-bg {
    background-image:
      linear-gradient(${C.green}08 1px, transparent 1px),
      linear-gradient(90deg, ${C.green}08 1px, transparent 1px);
    background-size: 40px 40px;
    animation: grid-scroll 8s linear infinite;
  }

  /* badge */
  .badge {
    font-family: 'Press Start 2P', monospace;
    font-size: 8px;
    padding: 3px 7px;
    border: 1px solid;
    display: inline-block;
  }

  /* loading spinner */
  .spinner {
    width: 32px; height: 32px;
    border: 3px solid ${C.green}30;
    border-top-color: ${C.green};
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 40px auto;
  }

  /* message bar */
  .msg-bar {
    font-family: 'Share Tech Mono', monospace;
    font-size: 12px;
    padding: 12px 16px;
    border-left: 4px solid;
    margin-bottom: 20px;
    animation: slide-in 0.3s ease;
  }
  .msg-success { border-color: ${C.green}; color: ${C.green}; background: ${C.green}10; }
  .msg-error   { border-color: ${C.red};   color: ${C.red};   background: ${C.red}10;   }

  /* mobile tweaks */
  @media (max-width: 768px) {
    .sidebar { width: 46px !important; overflow: hidden; }
    .nav-item { padding: 14px 12px; }
    .nav-item span { display: none; }
    .nav-icon { display: block !important; }
    .stat-grid { grid-template-columns: 1fr !important; }
    .filter-grid { grid-template-columns: 1fr 1fr !important; }
  }
  @media (max-width: 480px) {
    .filter-grid { grid-template-columns: 1fr !important; }
    .header-actions .btn { padding: 6px 8px; font-size: 7px; }
  }
`;

// ── tiny avatar component ────────────────────────────────────────────────────
function Avatar({ url, name, size = 32 }) {
  if (url) return (
    <img src={url} alt={name}
      style={{ width: size, height: size, borderRadius: '50%',
        border: `1px solid ${C.green}60`, objectFit: 'cover',
        boxShadow: glow(C.green, 4) }} />
  );
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `1px solid ${C.green}50`,
      background: `linear-gradient(135deg, ${C.green}22, ${C.blue}22)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Press Start 2P', monospace", fontSize: size * 0.34,
      color: C.green, boxShadow: glow(C.green, 4),
    }}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

// ── difficulty badge ─────────────────────────────────────────────────────────
function DiffBadge({ d }) {
  const map = { easy: C.green, normal: C.blue, hard: C.yellow, insane: C.pink };
  const col = map[d] || C.green;
  return (
    <span className="badge" style={{ borderColor: col, color: col, boxShadow: `0 0 6px ${col}50` }}>
      {(d || '').toUpperCase()}
    </span>
  );
}

// ── stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }) {
  return (
    <div className="card-3d stat-card" style={{
      border: `1px solid ${color}50`,
      background: `linear-gradient(145deg, ${C.panel} 0%, ${color}08 100%)`,
      borderRadius: 2, padding: '28px 24px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* corner accent */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 60, height: 60,
        background: `linear-gradient(225deg, ${color}25, transparent 70%)`,
      }} />
      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9,
        color: '#4a6a6a', marginBottom: 12, letterSpacing: '0.08em' }}>
        {icon} {label}
      </div>
      <div style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 'clamp(22px, 4vw, 38px)',
        color, textShadow: glow(color, 10),
        animation: 'count-up 0.5s ease both',
      }}>
        {value}
      </div>
    </div>
  );
}

// ── main component ───────────────────────────────────────────────────────────
export default function AdminDashboard({ onLogout, onPlayGame, refreshTrigger, onResumeGame }) {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('all');
  const [leaderboardDifficulty, setLeaderboardDifficulty] = useState('all');
  const [leaderboardUsername, setLeaderboardUsername] = useState('');

  // inject CSS once
  useEffect(() => {
    const id = 'admin-dash-styles';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id;
      s.textContent = GLOBAL_CSS;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'leaderboard') fetchLeaderboard();
    if (activeTab === 'stats') fetchStats();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'leaderboard' && refreshTrigger > 0) fetchLeaderboard();
  }, [refreshTrigger]);

  const showMsg = (txt, type = 'success') => {
    setMessage(txt); setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const apiFetch = async (path, opts = {}) => {
    const res = await fetch(`${API_BASE}${path}`, { credentials: 'include', ...opts });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  };

  const fetchUsers = async () => {
    setLoading(true);
    try { setUsers(await apiFetch('/admin/users')); } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ period: leaderboardPeriod, difficulty: leaderboardDifficulty, limit: 100 });
      if (leaderboardUsername) p.append('username', leaderboardUsername);
      setLeaderboard(await apiFetch(`/admin/leaderboard?${p}`));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchStats = async () => {
    setLoading(true);
    try { setStats(await apiFetch('/admin/stats')); } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSaveUser = async () => {
    try {
      await apiFetch(`/admin/users/${editingUser}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      showMsg('User updated!'); setEditingUser(null); fetchUsers();
    } catch (e) { showMsg(e.message, 'error'); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try { await apiFetch(`/admin/users/${id}`, { method: 'DELETE' }); showMsg('User deleted!'); fetchUsers(); }
    catch (e) { showMsg(e.message, 'error'); }
  };

  const handleDeleteScore = async (id) => {
    if (!window.confirm('Delete this score?')) return;
    try { await apiFetch(`/admin/leaderboard/${id}`, { method: 'DELETE' }); showMsg('Score deleted!'); fetchLeaderboard(); }
    catch (e) { showMsg(e.message, 'error'); }
  };

  const tabs = [
    { id: 'users',       icon: '◈', label: 'USERS' },
    { id: 'leaderboard', icon: '◉', label: 'SCORES' },
    { id: 'stats',       icon: '◆', label: 'STATS' },
  ];

  return (
    <div className="scanlines vignette" style={{
      minHeight: '100vh', background: C.bg,
      fontFamily: "'Share Tech Mono', monospace",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="header-3d" style={{ padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* logo mark */}
          <div style={{
            width: 36, height: 36, border: `2px solid ${C.green}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: glow(C.green, 8), transform: 'rotate(45deg)',
            background: `${C.green}14`,
          }}>
            <span style={{ transform: 'rotate(-45deg)', fontSize: 14, color: C.green }}>⚡</span>
          </div>
          <h1 className="anim-flicker" style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 'clamp(10px, 2vw, 16px)',
            color: C.green, textShadow: glow(C.green, 10),
            margin: 0, letterSpacing: '0.1em',
          }}>
            ADMIN<span style={{ color: C.blue }}>::</span>PANEL
          </h1>
        </div>

        <div className="header-actions" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {onResumeGame && (
            <button className="btn btn-yellow anim-pulse" onClick={onResumeGame}>
              ▶ RESUME
            </button>
          )}
          <button className="btn btn-green" onClick={onPlayGame}>⌂ HOME</button>
          <button className="btn btn-red" onClick={onLogout}>⏻ LOGOUT</button>
        </div>
      </header>

      {/* ── BODY ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* SIDEBAR */}
        <aside className="sidebar" style={{
          width: 180, flexShrink: 0,
          background: `linear-gradient(180deg, ${C.panel} 0%, #07091a 100%)`,
          borderRight: `1px solid ${C.green}30`,
          boxShadow: `4px 0 20px rgba(0,0,0,0.6), inset -1px 0 0 ${C.green}18`,
          padding: '24px 0',
          overflowY: 'auto',
        }}>
          {tabs.map(t => (
            <div key={t.id} className={`nav-item ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}>
              <span className="nav-icon" style={{ display: 'none', fontSize: 14 }}>{t.icon}</span>
              <span>{t.icon} <span>{t.label}</span></span>
            </div>
          ))}

          {/* decorative meter */}
          <div style={{ margin: '32px 16px 0', borderTop: `1px solid ${C.green}20`, paddingTop: 20 }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#1a4a1a', marginBottom: 8 }}>SYS STATUS</div>
            {['CPU', 'MEM', 'I/O'].map((l, i) => (
              <div key={l} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#2a6a2a', marginBottom: 3 }}>
                  <span>{l}</span><span style={{ color: C.green }}>{[42, 67, 88][i]}%</span>
                </div>
                <div style={{ height: 3, background: '#0a1a0a', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${[42, 67, 88][i]}%`,
                    background: `linear-gradient(90deg, ${C.green}80, ${C.green})`,
                    boxShadow: `0 0 6px ${C.green}`,
                    transition: 'width 1s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="grid-bg" style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {message && (
            <div className={`msg-bar ${messageType === 'success' ? 'msg-success' : 'msg-error'}`}>
              {messageType === 'success' ? '✔' : '✖'} {message}
            </div>
          )}

          {/* ── USERS TAB ─────────────────────────────────── */}
          {activeTab === 'users' && (
            <div className="anim-slide-in">
              <SectionHeader title="USER MANAGEMENT" count={users.length} color={C.green} />
              {loading ? <Spinner /> : users.length === 0 ? <Empty text="No users found" /> : (
                <div className="table-wrap">
                  <table className="game-table">
                    <thead>
                      <tr>
                        {['ID', 'AVA', 'USERNAME', 'EMAIL', 'NAME', 'ROLE', 'ACTIONS'].map(h => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u, idx) => (
                        <tr key={u.id} className="trow" style={{ background: idx % 2 === 0 ? `${C.green}04` : 'transparent' }}>
                          {editingUser === u.id ? (
                            <>
                              <td style={{ color: C.green }}>{u.id}</td>
                              <td><Avatar url={u.avatar_url} name={u.username} /></td>
                              <td style={{ color: C.green }}>{u.username}</td>
                              <td>
                                <input className="inp" style={{ minWidth: 140 }}
                                  value={editForm.email}
                                  onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <input className="inp" placeholder="First" style={{ width: 90 }}
                                    value={editForm.first_name}
                                    onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} />
                                  <input className="inp" placeholder="Last" style={{ width: 90 }}
                                    value={editForm.last_name}
                                    onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} />
                                </div>
                              </td>
                              <td>
                                <select className="inp" style={{ width: 90 }}
                                  value={editForm.role}
                                  onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                                  <option value="user">user</option>
                                  <option value="admin">admin</option>
                                </select>
                              </td>
                              <td>
                                <button className="btn btn-primary" style={{ marginRight: 8 }} onClick={handleSaveUser}>SAVE</button>
                                <button className="btn btn-green" onClick={() => setEditingUser(null)}>CANCEL</button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td style={{ color: '#4a7a4a' }}>#{u.id}</td>
                              <td><Avatar url={u.avatar_url} name={u.username} /></td>
                              <td style={{ color: C.green }}>{u.username}</td>
                              <td style={{ color: '#7aaa7a' }}>{u.email || '—'}</td>
                              <td style={{ color: '#7aaa7a' }}>
                                {u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : '—'}
                              </td>
                              <td>
                                <span className="badge" style={{
                                  borderColor: u.role === 'admin' ? C.yellow : C.green,
                                  color: u.role === 'admin' ? C.yellow : C.green,
                                  boxShadow: `0 0 6px ${u.role === 'admin' ? C.yellow : C.green}40`,
                                }}>
                                  {u.role.toUpperCase()}
                                </span>
                              </td>
                              <td>
                                <button className="btn btn-green" style={{ marginRight: 8, padding: '5px 10px' }}
                                  onClick={() => { setEditingUser(u.id); setEditForm({ email: u.email, first_name: u.first_name, last_name: u.last_name, role: u.role }); }}>
                                  EDIT
                                </button>
                                <button className="btn btn-red" style={{ padding: '5px 10px' }}
                                  onClick={() => handleDeleteUser(u.id)}>
                                  DEL
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── LEADERBOARD TAB ───────────────────────────── */}
          {activeTab === 'leaderboard' && (
            <div className="anim-slide-in">
              <SectionHeader title="LEADERBOARD" count={leaderboard.length} color={C.yellow} />

              {/* filters */}
              <div style={{
                border: `1px solid ${C.green}30`,
                background: `${C.panel}cc`,
                padding: 16, marginBottom: 20,
                boxShadow: `0 0 20px ${C.green}10`,
              }}>
                <div className="filter-grid" style={{
                  display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12,
                }}>
                  <label style={labelStyle}>
                    <span>TIME PERIOD</span>
                    <select className="inp" value={leaderboardPeriod} onChange={e => setLeaderboardPeriod(e.target.value)}>
                      <option value="all">All Time</option>
                      <option value="month">Last 30 Days</option>
                      <option value="week">Last 7 Days</option>
                      <option value="today">Today</option>
                    </select>
                  </label>
                  <label style={labelStyle}>
                    <span>DIFFICULTY</span>
                    <select className="inp" value={leaderboardDifficulty} onChange={e => setLeaderboardDifficulty(e.target.value)}>
                      <option value="all">All</option>
                      <option value="easy">Easy</option>
                      <option value="normal">Normal</option>
                      <option value="hard">Hard</option>
                      <option value="insane">Insane</option>
                    </select>
                  </label>
                  <label style={labelStyle}>
                    <span>USERNAME</span>
                    <input className="inp" placeholder="Search player..." value={leaderboardUsername}
                      onChange={e => setLeaderboardUsername(e.target.value)} />
                  </label>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button className="btn btn-primary" style={{ width: '100%', padding: '10px 0' }} onClick={fetchLeaderboard}>
                      ⟳ SEARCH
                    </button>
                  </div>
                </div>
              </div>

              {loading ? <Spinner /> : leaderboard.length === 0 ? <Empty text="No scores found" /> : (
                <div className="table-wrap">
                  <table className="game-table">
                    <thead>
                      <tr>
                        {['RANK', 'AVA', 'PLAYER', 'SCORE', 'WPM', 'DIFFICULTY', 'ACTION'].map(h => (
                          <th key={h} style={{ textAlign: ['SCORE','WPM','DIFFICULTY','ACTION'].includes(h) ? 'center' : 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((e, idx) => (
                        <tr key={e.id} className="trow" style={{ background: idx % 2 === 0 ? `${C.green}04` : 'transparent' }}>
                          <td>
                            <span style={{
                              fontFamily: "'Press Start 2P', monospace", fontSize: 10,
                              color: idx === 0 ? C.yellow : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#4a7a4a',
                              textShadow: idx < 3 ? glow(idx === 0 ? C.yellow : idx === 1 ? '#C0C0C0' : '#CD7F32', 6) : 'none',
                            }}>
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                            </span>
                          </td>
                          <td><Avatar url={e.avatar_url} name={e.username} /></td>
                          <td style={{ color: C.green, fontFamily: "'Press Start 2P', monospace", fontSize: 10 }}>{e.username}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{
                              fontFamily: "'Press Start 2P', monospace", fontSize: 11,
                              color: C.green, textShadow: glow(C.green, 6),
                            }}>{e.score.toLocaleString()}</span>
                          </td>
                          <td style={{ textAlign: 'center', color: C.blue }}>{e.wpm.toFixed(1)}</td>
                          <td style={{ textAlign: 'center' }}><DiffBadge d={e.difficulty} /></td>
                          <td style={{ textAlign: 'center' }}>
                            <button className="btn btn-red" style={{ padding: '4px 10px' }}
                              onClick={() => handleDeleteScore(e.id)}>DEL</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── STATS TAB ─────────────────────────────────── */}
          {activeTab === 'stats' && (
            <div className="anim-slide-in">
              <SectionHeader title="SYSTEM STATISTICS" color={C.blue} />
              {loading ? <Spinner /> : stats ? (
                <div className="stat-grid" style={{
                  display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginBottom: 30,
                }}>
                  <StatCard label="TOTAL USERS"   value={stats.total_users}           color={C.green}  icon="◈" />
                  <StatCard label="SCORES LOGGED" value={stats.total_scores}          color={C.blue}   icon="◉" />
                  <StatCard label="AVG SCORE"     value={Math.round(stats.average_score)} color={C.yellow} icon="◆" />
                </div>
              ) : (
                <Empty text="No statistics available" />
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

// ── tiny helpers ─────────────────────────────────────────────────────────────
const labelStyle = {
  display: 'flex', flexDirection: 'column', gap: 6,
  fontFamily: "'Press Start 2P', monospace", fontSize: 8,
  color: '#4a7a4a', letterSpacing: '0.06em',
};

function SectionHeader({ title, count, color = C.green }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
      <h2 style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 'clamp(10px, 2vw, 15px)',
        color, textShadow: glow(color, 10),
        margin: 0, letterSpacing: '0.08em',
      }}>{title}</h2>
      {count !== undefined && (
        <span style={{
          fontFamily: "'Share Tech Mono', monospace", fontSize: 13,
          color: `${color}80`,
          border: `1px solid ${color}30`, padding: '1px 8px',
        }}>
          {count}
        </span>
      )}
    </div>
  );
}

function Spinner() {
  return <div className="spinner" />;
}

function Empty({ text }) {
  return (
    <div style={{
      textAlign: 'center', padding: '48px 24px',
      fontFamily: "'Press Start 2P', monospace", fontSize: 10,
      color: '#2a4a2a', letterSpacing: '0.06em',
    }}>
      [ {text} ]
    </div>
  );
}