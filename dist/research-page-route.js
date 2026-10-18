/** Match only inventoried .html pages and their exact extensionless Site routes. */
export function researchPageCoverageForPath(pages,pathname,rootPathname){
 const decode=value=>{try{return decodeURIComponent(value);}catch{return null;}};
 const path=decode(pathname),root=decode(rootPathname);
 if(path===null||root===null||!path.startsWith(root))return undefined;
 const relative=path.slice(root.length);
 return pages.find(page=>page.page===relative||(page.page.endsWith('.html')&&page.page.slice(0,-5)===relative));
}
