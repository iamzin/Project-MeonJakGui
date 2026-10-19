(() => {
  'use strict';
  /* 여기서 조절하세요. 빌드 도구나 라이브러리 없이 동작합니다. */
  const CONFIG = {
    chargeDuration: 2000,   // 100%까지 꾹 누르는 시간(ms)
    burstDuration: 1300,    // "펑!" 연출 후 결과 카드가 나올 때까지(ms)
    particles: 60,
    // 직접 구한 이미지로 캐릭터를 바꾸려면 true 로 바꾸고 assets/character/ 에 파일을 넣으세요.
    useImages: true,
    images: {
      idle: 'assets/character/idle.png',        // 가만히 서 있는 모습
      think: 'assets/character/idle.png',       // 고민 (기울기·식은땀은 CSS)
      torn: 'assets/character/idle.png',
      tremble: 'assets/character/idle.png',     // 떨림·효과선은 CSS
      ready: 'assets/character/idle.png',
      burst: 'assets/character/happy.png',      // 펑! 점프하는 모습
      happy: 'assets/character/eat.png'         // 결과: 맛있게 먹는 모습
    }
  };

  const $ = id => document.getElementById(id);
  const app = $('app'), button = $('holdButton'), characterButton = $('characterButton');
  const meter = $('meter'), fill = $('meterFill'), star = $('meterStar'), image = $('characterImage');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MENUS = window.MENUS || [], CATEGORIES = window.MENU_CATEGORIES || {};

  const states = [
    { at: 0, name: 'idle', speech: '뭐 먹지…?', caption: '오늘 저녁… 뭐가 좋을까' },
    { at: 20, name: 'think', speech: '으음…', caption: '고민 중… 고민 중…' },
    { at: 45, name: 'torn', speech: '이것도… 저것도…', caption: '전부 맛있을 것 같은데…!' },
    { at: 70, name: 'tremble', speech: '아, 알 것 같아…!', caption: '두근… 두근…' },
    { at: 90, name: 'ready', speech: '정했어…!!', caption: '어떻게든 되겠지—!' }
  ];

  if (CONFIG.useImages) {
    app.classList.add('use-images');
    image.hidden = false;
    Object.values(CONFIG.images).forEach(src => { const img = new Image(); img.src = src; });
  }

  let progress = 0, phase = 'idle', holding = false, frame = 0, lastTime = 0, stateIndex = -1;
  let category = 'all', lastPick = null, current = null;
  let resultTimer = 0, cleanupTimer = 0, activePointer = null, activeKey = null;

  function announce(text) { $('announcement').textContent = text; }
  function setState(name, speech, caption) {
    app.dataset.state = name;
    if (CONFIG.useImages && CONFIG.images[name]) image.src = CONFIG.images[name];
    if (speech !== undefined) $('speechText').textContent = speech;
    if (caption !== undefined) $('captionText').textContent = caption;
  }

  function paint() {
    const integer = Math.min(100, Math.floor(progress));
    $('percent').textContent = integer; fill.style.width = `${progress}%`;
    star.style.left = `${progress}%`; star.style.opacity = progress > 1 ? '1' : '0';
    meter.setAttribute('aria-valuenow', integer); app.style.setProperty('--charge', progress / 100);
    const next = states.reduce((cur, s, i) => progress >= s.at ? i : cur, 0);
    if (next !== stateIndex && phase === 'idle') {
      stateIndex = next; const s = states[next];
      setState(s.name, s.speech, s.caption);
      if (progress > 0) announce(s.caption);
    }
  }
  function tick(time) {
    if (!holding || phase !== 'idle') return;
    if (lastTime) progress = Math.min(100, progress + (Math.min(time - lastTime, 80) / CONFIG.chargeDuration) * 100);
    lastTime = time; paint();
    if (progress >= 100) { reveal(); return; }
    frame = requestAnimationFrame(tick);
  }
  function start() {
    if (holding || phase !== 'idle' || app.dataset.mode !== 'pick') return;
    holding = true; lastTime = 0; app.classList.add('holding'); $('buttonLabel').textContent = '으음… 고민 중';
    frame = requestAnimationFrame(tick);
  }
  function stop() {
    holding = false; lastTime = 0; activePointer = null; activeKey = null;
    cancelAnimationFrame(frame); app.classList.remove('holding');
    if (phase === 'idle') $('buttonLabel').textContent = progress > 0 ? '조금만 더 꾹…' : '꾹 눌러서 골라달라고 하기';
  }

  [button, characterButton].forEach(control => {
    control.addEventListener('pointerdown', event => {
      if ((event.pointerType === 'mouse' && event.button !== 0) || activePointer !== null || phase !== 'idle') return;
      event.preventDefault(); activePointer = event.pointerId;
      try { control.setPointerCapture?.(event.pointerId); } catch { /* 이미 사라진 포인터 */ }
      start();
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => control.addEventListener(type, event => {
      if (event.pointerId === activePointer) stop();
    }));
    control.addEventListener('contextmenu', event => event.preventDefault());
    control.addEventListener('keydown', event => {
      if (![' ', 'Enter'].includes(event.key)) return;
      event.preventDefault(); if (!event.repeat && phase === 'idle') { activeKey = event.key; start(); }
    });
    control.addEventListener('keyup', event => { if (event.key === activeKey) { event.preventDefault(); stop(); } });
    control.addEventListener('blur', () => { if (activeKey) stop(); });
    // 스크린리더는 pointer/keyboard 이벤트 없이 click 만 보냅니다.
    control.addEventListener('click', event => { if (event.detail === 0 && !activeKey && !holding && phase === 'idle') start(); });
  });
  window.addEventListener('blur', stop);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });

  // 카테고리 선택
  $('chips').addEventListener('click', event => {
    const chip = event.target.closest('.chip'); if (!chip) return;
    category = chip.dataset.cat;
    $('chips').querySelectorAll('.chip').forEach(c => c.setAttribute('aria-checked', String(c === chip)));
    announce(`${CATEGORIES[category] || '전체'} 메뉴 중에서 골라요.`);
  });

  function pick() {
    let pool = category === 'all' ? MENUS : MENUS.filter(m => m.cat === category);
    if (pool.length > 1 && lastPick) pool = pool.filter(m => m.id !== lastPick.id);
    if (!pool.length) pool = MENUS;
    const menu = pool[Math.floor(Math.random() * pool.length)];
    lastPick = menu; return menu;
  }
  function applyMenu(menu) {
    current = menu;
    const length = Array.from(menu.name).length;
    app.style.setProperty('--burst-size', length <= 4 ? '58px' : length <= 7 ? '44px' : '34px');
    $('burstText').textContent = `${menu.name}!`;
    $('resultEmoji').textContent = menu.emoji; $('resultName').textContent = menu.name;
    $('resultTag').textContent = CATEGORIES[menu.cat] || ''; $('resultComment').textContent = menu.say;
  }

  function reveal() {
    phase = 'burst'; stop(); app.dataset.phase = 'burst';
    applyMenu(pick());
    setState('burst', '어떻게든 되겠지—!!', '정했다—!!');
    button.disabled = true; characterButton.disabled = true;
    $('buttonLabel').textContent = '펑—!!'; $('meterLabel').textContent = '고민 끝!';
    $('burstMessage').setAttribute('aria-hidden', 'false');
    announce(`오늘 저녁은 ${current.name}!`);
    if (navigator.vibrate) navigator.vibrate([35, 40, 65]);
    confetti();
    resultTimer = window.setTimeout(showResult, CONFIG.burstDuration);
  }
  function showResult() {
    phase = 'result'; app.dataset.phase = 'result';
    $('burstMessage').setAttribute('aria-hidden', 'true');
    setState('happy', '이거다!', '헤헤… 맛있게 먹어!');
    $('eyebrow').textContent = '하치와레가 고른 오늘 저녁은';
    $('title').innerHTML = `${current.name} ${current.emoji}`;
    $('result').hidden = false; button.hidden = true; $('resultActions').hidden = false;
    $('linkStatus').textContent = '';
    announce(`${current.name}. ${current.say}`);
    if (document.activeElement === button || document.activeElement === characterButton) $('replayButton').focus({ preventScroll: true });
    confetti(true);
  }
  function confetti(second = false) {
    if (reduceMotion) return;
    const container = $('particles');
    const colors = ['#8dbce8', '#f2a65a', '#f6b4bf', '#b7d7a8', '#ffd66b'];
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < (second ? 24 : CONFIG.particles); i++) {
      const type = i % 7 === 0 ? 'star' : i % 9 === 0 ? 'heart' : '';
      let particle;
      if (type) {
        particle = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); particle.setAttribute('viewBox', '0 0 24 24');
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use'); use.setAttribute('href', `#${type}`); particle.append(use);
      } else particle = document.createElement('i');
      particle.setAttribute('class', `particle ${type}`);
      const angle = (-170 + Math.random() * 160) * Math.PI / 180, distance = 120 + Math.random() * 270;
      particle.style.cssText = `--particle-color:${colors[i % colors.length]};--dx:${Math.cos(angle) * distance}px;--dy:${Math.sin(angle) * distance + (second ? 360 : 130)}px;--spin:${(Math.random() - .5) * 900}deg;--duration:${1.8 + Math.random() * 1.5}s;--delay:${Math.random() * .22}s;`;
      fragment.append(particle);
    }
    container.append(fragment); clearTimeout(cleanupTimer);
    cleanupTimer = window.setTimeout(() => container.replaceChildren(), 4000);
  }

  function reset(focus = true) {
    clearTimeout(resultTimer); clearTimeout(cleanupTimer); stop();
    phase = 'idle'; progress = 0; stateIndex = -1; current = null;
    app.dataset.phase = 'idle'; app.dataset.mode = 'pick'; $('particles').replaceChildren();
    $('eyebrow').textContent = '오늘 저녁 뭐 먹지?';
    $('title').innerHTML = '하치와레가<br>골라줄게<span class="accent">!</span>';
    $('result').hidden = true; $('resultActions').hidden = true; $('tryButton').hidden = true;
    button.hidden = false; button.disabled = false; characterButton.disabled = false;
    $('buttonLabel').textContent = '꾹 눌러서 골라달라고 하기'; $('meterLabel').textContent = '고민';
    $('burstMessage').setAttribute('aria-hidden', 'true'); $('linkStatus').textContent = '';
    paint(); announce('다시 꾹 눌러서 골라달라고 하세요.');
    if (focus) button.focus({ preventScroll: true });
  }
  $('replayButton').addEventListener('click', () => reset());
  $('tryButton').addEventListener('click', () => { history.replaceState(null, '', location.pathname + location.search); reset(); });

  // 공유 링크: 결과는 URL 해시에만 담깁니다. 서버·쿠키·저장소 없음.
  function encodeResult(menu) {
    const bytes = new TextEncoder().encode(JSON.stringify({ v: 1, id: menu.id }));
    return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decodeResult(fragment) {
    const encoded = new URLSearchParams(fragment.replace(/^#/, '')).get('r');
    if (!encoded || encoded.length > 256 || !/^[A-Za-z0-9_-]+$/.test(encoded)) throw Error('invalid');
    const base = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(base + '='.repeat((4 - base.length % 4) % 4)), c => c.charCodeAt(0));
    const data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    const menu = MENUS.find(m => m.id === data.id);
    if (data.v !== 1 || !menu) throw Error('invalid');
    return menu;
  }
  function shareURL() { return `${location.origin}${location.pathname}#r=${encodeResult(current)}`; }
  function shareText() { return `하치와레가 고른 오늘 저녁은 ${current.name} ${current.emoji}`; }
  async function copyLink() {
    try { await navigator.clipboard.writeText(shareURL()); $('linkStatus').textContent = '링크를 복사했어! 친구한테 보내 봐.'; }
    catch { $('linkStatus').textContent = shareURL(); }
  }
  $('copyButton').addEventListener('click', copyLink);
  $('shareButton').addEventListener('click', async () => {
    if (!current) return;
    if (navigator.share) {
      try { await navigator.share({ title: '하치와레가 저녁 골라줄게!', text: shareText(), url: shareURL() }); $('linkStatus').textContent = '전했어!'; }
      catch (error) { if (error && error.name !== 'AbortError') copyLink(); }
    } else copyLink();
  });

  function receive(menu) {
    reset(false); applyMenu(menu); lastPick = menu;
    phase = 'result'; app.dataset.phase = 'result'; app.dataset.mode = 'receive';
    setState('happy', '이거 어때?', '친구가 하치와레한테 골라달라고 했대!');
    $('eyebrow').textContent = '하치와레가 고른 오늘 저녁은';
    $('title').innerHTML = `${menu.name} ${menu.emoji}`;
    $('result').hidden = false; button.hidden = true; $('tryButton').hidden = false;
    announce(`하치와레가 고른 저녁은 ${menu.name}. ${menu.say}`);
  }
  function route() {
    if (!location.hash) { reset(false); return; }
    try { receive(decodeResult(location.hash)); }
    catch { history.replaceState(null, '', location.pathname + location.search); reset(false); }
  }
  window.addEventListener('hashchange', route);
  route();
})();
