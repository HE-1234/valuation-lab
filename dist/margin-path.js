// One independent calendar-year margin curve shared by annual and scalar adapters.
export const MARGIN_PATH_VERSION='interim-margin-path-v1';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
export function marginPathIssues(p){
 if(!object(p))return ['A complete margin-path configuration is required.'];
 if(p.enabled===false)return [];
 const errors=[];
 if(p.enabled!==true)errors.push('Explicitly enable the interim margin path.');
 if(p.version!==undefined&&p.version!==MARGIN_PATH_VERSION)errors.push('Unsupported margin-path version.');
 for(const key of ['startMargin','interimMargin','terminalMargin'])if(!finite(p[key])||p[key]<-.5||p[key]>1)errors.push(`${key}: enter a finite margin from −50% to 100%.`);
 if(finite(p.terminalMargin)&&p.terminalMargin<=0)errors.push('Terminal margin must be positive.');
 for(const key of ['interimYear','declineStartYear','terminalYear'])if(!Number.isInteger(p[key])||p[key]<1||p[key]>30)errors.push(`${key}: choose a whole year from 1 to 30.`);
 if(p.declineStartYear<p.interimYear)errors.push('Margin decline cannot begin before the interim margin is reached.');
 if(p.terminalYear<p.declineStartYear)errors.push('Terminal margin cannot be reached before the decline starts.');
 if(p.terminalYear===p.declineStartYear&&p.terminalMargin!==p.interimMargin)errors.push('Different interim and terminal margins require a positive decline duration.');
 return errors;
}
export function marginAtYear(p,year){
 const errors=marginPathIssues(p);if(errors.length)throw Error(errors.join(' '));
 if(p.enabled!==true)throw Error('Enable the margin path before evaluating it.');
 if(!finite(year)||year<0)throw Error('Margin-path year must be finite and at least zero.');
 if(year===0)return p.startMargin;
 if(year>=p.terminalYear)return p.terminalMargin;
 if(year<=p.interimYear)return p.startMargin+(p.interimMargin-p.startMargin)*year/p.interimYear;
 if(year<=p.declineStartYear)return p.interimMargin;
 return p.interimMargin+(p.terminalMargin-p.interimMargin)*(year-p.declineStartYear)/(p.terminalYear-p.declineStartYear);
}
