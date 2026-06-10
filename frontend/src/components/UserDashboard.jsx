import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:8000/api';

/* ── Neon palette ─────────────────────────────────────────────── */
const C = {
  green:  '#39FF14',
  blue:   '#00D9FF',
  yellow: '#FFD700',
  pink:   '#FF10F0',
  red:    '#FF3131',
  purple: '#BF5FFF',
};

/* ── Tiny helpers ─────────────────────────────────────────────── */
const glow  = (color, px = 10) => `0 0 ${px}px ${color}, 0 0 ${px * 2}px ${color}40`;
const inset = (color)          => `inset 0 0 20px ${color}18`;

const diffColor = { easy:'#22c55e', normal:C.green, hard:C.yellow, insane:C.red };

function StatBox({ label, value, color }) {
  return (
    <div style={{
      border: `1.5px solid ${color}`,
      borderRadius: 8,
      padding: '18px 14px',
      background: `linear-gradient(135deg, #0a0a0a 60%, ${color}0d)`,
      boxShadow: `${glow(color, 8)}, ${inset(color)}`,
      transform: 'perspective(400px) rotateX(4deg)',
      transition: 'transform .2s',
      cursor: 'default',
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'perspective(400px) rotateX(0deg) scale(1.04)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'perspective(400px) rotateX(4deg)'}
    >
      <div style={{ fontSize: 9, letterSpacing: 2, color: '#666', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 'clamp(18px,3vw,28px)', fontWeight: 900, color, textShadow: glow(color, 6) }}>{value}</div>
    </div>
  );
}

function DiffCard({ diff, data }) {
  const color = diffColor[diff] || C.green;
  return (
    <div style={{
      border: `1.5px solid ${color}`,
      borderRadius: 8,
      padding: '16px 18px',
      background: `linear-gradient(145deg, #050505, ${color}10)`,
      boxShadow: `${glow(color, 6)}, ${inset(color)}`,
      transition: 'transform .2s, box-shadow .2s',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'; e.currentTarget.style.boxShadow = `${glow(color, 14)}, ${inset(color)}`; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `${glow(color, 6)}, ${inset(color)}`; }}
    >
      <div style={{ fontWeight: 900, color, letterSpacing: 3, marginBottom: 12, fontSize: 12, textShadow: glow(color,4) }}>{diff.toUpperCase()}</div>
      <Row label="Best Score" value={data.best_score} color={color} />
      <Row label="Best WPM"   value={data.best_wpm?.toFixed(1)} color={color} />
      <Row label="Games"      value={data.games_played} color={color} />
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 6, fontSize: 11 }}>
      <span style={{ color:'#555', letterSpacing:1 }}>{label}</span>
      <span style={{ color, fontWeight:700, textShadow: glow(color, 3) }}>{value}</span>
    </div>
  );
}

function NavBtn({ label, active, onClick, icon }) {
  return (
    <button onClick={onClick} style={{
      width:'100%', textAlign:'left',
      padding: '10px 14px',
      background: active ? `${C.green}15` : 'transparent',
      border: 'none',
      borderLeft: `3px solid ${active ? C.green : 'transparent'}`,
      color: active ? C.green : '#555',
      fontFamily: 'inherit', fontSize: 9, letterSpacing: 2,
      cursor:'pointer', transition:'all .15s',
      display:'flex', alignItems:'center', gap: 8,
      textShadow: active ? glow(C.green, 4) : 'none',
    }}
    onMouseEnter={e => { if (!active) { e.currentTarget.style.borderLeftColor = C.green + '66'; e.currentTarget.style.color = '#aaa'; }}}
    onMouseLeave={e => { if (!active) { e.currentTarget.style.borderLeftColor = 'transparent'; e.currentTarget.style.color = '#555'; }}}
    >
      <span style={{ fontSize: 14 }}>{icon}</span>{label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function UserDashboard({ onPlayGame, onLogout, refreshTrigger, onResumeGame }) {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('all');
  const [leaderboardDifficulty, setLeaderboardDifficulty] = useState('all');
  const [userStats, setUserStats] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [formData, setFormData] = useState({
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    bio: user?.bio || ''
  });
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || null);
  const [passwordData, setPasswordData] = useState({ current_password:'', new_password:'', confirm_password:'' });

  useEffect(() => {
    if (activeTab === 'stats') fetchLeaderboard();
    else if (activeTab === 'personal') fetchUserStats();
  }, [activeTab, leaderboardPeriod, leaderboardDifficulty]);

  useEffect(() => {
    if (activeTab === 'stats' && refreshTrigger > 0) fetchLeaderboard();
    else if (activeTab === 'personal' && refreshTrigger > 0) fetchUserStats();
  }, [refreshTrigger]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period: leaderboardPeriod, difficulty: leaderboardDifficulty, limit: 10 });
      const res = await fetch(`${API_BASE}/leaderboard?${params}`, { credentials:'include' });
      if (res.ok) setLeaderboard(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchUserStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/user/statistics`, { credentials:'include' });
      if (res.ok) setUserStats(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleFormChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  const handlePasswordChange = e => setPasswordData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleAvatarChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setMessage('Image must be under 2 MB'); setMessageType('error'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async e => {
    e.preventDefault(); setLoading(true); setMessage('');
    const updateData = { ...formData };
    if (avatarPreview !== user?.avatar_url) updateData.avatar_url = avatarPreview || '';
    const result = await updateProfile(updateData);
    setLoading(false);
    if (result.success) {
      setMessageType('success'); setMessage('Profile updated!'); setIsEditMode(false);
      setFormData({ email: user?.email||'', first_name: user?.first_name||'', last_name: user?.last_name||'', bio: user?.bio||'' });
    } else { setMessageType('error'); setMessage(result.error || 'Update failed'); }
  };

  const handleChangePassword = async e => {
    e.preventDefault(); setLoading(true); setMessage('');
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessageType('error'); setMessage('Passwords do not match'); setLoading(false); return;
    }
    const result = await updateProfile({ password: passwordData.new_password });
    setLoading(false);
    if (result.success) { setMessageType('success'); setMessage('Password changed!'); setPasswordData({ current_password:'', new_password:'', confirm_password:'' }); }
    else { setMessageType('error'); setMessage(result.error || 'Failed'); }
  };

  /* ── shared input style ──────────────────────────────────────── */
  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: '#050505',
    border: `1px solid ${C.green}55`,
    borderRadius: 4,
    padding: '10px 12px',
    color: C.green, fontFamily: 'inherit', fontSize: 10,
    outline: 'none',
    transition: 'border-color .2s, box-shadow .2s',
  };
  const focusInput = e => { e.target.style.borderColor = C.green; e.target.style.boxShadow = glow(C.green, 4); };
  const blurInput  = e => { e.target.style.borderColor = `${C.green}55`; e.target.style.boxShadow = 'none'; };

  const filterBtn = (active, onClick, label) => (
    <button onClick={onClick} style={{
      padding: '7px 14px', fontSize: 9, letterSpacing: 1,
      border: `1.5px solid ${active ? C.green : C.green+'44'}`,
      background: active ? `${C.green}22` : 'transparent',
      color: active ? C.green : '#555',
      borderRadius: 4, cursor:'pointer', fontFamily:'inherit',
      transition:'all .15s',
      textShadow: active ? glow(C.green,3) : 'none',
    }}>{label}</button>
  );

  const tabs = [
    { id:'profile',  icon:'👤', label:'PROFILE'  },
    { id:'security', icon:'🔐', label:'SECURITY' },
    { id:'stats',    icon:'🏆', label:'LEADERBOARD' },
    { id:'personal', icon:'⚡', label:'MY BESTS' },
  ];

  /* ── scanline overlay ─────────────────────────────────────────── */
  const scanlines = (
    <div style={{
      position:'fixed', inset:0, pointerEvents:'none', zIndex: 0,
      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.08) 2px, rgba(0,0,0,.08) 4px)',
    }} />
  );

  /* ── corner decorations ───────────────────────────────────────── */
  const Corner = ({ pos }) => {
    const s = pos.includes('top') ? { top:0 } : { bottom:0 };
    const l = pos.includes('left') ? { left:0 } : { right:0, transform:'scaleX(-1)' };
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" style={{ position:'absolute', ...s, ...l }}>
        <polyline points="0,20 0,0 20,0" fill="none" stroke={C.green} strokeWidth="2" opacity=".6"/>
      </svg>
    );
  };

  return (
    <div style={{
      width:'100vw', minHeight:'100vh',
      background: 'radial-gradient(ellipse at 30% 20%, #001a00 0%, #000 60%)',
      color: C.green, fontFamily: "'Press Start 2P', monospace",
      overflowX: 'hidden', position: 'relative',
    }}>
      {scanlines}

      {/* ── HEADER ────────────────────────────────────────────────── */}
      <header style={{
        position:'sticky', top:0, zIndex: 100,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding: '0 20px', height: 60,
        background: 'rgba(0,0,0,.92)',
        borderBottom: `1.5px solid ${C.green}55`,
        backdropFilter: 'blur(12px)',
        boxShadow: `0 2px 30px ${C.green}22`,
      }}>
        {/* mobile menu toggle */}
        <button onClick={() => setSidebarOpen(v => !v)} style={{
          display:'none', background:'none', border:'none', color:C.green, fontSize:22, cursor:'pointer',
          '@media(max-width:640px)':{ display:'block' }
        }} className="mobile-menu-btn">☰</button>

        <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius:'50%',
            background: avatarPreview ? `url(${avatarPreview}) center/cover` : `${C.green}22`,
            border: `2px solid ${C.green}`,
            boxShadow: glow(C.green, 6),
            display:'flex', alignItems:'center', justifyContent:'center', fontSize: 14,
          }}>
            {!avatarPreview && '👤'}
          </div>
          <span style={{ fontSize:'clamp(8px,2vw,13px)', letterSpacing:2, textShadow: glow(C.green,4) }}>
            {user?.username || 'PLAYER'}
          </span>
        </div>

        <div style={{ display:'flex', gap: 8 }}>
          {onResumeGame && (
            <HeaderBtn label="▶ RESUME" color={C.yellow} onClick={onResumeGame} pulse />
          )}
          <HeaderBtn label="HOME" color={C.green} onClick={onPlayGame} />
          <HeaderBtn label="LOGOUT" color={C.red} onClick={onLogout} />
        </div>
      </header>

      <div style={{ display:'flex', minHeight:'calc(100vh - 60px)' }}>

        {/* ── SIDEBAR ───────────────────────────────────────────────── */}
        <aside style={{
          width: 180, flexShrink: 0,
          borderRight: `1.5px solid ${C.green}33`,
          background: 'rgba(0,0,0,.7)',
          backdropFilter: 'blur(8px)',
          padding: '24px 0',
          position: 'sticky', top: 60, height: 'calc(100vh - 60px)',
          overflowY: 'auto',
          boxShadow: `inset -8px 0 20px ${C.green}08`,
          transition: 'transform .25s',
        }} className="sidebar">
          {/* decorative scan bar */}
          <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${C.green}, transparent)`, marginBottom: 20, opacity:.5 }} />
          {tabs.map(t => (
            <NavBtn key={t.id} label={t.label} icon={t.icon} active={activeTab===t.id} onClick={() => { setActiveTab(t.id); setSidebarOpen(false); }} />
          ))}
          <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${C.green}, transparent)`, marginTop: 20, opacity:.5 }} />

          {/* user level badge */}
          <div style={{ margin:'24px 12px 0', padding:'12px 10px', border:`1px solid ${C.purple}55`, borderRadius:6, background:`${C.purple}0d`, textAlign:'center' }}>
            <div style={{ fontSize:18, marginBottom:6 }}>🎮</div>
            <div style={{ fontSize:7, color:C.purple, letterSpacing:2, textShadow:glow(C.purple,3) }}>ARCADE MASTER</div>
          </div>
        </aside>

        {/* ── CONTENT ───────────────────────────────────────────────── */}
        <main style={{ flex:1, padding:'clamp(16px,3vw,36px)', overflowX:'hidden' }}>

          {/* toast */}
          {message && (
            <div style={{
              marginBottom: 20, padding:'12px 16px',
              border: `1.5px solid ${messageType==='success' ? C.green : C.red}`,
              borderRadius: 6,
              background: `${messageType==='success' ? C.green : C.red}12`,
              color: messageType==='success' ? C.green : C.red,
              fontSize: 9, letterSpacing: 1,
              boxShadow: glow(messageType==='success' ? C.green : C.red, 6),
              display:'flex', alignItems:'center', gap: 8,
            }}>
              {messageType==='success' ? '✓' : '✗'} {message}
            </div>
          )}

          {/* ── PROFILE TAB ─────────────────────────────────────────── */}
          {activeTab === 'profile' && (
            <Section title={isEditMode ? 'EDIT PROFILE' : 'YOUR PROFILE'} color={C.green}>
              {/* avatar hero */}
              <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:28 }}>
                <div style={{ position:'relative', flexShrink:0 }}>
                  <div style={{
                    width:80, height:80, borderRadius:'50%',
                    background: avatarPreview ? `url(${avatarPreview}) center/cover` : `${C.green}18`,
                    border:`2.5px solid ${C.green}`,
                    boxShadow:`${glow(C.green,10)}, ${inset(C.green)}`,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:32,
                  }}>
                    {!avatarPreview && '👤'}
                  </div>
                  {/* 3-D ring */}
                  <div style={{
                    position:'absolute', inset:-6,
                    borderRadius:'50%',
                    border:`1px dashed ${C.green}44`,
                    animation:'spin 8s linear infinite',
                  }} />
                </div>
                <div>
                  <div style={{ fontSize:'clamp(12px,2vw,18px)', fontWeight:900, letterSpacing:2, textShadow:glow(C.green,6) }}>{user?.username}</div>
                  <div style={{ fontSize:8, color:'#555', marginTop:6, letterSpacing:1 }}>
                    MEMBER SINCE {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US',{year:'numeric',month:'short'}) : '—'}
                  </div>
                </div>
              </div>

              {isEditMode ? (
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                    <Field label="FIRST NAME" name="first_name" value={formData.first_name} onChange={handleFormChange} inputStyle={inputStyle} focusInput={focusInput} blurInput={blurInput} />
                    <Field label="LAST NAME"  name="last_name"  value={formData.last_name}  onChange={handleFormChange} inputStyle={inputStyle} focusInput={focusInput} blurInput={blurInput} />
                  </div>
                  <Field label="EMAIL" name="email" type="email" value={formData.email} onChange={handleFormChange} inputStyle={inputStyle} focusInput={focusInput} blurInput={blurInput} />
                  <div>
                    <label style={{ display:'block', fontSize:8, letterSpacing:2, marginBottom:8, color:'#888' }}>BIO</label>
                    <textarea name="bio" value={formData.bio} onChange={handleFormChange} rows={3}
                      style={{...inputStyle, resize:'vertical'}}
                      onFocus={focusInput} onBlur={blurInput}
                    />
                  </div>

                  {/* Avatar upload */}
                  <div>
                    <label style={{ display:'block', fontSize:8, letterSpacing:2, marginBottom:8, color:'#888' }}>PROFILE PICTURE</label>
                    <div style={{ display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
                      <div style={{
                        width:80, height:80, borderRadius:8,
                        background: avatarPreview ? `url(${avatarPreview}) center/cover` : `${C.green}0a`,
                        border:`1.5px dashed ${C.green}55`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:28, flexShrink:0,
                      }}>
                        {!avatarPreview && '📷'}
                      </div>
                      <div style={{ flex:1 }}>
                        <label style={{ cursor:'pointer' }}>
                          <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display:'none' }} />
                          <div style={{
                            padding:'10px 16px', fontSize:8, letterSpacing:1,
                            border:`1.5px dashed ${C.green}88`, borderRadius:6,
                            background:`${C.green}08`, color:C.green, cursor:'pointer',
                            textAlign:'center', marginBottom:8,
                            transition:'background .15s',
                          }}>📁 UPLOAD IMAGE</div>
                        </label>
                        <div style={{ fontSize:7, color:'#444', letterSpacing:1 }}>PNG / JPG / GIF · max 2 MB</div>
                        {avatarPreview && (
                          <button onClick={() => setAvatarPreview(null)} style={{
                            marginTop:8, fontSize:7, color:C.red, background:'none', border:'none', cursor:'pointer', letterSpacing:1
                          }}>✕ REMOVE</button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display:'flex', gap:12, marginTop:8 }}>
                    <ActionBtn label={loading ? 'SAVING…' : 'SAVE'} color={C.green} onClick={handleUpdateProfile} disabled={loading} flex />
                    <ActionBtn label="CANCEL" color="#555" onClick={() => setIsEditMode(false)} flex outline />
                  </div>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <InfoRow label="USERNAME"   value={user?.username}               />
                  <InfoRow label="FIRST NAME" value={user?.first_name || 'Not set'} />
                  <InfoRow label="LAST NAME"  value={user?.last_name  || 'Not set'} />
                  <InfoRow label="EMAIL"      value={user?.email      || 'Not set'} />
                  <InfoRow label="BIO"        value={user?.bio        || 'No bio added'} />
                  <ActionBtn label="EDIT PROFILE" color={C.green} onClick={() => setIsEditMode(true)} />
                </div>
              )}
            </Section>
          )}

          {/* ── SECURITY TAB ────────────────────────────────────────── */}
          {activeTab === 'security' && (
            <Section title="CHANGE PASSWORD" color={C.blue}>
              <form onSubmit={handleChangePassword} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <Field label="NEW PASSWORD"     name="new_password"     type="password" value={passwordData.new_password}     onChange={handlePasswordChange} inputStyle={{...inputStyle,borderColor:`${C.blue}55`}} focusInput={e=>{e.target.style.borderColor=C.blue;e.target.style.boxShadow=glow(C.blue,4)}} blurInput={e=>{e.target.style.borderColor=`${C.blue}55`;e.target.style.boxShadow='none'}} color={C.blue} />
                <Field label="CONFIRM PASSWORD" name="confirm_password" type="password" value={passwordData.confirm_password} onChange={handlePasswordChange} inputStyle={{...inputStyle,borderColor:`${C.blue}55`}} focusInput={e=>{e.target.style.borderColor=C.blue;e.target.style.boxShadow=glow(C.blue,4)}} blurInput={e=>{e.target.style.borderColor=`${C.blue}55`;e.target.style.boxShadow='none'}} color={C.blue} />
                <ActionBtn label={loading ? 'UPDATING…' : 'CHANGE PASSWORD'} color={C.blue} type="submit" disabled={loading} />
              </form>
            </Section>
          )}

          {/* ── LEADERBOARD TAB ─────────────────────────────────────── */}
          {activeTab === 'stats' && (
            <div>
              <SectionTitle title="LEADERBOARD" color={C.yellow} />

              {/* filters */}
              <div style={{
                display:'flex', flexWrap:'wrap', gap:16, marginBottom:24,
                padding:'16px 20px',
                border:`1.5px solid ${C.yellow}33`, borderRadius:8,
                background:`${C.yellow}08`,
              }}>
                <div>
                  <div style={{ fontSize:7, color:'#555', letterSpacing:2, marginBottom:8 }}>TIME PERIOD</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {['all','month','week','today'].map(p => filterBtn(leaderboardPeriod===p, ()=>setLeaderboardPeriod(p),
                      p==='all'?'ALL TIME':p==='month'?'30 DAYS':p==='week'?'7 DAYS':'TODAY'))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:7, color:'#555', letterSpacing:2, marginBottom:8 }}>DIFFICULTY</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {['all','easy','normal','hard','insane'].map(d => filterBtn(leaderboardDifficulty===d, ()=>setLeaderboardDifficulty(d), d.toUpperCase()))}
                  </div>
                </div>
              </div>

              {loading ? (
                <Spinner />
              ) : leaderboard.length === 0 ? (
                <EmptyState msg="NO SCORES YET FOR THIS PERIOD" />
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:9 }}>
                    <thead>
                      <tr style={{ borderBottom:`1.5px solid ${C.yellow}55`, background:`${C.yellow}0a` }}>
                        {['RANK','PLAYER','SCORE','WPM','DIFFICULTY'].map(h => (
                          <th key={h} style={{ padding:'10px 12px', textAlign:h==='RANK'||h==='DIFFICULTY'?'center':'left', letterSpacing:2, color:C.yellow, fontWeight:900 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((entry, idx) => (
                        <tr key={entry.id} style={{
                          borderBottom:`1px solid ${C.green}18`,
                          background: idx===0 ? `${C.yellow}0a` : idx===1 ? `${C.green}06` : idx===2 ? `${C.blue}05` : idx%2===0 ? '#050505' : '#000',
                          transition:'background .15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = `${C.green}12`}
                        onMouseLeave={e => e.currentTarget.style.background = idx===0 ? `${C.yellow}0a` : idx%2===0 ? '#050505' : '#000'}
                        >
                          <td style={{ padding:'10px 12px', textAlign:'center' }}>
                            <span style={{ color: idx===0?C.yellow:idx===1?'#ccc':idx===2?'#cd7f32':C.green, fontWeight:900, textShadow:idx<3?glow(idx===0?C.yellow:'#ccc',4):'none' }}>
                              {idx===0?'🥇':idx===1?'🥈':idx===2?'🥉':`#${idx+1}`}
                            </span>
                          </td>
                          <td style={{ padding:'10px 12px' }}>{entry.username}</td>
                          <td style={{ padding:'10px 12px', fontWeight:900, color:C.green, textShadow:glow(C.green,3) }}>{entry.score}</td>
                          <td style={{ padding:'10px 12px', color:'#888' }}>{entry.wpm?.toFixed(2)}</td>
                          <td style={{ padding:'10px 12px', textAlign:'center' }}>
                            <span style={{ color:diffColor[entry.difficulty]||C.green, fontWeight:700, letterSpacing:1, textShadow:glow(diffColor[entry.difficulty]||C.green,3) }}>
                              {entry.difficulty?.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── PERSONAL BESTS TAB ──────────────────────────────────── */}
          {activeTab === 'personal' && (
            <div>
              <SectionTitle title="PERSONAL BESTS" color={C.pink} />

              {loading ? (
                <Spinner />
              ) : !userStats ? (
                <EmptyState msg="PLAY SOME GAMES FIRST!" />
              ) : (
                <>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:14, marginBottom:28 }}>
                    <StatBox label="TOTAL GAMES" value={userStats.total_games}               color={C.green}  />
                    <StatBox label="BEST SCORE"  value={userStats.best_overall_score}        color={C.blue}   />
                    <StatBox label="BEST WPM"    value={userStats.best_overall_wpm?.toFixed(1)} color={C.yellow} />
                    <StatBox label="AVG SCORE"   value={Math.round(userStats.average_score)} color={C.pink}   />
                  </div>

                  <div style={{ fontSize:10, letterSpacing:2, color:'#555', marginBottom:14 }}>BEST BY DIFFICULTY</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14 }}>
                    {['easy','normal','hard','insane'].map(d => userStats[d] && (
                      <DiffCard key={d} diff={d} data={userStats[d]} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── mobile sidebar overlay ──────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes scanMove {
          0%   { background-position: 0 0; }
          100% { background-position: 0 100vh; }
        }

        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: ${C.green}55; border-radius: 3px; }

        @media (max-width: 640px) {
          .mobile-menu-btn { display: block !important; }
          .sidebar {
            position: fixed !important;
            top: 60px; left: 0;
            height: calc(100vh - 60px) !important;
            z-index: 200;
            transform: translateX(-100%);
          }
          .sidebar.open { transform: translateX(0) !important; }
        }
      `}</style>

      {/* apply open class */}
      {sidebarOpen && (
        <style>{`.sidebar { transform: translateX(0) !important; }`}</style>
      )}
    </div>
  );
}

/* ── Micro-components ─────────────────────────────────────────── */
function HeaderBtn({ label, color, onClick, pulse }) {
  return (
    <button onClick={onClick} style={{
      padding:'6px 14px', fontSize:8, letterSpacing:1,
      border:`1.5px solid ${color}`,
      background: 'transparent',
      color, fontFamily:'inherit', cursor:'pointer', borderRadius:4,
      boxShadow: glow(color, 4),
      transition:'all .15s',
      animation: pulse ? 'pulse 1.5s ease-in-out infinite' : 'none',
    }}
    onMouseEnter={e => { e.currentTarget.style.background=color; e.currentTarget.style.color='#000'; }}
    onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=color; }}
    >{label}</button>
  );
}

function Section({ title, color = C.green, children }) {
  return (
    <div style={{ maxWidth: 640 }}>
      <SectionTitle title={title} color={color} />
      <div style={{
        border:`1.5px solid ${color}44`, borderRadius:10, padding:'clamp(16px,3vw,28px)',
        background:`linear-gradient(145deg,#020202,${color}06)`,
        boxShadow:`${glow(color,8)}, ${inset(color)}`,
        position:'relative', overflow:'hidden',
      }}>
        {/* corner brackets */}
        {['top-left','top-right','bottom-left','bottom-right'].map(p=>(
          <Corner key={p} pos={p} color={color} />
        ))}
        {children}
      </div>
    </div>
  );
}

function Corner({ pos, color=C.green }) {
  const s = pos.includes('top') ? { top:0 } : { bottom:0 };
  const l = pos.includes('left') ? { left:0 } : { right:0, transform:'scaleX(-1)' };
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" style={{ position:'absolute', ...s, ...l }}>
      <polyline points="0,16 0,0 16,0" fill="none" stroke={color} strokeWidth="1.5" opacity=".5"/>
    </svg>
  );
}

function SectionTitle({ title, color=C.green }) {
  return (
    <div style={{ marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${color}55,transparent)` }} />
      <span style={{ fontSize:'clamp(9px,1.8vw,13px)', letterSpacing:3, color, textShadow:glow(color,6), whiteSpace:'nowrap' }}>{title}</span>
      <div style={{ flex:1, height:1, background:`linear-gradient(90deg,transparent,${color}55)` }} />
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${C.green}18` }}>
      <span style={{ fontSize:8, color:'#555', letterSpacing:2 }}>{label}</span>
      <span style={{ fontSize:9, color:C.green, wordBreak:'break-all' }}>{value}</span>
    </div>
  );
}

function Field({ label, name, type='text', value, onChange, inputStyle, focusInput, blurInput, color=C.green }) {
  return (
    <div>
      <label style={{ display:'block', fontSize:8, letterSpacing:2, marginBottom:8, color:'#666' }}>{label}</label>
      <input type={type} name={name} value={value} onChange={onChange}
        style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
    </div>
  );
}

function ActionBtn({ label, color, onClick, type='button', disabled, flex, outline }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      flex: flex ? 1 : undefined,
      padding:'11px 20px', fontSize:9, letterSpacing:2,
      border:`1.5px solid ${color}`,
      background: outline ? 'transparent' : `${color}18`,
      color, fontFamily:'inherit', cursor: disabled ? 'not-allowed':'pointer', borderRadius:6,
      boxShadow: outline ? 'none' : glow(color, 5),
      opacity: disabled ? .5 : 1,
      transition:'all .15s',
    }}
    onMouseEnter={e => { if (!disabled && !outline) { e.currentTarget.style.background=color; e.currentTarget.style.color='#000'; }}}
    onMouseLeave={e => { if (!disabled && !outline) { e.currentTarget.style.background=`${color}18`; e.currentTarget.style.color=color; }}}
    >{label}</button>
  );
}

function Spinner() {
  return (
    <div style={{ textAlign:'center', padding:40 }}>
      <div style={{ display:'inline-block', width:40, height:40, border:`3px solid ${C.green}22`, borderTopColor:C.green, borderRadius:'50%', animation:'spin .8s linear infinite' }} />
    </div>
  );
}

function EmptyState({ msg }) {
  return (
    <div style={{ textAlign:'center', padding:'40px 20px', color:'#333', fontSize:9, letterSpacing:2 }}>
      <div style={{ fontSize:32, marginBottom:12 }}>👾</div>
      {msg}
    </div>
  );
}