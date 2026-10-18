// Reviewed educational content only. This module has no valuation-model dependencies.
export const QUIZ_BANK_VERSION='valuation-learning-2026-10-18-v1';
export const QUIZ_BANK_PATH='./data/learn-question-bank-v1.json';
export const QUIZ_AUDIT_PATH='./data/learn-question-audit-v1.json';
const languages=['en','zhHans'];
const topics=new Set(['discounting','fcff-fcfe','reinvestment','working-capital','sales-to-capital','margins','tax','growth-roic','growth','terminal-value','currency-inflation','claims','cash','leases','options','sbc','banks','segments','guidance','distributions','correlation','monte-carlo','sensitivity','backtesting','evidence']);
const difficulties=new Set(['beginner','intermediate','advanced']);
const nonempty=value=>typeof value==='string'&&value.trim().length>0;
const trustedHosts=new Set(['pages.stern.nyu.edu','people.stern.nyu.edu','www.itl.nist.gov','numpy.org','scikit-learn.org','fred.stlouisfed.org','web.stanford.edu','doi.org','www.stern.nyu.edu','stern.nyu.edu','www.sec.gov','sec.gov','www.investor.gov','investor.gov','www.ifrs.org','ifrs.org','www.fasb.org','fasb.org','www.cfainstitute.org','cfainstitute.org','rpc.cfainstitute.org','www.federalreserve.gov','federalreserve.gov','www.treasurydirect.gov','treasurydirect.gov']);
export function trustedQuizSource(value){
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&(!url.port||url.port==='443')&&trustedHosts.has(url.hostname)&&url.pathname!=='/';}catch{return false;}
}
function bilingual(value,where,{allowNotation=false}={}){
 if(!value||languages.some(language=>!nonempty(value[language])))throw new TypeError(`${where} needs English and Simplified Chinese.`);
 const notation=value.zhHans.replace(/\b(?:FCFF|FCFE|NOPAT|WACC|ROIC|EBIT|EV|PV|USD)\b/g,'');
 if(!/[\u3400-\u9fff]/u.test(value.zhHans)&&!(allowNotation&&value.en===value.zhHans&&!/[A-Za-z]/.test(notation)))throw new TypeError(`${where} needs a Chinese translation.`);
}
/** Structural validation complements, and never substitutes for, independent content review. */
export function validateQuestionBank(questions,{minimum=100}={}){
 if(!Array.isArray(questions)||questions.length<minimum)throw new TypeError(`The learning bank needs at least ${minimum} reviewed questions.`);
 const ids=new Set(),prompts={en:new Set(),zhHans:new Set()};
 for(const question of questions){
  if(!question||!/^[-a-zA-Z0-9_]+$/.test(question.id||'')||ids.has(question.id))throw new TypeError('Question IDs must be unique and stable.');
  ids.add(question.id);
  if(!topics.has(question.topic)||!difficulties.has(question.difficulty))throw new TypeError(`${question.id}: a supported bilingual topic and difficulty are required.`);
  bilingual(question.prompt,`${question.id} prompt`);bilingual(question.explanation,`${question.id} explanation`);
  for(const language of languages){const prompt=question.prompt[language].trim().replace(/\s+/g,' ').toLocaleLowerCase();if(prompts[language].has(prompt))throw new TypeError(`Duplicate ${language} question prompt.`);prompts[language].add(prompt);}
  if(!Array.isArray(question.options)||question.options.length!==4)throw new TypeError(`${question.id}: exactly four options are required.`);
  const optionIds=question.options.map(option=>option?.id);
  if(new Set(optionIds).size!==4||optionIds.some(id=>!['a','b','c','d'].includes(id))||!optionIds.includes(question.answer))throw new TypeError(`${question.id}: invalid option or correct-answer identity.`);
  for(const option of question.options){bilingual(option.text,`${question.id}/${option.id} option`,{allowNotation:true});bilingual(option.feedback,`${question.id}/${option.id} feedback`);}
  for(const language of languages)if(new Set(question.options.map(option=>option.text[language].trim().toLocaleLowerCase())).size!==4)throw new TypeError(`${question.id}: duplicate ${language} options.`);
  if(!Array.isArray(question.sources)||!question.sources.length||question.sources.some(source=>!trustedQuizSource(source?.url)||!nonempty(source?.title)||!nonempty(source?.section)))throw new TypeError(`${question.id}: a trusted HTTPS primary source and precise section are required.`);
  const verification=question.verification;
  if(!verification||!['numeric','conceptual'].includes(verification.type)||!nonempty(verification.reasoning))throw new TypeError(`${question.id}: verification reasoning is required.`);
  if(verification.type==='numeric'&&!Object.hasOwn(verification,'expectedNumeric'))throw new TypeError(`${question.id}: a numeric verification needs its expected value.`);
  if(Object.hasOwn(verification,'expectedNumeric')&&!Number.isFinite(verification.expectedNumeric))throw new TypeError(`${question.id}: invalid verified number.`);
  if(Object.hasOwn(verification,'tolerance')&&(!Number.isFinite(verification.tolerance)||verification.tolerance<0))throw new TypeError(`${question.id}: invalid numeric tolerance.`);
 }
 return questions;
}
export async function sha256Text(text,crypto=globalThis.crypto){
 if(!crypto?.subtle)throw new Error('Content integrity verification is unavailable.');
 return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(value=>value.toString(16).padStart(2,'0')).join('');
}
export function validateQuizAudit(audit,questions,hash){
 const ids=questions.map(question=>question.id).sort();
 if(!audit||audit.schemaVersion!==1||audit.bankVersion!==QUIZ_BANK_VERSION||audit.status!=='approved'||audit.questionCount!==questions.length||!Array.isArray(audit.approvedIds)||JSON.stringify([...audit.approvedIds].sort())!==JSON.stringify(ids)||!/^\d{4}-\d\d-\d\d/.test(audit.reviewedAt||'')||!nonempty(audit.reviewSummary)||!hash||audit.bankSha256!==hash)throw new TypeError('The question bank does not match its completed independent audit.');
 return audit;
}
export async function loadQuestionBank({fetcher=globalThis.fetch,crypto=globalThis.crypto}={}){
 const responses=await Promise.all([fetcher(QUIZ_BANK_PATH),fetcher(QUIZ_AUDIT_PATH)]);
 if(responses.some(response=>!response.ok))throw new Error('The reviewed question bank could not be loaded.');
 const [text,audit]=await Promise.all([responses[0].text(),responses[1].json()]);
 const questions=validateQuestionBank(JSON.parse(text));
 validateQuizAudit(audit,questions,await sha256Text(text,crypto));
 return {questions,bankVersion:QUIZ_BANK_VERSION,audit};
}
