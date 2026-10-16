axios.defaults.withCredentials = true;

console.log("remotev2");


var isVideoPlayBtnEnable = true;
var isAudioPlayBtnEnable = true;
// v-sponsor
var preset_data;
var preset_setting_data;

// luckycard
var preset_setting_data_luckycard;
// challenge lex
var preset_data_challengelex;
var preset_setting_data_challengelex;

var itemList = [];

var itemList_luckycard = [];
//var indexOfLuckyCard = 0;

var setBtn = document.getElementById("btnSetting");
var settingArea = document.querySelector(".bar-setting-area");
var currentSelectCardNum = null;

var memberData;
var arr_left_times = [];
var arr_left_times_challengelex = [];

const TABID = {
  EXCELSPONSOR: "excelsponsor",
  CHALLENGELEX: "challengelex",
  VSPONSOR: "vsponsor",
  LUCKYCARD: "luckycard",
  LUCKYRACE: "luckyrace",
  HORSERACE: "horserace",
  CHALLENGELEX_STATUS: {
    PROGRESSING: {
      NAME: "PROGRESSING",
      CODE: [2],
    },
    PENDING: {
      NAME: "pending",
      CODE: [1],
    },
    COMPLETED: {
      NAME: "COMPLETED",
      CODE: [3, 4, 5, 6],
    },
  },
};

const PAGENATION = {
  BUTTON_CONUT: {
    NORMAL: 10,
    SMALL: 5,
  },
  LIMIT: {
    LG: 30,
    MD: 6,
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

const SORT = {
  ASC: "asc",
  DESC: "desc",
  toggle: (sort) => {
    return SORT.ASC === sort ? SORT.DESC : SORT.ASC;
  },
  isAscending: (sort) => {
    return SORT.ASC === sort;
  },
};

// challengelex, vsponsor, luckycard
var currentTap = TABID.CHALLENGELEX;

function init(isApproveExcel) {
  // 도전렉스 숨김처리
  //setTimeout(getPresetChallengeLex, 0);
  setTimeout(getPresetVsponsor, 100);
  setTimeout(getPresetLuckyCard, 200);
  setTimeout(async () => {
    initExcelSig();
  }, 300);
}

//////////////////////////////////////////////////////////////럭키카드

function onGuideToggle() {
  document.querySelector(".btn.question").classList.toggle("active");

  var alarmDeletePop = new bootstrap.Modal(
    document.getElementById("alarmGuidePopup"),
    {
      keyboard: false,
    },
  );

  alarmDeletePop.show();
}

function onGuidePopupClose() {
  document.querySelector(".btn.question").classList.remove("active");
}

function showTab(tabId) {
  console.log("showTab", tabId);

  const trashBtn = $(".title-bar button.trash");
  if (tabId == "tab1") {
    removeLuckyrace();
    removeHoresrace();
    //영상 음성 재생
    currentTap = TABID.VSPONSOR;
    trashBtn.show();
  } else if (tabId == "tab2") {
    removeLuckyrace();
    removeHoresrace();
    // 럭키 카드
    currentTap = TABID.LUCKYCARD;
    trashBtn.show();
  } else if (tabId === "challengelex") {
    removeLuckyrace();
    removeHoresrace();
    currentTab = TABID.CHALLENGELEX;
    trashBtn.hide();
  } else if (tabId === "excelsponsor") {
    removeLuckyrace();
    removeHoresrace();
    currentTab = TABID.EXCELSPONSOR;
    trashBtn.show();
  } else if (tabId === "luckyrace") {
    removeHoresrace();
    currentTab = TABID.LUCKYRACE;
    trashBtn.show();
    luckyrace_init();
  } else if (tabId === "horserace") {
    removeLuckyrace();
    currentTab = TABID.HORSERACE;
    trashBtn.show();
    horserace_init();
  }

  var tabs = document.querySelectorAll(".list-alarm");
  var tabBtns = document.querySelectorAll(".tit-tab > li > a");

  tabs.forEach(function (tab) {
    tab.classList.remove("active");
  });

  tabBtns.forEach(function (btn) {
    btn.classList.remove("on");
  });

  var currentTab = document.getElementById(tabId);
  currentTab.classList.add("active");
  document.querySelector('[data-tab-id="' + tabId + '"]').classList.add("on");
}

function getLimitByTabId(tabId) {
  return CHALLENGELEX.STATUS.isCompleted(tabId)
    ? PAGENATION.LIMIT.MD
    : CHALLENGELEX.STATUS.isProgressing(tabId)
      ? PAGENATION.LIMIT.LG
      : PAGENATION.LIMIT.SM;
}

// 도전 렉스 텝
function showChallengeLexTab(id) {
  const currentTabId = getChallengeLexCurrentTabId();
  // 현재 탭 클릭
  if (id === currentTabId) {
    return;
  }

  // remove active class
  $(`.nav-tabs .nav-item .nav-link`).removeClass("active");
  // 선택한 탭 활성화
  $(`.nav-item#${id} .nav-link`).addClass("active");

  // 탭 content 활성화
  $(".list-alarm .tab-content .tab-pane").removeClass("active");
  $(`.list-alarm .tab-content .tab-pane[role="${id}"]`).addClass("active");

  const limit = getLimitByTabId(id);
  const status = CHALLENGELEX.STATUS.getStatusCodeOfTab(id);
  const sortVal = getSortValue();
  const isAscending = SORT.isAscending(sortVal);

  getChallengeMissionList(1, limit, isAscending, status);
}

function getChallengeLexCurrentTabId() {
  const tabId = $("#challengelex .nav-tabs .nav-link.active")
    .parent()
    .attr("id");
  return tabId;
}

// 도전렉스 등록
function onCreateChallengeLex() {
  // CHECK BJ도 비활성화 일경우 등록할 수 없음.
  if (preset_setting_data_challengelex.isAvailable !== "on") {
    showMessage('"도전렉스 후원"이 비활성화 상태입니다.');
    return;
  }
  // 초기화
  $("#createChallengeLexPopup input.form-control").val("");
  $("#createChallengeLexPopup input.form-check-input").prop("checked", false);
  $("#createChallengeLexPopup .modal-footer button:first").prop(
    "disabled",
    true,
  );
  $("#createChallengeLexPopup").modal({ backdrop: "static", keyboard: false });
}

// 도전렉스 등록: 유의 사항 접고 펼치기
function onToggleArea(event, selector) {
  const elToggleBtn = $(event.currentTarget);
  const elAgreeDetail = $(selector);

  const toggle = elToggleBtn.data("toggle");
  elToggleBtn.removeClass("agree-toggle-collapse");
  elToggleBtn.removeClass("agree-toggle-expand");

  switch (toggle) {
    case "expand":
      // 현재 상태가 펼침 -> 닫기로 변경
      elToggleBtn.data("toggle", "collapse");
      elToggleBtn.addClass("agree-toggle-expand");
      elAgreeDetail.hide();
      break;
    case "collapse":
      // 현재 상태가 닫기 -> 펼팀로 변경
      elToggleBtn.data("toggle", "expand");
      elToggleBtn.addClass("agree-toggle-collapse");
      elAgreeDetail.show();
      break;
  }
}
// 도전렉스 등록: 유의사항 확인
function onCheckAgree(event) {
  const agreeCheckbox = $(event.currentTarget);
  const isAgree = agreeCheckbox.is(":checked");
  const createButton = $("#createChallengeLexPopup .modal-footer button:first");
  createButton.attr("disabled", !isAgree);
}

// 도전렉스 등록 처리
function callCreateChallengeLexApiHandler() {
  // CHECK 비활성화 상태로도 이미 등록된 미션은 처리할 수 있어야 한다.
  /* if (preset_setting_data_challengelex.isAvailable !== "on") {
    showMessage('"도전렉스 후원"이 비활성화 상태입니다.');
    return;
  } */
  // 미션 내용
  const elMission = $('#createChallengeLexPopup input[name="mission"]');
  const minLen = elMission.attr("minlength") || 0;
  const mission = elMission.val() || "";

  if ("" === mission) {
    return showErrorMessage("미션내용을 입력해 주세요.");
  } else if (minLen > mission.length) {
    return showErrorMessage(
      `미션내용은 최소 ${minLen}글자이상 입력해야 합니다.`,
    );
  }
  // check valudation(최대 10일제한)
  const day = $('#createChallengeLexPopup input[name="extends-day"]').val();
  const hours = $('#createChallengeLexPopup input[name="extends-hours"]').val();
  const min = $('#createChallengeLexPopup input[name="extends-minutes"]').val();

  if (
    !isValidLimitTime(
      CHALLENGELEX.RESTRICTION.LIMIT_TIME_CREATE,
      day,
      hours,
      min,
    )
  ) {
    return showErrorMessage(`제한 시간은 최대 10일까지 가능함니다.`);
  }
  const extendSecTime =
    (day || 0) * 60 * 60 * 24 + (hours || 0) * 60 * 60 + (min || 0) * 60;
  // data
  let endDate = new Date();
  const iosEndDate = moment(endDate).add(extendSecTime, "seconds").format();

  const url = `${g_url}/api/challenge-lex/mission/add`;
  const param = { title: mission, endDate: iosEndDate };

  axios
    .post(url, param)
    .then((response) => response.data)
    .then((json) => {
      if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
        throw new Error(json.message || "");
      }
      closeModal("createChallengeLexPopup", 0);
      showMessage(`"${mission}" 도전 미션을 등록하였습니다.`);
    })
    .catch((err) => {
      console.error("🔥", err);
      const message =
        err.message || "도전미션 시간 연장 중 오류가 발생했습니다.";
      showErrorMessage(message);
    });
}
// 제한 시간
function isValidLimitTime(limittime, day, hours, minutes) {
  if (isNaN(day) || isNaN(hours) || isNaN(minutes)) {
    return showErrorMessage("시간 연장시 입력은 숫자로만 입력해 주세요");
  }

  const dayNum = parseInt(day || 0);
  const hoursNum = parseInt(hours || 0);
  const minutesNum = parseInt(minutes || 0);
  const extendSecTime =
    dayNum * 60 * 60 * 24 + hoursNum * 60 * 60 + minutesNum * 60;

  return limittime >= extendSecTime;
}

// 갱신
function refreshChallengeLex() {
  const tabId = getChallengeLexCurrentTabId();
  const status = CHALLENGELEX.STATUS.getStatusCodeOfTab(tabId);

  const sortVal = getSortValue();
  const isAscending = SORT.isAscending(sortVal);

  const limit = getLimitByTabId(tabId);
  const currentPage =
    $(".tab-pane.active .tab-paging .paging.current").data("pg") || 1;
  getChallengeMissionList(currentPage, limit, isAscending, status);
}

// 푸시 도착시 업데이트
function updateChallengeLexList(dataType) {
  const STATUS = CHALLENGELEX.STATUS;

  switch (dataType) {
    case CHALLENGELEX.DATA_TYPE.CREATE:
      // 대기
      return refreshChallengeLexWithTabId([STATUS.PENDING.CODE], 1000);
    case CHALLENGELEX.DATA_TYPE.FUND:
      // 진행 대기
      return refreshChallengeLexWithTabId(
        [STATUS.PROGRESSING.CODE, STATUS.PENDING.CODE],
        1000,
      );
    case CHALLENGELEX.DATA_TYPE.START:
      // 진행 대기
      return refreshChallengeLexWithTabId(
        [STATUS.PROGRESSING.CODE, STATUS.PENDING.CODE],
        1000,
      );
    case CHALLENGELEX.DATA_TYPE.CANCELED:
      // 진행 결과
      return refreshChallengeLexWithTabId(
        [STATUS.PENDING.CODE, STATUS.COMPLETED.CODE],
        1000,
      );
    case CHALLENGELEX.DATA_TYPE.SUCCESS:
      // 진행 결과
      return refreshChallengeLexWithTabId(
        [STATUS.PROGRESSING.CODE, STATUS.COMPLETED.CODE],
        1000,
      );
    case CHALLENGELEX.DATA_TYPE.FAILED:
      // 진행 결과
      return refreshChallengeLexWithTabId(
        [STATUS.PROGRESSING.CODE, STATUS.COMPLETED.CODE],
        1000,
      );
    case CHALLENGELEX.DATA_TYPE.EXTEND:
      // 진행 대기
      return refreshChallengeLexWithTabId(
        [STATUS.PROGRESSING.CODE, STATUS.PENDING.CODE],
        1000,
      );
  }
}

function refreshChallengeLexWithTabId(statusCodes, delay) {
  const currentTabId = getChallengeLexCurrentTabId();
  const currentTabStatusCode =
    CHALLENGELEX.STATUS.getStatus(currentTabId) || "";

  if (!currentTabStatusCode) {
    return console.error(`${currentTabId}에 대한 상태코들를 찾을 수 없습니다.`);
  }

  if (statusCodes.includes(currentTabStatusCode.CODE)) {
    delayTime = delay || 0;
    setTimeout(() => refreshChallengeLex(), delayTime);
  }
}

// 정렬 변경
function onToggleSort() {
  const tabId = getChallengeLexCurrentTabId();
  const status = CHALLENGELEX.STATUS.getStatusCodeOfTab(tabId);

  const sortVal = toggleSortValue();
  const isAscending = SORT.isAscending(sortVal);
  const limit = getLimitByTabId(tabId);

  const currentPage =
    $(".tab-pane.active .tab-paging .paging.current").data("pg") || 1;
  getChallengeMissionList(currentPage, limit, isAscending, status);
}

function toggleSortValue() {
  const sortEl = $(".tab-content .tab-pane.active .tab-option .sort");
  let sortVal = sortEl.data("sort");
  // change sort data and imgae
  sortEl.find("i").removeClass(`sort-${sortVal.toLowerCase()}`);
  sortVal = SORT.toggle(sortVal);
  sortEl.data("sort", sortVal);
  sortEl.find("i").addClass(`sort-${sortVal.toLowerCase()}`);

  return sortVal;
}

function getSortValue() {
  const sortEl = $(".tab-content .tab-pane.active .tab-option .sort");
  return sortEl.data("sort");
}

// 카드 리스트 오픈
function openCardList(target, cardNum, reqkey) {
  //console.log('openCardList target~', target.textContent,target.innerHTML )
  if (isCardAniPlaying) {
    alert("진행하고있는 카드모션이 있습니다. 잠시만 기다려주세요");
    return;
  }

  currentSelectCardNum = null;
  if (target.textContent == "완료") {
    return;
  }
  var dropItem = target.nextElementSibling;
  var getConfirmValue = dropItem.getAttribute("data-confirm");
  var getCardValue = dropItem.getAttribute("data-card-value");

  closeCardList(dropItem, getConfirmValue, cardNum, reqkey);
  dropItem.classList.add("on");
}

function closeSelectBtns() {
  var dropItemArray = document.querySelectorAll(".card-area");
  // 카드리스트 닫으면서 리스트 초기화
  dropItemArray.forEach(function (list) {
    list.classList.remove("on");
    list.innerHTML = "";
  });
}

// 카드 리스트 닫힘
function closeCardList(_item, _confirm, cardNum, reqkey) {
  // console.log('closeCardList',  _item, _confirm)

  var dropItemArray = document.querySelectorAll(".card-area");
  // 카드리스트 오픈 상태이면서 같은 카드리스트 오픈 클릭 시
  if (
    _item.classList.contains("on") &&
    _item.getAttribute("data-card-value") !== 0 &&
    _item.getAttribute("data-confirm") == "false"
  ) {
    return false;
  }

  // 카드 만 선택 할 경우 초기화
  if (_confirm == "false") {
    _item.setAttribute("data-card-value", 0);
    _item.classList.remove("active");
  }

  // 카드리스트 닫으면서 리스트 초기화
  dropItemArray.forEach(function (list) {
    list.classList.remove("on");
    list.innerHTML = "";
  });

  makeCardList(_item, _item.getAttribute("data-card-value"), cardNum, reqkey);
}

function makeCardList(_item, _value, cardNum, reqkey) {
  //console.log('makeCardList', _item, _value);

  for (let i = 0; i < cardNum; i++) {
    let idx = i + 1;
    var addBtn = `<button type="button" class="btn btn-card" value="${idx}" onclick="onCardSelected(this, value)">${idx}</button>`;

    if (idx == _value) {
      var addBtn = `<button type="button" class="btn btn-card active" value="${idx}" onclick="onCardSelected(this, value)">${idx}</button>`;
      _item.innerHTML += addBtn;
    } else {
      _item.innerHTML += addBtn;
    }
  }
  _item.innerHTML += `<button type="button" class="btn btn-confirm" value="confirm" onclick="onCardSelected(this, value,  ${reqkey})">선택</button>`;
  _item.innerHTML += '<span class="arrow-up"></span>';
  _item.innerHTML +=
    '<span onclick="closeSelectBtns();" style="position:absolute; top:-10px; right:-10px; border-radius:999px; display:inline-flex; justify-content:center; align-items:center; width:18px; height:18px; cursor:pointer; background-color:#000; color:#fff; font-size:16px;">&times;</span>';
}

function setReadLuckyCard(reqkey) {
  //console.log("setReadLuckyCard", reqkey)
  for (let i = 0; i < itemList_luckycard.length; i++) {
    var t_item = itemList_luckycard[i];
    //console.log("setReadLuckyCard:", t_item.reqkey, t_item.status, t_item.isRead)
    if (t_item.reqkey == reqkey) {
      t_item.isRead = true;
      break;
    }
  }

  for (let i = 0; i < arr_left_times.length; i++) {
    var _item = arr_left_times[i];

    if (_item.reqkey == reqkey) {
      $("#" + _item.id).text("00분 00초");
      arr_left_times.splice(i, 1);
      break;
    }
  }
}

var isCardAniPlaying = false;

function sendLuckycardSelect(selectCard, reqkey) {
  axios
    .post(g_url + "/preset/luckycardselect", {
      reqkey: reqkey,
      selectCard: selectCard,
    })
    .then(function (response) {
      let json = response.data;
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
          isCardAniPlaying = true;
          setTimeout(() => {
            isCardAniPlaying = false;
          }, 1000 * 20);

          setReadLuckyCard(reqkey);

          if (arr_left_times.length < 1) {
            setAlramMark_luckycard("off");
          }

          alert("럭키카드 선택완료");
        } else {
          alert(json.message);
        }
      } else {
        alert(json.message);
      }
    })
    .catch(function (error) {})
    .then(function () {
      // always executed
    });
}

// 카드 선택 시
function onCardSelected(target, value, reqkey = null) {
  //console.log('onCardSelected', value, reqkey )

  var targetParent = target.parentNode;
  var parentSibling = targetParent.previousElementSibling;
  var btns = targetParent.querySelectorAll(".btn-card");

  //currentSelectCardNum = null;

  // 카드 리스트 안에 선택 버튼까지 클릭 했을 경우
  if (value == "confirm") {
    if (targetParent.getAttribute("data-card-value") == 0) {
      alert("카드를 선택하여 주세요.");
      return false;
    } else {
      targetParent.setAttribute("data-confirm", true);
      parentSibling.textContent = "완료";
      parentSibling.style.opacity = "0.6";
      closeCardList(targetParent, targetParent.getAttribute("data-confirm"));
      sendLuckycardSelect(currentSelectCardNum, reqkey);
    }
  } else {
    // 카드 선택이 완료 된 후 재 선택 시 버튼 텍스트 교체
    var parentSiblingText = parentSibling.textContent;
    if (parentSiblingText.indexOf("완료") !== -1) {
      parentSibling.textContent = "선택";
      parentSibling.style.opacity = "1";
    }

    currentSelectCardNum = value;

    // 카드만 선택 했을 경우 초기화
    btns.forEach(function (btn) {
      btn.classList.remove("active");
    });

    targetParent.setAttribute("data-card-value", value);
    targetParent.setAttribute("data-confirm", false);
    targetParent.classList.add("active");
    target.classList.add("active");
  }
}

//////////////////////////////////////////////////////////////////////////////

function onSettingToggle() {
  //console.log("preset_setting_data", preset_setting_data)
  setBtn.classList.toggle("active");
  settingArea.classList.toggle("on");

  $("#settingVideoYn").prop(
    "checked",
    preset_setting_data.isVideoSponStt == "on",
  );
  $("#settingAudioYn").prop(
    "checked",
    preset_setting_data.isAudioSponStt == "on",
  );

  $("#settingChallengeLexYn").prop(
    "checked",
    preset_setting_data_challengelex.isAvailable == "on",
  );
}

function onSettingClose() {
  setBtn.classList.remove("active");
  settingArea.classList.remove("on");
}

// 삭제 팝업
function onSettingDeletePopup() {
  var alarmDeletePop = new bootstrap.Modal(
    document.getElementById("alarmDeletePopup"),
    {
      keyboard: false,
    },
  );

  alarmDeletePop.show();
}

function alarmDeleteConfirm() {
  // console.log(111111);
  if (currentTap === TABID.VSPONSOR) {
    deleteReadedItem();
  } else if (currentTap === TABID.LUCKYCARD) {
    deleteReadedItem_luckycard();
  }
}

function sendDeletItems(arr) {
  axios
    .post(g_url + "/preset/messagedelete", {
      reqkeys: arr,
    })
    .then(function (response) {
      let json = response.data;
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
          alert("삭제하였습니다.");
          if (currentTap == TABID.VSPONSOR) {
            arr.forEach((element) => {
              deleteItem(element);
            });
          } else if (currentTap == TABID.LUCKYCARD) {
            arr.forEach((element) => {
              deleteItem_luckycard(element);
            });
          }
        } else {
          alert(json.message);
        }
      } else {
        alert(json.message);
      }
    })
    .catch(function (error) {})
    .then(function () {
      // always executed
    });
}

function deleteItem(key) {
  for (let i = 0; i < itemList.length; i++) {
    var item = itemList[i];
    if (item.reqkey == key) {
      itemList.splice(i, 1);
      //console.log("itemList", itemList)
      break;
    }
  }
}

function deleteItem_luckycard(key) {
  for (let i = 0; i < itemList_luckycard.length; i++) {
    var item = itemList_luckycard[i];
    if (item.reqkey == key) {
      itemList_luckycard.splice(i, 1);
      //console.log("itemList_luckycard", itemList_luckycard)
      break;
    }
  }
}

function deleteReadedItem_luckycard() {
  var arrDeleteItemReqkeys = [];
  itemList_luckycard.forEach((element) => {
    //console.log("isRead:", element.isRead)
    if (element.isRead) {
      element.remove();
      arrDeleteItemReqkeys.push(element.reqkey);
    }
  });

  sendDeletItems(arrDeleteItemReqkeys);
}

function deleteReadedItem() {
  var arrDeleteItemReqkeys = [];
  itemList.forEach((element) => {
    //console.log("isRead:", element.isRead)
    if (element.isRead) {
      element.remove();
      arrDeleteItemReqkeys.push(element.reqkey);
    }
  });

  sendDeletItems(arrDeleteItemReqkeys);
}

function numberWithCommas(x) {
  if (x == null) return "";
  if (isNaN(x)) return 0;
  // return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");

  const parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

// scroll to top
function onScrollToTop() {
  $(".remote-alarm-area").animate({ scrollTop: 0 }, 300);
}

const remoteScrollTop = document.querySelector(".remote-alarm-area");
var scrollBtn = document.querySelector(".remote-goto-top");

remoteScrollTop.addEventListener("scroll", () => {
  var scrWaiting = false;
  // console.log(remoteScrollTop.scrollTop)

  if (remoteScrollTop.scrollTop > 100) {
    scrollBtn.style.display = "block";
  } else {
    scrollBtn.style.display = "none";
  }
});

function startSocket(_key) {
  console.log("startSocket:", _key);
  const socket = io(g_url_socket, {
    autoConnect: false,
    //secure: true,
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    console.log("conneected key: ", _key); // true
    // get_data(_key)
    socket.emit(
      "remote",
      {
        uid: memberData.MEMBER_UID,
        mid: memberData.MID,
      },
      function (data) {
        console.log(data);
      },
    );
  });

  socket.on("disconnect", function (data) {
    console.log("disconnect~~~~~~~remote", data);
    // alert("통신이 끊어졌습니다");
  });

  socket.on("notice", function (data) {
    // console.log("🌸🌼 [remote]notice", data);
    switch (data.type) {
      case "9": {
        // 럭키카드
        // data.reqkey = data.reqkey;
        //_lData.time = data.CREATIONDATE;
        data.exp_time = data.expirationDate;
        data.status = 3;

        createLuckyCardItem(data);
        break;
      }
      case CHALLENGELEX.DATA_TYPE.CREATE:
      case CHALLENGELEX.DATA_TYPE.FUND:
      case CHALLENGELEX.DATA_TYPE.START:
      case CHALLENGELEX.DATA_TYPE.CANCELED:
      case CHALLENGELEX.DATA_TYPE.SUCCESS:
      case CHALLENGELEX.DATA_TYPE.FAILED:
      case CHALLENGELEX.DATA_TYPE.EXTEND: {
        updateChallengeLexList(data.type);
        break;
      }
      case EXCEL.DATA_TYPE.ADD_SPONSOR:
      case EXCEL.DATA_TYPE.SEND_SPONSOR: {
        excelSig.sendSponsor(data);
        break;
      }
    }
    /* if (data.type == "9") {
      // data.reqkey = data.reqkey;
      //_lData.time = data.CREATIONDATE;
      data.exp_time = data.expirationDate;
      data.status = 3;

      createLuckyCardItem(data);
    } */
  });

  socket.on("eventaction", function (data) {
    data.status = "3";
    switch (data.type) {
      case "7":
        if (preset_setting_data.isVideoSponStt == "on") {
          getVideoInfo(data);
        }
        break;
      case "8":
        if (preset_setting_data.isAudioSponStt == "on") {
          createAudioItem(data);
        }
        break;
      case EXCEL.DATA_TYPE.CHANGE_PROJECT:
        excelSig.changeProjectInfo(data);
        break;
      case EXCEL.DATA_TYPE.START_PROJECT:
        excelSig.startExcel();
        break;
      case EXCEL.DATA_TYPE.END_PROJECT:
      case EXCEL.DATA_TYPE.STOP_PROJECT:
        excelSig.endExcel();
        break;
    }
  });

  socket.on("broadcasting-excel-sig", function (data) {
    excelSig.sigEvent(data);
  });

  socket.on("testMessage", function (data) {
    console.log("testMessage remote", data);
  });

  socket.open();
}

function getVideoInfo(data) {
  const _url = new URL(data.url);
  var arrPath = _url.pathname.split("/");
  //console.log('arrPath :', arrPath, _url.pathname, _url)
  var y_id = null;
  var url = null;
  if (arrPath.includes("shorts")) {
    y_id = arrPath.at(-1);

    //url =  'https://www.youtube.com/shorts/' + y_id;
    url = "https://www.youtube.com/watch?v=" + y_id;
  } else {
    if (_url.hostname == "youtu.be") {
      y_id = _url.pathname.split("/")[1];
      url = "https://www.youtube.com/watch?v=" + y_id;
    } else {
      var urlParams = _url.searchParams;
      y_id = urlParams.get("v");
      url = "https://www.youtube.com/watch?v=" + y_id;
    }
  }

  // console.log("url: ", url)

  data.url = url;

  $.getJSON(
    "https://noembed.com/embed",
    { format: "json", url: url },
    function (y_data) {
      // console.log("y_data:", y_data)
      createVideoItem(data, y_data);
    },
  );
}

function createVideoItem(data, y_data) {
  var startTimeStr = moment
    .utc(parseInt(data.startSec) * 1000)
    .format("HH:mm:ss");
  var endTimeStr = moment.utc(parseInt(data.endSec) * 1000).format("HH:mm:ss");

  var btn_play;
  var btn_skip;
  var btn_replay;

  var stauts_light;

  if (data.status == "3") {
    setAlramMark_vspon("on");

    stauts_light = $("<i>").addClass("status-unread").text("읽지않은메세지");
    btn_play = $("<button>")
      .attr("type", "button")
      .addClass("btn on")
      .attr("title", "play")
      .append($("<i>").addClass("play"));
    btn_skip = $("<button>")
      .attr("type", "button")
      .addClass("btn on")
      .attr("title", "skip")
      .append($("<i>").addClass("skip"));
    btn_replay = $("<button>")
      .attr("type", "button")
      .addClass("btn")
      .attr("title", "replay")
      .append($("<i>").addClass("replay"));
  } else {
    if (data.status == "2") {
      stauts_light = $("<i>").addClass("status-skip").text("읽은메세지");
    } else {
      stauts_light = $("<i>").addClass("status-playing").text("읽은메세지");
    }

    //stauts_light =  $("<i>").addClass("status-playing").text("읽은메세지");

    btn_play = $("<button>")
      .attr("type", "button")
      .addClass("btn")
      .attr("title", "play")
      .append($("<i>").addClass("play"));
    btn_skip = $("<button>")
      .attr("type", "button")
      .addClass("btn")
      .attr("title", "skip")
      .append($("<i>").addClass("skip"));
    btn_replay = $("<button>")
      .attr("type", "button")
      .addClass("btn on")
      .attr("title", "replay")
      .append($("<i>").addClass("replay"));
  }

  var timeStr;
  if (data.time) {
    timeStr = moment
      .utc(data.time, "YYYY-MM-DD HH:mm:ss")
      .local()
      .format("YY.MM.DD HH:mm:ss");
  } else {
    timeStr = moment(new Date()).format("YY.MM.DD HH:mm:ss");
  }

  var t_videoItem = $("<div>")
    .addClass("list-item")
    .append(
      $("<div>")
        .addClass("item-status")
        .append($("<span>").append(stauts_light)),
    )
    .append(
      $("<div>")
        .addClass("item-message")
        .append(
          $("<span>")
            .addClass("txt")
            .text(data.nick + "님이 ")
            .append(
              $("<span>")
                .addClass("rex")
                .text(numberWithCommas(parseInt(data.lex)) + " 렉스를 후원"),
            )
            .append($("<span>").addClass("txt").text(" 했습니다"))
            .append($("<span>").addClass("time").text(timeStr)),
        ),
    )
    .append(
      $("<div>")
        .addClass("item-source")
        .append(
          $("<div>")
            .addClass("video")
            .append(
              $("<div>")
                .addClass("thumb")
                .append(
                  // $("<img>").attr('src', "https://img.youtube.com/vi/"+y_id+"/maxresdefault.jpg")
                  $("<img>").attr("src", y_data.thumbnail_url),
                )
                .on("click", function () {
                  console.log("click ...", data);
                  window.open(data.url, "_blank");
                })
                .css("cursor", "pointer"),
            )
            .append(
              $("<div>")
                .addClass("content")
                .append($("<span>").addClass("subject").text(y_data.title))
                .append(
                  $("<span>")
                    .addClass("source")
                    .append($("<span>").text(y_data.author_name))
                    .append($("<span>").text("  . YouTube      ."))
                    .append(
                      $("<span>").text(
                        "      재생구간: " + startTimeStr + " ~ " + endTimeStr,
                      ),
                    ),
                ),
            ),
        )
        .append(
          $("<div>")
            .addClass("control")
            .append(btn_play)
            .append(btn_skip)
            .append(btn_replay),
        ),
    );

  btn_play.on("click", function () {
    if (btn_play.hasClass("on") && isVideoPlayBtnEnable) {
      console.log("btn_play");
      btn_play.removeClass("on");
      btn_skip.removeClass("on");
      btn_replay.addClass("on");
      playVideo(data);

      stauts_light.removeClass("status-unread");
      stauts_light.addClass("status-playing");
      t_videoItem.isRead = true;
      setMessageRead(t_videoItem.reqkey, "1");
    }
  });

  btn_skip.on("click", function () {
    if (btn_skip.hasClass("on") && isVideoPlayBtnEnable) {
      console.log("btn_skip");
      btn_play.removeClass("on");
      btn_skip.removeClass("on");
      btn_replay.addClass("on");

      stauts_light.removeClass("status-unread");
      stauts_light.addClass("status-skip");
      t_videoItem.isRead = true;
      setMessageRead(t_videoItem.reqkey, "2");
    }
  });

  btn_replay.on("click", function () {
    if (btn_replay.hasClass("on") && isVideoPlayBtnEnable) {
      console.log("btn_replay");
      // btn_replay.removeClass("on");
      playVideo(data);
      t_videoItem.isRead = true;
      if (stauts_light.hasClass("status-skip")) {
        stauts_light.removeClass("status-skip");
        stauts_light.addClass("status-playing");
      }
    }
  });

  $("#tab1").prepend(t_videoItem);
  // t_videoItem.isRead = false;
  if (data.status == "3") {
    t_videoItem.isRead = false;
  } else {
    t_videoItem.isRead = true;
  }
  t_videoItem.reqkey = data.reqkey;
  itemList.unshift(t_videoItem);
}

function playVideo(data) {
  isVideoPlayBtnEnable = false;
  setTimeout(function () {
    isVideoPlayBtnEnable = true;
  }, 1000);
  var param = {};
  param.type = "v_sponsor";
  param.data = data;
  param.data.type = "17";
  axios
    .post(g_url + "/preset/eventaction", param)
    .then(function (response) {
      let json = response.data;
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
        } else {
          alert(json.message);
        }
      } else {
        alert(json.message);
      }
    })
    .catch(function (error) {})
    .then(function () {
      // always executed
    });
}

function getLeftTime(endTime) {
  var result;
  var min_str;
  var sec_str;
  var hour_str;

  var end = moment.utc(endTime).format("YYYY-MM-DD HH:mm:ss");
  var end_stillUtc = moment.utc(end).toDate();
  var end_local = moment(end_stillUtc).local().format("YYYY-MM-DD HH:mm:ss");

  // var end = moment(endTime, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");
  var now = moment(new Date());
  var duration = moment.duration(now.diff(end_local));

  if (Math.sign(duration) == -1) {
    hour_str = moment(duration.hours(), "hh").format("HH");
    min_str = moment(duration.minutes(), "mm").format("mm");
    sec_str = moment(duration.seconds(), "ss").format("ss");
    result =
      parseInt(hour_str) * 60 + parseInt(min_str) + "분 " + sec_str + "초";
  } else {
    result = "00분 00초";
  }

  // console.log('getLeftTime', result)
  return result;
}

// 남은시간 계산
function getLeftTimeChallengeLex(endTime) {
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

function updateLeftSec() {
  //console.log('updateLeftSec')
  arr_left_times.forEach((element) => {
    $("#" + element.id).text(getLeftTime(element.exp_time));
  });

  arr_left_times_challengelex.forEach((element) => {
    const [sec, isEndTime] = getLeftTimeChallengeLex(element.endDate);

    $("#" + element.id).text(sec);
    if (isEndTime) {
      removeLeftSec(element.id);
    }
  });
}

function removeLeftSec(id) {
  //비활성화
  $(`#${id}`).parents(".card-outline").addClass("disabled");
  $(`#${id}`).parents(".card-outline").data("disabled", "true");
  arr_left_times_challengelex = arr_left_times_challengelex.filter(
    (e) => e.id !== id,
  );
}

var intervalId_leftTime;

intervalId_leftTime = setInterval(updateLeftSec, 1000);

function createLuckyCardItem(data) {
  //indexOfLuckyCard ++;
  // data.index = indexOfLuckyCard;
  //임시
  //"2024-04-29T06:54:52.130Z"
  //console.log('createLuckyCardItem:', data)
  //if(!data.exp_time)data.exp_time = '2024-05-30T22:50:00.000'
  var end = moment.utc(data.exp_time).format("YYYY-MM-DD HH:mm:ss");
  var end_stillUtc = moment.utc(end).toDate();
  var end_local = moment(end_stillUtc).local().format("YYYY-MM-DD HH:mm:ss");

  //console.log("createLuckyCardItem end_local",end_local , 'data.exp_time:', data.exp_time , moment(new Date()).format("YYYY-MM-DD HH:mm:ss"))
  var now = moment(new Date());
  var duration = moment.duration(now.diff(end_local));
  //console.log("duration:", Math.sign(duration),  moment(duration.hours(),"hh").format("HH"), moment(duration.minutes(),"mm").format("mm"),  moment(duration.seconds(),"ss").format("ss"))
  var selectBtn;
  if (data.status == "3" && Math.sign(duration) == -1) {
    setAlramMark_luckycard("on");

    selectBtn = $("<button>")
      .attr("id", "button-" + data.reqkey)
      .attr("type", "button")
      .addClass("btn")
      .text("선택");
    setTimeout(() => {
      var button = document.getElementById("button-" + data.reqkey);
      console.log("button~:", button);
      button.onclick = function (e) {
        alert(
          "프리셋 URL을 송출 프로그램에 추가하지 않고 카드 선택 시 방송화면에 송출되지 않습니다. 프리셋 URL을 꼭 송출 프로그램에 추가 후 카드를 선택해 주세요.",
        );
        openCardList(button, data.cardCount, data.reqkey);
      };
    }, 0);
  } else {
    selectBtn = $("<button>")
      .attr("id", "button-" + data.reqkey)
      .attr("type", "button")
      .addClass("btn")
      .text("완료")
      .css("opacity", "0.6");
  }

  //console.log("createLuckyCardItem >:", data);
  var t_luckycard = $("<div>")
    .addClass("alarm-box")
    .append(
      $("<div>")
        .addClass("nick")
        .append($("<span>").text(data.nick))
        .append($("<p>").text("(" + data.mid + ")")),
    )
    .append(
      $("<div>")
        .addClass("count")
        .append($("<span>").text(numberWithCommas(parseInt(data.maxLex)))),
    )
    .append(
      $("<div>")
        .addClass("time")
        .append(
          $("<p>")
            .attr("id", "left-time-" + data.reqkey)
            .text("00분 00초"),
        ),
    )
    .append(
      $("<div>")
        .addClass("card-select")
        .append(
          // $("<button>").attr('id', 'button-' + data.index).attr('type', 'button').addClass("btn").text('선택')
          selectBtn,
        )
        .append($("<div>").addClass("card-area").attr("data-card-value", 0)),
    );

  if (data.status == "3" && Math.sign(duration) == -1) {
    t_luckycard.isRead = false;
  } else {
    t_luckycard.isRead = true;
  }

  t_luckycard.reqkey = data.reqkey;
  t_luckycard.status = data.status;
  itemList_luckycard.unshift(t_luckycard);

  $("#luckyCardGameList").prepend(t_luckycard);

  if (data.status == "3" && Math.sign(duration) == -1) {
    $("#left-time-" + data.reqkey).text(getLeftTime(data.exp_time));
    let t_obj = {};
    t_obj.reqkey = data.reqkey;
    t_obj.id = "left-time-" + data.reqkey;
    t_obj.exp_time = data.exp_time;
    arr_left_times.push(t_obj);
  }
}

function createAudioItem(data) {
  var secStr;
  var timeStr;

  if (data.time) {
    timeStr = moment(data.time, "YYYY-MM-DD HH:mm:ss")
      .local()
      .format("YY.MM.DD HH:mm:ss");
  } else {
    timeStr = moment(new Date()).format("YY.MM.DD HH:mm:ss");
  }

  if (data.sec) {
    secStr = " - " + moment.utc(parseInt(data.sec) * 1000).format("HH:mm:ss");
  } else {
    secStr = "";
  }

  var btn_play;
  var btn_skip;
  var btn_replay;

  // var stauts_light =  $("<i>").addClass("status-unread").text("읽지않은메세지")

  var stauts_light;
  if (data.status == "3") {
    setAlramMark_vspon("on");
    stauts_light = $("<i>").addClass("status-unread").text("읽지않은메세지");

    btn_play = $("<button>")
      .attr("type", "button")
      .addClass("btn on")
      .attr("title", "play")
      .append($("<i>").addClass("play"));
    btn_skip = $("<button>")
      .attr("type", "button")
      .addClass("btn on")
      .attr("title", "skip")
      .append($("<i>").addClass("skip"));
    btn_replay = $("<button>")
      .attr("type", "button")
      .addClass("btn")
      .attr("title", "replay")
      .append($("<i>").addClass("replay"));
  } else {
    if (data.status == "2") {
      stauts_light = $("<i>").addClass("status-skip").text("읽은메세지");
    } else {
      stauts_light = $("<i>").addClass("status-playing").text("읽은메세지");
    }

    btn_play = $("<button>")
      .attr("type", "button")
      .addClass("btn")
      .attr("title", "play")
      .append($("<i>").addClass("play"));
    btn_skip = $("<button>")
      .attr("type", "button")
      .addClass("btn")
      .attr("title", "skip")
      .append($("<i>").addClass("skip"));
    btn_replay = $("<button>")
      .attr("type", "button")
      .addClass("btn on")
      .attr("title", "replay")
      .append($("<i>").addClass("replay"));
  }

  var t_audioItem = $("<div>")
    .addClass("list-item")
    .append(
      $("<div>")
        .addClass("item-status")
        .append($("<span>").append(stauts_light)),
    )
    .append(
      $("<div>")
        .addClass("item-message")
        .append(
          $("<span>")
            .addClass("txt")
            .text(data.nick + "님이 ")
            .append(
              $("<span>")
                .addClass("rex")
                .text(numberWithCommas(parseInt(data.lex)) + " 렉스를 후원"),
            )
            .append($("<span>").addClass("txt").text(" 했습니다"))
            .append($("<span>").addClass("time").text(timeStr)),
        ),
    )
    .append(
      $("<div>")
        .addClass("item-source")
        .append(
          $("<div>")
            .addClass("audio")
            .text("음성 파일" + secStr)
            .css("cursor", "pointer")
            .on("click", function () {
              console.log("click ...", data);
              window.open(data.url, "_blank");
            }),
        )
        .append(
          $("<div>")
            .addClass("control")
            .append(btn_play)
            .append(btn_skip)
            .append(btn_replay),
        ),
    );

  btn_play.on("click", function () {
    if (btn_play.hasClass("on") && isAudioPlayBtnEnable) {
      // console.log("btn_play")
      btn_play.removeClass("on");
      btn_skip.removeClass("on");
      btn_replay.addClass("on");
      playAudio(data);

      stauts_light.removeClass("status-unread");
      stauts_light.addClass("status-playing");
      t_audioItem.isRead = true;
      setMessageRead(t_audioItem.reqkey, "1");
    }
  });

  btn_skip.on("click", function () {
    if (btn_skip.hasClass("on") && isAudioPlayBtnEnable) {
      // console.log("btn_skip")
      btn_play.removeClass("on");
      btn_skip.removeClass("on");
      btn_replay.addClass("on");

      stauts_light.removeClass("status-unread");
      stauts_light.addClass("status-skip");
      t_audioItem.isRead = true;
      setMessageRead(t_audioItem.reqkey, "2");
    }
  });

  btn_replay.on("click", function () {
    if (btn_replay.hasClass("on") && isAudioPlayBtnEnable) {
      //console.log("btn_replay")
      //btn_replay.removeClass("on");
      playAudio(data);
      t_audioItem.isRead = true;

      if (stauts_light.hasClass("status-skip")) {
        stauts_light.removeClass("status-skip");
        stauts_light.addClass("status-playing");
      }
    }
  });
  $("#tab1").prepend(t_audioItem);
  if (data.status == "3") {
    t_audioItem.isRead = false;
  } else {
    t_audioItem.isRead = true;
  }

  t_audioItem.reqkey = data.reqkey;
  itemList.unshift(t_audioItem);
}

function playAudio(data) {
  isAudioPlayBtnEnable = false;
  setTimeout(function () {
    isAudioPlayBtnEnable = true;
  }, 1000);
  var param = {};
  param.type = "v_sponsor";
  param.data = data;
  param.data.type = "18";
  axios
    .post(g_url + "/preset/eventaction", param)
    .then(function (response) {
      let json = response.data;
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
        } else {
          alert(json.message);
        }
      } else {
        alert(json.message);
      }
    })
    .catch(function (error) {})
    .then(function () {
      // always executed
    });
}

function createDefaultJson_luckycard() {
  var jsonObj = {};

  jsonObj.isAvailable = "off";

  jsonObj.min_lex = "100";
  jsonObj.payback_time = "15";
  jsonObj.noti_text = "{닉네임}님 렉스{개수}개 럭키카드를 등록하셨습니다.";
  jsonObj.noti_type = "알림음성";
  jsonObj.is_chat_voice = "off";

  jsonObj.nick_font_name = "ff-28";
  jsonObj.nick_font_bold = "off";
  jsonObj.nick_font_size = 16;
  jsonObj.nick_font_color = "#00FFF6";

  jsonObj.lex_font_name = "ff-28";
  jsonObj.lex_font_bold = "off";
  jsonObj.lex_font_size = 16;
  jsonObj.lex_font_color = "#ffffff";

  jsonObj.time_font_name = "ff-28";
  jsonObj.time_font_bold = "off";
  jsonObj.time_font_size = 16;
  jsonObj.time_font_color = "#ffffff";

  return jsonObj;
}

function createDefaultJson_challengeLex() {
  var jsonObj = {};

  jsonObj.isAvailable = "off";

  jsonObj.min_lex = "100";
  jsonObj.payback_time = "15";
  jsonObj.noti_text = "{닉네임}님 플렉스{개수}개 럭키카드를 등록하셨습니다.";
  jsonObj.noti_type = "알림음성";
  jsonObj.is_chat_voice = "off";

  jsonObj.nick_font_name = "ff-28";
  jsonObj.nick_font_bold = "off";
  jsonObj.nick_font_size = 16;
  jsonObj.nick_font_color = "#00FFF6";

  jsonObj.lex_font_name = "ff-28";
  jsonObj.lex_font_bold = "off";
  jsonObj.lex_font_size = 16;
  jsonObj.lex_font_color = "#ffffff";

  jsonObj.time_font_name = "ff-28";
  jsonObj.time_font_bold = "off";
  jsonObj.time_font_size = 16;
  jsonObj.time_font_color = "#ffffff";

  return jsonObj;
}

function createDefaultJson() {
  var jsonObj = {};

  jsonObj.isVideoSponStt = "off";
  jsonObj.v_minSponLex = 10;
  jsonObj.v_oneSecForLex = 1;
  jsonObj.v_maxVideoSec = 60;
  jsonObj.v_autoPlay = "off";
  jsonObj.v_videoVolume = 70;
  jsonObj.v_filterLevel = 1;

  jsonObj.isAudioSponStt = "off";
  jsonObj.a_minSponLex = 10;
  jsonObj.a_oneSecForLex = 1;
  jsonObj.a_maxAudioSec = 60;
  jsonObj.a_autoPlay = "off";
  jsonObj.a_audioVolume = 70;
  //console.log("createDefaultJson:", JSON.stringify(jsonObj))
  //return JSON.stringify(jsonObj)
  return jsonObj;
}

function createPreset() {
  axios
    .post(g_url + "/preset/createpreset", {
      type: "v_sponsor",
    })
    .then(function (response) {
      let json = response.data;
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
          console.log("createPreset success: ", json);
          //  $('.spinner-border').css("display", "none");

          var t_data = json.resultMap.dataRow;
          t_data.DATA = createDefaultJson();
          preset_setting_data = t_data.DATA;
          preset_data = t_data;
          //addPresetBtn(t_data);
          //  selectPresetBtn($(".preset-list-box").children('#' + t_data.ID))
        } else {
          alert(json.message);
        }
      } else {
        alert(json.message);
      }
    })
    .catch(function (error) {})
    .then(function () {
      // always executed
    });
}

function createPreset_luckycard() {
  console.log("createPreset_luckycard~~~");
  axios
    .post(g_url + "/preset/createpreset", {
      type: "luckycard",
    })
    .then(function (response) {
      let json = response.data;
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
          console.log("createPreset success: ", json);
          //  $('.spinner-border').css("display", "none");

          var t_data = json.resultMap.dataRow;
          t_data.DATA = createDefaultJson_luckycard();
          preset_setting_data_luckycard = t_data.DATA;
          //preset_data = t_data
          //addPresetBtn(t_data);
          //  selectPresetBtn($(".preset-list-box").children('#' + t_data.ID))
        } else {
          alert(json.message);
        }
      } else {
        alert(json.message);
      }
    })
    .catch(function (error) {})
    .then(function () {
      // always executed
    });
}

function createPreset_challengeLex() {
  console.log("createPreset_challengeLex~~~");
  axios
    .post(g_url + "/preset/createpreset", {
      type: "challenge-lex",
    })
    .then(function (response) {
      let json = response.data;
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
          console.log("[challenge lex] createPreset success: ", json);
          //  $('.spinner-border').css("display", "none");

          var t_data = json.resultMap.dataRow;
          t_data.DATA = createDefaultJson_challengeLex();
          preset_setting_data_challengelex = t_data.DATA;
          preset_data_challengelex = t_data;
          //addPresetBtn(t_data);
          //  selectPresetBtn($(".preset-list-box").children('#' + t_data.ID))
        } else {
          alert(json.message);
        }
      } else {
        alert(json.message);
      }
    })
    .catch(function (error) {})
    .then(function () {
      // always executed
    });
}

function getPresetVsponsor() {
  //console.log("getPresetList ~: ")
  //arr_preset_list = [];
  axios
    .get(g_url + "/preset/getpresetlist?type=v_sponsor")
    .then(function (response) {
      let json = response.data;

      if (json.returnCode == 1) {
        if (json.resultMap.returnVal != 1) {
          alert(json.message);
          return;
        }
        console.log("getPresetList success: ", json.resultMap.dataList);
        if (json.resultMap.dataList) {
          $.each(json.resultMap.dataList, function (index, data) {
            if (data.DATA == null) {
              data.DATA = createDefaultJson();
              preset_setting_data = data.DATA;
              console.log("getPresetList data가 없다: ", index, data);
            } else {
              preset_setting_data = JSON.parse(data.DATA);
            }
            preset_data = data;
          });

          getSponList();
        } else {
          console.log("하나도 없을시 데이터 생성: ");
          createPreset();
          //하나도 없을시 데이터 생성
        }

        //console.log("getPresetVsponsor  startSocket")
        addEvent();
        startSocket(preset_data.PAGE);
      } else {
        alert(json.message);
      }
    })
    .catch(function (error) {})
    .then(function () {
      // always executed
    });
}

function getPresetLuckyCard() {
  //console.log("getPresetLuckyCard ~: ")
  //arr_preset_list = [];
  axios
    .get(g_url + "/preset/getpresetlist?type=luckycard")
    .then(function (response) {
      let json = response.data;

      if (json.returnCode == 1) {
        if (json.resultMap.returnVal != 1) {
          alert(json.message);
          return;
        }
        console.log(
          "[luckycard] getPresetList success: ",
          json.resultMap.dataList,
        );
        if (json.resultMap.dataList) {
          $.each(json.resultMap.dataList, function (index, data) {
            if (data.DATA == null) {
              data.DATA = createDefaultJson_luckycard();
              preset_setting_data_luckycard = data.DATA;
              console.log("getPresetList data가 없다: ", index, data);
            } else {
              preset_setting_data_luckycard = JSON.parse(data.DATA);
            }
            //preset_data = data;
          });

          console.log("getSponList_luckycard111");
          getSponList_luckycard();
          //addEvent();
          // startSocket(preset_data.PAGE);
        } else {
          console.log("하나도 없을시 데이터 생성: ");
          createPreset_luckycard();
          //하나도 없을시 데이터 생성
        }
      } else {
        alert(json.message);
      }
    })
    .catch(function (error) {})
    .then(function () {
      // always executed
    });
}

function getPresetChallengeLex() {
  //console.log("getPresetLuckyCard ~: ")
  //arr_preset_list = [];
  bindChallengeLexEvent();
  axios
    .get(g_url + "/preset/getpresetlist?type=challenge-lex")
    .then(function (response) {
      let json = response.data;

      if (json.returnCode == 1) {
        if (json.resultMap.returnVal != 1) {
          alert(json.message);
          return;
        }

        if (json.resultMap.dataList) {
          $.each(json.resultMap.dataList, function (index, data) {
            if (data.DATA == null) {
              data.DATA = createDefaultJson_challengeLex();
              preset_setting_data_challengelex = data.DATA;
            } else {
              preset_setting_data_challengelex = JSON.parse(data.DATA);
            }
            preset_data_challengelex = data;
          });

          const tabId = getChallengeLexCurrentTabId();
          const limit = getLimitByTabId(tabId);

          // 진행, 대기, 결과리스트 불러오기
          getChallengeMissionList(
            1,
            limit,
            false,
            CHALLENGELEX.STATUS.PROGRESSING.CODE,
          );
          //addEvent();
          // startSocket(preset_data.PAGE);
        } else {
          console.log("하나도 없을시 데이터 생성: ");
          createPreset_challengeLex();
          //하나도 없을시 데이터 생성
        }
      } else {
        alert(json.message);
      }
    })
    .catch(function (error) {})
    .then(function () {
      // always executed
    });
}

function addEvent() {
  $("#settingVideoYn").on("change", function () {
    preset_setting_data.isVideoSponStt = $(this).prop("checked") ? "on" : "off";
    //console.log("preset_setting_data :", preset_setting_data);
    const id = preset_data.ID;
    const name = preset_data.NAME;
    const data = JSON.stringify(preset_setting_data);
    savePreset(id, name, data);
  });

  $("#settingAudioYn").on("change", function () {
    preset_setting_data.isAudioSponStt = $(this).prop("checked") ? "on" : "off";
    //console.log("preset_setting_data :", preset_setting_data);
    const id = preset_data.ID;
    const name = preset_data.NAME;
    const data = JSON.stringify(preset_setting_data);
    savePreset(id, name, data);
  });

  $("#settingChallengeLexYn").on("change", function () {
    preset_setting_data_challengelex.isAvailable = $(this).prop("checked")
      ? "on"
      : "off";
    //console.log("preset_setting_data :", preset_setting_data_challengelex);

    const id = `${preset_data_challengelex.ID}`;
    const name = preset_data_challengelex.NAME;
    const data = JSON.stringify(preset_setting_data_challengelex);
    savePreset(id, name, data);
    refreshChallengeLex();
  });
}

function isVsponUnread() {
  var result = false;
  for (let i = 0; i < itemList.length; i++) {
    var _item = itemList[i];
    if (_item.isRead == false) {
      result = true;
      break;
    }
  }
  return result;
}

function setMessageRead(reqkey, status) {
  // console.log("setMessageRead : ", isVsponUnread())
  if (!isVsponUnread()) {
    setAlramMark_vspon("off");
  }

  axios
    .post(g_url + "/preset/messageread", {
      reqkey: reqkey,
      status: status,
    })
    .then(function (response) {
      let json = response.data;
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
        } else {
        }
      } else {
      }
    })
    .catch(function (error) {})
    .then(function () {
      // always executed
    });
}

function savePreset(id, name, presetData) {
  axios
    .post(g_url + "/preset/presetmodify", {
      id: id,
      name: name,
      data: presetData,
      // id: preset_data.ID,
      // name: preset_data.NAME,
      // data: JSON.stringify(preset_setting_data),
    })
    .then(function (response) {
      let json = response.data;
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
        } else {
          alert("설정저장 실패:" + json.message);
        }
      } else {
        alert("설정저장 실패:" + json.message);
      }
    })
    .catch(function (error) {})
    .then(function () {
      // always executed
    });
}

function setAlramMark_luckycard(status) {
  if (status == "on") {
    if ($("#new-alarm-luckycard").hasClass("alarm")) {
      return;
    } else {
      $("#new-alarm-luckycard").addClass("alarm");
    }
  } else if (status == "off") {
    if ($("#new-alarm-luckycard").hasClass("alarm")) {
      $("#new-alarm-luckycard").removeClass("alarm");
    }
  }
}

function setAlramMark_vspon(status) {
  if (status == "on") {
    if ($("#new-alarm-vspon").hasClass("alarm")) {
      return;
    } else {
      $("#new-alarm-vspon").addClass("alarm");
    }
  } else if (status == "off") {
    if ($("#new-alarm-vspon").hasClass("alarm")) {
      $("#new-alarm-vspon").removeClass("alarm");
    }
  }
}

function getSponList_luckycard() {
  var urlParams = "limit=30";

  if (preset_setting_data_luckycard.isAvailable == "on") {
    urlParams = urlParams + "&dataType=9";
  } else {
    return;
  }

  axios
    .get(g_url + "/preset/getmessagelist?" + urlParams)
    .then(function (response) {
      let json = response.data;
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
          //console.log("json :", json);
          json.resultMap.dataList.reverse();
          $.each(json.resultMap.dataList, function (index, data) {
            //  console.log("getSponList_luckycard : ", index, data)
            setTimeout(() => {
              if (data.DATA_TYPE == "9") {
                let _lData = JSON.parse(data.DATA);
                _lData.reqkey = data.REQKEY;
                //_lData.time = data.CREATIONDATE;
                _lData.exp_time = _lData.expirationDate;
                _lData.status = data.STATUS;

                createLuckyCardItem(_lData);
              }
            }, index * 200);
          });
        } else {
        }
      } else {
      }
    })
    .catch(function (error) {})
    .then(function () {
      // always executed
    });
}

// challenge lex event bind
function bindChallengeLexEvent() {
  $("#challengelex .nav-tabs .nav-link").on("click", function () {
    if ($(this).hasClass("active")) {
      return;
    }
    //
  });
}
// 도전렉스 미션 리스트
function getChallengeMissionList(page, limit, sortAscending, status) {
  // CHECK 비활성화 상태로도 이미 등록된 미션은 처리할 수 있어야 한다.
  /* if (preset_setting_data_challengelex.isAvailable !== "on") {
    console.warn("도전렉스 후원활성화가 비활성화 상태입니다.");

    $(".tab-content .tab-pane.active .tab-body")
      .empty()
      .append(
        $("<div>", {
          class: "not-available",
          text: "도전렉스 후원활성화가 비활성화 상태입니다.",
        })
      );
    return;
  } */

  const param = {
    offset: (Math.max(page, 1) - 1) * limit,
    limit: limit,
    sortAscending: !!sortAscending,
    status: Array.isArray(status) ? status : [status],
  };

  const url = `${g_url}/api/challenge-lex/mission/list`;

  axios
    .post(url, param)
    .then((response) => response.data)
    .then((json) => {
      if (json.returnCode !== 1 || json.resultMap.returnVal !== 1)
        throw new Error(
          `도전미션 리스트를 가져오는 중 오류가 발생했습니다.(url: ${url})`,
        );
      const totalCount = json.resultMap.totalCount;
      return Promise.resolve([totalCount, json.resultMap.list]);
    })
    .then(([total, list]) => {
      createChallengeLexCardInit(total, page, limit);

      $.each(list, function (index, data) {
        createChallengeLexCardItem(data);
      });
      const tabPaing = $(
        "#ChallengelexTabContent .tab-pane.active .tab-paging",
      );
      createChallengePaging(
        tabPaing,
        PAGENATION.BUTTON_CONUT.NORMAL,
        total,
        limit,
        page,
        [param.sortAscending, param.status],
        "getChallengeMissionList",
      );
    })
    .catch((err) => {
      console.error("🔥", err);
    });
}

// 진행 미션 초기화
function createChallengeLexCardInit(total = 0, page, limit) {
  $("#ChallengelexTabContent .tab-pane.active .tab-body").empty();
  const missionElement = $(
    "#ChallengelexTabContent .tab-pane.active .tab-option .status .count",
  );
  missionElement.empty();

  const paging = $("#ChallengelexTabContent .tab-pane.active .tab-paging");
  const isPaging = 0 < paging.length;

  let missionLengText = total;
  if (isPaging) {
    paging.empty();
    missionLengText = `${Math.min(page * limit, total)}/${total}`;
  }

  missionElement.text(`: ${missionLengText}개`);
}

function isDisabledCard(currentTarget) {
  const disabledCard = $(currentTarget).parents(".card-outline.disabled");
  return 0 < disabledCard.length;
}

function getChallengeLexData(currentTarget) {
  const data = $(currentTarget).parents(".card-outline").data("data");
  if (!data) {
    console.error("도전렉스 정보를 찾을 수 없습니다.");
    return {};
  }

  return data;
}

function getChallengeLexDataById(id) {
  const data = $(`.tab-body .card-outline[data-id=${id}]`).data("data");
  console.log("🔥 ~ getChallengeLexData ~ data:", data);
  if (!data) {
    console.error("도전렉스 정보를 찾을 수 없습니다.");
    return {};
  }

  return data;
}

// GLOBAL의 confirmMessage로 이전이 필요함.
function confirmMessage(message, functionName, param, callbackHideModal) {
  $("#confirmStartMisssionPopup .modal-body > p.mainmsg").empty();
  $("#confirmStartMisssionPopup .modal-body").data("fn", functionName || "");
  $("#confirmStartMisssionPopup .modal-body").data("param", param || "");
  $("#confirmStartMisssionPopup .modal-body").data("param", param || "");

  if (typeof message === "string") {
    $("#confirmStartMisssionPopup .modal-body > p.mainmsg").text(message);
  } else {
    $("#confirmStartMisssionPopup .modal-body > p.mainmsg").append(message);
  }

  $("#confirmStartMisssionPopup").modal({
    keyboard: false,
  });

  if (callbackHideModal) {
    $("#confirmStartMisssionPopup").on("hidden.bs.modal", function (e) {
      callbackHideModal();
    });
  }

  //alarmDeletePop.show();
}

function removeFromList(id) {
  const el = $(`.card-outline[data-id=${id}]`);
  if (0 === el.length) {
    return;
  }

  el.remove();
}

function callbackRouteApi() {
  const functionName = $("#confirmStartMisssionPopup .modal-body").data("fn");
  const params = $("#confirmStartMisssionPopup .modal-body").data("param");
  const callback = window[functionName];

  if (!callback || typeof callback !== "function") {
    console.error("callback 함수가 null 이거나 함수가 아닙니다.");
    return;
  }
  callback(params);
}
// 미션 성공 //////////////////////////////////////////////////////////////
function onSuccessHandler(event) {
  // CHECK 비활성화 상태로도 이미 등록된 미션은 처리할 수 있어야 한다.
  /* if (preset_setting_data_challengelex.isAvailable !== "on") {
    showMessage('"도전렉스 후원"이 비활성화 상태입니다.');
    return;
  } */

  if (isDisabledCard(event.currentTarget)) {
    return;
  }

  const challengelexData = getChallengeLexData(event.currentTarget);
  const { id, title, endDate } = challengelexData;
  const leftTimeId = CHALLENGELEX.ID.makeLeftTimeId(id) + "_modal";

  const message = $("<div>", { class: "mainmsg-area" })
    .append(
      $("<div>", { text: `\"${title || ""}\" 미션 도전을 성공하셨습니까?` }),
    )
    .append(
      $(
        $("<div>", {
          class: "modal-expend-time",
        })
          .append($("<div>", { text: "자동 실패까지 " }))
          .append(
            $("<div>", {
              id: leftTimeId,
              text: getLeftTimeChallengeLex(endDate)[0],
            }),
          ),
      ),
    );

  // update 대상에 추가
  arr_left_times_challengelex.push({
    id: leftTimeId,
    endDate: endDate,
  });
  confirmMessage(message, "callSuccessAPIHandler", id, () => {
    arr_left_times_challengelex = arr_left_times_challengelex.filter(
      (e) => e.id !== leftTimeId,
    );
  });
}

function callSuccessAPIHandler(id) {
  if (isNaN(id)) {
    console.error(`도전렉스 ID가 잘못되었습니다.${id}`);
    return;
  }

  const param = { id: id };
  const url = `${g_url}/api/challenge-lex/mission/success`;
  axios
    .post(url, param)
    .then((response) => response.data)
    .then((json) => {
      if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
        throw new Error();
      }
      const { id } = json.resultMap;
      return Promise.resolve(id);
    })
    .then((id) => {
      missionResultMessage(id, CHALLENGELEX.STATUS.SUCCESS.CODE);
    })
    .catch((err) => {
      console.error("🔥", err);
      showErrorMessage("도전미션 성공 처리 중 오류가 발생했습니다.");
    });
}
// 미션 실패 //////////////////////////////////////////////////////////////
function onFailedHandler(event) {
  // CHECK 비활성화 상태로도 이미 등록된 미션은 처리할 수 있어야 한다.
  /* if (preset_setting_data_challengelex.isAvailable !== "on") {
    showMessage('"도전렉스 후원"이 비활성화 상태입니다.');
    return;
  } */

  if (isDisabledCard(event.currentTarget)) {
    return;
  }

  const challengelexData = getChallengeLexData(event.currentTarget);
  const { id, title, endDate } = challengelexData;
  const leftTimeId = CHALLENGELEX.ID.makeLeftTimeId(id) + "_modal";
  const message = $("<div>", { class: "mainmsg-area" })
    .append(
      $("<div>", { text: `\"${title || ""}\" \n미션 도전을 실패하셨나요?` }),
    )
    .append(
      $(
        $("<div>", {
          class: "modal-expend-time",
        })
          .append($("<div>", { text: "자동 실패까지 " }))
          .append(
            $("<div>", {
              id: leftTimeId,
              text: getLeftTimeChallengeLex(endDate)[0],
            }),
          ),
      ),
    );

  // update 대상에 추가
  arr_left_times_challengelex.push({
    id: leftTimeId,
    endDate: endDate,
  });
  confirmMessage(message, "callFailedAPIHandler", id, () => {
    arr_left_times_challengelex = arr_left_times_challengelex.filter(
      (e) => e.id !== leftTimeId,
    );
  });
}

function callFailedAPIHandler(id) {
  if (isNaN(id)) {
    console.error(`도전렉스 ID가 잘못되었습니다.${id}`);
    return;
  }

  const param = { id: id };
  const url = `${g_url}/api/challenge-lex/mission/failure`;
  axios
    .post(url, param)
    .then((response) => response.data)
    .then((json) => {
      if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
        throw new Error();
      }
      const { id } = json.resultMap;
      return Promise.resolve(id);
    })
    .then((id) => {
      missionResultMessage(id, CHALLENGELEX.STATUS.FAILED.CODE);
    })
    .catch((err) => {
      console.error("🔥", err);
      showErrorMessage("도전미션 실패 처리 중 오류가 발생했습니다.");
    });
}

// 미션 시작 ///////////////////////////////////////////////////////////
function onStartHandler(event) {
  // CHECK 비활성화 상태로도 이미 등록된 미션은 처리할 수 있어야 한다.
  /* if (preset_setting_data_challengelex.isAvailable !== "on") {
    showMessage('"도전렉스 후원"이 비활성화 상태입니다.');
    return;
  } */

  if (isDisabledCard(event.currentTarget)) {
    return;
  }

  const challengelexData = getChallengeLexData(event.currentTarget);
  const { id, title, endDate } = challengelexData;
  const leftTimeId = CHALLENGELEX.ID.makeLeftTimeId(id) + "_modal";
  const message = $("<div>", { class: "mainmsg-area" })
    .append(
      $("<div>", {
        text: `\"${title || ""}\" \n미션 도전을 시작하시겠습니까?`,
      }),
    )
    .append(
      $(
        $("<div>", {
          class: "modal-expend-time",
        })
          .append($("<div>", { text: "자동 실패까지 " }))
          .append(
            $("<div>", {
              id: leftTimeId,
              text: getLeftTimeChallengeLex(endDate)[0],
            }),
          ),
      ),
    );

  // update 대상에 추가
  arr_left_times_challengelex.push({
    id: leftTimeId,
    endDate: endDate,
  });
  confirmMessage(message, "callStartAPIHandler", id, () => {
    arr_left_times_challengelex = arr_left_times_challengelex.filter(
      (e) => e.id !== leftTimeId,
    );
  });
}
// start api 호출
function callStartAPIHandler(id) {
  if (isNaN(id)) {
    console.error(`도전렉스 ID가 잘못되었습니다.${id}`);
    return;
  }

  const param = { id: id };
  const url = `${g_url}/api/challenge-lex/mission/start`;
  axios
    .post(url, param)
    .then((response) => response.data)
    .then((json) => {
      if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
        throw new Error();
      }
      const { id } = json.resultMap;
      return Promise.resolve(id);
    })
    .then((id) => {
      missionResultMessage(id, CHALLENGELEX.STATUS.PROGRESSING.CODE);
    })
    .catch((err) => {
      console.error("🔥", err);
      showErrorMessage("도전미션 시작 중 오류가 발생했습니다.");
    });
}

// 미션 시작: 대기에서 삭제, 미션 시작 알림
function missionResultMessage(id, status) {
  const el = $(`.card-outline[data-id=${id}]`);
  if (0 === el.length) {
    return;
  }

  const data = el.data("data");
  const { title } = data;
  let submsg = "";
  switch (status) {
    case CHALLENGELEX.STATUS.PROGRESSING.CODE:
      submsg = "미션을 시작합니다.";
      break;
    case CHALLENGELEX.STATUS.CANCELED.CODE:
      submsg = "미션을 취소합니다.";
      break;
    case CHALLENGELEX.STATUS.SUCCESS.CODE:
      submsg = "미션을 성공하였습니다.";
      break;
    case CHALLENGELEX.STATUS.FAILED.CODE:
      submsg = "미션을 실패하였습니다.";
      break;
  }

  showMessage(`"${title}" ${submsg}`);
  removeFromList(id);
}
// 미션 취소 /////////////////////////////////////////////////////
function onCancelHandler(event) {
  // CHECK 비활성화 상태로도 이미 등록된 미션은 처리할 수 있어야 한다.
  /* if (preset_setting_data_challengelex.isAvailable !== "on") {
    showMessage('"도전렉스 후원"이 비활성화 상태입니다.');
    return;
  } */

  if (isDisabledCard(event.currentTarget)) {
    return;
  }

  const challengelexData = getChallengeLexData(event.currentTarget);
  const { id, title, endDate } = challengelexData;
  const leftTimeId = CHALLENGELEX.ID.makeLeftTimeId(id) + "_modal";
  const message = $("<div>", { class: "mainmsg-area" })
    .append(
      $("<div>", {
        text: `\"${title || ""}\" \n미션 도전을 취소하시겠습니까?`,
      }),
    )
    .append(
      $(
        $("<div>", {
          class: "modal-expend-time",
        })
          .append($("<div>", { text: "자동 실패까지 " }))
          .append(
            $("<div>", {
              id: leftTimeId,
              text: getLeftTimeChallengeLex(endDate)[0],
            }),
          ),
      ),
    );

  // update 대상에 추가
  arr_left_times_challengelex.push({
    id: leftTimeId,
    endDate: endDate,
  });
  confirmMessage(message, "callCancelAPIHandler", id, () => {
    arr_left_times_challengelex = arr_left_times_challengelex.filter(
      (e) => e.id !== leftTimeId,
    );
  });
}

function callCancelAPIHandler(id) {
  if (isNaN(id)) {
    console.error(`도전렉스 ID가 잘못되었습니다.${id}`);
    return;
  }

  const param = { id: id };
  const url = `${g_url}/api/challenge-lex/mission/cancel`;
  axios
    .post(url, param)
    .then((response) => response.data)
    .then((json) => {
      if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
        throw new Error();
      }
      const { id } = json.resultMap;
      return Promise.resolve(id);
    })
    .then((id) => {
      missionResultMessage(id, CHALLENGELEX.STATUS.CANCELED.CODE);
    })
    .catch((err) => {
      console.error("🔥", err);
      showErrorMessage("도전미션 취소 중 오류가 발생했습니다.");
    });
}

// 후원리스트 //////////////////////////////////////////////
function onChallengeLexSponsorListHandler(event) {
  // CHECK 비활성화 상태로도 이미 등록된 미션은 처리할 수 있어야 한다.
  /* if (preset_setting_data_challengelex.isAvailable !== "on") {
    showMessage('"도전렉스 후원"이 비활성화 상태입니다.');
    return;
  } */

  if (isDisabledCard(event.currentTarget)) {
    return;
  }

  const challengelexData = getChallengeLexData(event.currentTarget);
  const { id, title, nickname, amount } = challengelexData;

  $("#sponsorListPopup").modal("show");

  displayMissionCreator(title, nickname, amount);
  callChallengeLexSponsorList(1, 5, id, false);
}
// 주최자 정보
function displayMissionCreator(title, nickname, amount) {
  const tbody = $("#sponsorListPopup .mission-detail table tbody");
  tbody.empty();

  $("#sponsorListPopup .modal-body p:first").text(title);
  // 미션 주최자
  $("<tr>")
    .append($("<td>").append($("<div>", { text: "미션 주최자" })))
    .append(
      $("<td>").append(
        $("<div>", { class: "mission-creator", text: nickname }),
      ),
    )
    .appendTo(tbody);
  // 총 모금렉스
  $("<tr>")
    .append($("<td>").append($("<div>", { text: "총 모금 렉스" })))
    .append(
      $("<td>").append(
        $("<div>", {
          class: "mission-total",
          text: `${numberWithCommas(amount)}`,
        })
          .append($("<span>", { class: "unit", text: "개" }))
          .append(
            $("<span>", { class: "collapse", "data-toggle": "expand" }).on(
              "click",
              (event) => onToggleArea(event, "#sponsorListPopup .sponsor-list"),
            ),
          ),
      ),
    )
    .appendTo(tbody);
}
// sponsor list
function callChallengeLexSponsorList(page, limit, id, sortAscending) {
  const sponsorlist = $("#sponsorListPopup .sponsor-list");

  const tbody = sponsorlist.find("table tbody");
  tbody.empty();

  const spinnerArea = sponsorlist.find(".spinner-area");
  spinnerArea.show();

  // mission detail
  const param = {
    id: id,
    offset: (Math.max(page, 1) - 1) * limit,
    limit: limit,
    sortAscending: !!sortAscending,
  };
  const url = `${g_url}/api/challenge-lex/mission/sponsor/list`;

  axios
    .post(url, param)
    .then((response) => response.data)
    .then((json) => {
      if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
        throw new Error();
      }
      const { list, totalCount } = json.resultMap;
      return Promise.resolve({ list, totalCount });
    })
    .then(({ list, totalCount }) => {
      spinnerArea.hide();
      displayChallengeLexSponsorList(id, page, totalCount, list, param);
    })
    .catch((err) => {
      console.error("🔥", err);
      closeModal("sponsorListPopup");
      showErrorMessage("후원자 리스트를 가져오는 중 오류가 발생했습니다.");
    });
}

function displayChallengeLexSponsorList(id, page, totalCount, list, param) {
  const tbody = $("#sponsorListPopup .sponsor-list table tbody");
  tbody.empty();

  const paging = $("#sponsorListPopup .tab-paging");
  paging.empty();

  list.forEach((e) => {
    $("<tr>")
      .append($("<td>").append($("<div>", { text: e.nickname })))
      .append(
        $("<td>").append($("<div>", { text: `${numberWithCommas(e.amount)}` })),
      )
      .appendTo(tbody);
  });

  const limit = param.limit;
  createChallengePaging(
    paging,
    PAGENATION.BUTTON_CONUT.SMALL,
    totalCount,
    limit,
    page,
    [id, param.sortAscending],
    "callChallengeLexSponsorList",
  );
}

// 연장하기 ///////////////////////////////////////////////////
function onExtendsHandler(event) {
  // CHECK 비활성화 상태로도 이미 등록된 미션은 처리할 수 있어야 한다.
  /* if (preset_setting_data_challengelex.isAvailable !== "on") {
    showMessage('"도전렉스 후원"이 비활성화 상태입니다.');
    return;
  } */

  if (isDisabledCard(event.currentTarget)) {
    return;
  }

  const challengelexData = getChallengeLexData(event.currentTarget);
  const { id } = challengelexData;
  // 연장 하기 진행
  // 초기화
  $('#extendsPopup .input-group > input[name="extends-day"]').val("");
  $('#extendsPopup .input-group > input[name="extends-hours"]').val("");
  $('#extendsPopup .input-group > input[name="extends-minutes"]').val("");
  $('#extendsPopup .inputarea > input[name="mission-id"]').val(id);
  //focus
  new bootstrap.Modal(document.getElementById("extendsPopup"), {
    keyboard: false,
  }).show();
  /* setTimeout(() => {
    $('#extendsPopup .input-group > input[name="extends-day"]').focus();
  }, 1000); */
}

function callExtendsTimeApiHandler() {
  const id = $('#extendsPopup .inputarea > input[name="mission-id"]').val();
  const day = $('#extendsPopup .input-group > input[name="extends-day"]').val();
  const hours = $(
    '#extendsPopup .input-group > input[name="extends-hours"]',
  ).val();
  const minutes = $(
    '#extendsPopup .input-group > input[name="extends-minutes"]',
  ).val();

  if (isNaN(day) || isNaN(hours) || isNaN(minutes)) {
    showErrorMessage("시간 연장시 입력은 숫자로만 입력해 주세요");
    return;
  }

  if (
    !isValidLimitTime(
      CHALLENGELEX.RESTRICTION.LIMIT_TIME_EXTEND,
      day,
      hours,
      minutes,
    )
  ) {
    return showErrorMessage(`제한 시간은 최대 1일까지 가능함니다.`);
  }

  const dayNum = parseInt(day || 0);
  const hoursNum = parseInt(hours || 0);
  const minutesNum = parseInt(minutes || 0);
  const extendSecTime =
    dayNum * 60 * 60 * 24 + hoursNum * 60 * 60 + minutesNum * 60;

  const param = { id: parseInt(id), extendSecTime: extendSecTime };
  const url = `${g_url}/api/challenge-lex/mission/extend`;

  axios
    .post(url, param)
    .then((response) => response.data)
    .then((json) => {
      if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
        throw new Error(json.message || "");
      }
      const { id, endDate } = json.resultMap;
      return Promise.resolve({ id, endDate });
    })
    .then(({ id, endDate }) => {
      updateEndDate(id, endDate);
    })
    .catch((err) => {
      console.error("🔥", err);
      const message =
        err.message || "도전미션 시간 연장 중 오류가 발생했습니다.";
      showErrorMessage(message);
    });
}
// 종료시간 업데이트
function updateEndDate(id, endDate) {
  // 1. card-outline data-data 갱신
  // 2. arr_left_times_challengelex 갱신
  const lefttimeId = `left-time-challengelex-${id}`;
  const leftitmeEl = $(`#${lefttimeId}`);
  const cardoutline = leftitmeEl.parents(`.card-outline[data-id=${id}]`);
  if (0 === leftitmeEl.length || 0 === cardoutline.length) {
    console.warn("시간 연장할 대상이 없음.");
    return;
  }
  const extendEl = leftitmeEl.find("~.extend");
  extendEl.addClass("disabled");
  extendEl.attr("onclick", "").unbind("click");

  const data = cardoutline.data("data");
  const { title } = data;
  data.endDate = endDate;
  cardoutline.data("data", data);

  arr_left_times_challengelex.forEach((e) => {
    if (e.id === lefttimeId) {
      e.endDate = endDate;
    }
  });

  showMessage(`"${title}" 미션시간을 연장하였습니다.`);
}

function createStatusActioniButton(status) {
  if (CHALLENGELEX.STATUS.PROGRESSING.CODE === status) {
    return [
      $("<button>", {
        class: "btn-accent",
        text: "성공",
      }).on("click", (event) => onSuccessHandler(event)),
      $("<button>", {
        class: "btn-failure",
        text: "실패",
      }).on("click", (event) => onFailedHandler(event)),
    ];
  } else if (CHALLENGELEX.STATUS.PENDING.CODE === status) {
    return [
      $("<button>", {
        class: "btn-accent",
        text: "시작",
      }).on("click", (event) => onStartHandler(event)),
      $("<button>", {
        class: "btn-cancel",
        text: "취소",
      }).on("click", (event) => onCancelHandler(event)),
    ];
  } else {
    return [];
  }
}

function createStatusLabel(data) {
  let classname = "";
  switch (data.status) {
    case CHALLENGELEX.STATUS.PROGRESSING.CODE:
      classname = "card-status card-progressing";
      break;
    case CHALLENGELEX.STATUS.PENDING.CODE:
      classname = "card-status card-pending";
      break;
    case CHALLENGELEX.STATUS.CANCELED.CODE:
      classname = "card-status card-canceled";
      break;
    case CHALLENGELEX.STATUS.FAILED.CODE:
      classname = "card-status card-failed";
      break;
    case CHALLENGELEX.STATUS.SUCCESS.CODE:
      classname = "card-status card-success";
      break;
    default:
      classname = "card-status";
  }
  return $("<div>", { class: classname }).append(
    $("<div>", { text: CHALLENGELEX.STATUS.getName(data.status) || "" }),
  );
}

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
  //console.log("🔥 ~ moveToPage ~ options:", options, fnName);
  window[fnName](page, limit, ...options);
  //getChallengeMissionList(page, limit, ...options);
}

// paging 생성
function createChallengePaging(
  tabPaing,
  paginationButtonCount,
  total,
  limit,
  current,
  options,
  fnName,
) {
  //const tabPaing = $("#ChallengelexTabContent .tab-pane.active .tab-paging");
  if (0 === tabPaing.length) return;
  //if (0 < tabPaing.find(".paging").length) return;

  // paging
  let lastPage = Math.floor(total / limit);
  lastPage += total % limit > 0 ? 1 : 0;

  // 처음으로 이동 버튼(페이지가 paginationButtonCount 이상일때)
  if (paginationButtonCount < lastPage) {
    $("<div>", { class: "paging first", text: "<<" })
      .on("click", (event) => {
        const paging = $(event.currentTarget);
        moveToPage(1, limit, options, fnName);
      })
      .appendTo(tabPaing);
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
      moveToPage(pgnumber, limit, options, fnName),
    );

    if (pgnumber === current) pgElement.addClass("current");

    pgElement.appendTo(tabPaing);
  }

  // 다음(2페이지 이상일때)
  if (1 < lastPage) {
    $("<div>", { class: "paging next", text: ">" })
      .on("click", () =>
        moveToNextPage(current, limit, lastPage, options, fnName),
      )
      .appendTo(tabPaing);
  }
  // 마지막으로 이동버튼(페이지가 paginationButtonCount 이상일때)
  if (paginationButtonCount < lastPage) {
    $("<div>", { class: "paging last", text: ">>" })
      .on("click", () => moveToPage(lastPage, limit, options, fnName))
      .appendTo(tabPaing);
  }
}

function createChallengeLexProgressingAndPendingCardItem(data) {
  const tabBody = $("#ChallengelexTabContent .tab-pane.active .tab-body");
  const [leftTime, isEndTime] = getLeftTimeChallengeLex(data.endDate);
  const extendTime = data.extendTime;

  const cardOutline = $("<div>", {
    class: `card-outline${isEndTime ? " disabled" : ""}`,
    "data-data": JSON.stringify(data),
    "data-id": data.id,
  });

  // main line(status, title, time) ---------------------------------------------
  const cardMain = $("<div>", { class: "card-main" }).appendTo(cardOutline);
  // 상태
  createStatusLabel(data).appendTo(cardMain);
  // 타이틀/시간 area
  const cardTitleTimeArea = $("<div>", { class: "card-title-time" }).appendTo(
    cardMain,
  );

  $("<div>", { class: "time-extend", text: "제한시간: " })
    .append(
      $("<div>", {
        id: CHALLENGELEX.ID.makeLeftTimeId(data.id),
        class: "time",
        text: leftTime,
      }),
    )
    .appendTo(cardTitleTimeArea);

  // sub line(lex, nickname, button) ----------------------------------------------
  const cardSub = $("<div>", { class: "card-sub" }).appendTo(cardOutline);

  //타이틀
  $("<div>", { class: "card-title", text: data.title }).appendTo(cardSub);

  // lex , button area
  const lexButtonArea = $("<div>", {
    class: "card-lex-nickname-area",
  }).appendTo(cardSub);

  // card/nickname area
  const cardNicknameArea = $("<div>", { class: "card-lex-nickname" }).appendTo(
    lexButtonArea,
  );
  // lex
  const cardLexArea = $("<div>", { class: "card-lex" }).appendTo(
    cardNicknameArea,
  );

  // nickname
  $("<div>", { class: "nickname" })
    .append($("<div>", { class: "nickname", text: data.nickname }))
    .appendTo(cardLexArea);
  // lex
  $("<div>", {
    class: "lex",
    text: `${numberWithCommas(data.amount)} LEX`,
  }).appendTo(cardLexArea);

  //후원리스트
  /* $("<button>", { class: "btn-sponsor", text: "후원리스트" })
    .on("click", (event) => onChallengeLexSponsorListHandler(event))
    .appendTo(cardButtonArea); */
  // 성공/취소, 시작/종료

  tabBody.append(cardOutline);

  // button area(후button) ----------------------------------------------
  const buttonArea = $("<div>", { class: "action-area" }).appendTo(cardOutline);
  const buttonAreaLeft = $("<div>", { class: "left-area" }).appendTo(
    buttonArea,
  );
  const buttonAreaRight = $("<div>", { class: "right-area" }).appendTo(
    buttonArea,
  );
  // 후원리스트
  $("<button>", { class: "btn-sponsor", text: "후원리스트" })
    .on("click", (event) => onChallengeLexSponsorListHandler(event))
    .appendTo(buttonAreaLeft);

  // 성공 실패, 시작 취소
  const [firstBtn, secondBtn] = createStatusActioniButton(data.status);
  if (firstBtn) firstBtn.appendTo(buttonAreaRight);
  if (secondBtn) secondBtn.appendTo(buttonAreaRight);

  //  - 연장하기
  const expend = $("<button>", { class: "extend", text: "연장하기" }).appendTo(
    buttonAreaRight,
  );

  if (null !== extendTime) {
    expend.addClass("disabled");
  } else {
    expend.on("click", (event) => onExtendsHandler(event));
  }

  // 남은시간 업데이트 //////////////////////////////////////////
  if (!isEndTime) {
    let t_obj = {};
    // t_obj.reqkey = data.reqkey;
    t_obj.id = CHALLENGELEX.ID.makeLeftTimeId(data.id);
    t_obj.endDate = data.endDate;
    arr_left_times_challengelex.push(t_obj);
  }
}

function createChallengeLexCompleteCardItem(data) {
  const tabBody = $("#ChallengelexTabContent .tab-pane.active .tab-body");
  const cardOutline = $("<div>", {
    class: "card-outline completed",
    "data-data": JSON.stringify(data),
    "data-id": data.id,
  });

  // main line(status, title, time) ---------------------------------------------
  const cardMain = $("<div>", { class: "card-main" }).appendTo(cardOutline);
  // 상태
  createStatusLabel(data).appendTo(cardMain);
  // 타이틀/시간 area
  const cardTitleNicknameArea = $("<div>", {
    class: "card-title-nickname",
  }).appendTo(cardMain);
  //타이틀
  $("<div>", { class: "card-title", text: data.title }).appendTo(
    cardTitleNicknameArea,
  );
  // sub line(status, title, time) ---------------------------------------------
  const cardSub = $("<div>", { class: "card-sub" }).appendTo(cardOutline);

  // lex , button area
  const lexButtonArea = $("<div>", {
    class: "card-lex-nickname-area",
  }).appendTo(cardSub);

  // card/nickname area
  const cardNicknameArea = $("<div>", { class: "card-lex-nickname" }).appendTo(
    lexButtonArea,
  );
  // lex
  const cardLexArea = $("<div>", { class: "card-lex" }).appendTo(
    cardNicknameArea,
  );

  // nickname
  $("<div>", { class: "nickname" })
    .append($("<div>", { class: "nickname", text: data.nickname }))
    .appendTo(cardLexArea);
  // lex
  $("<div>", {
    class: "lex",
    text: `${numberWithCommas(data.amount)} LEX`,
  }).appendTo(cardLexArea);

  // paging line(status, title, time) ---------------------------------------------

  tabBody.append(cardOutline);
}

function createChallengeLexCardItem(data) {
  if (
    [
      CHALLENGELEX.STATUS.PENDING.CODE,
      CHALLENGELEX.STATUS.PROGRESSING.CODE,
    ].includes(data.status)
  ) {
    createChallengeLexProgressingAndPendingCardItem(data);
  } else {
    createChallengeLexCompleteCardItem(data);
  }
}
// vsponsor(영상/음성))
function getSponList() {
  var urlParams = "limit=30";

  if (
    preset_setting_data.isVideoSponStt == "on" &&
    preset_setting_data.isAudioSponStt != "on"
  ) {
    urlParams = urlParams + "&dataType=7";
  } else if (
    preset_setting_data.isVideoSponStt != "on" &&
    preset_setting_data.isAudioSponStt == "on"
  ) {
    urlParams = urlParams + "&dataType=8";
  } else if (
    preset_setting_data.isVideoSponStt != "on" &&
    preset_setting_data.isAudioSponStt != "on"
  ) {
    return;
  }

  axios
    .get(g_url + "/preset/getmessagelist?" + urlParams)
    .then(function (response) {
      let json = response.data;
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
          //console.log("json :", json);
          json.resultMap.dataList.reverse();
          $.each(json.resultMap.dataList, function (index, data) {
            //console.log("getSponList : ", index, data);
            setTimeout(() => {
              if (data.DATA_TYPE == "7") {
                let _vData = JSON.parse(data.DATA);
                _vData.reqkey = data.REQKEY;
                _vData.time = data.CREATIONDATE;
                _vData.status = data.STATUS;
                getVideoInfo(_vData);
              } else if (data.DATA_TYPE == "8") {
                let _aData = JSON.parse(data.DATA);
                _aData.reqkey = data.REQKEY;
                _aData.time = data.CREATIONDATE;
                _aData.status = data.STATUS;
                createAudioItem(_aData);
              }
            }, index * 200);
          });
        } else {
        }
      } else {
      }
    })
    .catch(function (error) {})
    .then(function () {
      // always executed
    });
}

function onNumberInputOnly(obj) {
  const max = obj.getAttribute("max");
  const val = obj.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
  obj.value = Math.min(max, val);
}

// Global의 Message object와 통합.
function showMessage(text) {
  /* $("#commonAlarmPopup .modal-body > p").text(text);
  new bootstrap.Modal(document.getElementById("commonAlarmPopup"), {
    keyboard: false,
  }).show(); */
  Message.show(text);
}

function showErrorMessage(text) {
  $("#errorAlarmPopup .modal-body > p").text(text);
  new bootstrap.Modal(document.getElementById("errorAlarmPopup"), {
    keyboard: false,
  }).show();
}

function closeModal(modalId, delay) {
  const delayTime = isNaN(delay) ? 1000 : delay;
  setTimeout(() => $(`#${modalId}`).modal("hide"), delayTime);
}
g_login_checking(login_callbackFn);

async function login_callbackFn(member) {
  memberData = member;
  console.log("login_callbackFn", member);

  init();
}
