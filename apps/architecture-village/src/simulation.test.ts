import {test} from 'node:test';
import assert from 'node:assert/strict';
import {metrics,route,type Settings} from './simulation';
import {lessons} from './content';
const base:Settings={load:120,replicas:2,cache:true,failure:false,scenario:'read'};
test('traffic is accounted for under every combination of failure, caching, load and replicas',()=>{for(const load of [0,60,120,180,240])for(const replicas of [1,2,3,4])for(const cache of [true,false])for(const failure of [true,false])for(const scenario of ['read','upload'] as const){const m=metrics({...base,load,replicas,cache,failure,scenario});assert.equal(m.served+m.failed+m.limited,load);assert.ok(m.db<=70);assert.ok(m.latency>=0);}});
test('cache reduces database demand; scale out recovers compute failures',()=>{assert.ok(metrics(base).db<metrics({...base,cache:false}).db);assert.ok(metrics({...base,replicas:1,failure:true}).failed>0);assert.equal(metrics({...base,replicas:3,failure:true}).failed,0);});
test('gateway caps traffic and zero load stays zero',()=>{assert.equal(metrics({...base,load:240}).limited,60);assert.equal(metrics({...base,load:0}).latency,0);});
test('routes reflect caching and uploads',()=>{assert.ok(route(base,.1).includes('cdn'));assert.ok(route(base,.5).includes('cache'));assert.ok(!route({...base,cache:false},.1).includes('cache'));assert.ok(route({...base,scenario:'upload'},.5).includes('storage'));});
test('each module has two valid questions, a source, and unique coordinates and IDs',()=>{assert.equal(new Set(lessons.map(l=>l.id)).size,10);assert.equal(new Set(lessons.map(l=>l.position.join(','))).size,10);for(const l of lessons){assert.equal(l.quiz.length,2);assert.ok(l.source);for(const q of l.quiz){assert.ok(q.answer>=0&&q.answer<q.options.length);assert.equal(new Set(q.options).size,q.options.length);assert.ok(q.why);}}});

import {labs} from './labs';
test('every module has a lab with valid outputs at both boundaries',()=>{for(const l of lessons){const lab=labs[l.id];assert.ok(lab);for(const value of [lab.min,lab.value,lab.max]){const result=lab.describe(value);assert.ok(result.title&&result.detail&&result.nodes.length);assert.ok(!JSON.stringify(result).includes('NaN'));}}});
