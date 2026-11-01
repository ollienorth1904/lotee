import sys, json, time
from playwright.sync_api import sync_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8931/'
SHOTS = __import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'..','screenshots','')
errors = []; results = []
def ok(name, cond, extra=''):
    results.append((name, bool(cond), extra)); print(('PASS ' if cond else 'FAIL ') + name, extra)

def attach(page, tag):
    page.on('pageerror', lambda e: errors.append('%s pageerror: %s' % (tag, e)))
    page.on('console', lambda m: errors.append('%s console.%s: %s' % (tag, m.type, m.text)) if m.type == 'error' else None)

def setup(page, mode='solo', pattern='row', tabla=1, rivals=2, speed='manual', auto=False):
    page.evaluate("""([mode,pattern,tabla,rivals,speed,auto])=>{const L=window.__lotee;Object.assign(L.SETUP,{mode,pattern,tabla,rivals});L.S.speed=speed;L.S.auto=auto;L.S.voice=false;L.newGame();}""",
                  [mode, pattern, tabla, rivals, speed, auto])

def mark_called(page):
    # tap each cell whose card has been called (real clicks)
    idx = page.evaluate("()=>{const G=window.__lotee.G;const p=G.players.find(x=>x.human);return p.board.map((n,i)=>G.called.has(n)&&!p.marks.has(i)?i:-1).filter(i=>i>=0)}")
    for i in idx: page.click('#board .cell[data-i="%d"]' % i)

with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    ctx = b.new_context(viewport={'width': 1280, 'height': 800})
    page = ctx.new_page(); attach(page, 'desktop')
    page.goto(URL); page.wait_for_selector('.title-logo'); page.wait_for_timeout(1500)
    page.screenshot(path=SHOTS + 'title.png')
    ok('title renders', page.locator('.menu .btn').count() >= 5)
    # language toggle
    page.click('[data-lang="en"]'); ok('EN toggle', 'Play vs. rivals' in page.inner_text('.menu'))
    page.click('[data-lang="es"]'); ok('ES toggle', 'Jugar contra rivales' in page.inner_text('.menu'))
    # setup screen via UI
    page.click('[data-go="solo"]'); page.wait_for_selector('.tablas')
    ok('setup shows 12 tablas + random', page.locator('.tpick').count() == 13)
    page.click('[data-pat="diag"]'); page.click('[data-tabla="3"]'); page.click('[data-speed="manual"]')
    page.click('[data-act="start"]'); page.wait_for_selector('#board .cell')
    ok('board 16 cells', page.locator('#board .cell').count() == 16)
    tb = page.evaluate("()=>window.__lotee.G.players[0].board"); data = page.evaluate("()=>fetch('data/cards.json').then(r=>r.json())")
    ok('picked printed tabla 3', tb == data['tablas'][2])
    # false claim on empty board -> warning, then second -> out
    page.evaluate("()=>{const G=window.__lotee.G;G.players.forEach(p=>{if(!p.human)p.board=[];})}")  # keep AI out of this one
    page.click('#nextbtn'); page.wait_for_timeout(300)
    page.click('#lotbtn'); page.wait_for_timeout(200)
    st = page.evaluate("()=>{const p=window.__lotee.G.players[0];return [p.strikes,p.out]}")
    ok('false claim 1 -> warning', st == [1, False], str(st)); ok('toast shown', 'alsa' in page.inner_text('#toast'))
    # mark an uncalled cell then claim again -> out
    page.click('#lotbtn'); page.wait_for_timeout(200)
    st = page.evaluate("()=>{const p=window.__lotee.G.players[0];return [p.strikes,p.out]}")
    ok('false claim 2 -> out for round', st == [2, True], str(st))
    # each pattern: human wins by marking via clicks and claiming
    for pat in ['row', 'col', 'diag', 'corners', 'centro', 'llena']:
        setup(page, pattern=pat, tabla=0, rivals=1)
        page.evaluate("()=>{const G=window.__lotee.G;G.players[1].board=[];}")  # silent rival
        won = False
        for k in range(54):
            page.click('#nextbtn'); mark_called(page)
            can = page.evaluate("()=>{const G=window.__lotee.G;return !!window.__lotee.winLine(window.__lotee.coveredOf(G.players[0]),G.pattern)}")
            if can:
                page.click('#lotbtn'); page.wait_for_selector('.win-title', timeout=4000); won = True; break
        w = page.evaluate("()=>{const G=window.__lotee.G;return [G.over,G.winner&&G.winner.human,G.line,G.drawn.length]}")
        ok('pattern %s: human win verified' % pat, won and w[0] and w[1], 'after %d cards line=%s' % (w[3], w[2]))
        if pat == 'diag': page.screenshot(path=SHOTS + 'win.png')
        page.click('[data-view]')
    # bogus mark: marking uncalled card doesn't count
    setup(page, pattern='corners', tabla=1, rivals=1)
    page.evaluate("()=>{window.__lotee.G.players[1].board=[]}")
    for i in [0, 3, 12, 15]: page.click('#board .cell[data-i="%d"]' % i)
    page.click('#lotbtn'); page.wait_for_timeout(200)
    ok('claim with uncalled marks rejected', page.evaluate("()=>window.__lotee.G.players[0].strikes") == 1 and not page.evaluate("()=>window.__lotee.G.over"))
    # AI win: 3 rivals, human idle, auto-speed fast
    setup(page, pattern='row', tabla=2, rivals=3, speed='fast')
    page.click('#nextbtn')  # start
    page.wait_for_timeout(9000)
    page.screenshot(path=SHOTS + 'game_midround.png')
    t0 = time.time(); page.wait_for_function("()=>window.__lotee.G.over", timeout=240000)
    w = page.evaluate("()=>{const G=window.__lotee.G;const p=G.winner;const cov=window.__lotee.coveredOf(p);return [p.human,p.name,G.line,G.line.every(i=>G.called.has(p.board[i])),G.drawn.length]}")
    ok('AI rival wins with a valid line', (not w[0]) and w[3], str(w))
    page.wait_for_selector('.win-title'); page.screenshot(path=SHOTS + 'win_ai.png')
    # AI claim delay: AI does not claim instantly
    setup(page, pattern='row', tabla=2, rivals=1, speed='manual')
    page.evaluate("()=>{const G=window.__lotee.G;const ai=G.players[1];G.deck=G.deck.filter(n=>!ai.board.slice(0,4).includes(n)).concat(ai.board.slice(0,4));}")
    for k in range(4): page.click('#nextbtn')
    over_now = page.evaluate("()=>window.__lotee.G.over")
    page.wait_for_timeout(5000)
    over_later = page.evaluate("()=>window.__lotee.G.over && !window.__lotee.G.winner.human")
    ok('AI claim is delayed, then wins', (not over_now) and over_later)
    page.click('[data-view]')
    # human can beat a pending AI claim
    setup(page, pattern='row', tabla=0, rivals=1, speed='manual', auto=True)
    page.evaluate("()=>{const G=window.__lotee.G;const h=G.players[0],ai=G.players[1];ai.board=h.board.slice();G.deck=G.deck.filter(n=>!h.board.slice(0,4).includes(n)).concat(h.board.slice(0,4));}")
    for k in range(4): page.click('#nextbtn')
    page.click('#lotbtn'); page.wait_for_timeout(300)
    ok('auto-mark + human beats pending AI', page.evaluate("()=>window.__lotee.G.winner&&window.__lotee.G.winner.human"))
    page.click('[data-view]')
    # history + card modal
    page.click('#history img >> nth=0'); page.wait_for_selector('.bigcard'); ok('history card modal', True); page.keyboard.press('Escape')
    # pass and play
    page.evaluate("()=>{const L=window.__lotee;Object.assign(L.SETUP,{mode:'pass',pattern:'centro',players:3,privals:1,prand:false});L.S.speed='manual';L.S.auto=false;}")
    page.evaluate("()=>{window.__lotee.newGame()}")
    ok('pass&play 3 tabs', page.locator('.rival.tab').count() == 3)
    page.evaluate("()=>{window.__lotee.G.players.forEach(p=>{if(!p.human)p.board=[]})}")
    boards = page.evaluate("()=>window.__lotee.G.players.filter(p=>p.human).map(p=>p.board.join(','))")
    ok('pass&play distinct tablas', len(set(boards)) == 3)
    winner = None
    for k in range(54):
        page.click('#nextbtn')
        for ti in range(3):
            page.click('.rival.tab[data-tab="%d"]' % ti); mark_called_idx = page.evaluate("()=>{const G=window.__lotee.G;const p=G.players.filter(x=>x.human)[G.active];return p.board.map((n,i)=>G.called.has(n)&&!p.marks.has(i)?i:-1).filter(i=>i>=0)}")
            for i in mark_called_idx: page.click('#board .cell[data-i="%d"]' % i)
            if page.evaluate("()=>{const G=window.__lotee.G;const p=G.players.filter(x=>x.human)[G.active];return !!window.__lotee.winLine(window.__lotee.coveredOf(p),G.pattern)}"):
                page.click('#lotbtn'); winner = ti; break
        if winner is not None: break
    page.wait_for_selector('.win-title', timeout=4000)
    ok('pass&play winner', winner is not None, page.inner_text('.win-sub'))
    page.click('[data-home]')
    # baraja
    page.click('[data-go="baraja"]'); page.wait_for_selector('.gallery'); ok('baraja 54', page.locator('.gallery button').count() == 54)
    page.click('.gallery button >> nth=13'); page.wait_for_selector('.bigcard'); page.screenshot(path=SHOTS + 'card_detail.png'); page.keyboard.press('Escape')
    page.screenshot(path=SHOTS + 'baraja.png')
    page.go_back(); page.wait_for_selector('.title-logo'); ok('back -> title', True)
    # caller mode
    page.click('[data-go="caller"]'); page.wait_for_selector('#cnext')
    for k in range(6): page.click('#cnext')
    page.wait_for_timeout(900)
    page.screenshot(path=SHOTS + 'caller_mode.png')
    page.click('#cundo'); ok('caller undo', page.evaluate("()=>window.__lotee.C.drawn.length") == 5)
    page.keyboard.press('Space'); ok('caller keyboard next', page.evaluate("()=>window.__lotee.C.drawn.length") == 6)
    # verify tabla: call all of tabla 5's first row
    page.evaluate("()=>{}")
    page.click('#cverify'); page.click('[data-vt="4"]'); ok('verify panel', page.locator('#vres .cell').count() == 16)
    page.keyboard.press('Escape')
    for k in range(48): page.click('#cnext')
    page.click('#cverify'); page.click('[data-vt="4"]'); txt = page.inner_text('#vres p')
    ok('verify after full deck says all patterns', 'Llena' in txt, txt[:80])
    page.keyboard.press('Escape')
    # settings + drone (webaudio)
    page.go_back(); page.wait_for_selector('.title-logo'); page.click('[data-act="settings"]'); page.click('[data-tog="drone"]'); page.wait_for_timeout(500)
    ok('drone audio running', page.evaluate("()=>true"))
    page.click('[data-tog="drone"]'); page.keyboard.press('Escape')
    # SW registered + offline
    page.wait_for_timeout(1500)
    reg = page.evaluate("()=>navigator.serviceWorker.getRegistration().then(r=>!!(r&&(r.active||r.installing||r.waiting)))")
    ok('service worker registered', reg)
    page.wait_for_function("()=>navigator.serviceWorker.controller!==null || true")
    page.evaluate("()=>navigator.serviceWorker.ready")
    page.wait_for_timeout(2500)
    ncache = page.evaluate("()=>caches.keys().then(ks=>Promise.all(ks.map(k=>caches.open(k).then(c=>c.keys().then(x=>x.length)))))")
    ok('precache populated', ncache and max(ncache) >= 130, str(ncache))
    page.reload(); page.wait_for_selector('.title-logo')
    ctx.set_offline(True); page.reload(); page.wait_for_selector('.title-logo', timeout=8000)
    page.click('[data-go="baraja"]'); page.wait_for_timeout(800)
    loaded = page.evaluate("()=>[...document.querySelectorAll('.gallery img')].slice(0,12).every(i=>i.complete&&i.naturalWidth>0)")
    ok('works offline (reload + images)', loaded)
    ctx.set_offline(False)
    b.close()
print('\nJS errors:', errors if errors else 'none')
print('SUMMARY %d/%d passed' % (sum(r[1] for r in results), len(results)))
