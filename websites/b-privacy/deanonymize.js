(function () {
  const root = document.querySelector('#deanonymize .deanon');
  if (!root) return;

  const sequence = [
    { bar: 'a', weight: 7 },
    { bar: 'b', weight: 3 },
    { bar: 'a', weight: 2 },
    { bar: 'b', weight: 1 }
  ];

  const REVEAL_TO_REMOVE = 2200;
  const BETWEEN_STEPS    = 2900;
  const INITIAL_DELAY    = 2000;
  const FINAL_HOLD       = 4500;
  const CYCLE_GAP        = 2000;

  const rows = root.querySelectorAll('.row');
  const totalEl = { a: rows[0].querySelector('.row-total'), b: rows[1].querySelector('.row-total') };
  const steps = root.querySelectorAll('.narration .step');
  const ledgerChips = root.querySelectorAll('.ledger-chip');

  const prefersReduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let timers = [];
  let remaining = { a: 9, b: 4 };
  let running = false;
  let cancelled = false;

  function clearTimers() {
    timers.forEach(t => clearTimeout(t));
    timers = [];
  }

  function schedule(fn, delay) {
    const id = setTimeout(() => {
      if (cancelled) return;
      fn();
    }, delay);
    timers.push(id);
    return id;
  }

  function setStep(i) {
    steps.forEach((s, idx) => s.classList.toggle('active', idx === i));
  }

  function resetVisuals() {
    remaining = { a: 9, b: 4 };
    root.querySelectorAll('.seg').forEach(s => s.classList.remove('revealed', 'removed'));
    ledgerChips.forEach(c => c.classList.remove('shown'));
    totalEl.a.textContent = '9';
    totalEl.b.textContent = '4';
    setStep(0);
  }

  function showFinalState() {
    resetVisuals();
    sequence.forEach((step, i) => {
      const bar = root.querySelector('.bar-' + step.bar);
      const seg = bar.querySelector('.seg:not(.revealed)');
      if (seg) seg.classList.add('revealed', 'removed');
      remaining[step.bar] -= step.weight;
      ledgerChips[i].classList.add('shown');
    });
    totalEl.a.textContent = remaining.a;
    totalEl.b.textContent = remaining.b;
    setStep(sequence.length);
  }

  function revealStep(i) {
    if (cancelled || i >= sequence.length) return;
    const step = sequence[i];
    const bar = root.querySelector('.bar-' + step.bar);
    const seg = bar.querySelector('.seg:not(.revealed)');
    if (!seg) return;

    seg.classList.add('revealed');
    setStep(i + 1);

    schedule(() => {
      seg.classList.add('removed');
      remaining[step.bar] -= step.weight;
      totalEl[step.bar].textContent = remaining[step.bar];
      ledgerChips[i].classList.add('shown');

      if (i + 1 < sequence.length) {
        schedule(() => revealStep(i + 1), BETWEEN_STEPS);
      } else {
        schedule(cycle, FINAL_HOLD);
      }
    }, REVEAL_TO_REMOVE);
  }

  function cycle() {
    if (cancelled) return;
    resetVisuals();
    schedule(() => revealStep(0), CYCLE_GAP);
  }

  function play() {
    if (running) return;
    running = true;
    cancelled = false;
    if (prefersReduced) { showFinalState(); return; }
    resetVisuals();
    schedule(() => revealStep(0), INITIAL_DELAY);
  }

  function pause() {
    cancelled = true;
    running = false;
    clearTimers();
  }

  if (prefersReduced) {
    showFinalState();
    return;
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) play();
        else pause();
      });
    }, { threshold: 0.25 });
    io.observe(root);
  } else {
    play();
  }
})();
