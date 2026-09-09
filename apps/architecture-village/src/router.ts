import type {Route} from './types';
export function parseRoute(hash:string):Route {
  const parts=hash.replace(/^#\/?/,'').split('/');
  if(parts[0]==='boss'&&parts.length===2)return{kind:'boss',villageId:parts[1]};
  if(parts[0]==='village'&&(parts.length===2||parts.length===4&&parts[2]==='module'))return{kind:'village',villageId:parts[1],moduleId:parts[3]};
  return{kind:'world'};
}
