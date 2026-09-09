import type {Encounter,Metrics} from './types';
export type EncounterRun={nodeId:string|null;metrics:Metrics;correct:number;turns:number;weakTags:string[];history:{prompt:string;choice:string;feedback:string;correct:boolean}[]};
export function beginEncounter(e:Encounter):EncounterRun{return{nodeId:e.start,metrics:{...e.initial},correct:0,turns:0,weakTags:[],history:[]};}
export function chooseEncounter(e:Encounter,run:EncounterRun,choiceId:string):EncounterRun{
  const node=e.nodes.find(n=>n.id===run.nodeId);if(!node)throw new Error('Encounter đã kết thúc.');
  const choice=node.choices.find(c=>c.id===choiceId);if(!choice)throw new Error('Lựa chọn không hợp lệ.');
  if(choice.next!==null&&!e.nodes.some(n=>n.id===choice.next))throw new Error('Nhánh encounter không tồn tại.');
  const metrics={...run.metrics};for(const [key,delta] of Object.entries(choice.effects)){const k=key as keyof Metrics;metrics[k]=Math.max(0,Math.min(100,metrics[k]+(delta??0)));}
  return {nodeId:choice.next,metrics,correct:run.correct+Number(choice.correct),turns:run.turns+1,
    weakTags:[...new Set([...run.weakTags,...(choice.correct?[]:choice.tags)])],
    history:[...run.history,{prompt:node.prompt,choice:choice.label,feedback:choice.feedback,correct:choice.correct}]};
}
export function encounterScore(run:EncounterRun):number{return run.turns?Math.round(100*run.correct/run.turns):0;}
export function validateEncounter(e:Encounter):string[]{
  const errors:string[]=[];const ids=new Set(e.nodes.map(n=>n.id));
  if(ids.size!==e.nodes.length)errors.push('Duplicate node id');
  const reachable=new Set<string>();
  function visit(id:string,path:string[],depth:number){
    if(path.includes(id)){errors.push('Cycle: '+id);return;}
    const n=e.nodes.find(n=>n.id===id);if(!n){errors.push('Missing: '+id);return;}
    reachable.add(id);if(!n.choices.length||!n.choices.some(c=>c.correct))errors.push('No choices/correct choice: '+id);
    if(new Set(n.choices.map(c=>c.id)).size!==n.choices.length)errors.push('Duplicate choice id: '+id);
    for(const c of n.choices){if(!c.feedback||!Object.keys(c.effects).length)errors.push('Missing feedback/effects: '+id);
      if(c.next===null){if(depth<3||depth>5)errors.push('Invalid path length: '+depth);}else visit(c.next,[...path,id],depth+1);}
  }
  visit(e.start,[],1);for(const id of ids)if(!reachable.has(id))errors.push('Unreachable: '+id);return [...new Set(errors)];
}
