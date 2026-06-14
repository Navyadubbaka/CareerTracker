import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

// ── THEME ────────────────────────────────────────────────────────────────────
const C = {
  primary: "#5B6EF5", secondary: "#B8A4FF",
  bg: "#F8F9FC", card: "#FFFFFF",
  success: "#22C55E", warning: "#F59E0B", danger: "#EF4444",
  text: "#1E2235", muted: "#6B7280", border: "#E5E7EB",
  dk: { bg: "#0F1117", card: "#1A1D27", border: "#2D3148", text: "#E2E8F0", muted: "#94A3B8" }
};

const STATUS = {
  "Applied":            { color: "#5B6EF5", bg: "#EEF0FF", icon: "📨" },
  "OA Scheduled":       { color: "#F59E0B", bg: "#FFF8E7", icon: "📝" },
  "OA Completed":       { color: "#8B5CF6", bg: "#F3EEFF", icon: "✅" },
  "Interview Scheduled":{ color: "#3B82F6", bg: "#EFF6FF", icon: "🗓️" },
  "Interview Round 1":  { color: "#6366F1", bg: "#EEF2FF", icon: "1️⃣" },
  "Interview Round 2":  { color: "#7C3AED", bg: "#F5F3FF", icon: "2️⃣" },
  "HR Round":           { color: "#EC4899", bg: "#FDF2F8", icon: "🤝" },
  "Offer Received":     { color: "#10B981", bg: "#ECFDF5", icon: "🎉" },
  "Selected":           { color: "#22C55E", bg: "#F0FDF4", icon: "🏆" },
  "Rejected":           { color: "#EF4444", bg: "#FEF2F2", icon: "❌" },
  "Withdrawn":          { color: "#6B7280", bg: "#F9FAFB", icon: "🚫" },
};

const KANBAN_COLS = ["Applied","OA Scheduled","OA Completed","Interview Scheduled",
  "Interview Round 1","Interview Round 2","HR Round","Offer Received","Selected","Rejected"];

const TAGS = ["Dream Company","Product Based","Service Based","Startup","MNC","Unicorn","FAANG","Remote Friendly"];

const PIE_COLS = ["#5B6EF5","#B8A4FF","#22C55E","#F59E0B","#EF4444","#8B5CF6","#EC4899","#3B82F6","#10B981","#6366F1","#7C3AED"];

const STAGES = ["Applied","OA Scheduled","OA Completed","Interview Round 1","Interview Round 2","HR Round","Offer Received","Selected"];

const SAMPLE = [
  { id:"s1", company:"Google", role:"SWE Intern", type:"Internship", location:"Bangalore", mode:"Hybrid", stipend:"₹2,00,000/mo", ctc:"", duration:"3 months", status:"Interview Round 2", oaDate:"2025-07-10", interviewDate:"2025-07-20", offerDeadline:"", appliedDate:"2025-06-28", source:"LinkedIn", notes:"Completed hard round. Hiring committee next.", jobLink:"https://careers.google.com", priority:"High", tags:["Dream Company","FAANG"], favorite:true },
  { id:"s2", company:"Microsoft", role:"SDE Intern", type:"Internship", location:"Hyderabad", mode:"Onsite", stipend:"₹1,60,000/mo", ctc:"", duration:"2 months", status:"OA Completed", oaDate:"2025-07-05", interviewDate:"2025-07-18", offerDeadline:"", appliedDate:"2025-06-25", source:"Careers Page", notes:"OA had 2 DSA + 1 behavioural section.", jobLink:"https://careers.microsoft.com", priority:"High", tags:["FAANG","MNC"], favorite:false },
  { id:"s3", company:"Amazon", role:"SDE Intern", type:"Internship", location:"Chennai", mode:"Hybrid", stipend:"₹1,20,000/mo", ctc:"", duration:"2 months", status:"HR Round", oaDate:"2025-06-20", interviewDate:"2025-07-12", offerDeadline:"2025-07-30", appliedDate:"2025-06-15", source:"Referral", notes:"LP heavy — know all 16 LPs.", jobLink:"https://amazon.jobs", priority:"High", tags:["FAANG","Product Based"], favorite:true },
  { id:"s4", company:"TCS", role:"Systems Engineer", type:"Full Time", location:"Mumbai", mode:"Onsite", stipend:"", ctc:"₹7 LPA", duration:"", status:"Selected", oaDate:"2025-05-15", interviewDate:"2025-05-28", offerDeadline:"2025-08-01", appliedDate:"2025-05-01", source:"College", notes:"Campus placement. Offer letter received.", jobLink:"", priority:"Medium", tags:["MNC","Service Based"], favorite:false },
  { id:"s5", company:"Infosys", role:"Associate Engineer", type:"Full Time", location:"Pune", mode:"Hybrid", stipend:"", ctc:"₹6.5 LPA", duration:"", status:"Rejected", oaDate:"2025-05-20", interviewDate:"2025-06-01", offerDeadline:"", appliedDate:"2025-05-10", source:"College", notes:"Tech round cleared, HR round rejected.", jobLink:"", priority:"Low", tags:["MNC","Service Based"], favorite:false },
];

// ── UTILS ────────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2,9);
const todayStr = () => new Date().toISOString().split("T")[0];
const fmt = d => d ? new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—";
const daysFrom = d => d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null;

const LS = {
  get: (k,fb) => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):fb; } catch { return fb; } },
  set: (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} }
};

// ── ATOMS ────────────────────────────────────────────────────────────────────
function StatusChip({ status }) {
  const s = STATUS[status] || { color: C.muted, bg: "#F3F4F6", icon: "•" };
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.color}33`,
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 4
    }}>
      {s.icon} {status}
    </span>
  );
}

function PriBadge({ p }) {
  const m = { High:["#EF4444","#FEF2F2"], Medium:["#F59E0B","#FFF8E7"], Low:["#22C55E","#F0FDF4"] };
  const [col, bg] = m[p] || [C.muted, "#F3F4F6"];
  return <span style={{background:bg,color:col,padding:"2px 8px",borderRadius:12,fontSize:11,fontWeight:700}}>{p}</span>;
}

function ProgressBar({ status }) {
  const idx = STAGES.indexOf(status);
  const pct = idx === -1 ? (["Rejected","Withdrawn"].includes(status) ? 100 : 5) : Math.round(((idx+1)/STAGES.length)*100);
  return (
    <div style={{width:"100%",height:5,background:"#E5E7EB",borderRadius:99,overflow:"hidden",marginTop:4}}>
      <div style={{height:"100%",width:`${pct}%`,background:status==="Rejected"?C.danger:C.primary,borderRadius:99,transition:"width 0.5s"}} />
    </div>
  );
}

function Card({ dark, title, children, style }) {
  return (
    <div style={{
      background: dark ? C.dk.card : C.card,
      border: `1px solid ${dark ? C.dk.border : C.border}`,
      borderRadius: 16, padding: 20,
      boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
      ...(style || {})
    }}>
      {title && <div style={{fontWeight:700,fontSize:15,marginBottom:14,color:dark?C.dk.text:C.text}}>{title}</div>}
      {children}
    </div>
  );
}

function Modal({ open, onClose, title, children, dark, width }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: dark ? C.dk.card : "#fff",
          color: dark ? C.dk.text : C.text,
          borderRadius: 20, padding: 28,
          width: "100%", maxWidth: width || 600,
          maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
        }}
      >
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <h2 style={{margin:0,fontSize:18,fontWeight:700}}>{title}</h2>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:24,cursor:"pointer",color:dark?C.dk.muted:C.muted,lineHeight:1,padding:0}}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Inp({ label, type="text", value, onChange, placeholder, style, dark, required, as, rows=3, opts=[] }) {
  const bd = dark ? C.dk.border : C.border;
  const bg = dark ? C.dk.bg : "#F9FAFB";
  const col = dark ? C.dk.text : C.text;
  const base = { width:"100%", padding:"9px 12px", borderRadius:10, border:`1.5px solid ${bd}`, background:bg, color:col, fontSize:14, outline:"none", fontFamily:"inherit", boxSizing:"border-box" };
  return (
    <div style={{marginBottom:14, ...(style||{})}}>
      {label && <label style={{fontSize:12,fontWeight:600,color:dark?C.dk.muted:C.muted,display:"block",marginBottom:5}}>{label}{required&&<span style={{color:C.danger}}> *</span>}</label>}
      {as==="textarea"
        ? <textarea rows={rows} value={value} onChange={onChange} placeholder={placeholder} style={{...base,resize:"vertical"}} />
        : as==="select"
        ? <select value={value} onChange={onChange} style={{...base,cursor:"pointer"}}>{opts.map(o=><option key={o}>{o}</option>)}</select>
        : <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={base} required={required} />
      }
    </div>
  );
}

// ── FORM ─────────────────────────────────────────────────────────────────────
const BLANK = {
  company:"", role:"", type:"Internship", location:"", mode:"Remote",
  stipend:"", ctc:"", duration:"", status:"Applied", source:"LinkedIn",
  appliedDate: todayStr(), oaDate:"", interviewDate:"", offerDeadline:"",
  notes:"", jobLink:"", priority:"Medium", tags:[], favorite:false
};

function AppForm({ init, onSave, onClose, dark }) {
  const [f, setF] = useState(init ? {...init} : {...BLANK});
  const s = (k,v) => setF(p => ({...p,[k]:v}));
  const toggleTag = t => setF(p => ({...p, tags: p.tags.includes(t) ? p.tags.filter(x=>x!==t) : [...p.tags,t]}));
  const bd = dark ? C.dk.border : C.border;
  const col = dark ? C.dk.text : C.text;

  const submit = () => {
    if (!f.company.trim() || !f.role.trim()) { alert("Company and Role are required."); return; }
    onSave(f);
  };

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
      <Inp label="Company Name" value={f.company} onChange={e=>s("company",e.target.value)} dark={dark} required style={{gridColumn:"1"}} />
      <Inp label="Role" value={f.role} onChange={e=>s("role",e.target.value)} dark={dark} required style={{gridColumn:"2"}} />
      <Inp label="Type" as="select" value={f.type} onChange={e=>s("type",e.target.value)} dark={dark} opts={["Internship","Full Time"]} />
      <Inp label="Location" value={f.location} onChange={e=>s("location",e.target.value)} dark={dark} placeholder="City" />
      <Inp label="Work Mode" as="select" value={f.mode} onChange={e=>s("mode",e.target.value)} dark={dark} opts={["Remote","Hybrid","Onsite"]} />
      <Inp label="Status" as="select" value={f.status} onChange={e=>s("status",e.target.value)} dark={dark} opts={Object.keys(STATUS)} />
      <Inp label="Stipend" value={f.stipend} onChange={e=>s("stipend",e.target.value)} placeholder="₹50,000/mo" dark={dark} />
      <Inp label="CTC" value={f.ctc} onChange={e=>s("ctc",e.target.value)} placeholder="₹12 LPA" dark={dark} />
      <Inp label="Duration" value={f.duration} onChange={e=>s("duration",e.target.value)} placeholder="3 months" dark={dark} />
      <Inp label="Source" as="select" value={f.source} onChange={e=>s("source",e.target.value)} dark={dark} opts={["LinkedIn","Simplify","Careers Page","Referral","College","Other"]} />
      <Inp label="Applied Date" type="date" value={f.appliedDate} onChange={e=>s("appliedDate",e.target.value)} dark={dark} />
      <Inp label="Priority" as="select" value={f.priority} onChange={e=>s("priority",e.target.value)} dark={dark} opts={["High","Medium","Low"]} />
      <Inp label="OA Date" type="date" value={f.oaDate} onChange={e=>s("oaDate",e.target.value)} dark={dark} />
      <Inp label="Interview Date" type="date" value={f.interviewDate} onChange={e=>s("interviewDate",e.target.value)} dark={dark} />
      <Inp label="Offer Deadline" type="date" value={f.offerDeadline} onChange={e=>s("offerDeadline",e.target.value)} dark={dark} />
      <Inp label="Job Link" value={f.jobLink} onChange={e=>s("jobLink",e.target.value)} placeholder="https://..." dark={dark} />

      <div style={{gridColumn:"1/-1",marginBottom:14}}>
        <label style={{fontSize:12,fontWeight:600,color:dark?C.dk.muted:C.muted,display:"block",marginBottom:6}}>Tags</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {TAGS.map(t => (
            <button key={t} onClick={()=>toggleTag(t)} type="button" style={{
              padding:"4px 12px", borderRadius:20, fontSize:12, cursor:"pointer",
              border:`1.5px solid ${f.tags.includes(t)?C.primary:bd}`,
              background: f.tags.includes(t) ? C.primary+"22" : "transparent",
              color: f.tags.includes(t) ? C.primary : (dark?C.dk.muted:C.muted),
              fontWeight:600
            }}>{t}</button>
          ))}
        </div>
      </div>

      <Inp label="Notes" as="textarea" rows={3} value={f.notes} onChange={e=>s("notes",e.target.value)} placeholder="Interview questions, tips..." dark={dark} style={{gridColumn:"1/-1"}} />

      <div style={{gridColumn:"1/-1",display:"flex",gap:10,justifyContent:"flex-end",marginTop:4}}>
        <button onClick={onClose} type="button" style={{padding:"9px 20px",borderRadius:10,border:`1.5px solid ${bd}`,background:"transparent",color:col,cursor:"pointer",fontWeight:600}}>Cancel</button>
        <button onClick={submit} type="button" style={{padding:"9px 24px",borderRadius:10,border:"none",background:C.primary,color:"#fff",cursor:"pointer",fontWeight:700,fontSize:14}}>Save Application</button>
      </div>
    </div>
  );
}

// ── CALENDAR ─────────────────────────────────────────────────────────────────
function CalendarView({ apps, dark }) {
  const [cur, setCur] = useState(new Date());
  const y = cur.getFullYear(), m = cur.getMonth();
  const firstDow = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m+1, 0).getDate();
  const td = todayStr();
  const bd = dark ? C.dk.border : C.border;

  const events = {};
  apps.forEach(a => {
    [["oaDate","OA","#F59E0B"],["interviewDate","Int","#5B6EF5"],["offerDeadline","Deal","#22C55E"]].forEach(([k,lbl,col]) => {
      if (a[k]) { if(!events[a[k]]) events[a[k]]=[]; events[a[k]].push({label:`${a.company} ${lbl}`,color:col}); }
    });
  });

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <h3 style={{margin:0,fontSize:16,fontWeight:700,color:dark?C.dk.text:C.text}}>{cur.toLocaleString("default",{month:"long",year:"numeric"})}</h3>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setCur(new Date(y,m-1,1))} style={{background:dark?C.dk.border:C.bg,border:"none",borderRadius:8,padding:"6px 14px",cursor:"pointer",color:dark?C.dk.text:C.text,fontWeight:700,fontSize:16}}>‹</button>
          <button onClick={()=>setCur(new Date())} style={{background:C.primary,border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",color:"#fff",fontWeight:700,fontSize:12}}>Today</button>
          <button onClick={()=>setCur(new Date(y,m+1,1))} style={{background:dark?C.dk.border:C.bg,border:"none",borderRadius:8,padding:"6px 14px",cursor:"pointer",color:dark?C.dk.text:C.text,fontWeight:700,fontSize:16}}>›</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
          <div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:dark?C.dk.muted:C.muted,padding:"6px 0"}}>{d}</div>
        ))}
        {Array.from({length:firstDow}).map((_,i) => <div key={"e"+i} />)}
        {Array.from({length:daysInMonth}).map((_,i) => {
          const day = i+1;
          const ds = `${y}-${String(m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const isToday = ds === td;
          const evs = events[ds] || [];
          return (
            <div key={day} style={{
              minHeight:70, padding:5, borderRadius:10,
              background: isToday ? C.primary+"22" : (dark?C.dk.bg:"#F9FAFB"),
              border: `${isToday?"2px":"1px"} solid ${isToday?C.primary:bd}`
            }}>
              <div style={{fontSize:12,fontWeight:isToday?800:500,color:isToday?C.primary:(dark?C.dk.text:C.text)}}>{day}</div>
              {evs.map((ev,ei) => (
                <div key={ei} style={{fontSize:10,background:ev.color+"22",color:ev.color,borderRadius:4,padding:"1px 4px",marginTop:2,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.label}</div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── KANBAN ───────────────────────────────────────────────────────────────────
function KanbanBoard({ apps, onStatusChange, dark }) {
  const [dragging, setDragging] = useState(null);
  const [over, setOver] = useState(null);
  const grouped = {};
  KANBAN_COLS.forEach(c => { grouped[c] = apps.filter(a => a.status === c); });

  return (
    <div style={{overflowX:"auto",paddingBottom:8}}>
      <div style={{display:"flex",gap:12,minWidth: KANBAN_COLS.length * 210 + "px"}}>
        {KANBAN_COLS.map(col => {
          const cfg = STATUS[col] || {color:C.muted,bg:"#F3F4F6",icon:"•"};
          const isOver = over === col;
          return (
            <div
              key={col}
              style={{flex:"0 0 195px"}}
              onDragOver={e => { e.preventDefault(); setOver(col); }}
              onDrop={e => { e.preventDefault(); if(dragging && dragging.status!==col) onStatusChange(dragging.id,col); setDragging(null); setOver(null); }}
            >
              <div style={{padding:"8px 12px",borderRadius:"10px 10px 0 0",background:cfg.bg,border:`1px solid ${cfg.color}33`}}>
                <span style={{fontSize:12,fontWeight:700,color:cfg.color}}>{cfg.icon} {col}</span>
                <span style={{float:"right",fontSize:11,background:cfg.color+"22",color:cfg.color,borderRadius:99,padding:"1px 7px",fontWeight:700}}>{grouped[col].length}</span>
              </div>
              <div style={{
                padding:8, borderRadius:"0 0 10px 10px", minHeight:200,
                background: isOver ? cfg.color+"11" : (dark?C.dk.bg:"#F9FAFB"),
                border:`1px solid ${dark?C.dk.border:C.border}`, borderTop:"none",
                transition:"background 0.2s"
              }}>
                {grouped[col].map(a => (
                  <div
                    key={a.id}
                    draggable
                    onDragStart={() => setDragging(a)}
                    onDragEnd={() => { setDragging(null); setOver(null); }}
                    style={{
                      background: dark?C.dk.card:"#fff",
                      border:`1px solid ${dark?C.dk.border:C.border}`,
                      borderRadius:10, padding:10, marginBottom:8,
                      cursor:"grab", opacity: dragging?.id===a.id ? 0.4 : 1,
                      boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
                      userSelect:"none", transition:"transform 0.1s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform="scale(1.02)"}
                    onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}
                  >
                    <div style={{fontWeight:700,fontSize:13,color:dark?C.dk.text:C.text,marginBottom:2}}>{a.company}</div>
                    <div style={{fontSize:11,color:dark?C.dk.muted:C.muted,marginBottom:6}}>{a.role}</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <PriBadge p={a.priority} />
                      {a.favorite && <span>⭐</span>}
                    </div>
                    {a.interviewDate && <div style={{fontSize:10,color:C.primary,marginTop:4,fontWeight:600}}>🗓 {fmt(a.interviewDate)}</div>}
                  </div>
                ))}
                {grouped[col].length===0 && <div style={{textAlign:"center",padding:"20px 0",fontSize:12,color:dark?C.dk.muted:C.muted}}>Drop here</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── STATISTICS ───────────────────────────────────────────────────────────────
function Statistics({ apps, dark }) {
  const tc = dark ? C.dk.text : C.text;
  const bdColor = dark ? C.dk.border : C.border;

  const statusDist = Object.keys(STATUS).map(s => ({ name:s, value:apps.filter(a=>a.status===s).length })).filter(x=>x.value>0);
  const typeDist = [
    { name:"Internship", value:apps.filter(a=>a.type==="Internship").length },
    { name:"Full Time",  value:apps.filter(a=>a.type==="Full Time").length },
  ];

  const monthly = {};
  apps.forEach(a => { if(a.appliedDate){ const k=a.appliedDate.slice(0,7); monthly[k]=(monthly[k]||0)+1; }});
  const monthData = Object.entries(monthly).sort().map(([k,v])=>({month:k.slice(5)+"/"+k.slice(2,4),count:v}));

  const total = apps.length;
  const won = apps.filter(a=>["Selected","Offer Received"].includes(a.status)).length;
  const rate = total ? Math.round((won/total)*100) : 0;

  const tt = { contentStyle:{background:dark?C.dk.card:"#fff",border:`1px solid ${bdColor}`,borderRadius:8,color:tc} };

  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:20}}>
      <Card dark={dark} title="Applications Per Month">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthData}>
            <CartesianGrid strokeDasharray="3 3" stroke={bdColor} />
            <XAxis dataKey="month" tick={{fill:tc,fontSize:11}} />
            <YAxis tick={{fill:tc,fontSize:11}} />
            <Tooltip {...tt} />
            <Bar dataKey="count" fill={C.primary} radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card dark={dark} title="Status Distribution">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={statusDist} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,percent})=>`${name.split(" ")[0]} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
              {statusDist.map((_,i) => <Cell key={i} fill={PIE_COLS[i%PIE_COLS.length]} />)}
            </Pie>
            <Tooltip {...tt} />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card dark={dark} title="Internship vs Full Time">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={typeDist} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({name,value})=>`${name}: ${value}`}>
              <Cell fill={C.primary} />
              <Cell fill={C.secondary} />
            </Pie>
            <Tooltip {...tt} />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card dark={dark} title="Success Rate">
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:220,gap:12}}>
          <div style={{fontSize:68,fontWeight:900,color:C.primary,lineHeight:1}}>{rate}<span style={{fontSize:32}}>%</span></div>
          <div style={{fontSize:13,color:dark?C.dk.muted:C.muted}}>{won} offer{won!==1?"s":""} out of {total} application{total!==1?"s":""}</div>
          <div style={{width:"75%",height:8,background:dark?C.dk.border:C.border,borderRadius:99,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${rate}%`,background:`linear-gradient(90deg,${C.primary},${C.secondary})`,borderRadius:99,transition:"width 1s"}} />
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── DEADLINES WIDGET ─────────────────────────────────────────────────────────
function Deadlines({ apps, dark }) {
  const items = [];
  apps.forEach(a => {
    [["interviewDate","Interview",C.primary],["oaDate","OA",C.warning],["offerDeadline","Offer Deadline",C.success]].forEach(([k,lbl,col]) => {
      const d = daysFrom(a[k]);
      if (d !== null && d >= 0 && d <= 7) items.push({company:a.company,label:lbl,date:a[k],days:d,color:col});
    });
  });
  items.sort((a,b) => a.days - b.days);

  if (items.length === 0) {
    return <div style={{textAlign:"center",padding:"24px 0",fontSize:13,color:dark?C.dk.muted:C.muted}}>🎉 No deadlines this week</div>;
  }
  return (
    <div>
      {items.map((it,i) => (
        <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${dark?C.dk.border:C.border}`}}>
          <div style={{width:40,height:40,borderRadius:10,background:it.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
            {it.days===0?"🔴":it.days<=2?"🟠":"🟡"}
          </div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:13,color:dark?C.dk.text:C.text}}>{it.company}</div>
            <div style={{fontSize:11,color:dark?C.dk.muted:C.muted}}>{it.label} · {fmt(it.date)}</div>
          </div>
          <div style={{background:it.color+"22",color:it.color,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700}}>
            {it.days===0?"Today":it.days===1?"Tomorrow":`${it.days}d`}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── NOTES ────────────────────────────────────────────────────────────────────
function Notes({ apps, dark }) {
  const [all, setAll] = useState(() => LS.get("ct_notes",{}));
  const [sel, setSel] = useState(apps[0]?.id || null);
  const upd = (id,val) => { const n={...all,[id]:val}; setAll(n); LS.set("ct_notes",n); };
  const selApp = apps.find(a => a.id === sel);
  const bd = dark ? C.dk.border : C.border;

  return (
    <div style={{display:"flex",gap:16,height:420}}>
      <div style={{width:190,overflowY:"auto",borderRight:`1px solid ${bd}`,paddingRight:12,flexShrink:0}}>
        {apps.map(a => (
          <div key={a.id} onClick={() => setSel(a.id)} style={{
            padding:"8px 10px", borderRadius:8, cursor:"pointer", marginBottom:4,
            background: sel===a.id ? C.primary+"22" : "transparent",
            borderLeft: `3px solid ${sel===a.id?C.primary:"transparent"}`
          }}>
            <div style={{fontWeight:700,fontSize:12,color:dark?C.dk.text:C.text}}>{a.company}</div>
            <div style={{fontSize:11,color:dark?C.dk.muted:C.muted}}>{a.role}</div>
          </div>
        ))}
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column"}}>
        {selApp ? (
          <>
            <div style={{marginBottom:8}}>
              <span style={{fontWeight:700,fontSize:14,color:dark?C.dk.text:C.text}}>{selApp.company}</span>
              <span style={{fontSize:12,color:dark?C.dk.muted:C.muted,marginLeft:8}}>{selApp.role}</span>
            </div>
            <textarea
              value={all[sel] || selApp.notes || ""}
              onChange={e => upd(sel,e.target.value)}
              placeholder="Interview questions, OA experience, topics asked, personal notes..."
              style={{flex:1,resize:"none",padding:12,borderRadius:10,border:`1.5px solid ${bd}`,background:dark?C.dk.bg:"#F9FAFB",color:dark?C.dk.text:C.text,fontFamily:"inherit",fontSize:13,outline:"none"}}
            />
          </>
        ) : <div style={{color:dark?C.dk.muted:C.muted,fontSize:13}}>Select a company to view notes</div>}
      </div>
    </div>
  );
}

// ── STICKY NOTES ─────────────────────────────────────────────────────────────
function Sticky({ dark }) {
  const COLS = ["#FFF8C5","#FFDDD2","#D5F5E3","#D6EAF8","#F9EBEA","#E8DAEF"];
  const [items, setItems] = useState(() => LS.get("ct_sticky",[]));
  const add = () => { const n=[...items,{id:uid(),text:"",color:COLS[items.length%COLS.length]}]; setItems(n); LS.set("ct_sticky",n); };
  const upd = (id,text) => { const n=items.map(s=>s.id===id?{...s,text}:s); setItems(n); LS.set("ct_sticky",n); };
  const del = (id) => { const n=items.filter(s=>s.id!==id); setItems(n); LS.set("ct_sticky",n); };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <span style={{fontWeight:700,fontSize:15,color:dark?C.dk.text:C.text}}>🗒️ Sticky Notes</span>
        <button onClick={add} style={{background:C.primary,color:"#fff",border:"none",borderRadius:8,padding:"6px 16px",cursor:"pointer",fontWeight:700,fontSize:13}}>+ Add</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))",gap:12}}>
        {items.map(s => (
          <div key={s.id} style={{background:s.color,borderRadius:12,padding:12,boxShadow:"2px 4px 12px rgba(0,0,0,0.1)",position:"relative",minHeight:120}}>
            <button onClick={()=>del(s.id)} style={{position:"absolute",top:6,right:8,background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#888",lineHeight:1,padding:0}}>×</button>
            <textarea value={s.text} onChange={e=>upd(s.id,e.target.value)} placeholder="Write a note..." style={{width:"100%",height:90,resize:"none",background:"transparent",border:"none",outline:"none",fontFamily:"inherit",fontSize:13,color:"#333",boxSizing:"border-box"}} />
          </div>
        ))}
        {items.length===0 && <div style={{fontSize:13,color:dark?C.dk.muted:C.muted}}>No sticky notes yet.</div>}
      </div>
    </div>
  );
}

// ── EMPTY STATE ──────────────────────────────────────────────────────────────
function Empty({ onAdd, dark }) {
  return (
    <div style={{textAlign:"center",padding:"56px 20px"}}>
      <div style={{fontSize:72,marginBottom:16}}>🎯</div>
      <h3 style={{margin:"0 0 8px",fontSize:20,fontWeight:700,color:dark?C.dk.text:C.text}}>No Applications Yet</h3>
      <p style={{color:dark?C.dk.muted:C.muted,marginBottom:20,fontSize:14}}>Track your internships, placements and interviews all in one place.</p>
      <button onClick={onAdd} style={{background:C.primary,color:"#fff",border:"none",borderRadius:12,padding:"12px 28px",cursor:"pointer",fontWeight:700,fontSize:15}}>+ Add First Application</button>
    </div>
  );
}

// ── NAV ──────────────────────────────────────────────────────────────────────
const NAV = [
  {id:"dashboard",icon:"🏠",label:"Dashboard"},
  {id:"tracker",icon:"📋",label:"Tracker"},
  {id:"kanban",icon:"🗂️",label:"Kanban"},
  {id:"calendar",icon:"📅",label:"Calendar"},
  {id:"statistics",icon:"📊",label:"Statistics"},
  {id:"notes",icon:"📝",label:"Notes"},
  {id:"sticky",icon:"🗒️",label:"Sticky Notes"},
];

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [apps,    setApps]    = useState(() => LS.get("ct_apps", SAMPLE));
  const [dark,    setDark]    = useState(() => LS.get("ct_dark", false));
  const [page,    setPage]    = useState("dashboard");
  const [search,  setSearch]  = useState("");
  const [fStatus, setFStatus] = useState("All");
  const [fType,   setFType]   = useState("All");
  const [fMode,   setFMode]   = useState("All");
  const [fPri,    setFPri]    = useState("All");
  const [sort,    setSort]    = useState("Newest First");
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [sidebar, setSidebar] = useState(true);

  useEffect(() => LS.set("ct_apps", apps), [apps]);
  useEffect(() => LS.set("ct_dark", dark), [dark]);

  const save = f => { setApps(p => [...p,{...f,id:uid()}]); setModal(false); };
  const edit = f => { setApps(p => p.map(a => a.id===editing.id ? {...f,id:a.id} : a)); setEditing(null); setModal(false); };
  const del  = id => { if(window.confirm("Delete this application?")) setApps(p => p.filter(a => a.id!==id)); };
  const fav  = id => setApps(p => p.map(a => a.id===id ? {...a,favorite:!a.favorite} : a));
  const chSt = (id,status) => setApps(p => p.map(a => a.id===id ? {...a,status} : a));

  const filtered = useMemo(() => {
    let r = apps.filter(a => {
      if (search && !a.company.toLowerCase().includes(search.toLowerCase()) && !a.role.toLowerCase().includes(search.toLowerCase())) return false;
      if (fStatus!=="All" && a.status!==fStatus) return false;
      if (fType!=="All" && a.type!==fType) return false;
      if (fMode!=="All" && a.mode!==fMode) return false;
      if (fPri!=="All" && a.priority!==fPri) return false;
      return true;
    });
    if (sort==="Newest First") r = [...r].sort((a,b) => (b.appliedDate||"").localeCompare(a.appliedDate||""));
    else if (sort==="Oldest First") r = [...r].sort((a,b) => (a.appliedDate||"").localeCompare(b.appliedDate||""));
    else if (sort==="Company Name") r = [...r].sort((a,b) => a.company.localeCompare(b.company));
    else if (sort==="Upcoming Interviews") r = [...r].sort((a,b) => {
      const da = a.interviewDate ? new Date(a.interviewDate) : new Date("9999-12-31");
      const db = b.interviewDate ? new Date(b.interviewDate) : new Date("9999-12-31");
      return da - db;
    });
    return r;
  }, [apps, search, fStatus, fType, fMode, fPri, sort]);

  const stats = useMemo(() => ({
    total:    apps.length,
    applied:  apps.filter(a=>a.status==="Applied").length,
    oa:       apps.filter(a=>a.status==="OA Scheduled").length,
    interview:apps.filter(a=>["Interview Scheduled","Interview Round 1","Interview Round 2"].includes(a.status)).length,
    hr:       apps.filter(a=>a.status==="HR Round").length,
    selected: apps.filter(a=>["Selected","Offer Received"].includes(a.status)).length,
    rejected: apps.filter(a=>a.status==="Rejected").length,
  }), [apps]);

  const upcomingAlerts = apps.filter(a => {
    const d = daysFrom(a.interviewDate) ?? daysFrom(a.oaDate);
    return d !== null && d >= 0 && d <= 3;
  }).length;

  const exportCSV = () => {
    const cols = ["company","role","type","location","mode","stipend","ctc","status","priority","appliedDate","oaDate","interviewDate","offerDeadline","source","jobLink"];
    const rows = [cols.join(","), ...apps.map(a => cols.map(c => `"${(a[c]||"").replace(/"/g,'""')}"`).join(","))];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([rows.join("\n")],{type:"text/csv"}));
    a.download = "CareerTrackPro.csv";
    a.click();
  };

  // theme tokens
  const bg  = dark ? C.dk.bg  : C.bg;
  const cd  = dark ? C.dk.card: C.card;
  const bd  = dark ? C.dk.border : C.border;
  const tc  = dark ? C.dk.text : C.text;
  const mc  = dark ? C.dk.muted : C.muted;

  // stat cards config
  const statCards = [
    {icon:"📁",label:"Total",value:stats.total,color:C.primary,bg:C.primary+"22"},
    {icon:"📨",label:"Applied",value:stats.applied,color:"#3B82F6",bg:"#EFF6FF"},
    {icon:"📝",label:"OA Scheduled",value:stats.oa,color:C.warning,bg:"#FFF8E7"},
    {icon:"🗓️",label:"Interviews",value:stats.interview,color:"#8B5CF6",bg:"#F3EEFF"},
    {icon:"🤝",label:"HR Round",value:stats.hr,color:"#EC4899",bg:"#FDF2F8"},
    {icon:"🏆",label:"Selected",value:stats.selected,color:C.success,bg:"#F0FDF4"},
    {icon:"❌",label:"Rejected",value:stats.rejected,color:C.danger,bg:"#FEF2F2"},
  ];

  return (
    <div style={{display:"flex",height:"100vh",background:bg,fontFamily:"'Inter',system-ui,sans-serif",color:tc,overflow:"hidden"}}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sidebar ? 218 : 58, flexShrink:0,
        background: dark ? "#13162290" : "rgba(255,255,255,0.7)",
        backdropFilter:"blur(12px)",
        borderRight:`1px solid ${bd}`,
        display:"flex", flexDirection:"column",
        transition:"width 0.25s", overflow:"hidden", zIndex:100
      }}>
        {/* logo */}
        <div style={{padding:"18px 12px 12px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${bd}`,flexShrink:0}}>
          <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${C.primary},${C.secondary})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🎯</div>
          {sidebar && (
            <div>
              <div style={{fontWeight:800,fontSize:13,color:tc,letterSpacing:-0.3}}>CareerTrack</div>
              <div style={{fontSize:10,color:mc,fontWeight:600,letterSpacing:1,textTransform:"uppercase"}}>Pro</div>
            </div>
          )}
          <button onClick={()=>setSidebar(p=>!p)} style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:mc,fontSize:18,padding:2,flexShrink:0,lineHeight:1}}>☰</button>
        </div>

        {/* nav */}
        <nav style={{flex:1,padding:"10px 8px",overflowY:"auto"}}>
          {NAV.map(n => (
            <button key={n.id} onClick={()=>setPage(n.id)} style={{
              width:"100%", display:"flex", alignItems:"center", gap:10,
              padding:"9px 10px", borderRadius:10, border:"none", cursor:"pointer",
              background: page===n.id ? C.primary+"22" : "transparent",
              color: page===n.id ? C.primary : mc,
              fontWeight: page===n.id ? 700 : 500,
              fontSize:13, marginBottom:2, textAlign:"left",
              transition:"all 0.15s", whiteSpace:"nowrap", fontFamily:"inherit"
            }}>
              <span style={{fontSize:17,flexShrink:0}}>{n.icon}</span>
              {sidebar && <span>{n.label}</span>}
              {sidebar && n.id==="calendar" && upcomingAlerts>0 && (
                <span style={{marginLeft:"auto",background:C.warning,color:"#fff",borderRadius:99,padding:"1px 7px",fontSize:10,fontWeight:800}}>{upcomingAlerts}</span>
              )}
            </button>
          ))}
        </nav>

        {/* dark mode */}
        <div style={{padding:"10px 8px",borderTop:`1px solid ${bd}`,flexShrink:0}}>
          <button onClick={()=>setDark(p=>!p)} style={{
            width:"100%", display:"flex", alignItems:"center", gap:10,
            padding:"9px 10px", borderRadius:10, border:"none", cursor:"pointer",
            background:"transparent", color:mc, fontSize:13, fontWeight:500, textAlign:"left", fontFamily:"inherit"
          }}>
            <span style={{fontSize:17,flexShrink:0}}>{dark?"☀️":"🌙"}</span>
            {sidebar && <span>{dark?"Light Mode":"Dark Mode"}</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>

        {/* header */}
        <header style={{padding:"0 24px",height:60,display:"flex",alignItems:"center",borderBottom:`1px solid ${bd}`,background:cd,flexShrink:0,gap:12}}>
          <div style={{flex:1}}>
            <h1 style={{margin:0,fontSize:17,fontWeight:700,color:tc}}>
              {NAV.find(n=>n.id===page)?.icon} {NAV.find(n=>n.id===page)?.label}
            </h1>
          </div>
          {upcomingAlerts > 0 && (
            <div style={{background:C.warning+"22",color:C.warning,padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:700}}>
              🔔 {upcomingAlerts} upcoming deadline{upcomingAlerts!==1?"s":""}
            </div>
          )}
          <button onClick={exportCSV} style={{background:dark?C.dk.border:C.bg,border:`1px solid ${bd}`,borderRadius:9,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:600,color:mc,fontFamily:"inherit"}}>
            ⬇ Export CSV
          </button>
          <button onClick={()=>{setEditing(null);setModal(true)}} style={{background:C.primary,color:"#fff",border:"none",borderRadius:9,padding:"8px 18px",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit"}}>
            + Add Application
          </button>
        </header>

        {/* page */}
        <main style={{flex:1,overflowY:"auto",padding:24}}>

          {/* ── DASHBOARD ── */}
          {page==="dashboard" && (
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              {/* stat cards */}
              <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
                {statCards.map(s => (
                  <div key={s.label}
                    style={{background:cd,border:`1px solid ${bd}`,borderRadius:16,padding:"18px 22px",display:"flex",alignItems:"center",gap:14,flex:"1 1 130px",boxShadow:"0 1px 6px rgba(0,0,0,0.05)",cursor:"default",transition:"transform 0.15s,box-shadow 0.15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.10)"}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 1px 6px rgba(0,0,0,0.05)"}}
                  >
                    <div style={{width:46,height:46,borderRadius:13,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:21,flexShrink:0}}>{s.icon}</div>
                    <div>
                      <div style={{fontSize:26,fontWeight:800,color:s.color,lineHeight:1}}>{s.value}</div>
                      <div style={{fontSize:11,color:mc,marginTop:2,fontWeight:500}}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:20}}>
                <Card dark={dark} title="Recent Applications">
                  {apps.length===0
                    ? <Empty onAdd={()=>setModal(true)} dark={dark} />
                    : [...apps].slice(-6).reverse().map(a => (
                      <div key={a.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${bd}`}}>
                        <div style={{width:36,height:36,borderRadius:10,background:C.primary+"22",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:C.primary,flexShrink:0}}>{a.company[0]}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:700,fontSize:13,color:tc,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                            {a.company} <span style={{fontWeight:400,color:mc}}>· {a.role}</span>
                          </div>
                          <ProgressBar status={a.status} />
                        </div>
                        <StatusChip status={a.status} />
                      </div>
                    ))
                  }
                </Card>

                <Card dark={dark} title="⏰ This Week">
                  <Deadlines apps={apps} dark={dark} />
                </Card>
              </div>

              <Card dark={dark} title="Status Overview">
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {Object.entries(STATUS).map(([s,cfg]) => {
                    const cnt = apps.filter(a=>a.status===s).length;
                    return (
                      <div key={s} style={{background:cfg.bg,border:`1px solid ${cfg.color}33`,borderRadius:10,padding:"10px 14px",display:"flex",flexDirection:"column",alignItems:"center",minWidth:88,cursor:"pointer"}} onClick={()=>{setFStatus(s);setPage("tracker");}}>
                        <div style={{fontSize:20}}>{cfg.icon}</div>
                        <div style={{fontSize:22,fontWeight:800,color:cfg.color}}>{cnt}</div>
                        <div style={{fontSize:9,color:cfg.color,fontWeight:700,textAlign:"center",marginTop:1,maxWidth:80,lineHeight:1.3}}>{s}</div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* ── TRACKER ── */}
          {page==="tracker" && (
            <div>
              {/* filters */}
              <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:16,background:cd,padding:14,borderRadius:14,border:`1px solid ${bd}`}}>
                <input
                  value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="🔍 Search company or role..."
                  style={{flex:"1 1 200px",padding:"8px 12px",borderRadius:10,border:`1.5px solid ${bd}`,background:dark?C.dk.bg:C.bg,color:tc,fontSize:13,outline:"none",fontFamily:"inherit"}}
                />
                {[
                  ["Status",fStatus,setFStatus,["All",...Object.keys(STATUS)]],
                  ["Type",fType,setFType,["All","Internship","Full Time"]],
                  ["Mode",fMode,setFMode,["All","Remote","Hybrid","Onsite"]],
                  ["Priority",fPri,setFPri,["All","High","Medium","Low"]],
                  ["Sort",sort,setSort,["Newest First","Oldest First","Company Name","Upcoming Interviews"]],
                ].map(([lbl,val,setV,opts]) => (
                  <select key={lbl} value={val} onChange={e=>setV(e.target.value)}
                    style={{padding:"8px 10px",borderRadius:10,border:`1.5px solid ${bd}`,background:dark?C.dk.bg:C.bg,color:tc,fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>
                    {opts.map(o => <option key={o} value={o}>{lbl==="Sort"?o:`${lbl}: ${o}`}</option>)}
                  </select>
                ))}
                <span style={{fontSize:12,color:mc,display:"flex",alignItems:"center",fontWeight:600}}>{filtered.length} result{filtered.length!==1?"s":""}</span>
              </div>

              {/* table */}
              {filtered.length===0
                ? <Empty onAdd={()=>setModal(true)} dark={dark} />
                : (
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"separate",borderSpacing:"0 5px"}}>
                      <thead>
                        <tr style={{fontSize:11,color:mc,fontWeight:700}}>
                          {["★","Company","Role","Type","Mode","Stipend/CTC","Status","OA Date","Interview","Priority","Applied","Actions"].map(h => (
                            <th key={h} style={{padding:"4px 10px",textAlign:"left",whiteSpace:"nowrap"}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(a => (
                          <tr key={a.id}>
                            <td style={{padding:"10px 8px",background:cd,borderRadius:"10px 0 0 10px",border:`1px solid ${bd}`,borderRight:"none"}}>
                              <button onClick={()=>fav(a.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:15,padding:0,lineHeight:1}}>{a.favorite?"⭐":"☆"}</button>
                            </td>
                            <td style={{padding:"10px 10px",background:cd,border:`1px solid ${bd}`,borderLeft:"none",borderRight:"none",fontWeight:700,fontSize:13,color:tc,whiteSpace:"nowrap"}}>
                              <div style={{display:"flex",alignItems:"center",gap:8}}>
                                <div style={{width:28,height:28,borderRadius:8,background:C.primary+"22",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,color:C.primary,flexShrink:0}}>{a.company[0]}</div>
                                {a.company}
                              </div>
                            </td>
                            <td style={{padding:"10px 8px",background:cd,border:`1px solid ${bd}`,borderLeft:"none",borderRight:"none",fontSize:12,color:mc,maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.role}</td>
                            <td style={{padding:"10px 8px",background:cd,border:`1px solid ${bd}`,borderLeft:"none",borderRight:"none",fontSize:12}}>
                              <span style={{background:a.type==="Internship"?C.secondary+"44":"#D1FAE5",color:a.type==="Internship"?"#7C3AED":C.success,padding:"2px 8px",borderRadius:12,fontWeight:600,fontSize:11}}>{a.type}</span>
                            </td>
                            <td style={{padding:"10px 8px",background:cd,border:`1px solid ${bd}`,borderLeft:"none",borderRight:"none",fontSize:12,color:mc}}>{a.mode}</td>
                            <td style={{padding:"10px 8px",background:cd,border:`1px solid ${bd}`,borderLeft:"none",borderRight:"none",fontSize:12,color:tc,fontWeight:600,whiteSpace:"nowrap"}}>{a.stipend||a.ctc||"—"}</td>
                            <td style={{padding:"10px 8px",background:cd,border:`1px solid ${bd}`,borderLeft:"none",borderRight:"none",whiteSpace:"nowrap"}}><StatusChip status={a.status}/></td>
                            <td style={{padding:"10px 8px",background:cd,border:`1px solid ${bd}`,borderLeft:"none",borderRight:"none",fontSize:12,color:mc,whiteSpace:"nowrap"}}>{fmt(a.oaDate)}</td>
                            <td style={{padding:"10px 8px",background:cd,border:`1px solid ${bd}`,borderLeft:"none",borderRight:"none",fontSize:12,color:mc,whiteSpace:"nowrap"}}>{fmt(a.interviewDate)}</td>
                            <td style={{padding:"10px 8px",background:cd,border:`1px solid ${bd}`,borderLeft:"none",borderRight:"none",whiteSpace:"nowrap"}}><PriBadge p={a.priority}/></td>
                            <td style={{padding:"10px 8px",background:cd,border:`1px solid ${bd}`,borderLeft:"none",borderRight:"none",fontSize:12,color:mc,whiteSpace:"nowrap"}}>{fmt(a.appliedDate)}</td>
                            <td style={{padding:"10px 10px",background:cd,borderRadius:"0 10px 10px 0",border:`1px solid ${bd}`,borderLeft:"none",whiteSpace:"nowrap"}}>
                              <div style={{display:"flex",gap:5}}>
                                <button onClick={()=>setViewing(a)} style={{background:C.primary+"22",color:C.primary,border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:11,fontWeight:700}}>View</button>
                                <button onClick={()=>{setEditing(a);setModal(true)}} style={{background:C.warning+"22",color:C.warning,border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:11,fontWeight:700}}>Edit</button>
                                <button onClick={()=>del(a.id)} style={{background:C.danger+"22",color:C.danger,border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:11,fontWeight:700}}>Del</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              }
            </div>
          )}

          {page==="kanban"    && <Card dark={dark} title="Kanban Board — Drag & Drop to change status"><KanbanBoard apps={apps} onStatusChange={chSt} dark={dark}/></Card>}
          {page==="calendar"  && <Card dark={dark} title="Interview & Deadline Calendar"><CalendarView apps={apps} dark={dark}/></Card>}
          {page==="statistics"&& <Statistics apps={apps} dark={dark} />}
          {page==="notes"     && <Card dark={dark} title="Notes Manager"><Notes apps={apps} dark={dark}/></Card>}
          {page==="sticky"    && <Card dark={dark}><Sticky dark={dark}/></Card>}

        </main>
      </div>

      {/* ── ADD / EDIT MODAL ── */}
      <Modal open={modal} onClose={()=>{setModal(false);setEditing(null);}} title={editing?"Edit Application":"Add New Application"} dark={dark} width={700}>
        <AppForm init={editing} onSave={editing ? edit : save} onClose={()=>{setModal(false);setEditing(null);}} dark={dark} />
      </Modal>

      {/* ── VIEW MODAL ── */}
      <Modal open={!!viewing} onClose={()=>setViewing(null)} title={viewing?.company||""} dark={dark} width={520}>
        {viewing && (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
              <div style={{width:48,height:48,borderRadius:14,background:C.primary+"22",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:22,color:C.primary}}>{viewing.company[0]}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:18,color:dark?C.dk.text:C.text}}>{viewing.company}</div>
                <div style={{fontSize:13,color:dark?C.dk.muted:C.muted}}>{viewing.role} · {viewing.type}</div>
              </div>
              <StatusChip status={viewing.status}/>
            </div>

            <ProgressBar status={viewing.status}/>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:16}}>
              {[
                ["📍 Location",viewing.location],["💼 Mode",viewing.mode],
                ["💰 Stipend",viewing.stipend||"—"],["📈 CTC",viewing.ctc||"—"],
                ["⏱ Duration",viewing.duration||"—"],["🔗 Source",viewing.source],
                ["📅 Applied",fmt(viewing.appliedDate)],["📝 OA Date",fmt(viewing.oaDate)],
                ["🗓 Interview",fmt(viewing.interviewDate)],["⏰ Offer Deadline",fmt(viewing.offerDeadline)],
              ].map(([k,v]) => (
                <div key={k} style={{background:dark?C.dk.bg:C.bg,borderRadius:10,padding:"10px 12px"}}>
                  <div style={{fontSize:11,color:dark?C.dk.muted:C.muted,fontWeight:600}}>{k}</div>
                  <div style={{fontSize:13,fontWeight:700,color:dark?C.dk.text:C.text,marginTop:2}}>{v||"—"}</div>
                </div>
              ))}
            </div>

            {viewing.tags?.length > 0 && (
              <div style={{marginTop:12,display:"flex",flexWrap:"wrap",gap:6}}>
                {viewing.tags.map(t => <span key={t} style={{background:C.secondary+"33",color:C.primary,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600}}>{t}</span>)}
              </div>
            )}

            {viewing.notes && (
              <div style={{marginTop:14,background:dark?C.dk.bg:C.bg,borderRadius:10,padding:12}}>
                <div style={{fontSize:11,fontWeight:700,color:dark?C.dk.muted:C.muted,marginBottom:6}}>📝 Notes</div>
                <div style={{fontSize:13,color:dark?C.dk.text:C.text,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{viewing.notes}</div>
              </div>
            )}

            {viewing.jobLink && (
              <a href={viewing.jobLink} target="_blank" rel="noreferrer"
                style={{display:"inline-block",marginTop:14,color:C.primary,fontWeight:600,fontSize:13}}>
                🔗 View Job Posting ↗
              </a>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}