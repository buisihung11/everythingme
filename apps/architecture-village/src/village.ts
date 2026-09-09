import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {lessons} from './content';
import {route,type Settings} from './simulation';
export function createVillage(host:HTMLElement,onSelect:(id:string)=>void){
 const scene=new T.Scene();scene.background=new T.Color('#dce9dc');scene.fog=new T.Fog('#dce9dc',38,85);
 const camera=new T.PerspectiveCamera(36,1,.1,100);camera.position.set(23,26,30);
 const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;host.append(renderer.domElement);
 renderer.domElement.setAttribute('aria-label','Ngôi làng kiến trúc 3D. Kéo để xoay, cuộn để zoom. Chọn công trình qua bản đồ hoặc danh sách module.');
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,0,-1);controls.enableDamping=true;controls.minDistance=19;controls.maxDistance=53;controls.maxPolarAngle=Math.PI/2.5;controls.minPolarAngle=.3;controls.enablePan=false;
 scene.add(new T.HemisphereLight('#fff7df','#809e81',2.8));const sun=new T.DirectionalLight('#fff2d6',3.2);sun.position.set(-12,25,10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20});sun.shadow.bias=-.001;scene.add(sun);
 const materials=new Map<string,T.MeshStandardMaterial>();function mat(c:string){if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c,roughness:1}));return materials.get(c)!;}
 function mesh(g:T.BufferGeometry,c:string,x:number,y:number,z:number,p:T.Object3D=scene){const m=new T.Mesh(g,mat(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;p.add(m);return m;}
 function box(w:number,h:number,d:number,c:string,x:number,y:number,z:number,p:T.Object3D=scene){return mesh(new T.BoxGeometry(w,h,d),c,x,y,z,p);}
 function ball(r:number,c:string,x:number,y:number,z:number,p:T.Object3D=scene){return mesh(new T.IcosahedronGeometry(r,1),c,x,y,z,p);}
 box(24,1.4,21,'#a88b65',0,-1,0);box(24,.35,21,'#83ad73',0,-.15,0);box(23.5,.1,20.5,'#98bc7e',0,.05,0);
 // Branching footpaths connect each building to the village square.
 lessons.forEach(l=>{const [x,z]=l.position;box(Math.abs(x)+1,.035,.8,'#e2cf9c',x/2,.13,z);box(.8,.035,Math.abs(z)+1,'#e2cf9c',0,.135,z/2);});
 box(4,.05,4,'#e8d8ad',0,.15,0);
 const pond=mesh(new T.CylinderGeometry(2.35,2.35,.07,32),'#82c6ca',8,.18,6);pond.scale.z=.65;
 for(let i=0;i<9;i++) {const a=i*2.4;ball(.35,'#b6b7a1',8+Math.cos(a)*2.4,.25,6+Math.sin(a)*1.6);}
 // Deliberately seeded scenery keeps the same landscape on every visit.
 let seed=21;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
 function tree(x:number,z:number,size=1){box(.22,1,.22,'#907257',x,.6,z);mesh(new T.ConeGeometry(.85*size,1.6*size,7),'#537e53',x,1.5*size,z);mesh(new T.ConeGeometry(.65*size,1.3*size,7),'#69955b',x,2.1*size,z);}
 for(let i=0;i<75;i++){const x=random()*23-11.5,z=random()*20-10;if(lessons.some(l=>Math.hypot(l.position[0]-x,l.position[1]-z)<2.1)||Math.abs(x)<.7||z>4&&x>5)continue;if(Math.abs(x)>9||Math.abs(z)>8)tree(x,z,.6+random()*.5);else {ball(.11,['#f6e4a0','#f8ece1','#d6a5b0'][i%3],x,.22,z);box(.03,.18,.03,'#618956',x,.16,z);}}
 // Fences, crop beds and stepping stones add a cozy farming-game scale.
 for(let i=0;i<12;i++){const x=-10+i*.52;box(.09,.5,.1,'#eee0b6',x,.4,8);if(i<11)box(.53,.08,.08,'#eee0b6',x+.25,.55,8);}
 for(let i=0;i<4;i++){box(2,.09,.3,'#9c7750',-7,.18,6+i*.4);for(let j=0;j<6;j++)ball(.13,'#e9ad66',-7.8+j*.3,.32,6+i*.4);}
 const buildings:T.Group[]=[];const labels:HTMLElement[]=[];const labelLayer=document.createElement('div');labelLayer.className='world-labels';host.append(labelLayer);
 const rotors:T.Group[]=[];
 lessons.forEach((l,i)=>{const g=new T.Group();g.position.set(l.position[0],0,l.position[1]);g.userData.id=l.id;scene.add(g);buildings.push(g);
 box(2.6,.16,2.25,'#c6c49e',0,.22,0,g);const h=i===4?2.15:1.45;
 box(1.95,h,1.6,'#f3e5c5',0,h/2+.3,0,g);
 box(2.02,.13,1.65,'#a78963',0,.47,0,g);
 const roof=mesh(new T.ConeGeometry(1.75,1.15,4),l.color,0,h+.78,0,g);roof.rotation.y=Math.PI/4;roof.scale.z=.84;
 box(.44,.85,.09,'#775e4d',0,.77,.85,g);ball(.035,'#efca73',.12,.75,.92,g);
 [-.61,.61].forEach(x=>{box(.39,.43,.08,'#9dc7c3',x,1.2,.85,g);box(.045,.44,.09,'#faf0cf',x,1.2,.9,g);box(.4,.04,.09,'#faf0cf',x,1.2,.9,g);});
 box(.3,.65,.35,'#c19e80',.6,h+.75,-.4,g);
 if(i===1){const r=new T.Group();r.position.set(0,2.6,1);g.add(r);box(.13,2.1,.09,'#f6ecd0',0,0,0,r);box(2.1,.13,.09,'#f6ecd0',0,0,0,r);ball(.16,'#8b7151',0,0,.12,r);rotors.push(r);}
 if(i===0){box(3,.2,.35,'#b36f52',0,2.5,.9,g);box(.2,2.4,.2,'#b36f52',-1.3,1.35,.9,g);box(.2,2.4,.2,'#b36f52',1.3,1.35,.9,g);}
 if(i===7){mesh(new T.CylinderGeometry(.65,.8,2.3,8),'#eee8d2',0,1.4,0,g);mesh(new T.ConeGeometry(1,1.3,8),l.color,0,3.1,0,g);}
 if(i===8)for(let n=0;n<3;n++)mesh(new T.OctahedronGeometry(.35),'#b6a0d7',n*.6-.6,.65,1.25,g);
 const label=document.createElement('button');label.className='world-label';label.innerHTML=`<i style="background:${l.color}"></i>${l.name}<span>↗</span>`;label.onclick=()=>onSelect(l.id);labelLayer.append(label);labels.push(label);
 });
 const ring=mesh(new T.TorusGeometry(1.65,.045,8,64),'#fff5b2',0,.28,0);ring.rotation.x=Math.PI/2;
 function spirit(color:string,kind=0){const g=new T.Group();ball(.24,color,0,.3,0,g);ball(.2,color,0,.56,.02,g);[-.11,.11].forEach(x=>{mesh(new T.ConeGeometry(.075,.27,5),color,x,.78,.02,g);ball(.035,'#384b41',x,.6,.19,g);});ball(.09,'#fff2d3',0,.49,.19,g);if(kind===4){const shell=ball(.3,'#719d89',0,.32,-.12,g);shell.scale.set(1,.7,1.25);}if(kind===5||kind===7){[-1,1].forEach(side=>{const wing=ball(.22,'#f6edcd',side*.28,.42,0,g);wing.scale.set(1.4,.25,.65);});}if(kind===0){const tail=mesh(new T.ConeGeometry(.14,.5,6),color,0,.3,-.32,g);tail.rotation.x=-.7;}if(kind===8||kind===9)mesh(new T.ConeGeometry(.07,.33,5),'#f7e1a1',0,.84,.08,g);scene.add(g);return g;}
 const guardians=lessons.map((l,i)=>{const g=spirit(l.color,i);g.position.set(l.position[0]+1.2,.1,l.position[1]+1.2);return g;});
 const travelers=Array.from({length:14},(_,i)=>({g:spirit(['#f4d181','#dfabb7','#a9cf9b'][i%3]),t:i/14,path:[] as string[]}));
 let settings:Settings={load:60,replicas:2,cache:true,failure:false,scenario:'read'},paused=false,selected='gateway';
 travelers.forEach((a,i)=>a.path=route(settings,i/14));
 const ray=new T.Raycaster(),pointer=new T.Vector2();let down=[0,0];renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(buildings,true)[0];if(hit){let o:T.Object3D|null=hit.object;while(o&&!o.userData.id)o=o.parent;if(o)onSelect(o.userData.id);}});
 function resize(){const {width,height}=host.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(host);resize();
 let prev=0,time=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 renderer.setAnimationLoop((now:number)=>{const dt=Math.min((now-prev)/1000,.05);prev=now;if(!paused)time+=dt;controls.update();
 const chosen=lessons.find(l=>l.id===selected)!;ring.position.set(chosen.position[0],.28,chosen.position[1]);
 rotors.forEach(r=>r.rotation.z=time*.4);guardians.forEach((g,i)=>g.position.y=.08+(reduced?0:Math.sin(time*2+i)*.06));
 travelers.forEach((a,i)=>{a.g.visible=i<Math.ceil(settings.load/18)&&!reduced;if(!paused)a.t+=dt*.09;if(a.t>=1){a.t=0;a.path=route(settings,(i+.5)/14);}const segment=a.t*(a.path.length-1),idx=Math.min(Math.floor(segment),a.path.length-2),f=segment-idx;const from=lessons.find(l=>l.id===a.path[idx])!,to=lessons.find(l=>l.id===a.path[idx+1])!;a.g.position.set(T.MathUtils.lerp(from.position[0],to.position[0],f),.3+Math.abs(Math.sin(time*9+i))*.1,T.MathUtils.lerp(from.position[1],to.position[1],f)+1);a.g.rotation.y=Math.atan2(to.position[0]-from.position[0],to.position[1]-from.position[1]);if(settings.failure&&a.path.includes('compute')&&settings.replicas===1)a.g.visible=false;});
 const w=host.clientWidth,h=host.clientHeight;lessons.forEach((l,i)=>{const v=new T.Vector3(l.position[0],3.4,l.position[1]).project(camera);labels[i].style.transform=`translate(-50%,-50%) translate(${(v.x*.5+.5)*w}px,${(-v.y*.5+.5)*h}px)`;labels[i].classList.toggle('selected',l.id===selected);labels[i].style.display=v.z>1?'none':'';});renderer.render(scene,camera);
 });
 return {select(id:string){selected=id;},configure(s:Settings){settings={...s};travelers.forEach((a,i)=>{a.path=route(settings,(i+.5)/14);a.t=0;});},pause(p:boolean){paused=p;},zoom(factor:number){camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);},reset(){camera.position.set(23,26,30);controls.target.set(0,0,-1);},night(on:boolean){scene.background=new T.Color(on?'#293f4b':'#dce9dc');scene.fog=new T.Fog(on?'#293f4b':'#dce9dc',38,85);sun.intensity=on?.65:3.2;}};
}
