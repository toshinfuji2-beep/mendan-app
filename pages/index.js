import { useState } from 'react';
import { TEACHERS, SCHOOL_NAME } from '../lib/config';

const DAYS = ['譌･','譛・,'轣ｫ','豌ｴ','譛ｨ','驥・,'蝨・];

function formatDate(d) {
  const [y,m,day] = d.split('-').map(Number);
  const dt = new Date(y, m-1, day);
  return `${m}/${day}(${DAYS[dt.getDay()]})`;
}
function formatDateLong(d) {
  const [y,m,day] = d.split('-').map(Number);
  const dt = new Date(y, m-1, day);
  return `${m}譛・{day}譌･・・{DAYS[dt.getDay()]}・荏;
}

export default function Home() {
  const [auth, setAuth] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');
  const [step, setStep] = useState(1);
  const [teacher, setTeacher] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selDate, setSelDate] = useState(null);
  const [selSlot, setSelSlot] = useState(null);
  const [form, setForm] = useState({ studentName:'', parentName:'', email:'', notes:'' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const dates = [...new Set(slots.map(s => s.date))];
  const daySlots = slots.filter(s => s.date === selDate);

  async function checkPassword() {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwInput }),
    });
    const data = await res.json();
    if (data.ok) {
      setAuth(true);
      setPwError('');
    } else {
      setPwError('繝代せ繝ｯ繝ｼ繝峨′驕輔＞縺ｾ縺・);
    }
  }

  async function selectTeacher(t) {
    setTeacher(t);
    setLoading(true);
    setSlots([]);
    setSelDate(null);
    setSelSlot(null);
    setStep(2);
    try {
      const res = await fetch(`/api/slots?teacherId=${t.id}`);
      const data = await res.json();
      setSlots(data.slots || []);
      if (data.slots?.length > 0) setSelDate(data.slots[0].date);
    } catch {
      setError('遨ｺ縺肴凾髢薙・蜿門ｾ励↓螟ｱ謨励＠縺ｾ縺励◆');
    }
    setLoading(false);
  }

  async function submitBooking() {
    if (!form.studentName || !form.parentName || !form.email) { setError('蠢・磯・岼繧貞・蜉帙＠縺ｦ縺上□縺輔＞'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: teacher.id, date: selDate, startTime: selSlot.startTime, endTime: selSlot.endTime, ...form }),
      });
      const data = await res.json();
      if (data.success) { setDone(true); setStep(4); }
      else { setError(data.error || '繧ｨ繝ｩ繝ｼ縺檎匱逕溘＠縺ｾ縺励◆'); }
    } catch {
      setError('騾壻ｿ｡繧ｨ繝ｩ繝ｼ縺檎匱逕溘＠縺ｾ縺励◆');
    }
    setSubmitting(false);
  }

  if (!auth) {
    return (
      <div style={{ minHeight:'100vh', background:'#f7f7f7', fontFamily:'sans-serif', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ background:'#fff', borderRadius:16, padding:'32px 24px', width:'90%', maxWidth:380, boxShadow:'0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'#27ae60', margin:'0 auto 12px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg viewBox="0 0 24 24" width={28} height={28} fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>{SCHOOL_NAME}</div>
            <div style={{ fontSize:13, color:'#888' }}>荳芽・擇隲・繧ｪ繝ｳ繝ｩ繧､繝ｳ莠育ｴ・/div>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:12, color:'#888', marginBottom:6 }}>繝代せ繝ｯ繝ｼ繝峨ｒ蜈･蜉帙＠縺ｦ縺上□縺輔＞</label>
            <input
              type="password"
              value={pwInput}
              onChange={e => setPwInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && checkPassword()}
              placeholder="繝代せ繝ｯ繝ｼ繝・
              style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #e8e8e8', borderRadius:10, fontSize:15, fontFamily:'sans-serif', background:'#fafafa', outline:'none', boxSizing:'border-box' }}
            />
          </div>
          {pwError && <div style={{ color:'#e74c3c', fontSize:13, marginBottom:12 }}>{pwError}</div>}
          <button onClick={checkPassword} style={{ width:'100%', padding:14, background:'#27ae60', color:'#fff', border:'none', borderRadius:12, fontSize:16, fontWeight:700, cursor:'pointer' }}>
            蜈･蜉帙☆繧・          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f7f7f7', fontFamily:'sans-serif' }}>
      <div style={{ background:'#27ae60', color:'#fff', padding:'14px 16px', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ maxWidth:480, margin:'0 auto', display:'flex', alignItems:'center', gap:10 }}>
          {step > 1 && !done && (
            <button onClick={() => { if(step===2){setStep(1);setTeacher(null);} else if(step===3){setStep(2);setSelSlot(null);} }}
              style={{ background:'none', border:'none', color:'#fff', fontSize:20, cursor:'pointer' }}>竊・/button>
          )}
          <div>
            <div style={{ fontSize:16, fontWeight:700 }}>{SCHOOL_NAME}</div>
            <div style={{ fontSize:11, opacity:.85 }}>
              {step===1 && '荳芽・擇隲・繧ｪ繝ｳ繝ｩ繧､繝ｳ莠育ｴ・}
              {step===2 && `${teacher?.name} 蜈育函縺ｮ遨ｺ縺肴凾髢伝}
              {step===3 && '諠・ｱ繧貞・蜉帙＠縺ｦ縺上□縺輔＞'}
              {step===4 && '莠育ｴ・ｮ御ｺ・}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:'0 auto', padding:'16px 14px 60px' }}>

        {step === 1 && (
          <>
            <div style={{ fontSize:12, color:'#888', marginBottom:10, fontWeight:600 }}>諡・ｽ薙ｒ驕ｸ繧薙〒縺上□縺輔＞</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {TEACHERS.map(t => (
                <div key={t.id} onClick={() => selectTeacher(t)}
                  style={{ background:'#fff', borderRadius:14, padding:'18px 12px 14px', textAlign:'center', cursor:'pointer', border:'2px solid #eee' }}>
                  <div style={{ width:44, height:44, borderRadius:'50%', background:t.color, margin:'0 auto 10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, color:'#fff' }}>
                    {t.name[0]}
                  </div>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:2 }}>{t.name} 蜈育函</div>
                  <div style={{ fontSize:11, color:'#aaa' }}>遨ｺ縺阪ｒ遒ｺ隱阪☆繧・/div>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {loading && (
              <div style={{ textAlign:'center', padding:40, color:'#888' }}>
                <div style={{ fontSize:32, marginBottom:12 }}>套</div>
                <div style={{ fontWeight:700, marginBottom:6, fontSize:15 }}>髱｢隲・庄閭ｽ譎る俣繧堤｢ｺ隱堺ｸｭ縺ｧ縺・/div>
                <div style={{ fontSize:13, color:'#aaa' }}>縺励・繧峨￥縺雁ｾ・■縺上□縺輔＞<br/>・域凾髢薙′縺九°繧句ｴ蜷医′縺ゅｊ縺ｾ縺呻ｼ・/div>
              </div>
            )}
            {!loading && slots.length === 0 && (
              <div style={{ textAlign:'center', padding:40, color:'#aaa' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>套</div>
                <div style={{ fontWeight:700, marginBottom:6 }}>{teacher?.name}蜈育函縺ｮ遨ｺ縺肴凾髢薙′縺ゅｊ縺ｾ縺帙ｓ</div>
                <button onClick={() => setStep(1)} style={ghostBtnStyle}>諡・ｽ薙ｒ驕ｸ縺ｳ逶ｴ縺・/button>
              </div>
            )}
            {!loading && slots.length > 0 && (
              <>
                <div style={{ background:'#eafaf1', border:'1.5px solid #27ae60', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:13, color:'#1e8449' }}>
                  縺秘・蜷医・濶ｯ縺・ｸｭ縺ｧ縲√〒縺阪ｋ縺縺第掠縺・律遞九ｒ縺企∈縺ｳ縺・◆縺縺代∪縺吶→蟷ｸ縺・〒縺・                </div>
                <div style={{ fontSize:12, color:'#888', marginBottom:10, fontWeight:600 }}>譌･莉倥ｒ驕ｸ繧薙〒縺上□縺輔＞</div>
                <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4, marginBottom:16 }}>
                  {dates.map(d => (
                    <div key={d} onClick={() => { setSelDate(d); setSelSlot(null); }}
                      style={{ flexShrink:0, padding:'8px 14px', borderRadius:20, border:`1.5px solid ${d===selDate?'#27ae60':'#ddd'}`, fontSize:13, cursor:'pointer', background:d===selDate?'#27ae60':'#fff', color:d===selDate?'#fff':'#555', fontWeight:d===selDate?700:'normal' }}>
                      {formatDate(d)}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize:12, color:'#888', marginBottom:10, fontWeight:600 }}>譎る俣繧帝∈繧薙〒縺上□縺輔＞</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:20 }}>
                  {daySlots.map(s => {
                    const isSel = selSlot?.startTime === s.startTime;
                    return (
                      <div key={s.startTime} onClick={() => setSelSlot(s)}
                        style={{ padding:'10px 4px', borderRadius:10, border:`1.5px solid ${isSel?'#27ae60':'#e0e0e0'}`, fontSize:13, cursor:'pointer', background:isSel?'#27ae60':'#fff', color:isSel?'#fff':'#333', textAlign:'center', fontWeight:isSel?700:'normal' }}>
                        {s.startTime}
                        <span style={{ fontSize:10, opacity:.7, display:'block', marginTop:1 }}>縲悳s.endTime}</span>
                      </div>
                    );
                  })}
                </div>
                {selSlot && (
                  <div style={{ background:'#fff', borderRadius:14, padding:'14px 16px', marginBottom:16, border:'2px solid #27ae60' }}>
                    <div style={{ fontSize:11, color:'#27ae60', fontWeight:700, marginBottom:6 }}>驕ｸ謚樔ｸｭ縺ｮ譌･譎・/div>
                    <div style={{ fontSize:15, fontWeight:700 }}>{formatDateLong(selDate)} {selSlot.startTime}縲悳selSlot.endTime}</div>
                  </div>
                )}
                <button onClick={() => setStep(3)} disabled={!selSlot} style={selSlot ? primaryBtnStyle : disabledBtnStyle}>
                  谺｡縺ｸ縲蜈･蜉帷判髱｢縺ｸ 竊・                </button>
              </>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ background:'#fff', borderRadius:14, padding:'14px 16px', marginBottom:16, border:'2px solid #27ae60' }}>
              <div style={{ fontSize:11, color:'#27ae60', fontWeight:700, marginBottom:6 }}>莠育ｴ・・螳ｹ</div>
              <div style={{ fontSize:15, fontWeight:700 }}>{teacher?.name} 蜈育函縲{formatDateLong(selDate)} {selSlot?.startTime}縲悳selSlot?.endTime}</div>
            </div>
            <div style={{ background:'#fff', borderRadius:14, padding:16, marginBottom:12 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#27ae60', marginBottom:14 }}>逕溷ｾ偵・菫晁ｭｷ閠・ュ蝣ｱ</div>
              {[
                { id:'studentName', label:'逕溷ｾ呈ｰ丞錐', req:true, type:'text', ph:'萓具ｼ壽擲騾ｲ 螟ｪ驛・ },
                { id:'parentName',  label:'菫晁ｭｷ閠・ｰ丞錐', req:true, type:'text', ph:'萓具ｼ壽擲騾ｲ 闃ｱ蟄・ },

              ].map(f => (
                <div key={f.id} style={{ marginBottom:12 }}>
                  <label style={{ display:'block', fontSize:12, color:'#888', marginBottom:5 }}>
                    {f.label}{f.req && <span style={{ color:'#27ae60' }}>*</span>}
                  </label>
                  {f.type === 'textarea'
                    ? <textarea value={form[f.id]} onChange={e => setForm({...form, [f.id]:e.target.value})} placeholder={f.ph} style={inputStyle} rows={3}/>
                    : <input type={f.type} value={form[f.id]} onChange={e => setForm({...form, [f.id]:e.target.value})} placeholder={f.ph} style={inputStyle}/>
                  }
                </div>
              ))}
              <div style={{ marginBottom:12 }}>
                <label style={{ display:'block', fontSize:12, color:'#888', marginBottom:5 }}>
                  繝｡繝ｼ繝ｫ繧｢繝峨Ξ繧ｹ<span style={{ color:'#27ae60' }}>*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({...form, email:e.target.value})}
                  placeholder="example@gmail.com"
                  style={inputStyle}
                />
                <div style={{ fontSize:11, color:'#aaa', marginTop:5 }}>
                  縺泌・蜉帙＞縺溘□縺・◆繝｡繝ｼ繝ｫ繧｢繝峨Ξ繧ｹ縺ｫ莠育ｴ・｢ｺ隱阪Γ繝ｼ繝ｫ繧偵♀騾√ｊ縺励∪縺・                </div>
              </div>
            </div>
            {error && <div style={{ color:'#e74c3c', fontSize:13, marginBottom:12 }}>{error}</div>}
            <button onClick={submitBooking} disabled={submitting} style={submitting ? disabledBtnStyle : primaryBtnStyle}>
              {submitting ? '騾∽ｿ｡荳ｭ...' : '莠育ｴ・ｒ遒ｺ螳壹☆繧・}
            </button>
            <button onClick={() => { setStep(2); setError(''); }} style={ghostBtnStyle}>竊・譌･譎ゅｒ驕ｸ縺ｳ逶ｴ縺・/button>
          </>
        )}

        {step === 4 && (
          <div style={{ textAlign:'center', padding:'32px 16px' }}>
            <div style={{ width:72, height:72, borderRadius:'50%', background:'#eafaf1', margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg viewBox="0 0 24 24" width={36} height={36} fill="none" stroke="#27ae60" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>縺比ｺ育ｴ・ｮ御ｺ・ｼ・/h2>
            <p style={{ fontSize:14, color:'#666', lineHeight:1.7 }}>荳芽・擇隲・・縺比ｺ育ｴ・ｒ謇ｿ繧翫∪縺励◆縲・br/>蠖捺律縺ｯ繧医ｍ縺励￥縺企｡倥＞縺・◆縺励∪縺吶・/p>
            <div style={{ background:'#f7f7f7', borderRadius:12, padding:'14px 16px', margin:'16px 0', textAlign:'left', fontSize:13, lineHeight:2.4 }}>
              <span style={{ color:'#888', fontSize:11, display:'block' }}>諡・ｽ・/span>{teacher?.name} 蜈育函
              <span style={{ color:'#888', fontSize:11, display:'block', marginTop:8 }}>譌･譎・/span>{formatDateLong(selDate)} {selSlot?.startTime}縲悳selSlot?.endTime}
              <span style={{ color:'#888', fontSize:11, display:'block', marginTop:8 }}>逕溷ｾ・/span>{form.studentName}
              <span style={{ color:'#888', fontSize:11, display:'block', marginTop:8 }}>菫晁ｭｷ閠・/span>{form.parentName}
              <span style={{ color:'#888', fontSize:11, display:'block', marginTop:8 }}>遒ｺ隱阪Γ繝ｼ繝ｫ</span>{form.email}
            </div>
            <p style={{ fontSize:12, color:'#aaa' }}>遒ｺ隱阪Γ繝ｼ繝ｫ繧帝∽ｿ｡縺励∪縺励◆</p>
            <p style={{ fontSize:12, color:'#e74c3c', fontWeight:700 }}>縺薙・逕ｻ髱｢縺ｮ繧ｹ繧ｯ繝ｪ繝ｼ繝ｳ繧ｷ繝ｧ繝・ヨ繧剃ｿ晏ｭ倥＠縺ｦ縺上□縺輔＞</p>
            <button onClick={() => { setStep(1); setTeacher(null); setSlots([]); setSelDate(null); setSelSlot(null); setForm({studentName:'',parentName:'',email:'',notes:''}); setDone(false); }} style={{ ...ghostBtnStyle, marginTop:20 }}>
              繝医ャ繝励↓謌ｻ繧・            </button>
          </div>
        )}

      </div>
    </div>
  );
}

const primaryBtnStyle = { width:'100%', padding:15, background:'#27ae60', color:'#fff', border:'none', borderRadius:12, fontSize:16, fontWeight:700, cursor:'pointer', fontFamily:'sans-serif', marginBottom:0 };
const disabledBtnStyle = { ...primaryBtnStyle, background:'#ccc', cursor:'default' };
const ghostBtnStyle = { width:'100%', padding:12, background:'#fff', color:'#555', border:'1.5px solid #ddd', borderRadius:12, fontSize:14, cursor:'pointer', fontFamily:'sans-serif', marginTop:10, display:'block' };
const inputStyle = { width:'100%', padding:'11px 13px', border:'1.5px solid #e8e8e8', borderRadius:10, fontSize:14, fontFamily:'sans-serif', background:'#fafafa', outline:'none', resize:'none', boxSizing:'border-box' };
