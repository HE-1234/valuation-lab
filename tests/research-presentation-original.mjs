import {reverseMethodologyDocumentation} from './simulation-methodology-preservation.mjs';
// First reverse the exact reviewed current-method documentation; then remove
// only authorized text-leaf wrappers and the exact two-asset insertion.
// Existing source-byte pins remain unchanged; non-HTML bytes are untouched.
export function originalResearchBytes(file, bytes) {
 bytes=reverseMethodologyDocumentation(file,bytes);
 if(!file.endsWith('.html'))return bytes;
 let source=bytes.toString();
 source=source.replace(/<span data-research-i18n="true" data-i18n="research-pages\.text\.[a-f0-9]{20}">([\s\S]*?)<\/span>/g,'$1');
 for(const relative of ['..','../..'])source=source.replace(`<link data-research-locale="true" rel="stylesheet" href="${relative}/i18n.css">\n<script data-research-locale="true" type="module" src="${relative}/research-page-i18n.js"></script>`,'');
 return Buffer.from(source);
}
