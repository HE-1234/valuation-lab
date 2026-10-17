// Short, interruptible transitions. Motion never gates navigation or changes model state.
const active=new WeakMap();
export const reducedMotion=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
export function enterPanel(node,direction=1){
 if(!node||typeof node.animate!=='function'||reducedMotion())return;
 active.get(node)?.cancel();
 const animation=node.animate([{opacity:.65},{opacity:1}],{duration:180,easing:'cubic-bezier(.16,1,.3,1)'});
 active.set(node,animation);animation.onfinish=()=>active.delete(node);
}
