(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const phone = matchMedia('(max-width: 767px), (pointer: coarse) and (max-width: 950px)').matches;
  const appleTouch = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const threshold = phone ? 0.02 : 0.008;
  const root = document.documentElement;
  const hero = document.querySelector('.hero');
  const chapters = [...hero.querySelectorAll('.chapter')];
  const filmNumber = hero.querySelector('.film-number');
  const films = [...document.querySelectorAll('[data-film]')].map(section => ({
    section,
    stage: section.firstElementChild,
    media: section.querySelector('.film-media'),
    video: section.querySelector('video'),
    poster: section.querySelector('.film-poster img'),
    surround: section.querySelector('.surround'),
    frameTime: null,
    progress: 0,
    target: 0
  }));
  let dirty = true;
  let animation = 0;
  let observed;
  let width = innerWidth;
  let version = 0;
  let pageLoaded = document.readyState === 'complete';
  let viewportHeight = innerHeight;

  const clamp = value => Math.min(1, Math.max(0, value));

  function wake() {
    if (!animation && !motion.matches) animation = requestAnimationFrame(update);
  }

  function changePosition() {
    dirty = true;
    wake();
  }

  // Extend the edge colours of the same decoded frame into the space around it.
  function paintSurround(film, source) {
    const w = source.videoWidth || source.naturalWidth;
    const h = source.videoHeight || source.naturalHeight;
    if (!w || !h) return;
    const canvas = film.surround;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const stage = film.stage.getBoundingClientRect();
    const frame = film.media.getBoundingClientRect();
    if (!stage.width || !stage.height) return;
    const height = Math.max(1, Math.round(canvas.width * stage.height / stage.width));
    if (canvas.height !== height) canvas.height = height;
    const x = canvas.width / stage.width;
    const y = height / stage.height;
    const dx = [0, (frame.left - stage.left) * x, (frame.right - stage.left) * x, canvas.width];
    const dy = [0, (frame.top - stage.top) * y, (frame.bottom - stage.top) * y, height];
    const sx = [0, 1, w - 1, w];
    const sy = [0, 1, h - 1, h];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (dx[col + 1] <= dx[col] || dy[row + 1] <= dy[row]) continue;
        ctx.drawImage(source, sx[col], sy[row], sx[col+1]-sx[col], sy[row+1]-sy[row],
          dx[col], dy[row], dx[col+1]-dx[col], dy[row+1]-dy[row]);
      }
    }
  }

  for (const film of films) {
    const refresh = () => paintSurround(film, film.media.classList.contains('is-painted') ? film.video : film.poster);
    film.poster.addEventListener('load', refresh);
    new ResizeObserver(refresh).observe(film.stage);
    refresh();
  }

  // The first second of the source is a fade from black.
  const rearStart = 1;
  const pin = hero.querySelector('.car-pin');
  let pinIndex = 0;
  pin.addEventListener('click', () => chapters[pinIndex].querySelector('.hotspot').click());
  function showChapter(progress) {
    const orbit = films[0];
    const chapterPosition = orbit.frameTime === null || !orbit.video.duration
      ? progress : (Math.max(0, orbit.frameTime - rearStart) / (orbit.video.duration - rearStart - 1 / 24)) * 0.83;
    const breaks = [0.27, 0.67];
    const index = chapterPosition < breaks[0] ? 0 : chapterPosition < breaks[1] ? 1 : 2;
    pinIndex = index;
    const marker = chapters[index].querySelector('.hotspot');
    pin.setAttribute('aria-label', marker.textContent.trim());
    // Track the lamp, window and bonnet in the original 16:9 frame.
    const fraction = clamp(chapterPosition / 0.83);
    const points = index === 0 ? [[0, .35, .46], [.33, .06, .46]]
      : index === 1 ? [[.32, .50, .33], [.81, .40, .33]]
      : [[.80, .82, .49], [1, .70, .50]];
    const [a,b] = points;
    const mix = clamp((fraction - a[0]) / (b[0] - a[0]));
    const box = orbit.media.getBoundingClientRect();
    const stageBox = orbit.stage.getBoundingClientRect();
    const scale = matchMedia('(orientation: portrait)').matches
      ? Math.min(box.width / 16, box.height / 9) : Math.max(box.width / 16, box.height / 9);
    const x = box.left - stageBox.left + box.width / 2 + (a[1] + mix * (b[1] - a[1]) - .5) * scale * 16;
    const y = box.top - stageBox.top + box.height / 2 + (a[2] + mix * (b[2] - a[2]) - .5) * scale * 9;
    pin.style.left = Math.max(24, Math.min(stageBox.width - 24, x)) + 'px';
    pin.style.top = y + 'px';
    const boundary = Math.min(...breaks.map(point => Math.abs(chapterPosition - point)));
    const opacity = 0.65 + 0.35 * clamp(boundary / 0.024);
    chapters.forEach((chapter, number) => {
      const visible = number === index;
      chapter.inert = !visible;
      chapter.setAttribute('aria-hidden', String(!visible));
      chapter.style.opacity = visible ? opacity : '';
    });
    filmNumber.textContent = `0${index + 1} / 03`;
    hero.style.setProperty('--progress', progress);
  }

  function update() {
    animation = 0;
    const moved = dirty;
    dirty = false;
    let repeat = false;
    for (const film of films) {
      if (moved) {
        const { section, stage } = film;
        const interval = Math.max(1, section.offsetHeight - stage.offsetHeight);
        const top = section.getBoundingClientRect().top;
        const header = parseFloat(getComputedStyle(stage).top) || 0;
        film.progress = clamp((header - top) / interval);
        if (section === hero) showChapter(film.progress);
        const incoming = section !== hero;
        // Give the front view a short dissolve into the first still frame of the bonnet.
        const dissolve = incoming ? clamp(film.progress / 0.085) : 0;
        if (incoming) {
          section.style.setProperty('--bonnet-opacity', dissolve);
          section.style.setProperty('--paint-copy', clamp(2 * dissolve - 1));
          hero.style.setProperty('--orbit-copy', clamp(1 - 2 * dissolve));
          section.style.pointerEvents = dissolve < 0.5 ? 'none' : 'auto';
          hero.inert = dissolve >= 0.5;
        }
        const substantial = incoming ? 0.95 : 0.83;
        const start = incoming ? 0.085 : 0;
        const end = Math.max(0, (film.video.duration || 0) - 1 / 24);
        const firstFrame = incoming ? 0 : Math.min(end, rearStart);
        film.target = firstFrame + clamp((film.progress - start) / (substantial - start)) * (end - firstFrame);
      }
      if (!film.ready || film.video.seeking) continue;
      const gap = film.target - film.video.currentTime;
      if (Math.abs(gap) < 0.0005) continue;
      const step = Math.abs(gap) * 0.2;
      try {
        film.video.currentTime = step > threshold
          ? film.video.currentTime + gap * 0.2
          : film.target;
        repeat = repeat || !film.video.seeking;
      } catch {
        still(film);
      }
    }
    if (repeat) wake();
  }

  function still(film) {
    film.ready = false;
    film.media.classList.remove('is-painted');
    film.frameTime = null;
    paintSurround(film, film.poster);
    clearTimeout(film.watchdog);
    if (film.callback && film.video.cancelVideoFrameCallback) {
      film.video.cancelVideoFrameCallback(film.callback);
    }
    film.callback = 0;
  }

  function unlock(film) {
    if (!appleTouch || !film.ready || film.unlocked) return;
    film.unlocked = true;
    const result = film.video.play();
    film.video.pause();
    result?.catch(() => {});
    changePosition();
  }

  function watchFrames(film, token) {
    const { video, media } = film;
    if (!video.requestVideoFrameCallback) {
      if (appleTouch) return;
      requestAnimationFrame(() => {
        if (token === version && film.ready) media.classList.add('is-painted');
      });
      return;
    }
    film.callback = video.requestVideoFrameCallback((_, frame) => {
      if (token !== version || !film.ready) return;
      if ((film.section !== hero || frame.mediaTime >= rearStart - 1 / 24) && (!appleTouch || (film.unlocked && frame.mediaTime > 1 / 24))) {
        media.classList.add('is-painted');
        film.frameTime = frame.mediaTime;
        paintSurround(film, video);
        if (film.section === hero) showChapter(film.progress);
      }
      if (frame.mediaTime > 1 / 24) {
        film.seekVerified = true;
        clearTimeout(film.watchdog);
      }
      watchFrames(film, token);
    });
  }

  async function load(film) {
    if (film.controller || motion.matches) return;
    const token = version;
    const { video, section } = film;
    const controller = new AbortController();
    film.controller = controller;
    try {
      const size = phone ? 'phone' : 'desktop';
      const response = await fetch(`${section.dataset.film}-${size}.mp4`, { signal: controller.signal });
      if (!response.ok) throw new Error('Video unavailable');
      const blob = await response.blob();
      if (token !== version || motion.matches) return;
      film.url = URL.createObjectURL(blob);
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      const handleReady = () => {
        if (token !== version || film.ready) return;
        video.removeEventListener('loadeddata', handleReady);
        film.ready = true;
        watchFrames(film, token);
        if (navigator.userActivation?.isActive) unlock(film);
        changePosition();
      };
      video.addEventListener('loadeddata', handleReady, { signal: controller.signal });
      video.addEventListener('error', () => still(film), { signal: controller.signal });
      video.addEventListener('seeked', () => {
        if (!video.requestVideoFrameCallback && film.media.classList.contains('is-painted')) {
          film.frameTime = video.currentTime;
          paintSurround(film, video);
          if (section === hero) showChapter(film.progress);
        }
        if (appleTouch && film.unlocked && !film.seekVerified && !film.watchdog && film.target > 0.15) {
          film.watchdog = setTimeout(() => still(film), 2200);
        }
        wake();
      }, { signal: controller.signal });
      video.addEventListener('seeking', () => {
        if (appleTouch && film.unlocked && !film.seekVerified && !film.watchdog && film.target > 0.15) {
          film.watchdog = setTimeout(() => still(film), 2200);
        }
      }, { signal: controller.signal });
      video.src = film.url;
    } catch {
      if (token === version && !controller.signal.aborted) still(film);
    }
  }

  function setup() {
    version += 1;
    observed?.disconnect();
    root.classList.toggle('enhanced', !motion.matches);
    if (motion.matches) {
      hero.inert = false;
      films[1].section.style.pointerEvents = '';
      for (const chapter of chapters) {
        chapter.inert = false;
        chapter.removeAttribute('aria-hidden');
        chapter.style.opacity = '';
      }
      for (const film of films) {
        film.controller?.abort();
        still(film);
        film.controller = null;
        if (film.url) {
          film.video.removeAttribute('src');
          film.video.load();
          URL.revokeObjectURL(film.url);
          film.url = null;
        }
        film.unlocked = false;
        film.seekVerified = false;
        film.watchdog = null;
      }
      return;
    }
    showChapter(films[0].progress);
    changePosition();
    if (!pageLoaded) return;
    load(films[0]);
    observePaint();
  }

  function observePaint() {
    if (films[1].controller) return;
    observed?.disconnect();
    observed = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          observed.unobserve(entry.target);
          load(films[1]);
        }
      }
    }, { rootMargin: `${Math.round(viewportHeight * 1.5)}px 0px` });
    observed.observe(films[1].section);
  }

  for (const marker of document.querySelectorAll('[data-service]')) {
    const dialog = document.getElementById(marker.dataset.service);
    marker.addEventListener('click', () => dialog.showModal());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
  }

  function rememberGesture() {
    for (const film of films) unlock(film);
  }

  addEventListener('scroll', changePosition, { passive: true });
  hero.addEventListener('focusout', changePosition);
  addEventListener('resize', () => {
    if (phone && width === innerWidth) return;
    width = innerWidth;
    viewportHeight = innerHeight;
    if (pageLoaded && !motion.matches) observePaint();
    changePosition();
  }, { passive: true });
  addEventListener('pointerup', rememberGesture, { passive: true });
  addEventListener('click', rememberGesture, { passive: true });
  addEventListener('load', () => {
    pageLoaded = true;
    if (!motion.matches) setup();
  }, { once: true });
  motion.addEventListener('change', setup);
  setup();
})();
