// 정적 미리보기(GitHub Pages)용 가짜 API. dev/server.mjs 의 가짜 API 와 같은 응답을 브라우저 안에서 돌려준다.
// view/excel.html 의 axios 스크립트 바로 뒤에 넣는다(build-static.mjs). 운영 서버로는 요청하지 않는다.
(function () {
  // 사이트 뿌리 주소: 이 파일은 {뿌리}/demo/mock.js
  var here = document.currentScript && document.currentScript.src;
  var root = here ? new URL("../", here).href : new URL("../", location.href).href;

  window.g_url = "mock:";
  window.g_url_socket = "";
  window.g_url_tts_base_url = "";
  window.g_url_tts = "";
  window.g_url_current = "";
  window.g_url_roulette_sound = root + "sounds/roulette.mp3";

  // ─────────────── 가짜 데이터 ───────────────
  var member = { LOGINFLAG: "Y", NAME: "테스트 BJ", MID: "testbj", MEMBER_UID: 1, IMG_URL: "" };
  var event = { id: 1, title: "FLEXTV 이벤트", winRate: 5, prizeRate: 7, prizeUnit: "렉스", maxRounds: 10, startDate: "2026-11-01T00:00:00Z", endDate: "2026-12-31T15:00:00Z", status: "ACTIVE" };
  // 당첨 금액 = 당첨 금액 기준(지난 성공 뒤 지정 BJ 후원) × 7%(서버 RocketService::prizeOf 와 같은 계산)
  function prizeOf(basis, rate) { return Math.floor((Math.max(0, basis) * Math.round(rate * 100)) / 10000); }
  // 엑셀 회차 기록(위젯에는 나오지 않음)
  function hist(roundNo, extra) {
    return Object.assign({ roundNo: roundNo, status: "ENDED", endReason: "EXCEL_END", totalAmount: 0, throwCount: 0, winCount: 0, wins: [], closed: true }, extra || {});
  }
  // 1 · 2회차는 당첨 없이 끝나 에너지 · 당첨 금액이 3회차로 이어짐. 지난 성공 뒤 후원 1,500,000렉스 → 당첨 금액 105,000렉스
  var rocket = {
    saved: true, goalAmount: 100000, minAmount: 1000, options: null,
    energy: 86500, // 목표까지 쌓인 에너지(엑셀 회차가 바뀌어도 이어지고 성공하면 0)
    pool: 1500000, // 당첨 금액 기준(지난 성공 뒤 후원, 성공하면 0)
    session: { no: 1, total: 1500000, rounds: [hist(1, { totalAmount: 600000, throwCount: 0 }), hist(2, { totalAmount: 700000, throwCount: 0 })] },
    round: { roundNo: 3, pending: false, totalAmount: 200000, throwCount: 0, winCount: 0 }, // 지금 엑셀 회차(기록)
  };
  var presets = {};

  function rocketState() {
    var r = rocket.round;
    var goal = rocket.goalAmount || 100000;
    var open = r.pending ? [] : [hist(r.roundNo, { status: "OPEN", endReason: null, totalAmount: r.totalAmount, throwCount: r.throwCount, winCount: r.winCount, closed: false })];
    return {
      event: event,
      settings: { saved: rocket.saved, goalAmount: rocket.goalAmount, minAmount: rocket.minAmount, options: rocket.options },
      session: { no: rocket.session.no, maxRounds: event.maxRounds, total: rocket.session.total, rounds: rocket.session.rounds.concat(open) },
      round: {
        sessionNo: rocket.session.no, roundNo: r.roundNo, maxRounds: event.maxRounds,
        status: rocket.energy >= goal ? "ARMED" : "FUELING", totalAmount: rocket.energy, goalAmount: goal, minAmount: rocket.minAmount || 1000,
        throwCount: r.throwCount, winCount: r.winCount, pending: r.pending, sessionTotal: rocket.session.total,
        prizeBasis: rocket.pool, prizeRate: event.prizeRate, prizeAmount: prizeOf(rocket.pool, event.prizeRate), prizeUnit: event.prizeUnit,
      },
    };
  }
  // 다음 엑셀 회차(아직 기록이 없음). 에너지 · 당첨 금액은 그대로 이어진다
  function nextRound(roundNo) {
    return { roundNo: roundNo, pending: true, totalAmount: 0, throwCount: 0, winCount: 0 };
  }
  function ok(resultMap) { return { returnCode: 1, message: "ok", resultMap: Object.assign({}, resultMap || {}, { returnVal: 1 }) }; }
  function fail(message) { return { returnCode: 1, message: message, resultMap: { returnVal: 0 } }; }
  function num(v) { return Number(String(v == null ? "" : v).replace(/,/g, "")); }

  function mockApi(route, query, body) {
    if (route === "/loginmember/getmember") return ok({ member: member });
    if (route === "/api/excel/project/checkApprove") return ok({ data: [] });
    if (route === "/preset/getpresetlist") {
      var type = query.get("type") || body.type || "excel";
      presets[type] = presets[type] || [{ ID: type + "-1", NAME: "프리셋1", URL: root + "pages/" + type + "/demo" + type + "key", PAGE: "demo" + type + "key", DATA: null }];
      return ok({ dataList: presets[type] });
    }
    if (route === "/preset/createpreset") {
      var t = body.type || "excel";
      var row = { ID: t + "-" + Date.now(), NAME: "프리셋", URL: root + "pages/" + t + "/demo" + t + "key", PAGE: "demo" + t + "key", DATA: null };
      (presets[t] = presets[t] || []).push(row);
      return ok({ dataRow: row });
    }
    if (route === "/api/excel/rocket/state" || route === "/api/pages/rocket/state") return ok({ data: rocketState() });
    if (route === "/api/excel/rocket/save") {
      var goal = num(body.goalAmount), min = num(body.minAmount);
      if (!(goal >= 1) || !(min >= 1)) return fail("인자값이 맞지 않습니다.");
      Object.assign(rocket, { saved: true, goalAmount: goal, minAmount: min, options: body.options || null });
      return ok({ data: rocketState() });
    }
    if (route === "/api/excel/rocket/endround") {
      var r = rocket.round;
      if (r.pending) return fail("지금 끝낼 회차가 없어요. 다음 후원이 들어오면 회차가 시작돼요.");
      rocket.session.rounds.push(hist(r.roundNo, { endReason: "STREAMER", totalAmount: r.totalAmount, throwCount: r.throwCount, winCount: r.winCount }));
      rocket.round = nextRound(r.roundNo + 1); // 에너지 · 당첨 금액은 그대로
      return ok({ data: rocketState() });
    }
    if (route === "/api/excel/rocket/newsession") {
      rocket.session = { no: rocket.session.no + 1, total: 0, rounds: [] };
      rocket.energy = 0;
      rocket.pool = 0;
      rocket.round = nextRound(1);
      return ok({ data: rocketState() });
    }
    return ok({ data: [], dataList: [] }); // 나머지는 빈 성공
  }

  // axios 0.18: 모든 요청을 브라우저 안 가짜 API 로 돌린다
  if (window.axios) {
    window.axios.defaults.adapter = function (config) {
      var raw = String(config.url || "");
      var path = raw.indexOf("mock:") === 0 ? raw.slice(5) : raw.replace(/^https?:\/\/[^/]+/, "");
      var u = new URL(path || "/", "http://mock");
      var query = u.searchParams;
      if (config.params) Object.keys(config.params).forEach(function (k) { query.set(k, config.params[k]); });
      var body = {};
      try { body = typeof config.data === "string" ? JSON.parse(config.data || "{}") : (config.data || {}); } catch (e) { body = {}; }
      if (body instanceof FormData) { var o = {}; body.forEach(function (v, k) { o[k] = v; }); body = o; }
      var data = mockApi(u.pathname, query, body || {});
      return new Promise(function (resolve) {
        setTimeout(function () { resolve({ data: data, status: 200, statusText: "OK", headers: {}, config: config, request: {} }); }, 60);
      });
    };
  }

  // 주소 끝이 #tab-rocket 이면 FLEXTV 이벤트 탭을 연다
  window.addEventListener("load", function () {
    if (location.hash === "#tab-rocket" && typeof window.showTab === "function") window.showTab("tab-rocket");
  });
})();
