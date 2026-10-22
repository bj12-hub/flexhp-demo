// FlexTV 도우미 · FLEXTV 이벤트 OBS 위젯 (내부 이름은 rocket: 주소 /pages/rocket · 소켓 'rocket' · API /api/pages/rocket)
// 서버(RocketService)가 보내는 socket.io 'rocket' 이벤트를 받은 순서대로 연출한다.
// 추첨은 서버가 하고, 여기서는 결과를 받아 3 · 2 · 1 → 실패 / 성공을 보여 준다.
// 방송 화면에는 FLEXTV 로고(메인 이미지) · 목표 · 남은 양과 맨 위 누적 당첨 금액만 보여 준다(회차는 보여 주지 않는다).
// 작은 안내 글자는 방송에서 읽히지 않아 넣지 않는다.
// 에너지(목표까지 쌓인 후원)와 당첨 금액(지정 BJ 후원 × 비율, 기본 7%)은 엑셀 회차가 바뀌어도 이어지고,
// 성공하면 둘 다 0부터 다시 쌓인다(새 방송이어도 0부터). 성공 뒤 기다리지 않고 바로 다음 후원부터 다시 충전한다.
//  /pages/rocket/{key}     실제 방송(프리셋 키)
//  /pages/rocket/preview   도우미 설정 탭 미리보기: 부모 창이 postMessage 로 설정 · 테스트를 보낸다(서버 연결 없음)
axios.defaults.withCredentials = true;

const ROCKET_TYPE = {
  PROGRESS: "390", // 에너지 충전 (kind FUEL) · 충전 완료 뒤 도전 금액 미달 (kind SKIP)
  ARMED: "391", // 에너지 100% · 충전 완료
  THROW: "392", // 도전 + 결과(result WIN | LOSE). 성공이면 next 에 0부터 다시 쌓는 상태
  ROUND_ENDED: "393", // 엑셀 회차 종료(에너지 · 당첨 금액은 그대로) · 새 방송(0부터)
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
  chime: "machine", // machine(룰렛 머신, 기본) · dingdong · fanfare · pop
  rate: 1,
  volume: 70,
  fx: { count: true, launch: true, fail: true },
  wheelOn: true, // 룰렛은 이 위젯이 아니라 후원 알림 위젯에서 돈다
  wheelTheme: "normal", // 룰렛 모양(배너형): normal · gold · xmas
  wheelTime: 4, // 룰렛 회전 시간(초)
  wheelHold: 3, // 결과 표시 시간(초)
  wheelVoice: false, // 룰렛 결과 음성
  winName: "성공",
  loseName: "실패",
  wheelText: "{닉네임}님 → {BJ} 도전! 결과는?", // 후원 알림 위젯 룰렛 위 문구({닉네임} · {BJ} 는 이름표)
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
  total: 0, // 에너지(목표까지 쌓인 후원, 엑셀 회차가 바뀌어도 이어지고 성공하면 0)
  goal: 100000,
  min: 1000,
  status: "FUELING", // FUELING(충전 중) · ARMED(충전 완료)
  throwCount: 0,
  winRate: 5,
  prizeBasis: 0, // 지난 성공 뒤 들어온 지정 BJ 후원 합계(성공하면 0)
  prizeRate: 7, // 당첨 금액 비율(%, FLEXTV 운영)
  prize: 0, // 당첨 금액 = prizeBasis × prizeRate%
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

// 누적 당첨 금액: 금액이 올라가면 숫자가 올라간다(성공해서 0이 되면 바로 바뀐다). 자릿수(백만 · 천만 · 억)마다
// 숫자 크기를 한 단계씩 줄이고(data-len), 그래도 칸보다 길면 칸에 맞게 줄인다
let shownPrize = null;
let pzAnim = 0;
const digitsOf = (n) => String(Math.max(0, Math.floor(Number(n) || 0))).length;
function sizePrize(n) {
  const d = digitsOf(n);
  $id("prize").dataset.len = d <= 6 ? "6" : d >= 9 ? "9" : String(d);
}
function fitPrize() {
  const amt = $id("pzAmt");
  amt.style.transform = "";
  const room = $id("pzValue").clientWidth;
  const w = amt.offsetWidth;
  if (room > 0 && w > room) amt.style.transform = `scale(${(room / w).toFixed(3)})`;
}
function showPrize(n) {
  $id("pzNum").textContent = fmt(n);
  $id("pzUnit").textContent = S.unit;
  fitPrize();
}
function setPrize(animate) {
  // 당첨 금액은 지난 성공 뒤 후원이 쌓인 만큼이라 금액이 있으면 '누적'으로 보여 준다
  $id("prize").classList.toggle("carry", S.prize > 0);
  $id("pzLabel").textContent = S.prize > 0 ? "누적" : "당첨";
  const to = S.prize;
  // 크기는 도착할 금액으로 정한다(숫자가 올라가는 중에 글자 크기가 바뀌지 않게)
  sizePrize(to);
  if (!animate || shownPrize === null || !S.active || to <= shownPrize) {
    pzAnim += 1;
    shownPrize = to;
    showPrize(to);
    return;
  }
  const from = shownPrize;
  const t0 = performance.now();
  const token = (pzAnim += 1);
  shownPrize = to;
  retrigger($id("pzNum"), "bump");
  const step = (t) => {
    if (token !== pzAnim) return;
    const k = Math.min(1, (t - t0) / 1200);
    const e = 1 - Math.pow(1 - k, 3);
    showPrize(from + (to - from) * e);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function render(animatePrize = false) {
  const busy = ov.classList.contains("busy");
  ov.classList.toggle("ready", S.status === "ARMED" && !busy);
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
// 알림음 '룰렛 머신'(pages/event_roulette.js EventRoulette.sound): 충전 동전 · 도전 레버 · 실패 와-와 · 성공 잭팟
const machineOn = () => OPT.sound === "chime" && OPT.chime === "machine" && typeof EventRoulette !== "undefined" && !!EventRoulette.sound;
function machine(name, arg) {
  if (typeof EventRoulette === "undefined" || !EventRoulette.sound) return;
  EventRoulette.sound.setVolume(vol());
  EventRoulette.sound[name](arg);
}
const MACHINE_ALERT = { charge: "coin", throw: "lever", fail: "fail", land: "jackpot" };
function chime(kind) {
  if (machineOn()) machine(MACHINE_ALERT[kind] || "coin");
  else (CHIMES[OPT.chime] || CHIMES.dingdong)();
}
function alertEvent(kind, e) {
  const t = OPT.tpl && OPT.tpl[kind];
  if (!t || !t.on) return;
  if (OPT.sound === "chime") chime(kind);
  else if (OPT.sound === "voice") speak(fill(t.text, e));
}

// ─────────────── 룰렛: 이 위젯에는 띄우지 않는다 ───────────────
// 이 위젯은 늘 떠 있는 목표 UI 다. 룰렛은 따로, 후원 알림 위젯(pages/info.html)에서 도전 때만 돈다.
// 여기서는 그 룰렛이 멈출 때에 맞춰 결과 연출을 보여 주려고 기다리기만 한다.
const clampNum = (v, a, b, d) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(a, Math.min(b, n)) : d;
};
// 이번 도전의 룰렛 설정: 서버가 보낸 값(e.wheel)이 있으면 그것, 없으면(미리보기) 탭 설정
function wheelOf(e) {
  const w = Object.assign(
    { on: OPT.wheelOn, sound: OPT.wheelSound, theme: OPT.wheelTheme, time: OPT.wheelTime, hold: OPT.wheelHold, voice: OPT.wheelVoice, winName: OPT.winName, loseName: OPT.loseName, text: OPT.wheelText },
    (e && e.wheel) || {}
  );
  w.time = clampNum(w.time, 2, 10, DEFAULT_OPTIONS.wheelTime);
  w.hold = clampNum(w.hold, 1, 10, DEFAULT_OPTIONS.wheelHold);
  return w;
}
async function waitWheel(e) {
  const w = wheelOf(e);
  // 미리보기: 부모 창(이벤트 안내 페이지)이 따로 그리는 룰렛 · 이름표를 같은 때 돌릴 수 있게 알린다
  if (isPreview && window.parent !== window && w.on) {
    window.parent.postMessage(
      { type: "rocket:throw", result: e.result, sponsorNickname: e.sponsorNickname, bjNickname: e.bjNickname || bjNames[String(e.bjMemberId)] || "", amount: e.amount, prize: fmt(S.prize) + S.unit, wheel: w },
      window.location.origin
    );
  }
  // 룰렛을 쓰면 후원 알림 위젯의 룰렛이 멈추는 때, 안 쓰면 카운트다운이 끝나는 때 결과를 보여 준다
  await sleep(w.on ? Math.max(3400, w.time * 1000 + 200) : 3400);
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

// 서버 상태 · 이벤트 값(에너지 · 목표 · 당첨 금액). 회차 번호는 위젯에 쓰지 않는다
function applyRound(r) {
  if (!r) return;
  if (r.totalAmount != null) S.total = Number(r.totalAmount);
  if (r.goalAmount != null) S.goal = Number(r.goalAmount);
  if (r.minAmount != null) S.min = Number(r.minAmount);
  if (r.status === "FUELING" || r.status === "ARMED") S.status = r.status;
  if (r.throwCount != null) S.throwCount = Number(r.throwCount);
  if (r.prizeBasis != null) S.prizeBasis = Number(r.prizeBasis);
  if (r.prizeRate != null) S.prizeRate = Number(r.prizeRate);
  if (r.prizeAmount != null) S.prize = Number(r.prizeAmount);
  if (r.prizeUnit) S.unit = r.prizeUnit;
}
// 후원 이벤트에 실려 오는 값(목표 · 당첨 금액)
const roundOf = (e) => ({ goalAmount: e.goalAmount, minAmount: e.minAmount, prizeBasis: e.prizeBasis, prizeRate: e.prizeRate, prizeAmount: e.prizeAmount, prizeUnit: e.prizeUnit });

async function onProgress(e) {
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
  if (OPT.sound === "chime") {
    if (machineOn()) machine("ready");
    else (CHIMES[OPT.chime] || CHIMES.dingdong)();
  }
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
  await Promise.all([waitWheel(e), countdown()]);
  if (e.result === "WIN") await igniteSuccess(e);
  else await igniteFail(e);
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

// 성공: 로고가 한 바퀴 돌며 번쩍 → 빛줄기 · 불꽃 · 꽃가루 → 에너지 · 당첨 금액이 0이 되고 바로 다음 후원부터 다시 충전
async function igniteSuccess(e) {
  ov.classList.add("boom");
  render();
  if (OPT.fx.launch) FX.boom();
  await sleep(620);
  retrigger($id("lgFlash"), "on");
  const colors = ["#ff024a", "#00fff6", "#ffffff", "#ffd54a"];
  sparks(220, 220, colors, 90, 12);
  confetti(220, 250, colors, 140, 9);
  // 알림음이 룰렛 머신이면 성공 알림(잭팟)이 팡파르를 대신한다
  if (OPT.fx.launch && !(machineOn() && OPT.tpl.land && OPT.tpl.land.on)) FX.land();
  alertEvent("land", e);
  await sleep(4800);
  // 당첨 금액은 이 BJ가 받아 가서 에너지와 함께 0부터 다시 쌓인다
  applyRound(e.next || { totalAmount: 0, status: "FUELING", throwCount: 0, prizeBasis: 0, prizeAmount: 0 });
  S.total = 0;
  S.throwCount = 0;
  ov.classList.remove("boom");
  Logo.slosh = 1;
  render(true);
}

// 엑셀 회차 종료: 에너지 · 당첨 금액은 그대로 이어져서 화면은 바뀌지 않는다. 새 방송이면 0부터
async function onRoundEnded(e) {
  if (e.reason !== "NEW_SESSION") {
    if (e.next) applyRound(e.next);
    render();
    return;
  }
  applyRound(e.next || { totalAmount: 0, status: "FUELING", prizeBasis: 0, prizeAmount: 0 });
  S.total = Number((e.next && e.next.totalAmount) || 0);
  S.throwCount = 0;
  S.status = "FUELING";
  Logo.slosh = 1;
  render(true);
  await sleep(1200);
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
  if (!P) P = { total: S.total, goal: S.goal, min: S.min, status: S.status, throwCount: S.throwCount, prizeBasis: S.prizeBasis };
  return P;
}
const prizeFields = (p) => ({ prizeBasis: p.prizeBasis, prizeRate: S.prizeRate, prizeAmount: prizeOf(p.prizeBasis, S.prizeRate), prizeUnit: S.unit });
// 후원 하나: 당첨 금액 기준(지난 성공 뒤 후원)에 더하고 이벤트 공통 값을 만든다
function testBase(amount) {
  const p = projected();
  p.prizeBasis += amount;
  return Object.assign({
    amount,
    bjMemberId: "test-bj",
    bjNickname: "BJ A",
    sponsorNickname: TEST_DONORS[testDonor++ % TEST_DONORS.length],
    goalAmount: p.goal,
    minAmount: p.min,
    winRate: S.winRate,
  }, prizeFields(p));
}
// 성공 뒤(테스트): 에너지 · 당첨 금액 모두 0부터 바로 다시 충전
function testAfterWin(p) {
  return { status: "FUELING", totalAmount: 0, goalAmount: p.goal, minAmount: p.min, throwCount: 0, prizeBasis: 0, prizeRate: S.prizeRate, prizeAmount: 0, prizeUnit: S.unit };
}
function testFill(amount) {
  const p = projected();
  if (p.status === "ARMED") return;
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
    // 성공하면 당첨 금액(이 후원까지)을 받고, 바로 다음 후원부터 0부터 다시 충전
    e.next = testAfterWin(p);
    Object.assign(p, { total: 0, status: "FUELING", throwCount: 0, prizeBasis: 0 });
  }
  enqueue(e);
}
// 도전 금액 미만 후원(테스트): 룰렛은 돌지 않는다. 충전 중이면 에너지에, 충전 완료 뒤면 당첨 금액에만 더해진다
function testSmall() {
  const p = projected();
  const amount = Math.max(1, Math.floor(p.min / 10));
  if (p.status === "ARMED") enqueue(Object.assign(testBase(amount), { type: ROCKET_TYPE.PROGRESS, kind: "SKIP", totalAmount: p.total }));
  else testFill(amount);
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
  else if (kind === "small") testSmall();
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

let previewRound = null; // 탭이 보낸 지금 당첨 금액(테스트 초기화 때 되돌린다)
function startPreview() {
  isPreview = true;
  S.active = true;
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
      }
      if (!running && m.goalAmount && Number(m.goalAmount) !== S.goal) {
        const pct = S.goal ? Math.min(1, S.total / S.goal) : 0;
        S.goal = Number(m.goalAmount);
        S.total = Math.round(S.goal * pct);
        shownLeft = null; // 목표를 바꾸면 숫자는 바로 바꾼다
      }
      if (m.minAmount) S.min = Number(m.minAmount);
      // 당첨 금액은 처음과 서버 값이 바뀌었을 때만(테스트로 바뀐 금액 유지). 미리보기는 늘 충전 중으로 보여 준다
      const roundChanged = m.round && (!previewRound || previewRound.prizeBasis !== m.round.prizeBasis);
      if (m.round && !running && (!previewConfigured || roundChanged)) {
        previewRound = { prizeBasis: m.round.prizeBasis, prizeRate: m.round.prizeRate, prizeAmount: m.round.prizeAmount };
        applyRound(previewRound);
        shownPrize = null;
      } else if (!previewConfigured && !previewRound) {
        S.prize = prizeOf(S.prizeBasis, S.prizeRate);
      }
      if (typeof m.sound === "boolean") soundOn = m.sound;
      previewConfigured = true;
      P = null;
      render();
    } else if (m.type === "rocket:test") {
      runTest(String(m.kind || ""));
    } else if (m.type === "rocket:hear") {
      if (m.what === "chime" && OPT.chime === "machine") {
        machine("demo", true); // 레버 → 릴 → 멈춤 → 잭팟
      } else if (m.what === "chime-lose") {
        if (OPT.chime === "machine") machine("demo", false);
        else (CHIMES[OPT.chime] || CHIMES.dingdong)();
      } else if (m.what === "voice") {
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
