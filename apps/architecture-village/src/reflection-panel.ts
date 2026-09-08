import type {ModuleProgress} from './types';
import {escapeHTML as h,rubricLabels} from './ui';
export function mountReflection(host:HTMLElement,prompt:string,state:ModuleProgress,onChange:()=>void):()=>void {
  let end=0,seconds=90,expired=false,interval:ReturnType<typeof setInterval>|undefined;
  const stop=()=>{if(interval)clearInterval(interval);interval=undefined;};
  function saveDraft(){state.reflection=false;onChange();}
  function draw(){
    stop();
    const showRubric=state.reflectionMode==='write'||expired||state.reflection;
    host.innerHTML=`<div class="section-eyebrow">LUYỆN GIẢI THÍCH <span>60–90 GIÂY</span></div><h3>Nói như đang ở trong interview</h3><p class="prompt">${h(prompt)}</p><div class="segmented"><button data-mode="write" aria-pressed="${state.reflectionMode==='write'}">✎ Viết lời giải</button><button data-mode="speak" aria-pressed="${state.reflectionMode==='speak'}">◷ Nói thành lời</button></div>${state.reflectionMode==='write'?`<label for="reflection-text" class="field-label">Quyết định, lý do, tradeoff và phương án thay thế</label><textarea id="reflection-text" rows="6" maxlength="10000" placeholder="Tôi chọn… vì requirement… Đánh đổi là… Khi… tôi sẽ đổi sang…">${h(state.reflectionText)}</textarea><small>Được lưu trên thiết bị. Không được AI chấm điểm.</small>`:`<div class="speak-box"><p>Chỉ có đồng hồ. Không thu âm hay yêu cầu microphone.</p><label>Thời lượng <select id="speak-duration"><option value="60" ${seconds===60?'selected':''}>60 giây</option><option value="90" ${seconds===90?'selected':''}>90 giây</option></select></label><output id="speak-clock" aria-live="off">${expired?'00:00':`01:${seconds===60?'00':'30'}`}</output><button class="secondary" data-speak>${expired?'Luyện lại':'Bắt đầu nói'}</button><div id="speak-status" role="status">${expired?'Đã hết giờ. Hãy tự đối chiếu rubric.':''}</div></div>`}<section id="rubric" ${showRubric?'':'hidden'}><h4>Tự đối chiếu lời giải của bạn</h4><p class="small">Đánh dấu những ý bạn đã thực sự giải thích; đây là tự đánh giá.</p>${rubricLabels.map((label,i)=>`<label class="check-row"><input type="checkbox" data-rubric="${i}" ${state.rubric[i]?'checked':''}>${label}</label>`).join('')}<button class="primary" data-reflect ${canFinish()?'':'disabled'}>${state.reflection?'✓ Đã hoàn tất reflection':'Lưu reflection'}</button></section>`;
    host.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b=>b.onclick=()=>{state.reflectionMode=b.dataset.mode as 'write'|'speak';expired=false;state.rubric=[false,false,false,false,false];saveDraft();draw();});
    const text=host.querySelector<HTMLTextAreaElement>('#reflection-text');if(text)text.oninput=()=>{state.reflectionText=text.value;saveDraft();updateButton();};
    const duration=host.querySelector<HTMLSelectElement>('#speak-duration');if(duration)duration.onchange=()=>{seconds=Number(duration.value);expired=false;draw();};
    const start=host.querySelector<HTMLButtonElement>('[data-speak]');if(start)start.onclick=()=>{
      stop();expired=false;state.rubric=[false,false,false,false,false];saveDraft();host.querySelector<HTMLElement>('#rubric')!.hidden=true;end=Date.now()+seconds*1000;start.disabled=true;if(duration)duration.disabled=true;
      const tick=()=>{const remaining=Math.max(0,Math.ceil((end-Date.now())/1000));host.querySelector('#speak-clock')!.textContent=`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`;
        if(remaining===0){stop();expired=true;draw();}};tick();interval=setInterval(tick,250);
    };
    host.querySelectorAll<HTMLInputElement>('[data-rubric]').forEach(b=>b.onchange=()=>{state.rubric[Number(b.dataset.rubric)]=b.checked;saveDraft();updateButton();});
    host.querySelector<HTMLButtonElement>('[data-reflect]')!.onclick=()=>{if(canFinish()){state.reflection=true;onChange();draw();}};
  }
  function canFinish(){return state.rubric.every(Boolean)&&(state.reflectionMode==='write'?state.reflectionText.trim().length>=40:expired||state.reflection);}
  function updateButton(){const b=host.querySelector<HTMLButtonElement>('[data-reflect]');if(b){b.disabled=!canFinish();b.textContent='Lưu reflection';}}
  draw();return stop;
}
