const TOUR_KEY = 'guitarrun-setup-guide-v1';
const setupToggle = document.getElementById('setupToggle');
const setupPanel = document.getElementById('scale-setup');
const replayButton = document.getElementById('guideReplay');

if (setupToggle && setupPanel) {
  const overlay = document.createElement('div');
  overlay.className = 'guide-backdrop';
  overlay.setAttribute('aria-hidden', 'true');

  const card = document.createElement('aside');
  card.className = 'guide-card';
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-label', 'GuitarRun setup guide');
  card.innerHTML = `
    <div class="guide-progress" aria-hidden="true"></div>
    <button class="guide-skip" type="button">Skip step</button>
    <span class="guide-kicker"></span>
    <h3></h3>
    <p></p>
    <div class="guide-actions"><button class="guide-next" type="button"></button></div>
    <i class="guide-arrow" aria-hidden="true"></i>`;

  document.body.append(overlay, card);

  const steps = [
    { target: '#setupToggle', kicker: 'STEP 1 · SETTINGS', title: 'Start your setup here', text: 'Click the settings button to choose the scale you want to practice.', action: 'click', next: 'Open settings' },
    { target: '#keySelect', kicker: 'STEP 2 · ROOT NOTE', title: 'Choose your key', text: 'Select the root note for your practice—for example C, A, or E.', next: 'Next: Scale' },
    { target: '#scaleSelect', kicker: 'STEP 3 · SCALE', title: 'Choose a scale', text: 'Start with Major or Minor Pentatonic if you are new to the fretboard.', next: 'Next: Pattern' },
    { target: '#patternSelect', kicker: 'STEP 4 · POSITION', title: 'Choose a position', text: 'Pick the fretboard position you want to learn. You can change it anytime.', next: 'Next: Lesson mode' },
    { target: '#lessonMode', kicker: 'STEP 5 · LESSON MODE', title: 'Try 3NPS Marathon', text: 'Choose 3NPS Marathon to play continuously from Position 1 through Position 7. A quick video will show you how it works.', next: 'Finish guide' }
  ];

  let current = -1;
  let target = null;
  const progress = card.querySelector('.guide-progress');
  const kicker = card.querySelector('.guide-kicker');
  const title = card.querySelector('h3');
  const description = card.querySelector('p');
  const nextButton = card.querySelector('.guide-next');
  const skipButton = card.querySelector('.guide-skip');

  function clearTarget() {
    target?.classList.remove('guide-target');
    target = null;
  }

  function positionCard() {
    if (!target || !card.classList.contains('open')) return;
    const rect = target.getBoundingClientRect();
    const width = Math.min(340, window.innerWidth - 28);
    card.style.width = `${width}px`;
    const cardHeight = card.offsetHeight;
    let left;
    let top;
    let arrow;
    if (current === 0 && rect.left > width + 42) {
      left = rect.left - width - 24;
      top = Math.min(Math.max(14, rect.top + rect.height / 2 - cardHeight / 2), window.innerHeight - cardHeight - 14);
      arrow = 'right';
      card.style.setProperty('--guide-arrow-y', `${Math.min(cardHeight - 28, Math.max(28, rect.top + rect.height / 2 - top))}px`);
    } else {
      left = Math.min(Math.max(14, rect.left + rect.width / 2 - width / 2), window.innerWidth - width - 14);
      top = rect.bottom + 22;
      arrow = 'top';
      if (top + cardHeight > window.innerHeight - 14) {
        top = rect.top - cardHeight - 22;
        arrow = 'bottom';
      }
      card.style.setProperty('--guide-arrow-x', `${Math.min(width - 28, Math.max(28, rect.left + rect.width / 2 - left))}px`);
    }
    card.style.left = `${left}px`;
    card.style.top = `${Math.max(14, top)}px`;
    card.dataset.arrow = arrow;
  }

  function finish(save = true) {
    clearTarget();
    card.classList.remove('open');
    overlay.classList.remove('open');
    document.body.classList.remove('guide-open');
    current = -1;
    if (save) localStorage.setItem(TOUR_KEY, 'done');
  }

  function showStep(index) {
    clearTarget();
    current = index;
    const step = steps[index];
    target = document.querySelector(step.target);
    if (!target) return finish(false);
    target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    window.setTimeout(() => {
      target.classList.add('guide-target');
      kicker.textContent = step.kicker;
      title.textContent = step.title;
      description.textContent = step.text;
      nextButton.textContent = step.next;
      nextButton.hidden = step.action === 'click';
      progress.innerHTML = steps.map((_, i) => `<i class="${i <= index ? 'active' : ''}"></i>`).join('');
      overlay.classList.add('open');
      card.classList.add('open');
      document.body.classList.add('guide-open');
      positionCard();
    }, 360);
  }

  function start() {
    finish(false);
    if (setupPanel.classList.contains('open')) document.getElementById('setupClose')?.click();
    window.setTimeout(() => showStep(0), 120);
  }

  setupToggle.addEventListener('click', () => {
    if (current !== 0) return;
    window.setTimeout(() => showStep(1), 340);
  });
  nextButton.addEventListener('click', () => current >= steps.length - 1 ? finish() : showStep(current + 1));
  skipButton.addEventListener('click', () => {
    if (current === 0) {
      setupToggle.click();
      return;
    }
    if (current >= steps.length - 1) finish();
    else showStep(current + 1);
  });
  replayButton?.addEventListener('click', start);
  window.addEventListener('resize', positionCard);
  window.addEventListener('scroll', positionCard, { passive: true });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && current >= 0) finish();
  });

  if (!localStorage.getItem(TOUR_KEY)) window.setTimeout(start, 900);
}
