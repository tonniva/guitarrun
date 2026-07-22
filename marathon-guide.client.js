const lessonMode = document.getElementById('lessonMode');
const modal = document.getElementById('marathonGuide');
const video = document.getElementById('marathonGuideVideo');
const closeButton = document.getElementById('marathonGuideClose');
const doneButton = document.getElementById('marathonGuideDone');

if (lessonMode && modal && video) {
  function closeGuide() {
    video.pause();
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('marathon-guide-open');
  }

  async function openGuide() {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('marathon-guide-open');
    video.currentTime = 0;
    video.playbackRate = 1.5;
    try { await video.play(); } catch (_) {}
  }

  lessonMode.addEventListener('change', () => {
    if (lessonMode.value === 'marathon3nps') window.setTimeout(openGuide, 180);
  });
  closeButton?.addEventListener('click', closeGuide);
  doneButton?.addEventListener('click', () => {
    closeGuide();
    document.getElementById('quickPracticeBtn')?.focus();
  });
  modal.addEventListener('click', event => { if (event.target === modal) closeGuide(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && modal.classList.contains('open')) closeGuide();
  });
  video.addEventListener('ended', () => {
    video.currentTime = 0;
    video.play().catch(() => {});
  });
}
