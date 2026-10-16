axios.defaults.withCredentials = true;
let my_key;
let current_data;
let prev_font_name;
let arr_left_times = [];
let intervalId_leftTime;

const DIRECTION = {
  TOP: "top",
  BOTTOM: "bottom",
};

function init() {
  $(".chat-list").empty();
  // console.log("init~~!");
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
    switch (data.type) {
      case CHALLENGELEX.DATA_TYPE.CREATE:
        console.log("미션 생성: ", data.type);
        break;
      case CHALLENGELEX.DATA_TYPE.FUND:
        // 추가후원
        addFunds(data);
        break;
      case CHALLENGELEX.DATA_TYPE.START:
        const startData = {
          ...data,
          amount: data.funds.amount || null,
        };
        // 미션 시작
        createChallengeLexItem(startData, DIRECTION.TOP);
        break;
      case CHALLENGELEX.DATA_TYPE.SUCCESS:
        //미션 성공
        setStatusSuccess(data);
        break;
      case CHALLENGELEX.DATA_TYPE.CANCELED:
        // 미션 취소
        setStatusCancel(data);
        break;
      case CHALLENGELEX.DATA_TYPE.EXTEND:
        // 시간 연장
        extendsTime(data);
        break;
      case CHALLENGELEX.DATA_TYPE.FAILED:
        // 미션 실패
        setStatusFailure(data);
        break;
      default:
        return;
    }
  });

  socket.on("help", function (data) {
    // console.log("help", data);
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
    console.log("eventaction", data);
    if (data.type == "10") {
      // cardLexList:[10, 20, 600, 0, 0]
      // errorMsg: null
      // errorVal:1
      // reqkey:461
      // selectCard:2
      // selectLex:20
      // type:"10"

      var numOfCard = data.cardLexList.length;
      var selectCard = data.selectCard;
      var winLex = Math.max(...data.cardLexList);

      var successIndex =
        data.cardLexList.findIndex((element) => element == winLex) + 1;
      var isSuccess;
      if (successIndex == selectCard) {
        isSuccess = "true";
      } else {
        isSuccess = "false";
      }
      //var loseLex = data.selectLex;
    }
  });

  socket.open();
}

function get_data(_key) {
  axios
    .get(g_url + "/pages/preset/" + _key)
    .then(function (response) {
      current_data = response.data;

      if (current_data == "" || current_data == null) {
        current_data = createDefaultJson();
      }
      getInProgressChallengeLex();
    })
    .catch(function (error) { })
    .then(function () {
      // always executed
    });
}

// 진행 중인 상태의 도전렉스 가져오기
// 미션 수행기간이 완료되지 않아야 함(expireDate)
function getInProgressChallengeLex() {
  var urlParams = "limit=30";

  if (current_data.isAvailable == "on") {
    urlParams = urlParams + "&page=" + my_key;
  } else {
    return;
  }

  axios
    .get(
      g_url + "/api/pages/challenge-lex/mission/list/progressing?" + urlParams
    )
    .then(function (response) {
      let json = response.data;
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
          json.resultMap.list.reverse();

          $.each(json.resultMap.list, function (index, data) {
            setTimeout(() => {
              createChallengeLexItem(data, DIRECTION.TOP);
            }, index * 200);
          });
        } else {
        }
      } else {
      }
    })
    .catch(function (error) { })
    .then(function () {
      // always executed
    });
}

intervalId_leftTime = setInterval(updateLeftSec, 1000);

function updateLeftSec() {
  arr_left_times.forEach((element) => {
    const [sec, isEndTime] = getLeftTime(element.endDate);

    $("#" + element.id).text(sec);
    if (isEndTime) {
      removeLeftSec(element.id);
    }
  });
}

function removeLeftSec(id) {
  arr_left_times = arr_left_times.filter((e) => e.id !== id);
}

function createChallengeLexItem(data, direction) {
  //console.log("🔥 ~ createChallengeLexItem ~ data:", data);
  let end = moment.utc(data.endDate).format("YYYY-MM-DD HH:mm:ss");
  let end_stillUtc = moment.utc(end).toDate();
  let end_local = moment(end_stillUtc).local().format("YYYY-MM-DD HH:mm:ss");

  let now = moment(new Date());
  let duration = moment.duration(now.diff(end_local));

  if (
    data.status == CHALLENGELEX.STATUS.PROGRESSING.CODE &&
    Math.sign(duration) == -1
  ) {
    const challengLexId = CHALLENGELEX.ID.makeCardId(data.id);
    // 중복호출 방지
    if (0 < $(`#challengLexId`).length) {
      return;
    }

    /* let status_text = $("<span>")
      .addClass("status")
      .text(CHALLENGELEX.STATUS.getName(data.status)); */
    let mission_text = $("<span>")
      .addClass(current_data.mission_font_name)
      .addClass("mission-color")
      .css("font-size", current_data.mission_font_size + "px")
      .css("color", current_data.mission_font_color)
      .text(data.title);
    let lex_text = $("<span>", { "data-lex": data.lex })
      .addClass(current_data.lex_font_name)
      .addClass("reward-color")
      .css("font-size", current_data.lex_font_size + "px")
      .css("color", current_data.lex_font_color)
      .text(`${numberWithCommas(parseInt(data.lex))} LEX`);
    let reward_title = $("<span>")
      .addClass("reward-title")
      .css("font-size", current_data.lex_font_size + "px")
      .text("상금");

    let time_text = $("<span>", { "data-endDate": data.endDate })
      .addClass(current_data.time_font_name)
      .addClass("time time-color")
      .css("font-size", current_data.time_font_size + "px")
      .css("color", current_data.time_font_color)
      .attr("id", CHALLENGELEX.ID.makeLeftTimeId(data.id))
      .text(getLeftTime(data.endDate)[0]);

    if (current_data.nick_font_bold == "on")
      nick_text.addClass("font-weight-bold");
    if (current_data.lex_font_bold == "on")
      lex_text.addClass("font-weight-bold");
    if (current_data.time_font_bold == "on")
      time_text.addClass("font-weight-bold");

    let cradItem = $("<li>", {
      id: challengLexId,
      "data-id": data.id,
    })
      .addClass("card-li")
      .append(
        $("<div>", { "data-status": data.status })
          .addClass("card-txt alert")
          .append($("<p>").addClass("word mission").append(mission_text))
          .append(
            $("<p>")
              .addClass("word inner-time")
              .append(
                $("<span>")
                  .addClass("icon-reward")
                  .append(reward_title)
                  .append(lex_text)
              )
              .append(time_text)
          )
      );

    $(cradItem)
      .find(".card-txt.alert")
      .get(0)
      .style.setProperty(
        "--content",
        `"도전렉스 ${CHALLENGELEX.STATUS.getName(data.status)}"`
      );

    let t_obj = {};
    // t_obj.reqkey = data.reqkey;
    t_obj.id = CHALLENGELEX.ID.makeLeftTimeId(data.id);
    t_obj.endDate = data.endDate;
    arr_left_times.push(t_obj);

    if (direction === DIRECTION.TOP) {
      $(".chat-list").append(cradItem);
    } else {
      $(".chat-list").prepend(cradItem);
    }
  } /* else {
    console.log("💦💦💦💦💦💦");
    console.log(Math.sign(duration));
  } */
}
function makeImageAniImg(findedItem, src) {
  const aniImage = findedItem.find(".ani-img");

  if (0 < aniImage.length) {
    aniImage.src = src;
    return;
  }

  $(findedItem).append(
    $("<p>", { class: "ani-img" }).append($("<img>", { src: src }))
  );
}

// 상태 변경 시
function setStatusSuccess(data) {
  const { id } = data;
  const cardId = CHALLENGELEX.ID.makeCardId(id);
  const findedItem = $(`.challengelex #${cardId}.card-li > .card-txt`);
  if (0 === findedItem.length) {
    return;
  }

  const status = findedItem.data("status") || "";
  if (
    CHALLENGELEX.STATUS.PROGRESSING.CODE < status ||
    0 === findedItem.length
  ) {
    return;
  }
  findedItem.data("status", CHALLENGELEX.STATUS.SUCCESS.CODE);

  findedItem
    .get(0)
    .style.setProperty(
      "--content",
      `"도전렉스 ${CHALLENGELEX.STATUS.SUCCESS.NAME}"`
    );
  // chage css class
  findedItem.addClass("success success-ani");
  // hide text
  $(findedItem).find("p span").hide();
  // chage status text
  findedItem
    .find(".nick-status .status")
    .text(CHALLENGELEX.STATUS.SUCCESS.NAME);
  // remove time
  findedItem.find(".inner-time .time").remove();
  // time update 저게
  removeLeftSec(CHALLENGELEX.ID.makeLeftTimeId(id));
  // 성공이미지 보여주기
  makeImageAniImg(findedItem, "../../images/img_success.svg");

  removeWithFadeOut(findedItem, cardId);
}

// 미션 실패
function setStatusFailure(data) {
  const { id } = data;
  const cardId = CHALLENGELEX.ID.makeCardId(id);
  const findedItem = $(`.challengelex #${cardId}.card-li > .card-txt`);
  if (0 === findedItem.length) {
    return;
  }

  const status = findedItem.data("status") || "";
  if (
    CHALLENGELEX.STATUS.PROGRESSING.CODE < status ||
    0 === findedItem.length
  ) {
    return;
  }
  findedItem.data("status", CHALLENGELEX.STATUS.FAILED.CODE);

  findedItem
    .get(0)
    .style.setProperty(
      "--content",
      `"도전렉스 ${CHALLENGELEX.STATUS.FAILED.NAME}"`
    );
  // chage css class
  findedItem.addClass("failure failure-ani");
  // hide text
  $(findedItem).find("p span").hide();
  // chage status text
  findedItem.find(".nick-status .status").text(CHALLENGELEX.STATUS.FAILED.NAME);
  // remove time
  findedItem.find(".inner-time .time").remove();
  // time update 저게
  removeLeftSec(CHALLENGELEX.ID.makeLeftTimeId(id));
  // 실패 이미지 보여 주기
  makeImageAniImg(findedItem, "../../images/img_failure.svg");

  removeWithFadeOut(findedItem, cardId);
}

//미션 취소
function setStatusCancel(data) {
  const { id } = data;
  const cardId = CHALLENGELEX.ID.makeCardId(id);
  const findedItem = $(`.challengelex #${cardId}.card-li > .card-txt`);
  if (0 === findedItem.length) {
    return;
  }

  const status = findedItem.data("status") || "";
  if (
    CHALLENGELEX.STATUS.PROGRESSING.CODE < status ||
    0 === findedItem.length
  ) {
    return;
  }
  findedItem.data("status", CHALLENGELEX.STATUS.CANCELED.CODE);

  findedItem
    .get(0)
    .style.setProperty(
      "--content",
      `"도전렉스 ${CHALLENGELEX.STATUS.CANCELED.NAME}"`
    );
  // chage css class
  findedItem.addClass("cancel cancel-ani");
  // hide text
  $(findedItem).find("p span").hide();
  // chage status text
  findedItem
    .find(".nick-status .status")
    .text(CHALLENGELEX.STATUS.CANCELED.NAME);
  // remove time
  findedItem.find(".inner-time .time").remove();
  // time update 저게
  removeLeftSec(CHALLENGELEX.ID.makeLeftTimeId(id));
  // 실패 이미지 보여 주기
  makeImageAniImg(findedItem, "../../images/img_failure.svg");

  removeWithFadeOut(findedItem, cardId);
}

function removeWithFadeOut(el, cardId) {
  setTimeout(() => {
    const animateClass = "animated fadeOut";
    el.addClass(animateClass);
    setTimeout(
      () => $(".challengelex .chat-list").find(`#${cardId}.card-li`).remove(),
      1000
    );
  }, 3000);
}

//추가 후원
function addFunds(data) {
  const { id } = data;
  const cardId = CHALLENGELEX.ID.makeCardId(id);
  const findedItem = $(`.challengelex #${cardId}.card-li > .card-txt`);
  if (0 === findedItem.length) {
    return;
  }

  // remove time
  findedItem
    .find(".icon-reward .reward-color")
    .data("lex", data.lex)
    .text(numberWithCommas(parseInt(data.lex)));

  const animateClass = "animated heartBeat";
  findedItem.find(".icon-reward").addClass(animateClass);
  setTimeout(
    (el, aniClass) => el.find(".icon-reward").removeClass(aniClass),
    1000,
    findedItem,
    animateClass
  );
}

function extendsTime(data) {
  const { id } = data;
  const cardId = CHALLENGELEX.ID.makeCardId(id);
  const findedItem = $(`.challengelex #${cardId}.card-li > .card-txt`);
  if (0 === findedItem.length) {
    return;
  }
  //animate__heartBeat
  const animateClass = "animated heartBeat";
  // 시간 업데이트
  const exptime = findedItem.find(".inner-time .time");
  if (0 === exptime.length) {
    return;
  }
  exptime.addClass(animateClass).text(getLeftTime(data.endDate)[0]);
  // 업데이트할 대상 갱신
  arr_left_times.forEach((e) => {
    if (e.id === CHALLENGELEX.ID.makeLeftTimeId(data.id)) {
      e.endDate = data.endDate;
    }
  });

  // remove animate
  setTimeout(
    (el, aniClass) => el.removeClass(aniClass),
    1000,
    exptime,
    animateClass
  );
}

// 남은시간 계산
function getLeftTime(endTime) {
  let result;

  let end = moment.utc(endTime).format("YYYY-MM-DD HH:mm:ss");
  let end_stillUtc = moment.utc(end).toDate();
  let end_local = moment(end_stillUtc).local(); //.format("YYYY-MM-DD HH:mm:ss");

  let now = moment(new Date());
  let duration = moment.duration(end_local.diff(now));

  const durationStr = [];
  if (Math.sign(duration) == 1) {
    const day = duration.days();
    const hour = duration.hours();
    const minutes = duration.minutes();
    const seconds = duration.seconds();

    if (0 < day) durationStr.push(`${moment(day, "DD").format("DD")}일`);
    if (0 < hour || 0 < durationStr.length)
      durationStr.push(`${moment(hour, "hh").format("HH")}시간`);
    if (0 < minutes || 0 < durationStr.length)
      durationStr.push(`${moment(minutes, "mm").format("mm")}분`);
    if (0 < seconds || 0 < durationStr.length)
      durationStr.push(`${moment(seconds, "ss").format("ss")}초`);

    result = durationStr.join(" ");
  }
  const isEndTime = 0 === durationStr.length;
  result = isEndTime ? "00분 00초" : durationStr.join(" ");

  return [result, isEndTime];
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

  jsonObj.isAvailable = "off";
  // 최소 렉스 갯수
  jsonObj.min_lex = "100";
  // 알림 테그스트
  jsonObj.noti_text_reg =
    "{닉네임}님 도전 렉스{미션내용} 상금 플렉스{개수}개 등록하셨습니다.";
  jsonObj.noti_text_fund =
    "{닉네임}님 도전 렉스{미션내용} 상금 플렉스{개수}개 상금을 추가하셨습니다.";
  jsonObj.noti_text_success =
    "{닉네임}님 도전 렉스{미션내용} 총 상금 플렉스{개수}개 상금 획득!";
  jsonObj.noti_text_failure = "{닉네임}님 도전 렉스{미션내용} 미션 실패!";
  // 알림방식,채팅 음성
  jsonObj.noti_type = "알림음성";
  jsonObj.is_chat_voice = "on";

  // nickname font
  jsonObj.nick_font_name = "ff-28";
  jsonObj.nick_font_bold = "off";
  jsonObj.nick_font_size = 14;
  jsonObj.nick_font_color = "#00FFF6";
  // mission font
  jsonObj.mission_font_name = "ff-28";
  jsonObj.mission_font_bold = "off";
  jsonObj.mission_font_size = 16;
  jsonObj.mission_font_color = "#000000";
  // 상금 폰트
  jsonObj.lex_font_name = "ff-28";
  jsonObj.lex_font_bold = "off";
  jsonObj.lex_font_size = 14;
  jsonObj.lex_font_color = "#000000";
  // 남은시간 폰트
  jsonObj.time_font_name = "ff-28";
  jsonObj.time_font_bold = "off";
  jsonObj.time_font_size = 14;
  jsonObj.time_font_color = "#FFFFFF";
  //  return JSON.stringify(jsonObj);

  return jsonObj;
}

init();
