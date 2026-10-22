// FLEXTV 이벤트 이름표 — 도전한 후원자(왼쪽, 핑크) · 지정 BJ(오른쪽, 청록) 닉네임.
// 룰렛(pages/event_roulette.js)과 따로 있는 요소다. 후원 알림 위젯 · 도우미 탭 미리 돌려보기 · 이벤트 안내 페이지가
// 룰렛 양옆에 .evn-tag 두 개를 두고, 룰렛이 도는 동안(도전 때)만 이름을 넣어 보여 준다.
//   EventNameTags.set(row, donor, bj);   // row 안의 .evn-tag.is-donor / .is-bj 에 닉네임(빈 이름은 숨김)
//   EventNameTags.result(row, win);      // 성공이면 BJ 이름표가 빛나고 실패면 가라앉는다(null 이면 지움)
(function (root) {
  function put(el, name) {
    if (!el) return;
    const s = String(name == null ? "" : name).trim();
    el.textContent = s;
    el.hidden = !s;
  }
  root.EventNameTags = {
    set(row, donor, bj) {
      put(row.querySelector(".evn-tag.is-donor"), donor);
      put(row.querySelector(".evn-tag.is-bj"), bj);
    },
    result(row, win) {
      row.classList.remove("evn-win", "evn-lose");
      if (win != null) row.classList.add(win ? "evn-win" : "evn-lose");
    },
  };
})(window);
