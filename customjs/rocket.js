// 엑셀방송 'FLEXTV 이벤트' 탭 (내부 이름은 rocket: #tab-rocket · /api/excel/rocket · 프리셋 TYPE rocket)
// - 설정(에너지 목표 · 도전 금액 · 소리 · 룰렛)은 서버에 저장한다: /api/excel/rocket/{state,save,endround}
// - 성공 확률 · 당첨 금액 · 기간은 FLEXTV가 정한 값이라 읽기만 한다
// - 미리보기는 OBS 위젯 화면(../pages/rocket/preview)을 띄우고 postMessage 로 설정 · 테스트를 보낸다
// - 방송 화면(위젯)에는 FLEXTV 로고 · 목표 · 남은 양만 나온다. 알림 문구는 알림 음성일 때 읽기만 한다.
// excel.js 의 설정 저장 · 설정 초기화 버튼이 이 탭에서 눌리면 RocketTab.save() · RocketTab.reset() 을 부른다.
const RocketTab = (function () {
  const DEFAULT_OPTIONS = {
    tpl: {
      charge: { on: true, text: "{닉네임}님 → {BJ} {렉스}렉스 에너지 충전!" },
      throw: { on: true, text: "{닉네임}님 도전!" },
      fail: { on: true, text: "실패! 다시 도전해요" },
      land: { on: true, text: "{BJ} 성공! 당첨 금액 {당첨금액}" },
    },
    sound: "chime",
    chime: "machine",
    rate: 1,
    volume: 70,
    fx: { count: true, launch: true, fail: true },
    wheelOn: true,
    wheelWhere: "widget", // 늘 이벤트 위젯 아래 룰렛 칸(목표 UI와 따로 있는 요소, URL 하나)
    wheelTheme: "normal",
    wheelTime: 4,
    wheelHold: 3,
    wheelVoice: false,
    winName: "성공",
    loseName: "실패",
    wheelText: "{닉네임}님 → {BJ}", // {닉네임} · {BJ} 는 이름표로 보인다(pages/event_nametag.js, 닉네임 최대 10글자)
    wheelSound: "on",
  };
  // 예전 기본 문구(이름표 전 · '도전! 결과는?' 이 붙어 있던 때)는 새 기본 문구로 바꿔 보여 준다
  const OLD_WHEEL_TEXTS = ["{닉네임}님 도전! 결과는?", "{닉네임}님 → {BJ} 도전! 결과는?"];
  // 미리보기에서 값을 비워 둘 때만 쓰는 보기용 숫자(저장되지 않음)
  const PREVIEW_GOAL = 100000;
  const PREVIEW_MIN = 1000;
  const MAX_AMOUNT = 100000000;

  const tab = () => $("#tab-rocket");
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const fmt = (n) => numberWithCommas(Math.round(Number(n) || 0));

  let inited = false;
  let state = null; // 서버 상태 { event, settings, round }
  let opt = clone(DEFAULT_OPTIONS);
  let slider = null;
  let previewBusy = false;

  function mergeOptions(o) {
    const m = Object.assign(clone(DEFAULT_OPTIONS), o || {});
    m.tpl = Object.assign(clone(DEFAULT_OPTIONS.tpl), (o && o.tpl) || {});
    m.fx = Object.assign(clone(DEFAULT_OPTIONS.fx), (o && o.fx) || {});
    if (!m.wheelText || OLD_WHEEL_TEXTS.indexOf(m.wheelText) >= 0) m.wheelText = DEFAULT_OPTIONS.wheelText;
    return m;
  }

  // 1 ~ 1억 정수(쉼표 허용), 아니면 null
  function parseAmount(v) {
    const digits = String(v || "").replace(/[,\s]/g, "");
    if (!/^\d+$/.test(digits)) return null;
    const n = Number(digits);
    return n >= 1 && n <= MAX_AMOUNT ? n : null;
  }

  // 초 입력: 숫자만, 범위 밖이면 끝값, 비었거나 숫자가 아니면 기본값
  function parseSeconds(v, min, max, fallback) {
    const n = parseInt(String(v || "").replace(/[^\d]/g, ""), 10);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
  }

  // 성공 확률(FLEXTV). 이벤트가 없으면 보기용 5%
  const winRate = () => Number(state && state.event && state.event.winRate) || 5;

  // ─────────────── 룰렛 모양 · 미리 돌려보기 (pages/event_roulette.js) ───────────────
  // 미리 돌려보기는 위젯 아래 룰렛 칸과 같은 모양: 위 문구(룰렛 문구 + 예시 이름표 '도도쭈' → 'BJ A') + 룰렛
  const TRY_WHO = { donor: "도도쭈", bj: "BJ A", amount: "5,000" };
  let tryRoulette = null;
  let tryKey = "";
  let trying = false;
  function renderCaption(el, text, who, prize) {
    if (!el) return;
    if (typeof EventNameTags === "undefined") {
      el.textContent = String(text || "");
      return;
    }
    EventNameTags.caption(el, text, Object.assign({ prize: prize || "" }, who));
    EventNameTags.result(el, null);
  }
  function renderThemePics() {
    if (typeof EventRoulette === "undefined") return;
    tab().find(".ev-theme-pic").each(function () {
      const theme = this.getAttribute("data-theme");
      EventRoulette.create(this, { theme, winName: opt.winName, loseName: opt.loseName }).idle(opt.winName);
    });
  }
  function renderTry(force) {
    if (typeof EventRoulette === "undefined" || trying) return;
    const key = [opt.wheelTheme, opt.winName, opt.loseName, opt.wheelText].join("|");
    if (!force && key === tryKey) return;
    tryKey = key;
    renderCaption(document.getElementById("rocketWheelCaption"), opt.wheelText, TRY_WHO);
    tryRoulette = EventRoulette.create(document.getElementById("rocketWheelTry"), { theme: opt.wheelTheme, winName: opt.winName, loseName: opt.loseName });
    tryRoulette.idle(opt.winName);
  }
  function tryTick() {
    try {
      const a = (tryTick.ctx = tryTick.ctx || new (window.AudioContext || window.webkitAudioContext)());
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = "square";
      o.frequency.value = 1700;
      g.gain.setValueAtTime(0.03, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.03);
      o.connect(g).connect(a.destination);
      o.start();
      o.stop(a.currentTime + 0.04);
    } catch (e) {}
  }
  function tryWheel(win) {
    if (trying) return;
    renderTry(true);
    trying = true;
    tab().find("[data-rocket-try]").prop("disabled", true);
    const sound = opt.wheelSound === "on" && $("#rocketPreviewSound").prop("checked");
    // 룰렛 머신 소리: 레버 → 모터 · 칸마다 카지노 음 → 멈춤 → 성공(잭팟) · 실패(와-와)
    const rs = sound && typeof EventRoulette !== "undefined" && EventRoulette.sound;
    if (rs) {
      rs.setVolume((Number(opt.volume) || 0) / 100);
      rs.lever();
      rs.reel(opt.wheelTime);
    }
    tryRoulette.spin(win, opt.wheelTime, rs ? rs.tick : sound ? tryTick : null).then(function () {
      if (typeof EventNameTags !== "undefined") EventNameTags.result(document.getElementById("rocketWheelCaption"), win);
      if (rs) {
        rs.stop();
        setTimeout(win ? rs.jackpot : rs.fail, 250);
      }
      setTimeout(function () {
        trying = false;
        tab().find("[data-rocket-try]").prop("disabled", false);
      }, opt.wheelHold * 1000);
    });
  }
  // 서버와 같은 방식(1 ~ 10000 중 성공 확률 × 100 이하이면 성공)으로 1,000번 뽑아 본다
  function simulate() {
    const rate = winRate();
    let win = 0;
    for (let i = 0; i < 1000; i++) if (1 + Math.floor(Math.random() * 10000) <= Math.round(rate * 100)) win++;
    $("#rocketWheelSimResult").text(`1,000회 중 ${opt.winName} ${fmt(win)}회 · ${opt.loseName} ${fmt(1000 - win)}회 (성공 확률 ${rate}%)`);
  }

  function kstText(iso) {
    try {
      return new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return iso;
    }
  }

  // ─────────────── 서버 ───────────────
  function load() {
    axios
      .get(g_url + "/api/excel/rocket/state")
      .then(function (response) {
        const json = response.data;
        if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
          showNotice(json.message || "FLEXTV 이벤트 정보를 불러오지 못했어요.");
          return;
        }
        state = json.resultMap.data;
        opt = mergeOptions(state.settings && state.settings.options);
        fillForm();
        renderStatus();
        sendPreview();
      })
      .catch(function (error) {
        console.log(error);
        showNotice("FLEXTV 이벤트 정보를 불러오지 못했어요. 잠시 뒤 새로고침해 주세요.");
      });
  }

  function save() {
    readForm();
    const goal = parseAmount($("#rocketGoal").val());
    const min = parseAmount($("#rocketMin").val());
    if (goal === null) {
      Message.show("에너지 목표를 1렉스 이상 숫자로 넣어 주세요.", { type: "warn", title: "안내" });
      $("#rocketGoal").focus();
      return;
    }
    if (min === null) {
      Message.show("도전 금액을 1렉스 이상 숫자로 넣어 주세요.", { type: "warn", title: "안내" });
      $("#rocketMin").focus();
      return;
    }
    $(".spinner-border").css("display", "block");
    axios
      .post(g_url + "/api/excel/rocket/save", { goalAmount: goal, minAmount: min, options: opt })
      .then(function (response) {
        const json = response.data;
        $(".spinner-border").css("display", "none");
        if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
          alert(json.message);
          return;
        }
        state = json.resultMap.data;
        opt = mergeOptions(state.settings && state.settings.options);
        fillForm();
        renderStatus();
        sendPreview();
        myModal.show();
      })
      .catch(function (error) {
        $(".spinner-border").css("display", "none");
        console.log(error);
        alert("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.");
      });
  }

  // 소리 · 룰렛 설정을 기본값으로 되돌리고 저장(에너지 목표 · 도전 금액은 그대로)
  function reset() {
    opt = clone(DEFAULT_OPTIONS);
    fillForm(true);
    sendPreview();
    save();
  }

  function postRound(path) {
    return axios.post(g_url + path, {}).then(function (response) {
      const json = response.data;
      if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
        alert(json.message);
        return;
      }
      state = json.resultMap.data;
      renderStatus();
      sendPreview();
    });
  }

  // 엑셀 회차 끝내기(기록): 에너지 · 당첨 금액은 그대로 다음 회차로 이어진다
  function endRound() {
    const ev = state && state.event;
    const round = state && state.round;
    if (!ev || !round) return;
    const unit = round.prizeUnit || ev.prizeUnit || "";
    const message = `${round.roundNo}회차를 끝낼까요? 다음 후원부터 ${round.roundNo + 1}회차예요. 에너지 ${fmt(round.totalAmount)}렉스와 당첨 금액 ${fmt(round.prizeAmount)}${unit}은 그대로 이어져요.`;
    Message.confirm({ title: "회차 끝내기", message }, function () {
      return postRound("/api/excel/rocket/endround");
    });
  }

  // 새 방송으로 시작: 다음 후원부터 1회차, 에너지 · 당첨 금액은 0부터 다시 쌓인다
  function newSession() {
    const ev = state && state.event;
    const round = state && state.round;
    const unit = (ev && ev.prizeUnit) || "";
    const open = round && !round.pending;
    let message = "새 방송으로 시작할까요? 다음 후원부터 1회차예요.";
    if (open) message += ` 진행 중인 ${round.roundNo}회차는 끝나요.`;
    if (round && (Number(round.totalAmount) > 0 || Number(round.prizeAmount) > 0)) message += ` 쌓인 에너지 ${fmt(round.totalAmount)}렉스와 당첨 금액 ${fmt(round.prizeAmount)}${unit}은 0부터 다시 쌓여요.`;
    Message.confirm({ title: "새 방송으로 시작", message }, function () {
      return postRound("/api/excel/rocket/newsession");
    });
  }

  // 이번 방송 엑셀 회차 기록(1 ~ 보통 회차 수, 넘으면 그만큼 더): 회차마다 성공 수 · 당첨 내역
  function renderRounds() {
    const ev = state && state.event;
    const session = (state && state.session) || {};
    const round = state && state.round;
    const list = session.rounds || [];
    const last = list.reduce((m, x) => Math.max(m, Number(x.roundNo) || 0), round && round.pending ? Number(round.roundNo) || 0 : 0);
    const max = Math.max((ev && ev.maxRounds) || session.maxRounds || 10, last);
    const cells = [];
    for (let i = 1; i <= max; i += 1) {
      const r = list.find((x) => Number(x.roundNo) === i);
      let cls = "";
      let label = "";
      let title = `${i}회차`;
      if (r) {
        const wins = Number(r.winCount) || 0;
        const who = (r.wins || []).map((w) => `${w.bjNickname || "BJ"} ${fmt(w.prizeAmount)}${w.prizeUnit || ""}`).join(", ");
        if (wins > 0) {
          cls = r.status === "OPEN" ? "is-won is-now" : "is-won";
          label = wins > 1 ? `성공 ${wins}번` : (r.wins && r.wins[0] && r.wins[0].bjNickname) || "성공";
          title += ` · 성공 ${wins}번${who ? ` (${who})` : ""}`;
        } else if (r.status === "ENDED") {
          cls = "is-lost";
          label = "당첨 없음";
          title += " · 당첨 없이 종료(에너지 · 당첨 금액은 다음 회차로 이어짐)";
        } else {
          cls = "is-now";
          label = "진행 중";
        }
        title += ` · 후원 ${fmt(r.totalAmount)}렉스 · 도전 ${Number(r.throwCount) || 0}회`;
      } else if (round && round.pending && Number(round.roundNo) === i) {
        cls = "is-now";
        label = "다음";
      }
      cells.push(`<li class="${cls}" title="${$("<i>").text(title).html().replace(/"/g, "&quot;")}"><b>${i}</b><span>${$("<i>").text(label).html() || "&nbsp;"}</span></li>`);
    }
    $("#rocketRounds").html(cells.join(""));
  }

  // ─────────────── 화면 ───────────────
  function showNotice(text) {
    const el = $("#rocketNotice");
    if (text) el.text(text).show();
    else el.text("").hide();
  }

  function renderStatus() {
    const ev = state && state.event;
    const settings = (state && state.settings) || {};
    const round = state && state.round;
    const chip = $("#rocketEventChip").removeClass("is-on is-wait");

    if (!ev) {
      chip.text("참여 대상 아님");
      $("#rocketEventTitle").text("이 방송은 FLEXTV 이벤트 참여 대상이 아니에요.");
      $("#rocketEventPeriod").text("");
      $("#rocketWinRate, #rocketPrize, #rocketRoundNo, #rocketRoundPrize, #rocketFuel, #rocketRoundState").text("-");
      $("#rocketCarry, #rocketThrows").text("");
      $("#rocketRounds").empty();
      $("#btnRocketEndRound, #btnRocketNewSession").prop("disabled", true);
      showNotice("참여 방송은 FLEXTV가 정해요. 설정은 미리 저장해 둘 수 있어요.");
      return;
    }

    chip.text(ev.status === "ACTIVE" ? "진행 중" : ev.status === "UPCOMING" ? "시작 전" : "종료").addClass(ev.status === "ACTIVE" ? "is-on" : "is-wait");
    $("#rocketEventTitle").text(ev.title || "FLEXTV 이벤트");
    $("#rocketEventPeriod").text(`${kstText(ev.startDate)} ~ ${kstText(ev.endDate)}`);
    $("#rocketWinRate").text(`${ev.winRate}%`);
    $("#rocketPrize").text(`지난 성공 뒤 후원의 ${ev.prizeRate}%`);
    $("#rocketPrizeRateText").text(ev.prizeRate);

    if (round) {
      const goal = round.goalAmount || settings.goalAmount;
      const unit = round.prizeUnit || ev.prizeUnit || "";
      const wins = Number(round.winCount) || 0;
      $("#rocketRoundNo").text(round.pending ? `다음 후원부터 ${round.roundNo}회차` : `${round.roundNo}회차 진행 중`);
      $("#rocketRoundPrize").text(`${fmt(round.prizeAmount)}${unit}`);
      $("#rocketCarry").text(`지난 성공 뒤 후원 ${fmt(round.prizeBasis)}${unit} × ${round.prizeRate}%`);
      $("#rocketFuel").text(goal ? `${fmt(round.totalAmount)} / ${fmt(goal)}렉스` : "-");
      $("#rocketRoundState").text(round.status === "ARMED" ? "충전 완료" : "에너지 충전 중");
      $("#rocketThrows").text(round.pending ? "" : `이번 회차 도전 ${Number(round.throwCount) || 0}회${wins ? ` · 성공 ${wins}번` : ""}`);
    }
    renderRounds();
    const session = (state && state.session) || {};
    const active = ev.status === "ACTIVE";
    $("#btnRocketEndRound").prop("disabled", !(active && round && !round.pending));
    $("#btnRocketNewSession").prop("disabled", !(active && settings.saved && session.no && ((session.rounds || []).length > 0 || (round && !round.pending))));

    if (!settings.saved) showNotice("에너지 목표와 도전 금액을 저장해야 이 방송에서 이벤트가 시작돼요.");
    else if (ev.status !== "ACTIVE") showNotice("이벤트 기간에만 후원이 반영돼요.");
    else showNotice("");
  }

  function fillForm(keepAmounts) {
    const settings = (state && state.settings) || {};
    if (!keepAmounts) {
      $("#rocketGoal").val(settings.goalAmount ? fmt(settings.goalAmount) : "");
      $("#rocketMin").val(settings.minAmount ? fmt(settings.minAmount) : "");
    }
    Object.keys(opt.tpl).forEach(function (k) {
      $(`[data-rocket-tpl-on=${k}]`).prop("checked", !!opt.tpl[k].on);
      $(`[data-rocket-tpl=${k}]`).val(opt.tpl[k].text).prop("disabled", !opt.tpl[k].on);
    });
    $(`input[name=rocketSound][value=${opt.sound}]`).prop("checked", true);
    $("#rocketChime").val(opt.chime);
    $("#rocketRate").val(String(opt.rate));
    Object.keys(opt.fx).forEach(function (k) {
      $(`[data-rocket-fx=${k}]`).prop("checked", !!opt.fx[k]);
    });
    if (slider) slider.noUiSlider.set(opt.volume);
    $("#rocketVolumeVal").val(opt.volume);
    $("#rocketWheelOn").prop("checked", !!opt.wheelOn);
    $(`input[name=rocketWheelTheme][value=${opt.wheelTheme}]`).prop("checked", true);
    $("#rocketWheelTime").val(opt.wheelTime);
    $("#rocketWheelHold").val(opt.wheelHold);
    $("#rocketWheelVoice").prop("checked", !!opt.wheelVoice);
    $("#rocketWinName").val(opt.winName);
    $("#rocketLoseName").val(opt.loseName);
    $("#rocketWheelText").val(opt.wheelText);
    $(`input[name=rocketWheelSound][value=${opt.wheelSound}]`).prop("checked", true);
    applyVisibility();
  }

  function readForm() {
    Object.keys(opt.tpl).forEach(function (k) {
      opt.tpl[k].on = $(`[data-rocket-tpl-on=${k}]`).prop("checked");
      opt.tpl[k].text = String($(`[data-rocket-tpl=${k}]`).val() || "").slice(0, 60);
    });
    opt.sound = $("input[name=rocketSound]:checked").val() || DEFAULT_OPTIONS.sound;
    opt.chime = $("#rocketChime").val();
    opt.rate = Number($("#rocketRate").val()) || 1;
    Object.keys(opt.fx).forEach(function (k) {
      opt.fx[k] = $(`[data-rocket-fx=${k}]`).prop("checked");
    });
    opt.volume = Number($("#rocketVolumeVal").val()) || 0;
    opt.wheelOn = $("#rocketWheelOn").prop("checked");
    opt.wheelWhere = DEFAULT_OPTIONS.wheelWhere;
    opt.wheelTheme = $("input[name=rocketWheelTheme]:checked").val() || DEFAULT_OPTIONS.wheelTheme;
    opt.wheelTime = parseSeconds($("#rocketWheelTime").val(), 2, 10, DEFAULT_OPTIONS.wheelTime);
    opt.wheelHold = parseSeconds($("#rocketWheelHold").val(), 1, 10, DEFAULT_OPTIONS.wheelHold);
    opt.wheelVoice = $("#rocketWheelVoice").prop("checked");
    opt.winName = String($("#rocketWinName").val() || "").trim().slice(0, 6) || DEFAULT_OPTIONS.winName;
    opt.loseName = String($("#rocketLoseName").val() || "").trim().slice(0, 6) || DEFAULT_OPTIONS.loseName;
    opt.wheelText = String($("#rocketWheelText").val() || "").slice(0, 40);
    opt.wheelSound = $("input[name=rocketWheelSound]:checked").val() || DEFAULT_OPTIONS.wheelSound;
  }

  function applyVisibility() {
    const voice = opt.sound === "voice";
    $("#rocketAlertBody").toggleClass("is-off", opt.sound === "none");
    tab().find(".rocket-tpl-row").toggleClass("no-text", !voice);
    $("#rocketAlertsTitle").text(voice ? "알림 문구(읽어 줄 말)" : "알림 받을 때");
    $("#rocketAlertsHelp").text(
      voice ? "쓸 수 있는 말: {닉네임} {BJ} {렉스} {당첨금액}" : "체크한 때에 알림음이 울려요. 알림 음성을 고르면 문구를 정해 읽어 줄 수 있어요."
    );
    $("#rocketChimeRow").toggle(opt.sound === "chime");
    $("#rocketVoiceRow").toggle(voice);
    $("#rocketWheelBody").toggleClass("is-off", !opt.wheelOn);
    $("#rocketWheelHelp").text(opt.wheelOn ? "" : "룰렛을 쓰지 않으면 카운트다운이 끝날 때 위젯이 바로 결과를 보여 줘요.");
    tab().find(".ev-theme").each(function () {
      $(this).toggleClass("is-on", $(this).find("input").prop("checked"));
    });
    const names = opt.winName + "|" + opt.loseName;
    if (names !== applyVisibility.names) {
      applyVisibility.names = names;
      renderThemePics();
    }
    renderTry();
    const min = parseAmount($("#rocketMin").val());
    $("#rocketStepMin").text(min ? `${fmt(min)}렉스` : "도전 금액");
  }

  // ─────────────── 미리보기 ───────────────
  function frame() {
    const el = document.getElementById("rocketPreviewFrame");
    return el && el.contentWindow;
  }

  function sendPreview() {
    const w = frame();
    if (!w) return;
    const ev = state && state.event;
    w.postMessage(
      {
        type: "rocket:config",
        options: opt,
        goalAmount: parseAmount($("#rocketGoal").val()) || PREVIEW_GOAL,
        minAmount: parseAmount($("#rocketMin").val()) || PREVIEW_MIN,
        event: ev ? { winRate: ev.winRate, prizeRate: ev.prizeRate, prizeUnit: ev.prizeUnit } : null,
        round: (state && state.round) || null,
        sound: $("#rocketPreviewSound").prop("checked"),
      },
      window.location.origin
    );
  }

  function onChange() {
    readForm();
    applyVisibility();
    sendPreview();
  }

  function setTestDisabled(busy) {
    previewBusy = busy;
    tab().find("[data-rocket-test]").each(function () {
      $(this).prop("disabled", busy && $(this).data("rocket-test") !== "reset");
    });
  }

  function bind() {
    const t = tab();
    t.on("input change", "input, select", function (e) {
      if (e.target.id === "rocketPreviewSound") return sendPreview();
      if (e.target.matches("[data-rocket-tpl-on]")) {
        $(`[data-rocket-tpl=${e.target.getAttribute("data-rocket-tpl-on")}]`).prop("disabled", !e.target.checked);
      }
      onChange();
    });
    t.on("blur", ".rocket-amount", function () {
      const n = parseAmount(this.value);
      if (n) this.value = fmt(n);
    });
    t.on("blur", ".rocket-num", function () {
      this.value = this.id === "rocketWheelHold" ? opt.wheelHold : opt.wheelTime;
    });
    t.on("click", "[data-rocket-try]", function () {
      tryWheel($(this).data("rocket-try") === "win");
    });
    $("#rocketWheelSim").on("click", simulate);

    slider = document.getElementById("rocketVolumeSlider");
    if (slider && typeof noUiSlider !== "undefined" && !slider.noUiSlider) {
      noUiSlider.create(slider, { start: opt.volume, step: 5, connect: [true, false], range: { min: 0, max: 100 } });
      slider.noUiSlider.on("update", function (values) {
        const v = Math.round(Number(values[0]));
        $("#rocketVolumeVal").val(v);
        if (inited && opt.volume !== v) onChange();
      });
    }

    t.on("click", "[data-rocket-test]", function () {
      const kind = $(this).data("rocket-test");
      if (previewBusy && kind !== "reset") return;
      const w = frame();
      if (w) w.postMessage({ type: "rocket:test", kind }, window.location.origin);
    });
    t.on("click", "[data-rocket-hear]", function () {
      const w = frame();
      if (w) w.postMessage({ type: "rocket:hear", what: $(this).data("rocket-hear") }, window.location.origin);
    });
    t.on("click", "[data-rocket-obs]", function () {
      testmessage_to_server(CURRENT_PRESET_ROCKET_TYPE, "rocket", $(this).data("rocket-obs"));
    });
    $("#tab-rocket #btn_win_reset").on("click", function () {
      testmessage_to_server(CURRENT_PRESET_ROCKET_TYPE, "2", "");
    });
    $("#tab-rocket #btn_win_reload").on("click", function () {
      testmessage_to_server(CURRENT_PRESET_ROCKET_TYPE, "1", "");
    });
    $("#tab-rocket #btn_open_pop").on("click", function () {
      const url = $("#urlCopyRocket").val();
      if (url) openWin(url, "플렉스", 440, 800);
    });
    $("#btnRocketEndRound").on("click", endRound);
    $("#btnRocketNewSession").on("click", newSession);

    window.addEventListener("message", function (ev) {
      if (ev.origin !== window.location.origin) return;
      const m = ev.data || {};
      if (m.type === "rocket:ready") sendPreview();
      else if (m.type === "rocket:busy") setTestDisabled(!!m.busy);
    });
  }

  function init() {
    if (inited) return;
    bind();
    fillForm(true);
    load();
    inited = true;
  }

  return { init, save, reset, reload: load };
})();
