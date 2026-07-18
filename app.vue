<script setup>
import th from './locales/th.json'
import en from './locales/en.json'
import zh from './locales/zh.json'
import ja from './locales/ja.json'
import ko from './locales/ko.json'
import es from './locales/es.json'
import curriculumTh from './locales/curriculum-ui/th.json'
import curriculumEn from './locales/curriculum-ui/en.json'
import curriculumZh from './locales/curriculum-ui/zh.json'
import curriculumJa from './locales/curriculum-ui/ja.json'
import curriculumKo from './locales/curriculum-ui/ko.json'
import curriculumEs from './locales/curriculum-ui/es.json'
import trainerTh from './locales/trainer-ui/th.json'
import trainerEn from './locales/trainer-ui/en.json'
import trainerZh from './locales/trainer-ui/zh.json'
import trainerJa from './locales/trainer-ui/ja.json'
import trainerKo from './locales/trainer-ui/ko.json'
import trainerEs from './locales/trainer-ui/es.json'
import detailsTh from './locales/trainer-details/th.json'
import detailsEn from './locales/trainer-details/en.json'
import detailsZh from './locales/trainer-details/zh.json'
import detailsJa from './locales/trainer-details/ja.json'
import detailsKo from './locales/trainer-details/ko.json'
import detailsEs from './locales/trainer-details/es.json'
import errorsTh from './locales/trainer-errors/th.json'
import errorsEn from './locales/trainer-errors/en.json'
import errorsZh from './locales/trainer-errors/zh.json'
import errorsJa from './locales/trainer-errors/ja.json'
import errorsKo from './locales/trainer-errors/ko.json'
import errorsEs from './locales/trainer-errors/es.json'
import transitionTh from './locales/transition-ui/th.json'
import transitionEn from './locales/transition-ui/en.json'
import transitionZh from './locales/transition-ui/zh.json'
import transitionJa from './locales/transition-ui/ja.json'
import transitionKo from './locales/transition-ui/ko.json'
import transitionEs from './locales/transition-ui/es.json'

const rhythmText = {
  th:{use_tempo:'ใช้จังหวะ',tempo_on_hint:'เปิดเมโทรนอมและตรวจความตรงจังหวะ',tempo_off_hint:'เล่นตามความเร็วตัวเอง — ตรวจเฉพาะโน้ต',detected_note:'โน้ตที่ได้ยิน'},
  en:{use_tempo:'Use tempo',tempo_on_hint:'Metronome and timing score enabled',tempo_off_hint:'Play at your pace — note accuracy only',detected_note:'Detected note'},
  zh:{use_tempo:'使用节拍',tempo_on_hint:'启用节拍器和节奏评分',tempo_off_hint:'按自己的速度练习，只检查音符',detected_note:'检测到的音符'},
  ja:{use_tempo:'テンポを使用',tempo_on_hint:'メトロノームとタイミング判定をオン',tempo_off_hint:'自分のペースで音程だけを判定',detected_note:'検出した音'},
  ko:{use_tempo:'템포 사용',tempo_on_hint:'메트로놈과 타이밍 점수 사용',tempo_off_hint:'내 속도로 음정만 확인',detected_note:'감지된 음'},
  es:{use_tempo:'Usar tempo',tempo_on_hint:'Metrónomo y puntuación de ritmo activados',tempo_off_hint:'Practica a tu ritmo; solo se evalúan las notas',detected_note:'Nota detectada'}
}
const messages = {
  th: { ...th, ...curriculumTh, ...trainerTh, ...detailsTh, ...errorsTh, ...transitionTh, ...rhythmText.th }, en: { ...en, ...curriculumEn, ...trainerEn, ...detailsEn, ...errorsEn, ...transitionEn, ...rhythmText.en },
  zh: { ...zh, ...curriculumZh, ...trainerZh, ...detailsZh, ...errorsZh, ...transitionZh, ...rhythmText.zh }, ja: { ...ja, ...curriculumJa, ...trainerJa, ...detailsJa, ...errorsJa, ...transitionJa, ...rhythmText.ja },
  ko: { ...ko, ...curriculumKo, ...trainerKo, ...detailsKo, ...errorsKo, ...transitionKo, ...rhythmText.ko }, es: { ...es, ...curriculumEs, ...trainerEs, ...detailsEs, ...errorsEs, ...transitionEs, ...rhythmText.es }
}
const locale = ref('th')
const languages = [
  { code: 'th', flag: '🇹🇭', name: 'ไทย' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'zh', flag: '🇨🇳', name: '中文' },
  { code: 'ja', flag: '🇯🇵', name: '日本語' },
  { code: 'ko', flag: '🇰🇷', name: '한국어' },
  { code: 'es', flag: '🇪🇸', name: 'Español' }
]
const tr = key => messages[locale.value]?.[key] || messages.en[key] || key

function applyLanguage(code) {
  if (!messages[code]) return
  locale.value = code
  document.documentElement.lang = code
  localStorage.setItem('fret-language', code)
  window.__FRET_T = key => messages[locale.value]?.[key] || messages.en[key] || key
  window.dispatchEvent(new CustomEvent('fret-language-change', { detail: code }))
}

onMounted(async () => {
  applyLanguage(localStorage.getItem('fret-language') || 'th')
  await import('./guitar.client.js')
})

watch(locale, code => {
  if (import.meta.client) applyLanguage(code)
})
</script>

<template>
  <div class="noise" />
  <header class="topbar">
    <a class="brand" href="#" aria-label="GuitarRun home"><img src="/brand/guitarrun-logo.svg" alt="GuitarRun"></a>
    <div class="header-actions"><label class="language-menu" :aria-label="tr('language')"><select v-model="locale"><option v-for="language in languages" :key="language.code" :value="language.code">{{ language.flag }} {{ language.name }}</option></select></label><button id="headerConnect" class="header-connect">⌁ {{ tr('connect') }}</button><div class="status-pill"><i id="statusDot" /><span id="statusText">{{ tr('status_offline') }}</span></div></div>
  </header>
  <button id="setupToggle" class="setup-fab" aria-expanded="false" aria-controls="scale-setup"><span>⚙</span><b id="setupSummary">C · Major · P1</b></button>

  <main>
    <section class="hero">
      <div class="eyebrow">PLAY IT. SEE IT.</div>
      <h1>{{ tr('hero_title') }}<br><em>{{ tr('hero_em') }}</em></h1>
      <p>{{ tr('hero_desc') }}</p>
      <div class="actions">
        <button id="connectBtn" class="primary"><span class="button-icon">⌁</span> {{ tr('connect_guitar') }}</button>
        <button id="demoBtn" class="secondary">{{ tr('demo') }}</button>
      </div>
      <p class="privacy">{{ tr('privacy') }}</p>
    </section>

    <section id="scale-setup" class="scale-toolbar" aria-label="ตั้งค่าการฝึกสเกล">
      <div class="scale-toolbar-head"><span class="label">{{ tr('setup') }}</span><span>{{ tr('setup_hint') }}</span><button id="setupClose" aria-label="Close Scale Setup">×</button></div>
      <div class="trainer-controls">
        <label>{{ tr('key') }}<select id="keySelect" /></label>
        <label>{{ tr('scale') }}<select id="scaleSelect"><option value="major" selected>Major</option><option value="minor">Natural Minor</option><option value="majorPenta">Major Pentatonic</option><option value="minorPenta">Minor Pentatonic</option></select></label>
        <label>{{ tr('pattern') }}<select id="patternSelect"><option v-for="position in 7" :key="position" :value="position - 1">Position {{ position }}</option></select></label>
        <label class="tempo-label">{{ tr('tempo') }} <output id="bpmValue">80 BPM</output><input id="bpmSlider" type="range" min="40" max="180" value="80"><span class="rhythm-check"><input id="rhythmEnabled" type="checkbox" checked>{{ tr('use_tempo') }}</span></label>
        <label>{{ tr('note_value') }}<select id="noteValue"><option value="1">Quarter notes</option><option value="2">Eighth notes</option></select></label>
        <label class="input-control">{{ tr('live_input') }}<select id="inputSelect" aria-label="Audio input" disabled><option>Default audio input</option></select><span class="compact-level"><i id="levelBar" /></span></label>
      </div>
      <div class="fixed-mode-controls">
        <label>{{ tr('lesson_mode') }}<select id="lessonMode" class="mini-select" aria-label="Lesson mode"><option value="full">Full Pattern</option><option value="marathon3nps" selected>3NPS Marathon · P1–P7</option><option value="chunkLow">Chunk · 6–5</option><option value="chunkMid">Chunk · 4–3</option><option value="chunkHigh">Chunk · 2–1</option><option value="rootHunt">Root Hunt</option><option value="memory">Memory Fade</option><option value="connectNext">Connect · Next Position</option><option value="connectThree">Connect · 3 Positions</option><option value="connectAll">Connect · All Positions</option><option value="horizontal">Horizontal · All Strings</option></select></label>
        <button id="scaleFocusToggle" class="mini active">◉ SCALE FOCUS ON</button>
        <button id="loopToggle" class="mini active">↻ LOOP ON</button>
        <button id="flowToggle" class="mini">→ FLOW OFF</button>
        <button id="calibrateBtn" class="mini calibration-trigger">◌ {{ tr('calibrate') }}</button>
      </div>
      <button id="quickPracticeBtn" class="setup-practice-btn"><span>▶</span><b>{{ tr('start_practice') }}</b></button>
    </section>

    <section class="studio" aria-label="Guitar note visualizer">
      <div class="readout">
        <div id="noteBlock" class="note-block"><small>{{ tr('detected_note') }}</small><span id="noteName">LIVE</span><sup id="octave" /></div>
        <div class="pitch-data"><strong id="frequency">0.0 Hz</strong><span id="pitchHint">เล่นโน้ตหนึ่งตัวเพื่อเริ่ม</span></div>
        <div class="tuner"><div class="tuner-scale"><i>-50</i><i>-25</i><i>0</i><i>+25</i><i>+50</i></div><div class="tuner-track"><b id="tunerNeedle" /></div><span id="centsLabel">0 cents</span></div>
      </div>
      <div class="fretboard-wrap"><div id="guitarHitBanner" class="guitar-hit-banner"><strong>PERFECT!</strong><span>+100 · 1× COMBO</span></div><div id="positionGuide" class="position-guide"><div class="position-guide-head"><small>{{ tr('next_starts_in') }}</small><strong>P2</strong><span id="positionGuideRemaining">5</span></div><div class="next-pattern-label">{{ tr('ghost_on_fretboard') }}</div><div class="next-pattern-detail"><b id="nextRootDetail">ROOT C</b><span id="nextStartDetail">START C · STRING 6 · FRET 8</span></div><i><em id="positionGuideBar" /></i></div><div id="positionTransition" class="position-transition"><small>{{ tr('position_success') }}</small><strong>P1 ✓</strong><span>{{ tr('keep_combo') }}</span></div><div id="fretNumbers" class="fret-numbers" /><div id="fretboard" class="fretboard" aria-label="คอกีตาร์ 17 เฟต" /></div>
      <div class="legend"><span><i class="dot active-dot" /> โน้ตที่กำลังเล่น</span><span><i class="dot match-dot" /> ตำแหน่งเดียวกัน</span><span class="tip">TIP: ใช้เสียง Clean เพื่อความแม่นยำสูงสุด</span></div>
    </section>

    <section id="trainer" class="trainer">
      <div class="trainer-title"><div><span class="eyebrow">SCALE TRAINER</span><h2>ฝึกแพตเทิร์นให้<br><em>เข้ากับจังหวะ</em></h2></div><p>เลือกสเกลและตำแหน่งที่ต้องการ เมโทรนอมจะพาคุณไล่โน้ตขึ้น–ลงทีละจังหวะ</p></div>
      <div class="trainer-panel">
        <div class="trainer-stage">
          <div id="countdownOverlay" class="countdown-overlay"><small>{{ tr('get_ready') }}</small><strong id="countdownValue">3</strong></div>
          <div id="hitEffect" class="hit-effect"><strong>PERFECT!</strong><span>+100</span><i /><i /><i /><i /><i /><i /></div>
          <div id="countRing" class="count-ring"><span id="targetNote">A</span><small id="beatCount">{{ tr('ready') }}</small></div>
          <div class="trainer-info"><span id="patternName">A Minor Pentatonic · Pattern 1</span><strong id="directionText">ASCENDING ↑</strong><div id="sequence" class="sequence" /><div class="game-stats"><span>{{ tr('score') }} <b id="scoreValue">0000</b></span><span>{{ tr('combo') }} <b id="comboValue">0×</b></span><span>{{ tr('hit') }} <b id="accuracyValue">—</b></span></div></div>
          <button id="practiceBtn" class="practice-btn">▶ {{ tr('start_practice') }}</button>
        </div>
        <div class="trainer-foot"><span><b id="stepNow">0</b> / <span id="stepTotal">0</span> NOTES</span><span id="trainerFeedback">{{ tr('trainer_feedback') }}</span></div>
      </div>
      <div class="performance-board">
        <div class="performance-live">
          <div class="performance-head"><span>{{ tr('live_performance') }}</span><b id="positionProgress">POSITION 1 / 7</b></div>
          <div class="grade-bars">
            <div class="grade perfect"><span>{{ tr('perfect') }} <b id="perfectCount">0</b></span><i><em id="perfectBar" /></i></div>
            <div class="grade good"><span>{{ tr('good') }} <b id="goodCount">0</b></span><i><em id="goodBar" /></i></div>
            <div class="grade miss"><span>{{ tr('miss') }} <b id="missCount">0</b></span><i><em id="missBar" /></i></div>
          </div>
          <div class="miss-breakdown"><span>{{ tr('wrong_note') }} <b id="wrongCount">0</b></span><span>{{ tr('timing') }} <b id="timingCount">0</b></span><span>{{ tr('no_hit') }} <b id="noHitCount">0</b></span></div>
          <div class="run-meta"><span>{{ tr('max_combo') }} <b id="maxComboValue">0×</b></span><span>{{ tr('session') }} <b id="sessionScore">0000</b></span></div>
        </div>
        <div class="records-panel"><div class="performance-head"><span>{{ tr('personal_best') }}</span><b>{{ tr('local_records') }}</b></div><div id="recordBoard" class="record-list" /></div>
      </div>
    </section>

    <section id="roadmap" class="curriculum">
      <div class="curriculum-head"><div><span class="eyebrow">FRET ROADMAP</span><h2>{{ tr('roadmap_title') }}</h2></div><p>{{ tr('roadmap_desc') }}</p></div>
      <div id="roadmapLine" class="roadmap-line" />
      <div id="lessonGrid" class="lesson-grid" />
      <div class="method-note"><span>{{ tr('curriculum_principle') }}</span><p>{{ tr('curriculum_principle_text') }}</p></div>
    </section>

    <section class="how"><div><b>01</b><h2>{{ tr('plug') }}</h2><p>USB Audio Interface / Microphone</p></div><div><b>02</b><h2>{{ tr('allow') }}</h2><p>Browser audio permission</p></div><div><b>03</b><h2>{{ tr('play') }}</h2><p>Real-time fretboard visualization</p></div></section>
  </main>

  <footer><span>FRET LAB / NUXT</span><span>WEB AUDIO • REAL-TIME PITCH</span></footer>
  <div id="calibrationModal" class="calibration-modal" aria-hidden="true">
    <div class="calibration-card" role="dialog" aria-modal="true" :aria-label="tr('calibrate')">
      <button id="calibrationClose" class="calibration-close" :aria-label="tr('close')">×</button>
      <span class="eyebrow">INPUT CALIBRATION</span>
      <h2>{{ tr('calibration_title') }}</h2>
      <p id="calibrationInstruction">{{ tr('calibration_intro') }}</p>
      <div class="calibration-meter"><i id="calibrationMeter" /></div>
      <div class="calibration-result"><strong id="calibrationStatus">{{ tr('calibration_ready') }}</strong><span id="calibrationDetail">—</span></div>
      <button id="calibrationStart" class="calibration-start">{{ tr('calibration_start') }}</button>
    </div>
  </div>
  <div id="toast" role="status" />
</template>
