import { CURRICULA } from './locales/curriculum/index.js';

const NOTE_NAMES = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
const t = (key, vars) => window.__FRET_T?.(key, vars) || key;
const OPEN_MIDI = [64, 59, 55, 50, 45, 40]; // visual: high E → low E
const els = Object.fromEntries(['connectBtn','headerConnect','readoutConnect','setupToggle','setupClose','setupSummary','quickPracticeBtn','demoBtn','inputSelect','statusDot','statusText','levelBar','noteBlock','noteName','octave','frequency','pitchHint','tunerNeedle','centsLabel','fretboard','fretNumbers','toast','keySelect','scaleSelect','patternSelect','bpmSlider','bpmValue','noteValue','rhythmEnabled','practiceBtn','targetNote','beatCount','countRing','patternName','directionText','sequence','stepNow','stepTotal','trainerFeedback','lessonMode','loopToggle','flowToggle','scaleFocusToggle','hitEffect','guitarHitBanner','positionGuide','positionGuideRemaining','positionGuideBar','nextRootDetail','nextStartDetail','positionTransition','countdownOverlay','countdownValue','scoreValue','comboValue','accuracyValue','perfectCount','goodCount','missCount','wrongCount','timingCount','noHitCount','perfectBar','goodBar','missBar','maxComboValue','sessionScore','positionProgress','recordBoard','roadmapLine','lessonGrid','calibrateBtn','calibrationModal','calibrationClose','calibrationStart','calibrationInstruction','calibrationMeter','calibrationStatus','calibrationDetail'].map(id => [id, document.getElementById(id)]));

let audioContext, analyser, stream, raf, demoTimer, lastMidi = null;
let smoothedPitch = 0;
let practiceTimer = null, countdownTimer = null, countdownGoTimer = null, positionBreakTimer = null, practiceSequence = [], practiceStep = 0, loopPractice = true, scaleFocus = true, flowMode = false;
let activeTarget = null, lastBeatAt = 0, lastSoundAt = 0, lastAttack = null, hitRegistered = false, practiceIntervalMs = 750;
let score = 0, combo = 0, hits = 0, misses = 0;
let perfects = 0, goods = 0, maxCombo = 0, positionReached = 1;
let wrongNotes = 0, timingMisses = 0, noHits = 0, beatAttempt = null;
let marathonPositions = [], displayedMarathonPosition = -1;
let previewedMarathonPosition = -1;
let metronomeBeat = 0, memoryLevel = 0;
let freePlay = true;
let inputRms = 0, noiseFloor = Number(localStorage.getItem('fret-noise-floor')) || .004;
let inputThreshold = Math.max(.008, noiseFloor * 3.2), calibrationState = 'idle', calibrationSamples = [];
let scoringMidiCandidate = null, scoringMidiFrames = 0, lastScoredMidi = null;
let attackSerial = 0, processedAttackSerial = 0, lastAttackSignalAt = 0;
const RECORDS_KEY = 'fret-trainer-records-v1';
const SCALES = {
  major: { name:'Major', intervals:[0,2,4,5,7,9,11] },
  minor: { name:'Natural Minor', intervals:[0,2,3,5,7,8,10] },
  majorPenta: { name:'Major Pentatonic', intervals:[0,2,4,7,9] },
  minorPenta: { name:'Minor Pentatonic', intervals:[0,3,5,7,10] }
};
const OPEN_CHORDS = [
  {name:'C',root:0,frets:[0,1,0,2,3,null]}, {name:'G',root:7,frets:[3,0,0,0,2,3]},
  {name:'D',root:2,frets:[2,3,2,0,null,null]}, {name:'A',root:9,frets:[0,2,2,2,0,null]},
  {name:'E',root:4,frets:[0,0,1,2,2,0]}, {name:'Am',root:9,frets:[0,1,2,2,0,null]},
  {name:'Em',root:4,frets:[0,0,0,2,2,0]}, {name:'Dm',root:2,frets:[1,3,2,0,null,null]}
];

function buildFretboard() {
  els.fretNumbers.innerHTML = Array.from({length:18}, (_,f) => `<span>${f === 0 ? 'OPEN' : f}</span>`).join('');
  for (let string = 0; string < 6; string++) {
    for (let fret = 0; fret <= 17; fret++) {
      const midi = OPEN_MIDI[string] + fret;
      const cell = document.createElement('div');
      cell.className = `cell${fret === 0 ? ' open' : ''}${[3,5,7,9,12,15,17].includes(fret) && string === 2 ? ' marker' : ''}`;
      cell.dataset.string = string;
      cell.dataset.fret = fret;
      cell.dataset.pitchClass = midi % 12;
      cell.dataset.midi = midi;
      cell.innerHTML = `<span class="note-dot">${NOTE_NAMES[midi % 12]}</span>`;
      els.fretboard.appendChild(cell);
    }
  }
}

function showNote(pitch, confidence = 1, scoringPitch = pitch) {
  if (!pitch || confidence < .55) return clearNote();
  const midiFloat = 69 + 12 * Math.log2(pitch / 440);
  const midi = Math.round(midiFloat);
  const cents = Math.max(-50, Math.min(50, Math.round((midiFloat - midi) * 100)));
  const pitchClass = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const now = performance.now();
  if (processedAttackSerial !== attackSerial) {
    processedAttackSerial = attackSerial;
    scoringMidiCandidate = null;
    scoringMidiFrames = 0;
    lastScoredMidi = null;
    lastAttack = {midi, time:now};
  }
  const isNewAttack = lastMidi === null || midi !== lastMidi || now - lastSoundAt > 140;
  lastSoundAt = now;
  if (isNewAttack) {
    lastAttack = {midi, time:now};
  }
  // Check continuously inside the timing window. This tolerates microphone and
  // browser latency when the attack arrives just before the visual beat.
  // The smoothed pitch is only for the tuner UI. Scoring uses the raw detected
  // pitch and requires several stable frames so a glide between notes cannot
  // accidentally pass through the target and be marked correct.
  const rawMidi = Math.round(69 + 12 * Math.log2(scoringPitch / 440));
  if (rawMidi === scoringMidiCandidate) scoringMidiFrames++;
  else { scoringMidiCandidate = rawMidi; scoringMidiFrames = 1; }
  const stableFramesRequired = freePlay ? 2 : 4;
  if (scoringMidiFrames >= stableFramesRequired && rawMidi !== lastScoredMidi) {
    evaluateHit(rawMidi, now);
    if (hitRegistered || beatAttempt?.type === 'wrong') lastScoredMidi = rawMidi;
  }

  els.noteName.textContent = NOTE_NAMES[pitchClass];
  els.noteBlock.classList.add('detected');
  els.octave.textContent = octave;
  els.frequency.textContent = `${pitch.toFixed(1)} Hz`;
  els.centsLabel.textContent = `${cents > 0 ? '+' : ''}${cents} cents`;
  els.tunerNeedle.style.left = `${50 + cents}%`;
  els.pitchHint.textContent = Math.abs(cents) < 6 ? t('pitch_ready') : cents < 0 ? t('pitch_low') : t('pitch_high');

  document.querySelectorAll('.cell').forEach(c => {
    const isAllowed = !scaleFocus || c.classList.contains('scale-note');
    c.classList.toggle('match', isAllowed && Number(c.dataset.pitchClass) === pitchClass);
    c.classList.remove('primary-note');
  });
  const candidates = [...document.querySelectorAll(`.cell[data-pitch-class="${pitchClass}"]`)]
    .filter(c => !scaleFocus || c.classList.contains('scale-note'));
  const exactCandidates = candidates.filter(c => Number(c.dataset.midi) === midi);
  // The same pitch can exist on several strings (for example E4 at open high-E,
  // B-string fret 5, and G-string fret 9). Audio alone cannot distinguish them,
  // so highlight every physically possible position instead of falsely choosing open.
  (exactCandidates.length ? exactCandidates : candidates).forEach(c => c.classList.add('primary-note'));
  if (!practiceTimer) {
    if (scaleFocus) {
      els.pitchHint.textContent += candidates.length
        ? ` · ${t('pattern_only',{pattern:els.patternName.textContent})}`
        : ` · ${t('outside_pattern')}`;
    } else if (exactCandidates.length > 1) {
      els.pitchHint.textContent += ` · ${t('possible_positions',{count:exactCandidates.length})}`;
    }
  }
  lastMidi = midi;
}

function clearNote() {
  els.pitchHint.textContent = stream || demoTimer ? t('listening') : t('play_one_note');
  if (performance.now() - lastSoundAt > 140) {
    lastMidi = null;
    scoringMidiCandidate = null;
    scoringMidiFrames = 0;
    lastScoredMidi = null;
  }
  if (performance.now() - lastSoundAt > 650) {
    els.noteBlock.classList.remove('detected');
    els.noteName.textContent = 'LIVE';
    els.octave.textContent = '';
    els.frequency.textContent = '0.0 Hz';
    els.tunerNeedle.style.left = '50%';
    els.centsLabel.textContent = '0 cents';
  }
}

function evaluateHit(midi, time) {
  if (!practiceTimer || !activeTarget || hitRegistered) return;
  if (freePlay) {
    if (midi % 12 === activeTarget.midi % 12) registerHit(0, 1);
    else {
      beatAttempt = {type:'wrong',midi};
      els.trainerFeedback.textContent = `${t('wrong_note','Wrong note')} · ${NOTE_NAMES[((midi % 12) + 12) % 12]} → ${activeTarget.name}`;
      els.countRing.classList.remove('wrong-flash'); void els.countRing.offsetWidth; els.countRing.classList.add('wrong-flash');
    }
    return;
  }
  const timingError = Math.abs(time - lastBeatAt);
  const hitWindow = Math.min(220, practiceIntervalMs * .38);
  if (midi % 12 !== activeTarget.midi % 12) {
    beatAttempt = {type:'wrong',midi};
    return;
  }
  if (timingError <= hitWindow) registerHit(timingError, hitWindow);
  else beatAttempt = {type:time < lastBeatAt ? 'early' : 'late',timingError};
}

function playNoteShatter(cell) {
  cell.querySelectorAll('.note-shatter-particle').forEach(particle => particle.remove());
  cell.classList.remove('note-burst');
  void cell.offsetWidth;
  cell.classList.add('note-burst');

  for (let index = 0; index < 10; index += 1) {
    const angle = ((Math.PI * 2) / 10) * index + (Math.random() - 0.5) * 0.28;
    const distance = 22 + Math.random() * 20;
    const particle = document.createElement('i');
    particle.className = 'note-shatter-particle';
    particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    particle.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
    particle.style.setProperty('--rotate', `${Math.round(Math.random() * 240 - 120)}deg`);
    particle.style.setProperty('--delay', `${index * 7}ms`);
    cell.appendChild(particle);
  }

  window.setTimeout(() => {
    cell.classList.remove('note-burst');
    cell.querySelectorAll('.note-shatter-particle').forEach(particle => particle.remove());
  }, 680);
}

function registerHit(timingError, hitWindow) {
  if (hitRegistered) return;
  hitRegistered = true; hits++; combo++;
  const perfect = freePlay || timingError <= Math.min(85, hitWindow * .45);
  if (perfect) perfects++; else goods++;
  maxCombo = Math.max(maxCombo, combo);
  const points = perfect ? 100 : 70;
  score += points + Math.min(combo * 2, 50);
  window.dispatchEvent(new CustomEvent('guitarrun-verified-hit',{detail:{score,combo,perfect}}));
  els.hitEffect.classList.remove('miss-grade','nohit-grade');
  els.hitEffect.querySelector('strong').textContent = freePlay ? t('correct','CORRECT!') : perfect ? 'PERFECT!' : 'GOOD!';
  els.hitEffect.querySelector('span').textContent = `+${points}`;
  els.hitEffect.classList.remove('show'); void els.hitEffect.offsetWidth; els.hitEffect.classList.add('show');
  els.guitarHitBanner.querySelector('strong').textContent = freePlay ? t('correct','CORRECT!') : perfect ? 'PERFECT!' : 'GOOD!';
  if (freePlay) setTimeout(() => { if (practiceTimer && hitRegistered) practiceBeat(); }, 100);
  els.guitarHitBanner.querySelector('span').textContent = `+${points} · ${combo}× COMBO`;
  els.guitarHitBanner.classList.remove('show'); void els.guitarHitBanner.offsetWidth; els.guitarHitBanner.classList.add('show');
  const panel = document.querySelector('.trainer-panel'); panel.classList.remove('hit'); void panel.offsetWidth; panel.classList.add('hit');
  const hitCell = document.querySelector('.cell.target-note');
  if (hitCell) {
    hitCell.classList.add('note-hit');
    playNoteShatter(hitCell);
  }
  els.trainerFeedback.textContent = perfect ? t('hit_perfect_feedback') : t('hit_good_feedback');
  updateGameStats();
}

function registerMiss() {
  if (!activeTarget || hitRegistered) return;
  const missType = beatAttempt?.type || 'nohit';
  if (missType === 'nohit') {
    noHits++;
    els.hitEffect.classList.remove('miss-grade');
    els.hitEffect.classList.add('nohit-grade');
    els.hitEffect.querySelector('strong').textContent = t('no_hit','No hit').toUpperCase();
    els.hitEffect.querySelector('span').textContent = '—';
    els.hitEffect.classList.remove('show'); void els.hitEffect.offsetWidth; els.hitEffect.classList.add('show');
    els.trainerFeedback.textContent = `${t('no_hit','No hit')} · ${t('string','String')} ${activeTarget.string+1} · ${t('fret','Fret')} ${activeTarget.fret}`;
    updateGameStats();
    return;
  }
  misses++; combo = 0;
  if (missType === 'wrong') wrongNotes++;
  else if (missType === 'early' || missType === 'late') timingMisses++;
  const labels = {
    wrong:t('wrong_note','Wrong note').toUpperCase(),
    early:t('early','Early').toUpperCase(),
    late:t('late','Late').toUpperCase(),
    nohit:t('no_hit','No hit').toUpperCase()
  };
  const panel = document.querySelector('.trainer-panel'); panel.classList.remove('miss'); void panel.offsetWidth; panel.classList.add('miss');
  els.hitEffect.classList.remove('nohit-grade');
  els.hitEffect.classList.add('miss-grade');
  els.hitEffect.querySelector('strong').textContent = labels[missType];
  els.hitEffect.querySelector('span').textContent = 'COMBO BREAK';
  els.hitEffect.classList.remove('show'); void els.hitEffect.offsetWidth; els.hitEffect.classList.add('show');
  els.trainerFeedback.textContent = `${labels[missType]} · ${activeTarget.name} · ${t('string','String')} ${activeTarget.string+1} · ${t('fret','Fret')} ${activeTarget.fret}`;
  updateGameStats();
}

function updateGameStats() {
  els.scoreValue.textContent = String(score).padStart(4,'0');
  els.comboValue.textContent = `${combo}×`;
  els.accuracyValue.textContent = hits + misses ? `${Math.round(hits/(hits+misses)*100)}%` : '—';
  els.perfectCount.textContent = perfects;
  els.goodCount.textContent = goods;
  els.missCount.textContent = misses;
  els.wrongCount.textContent = wrongNotes;
  els.timingCount.textContent = timingMisses;
  els.noHitCount.textContent = noHits;
  els.maxComboValue.textContent = `${maxCombo}×`;
  els.sessionScore.textContent = String(score).padStart(4,'0');
  const total = Math.max(1, perfects + goods + misses);
  els.perfectBar.style.width = `${perfects / total * 100}%`;
  els.goodBar.style.width = `${goods / total * 100}%`;
  els.missBar.style.width = `${misses / total * 100}%`;
  if (hits + misses) saveBestRecord();
}

function getRecords() {
  try { return JSON.parse(localStorage.getItem(RECORDS_KEY) || '{}'); }
  catch { return {}; }
}

function saveBestRecord() {
  const records = getRecords();
  const key = `${els.keySelect.value}-${els.scaleSelect.value}`;
  const accuracy = hits + misses ? Math.round(hits / (hits + misses) * 100) : 0;
  const attempt = {score,accuracy,perfects,goods,misses,wrongNotes,timingMisses,noHits,maxCombo,position:positionReached,date:new Date().toISOString()};
  const previous = records[key];
  if (!previous || attempt.position > previous.position || (attempt.position === previous.position && attempt.score > previous.score)) {
    records[key] = attempt;
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
    renderRecordBoard();
  }
}

function renderRecordBoard() {
  const records = getRecords();
  const rows = Object.entries(records).sort((a,b) => b[1].score - a[1].score).slice(0,6);
  els.recordBoard.innerHTML = rows.length ? rows.map(([key,record],index) => {
    const [root,scaleKey] = key.split('-');
    const scale = SCALES[scaleKey];
    return `<div class="record-row"><b>#${index+1}</b><span>${NOTE_NAMES[Number(root)]} ${scale?.name || scaleKey}<small>P1 → P${record.position} · ${record.accuracy}% ACC</small></span><strong>${String(record.score).padStart(4,'0')}<small>${record.maxCombo}× COMBO</small></strong></div>`;
  }).join('') : `<div class="record-empty">${t('no_records')}</div>`;
}

function createChordPattern() {
  const chord = OPEN_CHORDS[Number(els.patternSelect.value || 0)] || OPEN_CHORDS[0];
  const notes = chord.frets.map((fret,string) => fret === null ? null : ({string,fret,midi:OPEN_MIDI[string]+fret,name:NOTE_NAMES[(OPEN_MIDI[string]+fret)%12],position:0})).filter(Boolean).sort((a,b)=>b.string-a.string);
  practiceSequence = [...notes,...notes.slice(0,-1).reverse()];
  practiceStep = 0;
  document.body.classList.add('chord-mode');
  document.querySelectorAll('.cell').forEach(cell => {
    cell.classList.remove('scale-note','root-note','shift-note','target-note','chord-muted');
    const string=Number(cell.dataset.string),fret=Number(cell.dataset.fret),shown=notes.some(note=>note.string===string&&note.fret===fret);
    if(shown) cell.classList.add('scale-note');
    if(shown&&Number(cell.dataset.pitchClass)===chord.root) cell.classList.add('root-note');
    if(fret===0&&chord.frets[string]===null) cell.classList.add('chord-muted');
  });
  els.patternName.textContent = `${chord.name} Open Chord · Arpeggio Coach`;
  els.setupSummary.textContent = `CHORD · ${chord.name}`;
  els.stepTotal.textContent = practiceSequence.length;
  els.positionProgress.textContent = `CHORD ${chord.name}`;
  els.trainerFeedback.textContent = t('chord_instruction',{chord:chord.name});
  memoryLevel=0;applyMemoryLevel();renderSequence();showPracticeTarget();
}

function createScalePattern() {
  const mode = els.lessonMode.value;
  if(mode==='chordOpen') return createChordPattern();
  document.body.classList.remove('chord-mode');
  const root = Number(els.keySelect.value || 0);
  const scale = SCALES[els.scaleSelect.value];
  const pattern = Number(els.patternSelect.value) % scale.intervals.length;
  const notesPerString = scale.intervals.length === 5 ? 2 : 3;
  function buildPositionNotes(position) {
    const totalNotes = notesPerString * 6;
    const startPitchClass = (root + scale.intervals[position]) % 12;
    let startMidi = 40;
    while (startMidi % 12 !== startPitchClass) startMidi++;
    const linearMidi = [];
    let cursor = startMidi;
    for (let i = 0; i < totalNotes; i++) {
      const degree = (position + i) % scale.intervals.length;
      const wanted = (root + scale.intervals[degree]) % 12;
      while (cursor % 12 !== wanted) cursor++;
      linearMidi.push(cursor++);
    }
    const result = [];
    let noteIndex = 0;
    for (let string = 5; string >= 0; string--) {
      for (let n = 0; n < notesPerString; n++) {
        const midi = linearMidi[noteIndex++];
        const fret = midi - OPEN_MIDI[string];
        if (fret >= 0 && fret <= 17) result.push({string,fret,midi,name:NOTE_NAMES[midi%12],position});
      }
    }
    return result;
  }
  const notes = buildPositionNotes(pattern);
  marathonPositions = [];
  displayedMarathonPosition = -1;
  previewedMarathonPosition = -1;
  const stringGroups = {chunkLow:[5,4],chunkMid:[3,2],chunkHigh:[1,0]};
  let exerciseNotes = stringGroups[mode] ? notes.filter(n => stringGroups[mode].includes(n.string)) : [...notes];
  let sequenceOverride = null;
  if (mode === 'rootHunt') exerciseNotes = notes.filter(n => n.midi % 12 === root);
  if (mode === 'marathon3nps' && notesPerString === 3) {
    marathonPositions = Array.from({length:7},(_,position) => buildPositionNotes(position));
    const segments = marathonPositions.map((ascending,position) => {
      return [...ascending,...ascending.slice(0,-1).reverse()].map((note,index) => ({...note,shift:position > 0 && index === 0}));
    });
    sequenceOverride = segments.flat();
    exerciseNotes = [...new Map(sequenceOverride.map(n => [`${n.string}-${n.fret}`,n])).values()];
  }
  if (mode === 'connectNext') {
    const next = (pattern + 1) % scale.intervals.length;
    exerciseNotes = [
      ...notes.filter(n => [5,4,3].includes(n.string)),
      ...buildPositionNotes(next).filter(n => [2,1,0].includes(n.string))
    ];
  }
  if (mode === 'connectThree') {
    const next = (pattern + 1) % scale.intervals.length;
    const third = (pattern + 2) % scale.intervals.length;
    exerciseNotes = [
      ...notes.filter(n => [5,4].includes(n.string)),
      ...buildPositionNotes(next).filter(n => [3,2].includes(n.string)),
      ...buildPositionNotes(third).filter(n => [1,0].includes(n.string))
    ];
  }
  if (mode === 'connectAll') {
    const all = Array.from({length:scale.intervals.length}, (_,position) => buildPositionNotes(position)).flat();
    exerciseNotes = [...new Map(all.map(n => [`${n.string}-${n.fret}`,n])).values()].sort((a,b) => a.midi-b.midi || b.string-a.string);
  }
  if (mode === 'horizontal') {
    exerciseNotes = [];
    for (let string = 5; string >= 0; string--) {
      for (let fret = 0; fret <= 17; fret++) {
        const midi = OPEN_MIDI[string] + fret;
        if (scale.intervals.some(interval => (root + interval) % 12 === midi % 12)) {
          exerciseNotes.push({string,fret,midi,name:NOTE_NAMES[midi%12],position:pattern});
        }
      }
    }
  }
  if (!sequenceOverride) {
    const seenPositions = new Set([exerciseNotes[0]?.position]);
    exerciseNotes = exerciseNotes.map((note,index,array) => {
      const entersNewPosition = index > 0 && note.position !== array[index-1].position && !seenPositions.has(note.position);
      seenPositions.add(note.position);
      return {...note,shift:entersNewPosition};
    });
  }
  const descending = [...exerciseNotes].reverse().slice(1);
  practiceSequence = sequenceOverride || [...exerciseNotes, ...descending];
  practiceStep = 0;
  document.querySelectorAll('.cell').forEach(c => {
    c.classList.remove('scale-note','root-note','shift-note','target-note');
    const shown = exerciseNotes.some(n => n.string === Number(c.dataset.string) && n.fret === Number(c.dataset.fret));
    if (shown) c.classList.add('scale-note');
    if (shown && Number(c.dataset.pitchClass) === root) c.classList.add('root-note');
    if (exerciseNotes.some(n => n.shift && n.string === Number(c.dataset.string) && n.fret === Number(c.dataset.fret))) c.classList.add('shift-note');
  });
  const systemName = notesPerString === 3 ? '3NPS' : '2 notes/string';
  const modeNames = {full:'Full Pattern',marathon3nps:'3NPS Marathon P1–P7',chunkLow:'Strings 6–5',chunkMid:'Strings 4–3',chunkHigh:'Strings 2–1',rootHunt:'Root Hunt',memory:'Memory Fade',connectNext:'Connect Next Position',connectThree:'Connect 3 Positions',connectAll:'Connect All Positions',horizontal:'Horizontal All Strings'};
  els.patternName.textContent = `${NOTE_NAMES[root]} ${scale.name} · Position ${pattern+1} · ${modeNames[mode]}`;
  els.setupSummary.textContent = `${NOTE_NAMES[root]} · ${scale.name.replace('Natural ','')} · P${pattern+1}`;
  els.stepTotal.textContent = practiceSequence.length;
  els.positionProgress.textContent = mode === 'marathon3nps' ? 'POSITION 1 / 7' : `POSITION ${pattern+1}`;
  memoryLevel = 0;
  applyMemoryLevel();
  renderSequence();
  showPracticeTarget();
}

function renderMarathonPosition(position, animate = true) {
  const notes = marathonPositions[position] || [];
  const root = Number(els.keySelect.value || 0);
  document.querySelectorAll('.cell').forEach(cell => {
    const shown = notes.some(note => note.string === Number(cell.dataset.string) && note.fret === Number(cell.dataset.fret));
    cell.classList.toggle('scale-note', shown);
    cell.classList.toggle('root-note', shown && Number(cell.dataset.pitchClass) === root);
    cell.classList.remove('shift-note','match','primary-note','next-preview','next-preview-root','next-preview-start');
  });
  previewedMarathonPosition = -1;
  if (animate && displayedMarathonPosition >= 0 && position !== displayedMarathonPosition) {
    els.positionTransition.querySelector('strong').textContent = `P${displayedMarathonPosition + 1} → P${position + 1}`;
    els.positionTransition.classList.remove('show');
    void els.positionTransition.offsetWidth;
    els.positionTransition.classList.add('show');
  }
  displayedMarathonPosition = position;
}

function renderNextPatternPreview(position) {
  if (previewedMarathonPosition === position) return;
  const notes = marathonPositions[position] || [];
  const root = Number(els.keySelect.value || 0);
  const start = notes[0];
  const nextRoot = notes.find(note => note.midi % 12 === root);
  document.querySelectorAll('.cell.next-preview,.cell.next-preview-root,.cell.next-preview-start').forEach(cell => cell.classList.remove('next-preview','next-preview-root','next-preview-start'));
  notes.forEach(note => {
    const cell = document.querySelector(`.cell[data-string="${note.string}"][data-fret="${note.fret}"]`);
    cell?.classList.add('next-preview');
    if (note.midi % 12 === root) cell?.classList.add('next-preview-root');
    if (note === start) cell?.classList.add('next-preview-start');
  });
  els.nextRootDetail.textContent = nextRoot
    ? `${t('root_note','Root')} ${NOTE_NAMES[root]} · ${t('string','String')} ${nextRoot.string+1} · ${t('fret','Fret')} ${nextRoot.fret}`
    : `${t('root_note','Root')} ${NOTE_NAMES[root]}`;
  els.nextStartDetail.textContent = start
    ? `${t('start_note','Start')} ${start.name} · ${t('string','String')} ${start.string+1} · ${t('fret','Fret')} ${start.fret}`
    : '';
  previewedMarathonPosition = position;
}

function setSetupOpen(open) {
  document.querySelector('#scale-setup').classList.toggle('open', open);
  document.body.classList.toggle('setup-open', open);
  els.setupToggle.setAttribute('aria-expanded', String(open));
}

function updatePatternOptions() {
  if(els.lessonMode.value==='chordOpen'){
    const current=Math.min(Number(els.patternSelect.value||0),OPEN_CHORDS.length-1);
    els.patternSelect.innerHTML=OPEN_CHORDS.map((chord,index)=>`<option value="${index}" ${index===current?'selected':''}>${chord.name} Open Chord</option>`).join('');
    return;
  }
  const count = SCALES[els.scaleSelect.value].intervals.length;
  const label = count === 7 ? '3NPS Position' : 'Box';
  const current = Math.min(Number(els.patternSelect.value || 0), count - 1);
  els.patternSelect.innerHTML = Array.from({length:count},(_,i) => `<option value="${i}" ${i===current?'selected':''}>${label} ${i+1}</option>`).join('');
}

function applyMemoryLevel() {
  document.body.classList.toggle('memory-dots', els.lessonMode.value === 'memory' && memoryLevel >= 1);
  document.body.classList.toggle('memory-roots', els.lessonMode.value === 'memory' && memoryLevel >= 2);
  document.body.classList.toggle('memory-blind', els.lessonMode.value === 'memory' && memoryLevel >= 3);
}

function completeRound() {
  if (els.lessonMode.value === 'marathon3nps') {
    saveBestRecord();
    stopPractice();
    els.trainerFeedback.textContent = t('marathon_complete',{score,combo:maxCombo});
    toast(t('marathon_passed'));
    return false;
  }
  if (els.lessonMode.value === 'memory') {
    memoryLevel++;
    if (memoryLevel > 3) {
      stopPractice();
      els.trainerFeedback.textContent = t('memory_complete');
      toast(t('memory_passed'));
      return false;
    }
    applyMemoryLevel();
    const labels = t('memory_names');
    els.trainerFeedback.textContent = t('memory_round',{round:memoryLevel+1,label:labels[memoryLevel]});
  } else if (!loopPractice) {
    stopPractice();
    els.trainerFeedback.textContent = t('round_complete');
    return false;
  }
  return true;
}

function renderSequence() {
  const from = Math.max(0, Math.min(practiceStep - 3, practiceSequence.length - 9));
  els.sequence.innerHTML = practiceSequence.slice(from, from + 9).map((n,i) => {
    const actual = from + i;
    return `<i class="${actual < practiceStep ? 'done' : ''}${actual === practiceStep ? ' current' : ''}">${n.name}</i>`;
  }).join('');
}

function showPracticeTarget() {
  if (!practiceSequence.length) return;
  const target = practiceSequence[practiceStep];
  if (els.lessonMode.value === 'marathon3nps' && target.position !== displayedMarathonPosition) {
    renderMarathonPosition(target.position);
  }
  document.querySelectorAll('.cell.target-note').forEach(c => c.classList.remove('target-note'));
  document.querySelector(`.cell[data-string="${target.string}"][data-fret="${target.fret}"]`)?.classList.add('target-note');
  els.targetNote.textContent = els.lessonMode.value === 'memory' && memoryLevel >= 3 ? '?' : target.name;
  els.stepNow.textContent = practiceStep + 1;
  positionReached = Math.max(positionReached, (target.position ?? 0) + 1);
  els.positionProgress.textContent = els.lessonMode.value === 'marathon3nps'
    ? `POSITION ${(target.position ?? 0) + 1} / 7`
    : `POSITION ${(target.position ?? 0) + 1}`;
  const turningPoint = Math.ceil(practiceSequence.length / 2);
  els.directionText.textContent = practiceStep < turningPoint ? 'ASCENDING ↑' : 'DESCENDING ↓';
  if (target.shift) els.directionText.textContent = `SHIFT → POSITION ${target.position + 1}`;
  renderSequence();
}

function startPositionBreak(completedPosition, nextPosition) {
  clearInterval(practiceTimer); practiceTimer = null;
  activeTarget = null;
  let count = 5;
  const breakInterval = Math.max(500, 60000 / Number(els.bpmSlider.value));
  els.positionTransition.querySelector('small').textContent = t('position_success','Position complete');
  els.positionTransition.querySelector('strong').textContent = `P${completedPosition + 1} ✓`;
  els.positionTransition.classList.remove('show'); void els.positionTransition.offsetWidth; els.positionTransition.classList.add('show');
  renderNextPatternPreview(nextPosition);
  els.positionGuide.querySelector('strong').textContent = `P${nextPosition + 1}`;
  els.positionGuideRemaining.textContent = `${count}`;
  els.positionGuideBar.style.width = '0%';
  els.positionGuide.classList.add('show');
  if (!freePlay) metroClick(true);
  positionBreakTimer = setInterval(() => {
    count--;
    if (count > 0) {
      els.positionGuideRemaining.textContent = `${count}`;
      els.positionGuideBar.style.width = `${(5-count)/4*100}%`;
      if (!freePlay) metroClick(count === 1);
      return;
    }
    clearInterval(positionBreakTimer); positionBreakTimer = null;
    els.positionGuide.classList.remove('show');
    renderMarathonPosition(nextPosition, false);
    practiceBeat();
    practiceTimer = freePlay ? -1 : setInterval(practiceBeat, practiceIntervalMs);
  }, breakInterval);
}

function metroClick(accent = false) {
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.value = accent ? 1180 : 820;
  gain.gain.setValueAtTime(.11, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + .055);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(); oscillator.stop(audioContext.currentTime + .06);
}

function practiceBeat() {
  if (activeTarget) {
    if (!hitRegistered && !freePlay) registerMiss();
    if (hitRegistered || flowMode) {
      const completedPosition = activeTarget.position;
      practiceStep++;
      if (practiceStep >= practiceSequence.length) {
        if (!completeRound()) return;
        practiceStep = 0;
      }
      const nextPosition = practiceSequence[practiceStep]?.position;
      if (els.lessonMode.value === 'marathon3nps' && nextPosition !== undefined && nextPosition !== completedPosition) {
        startPositionBreak(completedPosition, nextPosition);
        return;
      }
    }
  }
  const beat = (metronomeBeat++ % 4) + 1;
  if (!freePlay) metroClick(beat === 1);
  els.beatCount.textContent = freePlay ? t('your_pace','YOUR PACE') : `BEAT ${beat}`;
  els.countRing.classList.remove('pulse'); void els.countRing.offsetWidth; els.countRing.classList.add('pulse');
  showPracticeTarget();
  activeTarget = practiceSequence[practiceStep];
  lastBeatAt = performance.now();
  hitRegistered = false;
  beatAttempt = null;
  document.querySelectorAll('.cell.note-hit').forEach(c => c.classList.remove('note-hit'));
  els.trainerFeedback.textContent = t('target_location',{string:activeTarget.string+1,fret:activeTarget.fret});
  const preBeatError = lastAttack ? lastBeatAt - lastAttack.time : Infinity;
  const beatWindow = Math.min(220, practiceIntervalMs * .38);
  if (!freePlay && lastAttack && preBeatError >= 0 && preBeatError <= practiceIntervalMs * .65) {
    if (lastAttack.midi % 12 === activeTarget.midi % 12 && preBeatError <= beatWindow) registerHit(preBeatError, beatWindow);
    else if (lastAttack.midi % 12 === activeTarget.midi % 12) beatAttempt = {type:'early',timingError:preBeatError};
    else beatAttempt = {type:'wrong',midi:lastAttack.midi};
  }
  // In Demo mode, play the expected target just after the beat so the complete
  // score/combo/effect loop can be previewed without a connected instrument.
  if (demoTimer) {
    const demoTarget = activeTarget;
    setTimeout(() => showNote(440 * Math.pow(2, (demoTarget.midi - 69) / 12)), 45);
  }
}

function startPractice() {
  stopPractice(false);
  practiceStep = 0;
  metronomeBeat = 0; memoryLevel = 0; applyMemoryLevel();
  activeTarget = null; hitRegistered = false; lastAttack = null; score = 0; combo = 0; hits = 0; misses = 0;
  perfects = 0; goods = 0; wrongNotes = 0; timingMisses = 0; noHits = 0; beatAttempt = null;
  maxCombo = 0; positionReached = 1; updateGameStats();
  els.practiceBtn.textContent = `■ ${t('stop_practice')}`;
  els.practiceBtn.classList.add('running');
  els.quickPracticeBtn.innerHTML = `<span>■</span><b>${t('stop_practice')}</b>`;
  els.quickPracticeBtn.classList.add('running');
  freePlay = !els.rhythmEnabled.checked;
  practiceIntervalMs = freePlay ? 1000 : (60000 / Number(els.bpmSlider.value)) / Number(els.noteValue.value);
  window.dispatchEvent(new CustomEvent('guitarrun-practice-start',{detail:{key:NOTE_NAMES[Number(els.keySelect.value)],scale:SCALES[els.scaleSelect.value].name,pattern:els.patternName.textContent}}));
  startCountdown();
}

function hasPracticeInput() {
  return Boolean(demoTimer || stream?.getAudioTracks().some(track => track.readyState === 'live'));
}

function togglePractice() {
  const isRunning = practiceTimer || countdownTimer || countdownGoTimer || positionBreakTimer;
  if (isRunning) return stopPractice();
  if (!hasPracticeInput()) {
    toast(t('connect_before_practice'));
    els.connectBtn.classList.add('needs-connection');
    els.headerConnect.classList.add('needs-connection');
    els.trainerFeedback.textContent = t('connect_before_practice');
    setTimeout(() => {
      els.connectBtn.classList.remove('needs-connection');
      els.headerConnect.classList.remove('needs-connection');
    }, 2200);
    return;
  }
  startPractice();
}

function startCountdown() {
  let count = 10;
  const countInterval = Math.max(500, 60000 / Number(els.bpmSlider.value));
  els.countdownOverlay.classList.remove('clear','go');
  els.countdownOverlay.classList.add('show');
  els.countdownOverlay.style.setProperty('--count-progress','0');
  els.countdownOverlay.querySelector('small').textContent = t('get_ready','Get ready');
  els.countdownValue.textContent = count;
  if (!freePlay) metroClick(true);
  countdownTimer = setInterval(() => {
    count--;
    if (count > 0) {
      els.countdownOverlay.style.setProperty('--count-progress',String((10-count)/9));
      els.countdownOverlay.classList.toggle('clear', count <= 5);
      els.countdownValue.textContent = count;
      els.countdownValue.classList.remove('tick'); void els.countdownValue.offsetWidth; els.countdownValue.classList.add('tick');
      if (!freePlay) metroClick(count === 1);
      return;
    }
    clearInterval(countdownTimer); countdownTimer = null;
    els.countdownValue.textContent = t('go','GO!');
    els.countdownOverlay.style.setProperty('--count-progress','1');
    els.countdownOverlay.classList.add('go');
    if (!freePlay) metroClick(true);
    countdownGoTimer = setTimeout(() => {
      countdownGoTimer = null;
      els.countdownOverlay.classList.remove('show','go','clear');
      practiceBeat();
      practiceTimer = freePlay ? -1 : setInterval(practiceBeat, practiceIntervalMs);
    }, Math.min(420, countInterval * .65));
  }, countInterval);
}

function stopPractice(resetLabel = true) {
  const hadActivePractice=Boolean(practiceTimer||countdownTimer||countdownGoTimer||positionBreakTimer);
  clearInterval(practiceTimer); practiceTimer = null;
  clearInterval(countdownTimer); countdownTimer = null;
  clearTimeout(countdownGoTimer); countdownGoTimer = null;
  clearInterval(positionBreakTimer); positionBreakTimer = null;
  els.countdownOverlay.classList.remove('show','go','clear');
  els.positionGuide.classList.remove('show');
  previewedMarathonPosition = -1;
  document.querySelectorAll('.cell.next-preview,.cell.next-preview-root,.cell.next-preview-start').forEach(cell => cell.classList.remove('next-preview','next-preview-root','next-preview-start'));
  activeTarget = null;
  if(hadActivePractice) window.dispatchEvent(new CustomEvent('guitarrun-practice-end'));
  if (resetLabel) {
    els.practiceBtn.textContent = `▶ ${t('start_practice')}`;
    els.practiceBtn.classList.remove('running');
    els.quickPracticeBtn.innerHTML = `<span>▶</span><b>${t('start_practice')}</b>`;
    els.quickPracticeBtn.classList.remove('running');
    els.beatCount.textContent = t('ready','READY').toUpperCase();
  }
}

function detectPitch(buffer, sampleRate) {
  let rms = 0;
  for (const v of buffer) rms += v * v;
  rms = Math.sqrt(rms / buffer.length);
  const previousRms = inputRms;
  inputRms = rms;
  const signalNow = performance.now();
  const crossedThreshold = previousRms < inputThreshold * .8 && rms >= inputThreshold;
  const sharpRise = rms >= inputThreshold && rms > previousRms * 1.45 && rms - previousRms > .004;
  if ((crossedThreshold || sharpRise) && signalNow - lastAttackSignalAt > 75) {
    attackSerial++;
    lastAttackSignalAt = signalNow;
  }
  els.levelBar.style.width = `${Math.min(100, rms * 520)}%`;
  if (els.calibrationMeter) els.calibrationMeter.style.width = `${Math.min(100, rms * 700)}%`;
  if (calibrationState === 'sampling') calibrationSamples.push(rms);
  if (rms < inputThreshold) return [0, 0];

  const minLag = Math.floor(sampleRate / 1200);
  const maxLag = Math.min(Math.floor(sampleRate / 65), buffer.length / 2);
  let bestLag = -1, bestCorrelation = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0, normA = 0, normB = 0;
    for (let i = 0; i < buffer.length - lag; i += 2) {
      const a = buffer[i], b = buffer[i + lag];
      sum += a * b; normA += a * a; normB += b * b;
    }
    const corr = sum / Math.sqrt(normA * normB || 1);
    if (corr > bestCorrelation) { bestCorrelation = corr; bestLag = lag; }
  }
  if (bestCorrelation < .62 || bestLag < 0) return [0, bestCorrelation];
  return [sampleRate / bestLag, bestCorrelation];
}

function listen() {
  const buffer = new Float32Array(analyser.fftSize);
  const loop = () => {
    analyser.getFloatTimeDomainData(buffer);
    const [pitch, confidence] = detectPitch(buffer, audioContext.sampleRate);
    if (pitch) {
      smoothedPitch = smoothedPitch ? smoothedPitch * .7 + pitch * .3 : pitch;
      showNote(smoothedPitch, confidence, pitch);
    } else clearNote();
    raf = requestAnimationFrame(loop);
  };
  loop();
}

async function connect(deviceId) {
  stopDemo();
  if (stream) stream.getTracks().forEach(t => t.stop());
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: deviceId ? {exact:deviceId} : undefined, echoCancellation:false, noiseSuppression:false, autoGainControl:false }
    });
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    await audioContext.resume();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    audioContext.createMediaStreamSource(stream).connect(analyser);
    cancelAnimationFrame(raf);
    listen();
    await loadInputs();
    setLive(t('connected'));
    els.connectBtn.textContent = `✓ ${t('connected')}`;
    els.connectBtn.classList.add('connected');
    els.readoutConnect.hidden = true;
    toast(t('connection_ready'));
    els.calibrateBtn.classList.add('needs-calibration');
  } catch (err) {
    toast(err.name === 'NotAllowedError' ? t('mic_permission') : t('audio_connection_failed'));
  }
}

function openCalibration() {
  els.calibrationModal.classList.add('open');
  els.calibrationModal.setAttribute('aria-hidden', 'false');
  els.calibrationStatus.textContent = stream ? t('calibration_ready','Ready') : t('calibration_connect_first','Connect audio first');
  els.calibrationStart.disabled = !stream;
}

function closeCalibration() {
  if (calibrationState === 'sampling') return;
  els.calibrationModal.classList.remove('open');
  els.calibrationModal.setAttribute('aria-hidden', 'true');
}

function startCalibration() {
  if (!stream || calibrationState === 'sampling') return;
  calibrationState = 'sampling'; calibrationSamples = [];
  els.calibrationStart.disabled = true;
  els.calibrationStatus.textContent = '3';
  els.calibrationInstruction.textContent = t('calibration_silence','Keep quiet and do not play');
  let remaining = 3;
  const timer = setInterval(() => {
    remaining--;
    els.calibrationStatus.textContent = remaining || t('calibration_measuring','Measuring…');
    if (remaining > 0) return;
    clearInterval(timer);
    setTimeout(() => {
      calibrationState = 'idle';
      const sorted = calibrationSamples.slice().sort((a,b) => a-b);
      const measured = sorted[Math.floor(sorted.length * .85)] || inputRms || .004;
      noiseFloor = Math.max(.0015, Math.min(.025, measured));
      inputThreshold = Math.max(.007, Math.min(.045, noiseFloor * 3.2));
      localStorage.setItem('fret-noise-floor', String(noiseFloor));
      els.calibrationStatus.textContent = t('calibration_done','Calibration complete');
      els.calibrationDetail.textContent = `${t('noise_floor','Noise floor')} ${(noiseFloor*100).toFixed(2)}% · ${t('sensitivity','Sensitivity')} ${(inputThreshold*100).toFixed(2)}%`;
      els.calibrationInstruction.textContent = t('calibration_try_note','Now play one clean note to test the signal');
      els.calibrationStart.textContent = t('calibration_again','Calibrate again');
      els.calibrationStart.disabled = false;
      els.calibrateBtn.classList.remove('needs-calibration');
      els.calibrateBtn.classList.add('calibrated');
    }, 250);
  }, 1000);
}

async function loadInputs() {
  const devices = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'audioinput');
  els.inputSelect.innerHTML = devices.map((d,i) => `<option value="${d.deviceId}">${d.label || `Audio input ${i+1}`}</option>`).join('');
  els.inputSelect.disabled = devices.length < 2;
}

function setLive(text) {
  document.querySelector('.status-pill').classList.add('live');
  els.statusText.textContent = text;
}

function startDemo() {
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; cancelAnimationFrame(raf); }
  stopDemo();
  setLive(t('demo_playing'));
  els.demoBtn.textContent = t('stop_demo');
  const sequence = [82.41, 98, 110, 123.47, 146.83, 164.81, 196, 220, 246.94, 293.66, 329.63];
  let i = 0;
  showNote(sequence[i]);
  demoTimer = setInterval(() => { i = (i + 1) % sequence.length; showNote(sequence[i]); els.levelBar.style.width = `${30 + Math.random()*45}%`; }, 720);
}

function stopDemo() {
  clearInterval(demoTimer); demoTimer = null;
  els.demoBtn.textContent = t('demo');
}

function toast(message) {
  els.toast.textContent = message; els.toast.classList.add('show');
  setTimeout(() => els.toast.classList.remove('show'), 3000);
}


let activeRoadmapStage = 0;
function renderRoadmap(active = 0) {
  activeRoadmapStage = active;
  const locale = document.documentElement.lang || 'en';
  const curriculum = CURRICULA[locale] || CURRICULA.en;
  const goalLabel = t('pass_when','Pass when');
  const whyLabel = t('why_label','Why practice this');
  els.roadmapLine.innerHTML = curriculum.map((stage,i) => `<div class="road-step ${i===active?'active':''}" data-stage="${i}"><b>LEVEL ${stage.level}</b><strong>${stage.title}</strong><span>${stage.sub}</span></div>`).join('');
  const stage = curriculum[active];
  els.lessonGrid.innerHTML = stage.lessons.map((lesson,i) => `<article class="lesson-card"><span class="lesson-no">${stage.level}.${i+1}</span><h3>${lesson.title}</h3><p class="why" data-label="${whyLabel}: ">${lesson.why}</p><ul>${lesson.tags.map(tag=>`<li>${tag}</li>`).join('')}</ul><div class="lesson-goal"><b>${goalLabel}:</b> ${lesson.goal}</div></article>`).join('');
  document.querySelectorAll('.road-step').forEach(step => step.addEventListener('click', () => renderRoadmap(Number(step.dataset.stage))));
}

els.connectBtn.addEventListener('click', () => connect());
els.headerConnect.addEventListener('click', () => connect());
els.readoutConnect.addEventListener('click', () => connect());
els.setupToggle.addEventListener('click', () => setSetupOpen(true));
els.setupClose.addEventListener('click', () => setSetupOpen(false));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') setSetupOpen(false);
});
els.demoBtn.addEventListener('click', () => demoTimer ? (stopDemo(), location.reload()) : startDemo());
els.inputSelect.addEventListener('change', e => connect(e.target.value));
els.calibrateBtn.addEventListener('click', openCalibration);
els.calibrationClose.addEventListener('click', closeCalibration);
els.calibrationStart.addEventListener('click', startCalibration);
els.calibrationModal.addEventListener('click', e => { if (e.target === els.calibrationModal) closeCalibration(); });
buildFretboard();
els.keySelect.innerHTML = NOTE_NAMES.map((n,i) => `<option value="${i}" ${i===0?'selected':''}>${n}</option>`).join('');
els.keySelect.addEventListener('change', () => { stopPractice(); createScalePattern(); renderRecordBoard(); });
els.scaleSelect.addEventListener('change', () => {
  stopPractice(); updatePatternOptions();
  if (SCALES[els.scaleSelect.value].intervals.length !== 7 && els.lessonMode.value === 'marathon3nps') els.lessonMode.value = 'full';
  createScalePattern(); renderRecordBoard();
});
els.patternSelect.addEventListener('change', () => { stopPractice(); createScalePattern(); });
els.bpmSlider.addEventListener('input', () => { els.bpmValue.textContent = `${els.bpmSlider.value} BPM`; if (practiceTimer) startPractice(); });
els.noteValue.addEventListener('change', () => { if (practiceTimer) startPractice(); });
els.rhythmEnabled.addEventListener('change', () => {
  document.querySelector('.tempo-label').classList.toggle('tempo-disabled', !els.rhythmEnabled.checked);
  els.trainerFeedback.textContent = els.rhythmEnabled.checked
    ? t('tempo_on_hint','Metronome and timing score enabled')
    : t('tempo_off_hint','Play at your pace — note accuracy only');
  if (practiceTimer) startPractice();
});
els.lessonMode.addEventListener('change', () => { stopPractice(); updatePatternOptions(); createScalePattern(); if(els.lessonMode.value!=='chordOpen')els.trainerFeedback.textContent = t('next_note_rule'); });
els.practiceBtn.addEventListener('click', togglePractice);
els.quickPracticeBtn.addEventListener('click', togglePractice);
els.loopToggle.addEventListener('click', () => { loopPractice = !loopPractice; els.loopToggle.classList.toggle('active',loopPractice); els.loopToggle.textContent = `↻ LOOP ${loopPractice?'ON':'OFF'}`; });
els.flowToggle.addEventListener('click', () => {
  flowMode = !flowMode;
  els.flowToggle.classList.toggle('active', flowMode);
  els.flowToggle.textContent = `→ FLOW ${flowMode ? 'ON' : 'OFF'}`;
  els.trainerFeedback.textContent = flowMode ? t('flow_mode_hint') : t('accuracy_mode_hint');
});
els.scaleFocusToggle.addEventListener('click', () => {
  scaleFocus = !scaleFocus;
  els.scaleFocusToggle.classList.toggle('active',scaleFocus);
  els.scaleFocusToggle.textContent = `◉ SCALE FOCUS ${scaleFocus?'ON':'OFF'}`;
  document.querySelectorAll('.cell.match,.cell.primary-note').forEach(c => c.classList.remove('match','primary-note'));
  els.trainerFeedback.textContent = scaleFocus ? t('scale_focus_on_hint') : t('scale_focus_off_hint');
});
window.addEventListener('fret-language-change', () => {
  if (!practiceTimer) {
    els.practiceBtn.textContent = `▶ ${t('start_practice')}`;
    els.quickPracticeBtn.innerHTML = `<span>▶</span><b>${t('start_practice')}</b>`;
    els.beatCount.textContent = t('ready','READY').toUpperCase();
    els.trainerFeedback.textContent = t('trainer_feedback');
  }
  renderRecordBoard();
  renderRoadmap(activeRoadmapStage);
});
updatePatternOptions();
createScalePattern();
renderRoadmap();
renderRecordBoard();
