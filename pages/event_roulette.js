// FLEXTV 이벤트 룰렛 — 배너형(글자가 돌다가 결과에서 멈춤: 일반 · 골드 · 크리스마스).
// 룰렛은 FLEXTV 이벤트 위젯(늘 떠 있는 목표 UI)과 따로, 후원 알림 위젯(info.html)에서 도전 때만 돈다. 도우미 탭 미리 돌려보기도 같이 쓴다.
// 결과(성공/실패)는 서버가 정하고, 여기서는 그 결과 칸에 멈추는 연출만 한다. 그림은 모두 CSS/SVG(외부 이미지 없음).
// 후원자 · 지정 BJ 이름표는 룰렛과 따로 있는 요소다(pages/event_nametag.js).
// FLEXTV 이벤트 위젯은 룰렛을 띄우지 않고, 알림음 '룰렛 머신'(EventRoulette.sound)만 쓴다.
//   const r = EventRoulette.create(host, { theme, winName, loseName });
//   await r.spin(win, seconds, onTick);   // 결과에서 멈추면 끝
(function (root) {
  const THEMES = {
    normal: { label: "일반", kind: "banner" },
    gold: { label: "골드", kind: "banner" },
    xmas: { label: "크리스마스", kind: "banner" },
  };
  const DEFAULT = "normal";
  const ORDER = ["normal", "gold", "xmas"];
  // 없어진 원판형(blue · pink · yellow · black)처럼 모르는 모양은 일반으로 보여 준다
  const themeOf = (t) => (THEMES[t] ? t : DEFAULT);
  const kindOf = (t) => THEMES[themeOf(t)].kind;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // 배너 양옆 장식(직접 그린 단순 도형)
  const STAR = "M12 1.5 L14.6 8.6 L22.2 8.9 L16.2 13.6 L18.3 21 L12 16.7 L5.7 21 L7.8 13.6 L1.8 8.9 L9.4 8.6 Z";
  const ORN = {
    normal: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#2a0a63" stroke="#ffd84a" stroke-width="1.6"/><path d="${STAR}" transform="translate(3.6 3.4) scale(.7)" fill="#ffd84a"/></svg>`,
    gold: `<svg viewBox="0 0 24 24"><path d="M12 1.5 L22 9 L12 22.5 L2 9 Z" fill="#ffe08a" stroke="#7a1020" stroke-width="1.4" stroke-linejoin="round"/><path d="M2 9 H22 M7 9 L12 22.5 L17 9 M7 9 L12 1.5 L17 9" fill="none" stroke="#c98a12" stroke-width="1"/></svg>`,
    xmas: `<svg viewBox="0 0 24 24"><g stroke="#ffffff" stroke-width="2" stroke-linecap="round"><path d="M12 2 V22 M3.3 7 L20.7 17 M3.3 17 L20.7 7"/><path d="M9.5 3.6 L12 6 L14.5 3.6 M9.5 20.4 L12 18 L14.5 20.4" fill="none"/></g><circle cx="12" cy="12" r="2.6" fill="#ff4d4d"/></svg>`,
  };
  const bulbs = (n) => Array.from({ length: n }, (_, i) => `<i style="animation-delay:${(i % 2) * 0.35}s"></i>`).join("");

  function create(host, options) {
    const o = Object.assign({ theme: DEFAULT, winName: "성공", loseName: "실패" }, options || {});
    const theme = themeOf(o.theme);
    const el = document.createElement("div");
    el.className = `evr evr-${kindOf(theme)} evr-${theme}`;
    host.innerHTML = "";
    host.appendChild(el);
    return banner(el, theme, o);
  }

  function ticks(onTick, seconds, count, power) {
    if (!onTick) return;
    for (let k = 0; k < count; k++) setTimeout(onTick, seconds * 1000 * (1 - Math.pow(1 - k / count, 1 / power)));
  }

  // 배너형: 창 안에서 '성공'/'실패' 글자가 위로 빠르게 지나가다가 결과에서 멈춘다
  function banner(el, theme, o) {
    el.innerHTML =
      `<div class="evr-frame"><div class="evr-bulbs t">${bulbs(18)}</div><div class="evr-bulbs b">${bulbs(18)}</div>` +
      `<span class="evr-orn l">${ORN[theme]}</span><div class="evr-window"><div class="evr-reel"><span>${esc(o.winName)}</span></div></div><span class="evr-orn r">${ORN[theme]}</span></div>`;
    const reel = el.querySelector(".evr-reel");
    return {
      el,
      kind: "banner",
      idle(text) {
        reel.style.transition = "none";
        reel.style.transform = "translateY(0)";
        reel.innerHTML = `<span>${esc(text == null ? o.winName : text)}</span>`;
        el.classList.remove("is-spin", "is-done", "is-win", "is-lose");
      },
      spin(win, seconds, onTick) {
        seconds = clamp(Number(seconds) || 4, 1, 20);
        const names = [o.loseName, o.winName];
        const steps = Math.max(16, Math.round(seconds * 8));
        const seq = [];
        for (let i = 0; i < steps; i++) seq.push(names[i % 2]);
        seq.push(win ? o.winName : o.loseName);
        reel.innerHTML = seq.map((s) => `<span>${esc(s)}</span>`).join("");
        el.classList.remove("is-done", "is-win", "is-lose");
        el.classList.add("is-spin");
        reel.style.transition = "none";
        reel.style.transform = "translateY(0)";
        void reel.offsetWidth;
        reel.style.transition = `transform ${seconds}s cubic-bezier(.15, .65, .1, 1)`;
        reel.style.transform = `translateY(${-reel.firstElementChild.offsetHeight * steps}px)`;
        ticks(onTick, seconds, steps, 2.2);
        return new Promise((done) =>
          setTimeout(() => {
            el.classList.remove("is-spin");
            el.classList.add("is-done", win ? "is-win" : "is-lose");
            done();
          }, seconds * 1000 + 60)
        );
      },
    };
  }

  // ── 룰렛 머신 소리(파일 없이 브라우저에서 만든다) ──
  // 알림음 '룰렛 머신': 동전(충전) · 준비(100%) · 레버(도전) · 릴(회전 중 모터 + 칸마다 카지노 음) · 멈춤 · 잭팟(성공) · 실패
  const sound = (function () {
    let ctx = null;
    let volume = 0.7;
    let step = 0;
    const NOTES = [1047, 1319, 1568, 2093, 1568, 1319];
    function ac() {
      if (volume <= 0) return null;
      try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === "suspended") ctx.resume();
        return ctx;
      } catch (e) {
        return null;
      }
    }
    function tone(freq, at, dur, type, gain, slideTo) {
      const a = ac();
      if (!a) return;
      const t0 = a.currentTime + at;
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(freq, t0);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(gain * volume, 0.0002), t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(a.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.05);
    }
    function noise(at, dur, from, to, type, gain) {
      const a = ac();
      if (!a) return;
      const t0 = a.currentTime + at;
      const len = Math.max(1, Math.floor(a.sampleRate * dur));
      const buf = a.createBuffer(1, len, a.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = a.createBufferSource();
      const f = a.createBiquadFilter();
      const g = a.createGain();
      src.buffer = buf;
      f.type = type;
      f.frequency.setValueAtTime(from, t0);
      f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(gain * volume, 0.0002), t0 + Math.min(0.03, dur / 3));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(f).connect(g).connect(a.destination);
      src.start(t0);
    }
    const s = {
      setVolume(v) {
        volume = clamp(Number(v) || 0, 0, 1);
      },
      // 충전: 동전 떨어지는 소리
      coin() {
        tone(1976, 0, 0.08, "square", 0.07);
        tone(2637, 0.07, 0.26, "triangle", 0.14);
        noise(0.05, 0.22, 7000, 9500, "highpass", 0.05);
      },
      // 에너지 100%: 올라가는 아르페지오 + 종소리
      ready() {
        [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, i * 0.06, 0.24, "triangle", 0.14));
        [1047, 1319, 1568].forEach((f) => tone(f, 0.38, 0.9, "sine", 0.07));
      },
      // 도전: 레버 당기는 소리(쿵 + 톱니)
      lever() {
        noise(0, 0.2, 900, 120, "lowpass", 0.35);
        tone(110, 0, 0.26, "sine", 0.3, 55);
        for (let i = 0; i < 7; i++) tone(2400 - i * 130, 0.18 + i * 0.04, 0.025, "square", 0.05);
      },
      // 릴이 도는 동안 모터 소리
      reel(seconds) {
        tone(70, 0, Math.max(0.5, seconds), "sawtooth", 0.035, 140);
        noise(0, Math.max(0.5, seconds), 600, 2400, "bandpass", 0.03);
      },
      // 칸이 바뀔 때마다 카지노 음
      tick() {
        const f = NOTES[step++ % NOTES.length];
        tone(f, 0, 0.06, "square", 0.045);
        tone(f * 2, 0, 0.03, "sine", 0.03);
      },
      // 멈춤: 철컥 + 딩
      stop() {
        noise(0, 0.12, 1400, 200, "lowpass", 0.3);
        tone(90, 0, 0.18, "sine", 0.28, 60);
        tone(1568, 0.08, 0.5, "triangle", 0.12);
      },
      // 성공: 팡파르 + 쏟아지는 동전 + 반짝임
      jackpot() {
        [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.3, "square", 0.08));
        [1047, 1319, 1568, 2093].forEach((f) => tone(f, 0.4, 1.2, "triangle", 0.08));
        for (let i = 0; i < 26; i++) tone(1800 + Math.random() * 1600, 0.45 + i * 0.06 + Math.random() * 0.03, 0.12, "triangle", 0.055);
        noise(0.4, 1.4, 5000, 9000, "highpass", 0.05);
      },
      // 실패: 내려가는 '와-와-와-와앙'
      fail() {
        [392, 370, 349].forEach((f, i) => tone(f, i * 0.32, 0.3, "sawtooth", 0.07, f * 0.97));
        tone(330, 0.96, 0.95, "sawtooth", 0.08, 220);
        noise(0.96, 0.6, 400, 150, "lowpass", 0.05);
      },
      // 들어보기: 레버 → 릴 → 멈춤 → 결과
      demo(win, seconds) {
        const sec = seconds || 2.4;
        const n = Math.round(sec * 9);
        s.lever();
        setTimeout(() => s.reel(sec), 250);
        for (let k = 0; k < n; k++) setTimeout(s.tick, 250 + sec * 1000 * (1 - Math.pow(1 - k / n, 1 / 3)));
        setTimeout(s.stop, 300 + sec * 1000);
        setTimeout(win ? s.jackpot : s.fail, 550 + sec * 1000);
      },
    };
    return s;
  })();

  root.EventRoulette = { create, THEMES, ORDER, DEFAULT, kindOf, themeOf, sound };
})(window);
