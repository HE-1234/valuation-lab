// Preserve generic validation while making ARM invalid headlines explicit.
export function armValidationError(issues){return Object.assign(Error(issues.join(' ')),{status:'invalid',enterprise:null,equity:null,perShare:null,value_per_ads:null});}
