export type Settings={load:number;replicas:number;cache:boolean;failure:boolean;scenario:'read'|'upload'};
export function metrics(s:Settings){
 const admitted=Math.min(s.load,180),limited=s.load-admitted,capacity=Math.max(0,s.replicas-(s.failure?1:0))*60;
 const edge=s.scenario==='read'&&s.cache?Math.floor(admitted*.25):0;
 const app=Math.min(admitted-edge,capacity),hits=s.cache&&s.scenario==='read'?Math.floor(app*.75):0;
 const dbDemand=s.scenario==='read'?app-hits:app;
 const db=Math.min(dbDemand,70),failed=admitted-edge-app+Math.max(0,dbDemand-70);
 const served=edge+app-Math.max(0,dbDemand-70);
 return {admitted,limited,capacity,edge,hits,db,failed,served,latency:served===0?0:Math.round((edge*8+hits*18+db*85)/served),jobs:s.scenario==='upload'?served:Math.floor(served*.2)};
}
export function route(s:Settings,roll:number):string[]{
 if(s.scenario==='upload')return ['gateway','storage','queue','compute','database'];
 if(s.cache&&roll<.25)return ['gateway','cdn','gateway'];
 if(s.cache&&roll<.8125)return ['gateway','balancer','compute','cache','gateway'];
 return ['gateway','balancer','compute',...(s.cache?['cache']:[]),'database','gateway'];
}
