export const escapeHTML=(value:unknown):string=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
export const query=<T extends HTMLElement=HTMLElement>(selector:string,parent:ParentNode=document):T=>{const found=parent.querySelector<T>(selector);if(!found)throw new Error('Missing UI: '+selector);return found;};
export const rubricLabels=['Tôi nêu lựa chọn rõ ràng','Tôi gắn lý do với requirement','Tôi giải thích tradeoff','Tôi nêu failure mode','Tôi đưa phương án thay thế'];
export const scoreLabel=(score:number)=>`${score}%`;
export function notify(text:string){let node=document.querySelector<HTMLElement>('#notice');if(!node)return;node.textContent=text;node.hidden=false;}
