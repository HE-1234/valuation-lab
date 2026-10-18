"""Real Chromium smoke test against a local Valuation Lab server; no publication."""
from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1)
 errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
 page.goto('http://127.0.0.1:8080/');page.wait_for_selector('#research-company option[value="KLAC"]')
 page.locator('#research-company').select_option('KLAC')
 page.wait_for_selector('#research-results .incremental-dated-scope')
 assert '75.41' in page.locator('#research-results').inner_text()
 assert 'October 18, 2026' in page.locator('#research-results').inner_text()
 key='valuation-lab-incremental-research:KLAC-2026-10-18-v3:KLAC'
 state=lambda:json.loads(page.evaluate('(key)=>localStorage.getItem(key)',key))
 assert state()['researchSimulationConfig']['annualPath']['innovationSD']==0
 assert page.locator('#research-mc-run').count()==1
 # Merely loading the company and visiting the simulation never starts a run.
 page.locator('[data-annual-view="simulation"]').click()
 assert 'No simulation' in page.locator('#research-simulation-root').inner_text() or page.locator('#research-mc-run').is_enabled()
 page.screenshot(path='/tmp/klac-simulation-fixed-desktop.png',full_page=True)
 page.locator('#research-mc-trials').select_option('1000')
 page.locator('#research-mc-run').click()
 page.wait_for_function("document.querySelector('#research-mc-value-basis')!==null",timeout=30000)
 page.locator('#research-mc-value-basis').select_option('perShare')
 assert '75.41' in page.locator('#research-simulation-root').inner_text()
 page.locator('[data-annual-view="result"]').click()
 # Invoke the existing case action via its real button, then Undo.
 page.locator('.research-action-menu > summary').click()
 page.locator('.research-action-menu [data-research-action="incremental-downside"]').click()
 assert '42.26' in page.locator('#research-results').inner_text()
 page.locator('.research-action-menu > summary').click()
 page.locator('.research-action-menu [data-research-action="undo"]').click()
 assert '75.41' in page.locator('#research-results').inner_text()
 page.evaluate("import('./i18n.js').then(m=>m.setLocale('zh-Hans'))")
 page.wait_for_function("document.documentElement.lang==='zh-Hans'")
 assert '当前价格比较已禁用' in page.locator('#research-results').inner_text()
 page.screenshot(path='/tmp/klac-chinese-desktop.png',full_page=True)
 for theme in ['forest','slate','midnight','sand','plum','ocean']:
  page.locator('[data-theme-choice="'+theme+'"]').evaluate('(el)=>el.click()')
  assert page.locator('html').get_attribute('data-theme')==theme
 page.set_viewport_size({'width':390,'height':844})
 assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth')
 page.screenshot(path='/tmp/klac-chinese-mobile.png',full_page=True)
 page.reload();page.wait_for_selector('#research-results .incremental-dated-scope')
 assert state()['ticker']=='KLAC' and state()['informationAsOf']=='2026-10-18'
 assert not errors,errors
 print(json.dumps({'browser_errors':errors,'company':'KLAC','base':75.4116719333,'downside':42.2550529813,'checks':['fresh package','manual MC','fixed baseline','named downside Undo','Chinese','six themes','mobile no overflow','reload']},ensure_ascii=False))
 browser.close()
