import { useState } from 'react';
import { TEACHERS, SCHOOL_NAME } from '../lib/config';

const DAYS = ['日','月','火','水','木','金','土'];

function formatDate(d) {
  const [y,m,day] = d.split('-').map(Number);
  const dt = new Date(y, m-1, day);
  return `${m}/${day}(${DAYS[dt.getDay()]})`;
}
function formatDateLong(d) {
  const [y,m,day] = d.split('-').map(Number);
  const dt = new Date(y, m-1, day);
  return `${m}月${day}日（${DAYS[dt.getDay()]}）`;
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
      setPwError('パスワードが違います');
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
      setError('空き時間の取得に失敗しました');
    }
    setLoading(false);
  }

  async function submitBooking() {
    if (!form.studentName || !form.parentName) { setError('必須項目を入力してください'); return; }
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
      else { setError(data.error || 'エラーが発生しました'); }
    } catch {
      setError('通信エラーが発生しました');
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
            <div style={{ fontSize:13, color:'#888' }}>三者面談 オンライン予約</div>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:12, color:'#888', marginBottom:6 }}>パスワードを入力してください</label>
            <input
              type="password"
              value={pwInput}
              onChange={e => setPwInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && checkPassword()}
              placeholder="パスワード"
              style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #e8e8e8', borderRadius:10, fontSize:15, fontFamily:'sans-serif', background:'#fafafa', outline:'none', boxSizing:'border-box' }}
            />
          </div>
          {pwError && <div style={{ color:'#e74c3c', fontSize:13, marginBottom:12 }}>{pwError}</div>}
          <button onClick={checkPassword} style={{ width:'100%', padding:14, background:'#27ae60', color:'#fff', border:'none', borderRadius:12, fontSize:16, fontWeight:700, cursor:'pointer' }}>
            入力する
          </button>
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
              style={{ background:'none', border:'none', color:'#fff', fontSize:20, cursor:'pointer' }}>←</button>
          )}
          <div>
            <div style={{ fontSize:16, fontWeight:700 }}>{SCHOOL_NAME}</div>
            <div style={{ fontSize:11, opacity:.85 }}>
              {step===1 && '三者面談 オンライン予約'}
              {step===2 && `${teacher?.name} 先生の空き時間`}
              {step===3 && '情報を入力してください'}
              {step===4 && '予約完了'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:'0 auto', padding:'16px 14px 60px' }}>

        {step === 1 && (
          <>
            <div style={{ fontSize:12, color:'#888', marginBottom:10, fontWeight:600 }}>担当を選んでください</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {TEACHERS.map(t => (
                <div key={t.id} onClick={() => selectTeacher(t)}
                  style={{ background:'#fff', borderRadius:14, padding:'18px 12px 14px', textAlign:'center', cursor:'pointer', border:'2px solid #eee' }}>
                  <div style={{ width:44, height:44, borderRadius:'50%', background:t.color, margin:'0 auto 10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, color:'#fff' }}>
                    {t.name[0]}
                  </div>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:2 }}>{t.name} 先生</div>
                  <div style={{ fontSize:11, color:'#aaa' }}>空きを確認する</div>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {loading && (
              <div style={{ textAlign:'center', padding:40, color:'#888' }}>
                <div style={{ fontSize:32, marginBottom:12 }}>📅</div>
                <div style={{ fontWeight:700, marginBottom:6, fontSize:15 }}>面談可能時間を確認中です</div>
                <div style={{ fontSize:13, color:'#aaa' }}>しばらくお待ちください<br/>（時間がかかる場合があります）</div>
              </div>
            )}
            {!loading && slots.length === 0 && (
              <div style={{ textAlign:'center', padding:40, color:'#aaa' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📅</div>
                <div style={{ fontWeight:700, marginBottom:6 }}>{teacher?.name}先生の空き時間がありません</div>
                <button onClick={() => setStep(1)} style={ghostBtnStyle}>担当を選び直す</button>
              </div>
            )}
            {!loading && slots.length > 0 && (
              <>
                <div style={{ background:'#eafaf1', border:'1.5px solid #27ae60', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:13, color:'#1e8449' }}>
                  ご都合の良い中で、できるだけ早い日程をお選びいただけますと幸いです
                </div>
                <div style={{ fontSize:12, color:'#888', marginBottom:10, fontWeight:600 }}>日付を選んでください</div>
                <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4, marginBottom:16 }}>
                  {dates.map(d => (
                    <div key={d} onClick={() => { setSelDate(d); setSelSlot(null); }}
                      style={{ flexShrink:0, padding:'8px 14px', borderRadius:20, border:`1.5px solid ${d===selDate?'#27ae60':'#ddd'}`, fontSize:13, cursor:'pointer', background:d===selDate?'#27ae60':'#fff', color:d===selDate?'#fff':'#555', fontWeight:d===selDate?700:'normal' }}>
                      {formatDate(d)}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize:12, color:'#888', marginBottom:10, fontWeight:600 }}>時間を選んでください</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:20 }}>
                  {daySlots.map(s => {
                    const isSel = selSlot?.startTime === s.startTime;
                    return (
                      <div key={s.startTime} onClick={() => setSelSlot(s)}
                        style={{ padding:'10px 4px', borderRadius:10, border:`1.5px solid ${isSel?'#27ae60':'#e0e0e0'}`, fontSize:13, cursor:'pointer', background:isSel?'#27ae60':'#fff', color:isSel?'#fff':'#333', textAlign:'center', fontWeight:isSel?700:'normal' }}>
                        {s.startTime}
                        <span style={{ fontSize:10, opacity:.7, display:'block', marginTop:1 }}>〜{s.endTime}</span>
                      </div>
                    );
                  })}
                </div>
                {selSlot && (
                  <div style={{ background:'#fff', borderRadius:14, padding:'14px 16px', marginBottom:16, border:'2px solid #27ae60' }}>
                    <div style={{ fontSize:11, color:'#27ae60', fontWeight:700, marginBottom:6 }}>選択中の日時</div>
                    <div style={{ fontSize:15, fontWeight:700 }}>{formatDateLong(selDate)} {selSlot.startTime}〜{selSlot.endTime}</div>
                  </div>
                )}
                <button onClick={() => setStep(3)} disabled={!selSlot} style={selSlot ? primaryBtnStyle : disabledBtnStyle}>
                  次へ　入力画面へ →
                </button>
              </>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ background:'#fff', borderRadius:14, padding:'14px 16px', marginBottom:16, border:'2px solid #27ae60' }}>
              <div style={{ fontSize:11, color:'#27ae60', fontWeight:700, marginBottom:6 }}>予約内容</div>
              <div style={{ fontSize:15, fontWeight:700 }}>{teacher?.name} 先生　{formatDateLong(selDate)} {selSlot?.startTime}〜{selSlot?.endTime}</div>
            </div>
            <div style={{ background:'#fff', borderRadius:14, padding:16, marginBottom:12 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#27ae60', marginBottom:14 }}>生徒・保護者情報</div>
              {[
                { id:'studentName', label:'生徒氏名', req:true, type:'text', ph:'例：東進 太郎' },
                { id:'parentName',  label:'保護者氏名', req:true, type:'text', ph:'例：東進 花子' },
                { id:'email',       label:'メールアドレス（確認メール送付）', req:false, type:'email', ph:'example@gmail.com' },
                { id:'notes',       label:'ご要望・相談内容（任意）', req:false, type:'textarea', ph:'事前にお伝えしたいことがあればご記入ください' },
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
            </div>
            {error && <div style={{ color:'#e74c3c', fontSize:13, marginBottom:12 }}>{error}</div>}
            <button onClick={submitBooking} disabled={submitting} style={submitting ? disabledBtnStyle : primaryBtnStyle}>
              {submitting ? '送信中...' : '予約を確定する'}
            </button>
            <button onClick={() => { setStep(2); setError(''); }} style={ghostBtnStyle}>← 日時を選び直す</button>
          </>
        )}

        {step === 4 && (
          <div style={{ textAlign:'center', padding:'32px 16px' }}>
            <div style={{ width:72, height:72, borderRadius:'50%', background:'#eafaf1', margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg viewBox="0 0 24 24" width={36} height={36} fill="none" stroke="#27ae60" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>ご予約完了！</h2>
            <p style={{ fontSize:14, color:'#666', lineHeight:1.7 }}>三者面談のご予約を承りました。<br/>当日はよろしくお願いいたします。</p>
            <div style={{ background:'#f7f7f7', borderRadius:12, padding:'14px 16px', margin:'16px 0', textAlign:'left', fontSize:13, lineHeight:2.4 }}>
              <span style={{ color:'#888', fontSize:11, display:'block' }}>担当</span>{teacher?.name} 先生
              <span style={{ color:'#888', fontSize:11, display:'block', marginTop:8 }}>日時</span>{formatDateLong(selDate)} {selSlot?.startTime}〜{selSlot?.endTime}
              <span style={{ color:'#888', fontSize:11, display:'block', marginTop:8 }}>生徒</span>{form.studentName}
              <span style={{ color:'#888', fontSize:11, display:'block', marginTop:8 }}>保護者</span>{form.parentName}
              {form.email && <><span style={{ color:'#888', fontSize:11, display:'block', marginTop:8 }}>確認メール</span>{form.email}</>}
            </div>
            {form.email && <p style={{ fontSize:12, color:'#aaa' }}>確認メールを送信しました</p>}
            <button onClick={() => { setStep(1); setTeacher(null); setSlots([]); setSelDate(null); setSelSlot(null); setForm({studentName:'',parentName:'',email:'',notes:''}); setDone(false); }} style={{ ...ghostBtnStyle, marginTop:20 }}>
              トップに戻る
            </button>
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