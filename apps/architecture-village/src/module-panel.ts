import type {LearningModule,ModuleProgress,Encounter,Metrics} from './types';
import {mastered} from './progress';
import {mountQuiz} from './quiz-panel';
import {mountEncounter} from './encounter-panel';
import {mountReflection} from './reflection-panel';
import {escapeHTML as h} from './ui';
import {labView,text,uiText,type Locale} from './locale';
export type ModuleCallbacks={save:()=>void;score:(kind:'quiz'|'encounter',score:number,tags:string[])=>void;battle:(kind:Encounter['kind']|null,metrics:Metrics,severity:number)=>void;next:()=>void};
export function mountModule(host:HTMLElement,m:LearningModule,state:ModuleProgress,callbacks:ModuleCallbacks,locale:Locale='vi'):()=>void {
  let step='lesson',disposeStep:()=>void=()=>{};
  const stages=uiText.stages(locale);
  function isDone(id:string){return id==='quiz'?state.quizBest>=80:id==='encounter'?state.encounterBest>=80:state[id as 'lesson'|'lab'|'reflection'];}
  function draw(){
    disposeStep();disposeStep=()=>{};
    host.innerHTML=`<div class="module-title"><div class="section-eyebrow">${h(m.place)} <span>◷ ${m.duration} ${text(locale,'PHÚT','MIN')}</span></div><h2>${h(m.title)}</h2><p class="guide"><span style="--spirit:${m.color}" class="guide-avatar">•ᴗ•</span><span><b>${h(m.spirit)}</b><small>${text(locale,'Linh thú đồng hành','Companion guide')}</small></span><span class="mastery-badge">${mastered(state)?'✦ Mastered':'Foundation'}</span></p></div><div class="learning-steps" aria-label="${text(locale,'Các bước học','Learning steps')}">${stages.map(([id,n,label])=>`<button data-step="${id}" aria-pressed="${step===id}"><span>${isDone(id)?'✓':n}</span>${label}</button>`).join('')}</div><div class="module-content" id="learning-content"></div><footer class="lesson-footer"><a href="${h(m.source)}" target="_blank" rel="noreferrer">Hello Interview · ${text(locale,'đọc nguồn','source')} ↗</a><span>${text(locale,'Biên soạn tiếng Việt','Original English edition')} · Mid-Senior</span></footer>`;
    host.querySelectorAll<HTMLButtonElement>('[data-step]').forEach(b=>b.onclick=()=>{step=b.dataset.step!;draw();});
    const content=host.querySelector<HTMLElement>('#learning-content')!;
    if(step==='lesson'){
      content.innerHTML=`<div class="objectives"><h3>${text(locale,'Sau bài này, bạn có thể…','After this module, you can...')}</h3><ul>${m.objectives.map(o=>`<li>${h(o)}</li>`).join('')}</ul></div>${m.sections.map((s,i)=>`<article class="concept-card"><span class="concept-number">${String(i+1).padStart(2,'0')}</span><h3>${h(s.title)}</h3><p>${h(s.body)}</p><div class="worked-example"><b>${text(locale,'Tình huống phỏng vấn','Interview scenario')}</b><p>${h(s.example)}</p></div><p class="takeaway">↳ ${h(s.takeaway)}</p></article>`).join('')}<button class="primary" data-read>${state.lesson?text(locale,'Tiếp tục đến thí nghiệm','Continue to lab'):text(locale,'Tôi đã học bài này','I studied this lesson')} →</button>`;
      content.querySelector<HTMLButtonElement>('[data-read]')!.onclick=()=>{state.lesson=true;callbacks.save();step='lab';draw();};
    }else if(step==='lab'){
      const lab=labView(m.id,locale);let interacted=false,value=lab.initial,mode=0;
      content.innerHTML=`<div class="section-eyebrow">${text(locale,'PHÒNG THÍ NGHIỆM','LAB')}</div><h3>${h(lab.title)}</h3><p class="lab-task"><b>${text(locale,'Nhiệm vụ','Task')}</b> ${h(lab.task)}</p><label class="field-label" for="lab-mode">${text(locale,'Chiến lược','Strategy')}</label><select id="lab-mode">${lab.modes.map((name,i)=>`<option value="${i}">${h(name)}</option>`).join('')}</select><div class="lab-control"><label for="lab-value">${h(lab.label)}</label><output id="lab-output"></output><input id="lab-value" type="range" min="${lab.min}" max="${lab.max}" value="${value}"></div><div id="lab-result" aria-live="polite"></div><p class="small">${text(locale,'Mô hình minh họa có giả định, không phải benchmark thực.','Teaching model with assumptions, not a production benchmark.')}</p><button class="primary" data-lab-done disabled>${text(locale,'Hoàn thành nhiệm vụ để tiếp tục','Complete the task to continue')}</button>`;
      function update(){const result=lab.run(value,mode);content.querySelector('#lab-output')!.textContent=`${value} ${lab.unit}`;content.querySelector('#lab-result')!.innerHTML=`<h3>${h(result.headline)}</h3><div class="flow-nodes">${result.nodes.map(n=>`<span>${h(n)}</span>`).join('<i>→</i>')}</div><p>${h(result.explanation)}</p>${result.goal&&interacted?`<p class="goal-met" role="status">✓ ${text(locale,'Nhiệm vụ đã đạt. Bạn đã quan sát sự đánh đổi.','Task complete. You observed the tradeoff.')}</p>`:''}`;const btn=content.querySelector<HTMLButtonElement>('[data-lab-done]')!;btn.disabled=!result.goal||!interacted;btn.textContent=result.goal&&interacted?text(locale,'Lưu thí nghiệm & gặp yêu quái →','Save lab and start encounter →'):text(locale,'Hoàn thành nhiệm vụ để tiếp tục','Complete the task to continue');}
      content.querySelector<HTMLSelectElement>('#lab-mode')!.onchange=e=>{mode=Number((e.target as HTMLSelectElement).value);interacted=true;update();};
      content.querySelector<HTMLInputElement>('#lab-value')!.oninput=e=>{value=Number((e.target as HTMLInputElement).value);interacted=true;update();};
      content.querySelector<HTMLButtonElement>('[data-lab-done]')!.onclick=()=>{if(interacted&&lab.run(value,mode).goal){state.lab=true;callbacks.save();step='encounter';draw();}};update();
    }else if(step==='encounter'){
      disposeStep=mountEncounter(content,m.encounter,{update:callbacks.battle,complete:(score,tags)=>{callbacks.score('encounter',score,tags);updateMastery();},next:()=>{step='quiz';draw();}},locale);
    }else if(step==='quiz'){
      disposeStep=mountQuiz(content,m.quiz,(score,tags)=>{callbacks.score('quiz',score,tags);updateMastery();},locale);
      const next=document.createElement('button');next.className='secondary';next.textContent=text(locale,'Tiếp tục đến phần giải thích →','Continue to reflection →');next.onclick=()=>{step='reflection';draw();};host.querySelector('.lesson-footer')!.before(next);
    }else{
      disposeStep=mountReflection(content,m.encounter.reflectionPrompt,state,()=>{callbacks.save();updateMastery();},locale);
      const next=document.createElement('button');next.className='primary next-quest';next.dataset.nextQuest='';next.onclick=()=>callbacks.next();host.querySelector('.lesson-footer')!.before(next);updateMastery();
    }
  }
  function updateMastery(){host.querySelectorAll<HTMLElement>('[data-step]').forEach(b=>{const stage=stages.find(s=>s[0]===b.dataset.step)!;b.querySelector('span')!.textContent=isDone(stage[0])?'✓':stage[1];});const badge=host.querySelector('.mastery-badge');if(badge)badge.textContent=mastered(state)?'✦ Mastered':'Foundation';const next=host.querySelector<HTMLButtonElement>('[data-next-quest]');if(next){const missing=[!state.lesson&&text(locale,'bài học','lesson'),!state.lab&&'lab',state.encounterBest<80&&'encounter ≥80%',state.quizBest<80&&'quiz ≥80%',!state.reflection&&'reflection'].filter(Boolean);next.disabled=!mastered(state);next.textContent=mastered(state)?text(locale,'✦ Đến địa điểm tiếp theo →','✦ Go to next place →'):`${text(locale,'Còn','Remaining')}: ${missing.join(', ')}`;}}
  draw();return()=>disposeStep();
}
