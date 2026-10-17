// Short, interruptible transitions. Motion never gates navigation or changes model state.
const active=new WeakMap();
export const reducedMotion=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
export function enterPanel(node,direction=1){
 if(!node||typeof node.animate!=='function'||reducedMotion())return;
 active.get(node)?.cancel();
 const animation=node.animate([{opacity:0,transform:`translate3d(${direction*18}px,16px,0)`,clipPath:'inset(0 0 5% 0 round 22px)'},{opacity:1,transform:'translate3d(0,0,0)',clipPath:'inset(0 0 0 0 round 22px)'}],{duration:520,easing:'cubic-bezier(.16,1,.3,1)'});
 active.set(node,animation);animation.onfinish=()=>active.delete(node);
}
