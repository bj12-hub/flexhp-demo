// FLEXTV 이벤트 이름표 — 룰렛 위 문구 안에서 후원자(핑크) · 지정 BJ(청록) 닉네임을 이름표로 연출한다.
// 룰렛(pages/event_roulette.js)과 따로 있는 요소다. 후원 알림 위젯 · 도우미 탭 미리보기 · 이벤트 안내 페이지가 같이 쓴다.
// 룰렛 문구(설정 '룰렛 문구')의 {닉네임} 은 후원자 이름표, {BJ} 는 지정 BJ 이름표가 되고 {렉스} · {당첨금액} 은 글자로 바뀐다.
//   EventNameTags.caption(el, text, { donor, bj, amount, prize });   // el 안을 문구 + 이름표로 채운다
//   EventNameTags.result(el, win);                                   // 성공이면 BJ 이름표가 빛나고 실패면 가라앉는다(null 이면 지움)
(function (root) {
  const DEFAULT_TEXT = "{닉네임}님 → {BJ} 도전! 결과는?";
  // 이름표 전의 기본 문구는 새 기본 문구로 본다(지정 BJ 가 빠지지 않게)
  const OLD_DEFAULT = "{닉네임}님 도전! 결과는?";
  const TOKENS = /(\{닉네임\}|\{BJ\}|\{렉스\}|\{당첨금액\})/;

  function textOf(text) {
    const s = String(text == null ? "" : text).trim();
    return !s || s === OLD_DEFAULT ? DEFAULT_TEXT : s;
  }
  function tag(kind, name, fallback) {
    const el = document.createElement("span");
    el.className = "evn-tag is-" + kind;
    el.textContent = String(name == null ? "" : name).trim() || fallback;
    return el;
  }

  root.EventNameTags = {
    DEFAULT_TEXT,
    textOf,
    caption(el, text, d) {
      d = d || {};
      el.textContent = "";
      textOf(text).split(TOKENS).forEach(function (part) {
        if (!part) return;
        if (part === "{닉네임}") el.appendChild(tag("donor", d.donor, "후원자"));
        else if (part === "{BJ}") el.appendChild(tag("bj", d.bj, "BJ"));
        else if (part === "{렉스}") el.appendChild(document.createTextNode(d.amount == null ? "" : String(d.amount)));
        else if (part === "{당첨금액}") el.appendChild(document.createTextNode(d.prize == null ? "" : String(d.prize)));
        else el.appendChild(document.createTextNode(part));
      });
    },
    result(el, win) {
      el.classList.remove("evn-win", "evn-lose");
      if (win != null) el.classList.add(win ? "evn-win" : "evn-lose");
    },
  };
})(window);
