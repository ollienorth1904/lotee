import sys
from playwright.sync_api import sync_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8931/'
SHOTS = sys.argv[2] if len(sys.argv) > 2 else __import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'..','screenshots','')
res = []; errs = []
def ok(n, c, x=''): res.append(c); print(('PASS ' if c else 'FAIL ') + n, x)
with sync_playwright() as pw:
    for dev, eng in [('iPhone 13', 'webkit'), ('Pixel 7', 'chromium')]:
        tag = dev.replace(' ', '').lower()
        try:
            br = getattr(pw, eng).launch()
        except Exception as e:
            ok(tag + ' launch ' + eng, False, str(e)[:300]); continue
        d = dict(pw.devices[dev])
        ctx = br.new_context(**d); page = ctx.new_page()
        page.on('pageerror', lambda e, t=tag: errs.append(t + ': ' + str(e)))
        page.on('console', lambda m, t=tag: errs.append(t + ' console: ' + m.text) if m.type == 'error' else None)
        page.goto(URL); page.wait_for_selector('.title-logo'); page.wait_for_timeout(1500)
        page.screenshot(path=SHOTS + 'mobile_%s_title.png' % tag)
        man = page.evaluate("()=>fetch(document.querySelector('link[rel=manifest]').href).then(r=>r.json())")
        ok(tag + ' manifest', man['short_name'] == 'lotee' and man['display'] == 'standalone' and any('maskable' in i.get('purpose', '') for i in man['icons']))
        ok(tag + ' apple meta', page.evaluate("()=>document.querySelector('meta[name=apple-mobile-web-app-title]').content") == 'lotee')
        page.wait_for_timeout(1500)
        reg = page.evaluate("()=>'serviceWorker' in navigator ? navigator.serviceWorker.getRegistration().then(r=>!!r) : 'unsupported'")
        ok(tag + ' SW registered', reg is True, str(reg))
        # tap targets >= 44
        small = page.evaluate("()=>[...document.querySelectorAll('button,a,.btn')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.width<43.5||r.height<43.5)}).map(e=>e.outerHTML.slice(0,60))")
        ok(tag + ' title tap targets >=44px', not small, str(small[:3]))
        page.tap('[data-go="solo"]'); page.wait_for_selector('.tablas'); page.screenshot(path=SHOTS + 'mobile_%s_setup.png' % tag, full_page=True)
        page.tap('[data-act="start"]'); page.wait_for_selector('#board .cell')
        page.evaluate("()=>{window.__lotee.S.voice=false}")
        for k in range(7):
            page.tap('#nextbtn'); page.wait_for_timeout(150)
        idx = page.evaluate("()=>{const G=window.__lotee.G;const p=G.players[0];return p.board.map((n,i)=>G.called.has(n)?i:-1).filter(i=>i>=0)}")
        for i in idx: page.tap('#board .cell[data-i="%d"]' % i)
        page.wait_for_timeout(900)
        ok(tag + ' tap marks beans', page.evaluate("()=>window.__lotee.G.players[0].marks.size") == len(idx), str(idx))
        ov = page.evaluate("()=>document.documentElement.scrollWidth>innerWidth+1")
        ok(tag + ' no horizontal overflow', not ov)
        small = page.evaluate("()=>[...document.querySelectorAll('#app button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.width<43.5||r.height<43.5)}).map(e=>e.outerHTML.slice(0,60))")
        ok(tag + ' game tap targets >=44px', not small, str(small[:3]))
        page.screenshot(path=SHOTS + 'mobile_%s_game.png' % tag)
        bb = page.evaluate("()=>{const r=document.querySelector('#board').getBoundingClientRect(),l=document.querySelector('#lotbtn').getBoundingClientRect();return [r.width,r.bottom,l.bottom,innerHeight]}")
        ok(tag + ' board + Lotería button fit on screen', bb[2] <= bb[3] + 1, str(bb))
        # rotate to landscape
        vw, vh = d['viewport']['width'], d['viewport']['height']
        page.set_viewport_size({'width': vh, 'height': vw}); page.wait_for_timeout(700)
        page.screenshot(path=SHOTS + 'mobile_%s_landscape.png' % tag)
        bb = page.evaluate("()=>{const l=document.querySelector('#lotbtn').getBoundingClientRect(),b=document.querySelector('#board').getBoundingClientRect();const cb=document.querySelector('.callerbar').getBoundingClientRect();return [b.bottom,l.bottom,innerHeight,document.documentElement.scrollWidth>innerWidth+1,cb.bottom,b.width]}")
        ok(tag + ' landscape fits (board + Lotería visible)', bb[0] <= bb[2] + 1 and not bb[3] and bb[1] <= min(bb[2], bb[4]) + 1, str(bb))
        page.set_viewport_size({'width': vw, 'height': vh}); page.wait_for_timeout(400)
        # caller on phone
        page.evaluate("()=>{}"); page.go_back(); page.wait_for_selector('.title-logo')
        page.tap('[data-go="caller"]'); page.wait_for_selector('#cnext')
        for k in range(3): page.tap('#cnext')
        page.wait_for_timeout(900); page.screenshot(path=SHOTS + 'mobile_%s_caller.png' % tag)
        ok(tag + ' caller draws', page.evaluate("()=>window.__lotee.C.drawn.length") == 3)
        # offline
        page.wait_for_timeout(2000)
        if reg is True:
            page.evaluate("()=>navigator.serviceWorker.ready"); page.wait_for_timeout(2500)
            ctx.set_offline(True)
            try:
                page.reload(); page.wait_for_selector('.title-logo', timeout=10000); ok(tag + ' offline reload', True)
            except Exception as e: ok(tag + ' offline reload', False, str(e)[:200])
            ctx.set_offline(False)
        br.close()
print('errors:', errs or 'none'); print('SUMMARY %d/%d' % (sum(res), len(res)))
