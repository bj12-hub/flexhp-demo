// FLEXTV 이벤트 이름표 — 룰렛 위 문구 안에서 후원자(핑크) · 지정 BJ(청록) 닉네임을 이름표로 연출한다.
// 룰렛(pages/event_roulette.js)과 따로 있는 요소다. 후원 알림 위젯 · 도우미 탭 미리보기 · 이벤트 안내 페이지가 같이 쓴다.
// 룰렛 문구(설정 '룰렛 문구')의 {닉네임} 은 후원자 이름표, {BJ} 는 지정 BJ 이름표가 되고 {렉스} · {당첨금액} 은 글자로 바뀐다.
// 닉네임은 최대 10글자라 문구를 한 줄로 두고, 칸(룰렛 폭)보다 길면 글자 크기를 줄여 10글자 이름표 두 개가 다 보이게 한다.
//   EventNameTags.caption(el, text, { donor, bj, amount, prize });   // el 안을 문구 + 이름표로 채운다
//   EventNameTags.result(el, win);                                   // 성공이면 BJ 이름표가 빛나고 실패면 가라앉는다(null 이면 지움)
(function (root) {
  const DEFAULT_TEXT = "{닉네임}님 → {BJ}";
  // 예전 기본 문구는 새 기본 문구로 본다(이름표 전 · '도전! 결과는?' 이 붙어 있던 때)
  const OLD_DEFAULTS = ["{닉네임}님 도전! 결과는?", "{닉네임}님 → {BJ} 도전! 결과는?"];
  const TOKENS = /(\{닉네임\}|\{BJ\}|\{렉스\}|\{당첨금액\})/;
  const MAX_NAME = 10; // FLEXTV 닉네임 최대 글자 수
  const MIN_SCALE = 0.6;

  function textOf(text) {
    const s = String(text == null ? "" : text).trim();
    return !s || OLD_DEFAULTS.indexOf(s) >= 0 ? DEFAULT_TEXT : s;
  }
  function nameOf(name, fallback) {
    const chars = Array.from(String(name == null ? "" : name).trim());
    if (!chars.length) return fallback;
    return chars.length > MAX_NAME ? chars.slice(0, MAX_NAME).join("") + "…" : chars.join("");
  }
  function tag(kind, name, fallback) {
    const el = document.createElement("span");
    el.className = "evn-tag is-" + kind;
    el.textContent = nameOf(name, fallback);
    return el;
  }
  // 문구가 칸보다 넓으면 글자 크기를 줄여 칸에 맞춘다(이름표는 em 단위라 함께 줄어든다)
  function fit(el) {
    el.style.fontSize = "";
    const room = el.clientWidth;
    if (!room) return;
    const base = parseFloat(getComputedStyle(el).fontSize) || 0;
    for (let i = 0; i < 3 && el.scrollWidth > room + 1; i += 1) {
      const now = parseFloat(el.style.fontSize) || base;
      el.style.fontSize = Math.max(base * MIN_SCALE, Math.floor((now * room * 10) / el.scrollWidth) / 10) + "px";
    }
  }

  root.EventNameTags = {
    DEFAULT_TEXT,
    textOf,
    caption(el, text, d) {
      d = d || {};
      el.textContent = "";
      el.classList.add("evn-caption");
      textOf(text).split(TOKENS).forEach(function (part) {
        if (!part) return;
        if (part === "{닉네임}") el.appendChild(tag("donor", d.donor, "후원자"));
        else if (part === "{BJ}") el.appendChild(tag("bj", d.bj, "BJ"));
        else if (part === "{렉스}") el.appendChild(document.createTextNode(d.amount == null ? "" : String(d.amount)));
        else if (part === "{당첨금액}") el.appendChild(document.createTextNode(d.prize == null ? "" : String(d.prize)));
        else el.appendChild(document.createTextNode(part));
      });
      fit(el);
      // 글꼴이 아직 오는 중이면 다 온 뒤에 한 번 더 맞춘다
      if (document.fonts && document.fonts.status !== "loaded") document.fonts.ready.then(function () { fit(el); });
    },
    result(el, win) {
      el.classList.remove("evn-win", "evn-lose");
      if (win != null) el.classList.add(win ? "evn-win" : "evn-lose");
    },
  };
})(window);
