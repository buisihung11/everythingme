import type {QuizQuestion} from './types';
import {escapeHTML as h} from './ui';
import {text,type Locale} from './locale';
export function mountQuiz(host:HTMLElement,questions:QuizQuestion[],complete:(score:number,tags:string[])=>void,locale:Locale='vi'):()=>void {
  let index=0,answers:number[]=[],checked=false,done=false;
  function draw(){
    if(index===questions.length){
      const score=Math.round(100*answers.filter((v,i)=>v===questions[i].answer).length/questions.length);
      if(!done){done=true;complete(score,questions.filter((q,i)=>answers[i]!==q.answer).map(q=>q.tag));}
      host.innerHTML=`<div class="result-banner ${score>=80?'success':'retry'}"><span class="result-icon">${score>=80?'✺':'♧'}</span><h3>${score>=80?text(locale,'Kiến thức đã bén rễ','Knowledge took root'):text(locale,'Mỗi lần thử là một lần hiểu sâu','Every retry sharpens the idea')}</h3><strong>${score}%</strong><p>${text(locale,'Cần ít nhất 80%. Điểm cao nhất luôn được giữ.','You need at least 80%. Your best score is always kept.')}</p></div><div class="review-answers">${questions.map((q,i)=>`<article><b>${answers[i]===q.answer?'✓':'↻'} ${h(q.prompt)}</b><p>${h(q.explanation)}</p></article>`).join('')}</div><button class="primary" data-retry>${text(locale,'Ôn lại 5 câu','Retry 5 questions')}</button>`;
      host.querySelector<HTMLButtonElement>('[data-retry]')!.onclick=()=>{index=0;answers=[];done=false;checked=false;draw();};return;
    }
    const q=questions[index];
    host.innerHTML=`<div class="section-eyebrow">${text(locale,'KIỂM TRA KIẾN THỨC','KNOWLEDGE CHECK')} <span>${index+1} / ${questions.length}</span></div><div class="step-track">${questions.map((_,i)=>`<i class="${i<=index?'filled':''}"></i>`).join('')}</div><h3 class="question">${h(q.prompt)}</h3><div class="answers">${q.options.map((o,i)=>`<button class="answer ${checked?(i===q.answer?'correct':i===answers[index]?'wrong':''):answers[index]===i?'chosen':''}" data-answer="${i}" ${checked?'disabled':''}><span>${String.fromCharCode(65+i)}</span>${h(o)}</button>`).join('')}</div>${checked?`<div class="feedback" role="status"><b>${answers[index]===q.answer?text(locale,'✓ Đúng rồi','✓ Correct'):text(locale,'Cùng xem điều gì xảy ra','Let us inspect the tradeoff')}</b><p>${h(q.explanation)}</p></div><button class="primary" data-next>${index===questions.length-1?text(locale,'Xem kết quả','See result'):text(locale,'Câu tiếp theo','Next question')} →</button>`:`<button class="primary" data-check ${answers[index]===undefined?'disabled':''}>${text(locale,'Kiểm tra đáp án','Check answer')}</button>`}`;
    host.querySelectorAll<HTMLButtonElement>('[data-answer]').forEach(b=>b.onclick=()=>{answers[index]=Number(b.dataset.answer);draw();});
    const check=host.querySelector<HTMLButtonElement>('[data-check]');if(check)check.onclick=()=>{checked=true;draw();};
    const next=host.querySelector<HTMLButtonElement>('[data-next]');if(next)next.onclick=()=>{index++;checked=false;draw();};
  }
  draw();return()=>{host.innerHTML='';};
}
