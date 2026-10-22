(function () {
  // Always scroll to top on reload/refresh
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.addEventListener('beforeunload', function () {
    window.scrollTo(0, 0);
  });
  window.addEventListener('load', function () {
    window.scrollTo(0, 0);
  });
  if (window.location.hash) {
    history.replaceState(null, null, window.location.pathname + window.location.search);
    window.scrollTo(0, 0);
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var modSvg = document.getElementById('mod-svg');
  function restart(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
  function shake(el) { if (reduced) return; restart(el, 'shake'); setTimeout(function () { el.classList.remove('shake'); }, 450); }
  function confetti(from) {
    if (reduced || !from.animate) return;
    var r = from.getBoundingClientRect(), c = ['#FF7EB6', '#FFD23F', '#3DDCFF', '#9BE564', '#FF8C42', '#9B5DE5'];
    for (var n = 0; n < 46; n++) {
      var p = document.createElement('span'); p.className = 'confetti';
      p.style.background = c[n % c.length];
      p.style.left = (r.left + r.width * Math.random()) + 'px'; p.style.top = (r.top + r.height / 2) + 'px';
      document.body.appendChild(p);
      var dx = (Math.random() - .5) * 360, up = 120 + Math.random() * 160, spin = (Math.random() - .5) * 1080;
      p.animate([
        { transform: 'translate(0,0) rotate(0)', opacity: 1 },
        { transform: 'translate(' + dx * .6 + 'px,' + -up + 'px) rotate(' + spin / 2 + 'deg)', opacity: 1, offset: .35 },
        { transform: 'translate(' + dx + 'px,' + (up * .8) + 'px) rotate(' + spin + 'deg)', opacity: 0 }
      ], { duration: 1300 + Math.random() * 600, easing: 'cubic-bezier(.2,.6,.4,1)' }).onfinish = (function (el) { return function () { el.remove(); }; })(p);
    }
  }
  // ---------- release info (filled in by update_release.py)
  var rel = {};
  try { rel = JSON.parse(document.getElementById('release-data').textContent); } catch (e) {}
  function mb(n) { return n > 0 ? (n / 1048576).toFixed(1) + ' MB' : '—'; }
  function fmtDate(s) {
    var d = new Date(s + 'T00:00:00');
    return isNaN(d) ? s : d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }
  var ready = rel.sha256 && rel.sha256 !== 'PENDING';
  var values = {
    name: rel.name || 'OutOfContext.exe',
    version: rel.version || '1.0.0',
    size: mb(rel.size),
    bytes: rel.size > 0 ? mb(rel.size) + ' (' + rel.size.toLocaleString() + ' bytes)' : '—',
    sha256: ready ? rel.sha256 : 'Published with the next build',
    date: rel.date ? fmtDate(rel.date) : '—'
  };
  document.querySelectorAll('[data-r]').forEach(function (el) { el.textContent = values[el.getAttribute('data-r')]; });
  var dl = document.getElementById('dl');
  if (rel.file) dl.setAttribute('href', rel.file);
  if (!ready) dl.setAttribute('aria-disabled', 'true');

  // ---------- copy buttons
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var text = values[b.getAttribute('data-copy')];
      var label = b.textContent;
      function done() { b.textContent = 'Copied'; b.classList.add('done'); setTimeout(function () { b.textContent = label; b.classList.remove('done'); }, 1600); }
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () {});
      else {
        var t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select();
        try { document.execCommand('copy'); done(); } catch (e) {} document.body.removeChild(t);
      }
    });
  });

  // ---------- compare pasted checksum
  var paste = document.getElementById('paste'), verdict = document.getElementById('verdict');
  paste.addEventListener('input', function () {
    var m = paste.value.toUpperCase().match(/[0-9A-F]{64}/);
    if (!paste.value.trim()) { verdict.textContent = ''; verdict.className = 'verdict'; return; }
    if (!m) { verdict.textContent = 'That doesn\'t look like a SHA-256 checksum yet (64 letters and numbers).'; verdict.className = 'verdict bad'; return; }
    if (!ready) { verdict.textContent = 'There is no published checksum to compare with yet.'; verdict.className = 'verdict bad'; return; }
    if (m[0] === rel.sha256.toUpperCase()) {
      var was = verdict.classList.contains('ok');
      verdict.textContent = 'It matches. Safe to play.'; verdict.className = 'verdict ok';
      if (!was) confetti(paste);
    } else {
      verdict.textContent = 'It does not match. Delete that file and download it again from this page.'; verdict.className = 'verdict bad';
      shake(paste);
    }
  });

  // ---------- title letters (the game's main menu colours)
  var cols = ['#FF7EB6', '#FFD23F', '#3DDCFF', '#9BE564', '#FF8C42', '#9B5DE5'];
  var k = 0;
  function letters(el, word) {
    for (var i = 0; i < word.length; i++) {
      if (word[i] === ' ') { var g = document.createElement('span'); g.className = 'gap'; el.appendChild(g); continue; }
      var s = document.createElement('span');
      s.className = 'l'; s.textContent = word[i];
      s.style.setProperty('--c', cols[k % cols.length]);
      s.style.setProperty('--i', k);
      s.style.setProperty('--r', ((k % 3) - 1) * 10 + 'deg');
      s.style.setProperty('--rr', ((k * 7) % 5 - 2) + 'deg');
      el.appendChild(s); k++;
    }
  }
  letters(document.getElementById('t1'), 'OUT OF');
  letters(document.getElementById('t2'), 'CONTEXT');
  document.querySelectorAll('.title .l').forEach(function (l) {
    l.addEventListener('animationend', function (e) {
      if (e.animationName === 'drop') l.classList.add('landed');
      if (e.animationName === 'jump') l.classList.remove('jump');
    });
    l.addEventListener('pointerenter', function () {
      if (!l.classList.contains('landed') || l.classList.contains('jump')) return;
      l.classList.add('jump');
    });
  });

  // ---------- stage board
  var stages = ['Warm-Up', 'Slime Jumps', 'Checkerboard of Lies', 'Choose a Door', 'Disappearing Stairs', 'Rush Hour',
                'The Quiz Show', 'The Comment Section', 'Out of Context', 'Sponsor Segment', 'Now Loading', 'Vs. The Algorithm'];
  var stageCols = ['#FF7EB6', '#9BE564', '#3DDCFF', '#FF8C42', '#9B5DE5', '#e8b400', '#FF7EB6', '#4D7CFE', '#FF3D8F', '#FF8C42', '#22b8dd', '#9B5DE5'];
  var board = document.getElementById('board');
  stages.forEach(function (name, i) {
    var t = document.createElement('div');
    t.className = 'tile' + (i === 11 ? ' boss' : '');
    t.style.setProperty('--c', stageCols[i]);
    t.innerHTML = '<span class="n">' + (i < 9 ? '0' : '') + (i + 1) + '</span><span class="name"></span>';
    t.querySelector('.name').textContent = name;
    if (i === 2) {
      t.addEventListener('pointerenter', function () {
        if (reduced || t.classList.contains('fake')) return;
        t.classList.add('fake');
        var f = document.createElement('span'); f.className = 'fake-label show'; f.textContent = 'Fake!';
        f.style.left = t.offsetLeft + 'px'; f.style.top = t.offsetTop + 'px';
        f.style.width = t.offsetWidth + 'px'; f.style.height = t.offsetHeight + 'px';
        board.appendChild(f);
        f.addEventListener('animationend', function () { f.remove(); });
        if (typeof saySuggestion === 'function' && (window.scrollY || 0) < 650) {
          saySuggestion({ face: 'shocked', text: "Told you! Fake floor! There are dozens more in the actual game.", sub: "Stage 3 spoiler" }, 4500);
        }
      });
      t.addEventListener('animationend', function (e) { if (e.animationName === 'fakefall') t.classList.remove('fake'); });
    } else if (!reduced) {
      t.addEventListener('pointermove', function (e) {
        var r = t.getBoundingClientRect();
        t.style.setProperty('--ty', ((e.clientX - r.left) / r.width - .5) * 16 + 'deg');
        t.style.setProperty('--tx', -((e.clientY - r.top) / r.height - .5) * 16 + 'deg');
      });
      t.addEventListener('pointerleave', function () { t.style.removeProperty('--tx'); t.style.removeProperty('--ty'); });
    }
    board.appendChild(t);
  });

  // ---------- particle trails pool (shared by hero & companion moderators)
  var trailPool = [];
  var trailIdx = 0;
  var TRAIL_COUNT = 16;
  var trailColors = ['#FF7EB6', '#FFD23F', '#3DDCFF', '#9BE564', '#FF8C42', '#9B5DE5'];
  for (var ti = 0; ti < TRAIL_COUNT; ti++) {
    var dot = document.createElement('div');
    dot.className = 'mod-trail';
    dot.style.background = trailColors[ti % trailColors.length];
    document.body.appendChild(dot);
    trailPool.push(dot);
  }
  var trailThrottle = 0;

  function spawnTrail(x, y) {
    if (reduced) return;
    var now = performance.now();
    if (now - trailThrottle < 45) return;
    trailThrottle = now;
    var d = trailPool[trailIdx % TRAIL_COUNT];
    trailIdx++;
    d.style.left = x + 'px';
    d.style.top = y + 'px';
    if (d.animate) {
      d.animate([
        { opacity: .75, transform: 'scale(1) translate(0, 0)' },
        { opacity: 0, transform: 'scale(.2) translate(' + ((Math.random() - .5) * 50) + 'px, ' + (15 + Math.random() * 30) + 'px)' }
      ], { duration: 600 + Math.random() * 400, easing: 'ease-out', fill: 'forwards' });
    }
  }

  // ---------- poke the Moderator (facial expressions + humor)
  var modFaces = {
    smug: '<path d="M58 88q7-9 14 0M88 88q7-9 14 0" stroke="#FFD23F" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M74 100q6 5 12 0" stroke="#FFD23F" stroke-width="4" fill="none" stroke-linecap="round"/>',
    surprised: '<circle cx="65" cy="87" r="7" fill="#3DDCFF"/><circle cx="67" cy="86" r="2.5" fill="#15161C"/><circle cx="95" cy="87" r="7" fill="#3DDCFF"/><circle cx="97" cy="86" r="2.5" fill="#15161C"/><circle cx="80" cy="101" r="4.5" fill="none" stroke="#FFD23F" stroke-width="3"/>',
    annoyed: '<path d="M56 88h16M88 88h16" stroke="#FFD23F" stroke-width="5" stroke-linecap="round"/><path d="M56 82l16 2M104 82l-16 2" stroke="#FF7EB6" stroke-width="3" stroke-linecap="round"/><path d="M73 100h14" stroke="#FFD23F" stroke-width="4" stroke-linecap="round"/>',
    angry: '<path d="M57 84l14 5-14 5M103 84l-14 5 14 5" stroke="#FF2F4F" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M72 101l4-3 4 3 4-3 4 3" stroke="#FF2F4F" stroke-width="3" fill="none" stroke-linecap="round"/>',
    dizzy: '<path d="M59 83l12 10M71 83l-12 10M89 83l12 10M101 83l-12 10" stroke="#3DDCFF" stroke-width="4" stroke-linecap="round"/><path d="M72 101q4-4 8 0t8 0" stroke="#3DDCFF" stroke-width="3.5" fill="none" stroke-linecap="round"/>',
    queasy: '<circle cx="65" cy="87" r="7" fill="none" stroke="#9BE564" stroke-width="3"/><circle cx="95" cy="87" r="7" fill="none" stroke="#9BE564" stroke-width="3"/><ellipse cx="53" cy="95" rx="5" ry="3" fill="#9BE564" opacity=".85"/><ellipse cx="107" cy="95" rx="5" ry="3" fill="#9BE564" opacity=".85"/><path d="M72 102q4-6 8 0t8 0" stroke="#9BE564" stroke-width="4" fill="none" stroke-linecap="round"/>',
    wink: '<path d="M57 89q8 6 15 0" stroke="#FFD23F" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="95" cy="87" r="6.5" fill="#FFD23F"/><circle cx="93" cy="85" r="2" fill="#15161C"/><path d="M74 100q7 4 14-4" stroke="#FFD23F" stroke-width="4" fill="none" stroke-linecap="round"/>',
    crying: '<path d="M57 85h16M65 85v9M87 85h16M95 85v9" stroke="#3DDCFF" stroke-width="4.5" stroke-linecap="round"/><ellipse cx="60" cy="98" rx="2" ry="4" fill="#3DDCFF"/><ellipse cx="100" cy="98" rx="2" ry="4" fill="#3DDCFF"/><path d="M73 103q7-5 14 0" stroke="#FFD23F" stroke-width="3.5" fill="none" stroke-linecap="round"/>',
    cool: '<rect x="52" y="82" width="22" height="11" rx="2" fill="#15161C" stroke="#3DDCFF" stroke-width="2.5"/><rect x="86" y="82" width="22" height="11" rx="2" fill="#15161C" stroke="#3DDCFF" stroke-width="2.5"/><line x1="74" y1="87" x2="86" y2="87" stroke="#3DDCFF" stroke-width="3"/><path d="M74 100q6 4 12 0" stroke="#9BE564" stroke-width="4" fill="none" stroke-linecap="round"/>',
    sideEye: '<rect x="56" y="86" width="16" height="5" rx="2.5" fill="#FFD23F"/><circle cx="59" cy="88.5" r="3" fill="#FF3D8F"/><rect x="88" y="86" width="16" height="5" rx="2.5" fill="#FFD23F"/><circle cx="91" cy="88.5" r="3" fill="#FF3D8F"/><path d="M73 101q5-3 10 0t5 2" stroke="#FFD23F" stroke-width="3.5" fill="none" stroke-linecap="round"/>',
    shocked: '<circle cx="65" cy="86" r="7" fill="none" stroke="#3DDCFF" stroke-width="3.5"/><circle cx="95" cy="86" r="7" fill="none" stroke="#3DDCFF" stroke-width="3.5"/><rect x="74" y="96" width="12" height="9" rx="3" fill="#FF3D8F" stroke="#FFD23F" stroke-width="2"/>'
  };

  function setModFace(el, faceKey) {
    if (!el) return;
    el.innerHTML = modFaces[faceKey] || modFaces.smug;
  }

  // Smooth speech bubble message transition
  function setBubbleSmooth(bubbleEl, textOrHtml, isHtml) {
    if (!bubbleEl) return;
    if (reduced) {
      if (isHtml) bubbleEl.innerHTML = textOrHtml;
      else bubbleEl.textContent = textOrHtml;
      bubbleEl.classList.remove('changing');
      bubbleEl.classList.add('visible');
      return;
    }
    if (!bubbleEl.classList.contains('visible') || window.getComputedStyle(bubbleEl).opacity === '0') {
      if (isHtml) bubbleEl.innerHTML = textOrHtml;
      else bubbleEl.textContent = textOrHtml;
      bubbleEl.classList.remove('changing');
      bubbleEl.classList.add('visible');
      return;
    }

    bubbleEl.classList.add('changing');
    setTimeout(function () {
      if (isHtml) bubbleEl.innerHTML = textOrHtml;
      else bubbleEl.textContent = textOrHtml;
      bubbleEl.classList.remove('changing');
      bubbleEl.classList.add('visible');
    }, 130);
  }


  var pokeReactions = [
    { face: 'surprised', text: 'HEY! Personal space is a legal concept, you know!' },
    { face: 'annoyed', text: 'Do I look like an iPad at an airport kiosk? I have binary feelings.' },
    { face: 'angry', text: 'THAT IS IT! Adding five fake platforms to Stage 3 out of pure spite.' },
    { face: 'dizzy', text: 'Error 404: Dignity not found. Internal gyroscope spinning wildly...' },
    { face: 'wink', text: 'Admit it. You are obsessed with me. I do have stellar aerodynamics.' },
    { face: 'crying', text: 'Nobody asks HOW is the host. It is always WHERE is the download button...' },
    { face: 'sideEye', text: 'I am watching your cursor. Do not try anything funny.' },
    { face: 'cool', text: 'You cannot rattle me, rookie. I am 100% Teflon-coated charisma.' },
    { face: 'shocked', text: 'SECURITY! There is a rogue cursor assaulting the anchorperson!' },
    { face: 'annoyed', text: 'The download button is GREEN. I am PINK. Do you need a color check?' },
    { face: 'angry', text: 'One more poke and I will personally invert your jump key in Unity.' },
    { face: 'cool', text: 'Go ahead, poke away. My contract guarantees comprehensive hazard pay.' }
  ];

  var pokes = 0, bubble = document.getElementById('bubble');
  var modFace = document.getElementById('mod-face');
  var modBtn = document.getElementById('mod');
  var modSvg = document.getElementById('mod-svg');
  // scene and stage declared earlier
  var robotEl = document.getElementById('robot');
  var modFaceTimer = null;

  // Drag and drop reactions (NO EMOJIS)
  var heroDragLines = [
    'Unhand the host! This is not in my contract!',
    'Wait wait wait! I am not a draggable desktop icon!',
    'Put me down! You are messing with my aerodynamics!',
    'I am an award-winning game show host, not a fridge magnet!',
    'Who authorized this relocation?! Call security!',
    'Mayday! Host being kidnapped in broad daylight!'
  ];

  var heroDropLines = [
    'My internal gyroscope will need five minutes to recalibrate.',
    'Rude. Positively rude. I am filing a union grievance.',
    'And stay back! I am choosing this exact coordinate out of spite.',
    'Ouch. My pride took 50 points of fall damage.',
    'Fine! I will hover right here! The view is mediocre anyway.'
  ];

  // Stage patrol waypoints for autonomous flight (NO EMOJIS)
  var modWaypoints = [
    {
      name: 'right',
      xRatio: 0.82,
      yRatio: 0.12,
      face: 'smug',
      text: 'Back to my home perch. Did you miss me?',
      sub: 'Classic studio spot'
    },
    {
      name: 'center',
      xRatio: 0.44,
      yRatio: 0.05,
      face: 'cool',
      text: 'Surveying the arena from above. Looking sharp, robot!',
      sub: 'Overhead drone mode'
    },
    {
      name: 'left',
      xRatio: 0.04,
      yRatio: 0.12,
      face: 'wink',
      text: 'Relocating to the left wing! Better lighting over here.',
      sub: 'Left wing tour'
    },
    {
      name: 'low',
      xRatio: 0.72,
      yRatio: 0.38,
      face: 'sideEye',
      text: 'Checking the platform foundations. Looks 40% edible.',
      sub: 'Structural inspection'
    }
  ];

  var currentWaypointIdx = 0;
  var autonomousTimer = null;
  var isHeroAutonomous = false;

  function updateHeroBubblePos(modLeft, modTop, modW) {
    if (!bubble || !stage) return;
    var stageW = stage.offsetWidth || 500;
    var stageH = stage.offsetHeight || 310;
    var isMobile = window.innerWidth <= 560;

    if (modLeft > stageW * 0.45) {
      // Mod is on right half -> bubble sits to the left of mod
      bubble.classList.remove('flip');
      if (isMobile) {
        bubble.style.left = 'auto';
        bubble.style.right = (stageW - modLeft + 8) + 'px';
        bubble.style.top = Math.max(8, Math.min(stageH - 70, modTop - 2)) + 'px';
        bubble.style.maxWidth = Math.min(195, Math.max(110, modLeft - 12)) + 'px';
      } else {
        bubble.style.left = 'auto';
        bubble.style.right = (stageW - modLeft + 14) + 'px';
        bubble.style.top = Math.max(10, Math.min(stageH - 120, modTop - 20)) + 'px';
        bubble.style.maxWidth = Math.min(290, modLeft - 20) + 'px';
      }
    } else {
      // Mod is on left half -> bubble sits to the right of mod
      bubble.classList.add('flip');
      if (isMobile) {
        bubble.style.right = 'auto';
        bubble.style.left = (modLeft + modW + 8) + 'px';
        bubble.style.top = Math.max(8, Math.min(stageH - 70, modTop - 2)) + 'px';
        bubble.style.maxWidth = Math.min(195, Math.max(110, stageW - (modLeft + modW) - 12)) + 'px';
      } else {
        bubble.style.right = 'auto';
        bubble.style.left = (modLeft + modW + 14) + 'px';
        bubble.style.top = Math.max(10, Math.min(stageH - 120, modTop - 20)) + 'px';
        bubble.style.maxWidth = Math.min(290, stageW - (modLeft + modW) - 20) + 'px';
      }
    }
  }

  function flyHeroToWaypoint(idx) {
    if (!stage || !modBtn || isDraggingMod) return;
    var stageW = stage.offsetWidth;
    var stageH = stage.offsetHeight;
    if (!stageW || !stageH) return;

    var wp = modWaypoints[idx % modWaypoints.length];
    currentWaypointIdx = idx % modWaypoints.length;

    var modW = modBtn.offsetWidth || (window.innerWidth <= 560 ? 92 : 180);
    var modH = modBtn.offsetHeight || modW;

    var isMobile = window.innerWidth <= 560;
    var maxTop = isMobile ? Math.min(130, stageH - modH - 30) : (stageH - modH - 30);
    var targetX = Math.round(wp.xRatio * (stageW - modW));
    var targetY = Math.round((isMobile ? Math.min(0.25, wp.yRatio) : wp.yRatio) * (stageH - modH));
    targetX = Math.max(6, Math.min(stageW - modW - 6, targetX));
    targetY = Math.max(6, Math.min(maxTop, targetY));

    var curLeft = modBtn.offsetLeft;
    var deltaX = targetX - curLeft;
    var tiltDeg = deltaX > 15 ? 12 : (deltaX < -15 ? -12 : 0);

    isHeroAutonomous = true;
    modBtn.classList.add('flying');
    modBtn.style.left = targetX + 'px';
    modBtn.style.top = targetY + 'px';
    modBtn.style.right = 'auto';

    if (modSvg && tiltDeg !== 0) {
      modSvg.style.transition = 'transform .45s ease';
      modSvg.style.transform = 'rotate(' + tiltDeg + 'deg)';
    }

    if (robotEl) {
      if (wp.name === 'center') {
        robotEl.classList.add('look-up');
      } else {
        robotEl.classList.remove('look-up');
      }
    }

    for (var bi = 0; bi < 4; bi++) {
      setTimeout(function () {
        var r = modBtn.getBoundingClientRect();
        spawnTrail(r.left + modW / 2, r.top + modH / 2);
      }, bi * 180);
    }

    updateHeroBubblePos(targetX, targetY, modW);

    saySuggestion({ face: wp.face, text: wp.text, sub: wp.sub }, 4800);

    setTimeout(function () {
      modBtn.classList.remove('flying');
      if (modSvg) {
        modSvg.style.transition = '';
        modSvg.style.transform = '';
      }
      isHeroAutonomous = false;
    }, 1500);
  }

  function scheduleHeroAutonomous() {
    clearTimeout(autonomousTimer);
    autonomousTimer = setTimeout(function () {
      var scrollY = window.scrollY || window.pageYOffset;
      if (scrollY < 650 && !isDraggingMod) {
        flyHeroToWaypoint(currentWaypointIdx + 1);
      }
      scheduleHeroAutonomous();
    }, 17000 + Math.random() * 5000);
  }
  scheduleHeroAutonomous();

  var isDraggingMod = false;
  var modPointerDown = false;
  var dragStartX = 0, dragStartY = 0;
  var initModLeft = 0, initModTop = 0;
  var dragDist = 0;

  function triggerPoke() {
    pokes++;
    var rx;
    if (pokes === 10) {
      rx = { face: 'annoyed', text: 'Ten pokes! You have earned a PhD in Procrastination. Now go download the game.' };
    } else if (pokes === 20) {
      rx = { face: 'shocked', text: 'Twenty pokes?! Is this the gameplay you came for?! The actual game has 12 stages!' };
    } else if (pokes === 30) {
      rx = { face: 'angry', text: 'Thirty pokes. I am taking an unscheduled coffee break. Talk to the robot.' };
    } else if (pokes >= 50 && pokes % 10 === 0) {
      rx = { face: 'dizzy', text: pokes + ' pokes. You win. I am officially exhausted. Press Download!' };
    } else {
      rx = pokeReactions[(pokes - 1) % pokeReactions.length];
    }

    setModFace(modFace, rx.face);
    var bubbleMsg = rx.text + '<small>Pokes: ' + pokes + '</small>';
    setBubbleSmooth(bubble, bubbleMsg, true);
    restart(bubble, 'pop');

    restart(modBtn, 'poked');

    if (pokes % 3 === 0 && modSvg) restart(modSvg, 'roll');

    clearTimeout(modFaceTimer);
    modFaceTimer = setTimeout(function () {
      setModFace(modFace, 'smug');
    }, 3500);

    clearTimeout(idleTimer);
    scheduleIdleSuggestion();
  }

  modBtn.addEventListener('pointerdown', function (e) {
    if (e.button !== undefined && e.button !== 0) return;
    modPointerDown = true;
    clearTimeout(autonomousTimer);
    clearTimeout(idleTimer);
    isDraggingMod = false;
    dragDist = 0;
    dragStartX = e.clientX;
    dragStartY = e.clientY;

    var sRect = stage.getBoundingClientRect();
    var mRect = modBtn.getBoundingClientRect();
    initModLeft = mRect.left - sRect.left;
    initModTop = mRect.top - sRect.top;

    modBtn.style.left = initModLeft + 'px';
    modBtn.style.top = initModTop + 'px';
    modBtn.style.right = 'auto';

    try { modBtn.setPointerCapture(e.pointerId); } catch (err) {}
  });

  modBtn.addEventListener('pointermove', function (e) {
    if (!modPointerDown) return; // CRITICAL FIX: never drag on hover! Only drag when mouse/touch is pressed down
    var dx = e.clientX - dragStartX;
    var dy = e.clientY - dragStartY;
    dragDist = Math.hypot(dx, dy);

    if (dragDist > 6) {
      if (!isDraggingMod) {
        isDraggingMod = true;
        modBtn.classList.add('dragging', 'fast-spin');
        modBtn.classList.remove('flying', 'dropped');
        setModFace(modFace, 'shocked');

        var dragText = heroDragLines[Math.floor(Math.random() * heroDragLines.length)];
        setBubbleSmooth(bubble, dragText + '<small>Host in transit!</small>', true);
      }

      var sW = stage.offsetWidth;
      var sH = stage.offsetHeight;
      var isMobile = window.innerWidth <= 560;
      var mW = modBtn.offsetWidth || (isMobile ? 92 : 120);
      var mH = modBtn.offsetHeight || mW;

      // In mobile view, keep moderator in upper stage area so he never hides behind the platform
      var maxTop = isMobile ? Math.min(130, sH - mH - 30) : (sH - mH - 40);

      var curX = Math.max(0, Math.min(sW - mW, initModLeft + dx));
      var curY = Math.max(0, Math.min(maxTop, initModTop + dy));

      modBtn.style.left = curX + 'px';
      modBtn.style.top = curY + 'px';

      var tilt = Math.max(-24, Math.min(24, (e.movementX || dx * 0.1) * 2.5));
      if (modSvg) modSvg.style.transform = 'rotate(' + tilt + 'deg) scale(1.08)';

      spawnTrail(e.clientX, e.clientY + 20);
      updateHeroBubblePos(curX, curY, mW);

      if (robotEl) {
        var isNearCenter = Math.abs(curX - (sW * 0.44)) < sW * 0.18;
        if (isNearCenter) robotEl.classList.add('look-up');
        else robotEl.classList.remove('look-up');
      }
    }
  });

  function endModDrag(e) {
    if (!modPointerDown) return;
    modPointerDown = false;
    try { modBtn.releasePointerCapture(e.pointerId); } catch (err) {}
    if (modSvg) modSvg.style.transform = '';

    if (!isDraggingMod) {
      triggerPoke();
    } else {
      isDraggingMod = false;
      modBtn.classList.remove('dragging', 'fast-spin');
      modBtn.classList.add('dropped');
      setTimeout(function () { modBtn.classList.remove('dropped'); }, 450);

      setModFace(modFace, 'dizzy');
      var dropText = heroDropLines[Math.floor(Math.random() * heroDropLines.length)];
      setBubbleSmooth(bubble, dropText + '<small>Landing impact</small>', true);

      clearTimeout(modFaceTimer);
      modFaceTimer = setTimeout(function () {
        setModFace(modFace, 'smug');
      }, 3500);

      var sW = stage.offsetWidth;
      var curX = modBtn.offsetLeft;
      if (robotEl && Math.abs(curX - (sW * 0.44)) > sW * 0.22) {
        robotEl.classList.remove('look-up');
      }
    }
    scheduleHeroAutonomous();
    scheduleIdleSuggestion();
  }

  modBtn.addEventListener('pointerup', endModDrag);
  modBtn.addEventListener('pointercancel', endModDrag);
  if (modSvg) {
    modSvg.addEventListener('animationend', function (e) {
      if (e.animationName === 'roll') modSvg.classList.remove('roll');
    });
  }

  // ---------- Moderator Suggestions & alive reactions (face changes with every suggestion)
  var modSuggestions = [
    { face: 'wink', text: "The download is free, you know. I don't get paid until you press that green button.", sub: "Pro tip" },
    { face: 'shocked', text: "Wait, you're still reading? The actual game has twelve whole troll stages!", sub: "Gameplay alert" },
    { face: 'sideEye', text: "Still deciding? The robot has been blinking at you for three straight minutes.", sub: "He's judging you" },
    { face: 'cool', text: "Stage 12 is totally fair and definitely won't make you rage-quit. Trust me.", sub: "100% honest host" },
    { face: 'crying', text: "Please download it... our senior developer stayed up until 3 AM polishing the physics!", sub: "Developer tears" },
    { face: 'annoyed', text: "Look at that big green button. It's practically begging to be pressed.", sub: "Just click it" },
    { face: 'smug', text: "Host tip: If you fall into the void, remember that it's a feature, not a bug.", sub: "Game show logic" },
    { face: 'surprised', text: "Did I mention there are two boss fights? One of them is technically my cousin.", sub: "Lore reveal" },
    { face: 'cool', text: "Only 38 megabytes! Smaller than your average video game patch!", sub: "Lightweight rage" },
    { face: 'wink', text: "Controllers work automatically! Plug and play, then plug and cry.", sub: "Controller support" }
  ];
  var suggestionIdx = 0;
  var idleTimer = null;

  function saySuggestion(item, duration) {
    if (!item || !modFace) return;
    setModFace(modFace, item.face);
    var bubbleMsg = item.text + (item.sub ? '<small>' + item.sub + '</small>' : '');
    setBubbleSmooth(bubble, bubbleMsg, true);
    restart(bubble, 'pop');
    restart(modBtn, 'poked');

    clearTimeout(modFaceTimer);
    modFaceTimer = setTimeout(function () {
      setModFace(modFace, 'smug');
    }, duration || 4500);
  }

  function scheduleIdleSuggestion() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () {
      var scrollY = window.scrollY || window.pageYOffset;
      // Only suggest when looking at the hero area
      if (scrollY < 750) {
        var item = modSuggestions[suggestionIdx % modSuggestions.length];
        suggestionIdx++;
        saySuggestion(item, 5000);
      }
      scheduleIdleSuggestion();
    }, 11000 + Math.random() * 4000);
  }
  scheduleIdleSuggestion();

  // ---------- the robot: blinks, hops when you reach for the download
  var robot = document.getElementById('robot');
  (function blink() {
    setTimeout(function () {
      robot.classList.add('blink');
      setTimeout(function () { robot.classList.remove('blink'); blink(); }, 140);
    }, 2200 + Math.random() * 3200);
  })();
  function hop() {
    if (reduced || robot.classList.contains('hop')) return;
    robot.classList.add('hop', 'love');
  }
  robot.addEventListener('animationend', function (e) {
    if (e.animationName === 'hop') { robot.classList.remove('hop'); setTimeout(function () { robot.classList.remove('love'); }, 500); }
  });

  // Moderator & Robot download button interactions
  var dlHoverLines = [
    { face: 'wink', text: "Yes! That one! Click the big green button!", sub: "Press it!" },
    { face: 'surprised', text: "Ooh, reaching for the download? Bold move, future champion!", sub: "Stage 1 awaits" },
    { face: 'cool', text: "It's free, it's 38MB, and it has 100% chance of making you laugh.", sub: "Guaranteed fun" },
    { face: 'shocked', text: "DON'T HESITATE! The big green button is waiting for you!", sub: "Free for Windows" }
  ];
  var dlHoverIdx = 0;

  dl.addEventListener('pointerenter', function () {
    hop();
    clearTimeout(idleTimer);
    var item = dlHoverLines[dlHoverIdx % dlHoverLines.length];
    dlHoverIdx++;
    saySuggestion(item, 4000);
    scheduleIdleSuggestion();
  });
  dl.addEventListener('focus', function () {
    hop();
    saySuggestion(dlHoverLines[0], 4000);
  });
  dl.addEventListener('click', function () {
    clearTimeout(idleTimer);
    saySuggestion({ face: 'cool', text: "DOWNLOAD INITIATED! May your patience survive Stage 3!", sub: "Good luck, you'll need it!" }, 6000);
  });

  // ---------- 3D tilt of the hero stage, following the pointer
  var scene = document.getElementById('scene'), stage = document.getElementById('stage3d');
  var tx = 0, ty = 0, cx = 0, cy = 0, running = false;
  function tick() {
    cx += (tx - cx) * .08; cy += (ty - cy) * .08;
    stage.style.setProperty('--ry', (cx * 14).toFixed(2) + 'deg');
    stage.style.setProperty('--rx', (-cy * 9).toFixed(2) + 'deg');
    if (Math.abs(tx - cx) > .001 || Math.abs(ty - cy) > .001) requestAnimationFrame(tick); else running = false;
  }
  function aim(x, y) { tx = x; ty = y; if (!running) { running = true; requestAnimationFrame(tick); } }
  if (!reduced && window.matchMedia('(hover: hover)').matches) {
    window.addEventListener('pointermove', function (e) {
      var r = scene.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      aim(Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth / 2))),
          Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (innerHeight / 2))));
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', function () { aim(0, 0); });
  } else if (!reduced) {
    // touch screens: a gentle sway as you scroll past
    window.addEventListener('scroll', function () {
      var r = scene.getBoundingClientRect();
      aim(0, Math.max(-1, Math.min(1, (r.top + r.height / 2 - innerHeight / 2) / innerHeight)));
    }, { passive: true });
  }

  // ---------- trailer player
  var tv = document.getElementById('tv'), video = document.getElementById('tv-video');
  var soon = document.getElementById('tv-soon'), bigPlay = document.getElementById('tv-play'), bar = document.getElementById('tv-bar');
  var seek = document.getElementById('tv-seek'), time = document.getElementById('tv-time');
  var tIcon = document.getElementById('tv-toggle-icon'), mIcon = document.getElementById('tv-mute-icon');
  var PLAY = 'M8 5v14l11-7z', PAUSE = 'M6 5h4v14H6zM14 5h4v14h-4z';
  var SOUND = mIcon.getAttribute('d'), MUTED = 'M4 9h4l5-4v14l-5-4H4zM16 9l5 6M21 9l-5 6';
  function clock(t) { t = Math.max(0, Math.floor(t || 0)); return Math.floor(t / 60) + ':' + ('0' + t % 60).slice(-2); }
  function showVideo() {
    soon.hidden = true; video.hidden = false; bigPlay.hidden = false; bar.hidden = false;
    video.poster = 'trailer/poster.jpg';
    video.preload = 'metadata';
  }
  showVideo();
  video.addEventListener('error', function () {
    soon.hidden = false; video.hidden = true; bigPlay.hidden = true; bar.hidden = true;
  });
  var userStartedVideo = false;
  var userDismissedPip = false;
  var tvHolder = document.getElementById('tv-holder');
  var pipClose = document.getElementById('tv-pip-close');

  function setPipMode(enabled) {
    if (enabled) {
      if (tv.classList.contains('pip')) return;
      var tvHeight = tv.offsetHeight;
      if (tvHolder) tvHolder.style.minHeight = tvHeight + 'px';
      tv.classList.add('pip');
    } else {
      if (!tv.classList.contains('pip')) return;
      tv.classList.remove('pip');
      if (tvHolder) tvHolder.style.minHeight = '';
    }
  }

  if (pipClose) {
    pipClose.addEventListener('click', function (e) {
      e.stopPropagation();
      userDismissedPip = true;
      setPipMode(false);
      video.pause();
    });
  }

  // Clicking anywhere on the mini-TV in PiP mode (except controls) smoothly scrolls back to trailer
  tv.addEventListener('click', function (e) {
    if (tv.classList.contains('pip')) {
      if (e.target.closest('.tv-bar') || e.target.closest('.tv-pip-close') || e.target.closest('.tv-play')) return;
      var tr = document.getElementById('trailer');
      if (tr) tr.scrollIntoView({ behavior: 'smooth' });
    }
  });

  function toggle() { if (video.paused) video.play(); else video.pause(); }
  bigPlay.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
  video.addEventListener('click', function (e) {
    if (tv.classList.contains('pip')) return; // In PiP, video click can toggle or return to view
    toggle();
  });
  var tBtn = document.getElementById('tv-toggle'); tBtn.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
  video.addEventListener('play', function () {
    userStartedVideo = true;
    userDismissedPip = false; // re-enable PiP on playback
    tv.classList.add('playing');
    bigPlay.hidden = true;
    tIcon.setAttribute('d', PAUSE);
    tBtn.setAttribute('aria-label', 'Pause');
    idle();
  });
  video.addEventListener('pause', function () {
    tv.classList.remove('playing');
    bigPlay.hidden = false;
    tIcon.setAttribute('d', PLAY);
    tBtn.setAttribute('aria-label', 'Play');
    bar.classList.remove('idle');
  });
  video.addEventListener('ended', function () {
    video.currentTime = 0;
    userStartedVideo = false;
    setPipMode(false);
  });
  video.addEventListener('timeupdate', function () {
    if (video.duration) seek.value = Math.round(video.currentTime / video.duration * 1000);
    time.textContent = clock(video.currentTime) + ' / ' + clock(video.duration);
  });
  video.addEventListener('loadedmetadata', function () { time.textContent = '0:00 / ' + clock(video.duration); });
  seek.addEventListener('input', function () { if (video.duration) video.currentTime = seek.value / 1000 * video.duration; });
  document.getElementById('tv-mute').addEventListener('click', function () {
    video.muted = !video.muted; mIcon.setAttribute('d', video.muted ? MUTED : SOUND);
    this.setAttribute('aria-label', video.muted ? 'Unmute' : 'Mute');
  });
  document.getElementById('tv-full').addEventListener('click', function () {
    var el = tv.querySelector('.screen');
    if (document.fullscreenElement) document.exitFullscreen();
    else if (el.requestFullscreen) el.requestFullscreen();
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
  });
  var idleTimer;
  function idle() {
    bar.classList.remove('idle'); clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { if (!video.paused) bar.classList.add('idle'); }, 2200);
  }
  tv.addEventListener('pointermove', idle);
  bar.addEventListener('focusin', idle);

  // Picture-in-Picture (PiP) mode on scroll: floating mini-TV keeps playing seamlessly
  if ('IntersectionObserver' in window) {
    var targetEl = tvHolder || tv;
    var tvObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        tv.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';

        if (!userStartedVideo || userDismissedPip) return;

        // When trailer on the page is scrolled out of view (less than 20% visible)
        if (!entry.isIntersecting || entry.intersectionRatio < 0.2) {
          if (!video.paused) {
            setPipMode(true);
          }
        } else if (entry.intersectionRatio >= 0.25) {
          // When trailer on the page is back in view, dock back into place!
          setPipMode(false);
        }
      });
    }, {
      threshold: [0, 0.2, 0.25, 0.5]
    });
    tvObserver.observe(targetEl);
  }

  // ---------- scroll-following Moderator (parallax companion)
  if (!reduced) {
    // create the ghost moderator (a clone of the hero one)
    var ghost = document.createElement('div');
    ghost.className = 'mod-ghost';
    ghost.innerHTML = document.getElementById('mod').innerHTML;

    // ghost close button
    var ghostClose = document.createElement('button');
    ghostClose.className = 'mod-ghost-close';
    ghostClose.type = 'button';
    ghostClose.setAttribute('aria-label', 'Close Moderator');
    ghostClose.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
    ghost.appendChild(ghostClose);

    document.body.appendChild(ghost);

    // ghost speech bubble
    var ghostBubble = document.createElement('div');
    ghostBubble.className = 'mod-ghost-bubble';
    document.body.appendChild(ghostBubble);

    // dismissal and 30s idle comeback state
    var isDismissed = false;
    var isDismissing = false;
    var isReappearing = false;
    var IDLE_TIME = 30000; // 30 seconds idle
    var returnIdleTimer = null;

    var bubbleTimer = null;
    var ghostFaceEl = ghost.querySelector('.mod-face');
    var ghostFaceTimer = null;
    var ghostSuggestionIdx = 0;
    var ghostCustomMessage = false;
    var ghostCustomTimer = null;
    var ghostIdleTimer = null;

    var ghostSuggestions = [
      { face: 'smug', text: "Host tip: Spikes in Stage 2 have trust issues.", sub: "Stage 2 warning" },
      { face: 'wink', text: "The download is free, you know. Press the green button up top!", sub: "Pro tip" },
      { face: 'shocked', text: "Wait, did you check the fake floor in Stage 3? Total classic.", sub: "Stage 3 spoiler" },
      { face: 'sideEye', text: "Still scrolling? The actual game has 12 whole troll stages!", sub: "Gameplay alert" },
      { face: 'cool', text: "Stage 12 is totally fair and definitely won't make you rage. Trust me.", sub: "100% honest host" },
      { face: 'crying', text: "Our senior developer stayed up until 3 AM polishing the physics!", sub: "Developer tears" },
      { face: 'surprised', text: "Two boss fights await: The Algorithm and MOD.EXE!", sub: "Boss warning" },
      { face: 'wink', text: "Controllers work automatically! Plug and play, then plug and cry.", sub: "Controller support" },
      { face: 'cool', text: "Only 38 megabytes! Smaller than your average video game patch!", sub: "Lightweight rage" },
      { face: 'annoyed', text: "The big green download button is up there!", sub: "Don't get lost" }
    ];

    function setGhostSuggestion(item) {
      if (!item || !ghostFaceEl || !ghostVisible) return;
      setModFace(ghostFaceEl, item.face || 'smug');
      var msg = item.text + (item.sub ? '<small>' + item.sub + '</small>' : '');
      setBubbleSmooth(ghostBubble, msg, true);
    }

    function scheduleGhostIdle() {
      clearTimeout(ghostIdleTimer);
      ghostIdleTimer = setTimeout(function () {
        if (ghostVisible && !ghostCustomMessage && !isFastScrolling) {
          var item = ghostSuggestions[ghostSuggestionIdx % ghostSuggestions.length];
          ghostSuggestionIdx++;
          setGhostSuggestion(item);
        }
        scheduleGhostIdle();
      }, 9000 + Math.random() * 3000);
    }
    scheduleGhostIdle();

    // trail particles pool
    var trailPool = [];
    var trailIdx = 0;
    var TRAIL_COUNT = 12;
    var trailColors = ['#FF7EB6', '#FFD23F', '#3DDCFF', '#9BE564', '#FF8C42', '#9B5DE5'];
    for (var ti = 0; ti < TRAIL_COUNT; ti++) {
      var dot = document.createElement('div');
      dot.className = 'mod-trail';
      dot.style.background = trailColors[ti % trailColors.length];
      document.body.appendChild(dot);
      trailPool.push(dot);
    }
    var trailThrottle = 0;

    function spawnTrail(x, y) {
      var now = performance.now();
      if (now - trailThrottle < 60) return;
      trailThrottle = now;
      var d = trailPool[trailIdx % TRAIL_COUNT];
      trailIdx++;
      d.style.left = x + 'px';
      d.style.top = y + 'px';
      if (d.animate) {
        d.animate([
          { opacity: .7, transform: 'scale(1) translate(0, 0)' },
          { opacity: 0, transform: 'scale(.2) translate(' + ((Math.random() - .5) * 50) + 'px, ' + (20 + Math.random() * 30) + 'px)' }
        ], { duration: 600 + Math.random() * 400, easing: 'ease-out', fill: 'forwards' });
      }
    }

    // The hero area threshold — ghost appears after scrolling past hero
    var heroEl = document.querySelector('.hero');
    var prevGhostX = 0, prevGhostY = 0;
    var ghostTargetX = 0, ghostTargetY = 0, ghostCurrentX = 0, ghostCurrentY = 0;
    var ghostRot = 0, ghostRotTarget = 0, ghostRotCurrent = 0;
    var ghostVisible = false;
    var scrollY = window.scrollY || window.pageYOffset;
    var smoothScrollY = scrollY;
    var ghostRunning = false;

    function updateGhost() {
      var sy = smoothScrollY;
      var heroBottom = heroEl.offsetTop + heroEl.offsetHeight;
      var footerTop = document.querySelector('footer').offsetTop;
      var viewH = window.innerHeight;
      var viewW = window.innerWidth;

      // only show after hero
      var shouldShow = sy > heroBottom - 30 && sy < footerTop - viewH * 0.2;

      if (!shouldShow || isDismissed) {
        if (ghostVisible && !isDismissing) {
          ghost.classList.remove('visible');
          ghostVisible = false;
        }
        if (!isDismissing) {
          ghostBubble.classList.remove('visible');
          ghostBubble.style.display = 'none';
        }
        return;
      }
      ghostBubble.style.display = '';

      if (isDismissing || isReappearing) {
        return;
      }

      if (shouldShow && !ghostVisible && !isDismissed && !isDismissing) {
        ghost.classList.add('visible');
        ghostVisible = true;
        if (!ghostCustomMessage) {
          var item = ghostSuggestions[ghostSuggestionIdx % ghostSuggestions.length];
          ghostSuggestionIdx++;
          setGhostSuggestion(item);
        }
      }

      // wild sine-wave across the viewport
      var scrollRange = footerTop - heroBottom;
      var progress = Math.max(0, Math.min(1, (sy - heroBottom) / Math.max(100, scrollRange)));

      // Multiple overlapping sine waves for chaotic movement
      var wave1 = Math.sin(progress * Math.PI * 6) * 0.38;
      var wave2 = Math.sin(progress * Math.PI * 2.7 + 1.2) * 0.15;
      var wave3 = Math.cos(progress * Math.PI * 4.3 + 0.7) * 0.08;
      var combinedWave = wave1 + wave2 + wave3;

      var gw = ghost.offsetWidth || (viewW <= 560 ? 95 : 120);
      var padding = 20;

      if (!isDraggingGhost) {
        var baseCenterX = (ghostSide === 'left') ? (viewW * 0.22) : (viewW * 0.78);
        var roamWidth = (viewW * 0.18);
        ghostTargetX = baseCenterX + combinedWave * roamWidth - gw / 2;
        ghostTargetX = Math.max(12, Math.min(viewW - gw - 12, ghostTargetX));

        var yWave = Math.sin(progress * Math.PI * 8) * 30 + Math.cos(progress * Math.PI * 3.5) * 15;
        ghostTargetY = viewH * 0.35 + yWave;

        ghostRotTarget = combinedWave * 25;

        ghostCurrentX += (ghostTargetX - ghostCurrentX) * 0.07;
        ghostCurrentY += (ghostTargetY - ghostCurrentY) * 0.07;
        ghostRotCurrent += (ghostRotTarget - ghostRotCurrent) * 0.06;
      }

      var bob = Math.sin(performance.now() / 500) * 6;

      ghost.style.left = ghostCurrentX.toFixed(1) + 'px';
      ghost.style.top = (ghostCurrentY + bob).toFixed(1) + 'px';
      ghost.style.transform = 'rotate(' + ghostRotCurrent.toFixed(1) + 'deg)';

      // Position the bubble relative to ghost (strictly clamped and visible on all screens)
      var bw = ghostBubble.offsetWidth || (viewW <= 560 ? 170 : 220);
      var bh = ghostBubble.offsetHeight || 38;
      var bubbleX, bubbleY;

      if (viewW <= 560) {
        var isRightSide = ghostCurrentX > (viewW - gw) / 2;
        if (isRightSide) {
          bubbleX = ghostCurrentX - bw - 8;
          ghostBubble.classList.remove('flip');
        } else {
          bubbleX = ghostCurrentX + gw + 8;
          ghostBubble.classList.add('flip');
        }
        bubbleX = Math.max(10, Math.min(viewW - bw - 10, bubbleX));
        bubbleY = Math.max(50, Math.min(viewH - bh - 16, ghostCurrentY + bob - 6));
      } else {
        var isLeft = ghostCurrentX < viewW / 2;
        bubbleX = isLeft ? ghostCurrentX + gw + 10 : ghostCurrentX - bw - 10;
        bubbleX = Math.max(12, Math.min(viewW - bw - 12, bubbleX));
        bubbleY = Math.max(20, Math.min(viewH - bh - 20, ghostCurrentY + bob + 8));
        if (isLeft) ghostBubble.classList.add('flip');
        else ghostBubble.classList.remove('flip');
      }

      ghostBubble.style.left = bubbleX.toFixed(1) + 'px';
      ghostBubble.style.top = bubbleY.toFixed(1) + 'px';

      spawnTrail(ghostCurrentX + gw / 2, ghostCurrentY + bob + (ghost.offsetHeight || 100));
    }

    // Fast-scroll visual motion sickness tracking & reaction
    var lastRealScroll = window.scrollY || window.pageYOffset;
    var lastScrollTime = performance.now();
    var isFastScrolling = false;
    var recoverTimeout = null;

    function ghostLoop() {
      var realScroll = window.scrollY || window.pageYOffset;
      var now = performance.now();
      var dt = Math.max(1, now - lastScrollTime);
      var deltaY = realScroll - lastRealScroll;
      var speed = Math.abs(deltaY) / (dt / 16.67);

      lastRealScroll = realScroll;
      lastScrollTime = now;

      smoothScrollY += (realScroll - smoothScrollY) * 0.1;

      // FAST SCROLL MOTION SICKNESS (queasy face, rotor hyper-spin, vomit message)
      if (speed > 32) {
        if (!isFastScrolling) {
          isFastScrolling = true;
          ghost.classList.add('fast-spin', 'queasy');
          if (ghostFaceEl) setModFace(ghostFaceEl, 'queasy');
          ghostCustomMessage = true;
          setBubbleSmooth(ghostBubble, "Slow down! I'm going to vomit! <small>Internal gyroscope overloaded!</small>", true);
        }

        var gw = ghost.offsetWidth || 120;
        var bob = Math.sin(now / 500) * 6;
        spawnTrail(ghostCurrentX + gw / 2, ghostCurrentY + bob + (ghost.offsetHeight || 100));

        clearTimeout(recoverTimeout);
      } else if (isFastScrolling && speed < 12) {
        // Slowed down from fast scroll
        isFastScrolling = false;
        ghost.classList.remove('fast-spin', 'queasy');

        clearTimeout(recoverTimeout);
        recoverTimeout = setTimeout(function () {
          if (ghostFaceEl) setModFace(ghostFaceEl, 'smug');
          ghostCustomMessage = false;
          var item = ghostSuggestions[ghostSuggestionIdx % ghostSuggestions.length];
          ghostSuggestionIdx++;
          setGhostSuggestion(item);
        }, 2200);
      }

      updateGhost();
      requestAnimationFrame(ghostLoop);
    }
    requestAnimationFrame(ghostLoop);

    // Click & Drag on ghost moderator with Autonomous Side-Switching (NO EMOJIS)
    var ghostPokes = 0;
    var ghostPokeReactions = [
      { face: 'surprised', text: "HEY! I'm flying here! You want me to crash?!" },
      { face: 'queasy', text: "Slow down! I'm getting motion sick! Somebody grab a barf bag!" },
      { face: 'angry', text: "Don't tap the glass! It startles the rotor blades!" },
      { face: 'wink', text: "Scrolling AND poking? That is elite multi-tasking." },
      { face: 'dizzy', text: "Wheee! Mid-air turbulence detected!" },
      { face: 'sideEye', text: "Still watching you. The download is up top, by the way." },
      { face: 'cool', text: "Hovering gracefully. Your pokes can't ground me." },
      { face: 'shocked', text: "Mayday! Host under aerial finger assault!" },
      { face: 'crying', text: "I have to fly AND get poked? Where is OSHA?!" },
      { face: 'sideEye', text: "Still scrolling? Bold." },
      { face: 'smug', text: "I see everything from up here!" },
      { face: 'annoyed', text: "You missed the download button." },
      { face: 'cool', text: "This is MY website, you know." },
      { face: 'shocked', text: "Are you reading all of this?!" },
      { face: 'smug', text: "I should charge rent for this sidebar." },
      { face: 'annoyed', text: "The game is up there!" },
      { face: 'queasy', text: "Ugh... my internal fans are working overtime... *pant*" },
      { face: 'crying', text: "My therapist says I hover too much." },
      { face: 'cool', text: "I'm contractually obligated to follow you." }
    ];

    var ghostDragLines = [
      "Air traffic control! We have a rogue cursor hijacking the craft!",
      "Unhand the drone! My hazard pay does not cover abductions!",
      "Wait! I have an approved flight plan! Put me down!",
      "Hey! Turbulence warning! Keep your hands off the fuselage!"
    ];

    var ghostDropLines = [
      "Emergency landing complete. Recalibrating thrusters.",
      "I preferred my previous altitude, but fine.",
      "Gyroscope spinning wildly... give me a second.",
      "Safe and sound. Do not do that again, trainee."
    ];

    var ghostSide = 'right';
    var ghostSideSwitchTimer = null;

    function scheduleGhostSideSwitch() {
      clearTimeout(ghostSideSwitchTimer);
      ghostSideSwitchTimer = setTimeout(function () {
        if (ghostVisible && !isDraggingGhost && !isFastScrolling) {
          ghostSide = (ghostSide === 'right' ? 'left' : 'right');
          if (ghostFaceEl) setModFace(ghostFaceEl, 'cool');
          ghostCustomMessage = true;
          var sideText = ghostSide === 'left' ?
            "Banking left for a tactical vantage point! <small>Autonomous detour</small>" :
            "Returning to starboard! Better perspective over here. <small>Autonomous detour</small>";
          setBubbleSmooth(ghostBubble, sideText, true);

          clearTimeout(ghostCustomTimer);
          ghostCustomTimer = setTimeout(function () {
            ghostCustomMessage = false;
            if (ghostFaceEl) setModFace(ghostFaceEl, 'smug');
          }, 4500);
        }
        scheduleGhostSideSwitch();
      }, 22000 + Math.random() * 8000);
    }
    scheduleGhostSideSwitch();

    function triggerGhostPoke() {
      ghostPokes++;
      ghostCustomMessage = true;
      clearTimeout(recoverTimeout);

      var rx = ghostPokeReactions[(ghostPokes - 1) % ghostPokeReactions.length];
      if (ghostFaceEl) setModFace(ghostFaceEl, rx.face);
      setBubbleSmooth(ghostBubble, rx.text + '<small>Air pokes: ' + ghostPokes + '</small>', true);

      var svg = ghost.querySelector('.mod-svg');
      if (ghostPokes % 3 === 0 && svg) {
        restart(svg, 'roll');
      } else {
        restart(ghost, 'poked');
      }

      clearTimeout(ghostCustomTimer);
      ghostCustomTimer = setTimeout(function () {
        ghostCustomMessage = false;
        if (ghostFaceEl) setModFace(ghostFaceEl, 'smug');
        var item = ghostSuggestions[ghostSuggestionIdx % ghostSuggestions.length];
        ghostSuggestionIdx++;
        setGhostSuggestion(item);
      }, 4500);
    }

    var isDraggingGhost = false;
    var ghostPointerDown = false;
    var ghostDragStartX = 0, ghostDragStartY = 0;
    var ghostDragInitX = 0, ghostDragInitY = 0;
    var ghostDragDist = 0;

    ghost.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      ghostPointerDown = true;
      isDraggingGhost = false;
      ghostDragDist = 0;
      ghostDragStartX = e.clientX;
      ghostDragStartY = e.clientY;
      ghostDragInitX = ghostCurrentX;
      ghostDragInitY = ghostCurrentY;
      try { ghost.setPointerCapture(e.pointerId); } catch (err) {}
    });

    ghost.addEventListener('pointermove', function (e) {
      if (!ghostPointerDown) return; // CRITICAL FIX: never drag on hover!
      var dx = e.clientX - ghostDragStartX;
      var dy = e.clientY - ghostDragStartY;
      ghostDragDist = Math.hypot(dx, dy);

      if (ghostDragDist > 6) {
        if (!isDraggingGhost) {
          isDraggingGhost = true;
          ghost.classList.add('dragging', 'fast-spin');
          if (ghostFaceEl) setModFace(ghostFaceEl, 'shocked');
          ghostCustomMessage = true;
          clearTimeout(recoverTimeout);

          var dragText = ghostDragLines[Math.floor(Math.random() * ghostDragLines.length)];
          setBubbleSmooth(ghostBubble, dragText + '<small>Involuntary flight</small>', true);
        }

        var viewW = window.innerWidth;
        var viewH = window.innerHeight;
        var gw = ghost.offsetWidth || 100;
        var gh = ghost.offsetHeight || 100;

        ghostCurrentX = Math.max(8, Math.min(viewW - gw - 8, ghostDragInitX + dx));
        ghostCurrentY = Math.max(10, Math.min(viewH - gh - 20, ghostDragInitY + dy));
        ghostTargetX = ghostCurrentX;
        ghostTargetY = ghostCurrentY;

        var tilt = Math.max(-25, Math.min(25, (e.movementX || dx * 0.1) * 2.5));
        ghostRotCurrent = tilt;

        spawnTrail(e.clientX, e.clientY + 20);
        updateGhost();
      }
    });

    function endGhostDrag(e) {
      if (!ghostPointerDown) return;
      ghostPointerDown = false;
      try { ghost.releasePointerCapture(e.pointerId); } catch (err) {}

      if (!isDraggingGhost) {
        triggerGhostPoke();
      } else {
        isDraggingGhost = false;
        ghost.classList.remove('dragging', 'fast-spin');
        ghost.classList.add('dropped');
        setTimeout(function () { ghost.classList.remove('dropped'); }, 450);

        if (ghostFaceEl) setModFace(ghostFaceEl, 'dizzy');
        var dropText = ghostDropLines[Math.floor(Math.random() * ghostDropLines.length)];
        setBubbleSmooth(ghostBubble, dropText + '<small>Forced landing</small>', true);

        // Update preferred side based on drop position
        ghostSide = (ghostCurrentX > window.innerWidth / 2) ? 'right' : 'left';

        clearTimeout(ghostCustomTimer);
        ghostCustomTimer = setTimeout(function () {
          ghostCustomMessage = false;
          if (ghostFaceEl) setModFace(ghostFaceEl, 'smug');
          var item = ghostSuggestions[ghostSuggestionIdx % ghostSuggestions.length];
          ghostSuggestionIdx++;
          setGhostSuggestion(item);
        }, 3800);
      }
    }

    ghost.addEventListener('pointerup', endGhostDrag);
    ghost.addEventListener('pointercancel', endGhostDrag);

    // -------------------------------------------------- Dismiss & 30-Second Idle Comeback
    function resetIdleTimer() {
      clearTimeout(returnIdleTimer);
      if (!isDismissed || isDismissing || isReappearing) return;
      returnIdleTimer = setTimeout(function () {
        if (!isDismissed || isDismissing || isReappearing) return;
        var sy = smoothScrollY;
        var heroBottom = heroEl.offsetTop + heroEl.offsetHeight;
        var footerTop = document.querySelector('footer').offsetTop;
        var viewH = window.innerHeight;
        var shouldShow = sy > heroBottom - 30 && sy < footerTop - viewH * 0.2;
        if (shouldShow) {
          reappearGhost();
        } else {
          resetIdleTimer();
        }
      }, IDLE_TIME);
    }

    var activityEvents = ['mousemove', 'pointermove', 'mousedown', 'keydown', 'touchstart', 'touchmove', 'scroll'];
    activityEvents.forEach(function (evt) {
      window.addEventListener(evt, resetIdleTimer, { passive: true });
    });

    function dismissGhost() {
      if (isDismissed || isDismissing) return;
      isDismissing = true;
      clearTimeout(returnIdleTimer);

      // Flash annoyed expression
      if (ghostFaceEl) setModFace(ghostFaceEl, 'annoyed');
      ghostCustomMessage = true;

      // 1. First, disappear the moderator's message (speech bubble)
      ghostBubble.classList.remove('visible');

      // 2. Followed by the moderator itself flying away
      setTimeout(function () {
        ghostBubble.style.display = 'none';
        ghost.style.setProperty('--ghost-rot', ghostRotCurrent.toFixed(1) + 'deg');
        ghost.classList.add('dismissing');

        setTimeout(function () {
          isDismissing = false;
          isDismissed = true;
          ghostVisible = false;
          ghost.classList.remove('visible', 'dismissing');
          ghost.style.display = 'none';
          resetIdleTimer();
        }, 550);
      }, 220);
    }

    function reappearGhost() {
      if (!isDismissed || isReappearing) return;
      isReappearing = true;
      isDismissed = false;

      ghost.style.display = '';
      ghostBubble.style.display = '';

      var viewW = window.innerWidth;
      var viewH = window.innerHeight;
      var gw = ghost.offsetWidth || (viewW <= 560 ? 95 : 120);
      var baseCenterX = (ghostSide === 'left') ? (viewW * 0.22) : (viewW * 0.78);
      ghostCurrentX = baseCenterX - gw / 2;
      ghostCurrentY = viewH * 0.35;
      ghostTargetX = ghostCurrentX;
      ghostTargetY = ghostCurrentY;
      ghostRotCurrent = 0;

      ghost.style.left = ghostCurrentX.toFixed(1) + 'px';
      ghost.style.top = ghostCurrentY.toFixed(1) + 'px';
      ghost.style.transform = 'rotate(0deg)';

      ghost.classList.add('visible', 'reappearing');
      ghostVisible = true;
      if (ghostFaceEl) setModFace(ghostFaceEl, 'smug');
      ghostCustomMessage = true;

      var returnLines = [
        { text: "Did you miss me? You stopped moving!", sub: "Host returns" },
        { text: "Bored already? I knew you couldn't stay away.", sub: "Host is back" },
        { text: "AFK detected! Perfect time for my monologue!", sub: "Commercial over" },
        { text: "Hello? Still alive out there?", sub: "Liveness check" },
        { text: "You can't get rid of me that easily!", sub: "Unstoppable host" }
      ];
      var ret = returnLines[Math.floor(Math.random() * returnLines.length)];
      setBubbleSmooth(ghostBubble, ret.text + '<small>' + ret.sub + '</small>', true);

      setTimeout(function () {
        ghost.classList.remove('reappearing');
        isReappearing = false;
        ghostCustomMessage = false;
      }, 800);
    }

    ghostClose.addEventListener('pointerdown', function (e) {
      e.stopPropagation();
    });
    ghostClose.addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      dismissGhost();
    });
  }

})();
