import { useState, useRef, useCallback } from "react";

const C = {
  bg:     "#0D0F14",
  panel:  "#13161E",
  border: "#1E2330",
  accent: "#E94560",
  green:  "#2ECC71",
  yellow: "#F39C12",
  muted:  "#4A5568",
  text:   "#E2E8F0",
  sub:    "#718096",
  white:  "#FFFFFF",
  dark2:  "#1A1F2E",
};

const gs = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:${C.bg};font-family:'DM Sans',sans-serif;color:${C.text};}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-track{background:${C.panel};}
  ::-webkit-scrollbar-thumb{background:${C.muted};border-radius:2px;}
  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}
  @keyframes slideIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
  .slide-in{animation:slideIn 0.3s ease forwards;}
  .spin{animation:spin 0.8s linear infinite;display:inline-block;}
  .pulse{animation:pulse 1.2s ease infinite;}
`;

const TIER = {
  PRIORITY:  { label:"PRIORITY",  color:C.green,  bg:"#0D2818" },
  SECONDARY: { label:"SECONDARY", color:C.yellow, bg:"#2D1F00" },
  SKIP:      { label:"SKIP",      color:C.accent, bg:"#2D0A12" },
};

function getTier(score) {
  if (score === 4) return TIER.PRIORITY;
  if (score >= 2) return TIER.SECONDARY;
  return TIER.SKIP;
}

function CritBadge({ label, score }) {
  const pass = score === 1;
  return (
    <span style={{
      display:"inline-flex",alignItems:"center",gap:3,
      fontSize:10,fontFamily:"Space Mono,monospace",
      padding:"2px 6px",borderRadius:3,
      background:pass?"#0D2818":"#1A0A0A",
      color:pass?C.green:C.muted,
      border:`1px solid ${pass?"#1E4D30":"#2D1515"}`,
    }}>
      {pass?"✓":"✗"} {label}
    </span>
  );
}

function StatusIcon({ status }) {
  if (status==="pending")    return <span style={{color:C.muted,fontSize:14}}>○</span>;
  if (status==="processing") return <span className="spin" style={{fontSize:14}}>◌</span>;
  if (status==="done")       return <span style={{color:C.green,fontSize:14}}>●</span>;
  if (status==="error")      return <span style={{color:C.accent,fontSize:14}}>✕</span>;
  return null;
}

function BrandCard({ brand }) {
  const [expanded, setExpanded] = useState(false);
  const { name, website, instagram, status, data, tier, error } = brand;
  return (
    <div className="slide-in" onClick={() => data && setExpanded(e=>!e)} style={{
      background:C.panel,
      border:`1px solid ${tier?tier.bg:C.border}`,
      borderLeft:`3px solid ${tier?tier.color:C.border}`,
      borderRadius:8,padding:"12px 16px",
      cursor:data?"pointer":"default",
    }}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <StatusIcon status={status}/>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontWeight:600,fontSize:13,color:C.white}}>{name}</span>
            {website&&<span style={{fontSize:10,color:C.muted}}>{website}</span>}
            {instagram&&<span style={{fontSize:10,color:C.muted}}>{instagram}</span>}
          </div>
          {status==="processing"&&(
            <p className="pulse" style={{fontSize:11,color:C.yellow,marginTop:2}}>
              Researching brand across the web...
            </p>
          )}
          {status==="error"&&(
            <p style={{fontSize:11,color:C.accent,marginTop:2}}>Error: {error}</p>
          )}
        </div>
        {data&&tier&&(
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"Space Mono",fontSize:18,color:tier.color,lineHeight:1}}>
                {data.total_score}/4
              </div>
              <div style={{fontSize:9,color:C.muted,marginTop:2}}>SCORE</div>
            </div>
            <div style={{background:tier.bg,border:`1px solid ${tier.color}30`,
              padding:"4px 10px",borderRadius:4}}>
              <span style={{fontFamily:"Space Mono",fontSize:10,color:tier.color,letterSpacing:1}}>
                {tier.label}
              </span>
            </div>
            <span style={{fontSize:14,color:C.muted}}>{expanded?"▲":"▼"}</span>
          </div>
        )}
      </div>

      {data&&(
        <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
          <CritBadge label="FOLLOWERS" score={data.followers_score}/>
          <CritBadge label="NO NG SHIP" score={data.nigeria_shipping_score}/>
          <CritBadge label="NO NG AUDIENCE" score={data.nigeria_audience_score}/>
          <CritBadge label="EMAIL FOUND" score={data.email_score}/>
        </div>
      )}

      {expanded&&data&&(
        <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            {[
              ["Followers",data.follower_count],
              ["Ships to Nigeria",String(data.ships_to_nigeria)],
              ["Nigerian Presence",data.nigeria_presence],
              ["Contact Name",data.contact_name],
              ["Contact Email",data.contact_email],
              ["Recommendation",data.recommendation],
            ].map(([k,v])=>(
              <div key={k} style={{background:C.dark2,borderRadius:6,padding:"8px 12px"}}>
                <div style={{fontSize:10,color:C.muted,marginBottom:3,letterSpacing:0.4}}>
                  {k.toUpperCase()}
                </div>
                <div style={{
                  fontSize:12,
                  color:k==="Contact Email"?C.green:C.text,
                  fontFamily:k==="Contact Email"?"Space Mono":"inherit",
                  wordBreak:"break-all"
                }}>
                  {v||"—"}
                </div>
              </div>
            ))}
          </div>
          {data.reason&&(
            <div style={{background:C.dark2,borderRadius:6,padding:"10px 12px",
              borderLeft:`2px solid ${C.accent}`}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:4}}>NIGERIA OPPORTUNITY</div>
              <div style={{fontSize:12,color:C.text,lineHeight:1.6}}>{data.reason}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function exportCSV(results) {
  const headers = ["Brand","Website","Instagram","Score","Tier","Followers",
    "Ships to NG","NG Presence","Contact Name","Contact Email","Reason","Recommendation"];
  const rows = results.map(r=>[
    r.name,r.website||"",r.instagram||"",
    r.data?.total_score??"",r.tier?.label??"",
    r.data?.follower_count??"",r.data?.ships_to_nigeria??"",
    r.data?.nigeria_presence??"",r.data?.contact_name??"",
    r.data?.contact_email??"",
    `"${(r.data?.reason||"").replace(/"/g,'""')}"`,
    r.data?.recommendation??"",
  ]);
  const csv=[headers,...rows].map(r=>r.join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download="NaijaBrandConnect_Qualified.csv";a.click();
}

export default function App() {
  const [input, setInput]   = useState("");
  const [brands, setBrands] = useState([]);
  const [running, setRunning] = useState(false);
  const [tab, setTab]       = useState("all");
  const [search, setSearch] = useState("");
  const stopRef = useRef(false);

  const parseInput = () =>
    input.split("\n").map(l=>l.trim()).filter(Boolean).map((line,i)=>{
      const parts = line.split(/[|,\t]/).map(p=>p.trim());
      return { id:i, name:parts[0]||"Unknown", website:parts[1]||"",
               instagram:parts[2]||"", status:"pending", data:null, tier:null, error:null };
    });

  const run = useCallback(async () => {
    const list = parseInput();
    if (!list.length) return;
    stopRef.current = false;
    setRunning(true);
    setBrands(list);
    for (let i=0; i<list.length; i++) {
      if (stopRef.current) break;
      setBrands(prev=>prev.map((b,idx)=>idx===i?{...b,status:"processing"}:b));
      try {
        const res = await fetch("/api/qualify", {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({ name:list[i].name, website:list[i].website,
                                instagram:list[i].instagram }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        const tier = getTier(data.total_score);
        setBrands(prev=>prev.map((b,idx)=>idx===i?{...b,status:"done",data,tier}:b));
      } catch(e) {
        setBrands(prev=>prev.map((b,idx)=>idx===i?{...b,status:"error",error:e.message}:b));
      }
      if (i<list.length-1) await new Promise(r=>setTimeout(r,4500));
    }
    setRunning(false);
  }, [input]);

  const stop = () => { stopRef.current=true; setRunning(false); };

  const done      = brands.filter(b=>b.status==="done");
  const priority  = done.filter(b=>b.tier?.label==="PRIORITY");
  const secondary = done.filter(b=>b.tier?.label==="SECONDARY");
  const skipped   = done.filter(b=>b.tier?.label==="SKIP");
  const progress  = brands.length ? Math.round((done.length/brands.length)*100) : 0;

  const filtered = brands.filter(b=>{
    const ms = !search||b.name.toLowerCase().includes(search.toLowerCase());
    if (!ms) return false;
    if (tab==="all")       return true;
    if (tab==="priority")  return b.tier?.label==="PRIORITY";
    if (tab==="secondary") return b.tier?.label==="SECONDARY";
    if (tab==="skip")      return b.tier?.label==="SKIP";
    if (tab==="pending")   return b.status==="pending";
    return true;
  });

  return (
    <>
      <style>{gs}</style>
      <div style={{minHeight:"100vh",background:C.bg,padding:"24px 20px"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>

          {/* Header */}
          <div style={{display:"flex",alignItems:"flex-start",
            justifyContent:"space-between",marginBottom:28}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                <div style={{width:8,height:28,background:C.accent,borderRadius:2}}/>
                <h1 style={{fontFamily:"Space Mono,monospace",fontSize:20,
                  color:C.white,letterSpacing:1}}>BRAND QUALIFIER</h1>
              </div>
              <p style={{color:C.sub,fontSize:13,paddingLeft:18}}>
                AI-powered Nigerian market screening · NaijaBrandConnect
              </p>
            </div>
            {done.length>0&&(
              <button onClick={()=>exportCSV(done)} style={{
                background:"transparent",border:`1px solid ${C.green}`,color:C.green,
                padding:"8px 16px",borderRadius:6,cursor:"pointer",fontSize:12,
                fontFamily:"Space Mono,monospace",letterSpacing:0.5,
              }}>↓ EXPORT CSV</button>
            )}
          </div>

          {/* Stats */}
          {brands.length>0&&(
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",
              gap:12,marginBottom:24}}>
              {[
                {label:"TOTAL",   val:brands.length, color:C.text},
                {label:"DONE",    val:done.length,    color:C.sub},
                {label:"PRIORITY",val:priority.length,color:C.green},
                {label:"SECONDARY",val:secondary.length,color:C.yellow},
                {label:"SKIP",    val:skipped.length, color:C.accent},
              ].map(s=>(
                <div key={s.label} style={{background:C.panel,
                  border:`1px solid ${C.border}`,borderRadius:8,
                  padding:"14px 16px",textAlign:"center"}}>
                  <div style={{fontFamily:"Space Mono",fontSize:22,
                    color:s.color,marginBottom:4}}>{s.val}</div>
                  <div style={{fontSize:10,color:C.muted,letterSpacing:1}}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Progress */}
          {brands.length>0&&(
            <div style={{marginBottom:24}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:12,color:C.sub}}>
                  {running
                    ? <span className="pulse">Processing brands...</span>
                    : "Qualification complete"}
                </span>
                <span style={{fontFamily:"Space Mono",fontSize:12,color:C.text}}>
                  {progress}%
                </span>
              </div>
              <div style={{height:4,background:C.border,borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${progress}%`,
                  background:`linear-gradient(90deg,${C.accent},${C.green})`,
                  borderRadius:2,transition:"width 0.4s ease"}}/>
              </div>
            </div>
          )}

          <div style={{display:"grid",
            gridTemplateColumns:brands.length?"360px 1fr":"1fr",gap:20}}>

            {/* Input */}
            <div>
              <div style={{background:C.panel,border:`1px solid ${C.border}`,
                borderRadius:10,padding:20}}>
                <h2 style={{fontSize:13,color:C.sub,letterSpacing:1,marginBottom:14,
                  fontFamily:"Space Mono",textTransform:"uppercase"}}>Brand List</h2>
                <p style={{fontSize:12,color:C.muted,marginBottom:10,lineHeight:1.6}}>
                  One brand per line:<br/>
                  <code style={{color:C.yellow,fontSize:11}}>
                    Name | website.com | @instagram
                  </code>
                </p>
                <textarea
                  value={input} onChange={e=>setInput(e.target.value)}
                  placeholder={"BOJJ Studio | bojjstudio.com | @bojjstudio\nNOVA Apparel | novaapparel.co\nUrban Stitch\n..."}
                  style={{width:"100%",height:220,background:C.dark2,
                    border:`1px solid ${C.border}`,borderRadius:8,color:C.text,
                    padding:12,fontSize:12,fontFamily:"Space Mono,monospace",
                    lineHeight:1.7,resize:"vertical",outline:"none"}}
                />
                <div style={{marginTop:12,display:"flex",gap:10}}>
                  {!running?(
                    <button onClick={run} disabled={!input.trim()} style={{
                      flex:1,padding:"11px",borderRadius:7,border:"none",
                      background:input.trim()?C.accent:C.muted,
                      color:C.white,fontFamily:"Space Mono",fontSize:12,
                      cursor:input.trim()?"pointer":"not-allowed",letterSpacing:0.5,
                    }}>▶ RUN QUALIFICATION</button>
                  ):(
                    <button onClick={stop} style={{flex:1,padding:"11px",borderRadius:7,
                      border:`1px solid ${C.accent}`,background:"transparent",color:C.accent,
                      fontFamily:"Space Mono",fontSize:12,cursor:"pointer"}}>
                      ■ STOP
                    </button>
                  )}
                </div>
                <div style={{marginTop:20}}>
                  <p style={{fontSize:11,color:C.muted,marginBottom:10,letterSpacing:0.5}}>
                    SCORING CRITERIA
                  </p>
                  {[
                    ["FOLLOWERS","5K – 200K range"],
                    ["NO NG SHIPPING","Opportunity exists"],
                    ["NO NG AUDIENCE","Room to grow"],
                    ["EMAIL FOUND","Directly reachable"],
                  ].map(([c,d])=>(
                    <div key={c} style={{display:"flex",justifyContent:"space-between",
                      padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
                      <span style={{fontFamily:"Space Mono",fontSize:10,color:C.text}}>{c}</span>
                      <span style={{fontSize:11,color:C.muted}}>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Results */}
            {brands.length>0&&(
              <div>
                <div style={{display:"flex",gap:4,marginBottom:14,flexWrap:"wrap"}}>
                  {[["all","All"],["priority","Priority"],["secondary","Secondary"],
                    ["skip","Skip"],["pending","Pending"]].map(([key,label])=>(
                    <button key={key} onClick={()=>setTab(key)} style={{
                      padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",
                      fontSize:12,fontFamily:"Space Mono",
                      background:tab===key?C.accent:C.panel,
                      color:tab===key?C.white:C.sub,transition:"all 0.2s",
                    }}>{label}</button>
                  ))}
                  <input value={search} onChange={e=>setSearch(e.target.value)}
                    placeholder="Search..." style={{marginLeft:"auto",padding:"6px 12px",
                    borderRadius:20,border:`1px solid ${C.border}`,background:C.panel,
                    color:C.text,fontSize:12,outline:"none",minWidth:140}}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:10,
                  maxHeight:600,overflowY:"auto"}}>
                  {filtered.length===0&&(
                    <div style={{textAlign:"center",color:C.muted,padding:40,fontSize:13}}>
                      No brands in this category yet.
                    </div>
                  )}
                  {filtered.map(b=><BrandCard key={b.id} brand={b}/>)}
                </div>
              </div>
            )}

            {/* Empty state */}
            {brands.length===0&&(
              <div style={{background:C.panel,border:`1px dashed ${C.border}`,
                borderRadius:10,display:"flex",alignItems:"center",
                justifyContent:"center",flexDirection:"column",gap:12,padding:60}}>
                <div style={{fontSize:40}}>🎯</div>
                <p style={{color:C.sub,fontSize:14,textAlign:"center",lineHeight:1.7}}>
                  Paste your brand list and hit<br/>
                  <b style={{color:C.accent}}>Run Qualification</b>
                </p>
                <p style={{color:C.muted,fontSize:12,textAlign:"center"}}>
                  AI searches the web for each brand<br/>and scores them on all 4 criteria.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
