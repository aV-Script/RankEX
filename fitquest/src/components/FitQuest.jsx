import { useState, useEffect } from "react";
import { getClients, addClient, updateClient, addSession, logout } from "../firebase/services";

// ─── COSTANTI ────────────────────────────────────────────────────────────────
const RANK_COLORS = {
  Rookie: "#6ee7b7", Scout: "#60a5fa", Warrior: "#f59e0b",
  Champion: "#a78bfa", Legend: "#f43f5e",
};
const STAT_LABELS = ["forza", "resistenza", "flessibilita", "velocita", "recupero"];
const STAT_ICONS = { forza: "⚡", resistenza: "🫀", flessibilita: "🤸", velocita: "💨", recupero: "🛡️" };
const RANKS = ["Rookie", "Scout", "Warrior", "Champion", "Legend"];

const NEW_CLIENT_TEMPLATE = {
  avatar: "💪", level: 1, rank: "Rookie", xp: 0, xpNext: 700,
  stats: { forza: 20, resistenza: 20, flessibilita: 20, velocita: 20, recupero: 20 },
  badges: ["🌱 New Challenger"],
};

// ─── PENTAGON ────────────────────────────────────────────────────────────────
function Pentagon({ stats, color }) {
  const size = 130, cx = 65, cy = 65, r = 48;
  const getPoint = (i, val) => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    return { x: cx + r * (val / 100) * Math.cos(angle), y: cy + r * (val / 100) * Math.sin(angle) };
  };
  const gridPoints = (ratio) =>
    STAT_LABELS.map((_, i) => {
      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      return `${cx + r * ratio * Math.cos(angle)},${cy + r * ratio * Math.sin(angle)}`;
    }).join(" ");
  const dataPoints = STAT_LABELS.map((k, i) => getPoint(i, stats[k]));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + "Z";
  return (
    <svg width={size} height={size} style={{ overflow: "visible" }}>
      {[0.25, 0.5, 0.75, 1].map(r => <polygon key={r} points={gridPoints(r)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />)}
      {STAT_LABELS.map((_, i) => { const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2; return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />; })}
      <path d={dataPath} fill={color + "44"} stroke={color} strokeWidth="2" />
      {dataPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />)}
      {STAT_LABELS.map((k, i) => { const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2; return <text key={k} x={cx + (r + 18) * Math.cos(angle)} y={cy + (r + 18) * Math.sin(angle)} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="rgba(255,255,255,0.6)" fontFamily="Rajdhani, sans-serif">{STAT_ICONS[k]}</text>; })}
    </svg>
  );
}

// ─── XP BAR ──────────────────────────────────────────────────────────────────
function XPBar({ xp, xpNext, color }) {
  const pct = Math.round((xp / xpNext) * 100);
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, fontFamily: "Rajdhani, sans-serif" }}>
        <span>XP {xp?.toLocaleString()}</span><span>{xpNext?.toLocaleString()}</span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 99, height: 6, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${color}, #fff8)`, borderRadius: 99, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

// ─── MODAL ───────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 32, width: 400, maxWidth: "90vw", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ margin: 0, fontFamily: "Orbitron, monospace", color: "#fff", fontSize: 16 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10, padding: "10px 14px", color: "#fff", fontFamily: "Rajdhani, sans-serif",
  fontSize: 15, boxSizing: "border-box", outline: "none",
};

// ─── ADD CLIENT MODAL ────────────────────────────────────────────────────────
function AddClientModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: "", avatar: "💪" });
  const [loading, setLoading] = useState(false);
  const avatarOptions = ["💪", "🧘", "🌱", "🏃", "⚡", "🦁", "🔥", "🏋️"];
  const handleAdd = async () => {
    if (!form.name) return;
    setLoading(true);
    await onAdd(form);
    setLoading(false);
    onClose();
  };
  return (
    <Modal title="➕ Nuovo Cliente" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <input style={inputStyle} placeholder="Nome e Cognome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 8, fontFamily: "Rajdhani, sans-serif", letterSpacing: 1 }}>AVATAR</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {avatarOptions.map(a => (
              <button key={a} onClick={() => setForm({ ...form, avatar: a })}
                style={{ fontSize: 24, background: form.avatar === a ? "rgba(96,165,250,0.2)" : "rgba(255,255,255,0.05)", border: `2px solid ${form.avatar === a ? "#60a5fa" : "transparent"}`, borderRadius: 10, padding: 8, cursor: "pointer" }}>
                {a}
              </button>
            ))}
          </div>
        </div>
        <button onClick={handleAdd} disabled={loading}
          style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", border: "none", borderRadius: 12, padding: "14px", color: "#fff", fontFamily: "Orbitron, monospace", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 1, opacity: loading ? 0.6 : 1 }}>
          {loading ? "SALVATAGGIO..." : "AGGIUNGI CLIENTE"}
        </button>
      </div>
    </Modal>
  );
}

// ─── LEVEL UP MODAL ──────────────────────────────────────────────────────────
function LevelUpModal({ client, onClose, onLevelUp }) {
  const [deltas, setDeltas] = useState({ forza: 0, resistenza: 0, flessibilita: 0, velocita: 0, recupero: 0 });
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const handleConfirm = async () => {
    setLoading(true);
    await onLevelUp(deltas, note);
    setLoading(false);
    onClose();
  };
  return (
    <Modal title={`⬆️ Aggiorna — ${client.name}`} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontFamily: "Rajdhani, sans-serif" }}>Aggiorna i parametri per avanzare al prossimo livello</div>
        {STAT_LABELS.map(k => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 100, color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: "Rajdhani, sans-serif", textTransform: "capitalize" }}>{STAT_ICONS[k]} {k}</span>
            <span style={{ width: 28, color: "#fff", fontSize: 13, fontFamily: "Orbitron, monospace" }}>{client.stats[k]}</span>
            <input type="range" min={-10} max={20} value={deltas[k]} onChange={e => setDeltas({ ...deltas, [k]: +e.target.value })} style={{ flex: 1, accentColor: "#60a5fa" }} />
            <span style={{ width: 40, textAlign: "right", color: deltas[k] > 0 ? "#6ee7b7" : deltas[k] < 0 ? "#f87171" : "rgba(255,255,255,0.3)", fontFamily: "Orbitron, monospace", fontSize: 12 }}>
              {deltas[k] > 0 ? `+${deltas[k]}` : deltas[k]}
            </span>
          </div>
        ))}
        <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 60 }} placeholder="Note sessione..." value={note} onChange={e => setNote(e.target.value)} />
        <button onClick={handleConfirm} disabled={loading}
          style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)", border: "none", borderRadius: 12, padding: "14px", color: "#fff", fontFamily: "Orbitron, monospace", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 1, opacity: loading ? 0.6 : 1 }}>
          {loading ? "SALVATAGGIO..." : "🚀 CONFERMA AGGIORNAMENTO"}
        </button>
      </div>
    </Modal>
  );
}

// ─── TRAINER AREA ─────────────────────────────────────────────────────────────
function TrainerArea({ trainerId, onSelectClient }) {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClients(trainerId).then(data => { setClients(data); setLoading(false); });
  }, [trainerId]);

  const handleAddClient = async (form) => {
    const today = new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
    const newClient = {
      ...NEW_CLIENT_TEMPLATE,
      name: form.name,
      avatar: form.avatar,
      log: [{ date: today, action: "Benvenuto nel programma! 🎉", xp: 50 }],
    };
    const ref = await addClient(trainerId, newClient);
    setClients(prev => [...prev, { id: ref.id, ...newClient }]);
  };

  const filtered = clients.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: "40px 32px", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontFamily: "Orbitron, monospace", fontSize: 11, color: "#60a5fa", letterSpacing: 3, marginBottom: 8 }}>PERSONAL TRAINER DASHBOARD</div>
          <h1 style={{ margin: 0, fontFamily: "Orbitron, monospace", fontSize: 28, color: "#fff", fontWeight: 900 }}>I Tuoi Clienti</h1>
        </div>
        <button onClick={logout} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 16px", color: "rgba(255,255,255,0.4)", fontFamily: "Rajdhani, sans-serif", fontSize: 13, cursor: "pointer" }}>
          Logout
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <input style={{ ...inputStyle, flex: 1 }} placeholder="🔍 Cerca cliente..." value={search} onChange={e => setSearch(e.target.value)} />
        <button onClick={() => setShowAdd(true)} style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", border: "none", borderRadius: 12, padding: "10px 20px", color: "#fff", fontFamily: "Orbitron, monospace", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
          + AGGIUNGI
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontFamily: "Rajdhani, sans-serif", padding: 40 }}>Caricamento...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontFamily: "Rajdhani, sans-serif", padding: 40 }}>
          {clients.length === 0 ? "Nessun cliente ancora. Aggiungine uno!" : "Nessun risultato."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(c => {
            const color = RANK_COLORS[c.rank] || "#60a5fa";
            return (
              <button key={c.id} onClick={() => onSelectClient(c)}
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 16, textAlign: "left", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.borderColor = color + "66"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}>
                <span style={{ fontSize: 36 }}>{c.avatar}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: 18, color: "#fff" }}>{c.name}</div>
                  <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                    <span style={{ background: color + "22", color, borderRadius: 99, padding: "2px 10px", fontSize: 11, fontFamily: "Orbitron, monospace" }}>LVL {c.level}</span>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontFamily: "Rajdhani, sans-serif" }}>{c.rank}</span>
                  </div>
                </div>
                <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 20 }}>›</div>
              </button>
            );
          })}
        </div>
      )}
      {showAdd && <AddClientModal onClose={() => setShowAdd(false)} onAdd={handleAddClient} />}
    </div>
  );
}

// ─── CLIENT DASHBOARD ────────────────────────────────────────────────────────
function ClientDashboard({ client: initialClient, onBack }) {
  const [client, setClient] = useState(initialClient);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const color = RANK_COLORS[client.rank] || "#60a5fa";

  const handleLevelUp = async (deltas, note) => {
    const newStats = {};
    STAT_LABELS.forEach(k => { newStats[k] = Math.min(100, Math.max(0, client.stats[k] + deltas[k])); });
    const xpGain = Object.values(deltas).reduce((a, b) => a + Math.max(0, b), 0) * 15 + 300;
    const newXp = client.xp + xpGain;
    const levelUp = newXp >= client.xpNext;
    const newLevel = levelUp ? client.level + 1 : client.level;
    const newXpFinal = levelUp ? newXp - client.xpNext : newXp;
    const newXpNext = levelUp ? Math.round(client.xpNext * 1.3) : client.xpNext;
    const today = new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
    const newLogEntry = { date: today, action: note || `Sessione aggiornamento (Lv.${newLevel})`, xp: xpGain };
    const newLog = [newLogEntry, ...(client.log || [])].slice(0, 10);
    const newRank = RANKS[Math.min(Math.floor(newLevel / 4), RANKS.length - 1)];

    const updated = { ...client, stats: newStats, xp: newXpFinal, xpNext: newXpNext, level: newLevel, rank: newRank, log: newLog };

    await updateClient(client.id, { stats: newStats, xp: newXpFinal, xpNext: newXpNext, level: newLevel, rank: newRank, log: newLog });
    await addSession(client.id, { action: newLogEntry.action, xp: xpGain, statDeltas: deltas });

    setClient(updated);
  };

  const Card = ({ style, children }) => (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 20, ...style }}>
      {children}
    </div>
  );

  return (
    <div style={{ padding: "28px 20px", maxWidth: 700, margin: "0 auto" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontFamily: "Rajdhani, sans-serif", fontSize: 14, cursor: "pointer", marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>
        ‹ Torna alla lista
      </button>

      {/* TOP ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 40 }}>{client.avatar}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: 20, color: "#fff" }}>{client.name}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                <span style={{ background: color + "22", color, borderRadius: 99, padding: "2px 12px", fontSize: 11, fontFamily: "Orbitron, monospace" }}>LVL {client.level}</span>
                <span style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", borderRadius: 99, padding: "2px 10px", fontSize: 11, fontFamily: "Rajdhani, sans-serif" }}>{client.rank}</span>
              </div>
              <XPBar xp={client.xp} xpNext={client.xpNext} color={color} />
            </div>
          </div>
        </Card>
        <Card style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Pentagon stats={client.stats} color={color} />
        </Card>
      </div>

      {/* CENTER */}
      <Card style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginRight: 32 }}>
          <div style={{ width: 90, height: 90, borderRadius: "50%", border: `3px solid ${color}`, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, boxShadow: `0 0 30px ${color}55` }}>
            {client.avatar}
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "Rajdhani, sans-serif", letterSpacing: 2 }}>RANK</div>
            <div style={{ color, fontFamily: "Orbitron, monospace", fontSize: 15, fontWeight: 700 }}>{client.rank}</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "Orbitron, monospace", fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: 3, marginBottom: 16 }}>STATISTICHE</div>
          {STAT_LABELS.map(k => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ width: 16, fontSize: 14 }}>{STAT_ICONS[k]}</span>
              <span style={{ width: 90, color: "rgba(255,255,255,0.5)", fontFamily: "Rajdhani, sans-serif", fontSize: 13, textTransform: "capitalize" }}>{k}</span>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 99, height: 5 }}>
                <div style={{ width: `${client.stats[k]}%`, height: "100%", background: `linear-gradient(90deg, ${color}, ${color}aa)`, borderRadius: 99 }} />
              </div>
              <span style={{ width: 30, textAlign: "right", fontFamily: "Orbitron, monospace", fontSize: 11, color }}>{client.stats[k]}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* BOTTOM ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <Card>
          <div style={{ fontFamily: "Orbitron, monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 3, marginBottom: 14 }}>📋 ATTIVITÀ RECENTI</div>
          {(client.log || []).slice(0, 4).map((entry, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
              <span style={{ color: "rgba(255,255,255,0.2)", fontFamily: "Rajdhani, sans-serif", fontSize: 11, whiteSpace: "nowrap", marginTop: 1 }}>{entry.date}</span>
              <div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontFamily: "Rajdhani, sans-serif", fontSize: 13 }}>{entry.action}</div>
                <div style={{ color: "#6ee7b7", fontFamily: "Orbitron, monospace", fontSize: 10 }}>+{entry.xp} XP</div>
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ fontFamily: "Orbitron, monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 3, marginBottom: 14 }}>🏅 BADGE CONQUISTATI</div>
          {(client.badges || []).map((b, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "8px 12px", fontFamily: "Rajdhani, sans-serif", fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 8 }}>{b}</div>
          ))}
        </Card>
      </div>

      <button onClick={() => setShowLevelUp(true)}
        style={{ width: "100%", background: `linear-gradient(135deg, ${color}cc, ${color}44)`, border: `1px solid ${color}66`, borderRadius: 16, padding: "18px", color: "#fff", fontFamily: "Orbitron, monospace", fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: 2, boxShadow: `0 0 30px ${color}33` }}>
        ⬆️ AGGIORNA PROGRESSO
      </button>

      {showLevelUp && <LevelUpModal client={client} onClose={() => setShowLevelUp(false)} onLevelUp={handleLevelUp} />}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function FitQuest({ user }) {
  const [selectedClient, setSelectedClient] = useState(null);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #070b14; }
        input[type=range] { height: 4px; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
      `}</style>
      <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 20% 0%, #0f1f3d 0%, #070b14 60%)", color: "#fff" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: "Orbitron, monospace", fontWeight: 900, fontSize: 18, background: "linear-gradient(90deg, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            FIT<span style={{ fontWeight: 400 }}>QUEST</span>
          </span>
        </div>
        {selectedClient
          ? <ClientDashboard client={selectedClient} onBack={() => setSelectedClient(null)} />
          : <TrainerArea trainerId={user.uid} onSelectClient={setSelectedClient} />
        }
      </div>
    </>
  );
}
