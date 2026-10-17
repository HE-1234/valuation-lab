from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8080');page.wait_for_timeout(800)
 assert page.locator('#company').input_value()=='NVDA'
 assert 'ESTIMATED INTRINSIC' in page.locator('#valuation-result').inner_text()
 page.screenshot(path='/workspace/shared/valuation-lab/desktop-qa.png',full_page=True)
 page.locator('#a-growth').fill('20');assert len(page.locator('#forecast tbody tr').all())==10
 page.locator('#a-wacc').fill('1');assert 'Require WACC' in page.locator('#valuation-result').inner_text()
 page.locator('#reset').click();page.locator('#thesis').fill('Test thesis with dated rationale')
 page.locator('[data-tab=history]').click();page.locator('#check-asof').click();assert 'eligible' in page.locator('#eligibility').inner_text()
 page.locator('#lock').click();assert 'Locked NVDA' in page.locator('#lock-status').inner_text()
 page.locator('[data-tab=learn]').click();page.locator('[data-q="0"][data-a="1"]').click();assert 'Correct' in page.locator('#feedback-0').inner_text()
 page.locator('[data-tab=data]').click();page.locator('#import-text').fill('{}');page.locator('#import').click();assert 'finite' in page.locator('#import-result').inner_text()
 page.locator('[data-tab=workbench]').click();page.locator('#company').select_option('JPM');assert 'unsuitable' in page.locator('#snapshot-notice').inner_text()
 page.locator('#company').select_option('NVDA');page.set_viewport_size({'width':390,'height':844});page.screenshot(path='/workspace/shared/valuation-lab/mobile-qa.png',full_page=True)
 assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
 print(json.dumps({'browser_errors':errors,'flows':'NVDA load, edit, invalid assumption, reset, cutoff, lock, quiz, import validation, suitability, mobile passed'}));assert not errors
 browser.close()
