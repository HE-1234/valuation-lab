// Learning-only persistence. Company drafts, research presets and simulations are never accessed.
export const QUIZ_DECK_PREFIX='valuation-lab-learning-deck-v1:';
const fallbackStates=new Map(),failedStorage=new Set();
const clone=value=>JSON.parse(JSON.stringify(value));
const randomUnit=rng=>{const value=rng();if(!Number.isFinite(value)||value<0||value>=1)throw new TypeError('Random values must be between zero inclusive and one exclusive.');return value;};
const randomIndex=(length,rng)=>Math.floor(randomUnit(rng)*length);
export function shuffleQuestions(values,rng=Math.random){
 const shuffled=[...values];for(let i=shuffled.length-1;i>0;i--){const j=randomIndex(i+1,rng);[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}return shuffled;
}
function safeStorage(){try{return globalThis.localStorage||null;}catch{return null;}}
function validState(state,ids,version){
 return state&&state.schemaVersion===1&&state.bankVersion===version&&Number.isSafeInteger(state.cycle)&&state.cycle>=1&&Array.isArray(state.order)&&state.order.length===ids.length&&new Set(state.order).size===ids.length&&state.order.every(id=>ids.includes(id))&&Number.isSafeInteger(state.cursor)&&state.cursor>=0&&state.cursor<=ids.length&&Array.isArray(state.previousSet)&&state.previousSet.length<=ids.length&&new Set(state.previousSet).size===state.previousSet.length&&state.previousSet.every(id=>ids.includes(id));
}
/** A persisted permutation and cursor. Creating a deck never consumes a question. */
export function createQuizDeck({ids,bankVersion,storage=safeStorage(),rng=Math.random,memory=fallbackStates,failures=failedStorage}={}){
 if(!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length||ids.some(id=>typeof id!=='string')||!bankVersion)throw new TypeError('A versioned bank with unique question IDs is required.');
 ids=[...ids];const key=QUIZ_DECK_PREFIX+bankVersion;let state=null,storageMode=storage&&!failures.has(key)?'saved':'memory',warning='';
 const useMemory=()=>{storageMode='memory';failures.add(key);};
 if(storageMode==='saved'){
  try{const raw=storage.getItem(key);if(raw!==null){try{const parsed=JSON.parse(raw);if(validState(parsed,ids,bankVersion))state=parsed;else warning='reset';}catch{warning='reset';}}}catch{useMemory();}
 }
 if(!state&&storageMode==='memory'&&memory.has(key)&&validState(memory.get(key),ids,bankVersion))state=clone(memory.get(key));
 if(!state)state={schemaVersion:1,bankVersion,order:[],cursor:0,cycle:0,previousSet:[]};
 function persist(){memory.set(key,clone(state));if(storageMode==='saved')try{storage.setItem(key,JSON.stringify(state));}catch{useMemory();}}
 function nextCycle(selected){
  const shuffled=shuffleQuestions(ids,rng),inSet=new Set(selected),previous=new Set(state.previousSet);
  // Finish each cycle before repeating. Keep boundary draws unique, and delay the last set where possible.
  state.order=[...shuffled.filter(id=>!inSet.has(id)&&!previous.has(id)),...shuffled.filter(id=>!inSet.has(id)&&previous.has(id)),...shuffled.filter(id=>inSet.has(id))];
  state.cursor=0;state.cycle++;
 }
 return {
  draw(count=10){
   if(!Number.isSafeInteger(count)||count<1||count>ids.length)throw new TypeError('The draw size must fit the bank.');
   const selected=[];
   while(selected.length<count){if(state.cursor>=state.order.length)nextCycle(selected);selected.push(state.order[state.cursor++]);}
   state.previousSet=[...selected];persist();return selected;
  },
  getState:()=>({...clone(state),storageMode,warning}),
  storageKey:key
 };
}
/** Randomized option IDs are stable for a set; answer and feedback always use IDs, never screen positions. */
export function createQuizSession(questions,ids,{rng=Math.random}={}){
 const byId=new Map(questions.map(question=>[question.id,question]));
 if(!Array.isArray(ids)||ids.length!==10||new Set(ids).size!==10||ids.some(id=>!byId.has(id)))throw new TypeError('A quiz set must contain exactly ten unique bank questions.');
 const positions=[0,0,0,0];
 const items=ids.map(id=>{
  const question=byId.get(id),options=shuffleQuestions(question.options.map(option=>option.id),rng);
  // Softly favor less-used correct-answer positions without guaranteeing any distribution.
  const weights=positions.map(count=>1/(1+count)),total=weights.reduce((sum,weight)=>sum+weight,0);let target=randomUnit(rng)*total,position=weights.length-1;
  for(let i=0;i<weights.length;i++){target-=weights[i];if(target<0){position=i;break;}}
  const correct=options.indexOf(question.answer);[options[position],options[correct]]=[options[correct],options[position]];positions[position]++;
  return {id,options};
 });
 let index=0;const answers=Object.fromEntries(ids.map(id=>[id,null]));
 return {
  getState:()=>({index,items:clone(items),answers:{...answers},answered:ids.filter(id=>answers[id]!==null).length,score:ids.filter(id=>answers[id]===byId.get(id).answer).length}),
  current:()=>({question:byId.get(items[index].id),options:[...items[index].options],answer:answers[items[index].id]}),
  answer(optionId){const current=items[index];if(!current.options.includes(optionId)||answers[current.id]!==null)return false;answers[current.id]=optionId;return true;},
  move(next){if(!Number.isInteger(next)||next<0||next>=items.length)return false;index=next;return true;},
  review(){index=0;}
 };
}
