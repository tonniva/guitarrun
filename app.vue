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
import leaderboardTh from './locales/leaderboard-ui/th.json'
import leaderboardEn from './locales/leaderboard-ui/en.json'
import leaderboardZh from './locales/leaderboard-ui/zh.json'
import leaderboardJa from './locales/leaderboard-ui/ja.json'
import leaderboardKo from './locales/leaderboard-ui/ko.json'
import leaderboardEs from './locales/leaderboard-ui/es.json'
import heroTh from './locales/hero-ui/th.json'
import heroEn from './locales/hero-ui/en.json'
import heroZh from './locales/hero-ui/zh.json'
import heroJa from './locales/hero-ui/ja.json'
import heroKo from './locales/hero-ui/ko.json'
import heroEs from './locales/hero-ui/es.json'
import runtimeTh from './locales/runtime-ui/th.json'
import runtimeEn from './locales/runtime-ui/en.json'
import runtimeZh from './locales/runtime-ui/zh.json'
import runtimeJa from './locales/runtime-ui/ja.json'
import runtimeKo from './locales/runtime-ui/ko.json'
import runtimeEs from './locales/runtime-ui/es.json'
import rhythmTh from './locales/rhythm-ui/th.json'
import rhythmEn from './locales/rhythm-ui/en.json'
import rhythmZh from './locales/rhythm-ui/zh.json'
import rhythmJa from './locales/rhythm-ui/ja.json'
import rhythmKo from './locales/rhythm-ui/ko.json'
import rhythmEs from './locales/rhythm-ui/es.json'

const messages = {
  th: { ...th, ...curriculumTh, ...trainerTh, ...detailsTh, ...errorsTh, ...transitionTh, ...leaderboardTh, ...heroTh, ...runtimeTh, ...rhythmTh }, en: { ...en, ...curriculumEn, ...trainerEn, ...detailsEn, ...errorsEn, ...transitionEn, ...leaderboardEn, ...heroEn, ...runtimeEn, ...rhythmEn },
  zh: { ...zh, ...curriculumZh, ...trainerZh, ...detailsZh, ...errorsZh, ...transitionZh, ...leaderboardZh, ...heroZh, ...runtimeZh, ...rhythmZh }, ja: { ...ja, ...curriculumJa, ...trainerJa, ...detailsJa, ...errorsJa, ...transitionJa, ...leaderboardJa, ...heroJa, ...runtimeJa, ...rhythmJa },
  ko: { ...ko, ...curriculumKo, ...trainerKo, ...detailsKo, ...errorsKo, ...transitionKo, ...leaderboardKo, ...heroKo, ...runtimeKo, ...rhythmKo }, es: { ...es, ...curriculumEs, ...trainerEs, ...detailsEs, ...errorsEs, ...transitionEs, ...leaderboardEs, ...heroEs, ...runtimeEs, ...rhythmEs }
}
const locale = ref('th')
const runtimeConfig = useRuntimeConfig()
const languages = [
  { code: 'th', flag: '🇹🇭', name: 'ไทย' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'zh', flag: '🇨🇳', name: '中文' },
  { code: 'ja', flag: '🇯🇵', name: '日本語' },
  { code: 'ko', flag: '🇰🇷', name: '한국어' },
  { code: 'es', flag: '🇪🇸', name: 'Español' }
]
const translate = (key, vars = {}) => {
  const value = messages[locale.value]?.[key] ?? messages.en[key] ?? key
  return typeof value === 'string' ? value.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? `{${name}}`) : value
}
const tr = translate

const siteUrl = 'https://www.guitarrun.com/'
const seoTitle = 'GuitarRun – เว็บฝึกกีตาร์ออนไลน์แบบเรียลไทม์'
const seoDescription = 'ฝึกกีตาร์ออนไลน์ด้วยระบบฟังเสียงจริง ดูตำแหน่งโน้ตบนคอกีตาร์ ฝึกสเกล คอร์ด และจังหวะ พร้อมติดตามพัฒนาการแบบเรียลไทม์'
const seoImage = `${siteUrl}brand/guitarrun-logo-source.png`

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  ogType: 'website',
  ogUrl: siteUrl,
  ogLocale: 'th_TH',
  ogSiteName: 'GuitarRun',
  ogImage: seoImage,
  ogImageWidth: 1536,
  ogImageHeight: 1024,
  ogImageAlt: 'GuitarRun เว็บฝึกกีตาร์ออนไลน์แบบเรียลไทม์',
  twitterCard: 'summary_large_image',
  twitterTitle: seoTitle,
  twitterDescription: seoDescription,
  twitterImage: seoImage,
  twitterImageAlt: 'GuitarRun เว็บฝึกกีตาร์ออนไลน์แบบเรียลไทม์'
})

useHead({
  link: [
    { rel: 'canonical', href: siteUrl }
  ],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': `${siteUrl}#website`,
          url: siteUrl,
          name: 'GuitarRun',
          description: seoDescription,
          inLanguage: ['th', 'en', 'zh', 'ja', 'ko', 'es']
        },
        {
          '@type': 'SoftwareApplication',
          '@id': `${siteUrl}#application`,
          name: 'GuitarRun',
          url: siteUrl,
          description: seoDescription,
          applicationCategory: 'EducationalApplication',
          applicationSubCategory: 'Guitar Training',
          operatingSystem: 'Any',
          browserRequirements: 'Requires a modern browser with microphone access',
          image: seoImage,
          isAccessibleForFree: true,
          inLanguage: ['th', 'en', 'zh', 'ja', 'ko', 'es'],
          publisher: {
            '@type': 'Organization',
            name: 'GuitarRun',
            url: siteUrl,
            logo: `${siteUrl}brand/guitarrun-logo.svg`
          }
        }
      ]
    })
  }]
})

function applyLanguage(code) {
  if (!messages[code]) return
  locale.value = code
  document.documentElement.lang = code
  localStorage.setItem('fret-language', code)
  window.__FRET_T = (key, vars) => translate(key, vars)
  window.dispatchEvent(new CustomEvent('fret-language-change', { detail: code }))
}

onMounted(async () => {
  window.__GUITARRUN_CONFIG__ = runtimeConfig.public
  applyLanguage(localStorage.getItem('fret-language') || 'th')
  await import('./guitar.client.js')
  await import('./account.client.js')
})

watch(locale, code => {
  if (import.meta.client) applyLanguage(code)
})
</script>

<template>
  <div class="noise" />
  <header class="topbar">
    <a class="brand" href="#" aria-label="GuitarRun home"><img src="/brand/guitarrun-logo.svg" alt="GuitarRun"></a>
    <div class="header-actions"><button id="profileButton" class="profile-button"><span id="profileAvatar">GR</span><b id="profileLabel">{{ tr('sign_in') }}</b></button><label class="language-menu" :aria-label="tr('language')"><select v-model="locale"><option v-for="language in languages" :key="language.code" :value="language.code">{{ language.flag }} {{ language.name }}</option></select></label><button id="headerConnect" class="header-connect">⌁ {{ tr('connect') }}</button><div class="status-pill"><i id="statusDot" /><span id="statusText">{{ tr('status_offline') }}</span></div></div>
  </header>
  <button id="setupToggle" class="setup-fab" aria-expanded="true" aria-controls="scale-setup"><span>⚙</span><b id="setupSummary">C · Major · P1</b></button>

  <main>
    <section class="hero">
      <div class="eyebrow">PLAY IT. SEE IT.</div>
      <div class="hero-title">{{ tr('hero_title') }}<br><em>{{ tr('hero_em') }}</em></div>
      <p>{{ tr('hero_desc') }}</p>
      <div class="actions">
        <button id="connectBtn" class="primary"><span class="button-icon">⌁</span> {{ tr('connect_guitar') }}</button>
        <button id="demoBtn" class="secondary">{{ tr('demo') }}</button>
      </div>
      <p class="privacy">{{ tr('privacy') }}</p>
    </section>

    <section id="scale-setup" class="scale-toolbar open" role="dialog" aria-modal="true" aria-hidden="false" :aria-label="tr('scale_setup_label')">
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
        <label>{{ tr('lesson_mode') }}<select id="lessonMode" class="mini-select" aria-label="Lesson mode"><option value="full">Full Pattern</option><option value="marathon3nps" selected>3NPS Marathon · P1–P7</option><option value="chordOpen">Chord Coach · Open Chords</option><option value="chunkLow">Chunk · 6–5</option><option value="chunkMid">Chunk · 4–3</option><option value="chunkHigh">Chunk · 2–1</option><option value="rootHunt">Root Hunt</option><option value="memory">Memory Fade</option><option value="connectNext">Connect · Next Position</option><option value="connectThree">Connect · 3 Positions</option><option value="connectAll">Connect · All Positions</option><option value="horizontal">Horizontal · All Strings</option></select></label>
        <button id="scaleFocusToggle" class="mini active">◉ SCALE FOCUS ON</button>
        <button id="loopToggle" class="mini active">↻ LOOP ON</button>
        <button id="flowToggle" class="mini active">→ FLOW ON</button>
        <button id="calibrateBtn" class="mini calibration-trigger">◌ {{ tr('calibrate') }}</button>
      </div>
      <button id="quickPracticeBtn" class="setup-practice-btn"><span>▶</span><b>{{ tr('start_practice') }}</b></button>
    </section>

    <section class="studio" aria-label="Guitar note visualizer">
      <div class="readout">
        <div id="noteBlock" class="note-block"><small>{{ tr('detected_note') }}</small><span id="noteName">LIVE</span><sup id="octave" /></div>
        <div class="pitch-data"><strong id="frequency">0.0 Hz</strong><span id="pitchHint">{{ tr('play_one_note') }}</span></div>
        <div class="tuner"><div class="tuner-scale"><i>-50</i><i>-25</i><i>0</i><i>+25</i><i>+50</i></div><div class="tuner-track"><b id="tunerNeedle" /></div><span id="centsLabel">0 cents</span></div>
      </div>
      <div class="fretboard-wrap"><div id="guitarHitBanner" class="guitar-hit-banner"><strong>PERFECT!</strong><span>+100 · 1× COMBO</span></div><div id="positionGuide" class="position-guide"><div class="position-guide-head"><small>{{ tr('next_starts_in') }}</small><strong>P2</strong><span id="positionGuideRemaining">5</span></div><div class="next-pattern-label">{{ tr('ghost_on_fretboard') }}</div><div class="next-pattern-detail"><b id="nextRootDetail">ROOT C</b><span id="nextStartDetail">START C · STRING 6 · FRET 8</span></div><i><em id="positionGuideBar" /></i></div><div id="positionTransition" class="position-transition"><small>{{ tr('position_success') }}</small><strong>P1 ✓</strong><span>{{ tr('keep_combo') }}</span></div><div id="fretNumbers" class="fret-numbers" /><div id="fretboard" class="fretboard" :aria-label="tr('fretboard_label')" /></div>
      <div class="trainer-panel">
        <div class="trainer-stage">
          <div id="countdownOverlay" class="countdown-overlay"><small>{{ tr('get_ready') }}</small><strong id="countdownValue">3</strong></div>
          <div id="hitEffect" class="hit-effect"><strong>PERFECT!</strong><span>+100</span><i /><i /><i /><i /><i /><i /></div>
          <div id="countRing" class="count-ring"><span id="targetNote">A</span><small id="beatCount">{{ tr('ready') }}</small></div>
          <div class="trainer-info"><span id="patternName">A Minor Pentatonic · Pattern 1</span><strong id="directionText">ASCENDING ↑</strong><div id="sequence" class="sequence" /><div class="game-stats"><span>{{ tr('score') }} <b id="scoreValue">0000</b></span><span>{{ tr('combo') }} <b id="comboValue">0×</b></span><span>{{ tr('hit') }} <b id="accuracyValue">—</b></span></div></div>
          <div class="trainer-actions">
            <button id="readoutConnect" class="readout-connect"><span>⌁</span> {{ tr('connect_guitar') }}</button>
            <button id="practiceBtn" class="practice-btn">▶ {{ tr('start_practice') }}</button>
          </div>
        </div>
        <div class="trainer-foot"><span><b id="stepNow">0</b> / <span id="stepTotal">0</span> NOTES</span><span id="trainerFeedback">{{ tr('trainer_feedback') }}</span></div>
      </div>
      <div class="legend"><span><i class="dot active-dot" /> {{ tr('active_note') }}</span><span><i class="dot match-dot" /> {{ tr('same_position') }}</span><span class="tip">{{ tr('clean_tone_tip') }}</span></div>
    </section>

    <section id="trainer" class="trainer">
      <div class="trainer-title"><div><span class="eyebrow">SCALE TRAINER</span><h2>{{ tr('scale_trainer_title') }}</h2></div><p>{{ tr('scale_trainer_desc') }}</p></div>
      <div class="performance-board">
        <div class="performance-live">
          <div class="performance-head"><span>{{ tr('live_performance') }}</span><b id="positionProgress">POSITION 1 /
              7</b></div>
          <div class="grade-bars">
            <div class="grade perfect"><span>{{ tr('perfect') }} <b id="perfectCount">0</b></span><i><em
                  id="perfectBar" /></i></div>
            <div class="grade good"><span>{{ tr('good') }} <b id="goodCount">0</b></span><i><em id="goodBar" /></i>
            </div>
            <div class="grade miss"><span>{{ tr('miss') }} <b id="missCount">0</b></span><i><em id="missBar" /></i>
            </div>
          </div>
          <div class="miss-breakdown"><span>{{ tr('wrong_note') }} <b id="wrongCount">0</b></span><span>{{ tr('timing')
              }} <b id="timingCount">0</b></span><span>{{ tr('no_hit') }} <b id="noHitCount">0</b></span></div>
          <div class="run-meta"><span>{{ tr('max_combo') }} <b id="maxComboValue">0×</b></span><span>{{ tr('session') }}
              <b id="sessionScore">0000</b></span></div>
        </div>
        <div class="records-panel">
          <div class="performance-head"><span>{{ tr('personal_best') }}</span><b>{{ tr('local_records') }}</b></div>
          <div id="recordBoard" class="record-list" />
        </div>
      </div>
    </section>

    <figure class="scale-showcase" aria-hidden="true">
      <img src="/images/guitarrun-scale-play-v2.png" alt="" width="1774" height="887" loading="lazy" decoding="async">
    </figure>

    <section id="communityLeaderboard" class="community-leaderboard">
      <div class="leaderboard-title"><div><span class="eyebrow">{{ tr('community') }}</span><h2>{{ tr('leaderboard_title') }}<br><em>GuitarRun</em></h2></div><div class="leaderboard-intro"><span><i /> {{ tr('live_ranking') }}</span><p>{{ tr('leaderboard_desc') }}</p></div></div>
      <div class="leaderboard-summary"><div><span>{{ tr('ranked_players') }}</span><strong id="leaderboardPlayers">—</strong><small>{{ tr('guitarists') }}</small></div><div><span>{{ tr('total_practice_time') }}</span><strong id="leaderboardTotalTime">—</strong><small>{{ tr('verified_time') }}</small></div><div><span>{{ tr('current_leader') }}</span><strong id="leaderboardChampion">—</strong><small>{{ tr('current_leader_label') }}</small></div></div>
      <div id="leaderboardPodium" class="leaderboard-podium"><div class="leaderboard-loading">{{ tr('loading_ranking') }}</div></div>
      <div class="leaderboard-shell"><div class="leaderboard-head"><span>{{ tr('all_rankings') }}</span><div><span>{{ tr('practice_stats') }}</span><b>{{ tr('verified_practice_time') }}</b></div></div><div id="globalLeaderboard" class="global-leaderboard"><div class="leaderboard-loading">{{ tr('loading_ranking') }}</div></div></div>
    </section>

    <figure class="scale-showcase roadmap-showcase" aria-hidden="true">
      <img src="/images/guitarrun-roadmap-studio.png" alt="" width="1918" height="820" loading="lazy" decoding="async">
    </figure>

    <section id="roadmap" class="curriculum">
      <div class="curriculum-head"><div><span class="eyebrow">FRET ROADMAP</span><h1>{{ tr('roadmap_title') }}</h1></div><p>{{ tr('roadmap_desc') }}</p></div>
      <div id="roadmapLine" class="roadmap-line" />
      <div id="lessonGrid" class="lesson-grid" />
      <div class="method-note"><span>{{ tr('curriculum_principle') }}</span><p>{{ tr('curriculum_principle_text') }}</p></div>
    </section>

    <section class="how"><div><b>01</b><h2>{{ tr('plug') }}</h2><p>USB Audio Interface / Microphone</p></div><div><b>02</b><h2>{{ tr('allow') }}</h2><p>Browser audio permission</p></div><div><b>03</b><h2>{{ tr('play') }}</h2><p>Real-time fretboard visualization</p></div></section>
  </main>

  <footer><span>FRET LAB / NUXT</span><span>WEB AUDIO • REAL-TIME PITCH</span></footer>
  <div id="profileModal" class="profile-modal" aria-hidden="true"><div class="profile-card"><button id="profileClose" class="profile-close">×</button><span class="eyebrow">GUITARRUN PROFILE</span><div id="signedOutProfile"><h2>{{ tr('profile_tagline') }}</h2><p>{{ tr('profile_signin_desc') }}</p><div id="googleSignIn"></div><p id="googleSetupHint" class="google-setup-hint"></p></div><div id="signedInProfile" hidden><div class="profile-identity"><img id="profileImage" alt="Profile"><div><h2 id="profileName">Guitar Player</h2><span id="profileEmail"></span></div></div><label class="profile-country"><span>{{ tr('your_country') }}</span><select id="profileCountry" :aria-label="tr('your_country')" /></label><label class="profile-upload">{{ tr('change_profile_photo') }}<input id="profileImageInput" type="file" accept="image/png,image/jpeg,image/webp"></label><div class="profile-stats"><span><b id="profilePracticeTime">0h</b>{{ tr('real_practice_time') }}</span><span><b id="profileNotes">0</b>{{ tr('notes_label') }}</span><span><b id="profileBestCombo">0×</b>{{ tr('best_combo_label') }}</span></div><button id="logoutButton" class="logout-button">{{ tr('sign_out') }}</button></div></div></div>
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
