// 정적 미리보기: 서버 주소는 demo/mock.js 에서 정한다
var g_flextv = "https://www.flextv.co.kr";
var g_url = "mock:", g_url_socket = "", g_url_tts_base_url = "", g_url_tts = "", g_url_current = "", g_url_roulette_sound = "";


console.log("global.js")

var g_langArray = [];

const LEFT_TIME_NAME_PREFIX = "left-time-challengelex-";
const CARD_NAME_PREFIX = "challengelex-";

const PG = {
  BUTTON_CONUT: {
    NORMAL: 10,
    SMALL: 5,
  },
  LIMIT: {
    LG: 20,
    MD: 5,
    SM: 3,
  },
  makeQueryString: (param) => {
    const keys = Object.keys(param) || [];
    let querystring = "";
    keys.forEach((key) => {
      const val = param[key];
      if (!Array.isArray(val)) {
        querystring += "" === querystring ? "?" : "&";
        querystring += `${key}=${val}`;
      } else {
        //배열의 경우
        val.forEach((v) => {
          querystring += "" === querystring ? "?" : "&";
          querystring += `${key}=${v}`;
        });
      }
    });
    return querystring;
  },
};

const CHALLENGELEX = {
  ID: {
    makeLeftTimeId: (id) => `${LEFT_TIME_NAME_PREFIX}${id}`,
    makeCardId: (id) => `${CARD_NAME_PREFIX}${id}`,
  },
  STATUS: {
    isCompleted(key) {
      const statusInfo = CHALLENGELEX.STATUS[(key || "").toUpperCase()];
      return (
        statusInfo && CHALLENGELEX.STATUS.COMPLETED.CODE === statusInfo.CODE
      );
    },
    isProgressing(key) {
      const statusInfo = CHALLENGELEX.STATUS[(key || "").toUpperCase()];
      return (
        statusInfo && CHALLENGELEX.STATUS.PROGRESSING.CODE === statusInfo.CODE
      );
    },
    getName: (code) => {
      switch (code) {
        case CHALLENGELEX.STATUS.FAILED.CODE:
          return CHALLENGELEX.STATUS.FAILED.NAME;
        case CHALLENGELEX.STATUS.CANCELED.CODE:
          return CHALLENGELEX.STATUS.CANCELED.NAME;
        case CHALLENGELEX.STATUS.CREATE.CODE:
          return CHALLENGELEX.STATUS.CREATE.NAME;
        case CHALLENGELEX.STATUS.PENDING.CODE:
          return CHALLENGELEX.STATUS.PENDING.NAME;
        case CHALLENGELEX.STATUS.PROGRESSING.CODE:
          return CHALLENGELEX.STATUS.PROGRESSING.NAME;
        case CHALLENGELEX.STATUS.SUCCESS.CODE:
          return CHALLENGELEX.STATUS.SUCCESS.NAME;
        default:
          return "-";
      }
    },
    getStatus: (key) => {
      return CHALLENGELEX.STATUS[(key || "").toUpperCase()];
    },
    getStatusCodeOfTab: (key) => {
      const statusInfo = CHALLENGELEX.STATUS[(key || "").toUpperCase()];
      if (
        statusInfo &&
        CHALLENGELEX.STATUS.COMPLETED.CODE !== statusInfo.CODE
      ) {
        return [statusInfo.CODE];
      } else if (statusInfo) {
        return [
          CHALLENGELEX.STATUS.SUCCESS.CODE,
          CHALLENGELEX.STATUS.CANCELED.CODE,
          CHALLENGELEX.STATUS.FAILED.CODE,
        ];
      } else {
        return [];
      }
    },
    getStatus: (key) => {
      return CHALLENGELEX.STATUS[(key || "").toUpperCase()];
    },
    CREATE: { CODE: 0, NAME: "등록" },
    PENDING: { CODE: 1, NAME: "대기" },
    PROGRESSING: { CODE: 2, NAME: "진행 중" },
    SUCCESS: { CODE: 3, NAME: "성공" },
    FAILED: { CODE: 4, NAME: "실패" },
    CANCELED: { CODE: 5, NAME: "취소" },
    DELETED: { CODE: 6, NAME: "삭제" },
    COMPLETED: { CODE: -9, NAME: "완료" },
  },
  // data.type ->notice 및 eventaction은 아래의 타입에따라 처리
  DATA_TYPE: {
    CREATE: "20", //도전렉스 등록(시청자/BJ)
    FUND: "21", //도전렉스 추가 펀딩
    START: "22", //시작
    CANCELED: "23", // 취소
    SUCCESS: "24", //성공
    FAILED: "25", //실패
    EXTEND: "26", //연장
  },
  RESTRICTION: {
    // unit: sec
    LIMIT_TIME_CREATE: 10 * 24 * 60 * 60,
    LIMIT_TIME_EXTEND: 1 * 24 * 60 * 60,
  },
};

const EXCEL = {
  STATUS: {
    REG: 1, // 등록 중
    WAIT: 2, // 대개
    INPROGRESS: 3, // 진행 중
    END: 4, // 종료
    DELETE: 5, // 삭제
  },
  DATA_TYPE: {
    ADD_PROJECT: "300", //프로젝트생성
    CHANGE_PROJECT: "301", //프로젝트 업데이트
    DELETE_PROJECT: "302", //프로젝트 샥제
    DETAIL_PROJECT: "303", //프로젝트 조회
    START_TIMER: "304", //타이머 시작
    END_PROJECT: "305", // 종료
    START_PROJECT: "306", // 회차 시작
    STOP_PROJECT: "307", // 회차 중지
    ADD_BJ: "310", //BJ 정보 추가
    CHANGE_BJ: "311", //BJ 정보 변경
    DELETE_BJ: "312", // BJ삭제
    ADD_RANKING: "320", //랭킹 추가
    CHANGE_RANKING: "321", //랭킹 변경
    DELETE_RANKING: "322", //랭킹 추가 및 변경
    ADD_TEAM: "330", //팀 추가
    CHANGE_TEAM: "331", //팀 변경
    DELETE_TEAM: "332", // 팀 삭제
    ADD_SPONSOR: "340", // 후원 추가
    UPDATE_SPONSOR: "341", // 후원 수정
    CANCEL_SPONSOR: "342", // 후원 취소
    SEND_SPONSOR: "343", // 시청자 후원
    BJ_TIMER_READY: "360", // 타이머 준비
    BJ_TIMER_START: "361", // 타이머 시작
    BJ_TIMER_STOP: "362", // 타이머 중지
    BJ_TIMER_END: "363", // 타이머 종료
    BJ_TIMER_RESET: "364", // 타이머 RESET

    //battle
    ADD_BATTLE_TEAM: "350", //팀 추가
    UPDATE_BATTLE_TEAM: "351", //팀 변경
    REMOE_BATTLE_TEAM: "352", // 팀 삭제
    BATTLE_TIMER_INIT: "353", // 배틀 타이머 초기화
    BATTLE_TIMER_START: "354", // 배틀 타이머 시작
    BATTLE_TIMER_STOP: "355", // 배틀 타이머 종료
    BATTLE_START: "356", // 배틀 시작
    BATTLE_STOP: "357", // 배틀 종료
    ADD_BATTLE_MEMBER: "360", // 멤버 추가
    UPDATE_BATTLE_MEMBER: "361", // 멤버 변경
    REMOVE_BATTLE_MEMBER: "362", // 멤번 삭제
    // 팀
    ADD_TEAM: "370", //팀 추가
    UPDATE_TEAM: "371", //팀 변경
    REMOVE_TEAM: "372", // 팀 삭제
    TEAM_TIMER_INIT: "373", // 배틀 타이머 초기화
    TEAM_TIMER_START: "374", // 배틀 타이머 시작
    TEAM_TIMER_STOP: "375", // 배틀 타이머 종료
    TEAM_START: "376", // 배틀 시작
    TEAM_STOP: "377", // 배틀 종료
    ADD_TEAM_MEMBER: "380", // 멤버 추가
    UPDATE_TEAM_MEMBER: "381", // 멤버 변경
    REMOVE_TEAM_MEMBER: "382", // 멤번 삭제
  },
};

const JOINT = {
  STATUS: {
    REG: 1, // 등록 중
    WAIT: 2, // 대개
    INPROGRESS: 3, // 진행 중
    END: 4, // 종료
    DELETE: 5, // 삭제
  },
  DATA_TYPE: {
    ADD_PROJECT: "400", //프로젝트생성
    CHANGE_PROJECT: "401", //프로젝트 업데이트
    DELETE_PROJECT: "402", //프로젝트 샥제
    DETAIL_PROJECT: "403", //프로젝트 조회
    START_TIMER: "404", //타이머 시작
    END_PROJECT: "405", // 종료
    START_PROJECT: "406", // 회차 시작
    STOP_PROJECT: "407", // 회차 중지
    ADD_BJ: "410", //BJ 정보 추가
    CHANGE_BJ: "411", //BJ 정보 변경
    DELETE_BJ: "412", // BJ삭제
    ADD_SPONSOR: "440", // 후원 추가
    UPDATE_SPONSOR: "441", // 후원 수정
    CANCEL_SPONSOR: "442", // 후원 취소
    SEND_SPONSOR: "443", // 시청자 후원
  },
};

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function get_font_str_from_value(_val) {
  for (i = 0; i < g_langArray.length; i++) {
    if ($(g_langArray[i]).children(":first-child").attr("value") == _val) {
      return g_langArray[i];
    }
  }
  console.log("폰트없음 error");
}

function g_replaceAll(s_Txt, s_srcChr, s_dstChr) {
  var tmpValue = String(s_Txt);
  if (tmpValue.indexOf(s_srcChr) != -1) {
    var stripStr = tmpValue.split(s_srcChr);
    var joinStr = stripStr[0];
    for (var m = 1; m < stripStr.length; m++) {
      joinStr += s_dstChr + stripStr[m];
    }
    return joinStr;
  } else {
    return s_Txt;
  }
}

// function g_doNotReload(event){
//   if( (event.ctrlKey == true && (event.keyCode == 78 || event.keyCode == 82)) || (event.keyCode == 116) ) {
//       console.log("donotReload")
//       event.keyCode = 0;
//       event.cancelBubble = true;
//       event.returnValue = false;
//   }
// }

function g_login_checking(_callbackFn) {
  axios
    .get(g_url + "/loginmember/getmember")
    .then(function (response) {
      let json = response.data;
      console.log("login json3: ", json);

      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
          var member = json.resultMap.member;
          if (member) {
            //  console.log("login sueccess:", member);
            if (member.LOGINFLAG == "Y") {
              _callbackFn(member);
            }
          }
        } else {
          alert(json.message);
        }
      } else if (json.returnCode == -101) {
        alert(json.message);
        // login url link
      } else {
        alert(json.message);
      }
    })
    .catch(function (error) { })
    .then(function () {
      // always executed
    });
}

const Message = {
  _preventClose: false,
  preventClose: () => {
    Message._preventClose = true;
  },
  resetPreventCloseClose: () => {
    Message._preventClose = false;
  },
  multiLineMessage: (messages) => {
    const container = $("<div>");
    (messages || []).forEach((text) =>
      $("<div>", { text }).appendTo(container)
    );

    return container;
  },
  _createMessage: () => {
    $(`<div class="modal fade" id="commonAlarmPopup" tabindex="-1" aria-labelledby="commonAlarmPopupLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <div class="info-title info">
            </div>
          </h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <p></p>
        </div>
        <div class="modal-footer d-flex justify-content-center">
          <button type="button" class="btn btn-type2 btn-md" data-dismiss="modal" onclick="Message.OK()">닫기</button>
        </div>
      </div>
    </div>
  </div>`).appendTo("body");
  },
  _createConfirm: (className) => {
    $(`<div class="modal fade" id="confirmPopup" tabindex="-1" aria-labelledby="confirmPopupLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered ${className}">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <div class="info-title warn">
            </div>
          </h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <p class="mainmsg"></p>
          <!-- <p>메세지</p> -->
        </div>
        <div class="modal-footer d-flex justify-content-center">
          <button type="button" class="btn btn-md" onclick="Message.confirmOk()">
            <div class="okcontainer">
            <!-- spinner -->
            <div class="spinner-area .d-none">
              <div class="spinner-border" role="status">
                <span class="sr-only">Loading...</span>
              </div>
            </div>
            예
            </div>
          </button>
          <button type="button" class="btn btn-type2 btn-md" data-dismiss="modal" onclick="Message.confirmCancel()">
            아니오
          </button>
        </div>
      </div>
    </div>
  </div>`).appendTo("body");
  },
  show: (text, option) => {
    if (0 === $("#commonAlarmPopup").length) {
      Message._createMessage();
    }

    $("#commonAlarmPopup").on("hide.bs.modal", function (e) {
      $("#commonAlarmPopup").remove();
    });

    const {
      type,
      title,
      okHandler,
      label: btnLabel,
      closeHandler,
    } = option || {};
    let typeClass = type;
    let typeText;
    switch (type) {
      case "error":
        typeText = title || "오류";
        break;
      case "warn":
        typeText = title || "경고";
        break;
      case "info":
      default:
        typeText = title || "알림";
        typeClass = "info";
    }
    //console.log(typeText, typeClass);
    // ok handler
    $("#commonAlarmPopup .modal-body").data("okHandler", okHandler || "");
    // close handler
    if (closeHandler) {
      $("#commonAlarmPopup").on("hide.bs.modal", function (e) {
        closeHandler();
      });
    }

    // 모든 클래스 삭제
    $("#commonAlarmPopup .modal-title .info-title").removeClass();
    // 기본 클래스
    $("#commonAlarmPopup .modal-title > div").addClass("info-title");
    $("#commonAlarmPopup .modal-title .info-title").addClass(typeClass);
    // 타이틀 변경
    $("#commonAlarmPopup .modal-title .info-title").text(typeText);
    //$("#commonAlarmPopup .modal-body > p").text(text);
    if (typeof (text || "") === "string") {
      $("#commonAlarmPopup .modal-body > p").text(text);
    } else {
      $("#commonAlarmPopup .modal-body > p").append(text);
    }

    //버튼 라벨
    $("#commonAlarmPopup .modal-footer button").text(btnLabel || "닫기");

    new bootstrap.Modal(document.getElementById("commonAlarmPopup"), {
      keyboard: false,
    }).show();
  },
  // message.show 닫기
  OK: () => {
    const okHandler = $("#commonAlarmPopup .modal-body").data("okHandler");
    if (okHandler && typeof okHandler === "function") {
      okHandler();
    }
  },
  confirm: (
    { title, message, className },
    okHandler,
    cancelHandler,
    callbackHideModal
  ) => {
    Message.resetPreventCloseClose();
    if (0 === $("#confirmPopup").length) {
      Message._createConfirm(className);
    }

    $("#confirmPopup").on("hide.bs.modal", function (e) {
      $("#confirmPopup").remove();
    });

    $("#confirmPopup .modal-body > p.mainmsg").empty();
    // ok handler
    $("#confirmPopup .modal-body").data("okHandler", okHandler || "");
    // cancel handler
    $("#confirmPopup .modal-body").data("cancelHandler", cancelHandler || "");

    if (typeof (title || "") === "string") {
      $("#confirmPopup .modal-title .info-title").text(title);
    } else {
      $("#confirmPopup .modal-title .info-title").append(title);
    }

    if (typeof (message || "") === "string") {
      if ("" !== message) {
        $("#confirmPopup .modal-body > p.mainmsg").text(message);
      }
    } else {
      $("#confirmPopup .modal-body > p.mainmsg").append(message);
      $("#confirmPopup").on("shown.bs.modal", () => {
        $(message).find("input").focus();
      });
    }

    $("#confirmPopup").modal({
      keyboard: false,
    });

    if (callbackHideModal) {
      $("#confirmPopup").on("hidden.bs.modal", function (e) {
        callbackHideModal();
      });
    }
  },
  confirmCancel: () => {
    const cancelHandler = $("#confirmPopup .modal-body").data("cancelHandler");

    const callback = window[cancelHandler];
    if (callback && typeof callback === "function") {
      callback();
    }
  },
  confirmOk: () => {
    $("#confirmPopup").on("hide.bs.modal", function (e) {
      stopSpinner();
    });
    const okHandler = $("#confirmPopup .modal-body").data("okHandler");
    const startSpinner = () => {
      $("#confirmPopup .modal-footer button").css("opacity", 0.5);
      $("#confirmPopup .spinner-area").show();
    };
    const stopSpinner = () => {
      $("#confirmPopup .modal-footer button").css("opacity", 1);
      $("#confirmPopup .spinner-area").hide();
    };
    if (okHandler && typeof okHandler === "function") {
      const result = okHandler();
      if (result instanceof Promise) {
        startSpinner();
        result
          .finally(() => {
            stopSpinner();
            Message.closeModal("confirmPopup", 0);
          })
          .catch((e) => console.error(e));
      } else {
        //console.log("동기함수.");
        Message.closeModal("confirmPopup", 0);
      }
    } else {
      Message.closeModal("confirmPopup", 0);
    }
  },
  closeModal: (modalId, delay) => {
    if (Message._preventClose) {
      Message.resetPreventCloseClose();
      return;
    }
    const delayTime = isNaN(delay) ? 1000 : delay;
    setTimeout(() => $(`#${modalId}`).modal("hide"), delayTime);
  },
};

// 이전페이지
function moveToPreviousPage(current, limit, options, fnName) {
  const page = current - 1;
  if (1 > page) return;

  moveToPage(page, limit, options, fnName);
}

function moveToNextPage(current, limit, lastPage, options, fnName) {
  const page = current + 1;
  if (page > lastPage) return;
  moveToPage(page, limit, options, fnName);
}

// 페이지 이동
function moveToPage(page, limit, options, fnName) {
  if (window[fnName]) {
    window[fnName](page, limit, options);
  }
}

// paging 생성
function createPagination(
  tabPaing,
  paginationButtonCount,
  total,
  limit,
  current,
  options,
  fnName,
  showFirstAndLast = false
) {
  //const tabPaing = $("#ChallengelexTabContent .tab-pane.active .tab-paging");
  if (0 === tabPaing.length) return;
  tabPaing.empty();
  //if (0 < tabPaing.find(".paging").length) return;

  // paging
  let lastPage = Math.floor(total / limit);
  lastPage += total % limit > 0 ? 1 : 0;

  // 처음으로 이동 버튼(페이지가 paginationButtonCount 이상일때)
  if (showFirstAndLast) {
    if (paginationButtonCount < lastPage) {
      $("<div>", { class: "paging first", text: "<<" })
        .on("click", (event) => {
          const paging = $(event.currentTarget);
          moveToPage(1, limit, options, fnName);
        })
        .appendTo(tabPaing);
    }
  }
  //  이전 (2페이지 이상일때)
  if (1 < lastPage) {
    $("<div>", { class: "paging previous", text: "<" })
      .on("click", () => moveToPreviousPage(current, limit, options, fnName))
      .appendTo(tabPaing);
  }

  const spg =
    Math.floor(current / (paginationButtonCount + 1)) * paginationButtonCount +
    1;
  const epg = Math.min(spg + paginationButtonCount - 1, lastPage);

  for (let i = spg; i <= epg; i++) {
    const pgnumber = i;
    const elOptions = {
      class: `paging number`,
      text: pgnumber,
      "data-pg": pgnumber,
    };
    const pgElement = $("<div>", elOptions).on("click", () =>
      moveToPage(pgnumber, limit, options, fnName)
    );

    if (pgnumber === current) pgElement.addClass("current");

    pgElement.appendTo(tabPaing);
  }

  // 다음(2페이지 이상일때)
  if (1 < lastPage) {
    $("<div>", { class: "paging next", text: ">" })
      .on("click", () =>
        moveToNextPage(current, limit, lastPage, options, fnName)
      )
      .appendTo(tabPaing);
  }

  if (showFirstAndLast) {
    // 마지막으로 이동버튼(페이지가 paginationButtonCount 이상일때)
    if (paginationButtonCount < lastPage) {
      $("<div>", { class: "paging last", text: ">>" })
        .on("click", () => moveToPage(lastPage, limit, options, fnName))
        .appendTo(tabPaing);
    }
  }
}

function getQueryParam(url, key) {
  var queryStartPos = url.indexOf("?");
  if (queryStartPos === -1) {
    return;
  }
  var params = url.substring(queryStartPos + 1).split("&");
  for (var i = 0; i < params.length; i++) {
    var pairs = params[i].split("=");
    if (decodeURIComponent(pairs.shift()) == key) {
      return decodeURIComponent(pairs.join("="));
    }
  }
}
