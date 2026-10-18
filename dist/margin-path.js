// One independent calendar-year margin curve shared by annual and scalar adapters.
export const MARGIN_PATH_VERSION='interim-margin-path-v1';
// Analyst-set margins for the first years, then a straight glide to the
// terminal margin by its own year. Same terminal semantics as the interim path.
export const YEARLY_MARGIN_PATH_VERSION='yearly-margin-path-v1';
export const MAX_NEAR_TERM_YEARS=15;
export const isYearlyMarginPath=p=>p?.version===YEARLY_MARGIN_PATH_VERSION;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
export function marginPathIssues(p){
 if(!object(p))return ['A complete margin-path configuration is required.'];
 if(p.enabled===false)return [];
 const errors=[];
 if(p.enabled!==true)errors.push('Explicitly enable the interim margin path.');
 if(isYearlyMarginPath(p))return [...errors,...yearlyIssues(p)];
 if(p.version!==undefined&&p.version!==MARGIN_PATH_VERSION)errors.push('Unsupported margin-path version.');
 for(const key of ['startMargin','interimMargin','terminalMargin'])if(!finite(p[key])||p[key]<-.5||p[key]>1)errors.push(`${key}: enter a finite margin from −50% to 100%.`);
 if(finite(p.terminalMargin)&&p.terminalMargin<=0)errors.push('Terminal margin must be positive.');
 for(const key of ['interimYear','declineStartYear','terminalYear'])if(!Number.isInteger(p[key])||p[key]<1||p[key]>30)errors.push(`${key}: choose a whole year from 1 to 30.`);
 if(p.declineStartYear<p.interimYear)errors.push('Margin decline cannot begin before the interim margin is reached.');
 if(p.terminalYear<p.declineStartYear)errors.push('Terminal margin cannot be reached before the decline starts.');
 if(p.terminalYear===p.declineStartYear&&p.terminalMargin!==p.interimMargin)errors.push('Different interim and terminal margins require a positive decline duration.');
 return errors;
}
function yearlyIssues(p){
 const errors=[],m=p.nearTermMargins;
 if(!Array.isArray(m)||m.length<1||m.length>MAX_NEAR_TERM_YEARS)errors.push(`Set between 1 and ${MAX_NEAR_TERM_YEARS} near-term yearly margins.`);
 else m.forEach((v,i)=>{if(!finite(v)||v<-.5||v>1)errors.push(`Year ${i+1} margin: enter a finite margin from −50% to 100%.`);});
 if(!finite(p.startMargin)||p.startMargin<-.5||p.startMargin>1)errors.push('startMargin: enter a finite margin from −50% to 100%.');
 if(!finite(p.terminalMargin)||p.terminalMargin<=0||p.terminalMargin>1)errors.push('Terminal margin must be positive.');
 const k=Array.isArray(m)?m.length:0;
 if(!Number.isInteger(p.terminalYear)||p.terminalYear<=k||p.terminalYear>30)errors.push(`Terminal margin year: choose a whole year after year ${k} and no later than 30.`);
 return errors;
}
export function marginAtYear(p,year){
 const errors=marginPathIssues(p);if(errors.length)throw Error(errors.join(' '));
 if(p.enabled!==true)throw Error('Enable the margin path before evaluating it.');
 if(!finite(year)||year<0)throw Error('Margin-path year must be finite and at least zero.');
 if(year===0)return p.startMargin;
 if(year>=p.terminalYear)return p.terminalMargin;
 if(isYearlyMarginPath(p)){
  const m=p.nearTermMargins,k=m.length;
  if(year<=k)return m[Math.ceil(year)-1];
  return m[k-1]+(p.terminalMargin-m[k-1])*(year-k)/(p.terminalYear-k);
 }
 if(year<=p.interimYear)return p.startMargin+(p.interimMargin-p.startMargin)*year/p.interimYear;
 if(year<=p.declineStartYear)return p.interimMargin;
 return p.interimMargin+(p.terminalMargin-p.interimMargin)*(year-p.declineStartYear)/(p.terminalYear-p.declineStartYear);
}
