import type { Curriculum, ModuleProgress, ProgressV2 } from './types';

export const STORAGE_KEY = 'hearth-progress-v2';
export const PASS = 80;
export const blankModule = (): ModuleProgress => ({
  lesson: false, lab: false, reflection: false, quizBest: 0, quizAttempts: 0,
  encounterBest: 0, encounterAttempts: 0, reflectionText: '', reflectionMode: 'write', rubric: [false,false,false,false,false], weakTags: [],
});
export function newProgress(c: Curriculum, legacy: unknown = null): ProgressV2 {
  const oldIds = ['gateway','balancer','compute','cache','database','queue','storage','cdn','shards','realtime'];
  let legacyXP = 0;
  if (legacy && typeof legacy === 'object' && !Array.isArray(legacy)) {
    for (const id of oldIds) {
      const v = (legacy as Record<string,unknown>)[id];
      if (Number.isInteger(v) && Number(v) >= 0 && Number(v) <= 2) legacyXP += Number(v)*50;
    }
  }
  return { version: 2, modules: Object.fromEntries(c.modules.map(m=>[m.id,blankModule()])),
    bosses: Object.fromEntries(c.villages.map(v=>[v.id,{best:0,attempts:0,reflection:false,weakTags:[]}])), legacyXP, updatedAt: new Date().toISOString() };
}
export function mastered(m: ModuleProgress): boolean {
  return m.lesson && m.lab && m.reflection && m.quizBest >= PASS && m.quizAttempts > 0 && m.encounterBest >= PASS && m.encounterAttempts > 0;
}
export function villageUnlocked(c: Curriculum, p: ProgressV2, id: string): boolean {
  const index=c.villages.findIndex(v=>v.id===id);
  return index>=0 && c.villages.slice(0,index).every(v=>bossReady(c,p,v.id) && p.bosses[v.id].best>=PASS && p.bosses[v.id].attempts>0);
}
export function bossReady(c: Curriculum, p: ProgressV2, id: string): boolean {
  const v=c.villages.find(v=>v.id===id);
  return !!v && v.moduleIds.every(mid=>mastered(p.modules[mid]));
}
export function foundationComplete(c: Curriculum,p: ProgressV2): boolean {
  return c.villages.every(v=>bossReady(c,p,v.id)&&p.bosses[v.id].best>=PASS&&p.bosses[v.id].attempts>0);
}
export function recommended(c: Curriculum,p: ProgressV2): string {
  for(const v of c.villages){
    if(!villageUnlocked(c,p,v.id)) break;
    const next=v.moduleIds.find(id=>!mastered(p.modules[id]));
    if(next)return `#/village/${v.id}/module/${next}`;
    if(p.bosses[v.id].best<PASS)return `#/boss/${v.id}`;
  }
  return '#/world';
}
export function recordScore(p:ProgressV2,id:string,kind:'quiz'|'encounter'|'boss',score:number,weakTags:string[]):void {
  if(!Number.isInteger(score)||score<0||score>100)throw new Error('Điểm không hợp lệ.');
  if(kind==='boss'){
    const b=p.bosses[id]; b.best=Math.max(b.best,score);b.attempts=Math.min(100000,b.attempts+1);b.weakTags=[...new Set(weakTags)];
  }else{
    const m=p.modules[id];
    if(kind==='quiz'){m.quizBest=Math.max(m.quizBest,score);m.quizAttempts=Math.min(100000,m.quizAttempts+1);}
    else {m.encounterBest=Math.max(m.encounterBest,score);m.encounterAttempts=Math.min(100000,m.encounterAttempts+1);}
    m.weakTags=[...new Set([...m.weakTags,...weakTags])].slice(-30);
  }
  p.updatedAt=new Date().toISOString();
}

// Import is a complete replacement only AFTER validating every field. No data from
// the file is used as HTML or merged into prototypes.
function object(v:unknown):v is Record<string,unknown>{return !!v&&typeof v==='object'&&!Array.isArray(v);}
function keys(v:Record<string,unknown>,expected:string[]):boolean{return Object.keys(v).length===expected.length&&expected.every(k=>Object.hasOwn(v,k));}
const integer=(v:unknown,max:number)=>typeof v==='number'&&Number.isInteger(v)&&v>=0&&v<=max;
const tags=(v:unknown)=>Array.isArray(v)&&v.length<=30&&v.every(t=>typeof t==='string'&&t.length<=150);
export function validateProgress(value:unknown,c:Curriculum):ProgressV2 {
  const fail=()=>{throw new Error('Backup không hợp lệ hoặc khác phiên bản curriculum. Tiến độ hiện tại được giữ nguyên.');};
  if(!object(value)||!keys(value,['version','modules','bosses','legacyXP','updatedAt'])||value.version!==2) return fail();
  if(!object(value.modules)||!keys(value.modules,c.modules.map(m=>m.id))||!object(value.bosses)||!keys(value.bosses,c.villages.map(v=>v.id)))return fail();
  if(!integer(value.legacyXP,1000)||typeof value.updatedAt!=='string'||value.updatedAt.length>40||!Number.isFinite(Date.parse(value.updatedAt)))return fail();
  for(const raw of Object.values(value.modules)){
    if(!object(raw)||!keys(raw,Object.keys(blankModule())))return fail();
    if(!['lesson','lab','reflection'].every(k=>typeof raw[k]==='boolean'))return fail();
    if(!integer(raw.quizBest,100)||!integer(raw.encounterBest,100)||!integer(raw.quizAttempts,100000)||!integer(raw.encounterAttempts,100000))return fail();
    if((raw.quizAttempts===0&&raw.quizBest!==0)||(raw.encounterAttempts===0&&raw.encounterBest!==0))return fail();
    if(typeof raw.reflectionText!=='string'||raw.reflectionText.length>10000||!['write','speak'].includes(String(raw.reflectionMode))||!tags(raw.weakTags))return fail();
    if(!Array.isArray(raw.rubric)||raw.rubric.length!==5||!raw.rubric.every(v=>typeof v==='boolean'))return fail();
    if(raw.reflection&&!raw.rubric.every(Boolean))return fail();
  }
  for(const raw of Object.values(value.bosses)){
    if(!object(raw)||!keys(raw,['best','attempts','reflection','weakTags'])||!integer(raw.best,100)||!integer(raw.attempts,100000)||typeof raw.reflection!=='boolean'||!tags(raw.weakTags))return fail();
    if(raw.attempts===0&&raw.best!==0)return fail();
  }
  return structuredClone(value) as unknown as ProgressV2;
}
export function parseBackup(text:string,c:Curriculum):ProgressV2 {
  if(text.length>500000)throw new Error('Backup vượt giới hạn 500 KB.');
  try{return validateProgress(JSON.parse(text),c);}catch(error){if(error instanceof SyntaxError)throw new Error('Tệp không phải JSON hợp lệ.');throw error;}
}
export function loadProgress(storage:Pick<Storage,'getItem'>,c:Curriculum):{progress:ProgressV2;warning:string} {
  try {
    const saved=storage.getItem(STORAGE_KEY);
    if(saved)return {progress:parseBackup(saved,c),warning:''};
    let legacy:unknown=null;try{legacy=JSON.parse(storage.getItem('hearth-progress-v1')||'null');}catch{/* Invalid legacy progress cannot grant credit. */}
    return {progress:newProgress(c,legacy),warning:''};
  }catch{return {progress:newProgress(c),warning:'Không đọc được tiến độ đã lưu. Bản cũ chưa bị ghi đè; bạn có thể khôi phục bằng backup.'};}
}
