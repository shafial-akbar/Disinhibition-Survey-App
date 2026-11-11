import React, {useMemo,useState} from 'react';
import {ArrowLeft,ArrowRight,CheckCircle2,ShieldCheck,Sparkles,ClipboardList} from 'lucide-react';
import {configured,supabase} from './lib/supabase';
import {sections,likert} from './data/questions';

const toolOpts=['ChatGPT','Google Gemini','Microsoft Copilot','Meta AI','Other AI chatbot'];
const purposeOpts=['Education and learning','Professional or work-related tasks','Information searching','Writing and communication','Personal discussions','Entertainment','Other'];
const blank={age_group:'',gender:'',education:'',occupation:'',ai_tools:[],ai_frequency:'',ai_duration:'',ai_purpose:[],ai_familiarity:''};

export default function App(){
 const [step,S]=useState(0),[age,A]=useState(''),[used,U]=useState(''),[consent,C]=useState(false);
 const [p,P]=useState(blank),[a,Q]=useState({}),[err,E]=useState(''),[busy,B]=useState(false);
 const scale=step>=4&&step<=6?sections[step-4]:null;
 const all=useMemo(()=>sections.flatMap(s=>s.items.map((_,i)=>`${s.prefix}_${i+1}`)),[]);
 const set=(k,v)=>P(old=>({...old,[k]:v}));
 const toggle=(k,v)=>P(old=>({...old,[k]:old[k].includes(v)?old[k].filter(x=>x!==v):[...old[k],v]}));
 const next=()=>{
  E('');
  if(step===1&&(age!=='yes'||used!=='yes'||!consent)){E(age!=='yes'?'You must be at least 18 years old to participate.':used!=='yes'?'This study is for people who have previously used conversational AI.':'Please provide your voluntary consent.');return;}
  if(step===2&&(!p.age_group||!p.education)){E('Please complete the required demographic questions.');return;}
  if(step===3&&(!p.ai_tools.length||!p.ai_frequency||!p.ai_duration||!p.ai_purpose.length||!p.ai_familiarity)){E('Please complete all required AI usage questions.');return;}
  if(scale&&scale.items.some((_,i)=>!a[`${scale.prefix}_${i+1}`])){E('Please answer every statement before continuing.');return;}
  S(x=>Math.min(x+1,7));window.scrollTo({top:0,behavior:'smooth'});
 };
 const back=()=>{E('');S(x=>Math.max(0,x-1));window.scrollTo({top:0,behavior:'smooth'});};
 async function submit(){
  E('');
  if(all.some(k=>!a[k])){E('Please complete all questionnaire statements.');return;}
  if(!configured){E('The survey database is not configured. Please contact the researcher.');return;}
  B(true);
  const payload={...p,...Object.fromEntries(all.map(k=>[k,Number(a[k])]))};
  const {error}=await supabase.from('survey_responses').insert(payload);
  B(false);
  if(error){console.error(error);E('Submission failed. Please check your connection and try again.');return;}
  S(8);window.scrollTo({top:0,behavior:'smooth'});
 }
 const pct=step>=2&&step<=7?Math.round((step-1)/7*100):0;
 return <main className="shell">
  <header className="topbar"><div className="brand"><Sparkles size={18}/></div><div><b>Research Survey</b><small>Academic research questionnaire</small></div><span className="private"><ShieldCheck size={15}/> Private survey</span></header>
  <section className="card">
   {step>1&&step<8&&<div className="progress"><span>Questionnaire progress</span><b>{pct}%</b><div><i style={{width:`${pct}%`}}/></div></div>}
   {step===0&&<><div className="kicker"><ClipboardList size={15}/> ACADEMIC RESEARCH</div><h1>Understanding how people experience conversational AI</h1><p className="lead">This study explores conversational warmth, trust, and willingness to share general information with AI chat tools.</p><div className="facts"><div><small>WHO CAN PARTICIPATE</small><b>Adults aged 18+</b><span>Previous AI chatbot users</span></div><div><small>ESTIMATED TIME</small><b>10–12 minutes</b><span>One-time questionnaire</span></div></div><aside><ShieldCheck size={18}/> Do not enter your name, contact details, passwords, financial information, medical records, or other sensitive information.</aside><button className="primary wide" onClick={()=>S(1)}>Start questionnaire <ArrowRight size={17}/></button><p className="tiny center">Participation is voluntary.</p></>}
   {step===1&&<><div className="kicker">STEP 1 OF 7</div><h2>Consent and eligibility</h2><p className="muted">Read the participant information and confirm your eligibility.</p><div className="consent"><b>Participant information</b><p>This academic study examines adults' perceptions of conversational AI tools such as ChatGPT, Google Gemini, Microsoft Copilot, and similar chatbots.</p><p>Your participation is voluntary. You may stop before submitting your answers. This questionnaire does not ask for your name or direct contact details. Once an anonymous response has been submitted, it may not be possible to identify and withdraw that response.</p><p>Responses will be used for academic research. The approved researcher contact, data storage, access, and retention details must be supplied before the survey is launched.</p><p>Do not disclose sensitive personal information.</p></div><Field label="Are you 18 years of age or older?" required><Choices value={age} set={A} options={['yes','no']}/></Field><Field label="Have you previously used a conversational AI tool?" required><Choices value={used} set={U} options={['yes','no']}/></Field><label className="consentcheck"><input type="checkbox" checked={consent} onChange={e=>C(e.target.checked)}/> I have read the information above and voluntarily agree to participate. <b>*</b></label><Nav back={back} next={next}/></>}
   {step===2&&<><div className="kicker">STEP 2 OF 7</div><h2>About you</h2><p className="muted">Please provide general details only.</p><Field label="Age group" required><Select value={p.age_group} set={v=>set('age_group',v)} opts={['18–24 years','25–34 years','35–44 years','45 years or above']}/></Field><Field label="Gender"><Select value={p.gender} set={v=>set('gender',v)} opts={['Male','Female','Other','Prefer not to say']} optional/></Field><Field label="Highest educational qualification" required><Select value={p.education} set={v=>set('education',v)} opts={['Secondary','Higher Secondary','Undergraduate','Postgraduate','Other']}/></Field><Field label="Current occupation"><Select value={p.occupation} set={v=>set('occupation',v)} opts={['Student','Government employee','Private-sector employee','Business / Self-employed','Other','Prefer not to say']} optional/></Field><Nav back={back} next={next}/></>}
   {step===3&&<><div className="kicker">STEP 3 OF 7</div><h2>Your AI experience</h2><p className="muted">Answer based on your use of conversational AI tools.</p><Field label="Which conversational AI tools have you used?" required><Multi vals={p.ai_tools} toggle={v=>toggle('ai_tools',v)} opts={toolOpts}/></Field><Field label="How frequently do you use conversational AI?" required><Select value={p.ai_frequency} set={v=>set('ai_frequency',v)} opts={['Daily','Several times a week','Once a week','A few times a month','Rarely']}/></Field><Field label="How long have you been using conversational AI?" required><Select value={p.ai_duration} set={v=>set('ai_duration',v)} opts={['Less than 3 months','3–6 months','6–12 months','1–2 years','More than 2 years']}/></Field><Field label="What do you mainly use conversational AI for?" required><Multi vals={p.ai_purpose} toggle={v=>toggle('ai_purpose',v)} opts={purposeOpts}/></Field><Field label="How familiar are you with conversational AI tools?" required><Select value={p.ai_familiarity} set={v=>set('ai_familiarity',v)} opts={['Not very familiar','Slightly familiar','Moderately familiar','Very familiar','Extremely familiar']}/></Field><Nav back={back} next={next}/></>}
   {scale&&<><div className="kicker">STEP {step} OF 7 · MEASUREMENT</div><h2>{scale.title}</h2><p className="muted">{scale.description} Select one response for each statement.</p><div className="scalehint"><span>1 = Strongly disagree</span><span>5 = Strongly agree</span></div>{scale.items.map((q,i)=>{const k=`${scale.prefix}_${i+1}`;return <div className="question" key={k}><div className="qtext"><span>{i+1}</span>{q}<b>*</b></div><div className="likert">{likert.map(([v,label])=><label className={Number(a[k])===Number(v)?'chosen':''} key={v}><input type="radio" name={k} checked={Number(a[k])===Number(v)} onChange={()=>Q(old=>({...old,[k]:Number(v)}))}/><strong>{v}</strong><small>{label}</small></label>)}</div></div>})}<Nav back={back} next={next} label={step===6?'Review answers':'Continue'}/></>}
   {step===7&&<><div className="kicker">FINAL STEP · REVIEW</div><h2>Review and submit</h2><p className="muted">Please confirm that you have completed the questionnaire. Your responses will be submitted without direct identifiers.</p><div className="review"><Row label="Age group" value={p.age_group}/><Row label="AI tools" value={p.ai_tools.join(', ')}/><Row label="AI frequency" value={p.ai_frequency}/><Row label="Conversational warmth" value="8 of 8 answered"/><Row label="Perceived trust" value="9 of 9 answered"/><Row label="Willingness to self-disclose" value="9 of 9 answered"/></div><aside><ShieldCheck size={18}/> By submitting, you confirm that your answers reflect your own experience and contain no sensitive personal information.</aside><div className="nav"><button className="secondary" onClick={back}><ArrowLeft size={16}/> Back</button><button className="primary" disabled={busy} onClick={submit}>{busy?'Submitting…':'Submit response'} <ArrowRight size={17}/></button></div></>}
   {step===8&&<div className="success"><div><CheckCircle2 size={38}/></div><div className="kicker">RESPONSE SUBMITTED</div><h2>Thank you for participating.</h2><p className="muted">Your questionnaire response has been submitted successfully. Your contribution is appreciated.</p></div>}
   {err&&<div className="error" role="alert">{err}</div>}
  </section><footer><span>Academic research questionnaire</span><span>Conversational AI Study</span></footer>
  {!configured&&<div className="warning">Setup required: configure Supabase environment variables before publishing this survey.</div>}
 </main>;
}
function Field({label,required,children}){return <div className="field"><label>{label} {required&&<b>*</b>}</label>{children}</div>}
function Select({value,set,opts,optional}){return <select value={value} onChange={e=>set(e.target.value)}><option value="">{optional?'Select an option (optional)':'Select an option'}</option>{opts.map(x=><option key={x}>{x}</option>)}</select>}
function Choices({value,set,options}){return <div className="choices">{options.map(v=><label className={value===v?'active':''} key={v}><input type="radio" checked={value===v} onChange={()=>set(v)}/>{v==='yes'?'Yes':'No'}</label>)}</div>}
function Multi({vals,toggle,opts}){return <div className="multi">{opts.map(v=><label className={vals.includes(v)?'active':''} key={v}><input type="checkbox" checked={vals.includes(v)} onChange={()=>toggle(v)}/>{v}</label>)}</div>}
function Nav({back,next,label='Continue'}){return <div className="nav"><button className="secondary" onClick={back}><ArrowLeft size={16}/> Back</button><button className="primary" onClick={next}>{label} <ArrowRight size={17}/></button></div>}
function Row({label,value}){return <div className="row"><span>{label}</span><b>{value||'—'}</b></div>}
