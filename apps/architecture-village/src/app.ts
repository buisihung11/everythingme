import './foundation.css';
import {curriculum,modules,villages,moduleById,villageById} from './curriculum';
import {loadProgress,mastered,bossReady,recordScore,recommended,foundationComplete,STORAGE_KEY} from './progress';
import {parseRoute} from './router';
import {renderWorld} from './world-map';
import {mountModule} from './module-panel';
import {mountEncounter,metricName} from './encounter-panel';
import {openJournal} from './journal';
import {escapeHTML as h,notify,query as $} from './ui';
import {loadLocale,saveLocale,text,moduleView,villageView,type Locale} from './locale';
import type {Encounter,Metrics,ProgressV2,Village} from './types';
import type {createScene} from './scene';

let loaded:{progress:ProgressV2;warning:string};
try{loaded=loadProgress(localStorage,curriculum);}catch{loaded={...loadProgress({getItem:()=>null},curriculum),warning:'Trình duyệt không cho phép lưu dữ liệu. Hãy export JSON trước khi đóng app.'};}
let progress=loaded.progress,storageWritable=!loaded.warning;
let locale:Locale=loadLocale(localStorage);
let disposePanel:()=>void=()=>{},scene:ReturnType<typeof createScene>|undefined,activeVillage:string|null=null;
let renderId=0,paused=false,night=false;
const initialMetrics:Metrics={latency:45,availability:60,consistency:60,throughput:45,complexity:35};
let battleState:{kind:Encounter['kind']|null;metrics:Metrics;severity:number}={kind:null,metrics:initialMetrics,severity:0};
$('#app').innerHTML=`<header class="site-header"><a class="brand" href="#/world"><span>✿</span> hearth<span class="brand-dot">.</span></a><span class="header-divider"></span><span class="brand-sub">SYSTEM DESIGN JOURNEY</span><nav><a href="#/world" class="header-link">◈ <span id="world-link-label">Bản đồ thế giới</span></a><button id="journal">▤ <span id="journal-label">Sổ hành trình</span></button><button id="language-toggle" class="language-toggle" type="button" aria-label="Switch language"></button></nav><span id="xp" class="xp">✧ 0 XP</span><span class="profile">HB</span></header><div class="app-layout"><aside class="journey-sidebar"><div class="eyebrow">CHƯƠNG 01</div><h2 id="sidebar-title">Gieo nền tảng.<br>Vững tư duy.</h2><p class="sidebar-intro" id="sidebar-intro">Một hành trình dành cho<br>System Design interview.</p><div class="journey-progress"><div><span>Foundation</span><b id="mastery-count">0 / 11</b></div><div class="progress-bar"><i id="mastery-fill"></i></div><small id="next-caption">Hạt mầm đầu tiên đang chờ bạn.</small></div><div id="journey-links"></div><a id="quest-link" class="quest-link" href="#/world"><span>➜</span><div id="quest-label">CHẶNG TIẾP THEO<b id="quest-title">Bắt đầu hành trình</b></div></a><div class="sidebar-footer">✳ <span id="study-label">HỌC CÓ MỤC TIÊU</span><p id="study-copy">Hiểu quyết định.<br>Giải thích được đánh đổi.</p><a href="https://www.hellointerview.com/learn/system-design/in-a-hurry/how-to-prepare" target="_blank" rel="noreferrer">Hello Interview roadmap ↗</a></div></aside><main id="main-content"></main></div><div id="notice" class="notice" role="status" hidden></div>`;
function updateLocaleChrome(){document.documentElement.lang=locale==='en'?'en':'vi';$('#language-toggle').textContent=locale==='en'?'VI':'EN';$('#world-link-label').textContent=text(locale,'Bản đồ thế giới','World map');$('#journal-label').textContent=text(locale,'Sổ hành trình','Journey journal');$('#sidebar-title').innerHTML=locale==='en'?'Plant foundations.<br>Build your thinking.':'Gieo nền tảng.<br>Vững tư duy.';$('#sidebar-intro').innerHTML=locale==='en'?'A journey for<br>System Design interviews.':'Một hành trình dành cho<br>System Design interview.';$('#quest-label').firstChild!.textContent=text(locale,'CHẶNG TIẾP THEO','NEXT QUEST');$('#study-label').textContent=text(locale,'HỌC CÓ MỤC TIÊU','LEARN WITH INTENT');$('#study-copy').innerHTML=locale==='en'?'Understand decisions.<br>Explain the tradeoffs.':'Hiểu quyết định.<br>Giải thích được đánh đổi.';}
function save(){
  progress.updatedAt=new Date().toISOString();
  if(storageWritable){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(progress));}catch{storageWritable=false;notify('Không thể lưu tự động. Tiến độ vẫn còn trong phiên; dùng Export JSON để giữ lại.');}}
  updateChrome();
  if(activeVillage&&document.querySelector('#village-overview'))overview(villageById(activeVillage));
}
function updateChrome(){
  updateLocaleChrome();
  const route=parseRoute(location.hash),count=modules.filter(m=>mastered(progress.modules[m.id])).length;
  $('#mastery-count').textContent=`${count} / 11`;$('#mastery-fill').style.width=`${count/11*100}%`;
  $('#next-caption').textContent=foundationComplete(curriculum,progress)?'✦ Cả nền tảng đã nở hoa.':`${11-count} hạt mầm chờ được vun trồng.`;
  $('#xp').textContent=`✧ ${count*100+Object.values(progress.bosses).filter(b=>b.best>=80).length*150} XP`;
  $('#journey-links').innerHTML=villages.map((v,i)=>{
    const active=route.kind!=='world'&&route.villageId===v.id;
    const vv=villageView(v,locale);return `<section class="sidebar-village ${active?'current':''}"><a class="village-link" href="#/village/${v.id}"><span class="village-index">0${i+1}</span><span>${h(vv.title)}</span><i>${progress.bosses[v.id].best>=80?'✦':'↗'}</i></a>${active?`<div class="sidebar-modules">${v.moduleIds.map(id=>{const m=moduleView(moduleById(id),locale),isActive=route.kind==='village'&&route.moduleId===id;return`<a href="#/village/${v.id}/module/${id}" class="${isActive?'selected':''}" ${isActive?'aria-current="page"':''}><span>${mastered(progress.modules[id])?'✓':'○'}</span>${h(m.title)}</a>`;}).join('')}<a class="boss-link ${route.kind==='boss'?'selected':''}" href="#/boss/${v.id}">⚔ ${bossReady(curriculum,progress,v.id)?text(locale,'Boss tổng kết','Village boss'):text(locale,'Boss · chưa mở','Boss · locked')}</a></div>`:''}</section>`;
  }).join('');
  const next=recommended(curriculum,progress);$<HTMLAnchorElement>('#quest-link').href=next;const target=parseRoute(next);
  $('#quest-title').textContent=target.kind==='world'?'Ôn lại các tradeoff':target.kind==='boss'?villageById(target.villageId).boss.name:moduleById(target.moduleId!).title;
  if(scene&&activeVillage){const selected=route.kind==='village'?route.moduleId:undefined;scene.statuses(Object.fromEntries(villageById(activeVillage).moduleIds.map(id=>[id,mastered(progress.modules[id])?'mastered':selected===id?'active':'available'])));}
}
function updateBattle(kind:Encounter['kind']|null,metrics:Metrics,severity:number){
  battleState={kind,metrics,severity};scene?.encounter(kind,Math.min(1,severity/5));scene?.metrics(metrics);
  const meter=document.querySelector('#system-meters');if(meter)meter.innerHTML=Object.entries(metrics).map(([key,value])=>`<div><span>${metricName(key)}</span><strong>${value}<small>/100</small></strong><div class="meter"><i style="width:${value}%"></i></div></div>`).join('');
  const label=document.querySelector('#scene-state');if(label)label.textContent=paused?'THẾ GIỚI TẠM NGHỈ':kind?'ĐANG ĐỐI MẶT YÊU QUÁI':'NGÔI LÀNG ĐANG SỐNG';
}
function clearScene(){scene?.dispose();scene=undefined;activeVillage=null;renderId++;}
async function buildVillage(v:Village){
  clearScene();activeVillage=v.id;const token=renderId;
  const vv=villageView(v,locale);$('#main-content').innerHTML=`<div class="village-heading"><div><a class="back-link" href="#/world">← ${text(locale,'Bản đồ thế giới','World map')}</a><div class="eyebrow">${h(vv.subtitle)}</div><h1>${h(vv.title)}</h1></div><button id="day" class="weather">☀ ${text(locale,'Ngày nắng','Sunny day')}</button></div><div class="village-workspace"><section class="village-stage"><div class="scene-frame"><div id="world" class="scene-host"></div><div class="scene-badge"><i></i><span id="scene-state">${text(locale,'NGÔI LÀNG ĐANG SỐNG','VILLAGE IS ALIVE')}</span></div><div class="scene-tools"><button id="zoom-in" aria-label="${text(locale,'Phóng to','Zoom in')}">+</button><button id="zoom-out" aria-label="${text(locale,'Thu nhỏ','Zoom out')}">−</button><button id="reset-camera" aria-label="${text(locale,'Đặt lại góc nhìn','Reset camera')}">⌖</button></div><div class="scene-hint">${text(locale,'Kéo để xoay · Cuộn để zoom · Chọn nơi để di chuyển','Drag to orbit · Scroll to zoom · Choose a place to travel')}</div></div><div class="system-panel"><div class="system-heading"><b><span class="live-dot"></span> ${text(locale,'Những đánh đổi đang diễn ra','Live tradeoffs')}</b><button id="pause">Ⅱ ${text(locale,'Tạm dừng','Pause')}</button></div><div id="system-meters" class="system-meters"></div><p>${text(locale,'Điểm định tính 0–100 của tình huống · không phải ms, QPS hay SLA','Qualitative scenario score 0–100 · not ms, QPS or SLA')}</p></div><div id="village-overview"></div></section><section class="learning-panel" id="learning-panel" aria-label="${text(locale,'Bài học và thử thách','Lessons and challenges')}"></section></div>`;
  updateBattle(null,initialMetrics,0);
  $('#day').textContent=night?`☾ ${text(locale,'Đêm yên bình','Quiet night')}`:`☀ ${text(locale,'Ngày nắng','Sunny day')}`;
  $('#pause').textContent=paused?`▷ ${text(locale,'Tiếp tục','Resume')}`:`Ⅱ ${text(locale,'Tạm dừng','Pause')}`;
  $('#day').onclick=()=>{night=!night;scene?.night(night);$('#day').textContent=night?`☾ ${text(locale,'Đêm yên bình','Quiet night')}`:`☀ ${text(locale,'Ngày nắng','Sunny day')}`;};
  $('#pause').onclick=()=>{paused=!paused;scene?.pause(paused);$('#pause').textContent=paused?`▷ ${text(locale,'Tiếp tục','Resume')}`:`Ⅱ ${text(locale,'Tạm dừng','Pause')}`;updateBattle(battleState.kind,battleState.metrics,battleState.severity);};
  $('#zoom-in').onclick=()=>scene?.zoom(.86);$('#zoom-out').onclick=()=>scene?.zoom(1.16);$('#reset-camera').onclick=()=>scene?.reset();
  try{
    const {createScene}=await import('./scene');if(token!==renderId)return;
    scene=createScene($('#world'),v,modules,id=>{location.hash=`#/village/${v.id}/module/${id}`;});
    scene.night(night);scene.pause(paused);scene.encounter(battleState.kind,Math.min(1,battleState.severity/5));scene.metrics(battleState.metrics);
    const route=parseRoute(location.hash);if(route.kind==='village'&&route.moduleId)scene.select(route.moduleId);
    updateChrome();
  }catch{if(token!==renderId)return;scene=undefined;$('#world').innerHTML=`<div class="webgl-fallback"><span>♧</span><h2>Ngôi làng qua từng câu chuyện</h2><p>WebGL chưa khả dụng. Bài học, lab, encounter và quiz vẫn hoạt động ở bảng bên cạnh.</p>${v.moduleIds.map(id=>`<a href="#/village/${v.id}/module/${id}">${h(moduleById(id).title)} →</a>`).join('')}</div>`;}
}
function overview(v:Village){
  const vv=villageView(v,locale);$('#village-overview').innerHTML=`<div class="village-note"><span>♧</span><div><b>${h(vv.description)}</b><p>${text(locale,'Bạn có thể đọc trước mọi làng và module. Hoàn thành đủ năm bước và đạt 80% để mở boss tổng kết.','All villages and modules are open for reading. Complete all five steps and reach 80% to unlock the village boss.')}</p></div></div><div class="local-places">${v.moduleIds.map(id=>{const m=moduleView(moduleById(id),locale);return `<a href="#/village/${v.id}/module/${id}"><span style="color:${m.color}">${m.icon}</span><div><b>${h(m.title)}</b><small>${h(m.place)}</small></div><i>${mastered(progress.modules[id])?'✓':'↗'}</i></a>`;}).join('')}</div>`;
}
function render(){
  disposePanel();disposePanel=()=>{};
  const route=parseRoute(location.hash);
  if(route.kind==='world'){clearScene();renderWorld($('#main-content'),curriculum,progress,locale);updateChrome();return;}
  const village=villages.find(v=>v.id===route.villageId);
  const module=route.kind==='village'&&route.moduleId?modules.find(m=>m.id===route.moduleId&&m.villageId===route.villageId):undefined;
  if(!village||(route.kind==='village'&&route.moduleId&&!module)){
    clearScene();$('#main-content').innerHTML=`<div class="guard-screen"><span>⌑</span><h1>Không tìm thấy địa điểm</h1><p>Đường dẫn này không thuộc Foundation hiện tại.</p><a class="primary inline" href="#/world">Về bản đồ thế giới →</a></div>`;updateChrome();return;
  }
  if(activeVillage!==village.id){void buildVillage(villageView(village,locale));}else updateBattle(null,initialMetrics,0);
  overview(village);const panel=$('#learning-panel');
  if(route.kind==='boss'){
    if(!bossReady(curriculum,progress,village.id)){
      const remaining=village.moduleIds.filter(id=>!mastered(progress.modules[id]));panel.innerHTML=`<div class="locked-boss"><div class="monster-portrait ${village.boss.kind}"><span>◕</span><span>◕</span><i>⌁</i></div><div class="eyebrow">BOSS CHƯA MỞ</div><h2>${h(village.boss.name)}</h2><p>Hãy gieo đủ kiến thức trước khi đối mặt thử thách tổng kết.</p>${remaining.map(id=>`<a href="#/village/${village.id}/module/${id}">○ ${h(moduleById(id).title)} →</a>`).join('')}</div>`;
    }else{
      panel.innerHTML='<div class="boss-panel" id="boss-content"></div>';
      disposePanel=mountEncounter($('#boss-content'),village.boss,{update:updateBattle,complete:(score,tags)=>{recordScore(progress,village.id,'boss',score,tags);save();},recap:run=>{
        const weak=run.weakTags;const affected=village.moduleIds.filter(id=>moduleById(id).quiz.some(q=>weak.includes(q.tag))||moduleById(id).encounter.nodes.some(n=>n.choices.some(c=>c.tags.some(t=>weak.includes(t)))));
        const review=affected.length?affected:weak.length?village.moduleIds:[];
        return `<h4>${weak.length?'Tradeoff cần ôn lại':'Điểm tựa đã vững'}</h4><p>${weak.length?weak.map(h).join(' · '):'Bạn đã bảo vệ các yêu cầu trong tình huống này. Thử đổi workload để kiểm chứng lại quyết định.'}</p>${review.map(id=>`<a class="review-link" href="#/village/${village.id}/module/${id}">↻ Ôn ${h(moduleById(id).title)}</a>`).join('')}<p class="small">Tự trình bày 2 phút: nêu requirements, quyết định, đánh đổi và khi nào cần đổi hướng.</p>`;
      },next:()=>{location.hash=recommended(curriculum,progress);}});
    }
  }else if(module){
    scene?.select(module.id);
    disposePanel=mountModule(panel,moduleView(module,locale),progress.modules[module.id],{save,score:(kind,score,tags)=>{recordScore(progress,module.id,kind,score,tags);save();},battle:updateBattle,next:()=>{const next=recommended(curriculum,progress);if(location.hash===next)render();else location.hash=next;}});
  }else{
    panel.innerHTML=`<div class="village-welcome"><div class="welcome-symbol">${village.biome==='meadow'?'✿':village.biome==='coast'?'≈':'◈'}</div><div class="eyebrow">CHÀO MỪNG ĐẾN</div><h2>${h(village.title)}</h2><p>${h(village.description)}</p><h3>Những nơi bạn sẽ đi qua</h3>${village.moduleIds.map((id,i)=>`<a class="welcome-stop" href="#/village/${village.id}/module/${id}"><span>0${i+1}</span><div><b>${h(moduleById(id).title)}</b><small>${moduleById(id).duration} phút · 5 bước học</small></div><i>${mastered(progress.modules[id])?'✓':'→'}</i></a>`).join('')}<a class="boss-gate" href="#/boss/${village.id}">⚔ ${h(village.boss.name)}<small>${bossReady(curriculum,progress,village.id)?'Sẵn sàng đối mặt →':'Hoàn thành các module để mở khóa'}</small></a></div>`;
  }
  updateChrome();
}
$('#journal').onclick=()=>openJournal(curriculum,progress,next=>{progress=next;storageWritable=true;render();});
$('#language-toggle').onclick=()=>{locale=locale==='en'?'vi':'en';saveLocale(localStorage,locale);render();};
window.addEventListener('hashchange',render);
window.addEventListener('pagehide',()=>{disposePanel();clearScene();});
window.addEventListener('pageshow',event=>{if(event.persisted)render();});
render();if(loaded.warning)notify(loaded.warning);
