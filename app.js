const {lessons,questions,exams}=window.D2_DATA;
const C=['イ','ロ','ハ','ニ'],K='d2-study-v1';
let state;try{state=JSON.parse(localStorage.getItem(K))||fresh()}catch{state=fresh()}
function fresh(){return{attempts:0,correct:0,qStats:{},mistakes:[],past:{}}}
function save(){localStorage.setItem(K,JSON.stringify(state));home()}
function go(id){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===id));if(id==='review')renderReview();scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>go(b.dataset.view));document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
function home(){const a=state.attempts?Math.round(state.correct/state.attempts*100):null;accuracy.textContent=a==null?'—':a+'%';accuracyBar.style.width=(a||0)+'%';attempts.textContent=state.attempts+'問';mistakes.textContent=state.mistakes.length+'問'}
home();
lessonList.innerHTML=lessons.map(x=>`<details class="lesson"><summary><span class="badge">${x.cat}</span> ${x.title}</summary><p>${x.body}</p></details>`).join('');

const cats=['すべて',...new Set(questions.map(x=>x.cat))];
let cat='すべて',q=null,answered=false,count=0;
const decks=new Map();
function shuffled(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function poolFor(c=cat){return c==='すべて'?questions:questions.filter(x=>x.cat===c)}
function resetDeck(c=cat,avoidId=null){let ids=shuffled(poolFor(c).map(x=>x.id));if(ids.length>1&&ids[0]===avoidId){const n=ids.findIndex(id=>id!==avoidId);[ids[0],ids[n]]=[ids[n],ids[0]]}decks.set(c,ids)}
function nextFromDeck(){let deck=decks.get(cat);if(!deck||!deck.length)resetDeck(cat,q?.id);deck=decks.get(cat);return questions.find(x=>x.id===deck.shift())}
function chips(){categoryChips.innerHTML=cats.map(x=>`<button class="chip ${x===cat?'active':''}" data-cat="${x}">${x}</button>`).join('');categoryChips.querySelectorAll('button').forEach(b=>b.onclick=()=>{cat=b.dataset.cat;chips();pick()})}
function pick(id){q=id?questions.find(x=>x.id===id):nextFromDeck();if(!q)return;answered=false;count++;qCategory.textContent=q.cat;qNo.textContent=`問題 ${count} / この分野 ${poolFor().length}問`;qText.textContent=q.q;qExplain.hidden=true;nextBtn.hidden=true;qOptions.innerHTML=q.o.map((x,i)=>`<button class="option" data-i="${i}"><b>${C[i]}.</b> ${x}</button>`).join('');qOptions.querySelectorAll('button').forEach(b=>b.onclick=()=>answer(+b.dataset.i))}
function answer(i){if(answered)return;answered=true;state.attempts++;state.qStats[q.id]??={attempts:0,correct:0};state.qStats[q.id].attempts++;const ok=i===q.a;if(ok){state.correct++;state.qStats[q.id].correct++;state.mistakes=state.mistakes.filter(x=>x!==q.id)}else if(!state.mistakes.includes(q.id))state.mistakes.unshift(q.id);qOptions.querySelectorAll('button').forEach((b,n)=>{b.disabled=true;if(n===q.a)b.classList.add('correct');if(n===i&&!ok)b.classList.add('wrong')});qExplain.innerHTML=`<b>${ok?'正解':'不正解'}</b><br>${q.e}`;qExplain.hidden=false;nextBtn.hidden=false;save()}
chips();pick();randomBtn.onclick=()=>pick();nextBtn.onclick=()=>pick();

function renderReview(){reviewList.innerHTML=state.mistakes.length?state.mistakes.map(id=>{const x=questions.find(y=>y.id===id),s=state.qStats[id]||{};if(!x)return'';return `<article class="card reviewItem"><span class="badge">${x.cat}</span><p><b>${x.q}</b></p><p class="muted">${s.correct||0}正解 / ${s.attempts||0}回答</p><button class="btn" data-review="${id}">解き直す</button></article>`}).join(''):'<article class="card">現在、要復習問題はありません。</article>';reviewList.querySelectorAll('[data-review]').forEach(b=>b.onclick=()=>{cat='すべて';chips();pick(b.dataset.review);go('quiz')})}

exams.forEach(x=>{const o=document.createElement('option');o.value=x.id;o.textContent=x.name;examSelect.append(o)});
let exam=exams[0],sec=7200,timerHandle=null;
function loadExam(){exam=exams.find(x=>x.id===examSelect.value)||exams[0];state.past[exam.id]??={answers:Array(50).fill(null),lastScore:null};examSource.textContent=exam.source+'。問題本文は公式PDFを別タブで開いてください。';renderGrid();examResult.textContent=state.past[exam.id].lastScore==null?'':`前回：${state.past[exam.id].lastScore}/50（${state.past[exam.id].lastScore*2}点）`}
function renderGrid(mark=false){const a=state.past[exam.id].answers;answerGrid.innerHTML=Array.from({length:50},(_,i)=>{const cls=mark&&a[i]?(a[i]===exam.key[i]?' ok':' ng'):'';return `<div class="answerRow${cls}"><b>問 ${i+1}</b><div class="answerChoices">${C.map(c=>`<button class="${a[i]===c?'sel':''}" data-q="${i}" data-c="${c}">${c}</button>`).join('')}</div></div>`}).join('');answerGrid.querySelectorAll('button').forEach(b=>b.onclick=()=>{a[+b.dataset.q]=b.dataset.c;save();renderGrid()})}
examSelect.onchange=loadExam;pdfBtn.onclick=()=>open(exam.pdf,'_blank','noopener');scoreBtn.onclick=()=>{const a=state.past[exam.id].answers,s=a.reduce((n,x,i)=>n+(x===exam.key[i]),0),done=a.filter(Boolean).length;state.past[exam.id].lastScore=s;save();renderGrid(true);examResult.textContent=`${s}/50（${s*2}点） / 回答済み ${done}/50 ${s>=30?'— 60点以上':'— 30問正解まであと '+(30-s)+'問'}`};clearExamBtn.onclick=()=>{if(confirm('この回の解答をすべて消しますか？')){state.past[exam.id]={answers:Array(50).fill(null),lastScore:null};save();loadExam()}};
function showTimer(){timer.textContent=`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`}
timerBtn.onclick=()=>{if(timerHandle){clearInterval(timerHandle);timerHandle=null;timerBtn.textContent='再開';return}if(sec<=0)sec=7200;timerBtn.textContent='一時停止';timerHandle=setInterval(()=>{sec--;showTimer();if(sec<=0){clearInterval(timerHandle);timerHandle=null;alert('120分経過しました。');timerBtn.textContent='120分開始'}},1000)};showTimer();loadExam();

function exportState(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='d2-study-progress.json';a.click();URL.revokeObjectURL(a.href)}
exportBtn.onclick=exportState;backupBtn.onclick=exportState;importBtn.onclick=()=>importFile.click();importFile.onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const x=JSON.parse(await f.text());state={...fresh(),...x};save();loadExam();renderReview();alert('進捗を読み込みました。')}catch{alert('JSONを読み込めませんでした。')}e.target.value=''};resetBtn.onclick=()=>{if(confirm('全進捗を消去しますか？')){state=fresh();save();loadExam();renderReview()}};
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true,ios=/iPad|iPhone|iPod/.test(navigator.userAgent);if(ios&&!standalone&&localStorage.getItem('d2-install-hint')!=='dismissed')installHint.hidden=false;dismissInstall.onclick=()=>{installHint.hidden=true;localStorage.setItem('d2-install-hint','dismissed')};if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.error));