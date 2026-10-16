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
    chime: "dingdong",
    rate: 1,
    volume: 70,
    fx: { count: true, launch: true, fail: true },
    wheelOn: true,
    wheelWhere: "src",
    wheelTheme: "normal",
    wheelTime: 4,
    wheelHold: 3,
    wheelVoice: false,
    winName: "성공",
    loseName: "실패",
    wheelText: "{닉네임}님 도전! 결과는?",
    wheelSound: "on",
  };
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
  const sliceCount = () => Math.max(4, Math.min(24, Math.round(100 / winRate())));

  // ─────────────── 룰렛 모양 · 미리 돌려보기 (pages/event_roulette.js) ───────────────
  let tryRoulette = null;
  let tryKey = "";
  let trying = false;
  function renderThemePics() {
    if (typeof EventRoulette === "undefined") return;
    tab().find(".ev-theme-pic").each(function () {
      const theme = this.getAttribute("data-theme");
      const r = EventRoulette.create(this, { theme, slices: 8, winName: opt.winName, loseName: opt.loseName });
      if (r.kind === "banner") r.idle(opt.winName);
    });
  }
  function renderTry(force) {
    if (typeof EventRoulette === "undefined" || trying) return;
    const key = [opt.wheelTheme, sliceCount(), opt.winName, opt.loseName].join("|");
    if (!force && key === tryKey) return;
    tryKey = key;
    const stage = document.getElementById("rocketWheelTry");
    stage.className = "ev-try-stage is-" + EventRoulette.kindOf(opt.wheelTheme);
    tryRoulette = EventRoulette.create(stage, { theme: opt.wheelTheme, slices: sliceCount(), winName: opt.winName, loseName: opt.loseName });
    if (tryRoulette.kind === "banner") tryRoulette.idle(opt.winName);
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
    tryRoulette.spin(win, opt.wheelTime, sound ? tryTick : null).then(function () {
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

  // 회차 끝내기: 진행 중인 회차는 당첨 없이 끝나 다음 회차에 누적, 성공한 회차는 닫고 다음 회차를 연다
  function endRound() {
    const ev = state && state.event;
    const round = state && state.round;
    if (!ev || !round) return;
    const unit = ev.prizeUnit || "";
    let message;
    if (round.status === "WAIT") {
      message = `${round.roundNo - 1}회차는 성공했어요. 엑셀이 끝나면 자동으로 다음 회차가 시작되는데, 지금 바로 ${round.roundNo}회차를 시작할까요?`;
    } else if (ev.carryOver && round.roundNo < (round.maxRounds || 10)) {
      message = `당첨 없이 ${round.roundNo}회차를 끝낼까요? 당첨 금액 ${fmt(round.prizeAmount)}${unit}은 ${round.roundNo + 1}회차에 쌓여요.`;
    } else {
      message = `당첨 없이 ${round.roundNo}회차를 끝낼까요? 이번 방송의 마지막 회차라 당첨 금액이 넘어가지 않아요.`;
    }
    Message.confirm({ title: "회차 끝내기", message }, function () {
      return postRound("/api/excel/rocket/endround");
    });
  }

  // 새 방송으로 시작: 다음 후원부터 1회차(쌓인 누적 금액은 넘어가지 않는다)
  function newSession() {
    const ev = state && state.event;
    const round = state && state.round;
    const carry = round && round.status !== "DONE" ? Number(round.carryAmount) || 0 : 0;
    const open = round && !round.pending;
    let message = "새 방송으로 시작할까요? 다음 후원부터 1회차예요.";
    if (open) message += ` 진행 중인 ${round.roundNo}회차는 당첨 없이 끝나요.`;
    if (carry > 0) message += ` 쌓인 누적 금액 ${fmt(carry)}${(ev && ev.prizeUnit) || ""}은 새 방송으로 넘어가지 않아요.`;
    Message.confirm({ title: "새 방송으로 시작", message }, function () {
      return postRound("/api/excel/rocket/newsession");
    });
  }

  // 이번 방송 회차 칸(1 ~ 최대 회차)
  function renderRounds() {
    const ev = state && state.event;
    const session = (state && state.session) || {};
    const round = state && state.round;
    const max = (ev && ev.maxRounds) || session.maxRounds || 10;
    const unit = (ev && ev.prizeUnit) || "";
    const list = session.rounds || [];
    const cells = [];
    for (let i = 1; i <= max; i += 1) {
      const r = list.find((x) => Number(x.roundNo) === i);
      let cls = "";
      let label = "";
      let title = `${i}회차`;
      if (r) {
        title += ` · 당첨 금액 ${fmt(r.prizeAmount)}${unit}`;
        if (r.status === "WON") {
          cls = "is-won";
          label = r.winBjNickname || "성공";
          title += ` · 성공${r.winBjNickname ? ` (${r.winBjNickname})` : ""}`;
        } else if (r.status === "ENDED") {
          const carried = ev && ev.carryOver && r.endReason !== "NEW_SESSION" && i < max;
          cls = carried ? "is-carry" : "is-lost";
          label = carried ? "누적" : "종료";
          title += carried ? " · 다음 회차에 누적" : " · 종료";
        } else {
          cls = "is-now";
          label = r.status === "ARMED" ? "충전 완료" : "진행 중";
        }
      } else if (round && round.pending && Number(round.roundNo) === i && round.status !== "DONE") {
        cls = "is-now";
        label = round.status === "WAIT" ? "대기" : "다음";
        title += ` · 당첨 금액 ${fmt(round.prizeAmount)}${unit}`;
      }
      cells.push(`<li class="${cls}" title="${$("<i>").text(title).html().replace(/"/g, "&quot;")}"><b>${i}</b><span>${$("<i>").text(label).html() || "&nbsp;"}</span></li>`);
    }
    $("#rocketRounds").html(cells.join(""));
    $("#rocketMaxRounds").text(max);
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
      $("#rocketSlices").text("-");
      $("#rocketRounds").empty();
      $("#btnRocketEndRound, #btnRocketNewSession").prop("disabled", true);
      showNotice("참여 방송은 FLEXTV가 정해요. 설정은 미리 저장해 둘 수 있어요.");
      return;
    }

    chip.text(ev.status === "ACTIVE" ? "진행 중" : ev.status === "UPCOMING" ? "시작 전" : "종료").addClass(ev.status === "ACTIVE" ? "is-on" : "is-wait");
    $("#rocketEventTitle").text(ev.title || "FLEXTV 이벤트");
    $("#rocketEventPeriod").text(`${kstText(ev.startDate)} ~ ${kstText(ev.endDate)}`);
    $("#rocketWinRate").text(`${ev.winRate}%`);
    $("#rocketPrize").text(`${fmt(ev.prizeAmount)}${ev.prizeUnit || ""}`);

    const n = Math.max(4, Math.min(24, Math.round(100 / (Number(ev.winRate) || 5))));
    $("#rocketSlices").text(`성공 1칸 · 실패 ${n - 1}칸 (성공 확률 ${ev.winRate}%)`);

    if (round) {
      const goal = round.goalAmount || settings.goalAmount;
      const max = round.maxRounds || ev.maxRounds || 10;
      const unit = round.prizeUnit || ev.prizeUnit || "";
      const done = round.status === "DONE";
      const carry = Number(round.carryAmount) || 0;
      $("#rocketRoundNo").text(done ? `${max}회차 끝` : `${round.roundNo} / ${max}회차`);
      $("#rocketRoundPrize").text(done ? "-" : `${fmt(round.prizeAmount)}${unit}`);
      $("#rocketCarry").text(done ? "" : carry > 0 ? `기본 ${fmt(round.basePrize)} + 누적 ${fmt(carry)}` : "누적 없음");
      $("#rocketFuel").text(goal && !done ? `${fmt(round.totalAmount)} / ${fmt(goal)}렉스` : "-");
      $("#rocketRoundState").text(
        done ? "이번 방송 회차 끝" : round.status === "WAIT" ? "성공 · 엑셀이 끝나면 다음 회차" : round.pending ? "다음 후원부터 시작" : round.status === "ARMED" ? "충전 완료" : "에너지 충전 중"
      );
      $("#rocketThrows").text(round.status === "ARMED" ? `이번 회차 도전 ${round.throwCount}회` : "");
    }
    renderRounds();
    const session = (state && state.session) || {};
    const active = ev.status === "ACTIVE";
    $("#btnRocketEndRound").prop("disabled", !(active && round && (!round.pending || round.status === "WAIT")));
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
    $(`input[name=rocketWheelWhere][value=${opt.wheelWhere}]`).prop("checked", true);
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
    opt.wheelWhere = $("input[name=rocketWheelWhere]:checked").val() || DEFAULT_OPTIONS.wheelWhere;
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
    $("#rocketWheelTextRow").toggle(opt.wheelWhere === "src");
    $("#rocketWheelWhereHelp").text(
      opt.wheelWhere === "src"
        ? "지금 쓰는 후원 알림 위젯 아래쪽(기존 룰렛 자리)에 룰렛 문구와 함께 떠요. OBS에 후원 알림 위젯이 있어야 해요."
        : "FLEXTV 이벤트 위젯 안에 떠요(배너형은 로고 아래 띠, 원판형은 왼쪽 아래). OBS 소스는 이 위젯 하나면 돼요."
    );
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
        event: ev ? { winRate: ev.winRate, prizeAmount: ev.prizeAmount, prizeUnit: ev.prizeUnit, maxRounds: ev.maxRounds } : null,
        round: state && state.round && state.round.status !== "DONE" ? state.round : null,
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
      if (url) openWin(url, "플렉스", 440, 660);
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
