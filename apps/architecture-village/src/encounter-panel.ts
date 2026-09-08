import type {Encounter,Metrics} from './types';
import {beginEncounter,chooseEncounter,encounterScore,type EncounterRun} from './encounter-engine';
import {escapeHTML as h} from './ui';
export type BattleCallbacks={update:(kind:Encounter['kind']|null,metrics:Metrics,severity:number)=>void;complete:(score:number,tags:string[])=>void;recap?:(run:EncounterRun)=>string;next?:()=>void};
export function mountEncounter(host:HTMLElement,e:Encounter,callbacks:BattleCallbacks):()=>void {
  let run=beginEncounter(e),started=false,feedback=false,finished=false,timedOut=false,deadline=0;
  let interval:ReturnType<typeof setInterval>|undefined;
  const stop=()=>{if(interval)clearInterval(interval);interval=undefined;};
  function draw(){
    callbacks.update(started&&!finished?e.kind:null,run.metrics,run.turns-run.correct);
    if(!started){host.innerHTML=`<div class="monster-portrait ${e.kind}" aria-hidden="true"><span>◕</span><span>◕</span><i>⌁</i></div><div class="section-eyebrow">THỬ THÁCH TRADEOFF</div><h3>${h(e.name)}</h3><p>${h(e.intro)}</p><div class="encounter-rules"><p>Chọn kiến trúc theo requirement. Mỗi quyết định thay đổi thế giới.</p><p>Điểm ≥80% để chinh phục. Sai vẫn được đi tiếp và xem hậu quả.</p>${e.timeLimitSeconds?`<p>Giới hạn ${e.timeLimitSeconds/60} phút, tính cả thời gian đọc phản hồi.</p>`:''}</div><button class="primary" data-start>Đối mặt yêu quái →</button>`;host.querySelector<HTMLButtonElement>('[data-start]')!.onclick=()=>{started=true;if(e.timeLimitSeconds){deadline=Date.now()+e.timeLimitSeconds*1000;interval=setInterval(tick,250);}draw();};return;}
    if(run.nodeId===null&&!feedback||timedOut){
      if(!finished){finished=true;stop();callbacks.complete(timedOut?0:encounterScore(run),run.weakTags);callbacks.update(null,run.metrics,0);}
      const score=timedOut?0:encounterScore(run);
      host.innerHTML=`<div class="result-banner ${score>=80?'success':'retry'}"><span class="result-icon">${score>=80?'✦':'↻'}</span><h3>${timedOut?'Hết thời gian luyện tập':score>=80?'Đã vượt qua '+h(e.name):'Bạn đã tìm thấy điểm cần luyện'}</h3><strong>${score}%</strong><p>${run.correct}/${run.turns} quyết định phù hợp. ${timedOut?'Lượt hết giờ không nhận mastery.':'Điểm tốt nhất vẫn được giữ.'}</p></div><div class="battle-recap"><h4>Những quyết định vừa qua</h4>${run.history.map(item=>`<article><b>${item.correct?'✓':'↻'} ${h(item.choice)}</b><p>${h(item.feedback)}</p></article>`).join('')}${callbacks.recap?.(run)||''}<h4>Tự trình bày trong hai phút</h4><p>${h(e.reflectionPrompt)}</p></div><button class="primary" data-retry>Thử lại encounter</button>${callbacks.next?'<button class="secondary" data-next>Tiếp tục hành trình →</button>':''}`;
      host.querySelector<HTMLButtonElement>('[data-retry]')!.onclick=()=>{stop();run=beginEncounter(e);started=false;feedback=false;finished=false;timedOut=false;draw();};
      const next=host.querySelector<HTMLButtonElement>('[data-next]');if(next)next.onclick=()=>callbacks.next?.();return;
    }
    const node=e.nodes.find(n=>n.id===run.nodeId);
    const last=run.history.at(-1);
    host.innerHTML=`<div class="section-eyebrow">${h(e.name)} <span>${e.timeLimitSeconds?'<output id="boss-clock"></output>':`LƯỢT ${run.turns+Number(!feedback)}`}</span></div><div class="battle-health"><i style="width:${Math.max(0,100-run.correct*20)}%"></i></div>${feedback&&last?`<div class="feedback ${last.correct?'':'failure'}" role="status"><b>${last.correct?'✦ Yêu quái yếu đi':'⚡ Yêu quái tìm được khe hở'}</b><p>${h(last.feedback)}</p></div><div class="metric-changes">${Object.entries(run.metrics).map(([k,v])=>`<span>${metricName(k)} <b>${v}</b></span>`).join('')}</div><button class="primary" data-continue>${run.nodeId===null?'Xem kết quả':'Đối mặt tình huống tiếp theo'} →</button>`:`<p class="context">${h(node!.context)}</p><h3 class="question">${h(node!.prompt)}</h3>${run.history.some(i=>!i.correct)?'<p class="warning-note">Hệ thống đang mang hậu quả từ quyết định trước. Hãy cân nhắc phục hồi.</p>':''}<div class="answers">${node!.choices.map((c,i)=>`<button class="answer" data-choice="${h(c.id)}"><span>${String.fromCharCode(65+i)}</span>${h(c.label)}</button>`).join('')}</div>`}`;
    host.querySelectorAll<HTMLButtonElement>('[data-choice]').forEach(b=>b.onclick=()=>{if(e.timeLimitSeconds&&Date.now()>=deadline){timedOut=true;draw();return;}run=chooseEncounter(e,run,b.dataset.choice!);feedback=true;draw();});
    const next=host.querySelector<HTMLButtonElement>('[data-continue]');if(next)next.onclick=()=>{feedback=false;draw();};
    if(e.timeLimitSeconds)tick();
  }
  function tick(){if(!started||finished)return;const remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));const clock=host.querySelector('#boss-clock');if(clock)clock.textContent=`${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}`;if(remaining===0){timedOut=true;stop();draw();}}
  draw();return()=>{stop();callbacks.update(null,run.metrics,0);};
}
export function metricName(key:string){return({latency:'Độ trễ ↓',availability:'Sẵn sàng ↑',consistency:'Nhất quán ↑',throughput:'Thông lượng ↑',complexity:'Phức tạp ↓'} as Record<string,string>)[key]||key;}
