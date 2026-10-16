axios.defaults.withCredentials = true;
let my_key;
let current_data;
let prev_font_name;
let jointProject;
let jointBj;
let arr_left_times = undefined;
let isEndExcel = false;
const MINUTES_5 = 5 * 60;

const SORT = {
  GOLD: "gold",
  RATE: "rate",
};
const ANIMATE_CLASS_GOLD = "animated heartBeat";

function init() {
  $(".preview-list").empty();
  var parts_ = window.location.pathname.split("/");
  my_key = parts_.pop();
  //console.log("my_key", my_key);
  //alert("플랙스티비 도우미 실행합니다." + my_key);
  startSocket(my_key);
}

function startSocket(_key) {
  const socket = io(g_url_socket, {
    autoConnect: false,
    //secure: true,
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    //console.log("conneected key: ", _key, socket.connected); // true
    get_data(_key);
    socket.emit(
      "login",
      {
        page: _key,
      },
      function (data) {
        console.log("login:", data);
      }
    );
  });

  socket.on("disconnect", function (data) {
    console.log("disconnect~~~~~~~", data);
    // alert("통신이 끊어졌습니다");
  });

  socket.on("notice", function (data) {
    const dataType = data.type;
    console.log("🔥 ~ notice data:", data);

    if (isEndExcel && dataType !== JOINT.DATA_TYPE.DETAIL_PROJECT) {
      console.log("종료된 회차입니다.", data);
      return;
    }

    switch (dataType) {
      /*  case JOINT.DATA_TYPE.START_PROJECT:
        isEndExcel = false;
        break;
      case JOINT.DATA_TYPE.STOP_PROJECT:
        isEndExcel = true;
        break; */
      case JOINT.DATA_TYPE.ADD_SPONSOR:
      case JOINT.DATA_TYPE.UPDATE_SPONSOR:
      case JOINT.DATA_TYPE.CANCEL_SPONSOR:
      case JOINT.DATA_TYPE.SEND_SPONSOR:
        redisplay();
        break;
      // 처리하지 않음
      case JOINT.DATA_TYPE.START_TIMER:
      case JOINT.DATA_TYPE.ADD_BJ:
      case JOINT.DATA_TYPE.CHANGE_BJ:
      case JOINT.DATA_TYPE.ADD_RANKING:
      case JOINT.DATA_TYPE.CHANGE_RANKING:
      case JOINT.DATA_TYPE.DELETE_RANKING:
      case JOINT.DATA_TYPE.ADD_TEAM:
      case JOINT.DATA_TYPE.CHANGE_TEAM:
      case JOINT.DATA_TYPE.DELETE_TEAM:
      default:
        return;
    }
  });

  socket.on("help", function (data) {
    window.location.reload();
  });

  socket.on("testMessage", function (data) {
    // console.log("testMessage", data);
    var _data = data.data;
    if (_data.type == "1") {
      //새로고침
      window.location.reload();
    } else if (_data.type == "2") {
      //초기화
      get_data(my_key);
    } else if (_data.type == "3") {
      //추천
    } else if (_data.type == "4") {
      //하트
      //show_noti_popup("플렉스티비", parseInt(_data.msg), "", _data.mid)
    }
  });

  socket.on("eventaction", function (data) {
    const dataType = data.type;
    console.log("🔥 ~ eventaction data:", data);

    if (isEndExcel && dataType !== JOINT.DATA_TYPE.DETAIL_PROJECT) {
      console.log("종료된 회차입니다.", data);
      return;
    }

    switch (dataType) {
      case JOINT.DATA_TYPE.START_PROJECT:
        isEndExcel = false;
        break;
      case JOINT.DATA_TYPE.END_PROJECT:
      case JOINT.DATA_TYPE.STOP_PROJECT:
        isEndExcel = true;
        break;
      case JOINT.DATA_TYPE.CHANGE_PROJECT:
      case JOINT.DATA_TYPE.ADD_PROJECT:
      case JOINT.DATA_TYPE.DETAIL_PROJECT:
      case JOINT.DATA_TYPE.DELETE_BJ:
        reRendering();
        break;
      case JOINT.DATA_TYPE.DELETE_PROJECT:
        redisplay();
        break;
      case JOINT.DATA_TYPE.START_TIMER:
        startTimer(data);
        break;
    }
  });

  socket.open();
}

function startTimer(data) {
  const {
    options: {
      timer: { start, timestamp },
    },
  } = data;
  $(".excel-timer").hide();

  if (start) {
    arr_left_times = { id: timestamp, endDate: timestamp };
  } else {
    arr_left_times = undefined;
  }
}

function get_data(_key) {
  axios
    .get(g_url + "/pages/preset/" + _key)
    .then(function (response) {
      current_data = response.data;

      if (current_data == "" || current_data == null) {
        current_data = createDefaultJson();
      }
      console.log("_key", _key, current_data);
      getJointBJList(_key);
    })
    .catch(function (error) { })
    .then(function () {
      // always executed
    });
}
async function callApiJoint() {
  const url = `${g_url}/api/pages/joint/bjlist`;
  const param = { page: my_key };
  const respons = await axios.post(url, param);
  const json = respons.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    return console.error(json.message || "");
  }
  const {
    resultMap: {
      data: { bj, project },
    },
  } = json;

  jointProject = project;
  jointBj = bj;

  return { project, bj };
}

function checkReRendering(project) {
  // display에 영향을 주는 프로젝트 샛팅이 변경되었는지 확인
  // 0점 BJ 표시, 대표 bj 표시
  const prevProject = $("li.excel-ranking-li").data("project");
  if (_.isNil(prevProject)) {
    return true;
  }
  // re-rendering 대상 비교.
  const isEquals = _.isEqualWith(prevProject, project, (prev, cur) => {
    return (
      prev.showMainBJ === cur.showMainBJ &&
      _.get(prev, "options.bj.header.enableRate") ===
      _.get(cur, "options.bj.header.enableRate") &&
      _.get(prev, "options.bj.header.rate") ===
      _.get(cur, "options.bj.header.rate") &&
      _.get(prev, "options.bj.header.enableCustom") ===
      _.get(cur, "options.bj.header.enableCustom") &&
      _.get(prev, "options.bj.header.custom") ===
      _.get(cur, "options.bj.header.custom") &&
      _.get(prev, "options.ranking.sort") ===
      _.get(cur, "options.ranking.sort") &&
      _.get(prev, "options.ranking.align.value") ===
      _.get(cur, "options.ranking.align.value") &&
      _.get(prev, "options.ranking.align.column") ===
      _.get(cur, "options.ranking.align.column")
    );
  });

  return !isEquals;
}

async function reRendering() {
  const response = await callApiJoint();
  if (_.isNil(response)) {
    return $(".preview-list").empty();
  }
  const { bj, project } = response;
  setDisplay(bj, project);
}

// 표시할 데이터만 비교(BJ ID 비교하지 않음)
function isEqualsBJData(bj, tr) {
  const prevBj = tr.data("bj");
  // BJ 비교
  const equalsBJ = _.isEqualWith(prevBj, bj, (prev, cur) => {
    return (
      _.get(prev, "nickname") === _.get(cur, "nickname") &&
      _.get(prev, "sponsorAmount") === _.get(cur, "sponsorAmount") &&
      _.get(prev, "score") === _.get(cur, "score") &&
      _.get(prev, "sumSponsorAmount") === _.get(cur, "sumSponsorAmount") &&
      //_.get(prev, "sumSponsorCount") === _.get(cur, "sumSponsorCount") &&
      _.get(prev, "options.custom") === _.get(cur, "options.custom") &&
      _.get(prev, "options.colors.bg") === _.get(cur, "options.colors.bg") &&
      _.get(prev, "options.colors.name") === _.get(cur, "options.colors.name")
    );
  });

  return equalsBJ;
}

function removeAniClass(el, className, immediately) {
  setTimeout(
    (obj, aniClass) => {
      obj.removeClass(aniClass);
    },
    immediately ? 0 : 1500,
    el,
    className
  );
}

// 데이터 교체
function rerenderBJRanking(index, tr, bj, prevData) {
  const { sumSponsorAmount: prevSumSponsorAmount } = prevData;

  const {
    sumSponsorAmount,
    user: { memberId },
    options: { custom: bjCustom },
  } = bj;

  const goldScore = sumSponsorAmount;
  const prevGoldScore = prevSumSponsorAmount;

  const bjName = getBjName(bj);
  tr.data("bj", bj);
  tr.data("uid", memberId);

  // 순위
  tr.find("td.excel-ranking").text(index);
  // BJ nickname
  tr.find("td.excel-bj").text(bjName);

  // gold
  const goldEl = tr.find("td.excel-gold");
  goldEl.text(`${numberWithCommas(goldScore)}`);

  if (!_.isEqual(Number(goldScore), Number(prevGoldScore))) {
    goldEl.addClass(ANIMATE_CLASS_GOLD);
    removeAniClass(goldEl, ANIMATE_CLASS_GOLD);
  }

  // custom(화장실)
  tr.find("td.excel-custom").text(bjCustom);
}

function renderEmptyBJRanking(project, no, tr) {
  const {
    status,
    options: {
      bj: {
        header: { enableCustom },
      },
    },
  } = project;

  const newTR = createEmptyBjRanking(no, enableCustom);

  newTR.insertBefore(tr);
  tr.remove();

  setStyle(newTR, undefined, undefined);
}

function renderBJRanking(no, bj, tr, tbody, project, bjMap) {
  const {
    options: {
      bj: {
        header: { enableCustom },
      },
    },
  } = project;

  const prevMemberId = tr.attr("uid");
  const memberId = _.get(bj, "user.memberId", "");

  // 이전 위치
  const prevRankingTr = tbody.find(`tr[uid=${memberId}]`);
  //const prevData = prevRankingTr.data("bj");
  const prevData = bjMap[Number(memberId)];

  // 동일 bj
  const equalsUid = String(memberId) === String(prevMemberId);
  const equalsBjData = isEqualsBJData(bj, tr);
  // 변경할 데이터 없음.
  if (equalsUid && equalsBjData) {
    //순위는 변경되었을 수 있음
    rerenderBJRanking(no + 1, tr, bj, prevData);
    setStyle(tr, bj);
    return;
  }

  // 현재 순위 && equalsUid 동일 && 데이터 변경 and effect
  if (equalsUid && !equalsBjData) {
    rerenderBJRanking(no + 1, tr, bj, prevData);
    setStyle(tr, bj);
    return;
  }

  // 랭킹이 변경되었을때( !equalsUid)
  // 다른 랭킹에 존재.
  if (0 < prevRankingTr.length) {
    rerenderBJRanking(no + 1, prevRankingTr, bj, prevData);
    prevRankingTr.clone().insertBefore(tr);
    setStyle(prevRankingTr, bj);
    prevRankingTr.remove();
    /*   if (!bjMemberIds.includes(revMemberId)) {
      tr.remove();
    } */
    return;
  }

  // 랭킹에 존재하지 않을 경우 추가함.
  //console.log("추가된 사용자", bj.nickname, memberId, "✓✓✓✓✓");
  // 새롭께 만든다.
  const newTr = createBjRanking(no + 1, bj, enableCustom);
  rerenderBJRanking(no + 1, newTr, bj, prevData || {});
  if (0 === tr.length) {
    newTr.appendTo(tbody);
  } else {
    newTr.insertBefore(tr);
  }
  newTr.insertBefore(tr);
  setStyle(newTr, bj);

  /* const newTr = 0 < tr.length ? tr : tbody.find("tr:last");
  if (0 < newTr.length) {
    const targetTr = newTr.clone();
    console.log("00 clone tr data-by", targetTr.data("bj"));
    targetTr.insertBefore(tr);
    console.log("01 clone tr data-by", targetTr.data("bj"));
    return;
  } */
}

// BJ 데이터 추가.
function changeBjRangkingData(project, bjs) {
  const {
    status,
    options: {
      bj: {
        align: { column: columnCount, value: isAlign },
      },
    },
  } = project;

  // 현재 테이블 갯수
  const tableLen = !!isAlign ? Math.max(1, +columnCount || 1) : 1;
  //console.log("🔥 ~ setDisplay ~ tableLen:", tableLen);

  let rest = bjs.length % tableLen;
  let limit = Math.floor(bjs.length / tableLen) + (rest > 0 ? 1 : 0);
  const bjMap = {};
  $(".excel-table-area tbody tr").each(function () {
    const target = $(this);
    const uid = target.attr("uid");
    const data = target.data("bj");
    bjMap[uid] = data;
  });
  // 1. 해당 순위 bj 동일, 변동 데이터가 없으면 skip, 데이터 변동 OK ->  변경 및 effect
  // 2. 해당 순위 bj 동일 X, BJS 찾음 OK, 기존 위치 제거, 현위치 삽입, 데이터 변경 OK-> effect (위치변경)
  // 3. 해당 순위 bj 동일 X, BJS 찾음 NOT FOUND, 현위치 삽입 -> effect (새로 추가)
  //const bjMemberIds = (bjs || []).map((b) => b.user.memberId);
  for (let tindex = 0; tindex < tableLen; tindex++) {
    let offset = tindex * limit;
    const tbody = $(`.excel-ranking-li table[index=${tindex}] tbody`);
    for (let i = 0; i < limit; i++) {
      const no = i + offset;
      const bj = _.get(bjs, [no]);
      const tr = tbody.find(`tr:nth-child(${i + 1})`);

      if (_.isEmpty(bj)) {
        renderEmptyBJRanking(project, no, tr);
        continue;
      }
      renderBJRanking(no, bj, tr, tbody, project, bjMap);
    }

    // 쓰레기 데이터 삭제
    const totalRowCount = tbody.find("tr").length;
    const diffCount = limit - totalRowCount;
    if (diffCount < 0) {
      let count = Math.abs(diffCount);
      while (count-- > 0) {
        // 줄어든 갯수만큼 뒤에서 삭제
        tbody.find("tr:last").remove();
      }
    }
    // clear
  }
}

// BJ ranking을 다시 셋팅한다.
async function redisplay() {
  const { bj, project } = (await callApiJoint()) || {};
  if (_.isNil(project)) {
    $(".preview-list").empty();
    return;
  }
  const currentBJRankingCount = $(".excel-table-area tbody tr").length || 0;

  // project의  랭킹의 정렬이 변경되었을 경우 다시 그려준다.
  const isReRendering = checkReRendering(project);

  if (isReRendering) {
    // 정렬 변경: 다시 그려준다.
    setDisplay(bj, project);
    return;
  }

  // 데이터가 하나도 없으면 갱신
  if (0 === currentBJRankingCount) {
    setDisplay(bj, project);
    return;
  }

  // 정렬외 참여의 엑셀 표기가 변경되었을때 제거.
  const bjlist = filterAnsSort(bj, project);

  changeBjRangkingData(project, bjlist);
}

/* BJ LIST를 가져온다. */
function getJointBJList(_key) {
  callApiJoint().then((response) => {
    if (_.isNil(response)) {
      return;
    }
    const { bj, project } = response;
    setDisplay(bj, project);
  });
}

function filterAnsSort(bjs, project) {
  const { } = project;

  const filterdData = (bjs || []).filter((e) => {
    const { show, nickname } = e;

    return show && nickname !== "";
  });
  //sorting
  return (filterdData || []).sort((a, b) => {
    const aGgoldSCore = a.sumSponsorAmount;
    const bGgoldSCore = b.sumSponsorAmount;

    return (bGgoldSCore || 0) - (aGgoldSCore || 0);
  });
}

function getBjName(data) {
  const { nickname } = data;

  return nickname;
}

function createHeader(parent, headerCustom, enableCustom) {
  // table header 순위
  $("<th>", {
    scope: "col",
    class: "excel-ranking-th",
    text: "순위",
  }).appendTo(parent);

  // table header BJ
  $("<th>", {
    scope: "col",
    class: "excel-bj-th",
    text: "BJ명",
  }).appendTo(parent);
  // table header heart
  $("<th>", {
    scope: "col",
    class: "excel-gold-th",
    text: "렉스",
  }).appendTo(parent);

  // custom
  if (enableCustom) {
    $("<th>", {
      scope: "col",
      class: "excel-custom-th",
      text: headerCustom,
    }).appendTo(parent);
  }
}

function createEmptyBjRanking(index, enableCustom) {
  const tr = $("<tr>", {
    class: "excel-row",
    "data-bj": JSON.stringify({}),
    "data-ranking": JSON.stringify({}),
    uid: "",
  });
  //순위
  $("<td>", { class: "excel-ranking", text: index + 1 }).appendTo(tr);

  // bj
  $("<td>", { class: "excel-bj", text: " " }).appendTo(tr);
  // 렉스
  $("<td>", { class: "excel-gold", text: " " }).appendTo(tr);

  // custom
  if (enableCustom) {
    $("<td>", { class: "excel-custom", text: " " }).appendTo(tr);
  }

  return tr;
}

// BJ 랭킹표시
function createBjRanking(index, bj, enableCustom) {
  const {
    sumSponsorAmount,
    user: { memberId, nickname },
    options: { custom },
  } = bj;

  const goldSCore = sumSponsorAmount;

  const tr = $("<tr>", {
    class: "excel-row",
    "data-bj": JSON.stringify(bj),
    uid: memberId,
  });
  //순위
  $("<td>", { class: "excel-ranking", text: index + 1 }).appendTo(tr);

  // bj
  $("<td>", {
    class: "excel-bj",
    text: nickname,
  }).appendTo(tr);
  // 렉스
  $("<td>", {
    class: "excel-gold",
    text: `${numberWithCommas(goldSCore)}`,
  }).appendTo(tr);
  // custom
  if (enableCustom) {
    $("<td>", {
      class: "excel-custom",
      text: custom,
    }).appendTo(tr);
  }

  return tr;
}

function setDisplay(bj, project) {
  const {
    status,
    options: {
      bj: {
        align: { column: columnCount, value: isAlign },
      },
    },
  } = project;
  // console.log("🔥 ~ setDisplay ~ project:", project);
  //console.log("🔥 ~ setDisplay ~ project:", bj);

  isEndExcel = JOINT.STATUS.INPROGRESS < status;

  const previewList = $(".preview-list");
  if (previewList.length < 0) return;
  previewList.empty();

  const { excel_title } = current_data;

  const container = $("<li>", {
    class: "excel-ranking-li",
    "data-project": JSON.stringify(project),
  }).appendTo(previewList);
  // 종료타이머
  $("<div>", { class: "excel-timer" }).appendTo(previewList);

  // 타이틀
  $("<div>", { class: "excel-title", text: excel_title || "" }).appendTo(
    container
  );
  const tableArea = $("<div>", { class: "excel-table-area" }).appendTo(
    container
  );

  const tableLen = !!isAlign ? Math.max(1, +columnCount || 1) : 1;
  //console.log("🔥 ~ setDisplay ~ tableLen:", tableLen);
  // 대상 BJ filter 및 정렬
  const bjList = filterAnsSort(bj, project) || [];
  // table당 bj 수

  let rest = bjList.length % tableLen;
  let limit = Math.floor(bjList.length / tableLen) + (rest > 0 ? 1 : 0);

  for (let tindex = 0; tindex < tableLen; tindex++) {
    createJointTable(tableArea, bjList, project, tindex, limit);
  }

  startTimer(project);
}

function createJointTable(tableArea, bjlist, project, tindex, limit) {
  const {
    status,
    options: {
      bj: {
        header: { enableCustom, custom: headerCustom },
      },
    },
  } = project;

  const table = $("<table>").appendTo(tableArea);
  table.attr("index", tindex);
  const theader = $("<thead>").appendTo(table);
  const tr = $("<tr>").appendTo(theader);

  // table header
  createHeader(tr, headerCustom, enableCustom);
  setHeaderStyle();

  // data
  let offset = tindex * limit;
  const tbody = $("<tbody>").appendTo(table);
  // bj명이 없거나, 하트 및 기여도 가 0이면 숨김, show false여도 숨김
  for (let i = 0; i < limit; i++) {
    const index = i + offset;
    const joint = bjlist[index];
    let tr;
    if (_.isNil(joint)) {
      tr = createEmptyBjRanking(index, enableCustom);
    } else {
      tr = createBjRanking(index, joint, enableCustom);
    }
    tr.appendTo(tbody);
    setStyle(tr, joint);
  }

  // timer
  //console.log("🔥🔥🔥 ~ setDisplay ~ project:", project);
  return table;
}

// 스타일 적용
function setStyle(tr, bj) {
  const {
    excel_color_item: rankColor,
    excel_color_bj: bjColor,
    excel_color_gold: goldColor,
    excel_item_font_bold: itemBold,
    excel_item_font_name: itemFontName,
    excel_item_font_size: itemFontSize,
  } = current_data;
  const {
    options: { colors: optBjColors },
  } = bj || { options: { colors: undefined } };

  //title bold
  //const isTitleBold = titleBold === "on";
  const isItemBold = itemBold === "on";

  // rank font & color
  $(tr).find(".excel-ranking").addClass(itemFontName);
  $(tr).find(".excel-ranking").css("color", rankColor);
  $(tr).find(".excel-ranking").css("font-size", `${itemFontSize}px`);
  if (isItemBold) $(tr).find(".excel-ranking").addClass("font-weight-bold");
  // bj font & color
  $(tr).find(".excel-bj").addClass(itemFontName);
  $(tr).find(".excel-bj").css("color", bjColor);
  $(tr).find(".excel-bj").css("font-size", `${itemFontSize}px`);
  if (isItemBold) $(tr).find(".excel-bj").addClass("font-weight-bold");
  // gold font & color
  $(tr).find(".excel-gold").addClass(itemFontName);
  $(tr).find(".excel-gold").css("color", goldColor);
  $(tr).find(".excel-gold").css("font-size", `${itemFontSize}px`);
  if (isItemBold) $(tr).find(".excel-gold").addClass("font-weight-bold");

  // BJ custom
  $(tr).find(".excel-custom").addClass(itemFontName);
  $(tr).find(".excel-custom").css("font-size", `${itemFontSize}px`);
  if (isItemBold) $(tr).find(".excel-custom").addClass("font-weight-bold");

  // BJ COLOR and Ranking Color
  // bg color
  if (!_.isNil(optBjColors) && !isTransparency(optBjColors.bg)) {
    tr.css("background-color", convertARGBToRGBA(optBjColors.bg));
  } /* else {
    tr.css("background-color", "");
  } */

  // name color
  if (!_.isNil(optBjColors) && !isTransparency(optBjColors.name)) {
    tr.find("td.excel-bj").css("color", convertARGBToRGBA(optBjColors.name));
  }
}

// specturm은 argb를 rgba로 변경한다.
function convertARGBToRGBA(argbHex) {
  if (9 === argbHex.length) {
    return `#${argbHex.slice(3)}${argbHex.slice(1, 3)}`;
  } else {
    return argbHex;
  }
}

function isTransparency(color) {
  const checkColor = color.replace(/#/g, "");
  // spectrum alpaha값 첫번째 2byte에 들어가 있음.
  if (8 === checkColor.length && checkColor.startsWith("00")) {
    return true;
  }
  return false;
}

function setHeaderStyle() {
  const {
    excel_theme,
    win_transparency: transparency,
    //excel_item_font_name: titleFont,
    excel_title_font_color: titleFontColor,
    excel_title_font_bold: titleBold,
    excel_item_font_bold: itemBold,
    excel_title_font_name: titleFontName,
    excel_item_font_name: itemFontName,
    excel_title_font_size: titleFontSize,
    excel_item_font_size: itemFontSize,
    excel_title_font_outline: titleOutline,
    excel_title_font_outline_color: titleOutlineColor,
  } = current_data;

  const isTitleBold = titleBold === "on";
  const isItemBold = itemBold === "on";

  prev_set_transparency(transparency);
  // 테마
  const themeClass = getThemeClassName(excel_theme);
  //title bold
  $(".excel-ranking-li").addClass(themeClass);

  // title font & color & size
  $(".excel-title").addClass(titleFontName);
  $(".excel-title").css("color", titleFontColor);
  $(".excel-title").css("font-size", `${titleFontSize}px`);
  if (isTitleBold) $(".excel-title").addClass("font-weight-bold");
  strokerEffect(".excel-title", titleOutline, titleOutlineColor);

  $(".excel-ranking-th").addClass(itemFontName);
  $(".excel-ranking-th").css("font-size", `${itemFontSize}px`);
  if (isItemBold) $(".excel-ranking-th").addClass("font-weight-bold");
  // bj font & color
  $(".excel-bj-th").addClass(itemFontName);
  $(".excel-bj-th").css("font-size", `${itemFontSize}px`);
  if (isItemBold) $(".excel-bj-th").addClass("font-weight-bold");
  // heart font & color
  $(".excel-gold-th").addClass(itemFontName);
  $(".excel-gold-th").css("font-size", `${itemFontSize}px`);
  if (isItemBold) $(".excel-gold-th").addClass("font-weight-bold");
  // rate font & color
  $(".excel-rate-th").addClass(itemFontName);
  $(".excel-rate-th").css("font-size", `${itemFontSize}px`);
  if (isItemBold) $(".excel-rate-th").addClass("font-weight-bold");
  // BJ custom
  $(".excel-custom-th").addClass(itemFontName);
  $(".excel-custom-th").css("font-size", `${itemFontSize}px`);
  if (isItemBold) $(".excel-custom-th").addClass("font-weight-bold");
  // 일급
  $(".excel-ranking-dailypay-th").addClass(itemFontName);
  $(".excel-ranking-dailypay-th").css("font-size", `${itemFontSize}px`);
  if (isItemBold) $(".excel-ranking-dailypay-th").addClass("font-weight-bold");
  //랭킹 custom
  $(".excel-ranking-custom-th").addClass(itemFontName);
  $(".excel-ranking-custom-th").css("font-size", `${itemFontSize}px`);
  if (isItemBold) $(".excel-ranking-custom-th").addClass("font-weight-bold");
}

function strokerEffect(selector, strokeSize, color) {
  const el = $(selector);
  el.css("text-shadow", "");
  for (var angle = 0; angle < 2 * Math.PI; angle += 1 / strokeSize) {
    appendShadow(
      el,
      Math.cos(angle) * strokeSize,
      Math.sin(angle) * strokeSize,
      color
    );
  }
}

function numberWithCommas(x) {
  if (x == null) return "";
  if (isNaN(x)) return 0;
  // return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");

  const parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

function createDefaultJson() {
  var jsonObj = {};

  // 엑셀방송 BJ 설정
  jsonObj.excel_bj_setting_url = "";
  jsonObj.excel_bj_setting_permission = "";

  // 투명도
  jsonObj.win_transparency = 0;

  // 엑셀 theme
  jsonObj.excel_theme = "theme-a";
  // 엑셀 타이트

  jsonObj.excel_title = "플렉스 티비";
  jsonObj.excel_title_font_name = "ff-01";
  jsonObj.excel_title_font_color = "#000000";
  jsonObj.excel_title_font_bold = "on";
  jsonObj.excel_title_font_size = 60;
  jsonObj.excel_title_font_outline = 1;
  jsonObj.excel_title_font_outline_color = "#000000";
  // 엑셀항목
  jsonObj.excel_item_font_name = "ff-01";
  jsonObj.excel_item_font_bold = "on";
  jsonObj.excel_item_font_size = 30;
  // 엑셀 color
  jsonObj.excel_color_item = "#171A1C";
  jsonObj.excel_color_bj = "#171A1C";
  jsonObj.excel_color_heart = "#171A1C";
  jsonObj.excel_color_rate = "#171A1C";

  return jsonObj;
}

function getThemeClassName(s_theme) {
  switch (s_theme) {
    case "전광판":
      return "excel-theme-electronice";
    case "팔레트":
      return "excel-theme-palette";
    case "네온사인":
      return "excel-theme-neon";
    case "리포트":
      return "excel-theme-report";
    case "형광팬":
      return "excel-theme-fluorescent";
    case "웨이브":
      return "excel-theme-wave";
    case "사이버":
      return "excel-theme-cyber";
    case "영수증":
      return "excel-theme-receipt";
    case "빈티지":
      return "excel-theme-vintage";
    // flex theme
    default:
      return `excel-${s_theme}`;
  }
}

function prev_set_transparency(_temp) {
  _temp = 100 - _temp;
  var t_val = _temp * 0.01;
  $(".preview-list-area").css({ opacity: t_val });
}

let intervalId_leftTime = setInterval(updateLeftSec, 1000);

function updateLeftSec() {
  if (!_.isNil(arr_left_times)) {
    const [sec, isEndTime, isEffect] = getLeftTime(arr_left_times.endDate);
    //console.log("🔥 ~ updateLeftSec ~ sec:", sec, arr_left_times.endDate);

    $(".excel-timer").show();
    $(".excel-timer").text(sec);
    if (isEffect) {
      $(".excel-timer").addClass("animated pulse infinite");
    }

    if (isEndTime) {
      arr_left_times = undefined;
      $(".excel-timer").removeClass("animated pulse infinite");
      //$(".excel-timer").hide();
    }
  }
}

// 남은시간 계산
function getLeftTime(endTime) {
  let result;

  let end = moment.utc(endTime).format("YYYY-MM-DD HH:mm:ss");
  let end_stillUtc = moment.utc(end).toDate();
  let end_local = moment(end_stillUtc).local(); //.format("YYYY-MM-DD HH:mm:ss");

  let now = moment(new Date());
  let duration = moment.duration(end_local.diff(now));
  const restSeconds = duration.asSeconds();
  const isEffect = 0 > Math.floor(restSeconds - MINUTES_5);

  const durationStr = [];
  if (Math.sign(duration) == 1) {
    const hour = duration.hours();
    const minutes = duration.minutes();
    const seconds = duration.seconds();
    // hour
    if (0 < hour) durationStr.push(`${moment(hour, "hh").format("HH")}`);
    else durationStr.push(`00`);
    // minutes
    if (0 < minutes) durationStr.push(`${moment(minutes, "mm").format("mm")}`);
    else durationStr.push(`00`);
    // seconds
    if (0 < seconds) durationStr.push(`${moment(seconds, "ss").format("ss")}`);
    else durationStr.push(`00`);
  }
  const isEndTime = 0 === durationStr.length;
  result = isEndTime ? "집계중지" : durationStr.join(":");

  return [result, isEndTime, isEffect];
}

init();
