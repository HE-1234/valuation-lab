import test from 'node:test';
import assert from 'node:assert/strict';
import {translateGuidedMessage} from '../dist/guided-localization.js';
import {setLocale} from '../dist/i18n.js';
for(const source of [
 'Your first year is 1.6 percentage points above FY2025. Fiscal-year comparison.',
 'Your first year is 1.6 percentage points below FY2025. Fiscal-year comparison.',
 'Your mature margin is 2.25 percentage points above FY2024. Fiscal-year comparison.',
 'Your incremental sales / capital is 0.25× below FY2025. Fiscal-year comparison.'
])test('latest UI history comparison round-trips: '+source,()=>{
 try{setLocale('en');assert.equal(translateGuidedMessage(source),source);setLocale('zh-Hans');const translated=translateGuidedMessage(source);assert.notEqual(translated,source);assert.doesNotMatch(translated,/Your| above | below |percentage points|Fiscal-year comparison/);assert.ok(translated.includes(source.includes('above')?'高':'低'));for(const number of source.match(/\d+(?:\.\d+)?/g))assert.ok(translated.includes(number),number+' is preserved despite localized word order');setLocale('en');assert.equal(translateGuidedMessage(source),source);}finally{setLocale('en');}
});
