/* Cool Idea: no dependencies, no API keys. Scroll motion maps to 0..1 progress. */
(() => {
  'use strict';
  const story = document.getElementById('experience');
  const visual = document.querySelector('.visual');
  const stills = [...document.querySelectorAll('.still')];
  const video = document.getElementById('washVideo');
  const copy = [...document.querySelectorAll('.copy-panel')];
  const phases = [...document.querySelectorAll('.phase')];
  const count = document.getElementById('countStage');
  const scrollPrompt = document.getElementById('scrollPrompt');
  const mist = document.getElementById('washMist');
  const progress = document.getElementById('readingProgress');
  const compare = document.getElementById('comparison');
  const slider = document.getElementById('compareSlider');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = window.matchMedia('(max-width: 600px)');
  let videoReady = false, lastP = -1, raf = 0, maxTime = 7.7, lastVideoSeek = -1;

  function clamp(n, lo = 0, hi = 1) { return Math.min(hi, Math.max(lo, n)); }
  function smooth(n) { n = clamp(n); return n * n * (3 - 2 * n); }
  function lerp(a,b,t) { return a + (b-a)*t; }

  function update() {
    raf = 0;
    const start = story.getBoundingClientRect().top + window.scrollY;
    const distance = Math.max(1, story.offsetHeight - window.innerHeight);
    const p = clamp((window.scrollY - start) / distance);
    const stageRaw = p * 3;
    const i = Math.min(2, Math.floor(stageRaw));
    const f = smooth(stageRaw - i);
    const state = p >= .985 ? 3 : p < .245 ? 0 : p < .495 ? 1 : p < .745 ? 2 : 3;
    const lastState = window.__coolState;
    if (lastState !== state) {
      window.__coolState = state;
      copy.forEach((el,j) => el.classList.toggle('is-active',j===state));
      phases.forEach((el,j) => {el.classList.toggle('is-current',j===state);el.classList.toggle('is-done',j<state);});
      count.textContent = String(state+1).padStart(2,'0');
    }
    // Still frames remain fully functional if video seeking isn't supported.
    stills.forEach((img,j) => {
      let opacity = 0;
      if (p>=.999) opacity = j===3 ? 1 : 0;
      else if (j===i) opacity = 1-f;
      else if (j===i+1) opacity = f;
      img.style.opacity = String(opacity);
    });
    phases.forEach((el,j) => {
      el.style.setProperty('--phase-progress',j===state?String(clamp((p-state*.25)*4)):j<state?'1':'0');
    });
    const enter = 1 - smooth(clamp(p/.12));
    visual.style.transform = `translate3d(${enter*25}%,${enter*2.5}%,0) scale(${1.045-(Math.min(p,.25)*.18)})`;
    scrollPrompt.style.opacity = String(clamp(1-p*12));
    const washrange = smooth((p-.30)/.10)*(1-smooth((p-.76)/.12));
    mist.style.opacity = String(washrange*.4);
    mist.style.transform = `translate3d(${lerp(-38,48,clamp((p-.29)/.5))}%,0,0)`;
    // On larger screens, scroll-scrub the self-contained MP4. Mobile uses
    // the lighter blended stills to avoid expensive seeking on phones.
    if (videoReady && !narrow.matches && !reducedMotion.matches) {
      video.style.opacity = '1';
      const target = clamp(p)*maxTime;
      if (Math.abs(target-lastVideoSeek)>.045) {
        try { video.currentTime=target; lastVideoSeek=target; } catch (_) { video.style.opacity='0'; }
      }
    } else {video.style.opacity = '0';}
    const whole = Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
    progress.style.width = `${clamp(window.scrollY/whole)*100}%`;
    lastP=p;
  }
  function requestUpdate(){if(!raf) raf=requestAnimationFrame(update);}
  video.addEventListener('loadedmetadata',() => {videoReady=true;maxTime=Math.max(.1,(video.duration||7.8)-.08);video.pause();requestUpdate();});
  video.addEventListener('error',() => {videoReady=false;video.style.opacity='0';requestUpdate();});
  video.addEventListener('stalled',() => {video.style.opacity='0';});
  // Make sure the media is never playing freely: only scroll controls it.
  video.addEventListener('play',() => video.pause());
  slider.addEventListener('input',() => compare.style.setProperty('--split',`${slider.value}%`));
  window.addEventListener('scroll',requestUpdate,{passive:true});
  window.addEventListener('resize',requestUpdate,{passive:true});
  narrow.addEventListener?.('change',requestUpdate);
  reducedMotion.addEventListener?.('change',requestUpdate);
  requestUpdate();
})();
