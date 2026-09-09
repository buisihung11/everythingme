import type {Curriculum,LearningModule,Village} from './types';
import type {LearningLab} from './learning-labs';
import {learningLabs} from './learning-labs';
import {englishLabs,englishModules,englishVillage} from './english-content';

export type Locale='vi'|'en';
export const LOCALE_KEY='hearth-locale-v1';
export function loadLocale(storage:Pick<Storage,'getItem'>|{getItem:(key:string)=>string|null}):Locale{return storage.getItem(LOCALE_KEY)==='en'?'en':'vi';}
export function saveLocale(storage:Pick<Storage,'setItem'>|{setItem:(key:string,value:string)=>void},locale:Locale){storage.setItem(LOCALE_KEY,locale);}
export const text=(locale:Locale,vi:string,en:string)=>locale==='en'?en:vi;

const moduleMeta:Record<string,Partial<LearningModule>>={
  intro:{title:'System Design Interview',place:'Commons Kitchen',spirit:'Firefly Guide',objectives:['Turn ambiguous prompts into testable behaviors','State assumptions and tradeoffs','Trace a requirement end to end']},
  delivery:{title:'Delivery Framework',place:'Drafting Bridge',spirit:'Guide Turtle',objectives:['Lead from requirements to a working design','Choose deep dives by risk','Estimate only when numbers change a decision']},
  networking:{title:'Networking Essentials',place:'Signal Lighthouse',spirit:'Packet Fox',objectives:['Choose a transport and connection model','Reason about latency and failure','Explain load balancing boundaries']},
  api:{title:'API Design',place:'Contract Workshop',spirit:'Schema Sprite',objectives:['Design clear resource and action interfaces','Handle pagination and retries safely','Protect APIs with auth and rate limits']},
  'data-modeling':{title:'Data Modeling',place:'Entity Orchard',spirit:'Relational Owl',objectives:['Start from access patterns','Choose relational or NoSQL deliberately','Balance joins, duplication and consistency']},
  caching:{title:'Caching',place:'Memory Garden',spirit:'Cache Cat',objectives:['Apply cache-aside with explicit freshness','Spot hot keys and stampedes','Trade latency for staleness intentionally']},
  sharding:{title:'Sharding',place:'Partition Fields',spirit:'Shard Badger',objectives:['Know when sharding is necessary','Choose a shard key without hotspots','Plan cross-shard queries and resharding']},
  hashing:{title:'Consistent Hashing',place:'Hashing Ring',spirit:'Ring Serpent',objectives:['Explain why modulo hashing moves keys','Use virtual nodes and replication','Limit movement during membership changes']},
  cap:{title:'CAP Theorem',place:'Partition Pass',spirit:'Consistency Crane',objectives:['Apply CAP to a concrete operation','Compare strong and eventual consistency','Explain the tradeoff during a partition']},
  indexing:{title:'Database Indexing',place:'Index Library',spirit:'B-Tree Mole',objectives:['Match indexes to query patterns','Account for write amplification','Choose ordering and specialized indexes']},
  numbers:{title:'Numbers to Know',place:'Estimation Observatory',spirit:'Headroom Giant',objectives:['Estimate QPS, storage and throughput','Use orders of magnitude in discussion','Avoid premature overengineering']},
};
const villageMeta:Record<string,Partial<Village>>={
  departure:{title:'Departure Village',subtitle:'UNDERSTAND THE PROMPT · LEAD THE DESIGN',description:'Build the foundation for turning an ambiguous prompt into a system you can explain and test.'},
  signals:{title:'Signals Village',subtitle:'COMMUNICATION · DATA SHAPES',description:'Connect user-facing contracts to networks, APIs and the shape of stored data.'},
  scale:{title:'Scale Village',subtitle:'SCALE · CONSISTENCY · RESILIENCE',description:'Practice the decisions that keep a system useful as traffic, data and failures grow.'},
};
export function moduleView(m:LearningModule,locale:Locale):LearningModule{
  if(locale==='vi')return m;
  return {...m,...moduleMeta[m.id],...englishModules[m.id]};
}
export function villageView(v:Village,locale:Locale):Village{
  if(locale==='vi')return v;
  return {...englishVillage(v),...villageMeta[v.id]};
}
export function curriculumView(c:Curriculum,locale:Locale):Curriculum{
  if(locale==='vi')return c;
  return {version:c.version,villages:c.villages.map(v=>villageView(v,locale)),modules:c.modules.map(m=>moduleView(m,locale))};
}
export function labView(id:string,locale:Locale):LearningLab{return locale==='en'&&englishLabs[id]?englishLabs[id]:learningLabs[id];}

export const uiText={
  stages:(locale:Locale)=>locale==='en'
    ? [['lesson','01','Lesson'],['lab','02','Lab'],['encounter','03','Encounter'],['quiz','04','Quiz'],['reflection','05','Reflection']]
    : [['lesson','01','Bài học'],['lab','02','Thí nghiệm'],['encounter','03','Yêu quái'],['quiz','04','Quiz'],['reflection','05','Giải thích']],
  rubric:(locale:Locale)=>locale==='en'
    ? ['I stated my choice clearly','I tied the reason to a requirement','I explained the tradeoff','I named a failure mode','I gave an alternative']
    : ['Tôi nêu lựa chọn rõ ràng','Tôi gắn lý do với requirement','Tôi giải thích tradeoff','Tôi nêu failure mode','Tôi đưa phương án thay thế'],
};
