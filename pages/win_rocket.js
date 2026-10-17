// FlexTV 도우미 · FLEXTV 이벤트 OBS 위젯 (내부 이름은 rocket: 주소 /pages/rocket · 소켓 'rocket' · API /api/pages/rocket)
// 서버(RocketService)가 보내는 socket.io 'rocket' 이벤트를 받은 순서대로 연출한다.
// 추첨은 서버가 하고, 여기서는 결과를 받아 3 · 2 · 1 → 실패 / 성공을 보여 준다.
// 방송 화면에는 FLEXTV 로고(메인 이미지) · 목표 · 남은 양과 맨 위 회차 · 당첨 금액만 보여 준다.
// 작은 안내 글자는 방송에서 읽히지 않아 넣지 않는다.
// 당첨 금액: 이번 방송 지정 BJ 후원 전체 × 비율(기본 7%), 후원마다 올라가고 성공해도 줄지 않는다(새 방송이면 0부터).
// 회차: 엑셀 회차와 같고 한 방송에 최대 10회차. 성공한 회차는 그 엑셀이 끝날 때까지 다음 회차를 열지 않는다(WAIT: 로고를 흐리게).
//  /pages/rocket/{key}     실제 방송(프리셋 키)
//  /pages/rocket/preview   도우미 설정 탭 미리보기: 부모 창이 postMessage 로 설정 · 테스트를 보낸다(서버 연결 없음)
axios.defaults.withCredentials = true;

const ROCKET_TYPE = {
  PROGRESS: "390", // 에너지 충전 (kind FUEL) · 충전 완료 뒤 도전 금액 미달 (kind SKIP) · 다음 회차 대기 중 후원 (kind WAIT)
  ARMED: "391", // 에너지 100% · 충전 완료
  THROW: "392", // 도전 + 결과(result WIN | LOSE)
  ROUND_ENDED: "393", // 회차 종료(당첨 없이 종료 · 성공 회차의 엑셀 종료 · 새 방송)
};

// 알림 문구(tpl)는 화면에 쓰지 않고, 알림 음성을 고르면 읽어 준다
const DEFAULT_OPTIONS = {
  tpl: {
    charge: { on: true, text: "{닉네임}님 → {BJ} {렉스}렉스 에너지 충전!" },
    throw: { on: true, text: "{닉네임}님 도전!" },
    fail: { on: true, text: "실패! 다시 도전해요" },
    land: { on: true, text: "{BJ} 성공! 당첨 금액 {당첨금액}" },
  },
  sound: "chime",
  chime: "dingdong",
  rate: 1,
  volume: 70,
  fx: { count: true, launch: true, fail: true },
  wheelOn: true,
  wheelWhere: "src",
  wheelTheme: "normal", // 룰렛 모양: normal · gold · xmas(배너형) · blue · pink · yellow · black(원판형)
  wheelTime: 4, // 룰렛 회전 시간(초)
  wheelHold: 3, // 결과 표시 시간(초)
  wheelVoice: false, // 룰렛 결과 음성
  winName: "성공",
  loseName: "실패",
  wheelText: "{닉네임}님 도전! 결과는?",
  wheelSound: "on",
};

const $id = (id) => document.getElementById(id);
const fmt = (n) => Math.round(Number(n) || 0).toLocaleString("ko-KR");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = (o) => JSON.parse(JSON.stringify(o));
const ov = $id("ov");

let my_key;
let isPreview = false;
let previewConfigured = false;
let soundOn = true;
let OPT = clone(DEFAULT_OPTIONS);
const S = {
  active: false,
  roundNo: 1,
  maxRounds: 10,
  total: 0,
  goal: 100000,
  min: 1000,
  status: "FUELING", // FUELING · ARMED | WAIT(성공한 회차의 엑셀 진행 중) · DONE(방송의 회차 끝)
  throwCount: 0,
  winRate: 5,
  sessionTotal: 0, // 이번 방송 지정 BJ 후원 합계
  prizeRate: 7, // 당첨 금액 비율(%, FLEXTV 운영)
  prize: 0, // 당첨 금액 = sessionTotal × prizeRate%
  unit: "렉스",
};
// 서버(RocketService::prizeOf)와 같은 계산: 소수 둘째 자리 비율, 소수점 아래 버림
const prizeOf = (total, rate) => Math.floor((Math.max(0, Number(total) || 0) * Math.round((Number(rate) || 0) * 100)) / 10000);
const bjNames = {};

// ─────────────── 화면 크기 · 표시 ───────────────
function fitToWindow() {
  const k = Math.min(window.innerWidth / 440, window.innerHeight / 660) || 1;
  $id("rocketRoot").style.transform = `scale(${k})`;
}
window.addEventListener("resize", fitToWindow);
fitToWindow();

const money = (n) => `${fmt(n)}${S.unit}`;

function setVisible(on) {
  ov.classList.toggle("off", !on);
}

function retrigger(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

// 목표 · 남은 양: 남은 양은 후원마다 숫자가 줄어들며 통 튀고, 0이 되면 빛난다
let shownLeft = null;
let roAnim = 0;
function setReadout() {
  const left = Math.max(0, S.goal - S.total);
  const el = $id("roLeft");
  $id("roGoal").textContent = fmt(S.goal);
  $id("readout").classList.toggle("done", left === 0);
  if (shownLeft === null || !S.active) {
    shownLeft = left;
    roAnim += 1;
    el.textContent = fmt(left);
    return;
  }
  if (left === shownLeft) return;
  const from = shownLeft;
  const t0 = performance.now();
  const token = (roAnim += 1);
  shownLeft = left;
  retrigger(el, "bump");
  const step = (t) => {
    if (token !== roAnim) return;
    const k = Math.min(1, (t - t0) / 700);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(from + (left - from) * e);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// 회차 · 당첨 금액: 금액이 바뀌면 숫자가 올라가고, 길면 칸에 맞게 줄인다
let shownPrize = null;
let pzAnim = 0;
function fitPrize() {
  const el = $id("pzValue");
  el.style.transform = "";
  const k = el.scrollWidth > el.clientWidth ? el.clientWidth / el.scrollWidth : 1;
  if (k < 1) el.style.transform = `scale(${k.toFixed(3)})`;
}
function setPrize(animate) {
  const done = S.status === "DONE";
  $id("prize").classList.toggle("done", done);
  // 당첨 금액은 방송 후원이 쌓인 만큼이라 금액이 있으면 '누적'으로 보여 준다
  $id("prize").classList.toggle("carry", !done && S.prize > 0);
  const round = $id("pzRound");
  const roundText = `${S.roundNo}회차`;
  if (round.textContent !== roundText) {
    round.textContent = roundText;
    if (animate) retrigger(round, "flip");
  }
  $id("pzLabel").textContent = done ? "" : S.prize > 0 ? "누적" : "당첨";
  const el = $id("pzValue");
  if (done) {
    pzAnim += 1;
    shownPrize = null;
    el.textContent = "종료";
    fitPrize();
    return;
  }
  const to = S.prize;
  if (!animate || shownPrize === null || !S.active || to === shownPrize) {
    pzAnim += 1;
    shownPrize = to;
    el.textContent = money(to);
    fitPrize();
    return;
  }
  const from = shownPrize;
  const t0 = performance.now();
  const token = (pzAnim += 1);
  shownPrize = to;
  retrigger(el, "bump");
  const step = (t) => {
    if (token !== pzAnim) return;
    const k = Math.min(1, (t - t0) / 1200);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = money(from + (to - from) * e);
    fitPrize();
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function render(animatePrize = false) {
  const busy = ov.classList.contains("busy");
  ov.classList.toggle("ready", S.status === "ARMED" && !busy);
  ov.classList.toggle("wait", (S.status === "WAIT" || S.status === "DONE") && !busy);
  Logo.target = S.goal > 0 ? Math.min(1, S.total / S.goal) : 0;
  setReadout();
  setPrize(animatePrize);
}

const donorName = (e) => e.sponsorNickname || "후원자";
const bjName = (e) => e.bjNickname || bjNames[String(e.bjMemberId)] || "BJ";
function fill(text, e) {
  return String(text || "").replace(/\{(닉네임|BJ|렉스|당첨금액)\}/g, (m, k) => {
    if (k === "닉네임") return donorName(e);
    if (k === "BJ") return bjName(e);
    if (k === "렉스") return fmt(e.amount);
    return money(e.prizeAmount || S.prize);
  });
}

// ─────────────── 소리 (파일 없이 브라우저에서 만든다) ───────────────
let actx = null;
const vol = () => (soundOn ? (Number(OPT.volume) || 0) / 100 : 0);
function audio() {
  if (!vol()) return null;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === "suspended") actx.resume();
    return actx;
  } catch (e) {
    return null;
  }
}
function tone(freq, at, dur, type = "sine", gain = 0.25, slideTo) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + at;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(gain * vol(), 0.0002), t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}
// 걸러 낸 잡음(성공 효과음)
function noise(at, dur, from, to, type = "bandpass", gain = 0.3) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + at;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  const f = a.createBiquadFilter();
  const g = a.createGain();
  src.buffer = buf;
  f.type = type;
  f.Q.value = 0.5;
  f.frequency.setValueAtTime(from, t0);
  f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(gain * vol(), 0.0002), t0 + Math.min(0.05, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(a.destination);
  src.start(t0);
}
const CHIMES = {
  dingdong: () => {
    tone(988, 0, 0.35, "sine", 0.3);
    tone(784, 0.22, 0.5, "sine", 0.3);
  },
  fanfare: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.32, "triangle", 0.22)),
  pop: () => tone(380, 0, 0.2, "square", 0.1, 1300),
};
const FX = {
  count: () => tone(880, 0, 0.12, "square", 0.08),
  land: () => [659, 784, 988, 1319].forEach((f, i) => tone(f, i * 0.11, 0.4, "triangle", 0.2)),
  tick: () => tone(1700, 0, 0.03, "square", 0.04),
  power: () => tone(180, 0, 3.1, "sawtooth", 0.06, 900),
  glitch: () => {
    for (let i = 0; i < 7; i++) tone(200 + Math.random() * 900, i * 0.09, 0.06, "square", 0.09);
  },
  boom: () => {
    noise(0, 0.9, 1800, 120, "lowpass", 0.45);
    tone(70, 0, 0.8, "sine", 0.35, 35);
  },
};
// 알림 음성: 도우미 TTS(후원 알림과 같은 주소), 안 되면 브라우저 음성
function speak(text) {
  if (!vol() || !text) return;
  const local = () => {
    try {
      if (!("speechSynthesis" in window)) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ko-KR";
      u.rate = Number(OPT.rate) || 1;
      u.volume = vol();
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch (e) {}
  };
  try {
    if (typeof g_url_tts === "string" && g_url_tts) {
      const a = new Audio(g_url_tts + encodeURIComponent(text));
      a.volume = vol();
      a.playbackRate = Number(OPT.rate) || 1;
      a.play().catch(local);
      return;
    }
  } catch (e) {}
  local();
}

// 이벤트 알림은 소리로만: 알림음 또는 알림 음성(문구를 읽는다). 화면에는 글자를 띄우지 않는다.
function alertEvent(kind, e) {
  const t = OPT.tpl && OPT.tpl[kind];
  if (!t || !t.on) return;
  if (OPT.sound === "chime") (CHIMES[OPT.chime] || CHIMES.dingdong)();
  else if (OPT.sound === "voice") speak(fill(t.text, e));
}

// ─────────────── 룰렛(pages/event_roulette.js): 배너형 · 원판형 ───────────────
const slicesFor = (winRate) => Math.max(4, Math.min(24, Math.round(100 / (Number(winRate) || 5))));
const clampNum = (v, a, b, d) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(a, Math.min(b, n)) : d;
};
// 이번 도전의 룰렛 설정: 서버가 보낸 값(e.wheel)이 있으면 그것, 없으면(미리보기) 탭 설정
function wheelOf(e) {
  const w = Object.assign(
    { on: OPT.wheelOn, where: OPT.wheelWhere, sound: OPT.wheelSound, theme: OPT.wheelTheme, time: OPT.wheelTime, hold: OPT.wheelHold, voice: OPT.wheelVoice, winName: OPT.winName, loseName: OPT.loseName },
    (e && e.wheel) || {}
  );
  w.time = clampNum(w.time, 2, 10, DEFAULT_OPTIONS.wheelTime);
  w.hold = clampNum(w.hold, 1, 10, DEFAULT_OPTIONS.wheelHold);
  return w;
}
let roulette = null;
let rouletteKey = "";
let resultAt = 0;
let resultHold = 0;
function rouletteFor(e, w) {
  const theme = EventRoulette.themeOf(w.theme);
  const slices = slicesFor(e.winRate || S.winRate);
  const key = [theme, slices, w.winName, w.loseName].join("|");
  const box = $id("evRoulette");
  box.className = `ev-roulette is-${EventRoulette.kindOf(theme)}${box.classList.contains("show") ? " show" : ""}`;
  if (!roulette || key !== rouletteKey) {
    roulette = EventRoulette.create(box, { theme, slices, winName: w.winName, loseName: w.loseName });
    rouletteKey = key;
  }
  return roulette;
}
async function spinInside(e) {
  const w = wheelOf(e);
  resultAt = 0;
  if (!w.on) {
    await sleep(3400); // 카운트다운과 같은 길이
    return;
  }
  if (w.where !== "inside") {
    await sleep(Math.max(3400, w.time * 1000 + 200)); // 후원 알림 위젯의 룰렛과 같은 때 결과를 보여 준다
    return;
  }
  const win = e.result === "WIN";
  const r = rouletteFor(e, w);
  r.idle();
  $id("evRoulette").classList.add("show");
  await sleep(200);
  await r.spin(win, w.time, w.sound === "on" ? FX.tick : null);
  resultAt = performance.now();
  resultHold = w.hold * 1000;
  if (w.voice) speak(`${win ? w.winName : w.loseName}!`);
}
// 결과 표시 시간만큼은 룰렛을 남겨 둔다
async function hideWheel() {
  if (resultAt) {
    const left = resultHold - (performance.now() - resultAt);
    if (left > 0) await sleep(left);
  }
  resultAt = 0;
  $id("evRoulette").classList.remove("show");
}

// ─────────────── 연출 ───────────────
async function countdown() {
  const el = $id("count");
  await sleep(300);
  for (const [i, word] of ["3", "2", "1"].entries()) {
    el.textContent = word;
    retrigger(el, "go");
    if (OPT.fx.count) FX.count();
    Logo.beat(i);
    await sleep(950);
  }
  el.classList.remove("go");
}

// ─────────────── FLEXTV 로고: 물결 에너지 ───────────────
const Logo = {
  level: 0,
  target: 0,
  phase: 0,
  slosh: 0,
  bubbles: [],
  lastT: 0,
  start() {
    requestAnimationFrame((t) => this.tick(t));
  },
  tick(t) {
    const dt = this.lastT ? Math.min(0.05, (t - this.lastT) / 1000) : 0.016;
    this.lastT = t;
    this.level += (this.target - this.level) * Math.min(1, dt * 3.2);
    this.phase += dt * 3;
    this.slosh *= Math.pow(0.25, dt);
    const amp = 0.9 + this.slosh * 2.2;
    const y0 = 49 - this.level * 53;
    let line = "";
    for (let x = -2; x <= 50; x += 2) {
      const y = y0 + Math.sin(x / 7.5 + this.phase) * amp * 0.6 + Math.sin(x / 3.4 - this.phase * 1.4) * amp * 0.35 + this.slosh * Math.sin(x / 9 + this.phase * 4) * 1.6;
      line += `${x === -2 ? "M" : "L"}${x} ${y.toFixed(2)} `;
    }
    $id("lgLiqPath").setAttribute("d", `${line}L50 50 L-2 50 Z`);
    $id("lgLine").setAttribute("d", this.level > 0.995 ? "" : line);
    $id("lgDeepRect").setAttribute("y", (y0 - 1).toFixed(2));
    if (this.level > 0.04 && Math.random() < dt * 7) this.bubbles.push({ x: 4 + Math.random() * 40, y: 49, r: 0.4 + Math.random() * 0.9, v: 6 + Math.random() * 6 });
    this.bubbles = this.bubbles.filter((b) => b.y > y0 + 0.5);
    $id("lgBubbles").innerHTML = this.bubbles
      .map((b) => {
        b.y -= b.v * dt;
        b.x += Math.sin(b.y * 0.8) * 0.05;
        return `<circle cx="${b.x.toFixed(2)}" cy="${b.y.toFixed(2)}" r="${b.r.toFixed(2)}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width=".25"/>`;
      })
      .join("");
    requestAnimationFrame((t2) => this.tick(t2));
  },
  // 3 · 2 · 1 마다 로고가 쿵 커지고 핑크 · 청록 고리가 퍼진다
  beat(i) {
    retrigger($id("lgWrap"), "beat");
    const ring = document.createElement("div");
    ring.className = `lg-ring${i % 2 ? " c" : ""}`;
    $id("logoScene").appendChild(ring);
    setTimeout(() => ring.remove(), 1000);
  },
};

function applyRound(r) {
  if (!r) return;
  if (r.roundNo != null) S.roundNo = Number(r.roundNo);
  if (r.maxRounds != null) S.maxRounds = Number(r.maxRounds);
  if (r.totalAmount != null) S.total = Number(r.totalAmount);
  if (r.goalAmount != null) S.goal = Number(r.goalAmount);
  if (r.minAmount != null) S.min = Number(r.minAmount);
  if (r.status) S.status = r.status;
  if (r.throwCount != null) S.throwCount = Number(r.throwCount);
  if (r.sessionTotal != null) S.sessionTotal = Number(r.sessionTotal);
  if (r.prizeRate != null) S.prizeRate = Number(r.prizeRate);
  if (r.prizeAmount != null) S.prize = Number(r.prizeAmount);
  if (r.prizeUnit) S.unit = r.prizeUnit;
}
// 후원 이벤트에 실려 오는 회차 값(회차 번호 · 목표 · 당첨 금액)
const roundOf = (e) => ({ roundNo: e.roundNo, maxRounds: e.maxRounds, goalAmount: e.goalAmount, minAmount: e.minAmount, sessionTotal: e.sessionTotal, prizeRate: e.prizeRate, prizeAmount: e.prizeAmount, prizeUnit: e.prizeUnit });

async function onProgress(e) {
  if (e.kind === "WAIT") {
    // 다음 회차를 기다리는 중 · 방송 회차가 끝난 뒤 후원: 에너지는 그대로, 당첨 금액만 올라간다
    applyRound(Object.assign(roundOf(e), { status: e.status }));
    render(true);
    await sleep(500);
    return;
  }
  applyRound(roundOf(e));
  if (e.kind === "SKIP") {
    render(true);
    await sleep(500);
    return;
  }
  S.total = Number(e.totalAmount);
  S.status = "FUELING";
  Logo.slosh = 0.8;
  render(true);
  alertEvent("charge", e);
  await sleep(800);
}

async function onArmed(e) {
  applyRound(Object.assign(roundOf(e), { totalAmount: e.totalAmount, status: "ARMED", throwCount: 0 }));
  Logo.slosh = 0.8;
  render(true);
  if (OPT.sound === "chime") (CHIMES[OPT.chime] || CHIMES.dingdong)();
  await sleep(1000);
}

async function onThrow(e) {
  applyRound(roundOf(e));
  S.status = "ARMED";
  S.throwCount = Number(e.throwNo) || S.throwCount + 1;
  if (e.winRate) S.winRate = Number(e.winRate);
  ov.classList.add("busy");
  render(true);
  alertEvent("throw", e);
  if (OPT.fx.count) FX.power();
  await Promise.all([spinInside(e), countdown()]);
  if (e.result === "WIN") await igniteSuccess(e);
  else await igniteFail(e);
  await hideWheel();
  ov.classList.remove("busy");
  render();
}

// 실패: 로고가 지지직 흔들리고 에너지가 출렁이며 잠깐 빠졌다가 다시 차오른다
async function igniteFail(e) {
  retrigger($id("lgWrap"), "glitch");
  Logo.slosh = 1.6;
  Logo.target = 0.86;
  setTimeout(() => render(), 700);
  if (OPT.fx.fail) FX.glitch();
  alertEvent("fail", e);
  await sleep(2000);
  $id("lgWrap").classList.remove("glitch");
}

// 성공: 로고가 한 바퀴 돌며 번쩍 → 빛줄기 · 불꽃 · 꽃가루 → 에너지가 빠지고 다음 회차(엑셀이 끝날 때까지 흐리게 대기)
async function igniteSuccess(e) {
  ov.classList.add("boom");
  render();
  if (OPT.fx.launch) FX.boom();
  await sleep(620);
  retrigger($id("lgFlash"), "on");
  const colors = ["#ff024a", "#00fff6", "#ffffff", "#ffd54a"];
  sparks(220, 220, colors, 90, 12);
  confetti(220, 250, colors, 140, 9);
  if (OPT.fx.launch) FX.land();
  alertEvent("land", e);
  await sleep(4800);
  // 당첨 금액은 방송 후원 기준이라 성공해도 그대로 이어진다
  applyRound(e.next || { roundNo: Math.min(S.roundNo + 1, S.maxRounds), totalAmount: 0, status: S.roundNo >= S.maxRounds ? "DONE" : "WAIT" });
  S.total = 0;
  S.throwCount = 0;
  ov.classList.remove("boom");
  Logo.slosh = 1;
  render(true);
}

// 회차 종료: 에너지가 빠지고 남은 양이 목표로 돌아가며 회차 번호가 넘어간다(당첨 금액은 그대로, 새 방송이면 0)
async function onRoundEnded(e) {
  applyRound(e.next || { roundNo: S.roundNo + 1, totalAmount: 0, status: "FUELING" });
  S.total = 0;
  S.throwCount = 0;
  if (!e.next || !e.next.status) S.status = "FUELING";
  Logo.slosh = 1;
  render(true);
  await sleep(1600);
}

// ─────────────── 꽃가루 · 불꽃 (캔버스) ───────────────
let parts = [];
let partsRunning = false;
function addParts(list) {
  parts.push(...list);
  if (!partsRunning) {
    partsRunning = true;
    requestAnimationFrame(stepParts);
  }
}
function stepParts() {
  const cv = $id("confetti");
  const ctx = cv.getContext("2d");
  ctx.clearRect(0, 0, cv.width, cv.height);
  parts = parts.filter((p) => p.life > 0 && p.y < 760);
  for (const p of parts) {
    p.life -= 1;
    p.vy += p.g;
    p.vx *= p.drag;
    p.vy *= p.drag;
    p.x += p.vx;
    p.y += p.vy;
    p.r += p.vr;
    ctx.save();
    ctx.globalAlpha = Math.min(1, p.life / 30);
    if (p.spark) {
      ctx.fillStyle = p.c;
      ctx.shadowColor = p.c;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    ctx.restore();
  }
  if (parts.length) requestAnimationFrame(stepParts);
  else {
    partsRunning = false;
    ctx.clearRect(0, 0, cv.width, cv.height);
  }
}
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
function confetti(x, y, colors, n = 150, power = 4.5) {
  addParts(
    Array.from({ length: n }, () => ({
      x: x + rnd(-40, 40),
      y: y + rnd(-20, 20),
      vx: rnd(-power, power),
      vy: -rnd(2, 9),
      g: 0.2,
      drag: 0.99,
      r: rnd(0, 6),
      vr: rnd(-0.2, 0.2),
      w: rnd(6, 12),
      h: rnd(3, 7),
      c: pick(colors),
      life: 250,
    }))
  );
}
function sparks(x, y, colors, n = 70, power = 11) {
  addParts(
    Array.from({ length: n }, () => {
      const a = rnd(0, Math.PI * 2);
      const v = rnd(power * 0.3, power);
      return { spark: true, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0.08, drag: 0.95, r: 0, vr: 0, s: rnd(1.5, 3.5), c: pick(colors), life: rnd(40, 80) };
    })
  );
}

// ─────────────── 이벤트 대기열 ───────────────
const queue = [];
const seen = [];
let running = false;
let P = null; // 테스트 이벤트를 만들 때 쓰는 '대기열이 끝난 뒤' 상태

function notifyBusy(busy) {
  if (isPreview && window.parent !== window) {
    window.parent.postMessage({ type: "rocket:busy", busy }, window.location.origin);
  }
}

function enqueue(e) {
  if (e && e.seq) {
    if (seen.includes(e.seq)) return; // 다시 연결될 때 같은 이벤트를 두 번 보여 주지 않기
    seen.push(e.seq);
    if (seen.length > 300) seen.shift();
  }
  queue.push(e);
  if (!running) drain();
}

async function drain() {
  running = true;
  notifyBusy(true);
  while (queue.length) {
    const e = queue.shift();
    try {
      if (!S.active) {
        S.active = true;
        setVisible(true);
      }
      const type = String(e.type);
      if (type === ROCKET_TYPE.PROGRESS) await onProgress(e);
      else if (type === ROCKET_TYPE.ARMED) await onArmed(e);
      else if (type === ROCKET_TYPE.THROW) await onThrow(e);
      else if (type === ROCKET_TYPE.ROUND_ENDED) await onRoundEnded(e);
    } catch (err) {
      console.log("event error", err);
    }
  }
  running = false;
  P = null;
  notifyBusy(false);
}

// ─────────────── 테스트(미리보기 · OBS 테스트 메시지): 서버 없이 이 화면에서만 ───────────────
const TEST_DONORS = ["도도쭈", "새벽감성", "밤톨게임", "고양이집사", "별빛토끼"];
let testDonor = 0;
function projected() {
  if (!P) P = { roundNo: S.roundNo, total: S.total, goal: S.goal, min: S.min, status: S.status, throwCount: S.throwCount, sessionTotal: S.sessionTotal };
  return P;
}
const prizeFields = (p) => ({ sessionTotal: p.sessionTotal, prizeRate: S.prizeRate, prizeAmount: prizeOf(p.sessionTotal, S.prizeRate), prizeUnit: S.unit });
// 후원 하나: 방송 후원 합계에 더하고(당첨 금액이 올라감) 이벤트 공통 값을 만든다
function testBase(amount) {
  const p = projected();
  p.sessionTotal += amount;
  return Object.assign({
    roundNo: p.roundNo,
    maxRounds: S.maxRounds,
    amount,
    bjMemberId: "test-bj",
    bjNickname: "BJ A",
    sponsorNickname: TEST_DONORS[testDonor++ % TEST_DONORS.length],
    goalAmount: p.goal,
    minAmount: p.min,
    winRate: S.winRate,
  }, prizeFields(p));
}
// 다음 회차(테스트). 당첨 금액은 방송 후원 기준이라 그대로 이어진다
function testNext(p, status) {
  const done = p.roundNo >= S.maxRounds;
  return Object.assign({
    roundNo: done ? S.maxRounds : p.roundNo + 1,
    maxRounds: S.maxRounds,
    status: done ? "DONE" : status,
    totalAmount: 0,
    goalAmount: p.goal,
    minAmount: p.min,
    throwCount: 0,
  }, prizeFields(p));
}
function testFill(amount) {
  const p = projected();
  if (p.status === "ARMED" || p.status === "DONE") return;
  if (p.status === "WAIT") p.status = "FUELING"; // 테스트: 성공한 회차의 엑셀이 끝나고 다음 엑셀의 후원
  const add = amount == null ? p.goal - p.total : amount;
  p.total = Math.min(p.goal, p.total + add);
  if (p.total >= p.goal) {
    p.status = "ARMED";
    p.throwCount = 0;
    enqueue(Object.assign(testBase(add), { type: ROCKET_TYPE.ARMED, totalAmount: p.total }));
  } else {
    enqueue(Object.assign(testBase(add), { type: ROCKET_TYPE.PROGRESS, kind: "FUEL", totalAmount: p.total }));
  }
}
function testThrow(win) {
  testFill(null);
  const p = projected();
  if (p.status !== "ARMED") return;
  p.throwCount += 1;
  const e = Object.assign(testBase(Math.max(3000, p.min)), {
    type: ROCKET_TYPE.THROW,
    throwNo: p.throwCount,
    totalAmount: p.total,
    result: win ? "WIN" : "LOSE",
  });
  if (win) {
    // 성공해도 다음 회차는 그 엑셀이 끝난 뒤 → WAIT
    e.next = testNext(p, "WAIT");
    Object.assign(p, { roundNo: e.next.roundNo, total: 0, status: e.next.status, throwCount: 0 });
  }
  enqueue(e);
}
// 회차 끝내기(테스트): 다음 회차로 넘어간다(당첨 금액은 그대로)
function testEnd() {
  const p = projected();
  if (p.status === "DONE") return;
  const won = p.status === "WAIT"; // 성공한 회차의 엑셀 종료: 대기하던 다음 회차 시작
  const next = won ? testNext(Object.assign({}, p, { roundNo: p.roundNo - 1 }), "FUELING") : testNext(p, "FUELING");
  enqueue({ type: ROCKET_TYPE.ROUND_ENDED, reason: "STREAMER", roundNo: won ? p.roundNo - 1 : p.roundNo, won, next });
  Object.assign(p, { roundNo: next.roundNo, total: 0, status: next.status, throwCount: 0 });
}
function runTest(kind) {
  if (kind === "reset") {
    if (running) return;
    S.total = Math.round(S.goal * 0.865);
    S.status = "FUELING";
    S.throwCount = 0;
    if (previewRound) applyRound(previewRound);
    P = null;
    render();
    return;
  }
  if (kind === "charge") testFill(5000);
  else if (kind === "full") testFill(null);
  else if (kind === "lose") testThrow(false);
  else if (kind === "win") testThrow(true);
  else if (kind === "end") testEnd();
  else if (kind === "auto") {
    testFill(5000);
    testFill(null);
    testThrow(false);
    testThrow(true);
  }
}

// ─────────────── 설정 · 상태 ───────────────
function applyOptions(options) {
  const o = Object.assign(clone(DEFAULT_OPTIONS), options || {});
  o.tpl = Object.assign(clone(DEFAULT_OPTIONS.tpl), (options && options.tpl) || {});
  o.fx = Object.assign(clone(DEFAULT_OPTIONS.fx), (options && options.fx) || {});
  OPT = o;
}

function applyState(state) {
  const ev = state.event;
  const settings = state.settings || {};
  applyOptions(settings.options);
  if (ev) {
    S.winRate = Number(ev.winRate) || S.winRate;
    if (ev.prizeRate != null) S.prizeRate = Number(ev.prizeRate);
    S.unit = ev.prizeUnit || "렉스";
    if (ev.maxRounds) S.maxRounds = Number(ev.maxRounds);
  }
  applyRound(state.round);
  const live = !!(ev && ev.status === "ACTIVE" && settings.saved);
  S.active = live || S.active;
  setVisible(S.active);
  Logo.level = Logo.target = S.goal > 0 ? Math.min(1, S.total / S.goal) : 0;
  shownLeft = null;
  shownPrize = null;
  render();
}

function get_state(_key) {
  axios
    .post(g_url + "/api/pages/rocket/state", { page: _key })
    .then(function (response) {
      const json = response.data;
      if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
        console.log("event state:", json.message);
        return;
      }
      if (!running) applyState(json.resultMap.data);
    })
    .catch(function (error) {
      console.log(error);
    });
}

// 지정 BJ 닉네임: 엑셀방송 BJ 목록(서버가 닉네임을 보내 주지 않을 때, 알림 음성에 쓴다)
let lastBjFetch = 0;
function get_bj_names(_key) {
  if (Date.now() - lastBjFetch < 10000) return;
  lastBjFetch = Date.now();
  axios
    .post(g_url + "/api/pages/excel/bjlist", { page: _key })
    .then(function (response) {
      const json = response.data;
      if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) return;
      const list = (json.resultMap.data && json.resultMap.data.bj) || [];
      list.forEach(function (bj) {
        const id = (bj.user && bj.user.memberId) || bj.memberId;
        const name = bj.nickname || (bj.user && bj.user.nickname);
        if (id && name) bjNames[String(id)] = name;
      });
    })
    .catch(function () {});
}

function startSocket(_key) {
  const socket = io(g_url_socket, {
    autoConnect: false,
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    get_state(_key);
    get_bj_names(_key);
    socket.emit("login", { page: _key }, function (data) {
      console.log("login:", data);
    });
  });

  socket.on("disconnect", function (data) {
    console.log("disconnect!", data);
  });

  socket.on("rocket", function (data) {
    if (data && !data.bjNickname && data.bjMemberId && !bjNames[String(data.bjMemberId)]) get_bj_names(_key);
    enqueue(data);
  });

  socket.on("help", function () {
    window.location.reload();
  });

  socket.on("testMessage", function (data) {
    const _data = data.data || {};
    if (_data.type == "1") {
      window.location.reload(); // 새로고침
    } else if (_data.type == "2") {
      get_state(_key); // 초기화
    } else if (_data.type == "rocket") {
      S.active = true;
      setVisible(true);
      runTest(String(_data.msg || "")); // 이 화면에서만 연출(서버 기록 없음)
    }
  });

  socket.open();
}

let previewRound = null; // 탭이 보낸 지금 회차(테스트 초기화 때 되돌린다)
function startPreview() {
  isPreview = true;
  S.active = true;
  S.roundNo = 3;
  S.total = Math.round(S.goal * 0.865);
  Logo.level = 0.865;
  setVisible(true);
  render();
  window.addEventListener("message", function (ev) {
    if (ev.origin !== window.location.origin) return;
    const m = ev.data || {};
    if (m.type === "rocket:config") {
      applyOptions(m.options);
      if (m.event) {
        S.winRate = Number(m.event.winRate) || S.winRate;
        if (m.event.prizeRate != null) S.prizeRate = Number(m.event.prizeRate);
        S.unit = m.event.prizeUnit || S.unit;
        if (m.event.maxRounds) S.maxRounds = Number(m.event.maxRounds);
      }
      if (!running && m.goalAmount && Number(m.goalAmount) !== S.goal) {
        const pct = S.goal ? Math.min(1, S.total / S.goal) : 0;
        S.goal = Number(m.goalAmount);
        S.total = Math.round(S.goal * pct);
        shownLeft = null; // 목표를 바꾸면 숫자는 바로 바꾼다
      }
      if (m.minAmount) S.min = Number(m.minAmount);
      // 회차 · 당첨 금액은 처음과 서버 회차가 바뀌었을 때만(테스트로 바뀐 회차 유지). 미리보기는 늘 충전 중으로 보여 준다
      const roundChanged = m.round && (!previewRound || previewRound.roundNo !== m.round.roundNo || previewRound.sessionTotal !== m.round.sessionTotal);
      if (m.round && !running && (!previewConfigured || roundChanged)) {
        previewRound = { roundNo: m.round.roundNo, maxRounds: m.round.maxRounds, sessionTotal: m.round.sessionTotal, prizeRate: m.round.prizeRate, prizeAmount: m.round.prizeAmount };
        applyRound(previewRound);
        if (S.status === "WAIT" || S.status === "DONE") S.status = "FUELING";
        shownPrize = null;
      } else if (!previewConfigured && !previewRound) {
        S.prize = prizeOf(S.sessionTotal, S.prizeRate);
      }
      if (typeof m.sound === "boolean") soundOn = m.sound;
      previewConfigured = true;
      P = null;
      render();
    } else if (m.type === "rocket:test") {
      runTest(String(m.kind || ""));
    } else if (m.type === "rocket:hear") {
      if (m.what === "voice") {
        speak(fill(OPT.tpl.charge.text, { sponsorNickname: "도도쭈", bjNickname: "BJ A", amount: 5000 }));
      } else {
        (CHIMES[OPT.chime] || CHIMES.dingdong)();
      }
    }
  });
  if (window.parent !== window) window.parent.postMessage({ type: "rocket:ready" }, window.location.origin);
}

function init() {
  my_key = window.location.pathname.split("/").pop();
  Logo.start();
  render();
  if (my_key === "preview") {
    startPreview();
    return;
  }
  startSocket(my_key);
}

init();
