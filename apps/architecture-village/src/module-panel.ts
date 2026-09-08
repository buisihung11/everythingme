import type {LearningModule,ModuleProgress,Encounter,Metrics} from './types';
import {learningLabs} from './learning-labs';
import {mastered} from './progress';
import {mountQuiz} from './quiz-panel';
import {mountEncounter} from './encounter-panel';
import {mountReflection} from './reflection-panel';
import {escapeHTML as h} from './ui';
export type ModuleCallbacks={save:()=>void;score:(kind:'quiz'|'encounter',score:number,tags:string[])=>void;battle:(kind:Encounter['kind']|null,metrics:Metrics,severity:number)=>void;next:()=>void};
export function mountModule(host:HTMLElement,m:LearningModule,state:ModuleProgress,callbacks:ModuleCallbacks):()=>void {
  let step='lesson',disposeStep:()=>void=()=>{};
  const stages=[['lesson','01','Bài học'],['lab','02','Thí nghiệm'],['encounter','03','Yêu quái'],['quiz','04','Quiz'],['reflection','05','Giải thích']];
  function isDone(id:string){return id==='quiz'?state.quizBest>=80:id==='encounter'?state.encounterBest>=80:state[id as 'lesson'|'lab'|'reflection'];}
  function draw(){
    disposeStep();disposeStep=()=>{};
    host.innerHTML=`<div class="module-title"><div class="section-eyebrow">${h(m.place)} <span>◷ ${m.duration} PHÚT</span></div><h2>${h(m.title)}</h2><p class="guide"><span style="--spirit:${m.color}" class="guide-avatar">•ᴗ•</span><span><b>${h(m.spirit)}</b><small>Linh thú đồng hành</small></span><span class="mastery-badge">${mastered(state)?'✦ Mastered':'Foundation'}</span></p></div><div class="learning-steps" aria-label="Các bước học">${stages.map(([id,n,label])=>`<button data-step="${id}" aria-pressed="${step===id}"><span>${isDone(id)?'✓':n}</span>${label}</button>`).join('')}</div><div class="module-content" id="learning-content"></div><footer class="lesson-footer"><a href="${h(m.source)}" target="_blank" rel="noreferrer">Hello Interview · đọc nguồn ↗</a><span>Biên soạn tiếng Việt · Mid–Senior</span></footer>`;
    host.querySelectorAll<HTMLButtonElement>('[data-step]').forEach(b=>b.onclick=()=>{step=b.dataset.step!;draw();});
    const content=host.querySelector<HTMLElement>('#learning-content')!;
    if(step==='lesson'){
      content.innerHTML=`<div class="objectives"><h3>Sau bài này, bạn có thể…</h3><ul>${m.objectives.map(o=>`<li>${h(o)}</li>`).join('')}</ul></div>${m.sections.map((s,i)=>`<article class="concept-card"><span class="concept-number">${String(i+1).padStart(2,'0')}</span><h3>${h(s.title)}</h3><p>${h(s.body)}</p><div class="worked-example"><b>Tình huống phỏng vấn</b><p>${h(s.example)}</p></div><p class="takeaway">↳ ${h(s.takeaway)}</p></article>`).join('')}<button class="primary" data-read>${state.lesson?'Tiếp tục đến thí nghiệm':'Tôi đã học bài này'} →</button>`;
      content.querySelector<HTMLButtonElement>('[data-read]')!.onclick=()=>{state.lesson=true;callbacks.save();step='lab';draw();};
    }else if(step==='lab'){
      const lab=learningLabs[m.id];let interacted=false,value=lab.initial,mode=0;
      content.innerHTML=`<div class="section-eyebrow">PHÒNG THÍ NGHIỆM</div><h3>${h(lab.title)}</h3><p class="lab-task"><b>Nhiệm vụ</b> ${h(lab.task)}</p><label class="field-label" for="lab-mode">Chiến lược</label><select id="lab-mode">${lab.modes.map((name,i)=>`<option value="${i}">${h(name)}</option>`).join('')}</select><div class="lab-control"><label for="lab-value">${h(lab.label)}</label><output id="lab-output"></output><input id="lab-value" type="range" min="${lab.min}" max="${lab.max}" value="${value}"></div><div id="lab-result" aria-live="polite"></div><p class="small">Mô hình minh họa có giả định, không phải benchmark thực.</p><button class="primary" data-lab-done disabled>Hoàn thành nhiệm vụ để tiếp tục</button>`;
      function update(){const result=lab.run(value,mode);content.querySelector('#lab-output')!.textContent=`${value} ${lab.unit}`;content.querySelector('#lab-result')!.innerHTML=`<h3>${h(result.headline)}</h3><div class="flow-nodes">${result.nodes.map(n=>`<span>${h(n)}</span>`).join('<i>→</i>')}</div><p>${h(result.explanation)}</p>${result.goal&&interacted?'<p class="goal-met" role="status">✓ Nhiệm vụ đã đạt. Bạn đã quan sát sự đánh đổi.</p>':''}`;const btn=content.querySelector<HTMLButtonElement>('[data-lab-done]')!;btn.disabled=!result.goal||!interacted;btn.textContent=result.goal&&interacted?'Lưu thí nghiệm & gặp yêu quái →':'Hoàn thành nhiệm vụ để tiếp tục';}
      content.querySelector<HTMLSelectElement>('#lab-mode')!.onchange=e=>{mode=Number((e.target as HTMLSelectElement).value);interacted=true;update();};
      content.querySelector<HTMLInputElement>('#lab-value')!.oninput=e=>{value=Number((e.target as HTMLInputElement).value);interacted=true;update();};
      content.querySelector<HTMLButtonElement>('[data-lab-done]')!.onclick=()=>{if(interacted&&lab.run(value,mode).goal){state.lab=true;callbacks.save();step='encounter';draw();}};update();
    }else if(step==='encounter'){
      disposeStep=mountEncounter(content,m.encounter,{update:callbacks.battle,complete:(score,tags)=>{callbacks.score('encounter',score,tags);},next:()=>{step='quiz';draw();}});
    }else if(step==='quiz'){
      disposeStep=mountQuiz(content,m.quiz,(score,tags)=>{callbacks.score('quiz',score,tags);});
      const next=document.createElement('button');next.className='secondary';next.textContent='Tiếp tục đến phần giải thích →';next.onclick=()=>{step='reflection';draw();};host.querySelector('.lesson-footer')!.before(next);
    }else{
      disposeStep=mountReflection(content,m.encounter.reflectionPrompt,state,()=>{callbacks.save();updateMastery();});
      const next=document.createElement('button');next.className='primary next-quest';next.dataset.nextQuest='';next.onclick=()=>callbacks.next();host.querySelector('.lesson-footer')!.before(next);updateMastery();
    }
  }
  function updateMastery(){const badge=host.querySelector('.mastery-badge');if(badge)badge.textContent=mastered(state)?'✦ Mastered':'Foundation';const next=host.querySelector<HTMLButtonElement>('[data-next-quest]');if(next){const missing=[!state.lesson&&'bài học',!state.lab&&'lab',state.encounterBest<80&&'encounter ≥80%',state.quizBest<80&&'quiz ≥80%',!state.reflection&&'reflection'].filter(Boolean);next.disabled=!mastered(state);next.textContent=mastered(state)?'✦ Đến địa điểm tiếp theo →':`Còn: ${missing.join(', ')}`;}}
  draw();return()=>disposeStep();
}
