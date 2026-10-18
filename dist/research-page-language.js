/** Language-of-parts metadata for explicitly inventoried research evidence only. */
const quotationLabels=new Set(['quote','sourcequote','sourceexcerpt','verbatim','verbatimquote','exactquote','originalquote','excerpt']);
const rawQuotationLabels=new Set(['rawline','rawtext']);
export function markOriginalResearchLanguage(root,missingEnglish=[],preservedEnglish=[]){
 let quotations=0;const preserved=new Set(preservedEnglish);
 for(const term of root.querySelectorAll('dt')){
  const label=term.textContent.toLowerCase().replace(/[^a-z]/g,''),value=term.nextElementSibling;
  if(value?.tagName!=='DD')continue;
  if(quotationLabels.has(label)||(rawQuotationLabels.has(label)&&preserved.has(value.textContent)&&/[A-Za-z]/.test(value.textContent)&&!/[\u3400-\u9fff]/.test(value.textContent))){value.setAttribute('lang','en');quotations++;}
 }
 for(const quote of root.querySelectorAll('blockquote')){quote.setAttribute('lang','en');quotations++;}
 // Missing prose is matched only against the exact build inventory, never guessed from substrings.
 const missing=new Set(missingEnglish);
 if(missing.size&&root.createTreeWalker){
  const walker=root.createTreeWalker(root.body,4),nodes=[];
  while(walker.nextNode())if(missing.has(walker.currentNode.data))nodes.push(walker.currentNode);
  for(const node of nodes){
   const leaf=root.createElement('span');leaf.setAttribute('lang','en');leaf.setAttribute('data-research-pending-language','true');node.replaceWith(leaf);leaf.append(node);
  }
 }
 return quotations;
}
