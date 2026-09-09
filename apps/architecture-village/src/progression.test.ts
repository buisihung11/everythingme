import {test} from 'node:test';
import assert from 'node:assert/strict';
import {curriculum,modules,villages} from './curriculum';
import {newProgress,mastered,bossReady,villageUnlocked,recordScore,recommended,validateProgress,parseBackup,loadProgress,foundationComplete} from './progress';
import {beginEncounter,chooseEncounter,encounterScore,validateEncounter} from './encounter-engine';
import {learningLabs,ringOwner} from './learning-labs';
import {parseRoute} from './router';
import type {ProgressV2} from './types';

function completeModule(p:ProgressV2,id:string){Object.assign(p.modules[id],{lesson:true,lab:true,reflection:true,rubric:[true,true,true,true,true],reflectionText:'Tôi giải thích quyết định, lý do, đánh đổi và phương án thay thế.'});recordScore(p,id,'quiz',80,[]);recordScore(p,id,'encounter',100,[]);}
test('79% fails, 80% passes only after all learning evidence, retries retain best',()=>{
  const p=newProgress(curriculum),m=p.modules.intro;
  completeModule(p,'intro');m.quizBest=79;assert.equal(mastered(m),false);m.quizBest=80;assert.equal(mastered(m),true);
  for(const field of ['lesson','lab','reflection'] as const){m[field]=false;assert.equal(mastered(m),false);m[field]=true;}
  m.encounterBest=79;assert.equal(mastered(m),false);m.encounterBest=80;assert.equal(mastered(m),true);
  recordScore(p,'intro','quiz',40,['scope']);assert.equal(m.quizBest,80);assert.equal(m.quizAttempts,2);
});
test('reading ahead and URL selection never unlock village or boss',()=>{
  const p=newProgress(curriculum);p.modules.delivery.lesson=true;
  assert.equal(villageUnlocked(curriculum,p,'departure'),true);assert.equal(villageUnlocked(curriculum,p,'signals'),false);assert.equal(bossReady(curriculum,p,'departure'),false);
  assert.equal(recommended(curriculum,p),'#/village/departure/module/intro');
  p.bosses.departure={best:100,attempts:1,reflection:false,weakTags:[]};assert.equal(villageUnlocked(curriculum,p,'signals'),false,'forged boss without modules cannot unlock');
  assert.equal(villageUnlocked(curriculum,p,'missing'),false);
});
test('new learner can complete every module and boss, with sequential gates',()=>{
  const p=newProgress(curriculum);
  for(const [i,v] of villages.entries()){
    assert.equal(villageUnlocked(curriculum,p,v.id),true);
    if(villages[i+1])assert.equal(villageUnlocked(curriculum,p,villages[i+1].id),false);
    for(const id of v.moduleIds)completeModule(p,id);
    assert.equal(bossReady(curriculum,p,v.id),true);assert.equal(recommended(curriculum,p),`#/boss/${v.id}`);
    recordScore(p,v.id,'boss',79,[]);if(villages[i+1])assert.equal(villageUnlocked(curriculum,p,villages[i+1].id),false);
    recordScore(p,v.id,'boss',80,[]);if(villages[i+1])assert.equal(villageUnlocked(curriculum,p,villages[i+1].id),true);
  }
  assert.equal(foundationComplete(curriculum,p),true);assert.equal(recommended(curriculum,p),'#/world');
  assert.deepEqual(validateProgress(JSON.parse(JSON.stringify(p)),curriculum),p);
});
test('legacy XP migrates exactly once without curriculum mastery',()=>{
  const p=newProgress(curriculum,{gateway:2,cache:1,shards:2,unknown:2,compute:-4,database:99});
  assert.equal(p.legacyXP,250);assert.equal(bossReady(curriculum,p,'departure'),false);assert.equal(p.modules.intro.quizBest,0);
  const map:Record<string,string>={'hearth-progress-v1':JSON.stringify({gateway:2})};
  assert.equal(loadProgress({getItem:key=>map[key]??null},curriculum).progress.legacyXP,100);
});
test('import rejects bad schema, IDs, attempts, scores and prototype payload without mutating original',()=>{
  const original=newProgress(curriculum),before=JSON.stringify(original);
  const bad:unknown[]=[null,[],{...original,version:3},{...original,legacyXP:9999},JSON.parse('{"__proto__":{"polluted":true}}')];
  for(const mutate of [(p:ProgressV2)=>{p.modules.unknown=p.modules.intro;},(p:ProgressV2)=>{p.modules.intro.quizBest=101;},(p:ProgressV2)=>{p.modules.intro.quizAttempts=-1;},(p:ProgressV2)=>{p.modules.intro.reflectionText='x'.repeat(10001);},(p:ProgressV2)=>{p.modules.intro.rubric=[];},(p:ProgressV2)=>{p.modules.intro.reflection=true;},(p:ProgressV2)=>{p.bosses.departure.best=99;}]){const clone=structuredClone(original);mutate(clone);bad.push(clone);}
  for(const value of bad)assert.throws(()=>validateProgress(value,curriculum));
  assert.throws(()=>parseBackup('not json',curriculum));assert.throws(()=>parseBackup(' '.repeat(500001),curriculum));
  assert.equal(JSON.stringify(original),before);assert.equal(({} as Record<string,unknown>).polluted,undefined);
});
test('corrupt saved data produces warning without writing storage',()=>{
  const loaded=loadProgress({getItem:()=>'{bad'},curriculum);assert.ok(loaded.warning);assert.equal(loaded.progress.version,2);
});
test('every encounter branch terminates, carries feedback/effects, and matches scoring',()=>{
  for(const e of [...modules.map(m=>m.encounter),...villages.map(v=>v.boss)]){
    assert.deepEqual(validateEncounter(e),[],e.id);
    function explore(run:ReturnType<typeof beginEncounter>){
      if(run.nodeId===null){assert.ok(run.turns>=3&&run.turns<=5);assert.equal(encounterScore(run),Math.round(run.correct/run.turns*100));return;}
      const node=e.nodes.find(n=>n.id===run.nodeId)!;
      for(const choice of node.choices){const next=chooseEncounter(e,run,choice.id);assert.equal(next.turns,run.turns+1);assert.ok(Object.values(next.metrics).every(n=>n>=0&&n<=100));if(!choice.correct)assert.ok(next.weakTags.length);explore(next);}
    }explore(beginEncounter(e));
  }
});
test('every lab has an achievable mission with bounded controls',()=>{
  for(const m of modules){const lab=learningLabs[m.id];assert.ok(lab,m.id);let possible=false;
    for(let mode=0;mode<lab.modes.length;mode++)for(const value of [lab.min,lab.max,lab.initial,10,15,20,30,60,80,150,10000].filter(v=>v>=lab.min&&v<=lab.max)){const r=lab.run(value,mode);assert.ok(r.headline&&r.explanation&&r.nodes.length);if(r.goal)possible=true;}
    assert.ok(possible,`Mission impossible: ${m.id}`);
  }
});
test('hash ring moves only keys in the added node interval',()=>{
  const old=[0,120,240],next=[0,60,120,240];
  for(let key=0;key<360;key++){const a=ringOwner(key,old),b=ringOwner(key,next);assert.equal(a!==b,key>0&&key<=60);}
});
test('hash route preserves village/module boundaries and fails unknown shapes to world',()=>{
  assert.deepEqual(parseRoute('#/village/signals/module/api'),{kind:'village',villageId:'signals',moduleId:'api'});
  assert.deepEqual(parseRoute('#/boss/scale'),{kind:'boss',villageId:'scale'});assert.deepEqual(parseRoute('#/wat'),{kind:'world'});
});
