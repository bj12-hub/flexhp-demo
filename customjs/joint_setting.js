axios.defaults.withCredentials = true;
let aggregationIntervalId = undefined;
const DEFAULT_PROJECT_LABEL = "프로젝트 선택";
const DEFAULT_MIN_SEARCH_TXT = 3;
//상태: 1(등록중) 2(대기) 3(진행중) 4(종료) 5(삭제)
const ERROR_JOINT = {
  INPROGRESS: 2000,
  END: 1028,
};
const DEFAULT = {
  BJ: {
    COLORS: { BG: "#00000000", NAME: "#00000000" },
    SHOWZEROSCOREON: true, // 0 점표기
    SHOWMAINBJ: true, // 대표 BJ
    MINUSSCOREON: false,
    HEADER: {
      NICKNAME: "BJ",
      CUSTOM: "비고",
      ENABLECUSTOM: false,
    },
    SORTALIGN: false,
  },
};

///////////////////////////////////////////

async function init(page) {
  try {
    addEvent();

    clearAllJointData();
    await loadSettings();
    startSocket(page);
  } finally {
    $(".spinner-border").css("display", "none");
  }
}

function addEvent() {
  // 합동방송 가기
  $(".btn-goto-previous").attr("disabled", false);

  const me = getMeInfo();
  // 신규생성 버튼
  $(".btn-create-project").click(function (e) {
    handleCreateProject();
  });
  // 엑셀방송 시작
  $(".btn-start-project").click(function (e) {
    handleStartJoint();
  });
  // 타이머 시작
  $(".btn-start-timer").click(function (e) {
    handleStartTimer();
  });
  // 대표 BJ 표기
  $("#showMainBJ").change(function (e) {
    e.preventDefault();
    const { MEMBER_UID: meMemberId } = me;
    if ($("#showMainBJ").is(":checked")) {
      $(`.join-joint-area tbody tr[uid=${meMemberId}] .col-show input`).prop(
        "checked",
        true
      );
    } else {
      $(`.join-joint-area tbody tr[uid=${meMemberId}] .col-show input`).prop(
        "checked",
        false
      );
    }
  });
  // 참여 호스트 전체 초기화
  $(".btn-bj-init").click(function (e) {
    handleJoinedBjInit();
  });
  //참여 호스트 추가
  $(".btn-bj-add").click(function (e) {
    handleAddBj();
  });
  //집계정지
  $(".btn-sponsor-stop").click(function (e) {
    handleStopAggregation();
  });
  //결과다운로드
  $(".btn-download-sponsor").click(function (e) {
    const { value: jointId, label, date } = getSelectProjectData();
    if (!_.isNil(jointId)) {
      handleDownloadSponsorResult(jointId, label, date);
    } else {
      Message.show("먼저 프로젝트를 선택하거나 생성해 주세요");
    }
  });
  //내역다운로드
  $(".btn-download-sponsor-history").click(function (e) {
    const { value: jointId, label, date } = getSelectProjectData();
    if (!_.isNil(jointId)) {
      handleDownloadSponsorHistory(jointId, label, date);
    } else {
      Message.show("먼저 프로젝트를 선택하거나 생성해 주세요");
    }
  });

  // 저장
  $("#btn_save").on("click", function () {
    const { label: title, status } = getSelectProjectData() || {};

    if (JOINT.STATUS.END === status) {
      return Message.show("종료된 방송입니다.");
    }

    if (_.isNil(title)) {
      return Message.show("먼저 프로젝트를 선택하거나 생성해 주세요");
    }

    // BJ 명은 반드 시 입력해야 함.(표시될 BJ 명을 입력해 주세요.)
    let isVaildBJName = true;
    let isDuplicateBjName = false;
    const bjNameMap = {};
    $(".join-joint-area tbody td.col-nickname input").each(function () {
      const val = $(this).val();
      // 이름 입력
      if (_.isEmpty(val) || 2 > val.length) {
        isVaildBJName = false;
      }
      // 중복
      if (_.has(bjNameMap, val)) {
        isDuplicateBjName = true;
      }
      bjNameMap[val] = val;
    });

    if (!isVaildBJName) {
      return Message.show("표시될 호스트 명을 입력해 주세요.(최소 2자 이상)", {
        title: "참여 호스트 설정",
        type: "warn",
      });
    }

    if (isDuplicateBjName) {
      return Message.show("표시될 호스트명이 중복되었습니다.", {
        title: "참여 호스트 설정",
        type: "warn",
      });
    }

    Message.confirm(
      { title: "엑셀방송 저장", message: "설정을 저장하시겠습니까?" },
      async () => {
        await saveJointSettins();
      }
    );
  });
}
// handler ///////////////////////////////////////////////////////////////////////
async function callApiDeleteProject(jointId) {
  const url = `${g_url}/api/joint/project/delete`;
  const param = { jointId };

  const response = await axios.post(url, param);
  const json = response.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }
  return json.resultMap.data;
}
// 프로젝트 삭제
function handleDeleteProject(item, value, label, callback) {
  const { status } = getSelectProjectData();
  if (JOINT.STATUS.INPROGRESS === status) {
    return Message.show(`"${label}" 엑셀방송이 진행 중입니다.`, {
      type: "warn",
    });
  }

  Message.confirm(
    {
      title: "프로젝트 삭제",
      message: ` 프로젝트를 삭제하시겠습니까?`,
    },
    () => {
      return new Promise(async (resolve, reject) => {
        try {
          await callApiDeleteProject(value);
          if (item) $(item).remove();
          if (callback) callback();
        } catch (e) {
          console.error(e);
          reject(e);
          Message.show("프로젝트 삭제 중 오류가 발생했습니다.");
        } finally {
          resolve();
        }
      });
    }
  );
}

// 진행 중인 회차
function getInprogressJointId() {
  let finedItem = undefined;
  $(`.project-joint-area .project-box .dropdown-item .prj-label-box`).each(
    function () {
      if (JOINT.STATUS.INPROGRESS === $(this).data("status")) {
        finedItem = $(this);
      }
    }
  );
  return _.isNil(finedItem) ? undefined : finedItem.parent().attr("value");
}

// 진행 중인 회차
function existInprogressJoint() {
  const jointId = getInprogressJointId();
  return !_.isNil(jointId);
}

function setInprogressJoint(jointId, status) {
  const findedItem = $(
    `.project-joint-area .project-box .dropdown-item[value=${jointId}]`
  );
  if (0 < findedItem.length) {
    findedItem.find(".prj-label-box").data("status", status);
  } else {
    console.warn(`Not found dropdown-item value=${jointId}`);
  }
}

// 프로젝트 생성
function handleCreateProject() {
  if (existInprogressJoint()) {
    return Message.show("먼저 진행 중인 회차를 종료해 주세요.");
  }

  const projectLength = $(
    ".select-project-name button.dropdown-toggle > div"
  ).length;

  const msgObject = $("<div>", { class: "project-create-container" })
    .append(
      $("<div>", {
        class: "project-name-title",
        text: "프로젝트명을 입력하세요",
      })
    )
    /* .on("keyup", function (key) {
      if (key.keyCode == 13) {
        //console.log("🌸🌼");
        //return Message.confirmOk();
      }
    }) */
    .append(
      $("<input>", {
        class: "form-control",
        maxlength: 26,
        placeholder: "프로젝트 명(2글자 이상, 26자 이내)",
      })
    )
    .append(
      $("<div>", { class: "keep-project-settgins" })
        .css("display", projectLength > 0 ? "block" : "none")
        .append(
          $("<label>", { text: "현재 설정 유지" }).append(
            $("<input>", { type: "checkbox" })
          )
        )
    );

  Message.confirm(
    { title: "프로젝트를 생성하시겠습니까?.", message: msgObject },
    async () => {
      try {
        const isKeepData = msgObject
          .find(".keep-project-settgins input")
          .prop("checked");
        //console.log("🔥 ~ isKeepData:", isKeepData);

        //console.log("‼️‼️‼️‼️‼️‼️‼️‼️‼️‼️‼️생성 UI 추가");
        //글자 수 체크
        const val = msgObject.find("input").val();
        if (2 > val.length) {
          Message.show("최소 2줄자 이상 입력해야 합니다.");
          Message.preventClose();
          return;
        }

        const result = await callApiProjectCreate(val);
        console.log("🔥 ~ result:", result);
        const { mainBjId } = result;
        if (isKeepData) {
          keepAllJointData(mainBjId);
        } else {
          clearAllJointData();
        }
        const data = makeProjectOption(result);
        const parent = $(".project-area .select-project-name .dropdown-menu");
        makeSelectOption(
          parent,
          data,
          false,
          null, //handleDeleteProject,
          handleProjectOptionSelect,
          true
        );
        selectProjectOption(
          $(
            `.project-area .select-project-name .dropdown-item[value=${result.jointId}]`
          ),
          isKeepData
        );
      } catch (e) {
        console.error(e);
      }
    }
  );
}

function makeProjectUpdateParams(jointId, title) {
  return {
    jointId,
    title,
    minAmount: Number($("#minAmount").val() || 0),
    showMainBJ: $("#showMainBJ").prop("checked"),
    options: {
      bj: {
        align: {
          value: $("#sortAlign").prop("checked"),
          column: $("#alignLength").val(),
        },
        header: {
          custom: $(".join-joint-area input[name=custom]").val(),
          enableCustom: $(".join-joint-area input[name=enableCustom]").prop(
            "checked"
          ),
        },
      },
      timer: {
        hours: $("#timer-hour").val(),
        minutes: $("#timer-minutes").val(),
        seconds: $("#timer-seconds").val(),
        start: false,
        timestamp: null,
      },
    },
  };
}

async function callApiProjectUpdate(title, jointId) {
  const url = `${g_url}/api/joint/project/update`;

  const param = makeProjectUpdateParams(jointId, title);

  const response = await axios.post(url, param);
  const json = response.data;
  //console.log("🔥 ~ callApiProjectUpdate ~ json:", json.resultMap.data);

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }
  return json.resultMap.data;
}

async function callApiProjectCreate(title) {
  const url = `${g_url}/api/joint/project/add`;
  const param = {
    title,
    minAmount: Number($("#minAmount").val() || 0),
    showMainBJ: $("#showMainBJ").prop("checked"),
    options: {
      bj: {
        align: {
          value: $("#sortAlign").prop("checked"),
          column: $("#alignLength").val(),
        },
        header: {
          custom: $(".join-joint-area input[name=custom]").val(),
          enableCustom: $(".join-joint-area input[name=enableCustom]").val(),
        },
      },
      timer: {
        hours: $("#timer-hour").val(),
        minutes: $("#timer-minutes").val(),
        seconds: $("#timer-seconds").val(),
      },
    },
  };

  const response = await axios.post(url, param);
  const json = response.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }

  return json.resultMap.data;
}

// 엑셀 시작
async function callApiStartExcel() {
  const { value: jointId } = getSelectProjectData();

  const url = `${g_url}/api/joint/project/start`;
  const param = { jointId };

  const response = await axios.post(url, param);
  const json = response.data;
  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }

  return json.resultMap.data;
}

async function callApiStopExcel() {
  const { value: jointId } = getSelectProjectData();

  const url = `${g_url}/api/joint/project/stop`;
  const param = { jointId };

  const response = await axios.post(url, param);
  const json = response.data;
  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }

  return json.resultMap.data;
}

// 엑셀 시작
function handleStartJoint() {
  const { status, value: jointId } = getSelectProjectData();
  const message =
    JOINT.STATUS.INPROGRESS === status
      ? "엑셀방송을 종료하시겠습니까?"
      : "엑셀방송을 시작하시겠습니까?";
  Message.confirm({ title: "엑셀방송", message }, async () => {
    try {
      switch (status) {
        case JOINT.STATUS.REG:
        case JOINT.STATUS.WAIT:
          // 엑셀방송 시작
          await callApiStartExcel();
          setStartJointButton(JOINT.STATUS.INPROGRESS, jointId);
          break;
        case JOINT.STATUS.INPROGRESS:
          // 엑셀방송 종료
          await callApiStopExcel();
          setStartJointButton(JOINT.STATUS.END, jointId);
          break;
        default:
          console.log("handleStartExcel: nothing");
      }
      // 액셀방송 시작 시 자동 집계(비활성화)
      //setAggregation(true, true);
    } catch (err) {
      console.error(err);
      let message = "방송시작 후 설정 가능합니다.";
      const code = err?.message || "";
      if (ERROR_JOINT.INPROGRESS === +code) {
        message = Message.multiLineMessage([
          "종료되지 않는 합동방송(또는 엑셀방송)이 있습니다.",
          "먼저 종료되지 않은 방송을 종료 후 다시 시작해주세요.",
        ]);
      }
      Message.show(message, {
        title: "타이머 설정",
      });
    }
  });
}

async function callApiStartTime(start) {
  const { value: jointId, label: title } = getSelectProjectData();
  const param = makeProjectUpdateParams(jointId, title);
  console.log(param);
  const hours = param.options.timer.hours || 0;
  const minutes = param.options.timer.minutes || 0;
  const seconds = param.options.timer.seconds || 0;

  const timestamp = moment
    .utc(Date.now())
    .add(hours, "hours")
    .add(minutes, "minutes")
    .add(seconds, "seconds")
    .valueOf();

  param.options.timer.start = start;
  console.log(
    "🔥 ~ callApiStartTime ~ param.options.timer:",
    param.options.timer
  );

  if (start) {
    param.options.timer.timestamp = timestamp;
  } else {
    param.options.timer.timestamp = null;
  }
  const url = `${g_url}/api/joint/project/timer/start`;

  const response = await axios.post(url, param);
  const json = response.data;
  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }
}
// 타이머 시작
function handleStartTimer() {
  const { value: jointId, status } = getSelectProjectData();

  if (JOINT.STATUS.INPROGRESS !== status) {
    return Message.show("방송시작 후 설정 가능합니다.", {
      title: "타이머 설정",
    });
  }

  const secondsMessage = getEndTimerString();
  if ("" === secondsMessage) {
    return Message.show("종료 타이머 값을 설정해 주세요.", {
      title: "타이머 설정",
    });
  }

  const isStart = $(".btn-start-timer").data("start");
  const message = isStart
    ? "타이머를 종료하시겠습니까?"
    : Message.multiLineMessage([
      "타이머를 시작하시겠습니까?",
      `${secondsMessage} 후 방송이 종료됩니다.`,
    ]);

  Message.confirm({ title: "종료타이머", message: message }, async () => {
    try {
      await callApiStartTime(!isStart);
      setTimeStatus(status, !isStart);
    } catch (err) {
      console.error(err);
      Message.show("종료타이머 시작을 실패하였습니다.");
    }
  });
}

async function handleDeleteAllBJ() {
  const me = getMeInfo();
  const trs = $(".join-joint-area tbody tr");
  let results = [];
  let findError = false;
  for await (let e of trs) {
    const tr = $(e);
    const { memberId, isNew, id } = tr.data("value");
    // 대표BJ는 삭제대상아님
    if (String(me.MEMBER_UID) === String(memberId)) {
      continue;
    }
    if (!isNew) {
      try {
        const result = await callApiDeleteBJ(id, memberId);
        results.push(result);
      } catch (e) {
        results.push(e);
        findError = true;
      }
    }
  }

  if (findError) {
    throw new Error("참여 호스트 초기화 중 오류가 발생했습니다.");
  }
}

// 참여 호스트 초기화(전체 초기화)
function handleJoinedBjInit() {
  Message.confirm(
    {
      title: "초기화",
      message: Message.multiLineMessage([
        "참여 호스트 설정을 초기화 하시겠습니까?",
        "삭제하면 복구할 수 없습니다.",
      ]),
    },
    () => {
      return new Promise(async (resolve) => {
        // 참여 호스트 초기화
        await handleDeleteAllBJ();

        // 참여 호스트 설정 초기화(대표BJ 제거)
        const me = getMeInfo();
        const meMemberId = me.MEMBER_UID;
        $(".join-joint-area table tbody tr").each(function () {
          const target = $(this);
          const uid = target.attr("uid");
          if (String(meMemberId) !== String(uid)) {
            target.remove();
          }
        });

        // 후원의 참여 호스트 제거
        deleteAllJoinedBJOptions();

        Message.show("초기화를 완료했습니다.");
        resolve();
      });
    }
  );
}
// BJ 검색
async function callApiBjSearch(loginId, page, limit) {
  const offset = (Math.max(page, 1) - 1) * limit;
  const url = `${g_url}/api/joint/bj/search?loginId=${loginId}&offset=${offset}&limit=${limit}`;

  const response = await axios.get(url);
  const json = response.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }
  return json.resultMap.data;
}

async function searchBJ(page, limit, option) {
  const { search: searchTxt } = option;
  try {
    const { count, list } = await callApiBjSearch(searchTxt, page, limit);

    const searchList = $(".bj-search-list");
    searchList.empty();

    const me = getMeInfo();
    // search-item -> grid: 하위에 2개의 div
    for (let m of list) {
      const row = $("<div>", { class: "search-item" }).appendTo(searchList);
      const clickHandler = (e) => {
        const { MEMBER_UID: meId } = me;

        const target = $(e.currentTarget);
        const member = target.data("member");

        if (meId === member.memberId) {
          Message.preventClose();
          return Message.show("대표 BJ는 추가할 수 없습니다.");
        }

        addJoinedBj(member);
      };
      const imgsrc = m.thumbUrl || "../images/ico_profile_default.png";
      $("<img>", {
        class: "search-item-img",
        src: imgsrc,
      })
        .on("click", clickHandler)
        .appendTo(row);
      $("<div>", {
        class: "search-item-nickname",
        text: m.nickname,
      }).appendTo(row);
      $("<div>", {
        class: "search-item-id",
        text: m.memberId,
      }).appendTo(row);
      $("<div>", {
        class: "search-item-btn btn btn-sm",
        text: "선택",
        value: m.memberId,
        "data-member": JSON.stringify(m),
      })
        .on("click", clickHandler)
        .appendTo(row);
    }

    // pagination 추가
    const tabPaging = searchList.parent().find(".paging-area .tab-paging");
    createPagination(
      tabPaging,
      PG.BUTTON_CONUT.NORMAL,
      count,
      limit,
      page,
      { search: searchTxt },
      "searchBJ"
    );
  } catch (error) {
    console.warn(error);
  }
}

function addJoinedBj(member) {
  // 참여 호스트
  const tbodyBJ = $(".join-joint-area").find("tbody");
  if (0 === tbodyBJ.length) {
    return;
  }

  // 이미 추가된 사용자 검증
  const trs = $(`.join-joint-area tbody tr[uid=${member.memberId}]`);

  if (0 < trs.length) {
    return Message.show("이미 추가된 BJ 입니다.");
  }

  let idx = tbodyBJ.find("tr").length;

  // bj 추가
  member.isNew = true;
  const data = {
    memberId: member.memberId,
    /* nickname: member.nickname, */
    //  참여 호스트 기본값 셋팅하지 않음.
    nickname: "",
    isNew: member.isNew,
  };
  const user = { nickname: member.nickname, loginId: member.loginId };
  makeJoinedBJRow(tbodyBJ, data, ++idx, user);
}

function getMeInfo() {
  return $("#user_pic").data("me");
}

function makeBJSearch() {
  const container = $("<div>", { class: "bj-search-area" });
  const box = $("<div>", { class: "input-group mb-3 bj-search-box" }).appendTo(
    container
  );

  // list
  $("<div>", { class: "bj-search-list" }).appendTo(container);

  // pagination
  $("<div>", { class: "paging-area" })
    .append($("<div>", { class: "tab-paging" }))
    .appendTo(container);

  // search ui  _.debounce(fireServerEvent, 500)
  $("<input>", {
    type: "text",
    class: "form-control",
    placeholder: "회원(호스트) 아이디를 입력하세요.",
  })
    .on("keyup", function (key) {
      if (key.keyCode == 13) {
        const searchTxt = $(".bj-search-area input").val();
        if (DEFAULT_MIN_SEARCH_TXT > searchTxt.length) {
          Message.show("검색어는 3글자 이상 입력하셔야 합니다.");
          return;
        }
        searchBJ(1, PG.LIMIT.MD, { search: searchTxt });
      }
    })

    .on(
      "input",
      _.debounce((e) => {
        const searchTxt = $(".bj-search-area input").val();
        if (DEFAULT_MIN_SEARCH_TXT > searchTxt.length) {
          return;
        }
        searchBJ(1, PG.LIMIT.MD, { search: searchTxt });
      }, 500)
    )
    .appendTo(box);
  $("<div>", { class: "input-group-append" })
    .append(
      $("<button>", { class: "input-group-text", text: "검색" }).on(
        "click",
        () => {
          const searchTxt = $(".bj-search-area input").val();
          if (DEFAULT_MIN_SEARCH_TXT > searchTxt.length) {
            Message.show("검색어는 3글자 이상 입력하셔야 합니다.");
            return;
          }
          searchBJ(1, PG.LIMIT.MD, { search: searchTxt });
        }
      )
    )
    .appendTo(box);

  //
  return container;
}

// 참여호스트 추가
function handleAddBj() {
  const msgObj = makeBJSearch();
  Message.confirm({ title: "참여회원 호스트", message: msgObj });
}

// bj background color
function handleChangeBjBGColor(color, id) {
  console.log("handleChangeBjBGColor", color, id);
}
// bj name color
function handleChangeBjNameColor(color, id) {
  console.log("handleChangeBjNameColor", color, id);
}

// 참여호스트 삭제 api 호출
async function callApiDeleteBJ(id, memberId) {
  const { value: jointId } = getSelectProjectData();

  const url = `${g_url}/api/joint/bj/remove`;
  const param = { jointId, id, bjMemberId: memberId };

  const response = await axios.post(url, param);
  const json = response.data;
  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }
}

// 참여 호스트 삭제
function handleDeleteBj(data) {
  const me = getMeInfo();
  if (me.MEMBER_UID === data.memberId) {
    return Message.show("대표BJ는 삭제할 수 없습니다.", { type: "wran" });
  }

  Message.confirm(
    { title: "BJ삭제", message: "삭제하면 복구할 수 없습니다." },
    async () => {
      if (!data.isNew) {
        // 이미 저장된 데이터
        await callApiDeleteBJ(data.id, data.memberId);
      }

      const tbodyBj = $(`.join-joint-area table tbody`);
      tbodyBj.find(`tr[uid=${data.memberId}]`).remove();
      const bjcount = tbodyBj.find("tr").length;

      // 참여 호스트 번호 변경
      const bjTrs = tbodyBj.find("tr") || [];
      reNumbering(bjTrs);

      // 후원 참여호스트 제거
      deleteJoinedBJOptions(data.memberId);
    }
  );
}

// 전체 BJ (저장됮 않는 BJ 포함)
function getAllJoinedBJ() {
  const trs = $(".join-joint-area table tbody tr");
  if (0 === trs.length) {
    return [];
  }
  const datas = [];
  for (let tr of trs) {
    datas.push($(tr).data("value"));
  }

  return datas;
}
// 실제 참여한(저장된)
function getJoinedBJ() {
  return (getAllJoinedBJ() || []).filter((e) => {
    return !e.isNew;
  });
}

function setAggregationTimer(start) {
  if (!start) {
    if (!_.isNil(aggregationIntervalId)) {
      clearInterval(aggregationIntervalId);
    }
    return;
  }

  // page가 1페이지 이고, 상태가 진행 상태일경우에만 가능
  if (!_.isNil(aggregationIntervalId)) {
    // 기존 inteval 중지
    clearInterval(aggregationIntervalId);
  }

  aggregationIntervalId = setInterval(() => {
    const pg = $(
      ".sponsor-joint-area .paging-area .tab-paging .paging.current"
    ).data("pg");
    // 데이터가 하나도 없나가, 1페이지일 경우.
    if (_.isNil(pg) || pg === 1) {
      // sponsor list 호출
      loadSponsorList(1, PG.LIMIT.LG).catch((e) => {
        console.error(e);
      });
    }
  }, 1500);
}

function setAggregation(start) {
  const { status } = getSelectProjectData();
  const inProgress = JOINT.STATUS.INPROGRESS === status;

  $(".btn-sponsor-stop").data("value", start);
  if (start) {
    $(".btn-sponsor-stop").text("집계정지");
    $(".btn-sponsor-stop").removeClass("btn-normal");
  } else {
    $(".btn-sponsor-stop").text("집계시작");
    $(".btn-sponsor-stop").addClass("btn-normal");
  }

  if (inProgress) {
    setAggregationTimer(start, status);
  }
}

// 집계정지
function handleStopAggregation() {
  const { status } = getSelectProjectData();
  const inProgress = JOINT.STATUS.INPROGRESS === status;
  const start = $(".btn-sponsor-stop").data("value");
  if (!inProgress) {
    return Message.show(
      "집계 시작은 엑셀방송 시작 중일 때만 시작할 수 있습니다."
    );
  }

  const msg = start ? "집계를 정지하시겠습니까?" : "집계를 시작하시겠습니까?";
  Message.confirm(
    {
      title: "엑셀방송",
      message: msg,
    },
    () => {
      setAggregation(!start, status);
    }
  );
}
function callApiSponsorResultDownload(jointId, label, date) {
  const url = `${g_url}/api/joint/sponsor/result/download?jointId=${jointId}`;
  axios
    .get(url, {
      responseType: "blob",
    })
    .then((response) => {
      // 다운로드(서버에서 전달 받은 데이터) 받은 바이너리 데이터를 blob으로 변환합니다.
      const blob = new Blob([response.data]); // 특정 타입을 정의해야 경우에는 옵션을 사용해 MIME 유형을 정의 할 수 있습니다. // const blob = new Blob([this.content], {type: 'text/plain'}) // blob을 사용해 객체 URL을 생성합니다.
      const fileObjectUrl = window.URL.createObjectURL(blob); // blob 객체 URL을 설정할 링크를 만듭니다.

      const link = document.createElement("a");
      link.href = fileObjectUrl;
      link.style.display = "none"; // 다운로드 파일 이름을 지정 할 수 있습니다. // 일반적으로 서버에서 전달해준 파일 이름은 응답 Header의 Content-Disposition에 설정됩니다.

      const extractDownloadFilename = () => {
        const disposition = `${label}_결과_${moment().format(
          "YYYYMMDDHH"
        )}.csv`;
        const fileName = decodeURI(disposition.replace(/['"]/g, ""));
        return fileName;
      }; // 다운로드 파일의 이름은 직접 지정 할 수 있습니다. // link.download = "sample-file.xlsx"; // 링크를 body에 추가하고 강제로 click 이벤트를 발생시켜 파일 다운로드를 실행시킵니다.

      link.download = extractDownloadFilename(response); // 다운로드 파일 이름을 추출하는 함수

      document.body.appendChild(link);
      link.click();
      link.remove(); // 다운로드가 끝난 리소스(객체 URL)를 해제합니다.

      window.URL.revokeObjectURL(fileObjectUrl);
    });
}
// 결과다운로드
function handleDownloadSponsorResult(jointId, label, date) {
  Message.confirm(
    { title: "결과다운로드", message: "결과다운로드를 하시겠습니까?" },
    () => {
      return new Promise(async (resolve) => {
        try {
          callApiSponsorResultDownload(jointId, label, date);
        } catch (e) {
          console.error(e);
          Message.show("결과다운로드 중 오류가 발생했습니다.", {
            type: "error",
          });
        } finally {
          resolve();
        }
      });
    }
  );
}

function callApiSponsorHistoryDownload(jointId, label, date) {
  const url = `${g_url}/api/joint/sponsor/history/download?jointId=${jointId}`;

  axios
    .get(url, {
      responseType: "blob",
    })
    .then((response) => {
      // 다운로드(서버에서 전달 받은 데이터) 받은 바이너리 데이터를 blob으로 변환합니다.
      const blob = new Blob([response.data]); // 특정 타입을 정의해야 경우에는 옵션을 사용해 MIME 유형을 정의 할 수 있습니다. // const blob = new Blob([this.content], {type: 'text/plain'}) // blob을 사용해 객체 URL을 생성합니다.
      const fileObjectUrl = window.URL.createObjectURL(blob); // blob 객체 URL을 설정할 링크를 만듭니다.

      const link = document.createElement("a");
      link.href = fileObjectUrl;
      link.style.display = "none"; // 다운로드 파일 이름을 지정 할 수 있습니다. // 일반적으로 서버에서 전달해준 파일 이름은 응답 Header의 Content-Disposition에 설정됩니다.

      const extractDownloadFilename = () => {
        const disposition = `${label}_내역_${moment().format(
          "YYYYMMDDHH"
        )}.csv`;
        const fileName = decodeURI(disposition.replace(/['"]/g, ""));
        return fileName;
      }; // 다운로드 파일의 이름은 직접 지정 할 수 있습니다. // link.download = "sample-file.xlsx"; // 링크를 body에 추가하고 강제로 click 이벤트를 발생시켜 파일 다운로드를 실행시킵니다.

      link.download = extractDownloadFilename(response); // 다운로드 파일 이름을 추출하는 함수

      document.body.appendChild(link);
      link.click();
      link.remove(); // 다운로드가 끝난 리소스(객체 URL)를 해제합니다.

      window.URL.revokeObjectURL(fileObjectUrl);
    });
}
// 내역다운로드
function handleDownloadSponsorHistory(jointId, label, date) {
  Message.confirm(
    { title: "내역다운로드", message: "내역다운로드를 하시겠습니까?" },
    () => {
      return new Promise(async (resolve) => {
        try {
          callApiSponsorHistoryDownload(jointId, label, date);
        } catch (e) {
          console.error(e);
          Message.show("내역다운로드 중 오류가 발생했습니다.", {
            type: "error",
          });
        } finally {
          resolve();
        }
      });
    }
  );
}

// BJ 추가
async function callApiSaveBJ(saveParams) {
  const results = [];
  for await (let sp of saveParams) {
    const { id, param, isNew } = sp;
    let url = "";
    if (isNew) {
      url = `${g_url}/api/joint/bj/add`;
    } else {
      url = `${g_url}/api/joint/bj/update`;
      param.id = id;
    }

    const response = await axios.post(url, param);
    const json = response.data;

    if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
      //throw new Error(json.message || "");
      results.push(new Error(json.message || ""));
    } else {
      results.push(json.resultMap.data);
    }

    //json.resultMap.data;
  }

  return results;
}

function getBjDataFromTr(tr) {
  const show = tr.find("td.col-show input").prop("checked");
  const rate = tr.find("td.col-rate input").val();
  const custom = tr.find("td.col-custom input").val();
  const bgcolor = tr.find("td.col-bg-color input").val();
  const namecolor = tr.find("td.col-name-color input").val();

  return { show, rate, custom, bgcolor, namecolor };
}

function makeTrDataValue(tr, func) {
  const bjData = func(tr);
  const prevVal = tr.data("value");
  for (let key in bjData) {
    if ("namecolor" === key) {
      _.set(prevVal, "colors.name", bjData[key]);
    } else if ("bgcolor" === key) {
      _.set(prevVal, "colors.bg", bjData[key]);
    } else {
      prevVal[key] = bjData[key];
    }
  }
  return prevVal;
}

function isSameData(tr, func) {
  const prevVal = tr.data("value");
  let isSame = true;
  const bjData = func(tr);

  if (prevVal.isNew) {
    isSame = false;
  } else {
    for (let key in bjData) {
      if ("namecolor" === key) {
        isSame = _.get(prevVal, "colors.name") === bjData[key];
      } else if ("bgcolor" === key) {
        isSame = _.get(prevVal, "colors.bg") === bjData[key];
      } else {
        // type 체크하지 않음.
        isSame = prevVal[key] == bjData[key];
      }
      if (!isSame) {
        break;
      }
    }
  }

  return { isSame, bjData };
}

async function saveAllJoinedBJ(jointId) {
  const columnNameBJ = $(`.join-joint-area th.col-nickname input`).val();

  // retrn: value, error

  const trs = $(".join-joint-area tbody tr");
  let isValid = true;
  const saveParams = [];
  let findError = false;
  //수정된 항목만 필터링함.
  for (let i = 0; i < trs.length; i++) {
    const tr = $(trs.get(i));
    const prevVal = tr.data("value");
    const { memberId, isNew, id } = prevVal;
    const { isSame, bjData } = isSameData(tr, getBjDataFromTr);

    if (isSame) {
      continue;
    }

    const { show, custom, bgcolor, namecolor, rate } = bjData;

    const param = {
      jointId,
      bjMemberId: memberId,
      show,
      rate,
      options: {
        custom,
        colors: {
          bg: bgcolor,
          name: namecolor,
        },
      },
    };
    saveParams.push({ id, param, isNew: !!isNew });
  }
  if (isValid) {
    const results = await callApiSaveBJ(saveParams);

    (results || []).forEach((e) => {
      // forEach에서 return 해당 건만 skip함.
      if (e instanceof Error) {
        findError = true;
        return;
      }
      const {
        id,
        user: { memberId },
      } = e;

      const tr = $(`.join-joint-area tbody tr[uid=${memberId}]`);
      if (0 === tr.length) return;
      const newData = makeTrDataValue(tr, getBjDataFromTr);
      //const data = tr.data("value");
      newData.isNew = false;
      newData.id = id;

      tr.data("value", newData);
    });
  }
  // 후원리스트
  if (findError) {
    throw new Error("참여 호스트 저장 중 오류가 발생했습니다.");
  }
}

// 후원리스트 참여 호스트 추가
function appendJoinedBJOptions() {
  const bjlist = getJoinedBJ();
  let idMap = {};
  const selectObj = $(
    ".sponsor-joint-area tbody td.col-bj-nickname select:first"
  );
  selectObj.find("option").each(function () {
    const mid = $(this).val();
    idMap[mid] = mid;
  });

  const selectors = $(".sponsor-joint-area tbody td.col-bj-nickname select");
  bjlist.forEach((m) => {
    if (!idMap[m.memberId]) {
      $("<option>", { value: m.memberId, text: m.nickname }).appendTo(
        selectors
      );
    }
  });
}

// 후원리스트 참여 호스트 제거
function deleteJoinedBJOptions(memberId) {
  $(
    `.sponsor-joint-area tbody td.col-bj-nickname select option[value=${memberId}]`
  ).remove();
}

// 후원리스트 참여 호스트 제거
function deleteAllJoinedBJOptions() {
  //$(`.sponsor-joint-area tbody td.col-bj-nickname select option[value!='']`).remove();
  const me = getMeInfo();
  $(`.sponsor-joint-area tbody td.col-bj-nickname select option`).each(
    function () {
      const target = $(this);
      const value = target.val();
      if (String(me.MEMBER_UID) !== String(value) && "" !== value) {
        target.remove();
      }
    }
  );
}

// 저장
async function saveJointSettins() {
  try {
    // 설정 저장
    // project settings
    const { value: jointId, label: title } = getSelectProjectData() || {};
    if (_.isNil(title)) {
      return Message.show("먼저 프로젝트를 선택하거나 생성해 주세요");
    }

    // 참여 호스트 설정
    await saveAllJoinedBJ(jointId);
    // 프로젝트 저장
    await callApiProjectUpdate(title, jointId);

    // 참여 호스트 정리.
    appendJoinedBJOptions();
    Message.show("설정이 저장되었습니다.");
  } catch (e) {
    if (ERROR_JOINT.END === +e?.message || 0) {
      const { value: jointId } = getSelectProjectData();
      setStartJointButton(JOINT.STATUS.END, jointId);
      return Message.show("종료된 방송입니다.");
    }
    console.error(e);
    Message.show("설정 저장 중 오류가 발생하였습니다.", { type: "error" });
  }
}
// END HANDLER ////////////////////////////////////////////////

function reNumbering(trs) {
  let idx = 1;
  for (tr of trs) {
    $(tr).find("td:first-child").text(idx++);
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

function onNumberInputOnly(obj, allowBlank = false) {
  const max = obj.getAttribute("max") || Number.MAX_SAFE_INTEGER;
  const min = obj.getAttribute("min") || Number.MAX_SAFE_INTEGER * -1;
  const val = obj.value.replace(/[^0-9.-]/g, "").replace(/(\..*)\./g, "$1");
  if (!allowBlank || "" !== val) {
    obj.value = Math.min(max, val);
    obj.value = Math.max(min, obj.value);
  }
}

// 설정정보를 불러온다.
async function loadSettings() {
  const currentJoint = await getCurrenExcel();
  await loadProjectList(currentJoint);
}

async function getCurrenExcel() {
  try {
    const url = `${g_url}/api/joint/settings/detail`;

    const response = await axios.get(url);
    const json = response.data;

    if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
      throw new Error(json.message || "");
    }

    return json.resultMap.data;
  } catch (e) {
    console.error(e);
  }
}

async function setCurrenJoint(jointId, jointName) {
  try {
    const url = `${g_url}/api/joint/settings/update`;
    const param = { jointId, jointName };
    const response = await axios.post(url, param);
    const json = response.data;

    if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
      throw new Error(json.message || "");
    }

    return json.resultMap.data;
  } catch (e) {
    console.error(e);
  }
}
// 프로젝트 리스트
async function loadProjectList(currentJoint) {
  try {
    const result = await callApiProjectList();
    //console.log("🔥 ~ loadProjectList ~ result:", result);
    makeProjectList(result);

    if (result) {
      const inprogressJointId = _.get(
        _.find(result || [], (e) => JOINT.STATUS.INPROGRESS === e.status),
        "jointId"
      );
      const latestJointId = result[0]?.jointId;
      const currentJointId = currentJoint.jointId;
      const jointId =
        inprogressJointId || currentJointId || latestJointId || undefined;
      if (!jointId) {
        return;
      }
      // 최근 아이템 선택
      selectProjectOption(
        $(
          `.project-area .select-project-name .dropdown-item[value=${jointId}]`
        ),
        false
      );
    }
    // bj column 셋팅
  } catch (err) {
    console.error(err);
    const message = "프로젝트 리스트를 불러오는 중 오류가 발생했습니다.";
    Message.show(message, { title: "프로젝트 리스트", type: "error" });
  }
}

// 데이터는 유지하되 새로운 데이터로 알려준다.
function keepAllJointData(mainBjId) {
  changeBJSettingsWithNew(mainBjId);
  clearSponsorSetting();
}

function clearAllJointData() {
  // clear timer setting
  clearTimerSetting();
  clearBJSettings();
  clearSponsorSetting();
}

async function setProjectSettings(detail, isOnlyProject = false) {
  // project detail settings.
  // 검증: 선택된 정보와 동일성.
  const { value } = getSelectProjectData();
  const {
    jointId,
    minAmount,
    showMainBJ,
    status,
    options: { timer, bj },
  } = detail;

  if ("" == jointId || +value !== jointId) {
    return;
  }
  // 엑셀방송 시작 버튼  //btn-start-project
  setStartJointButton(status, jointId);
  setTimerButton(status);

  // 프로젝트 정보만 로딩한다.
  if (isOnlyProject) {
    disableBJSetting(JOINT.STATUS.REG);
    return;
  }

  // timer 설정
  const { hours = "", minutes = "", seconds = "", start } = timer || {};
  setTimerSetting(hours, minutes, seconds, status, start);

  //참여호스트 ///////////////////////////
  const {
    header: bjHeader,
    align: { value: align, column },
  } = bj || {};
  await setBJSettgins(
    jointId,
    minAmount,
    showMainBJ,
    align,
    column,
    bjHeader,
    status
  );

  // 후원리스트 설정 ///////////////////////////
  await setSponsorSettings(jointId, status);
}

function setTimerButton(status) {
  if (JOINT.STATUS.END === status) {
    $(".joint-setting-box .timer-input-area input").attr("disabled", true);
    $(".joint-setting-box .timer-button-area button").attr("disabled", true);
  } else {
    $(".joint-setting-box .timer-input-area input").attr("disabled", false);
    $(".joint-setting-box .timer-button-area button").attr("disabled", false);
  }
}

function setStartJointButton(status, jointId) {
  disableProjectSetting(status);
  disableBJSetting(status);

  // 프로젝틀 리스트에 상태 변경
  setInprogressJoint(jointId, status);

  //$(".btn-start-project").data("status", status);
  const predata = $(".select-project-name .dropdown-toggle").data("value");
  $(".select-project-name .dropdown-toggle").data("value", {
    ...predata,
    status,
  });
}

function disableProjectSetting(status) {
  let clsname = "btn";
  const getButtonLabel = (status) => {
    switch (status) {
      case JOINT.STATUS.INPROGRESS:
        clsname = "btn-accent";
        return "합동방송 종료";
      case JOINT.STATUS.END:
        return "합동방송 종료";
      case JOINT.STATUS.DELETE: // 방어코드
        return "합동방송 삭제됨.";
      default:
        return "합동방송 시작";
    }
  };

  if (JOINT.STATUS.INPROGRESS < status) {
    // 엑셀방송 종료 및 삭제
    $(".btn-start-project").addClass("btn-start-project-end");
    $(".btn-start-project").attr("disabled", true);
    $(".btn-start-project").text("합동방송이 종료되었습니다.");
    setAggregation(false);
  } else {
    // 엑셀방송 대기/진행
    $(".btn-start-project").removeClass("btn-start-project-end");
    $(".btn-start-project").attr("disabled", false);
    $(".btn-start-project").text(getButtonLabel(status));
  }
  // class 재지정
  $(".btn-start-project").removeClass("btn btn-accent");
  $(".btn-start-project").addClass(clsname);
}

// 타이머 셋팅
function clearTimerSetting() {
  $("#timer-hour").val("");
  $("#timer-minutes").val();
  $("#timer-seconds").val("");
}
function setTimeStatus(status, start = false) {
  const disabled = JOINT.STATUS.INPROGRESS < status;
  // button disabled
  $("button.btn-start-timer").attr("disabled", disabled);
  $("button.btn-start-timer").data("status", status);
  $("button.btn-start-timer").data("start", start);

  if (start) {
    $(".btn-start-timer").text("종료");
  } else {
    $(".btn-start-timer").text("시작");
  }
}

function setTimerSetting(
  hours = "",
  minutes = "",
  seconds = "",
  status,
  start
) {
  $("#timer-hour").val(hours);
  $("#timer-minutes").val(minutes);
  $("#timer-seconds").val(seconds);

  setTimeStatus(status, start);
}

// 참여 호스트 셋팅 데이터는 유지 isNew는 true로 설정한다.
function changeBJSettingsWithNew(mainBjId) {
  //대표 BJ빼고 모두 isNew를 true
  const me = getMeInfo();
  $(".join-joint-area")
    .find("tbody tr")
    .each(function () {
      const target = $(this);
      const data = target.data("value");
      const uid = target.attr("uid");
      if (String(me.MEMBER_UID) === String(uid)) {
        data.isNew = false;
        data.id = mainBjId;
        target.data("value", data);
      } else {
        data.isNew = true;
      }

      target.data("value", data);
    });
}

// 참여 호스트 셋팅
function clearBJSettings() {
  //최소후원수량
  $("#minAmount").val("");
  // 대표 BJ
  $("#showMainBJ").prop("checked", DEFAULT.BJ.SHOWMAINBJ);

  // 가로 정렬
  $("#sortAlign").prop("checked", DEFAULT.BJ.SORTALIGN);
  $("#alignLength").val("");

  const thead = $(".join-joint-area").find("thead");
  // 비고
  thead.find(".col-custom input[type=text]").val(DEFAULT.BJ.HEADER.CUSTOM);
  thead
    .find(".col-custom input[type=checkbox]")
    .prop("checked", DEFAULT.BJ.HEADER.ENABLECUSTOM);

  $(".join-joint-area").find("tbody").empty();
}
async function setBJSettgins(
  jointId,
  minAmount = "",
  showMainBJ = DEFAULT.BJ.SHOWMAINBJ, // 대표 BJ
  align,
  column,
  header,
  status
) {
  //최소후원수량
  minAmount = 0 === minAmount ? 0 : minAmount;
  $("#minAmount").val(minAmount);
  // 대표 BJ
  $("#showMainBJ").prop("checked", showMainBJ);
  // 가로 정렬
  $("#sortAlign").prop("checked", align);
  $("#alignLength").val(column);

  // 참여자 리스트 헤더 셋팅
  setHeaderInJoinedBJ(header, status);

  // 참여 호스트 리스트
  await loadJoinedBJSettings(jointId);

  // 종료된 방송일 경우버튼 disabled
  disableBJSetting(status);
}

function disableBJSetting(status) {
  const me = getMeInfo();

  const container = $(".join-joint-area");
  if (JOINT.STATUS.END === status) {
    container.find("button").attr("disabled", true);
    container.find("input").attr("disabled", true);
    container.find("table .col-bg-color > div").hide();
    container.find("table .col-name-color > div").hide();
  } else if (JOINT.STATUS.INPROGRESS === status) {
    container.find("button").attr("disabled", true);
    container.find("table .col-bg-color > div").show();
    container.find("table .col-name-color > div").show();
    container.find("input").attr("disabled", false);
    // bj 추가 버튼 enable
    container.find("button.btn-bj-add").attr("disabled", false);
    // 배분률 disabled
    container.find(".col-rate input").attr("disabled", true);

    //container.find("table tbody .col-show input").attr("disabled", false);
    //container.find("table tbody .col-custom input").attr("disabled", false);
    //container.find("#minAmount").attr("disabled", false);
    //container.find("#showMainBJ").attr("disabled", false);
  } else {
    const container = $(".join-joint-area");
    container.find("button").attr("disabled", false);
    container.find("input").attr("disabled", false);
    container.find("table .col-bg-color > div").show();
    container.find("table .col-name-color > div").show();
    container
      .find(`table tr[uid=${me.MEMBER_UID}] button`)
      .attr("disabled", true);
  }
  //대표BJ는 엑셀표기 무조건 disable true;
  container
    .find(`table tr[uid=${me.MEMBER_UID}] .col-show input`)
    .attr("disabled", true);
}

function setHeaderInJoinedBJ(header) {
  const { nickname, custom, enableCustom } = header;
  const tbody = $(".join-joint-area").find("tbody");
  const thead = $(".join-joint-area").find("thead");
  if (0 === thead.length) {
    return;
  }
  // custom
  thead.find(".col-custom input[type=text]").val(custom);
  const customEl = thead.find(".col-custom input[type=checkbox]");
  customEl.prop("checked", enableCustom);
  customEl.on("change", function () {
    const ischecked = $(this).is(":checked");
    disableTableInput(tbody.find("td.col-custom input"), !ischecked);
  });
}

async function setSponsorSettings(jointId, status) {
  // 집계 정지( 수동으로 할 수있도록 수정)
  //setAggregation(JOINT.STATUS.INPROGRESS === status);

  // 집계 시작 popover
  $(".btn-sponsor-stop").popover({
    trigger: "hover",
    html: true,
    content: function () {
      return Message.multiLineMessage([
        "누르면 후원 목록을 새로 불러옵니다.",
        "엑셀방송이 시작중일때와 후원리스트 스크롤이 상단에 위치해야만 집계가 가능합니다.",
        "(1.5초마다 자동 갱신됩니다.)",
      ]);
    },
  });

  await loadSponsorList(1, PG.LIMIT.LG);
}

function clearSponsorSetting() {
  $(".sponsor-joint-area table tbody").empty();
}

// 참여 호스트 설정 ///////////////////////////////////////////////////////////////////////////////////
async function callApiProjectDetail(jointId) {
  if (_.isNil(jointId)) {
    throw new Error('"jointId" is Notfound.');
  }
  const url = `${g_url}/api/joint/project/detail?jointId=${jointId}`;

  const response = await axios.get(url);
  const json = response.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }
  return json.resultMap.data;
}

async function callApiProjectList() {
  const url = `${g_url}/api/joint/project/list`;

  const response = await axios.get(url);
  const json = response.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }
  return json.resultMap.data;
}

function makeProjectOption(data) {
  const createDate = moment(data.createdAt)
    .local()
    .format("YYYY-MM-DD HH:mm:ss");
  return {
    label: $("<div>", {
      class: "prj-label-box",
      "data-label": data.title,
      "data-date": createDate,
      "data-status": data.status,
    })
      .append($("<div>", { class: "prj-label-name", text: data.title }))
      .append($("<div>", { class: "prj-label-date", text: createDate })),
    value: data.jointId,
  };
}

// get project value;
function getSelectProjectData() {
  return $(".select-project-name .dropdown-toggle").data("value") || {};
}

function setSelectProjectData(key, value) {
  let data = getSelectProjectData();
  data = _set(data, key, value);
  $(".select-project-name .dropdown-toggle").data("value", data);
}

// project option select
function selectProjectOption(item, keepData = false) {
  if (0 === item.length) {
    return;
  }
  //console.log("🔥 ~ selectProjectOption ~ keepData:======>", keepData);

  handleProjectOptionSelect(null, item, keepData);
}
function handleProjectOptionSelect(e, currentTarget, keepData = false) {
  // 선택 시
  const target = currentTarget || $(e.currentTarget);
  const label = target.find(".prj-label-box").data("label");
  const date = target.find(".prj-label-box").data("date");
  const status = target.find(".prj-label-box").data("status");
  const value = target.val();

  const inprogressJointId = getInprogressJointId();
  if (!_.isNil(inprogressJointId) && value !== inprogressJointId) {
    return Message.show("먼저 진행 중인 회차를 종료해 주세요.");
  }

  const button = $(".select-project-name").find("button.dropdown-toggle");
  button.text("");
  //button.data("value", value);
  button.prepend(
    $("<div>", { class: "selected-project-option" })
      .append(
        $("<div>", { class: "selected-project-option-name", text: label })
      )
      .append($("<div>", { class: "selected-project-option-date", text: date }))
      .append(
        $("<span aria-hidden='true'>&times;</span>").on("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const item = $(`.select-project-name .dropdown-item[value=${value}]`);
          handleDeleteProject(item, value, label, () => {
            const latestItem = $(
              ".select-project-name .dropdown-menu .dropdown-item:first"
            );
            if (0 === latestItem.length) {
              button.text(DEFAULT_PROJECT_LABEL);
              button.data("value", null);
              clearAllJointData();
            } else {
              // 프로젝트가 존재하면 최근 프로젝트로
              selectProjectOption(latestItem, false);
            }
          });
        })
      )
  );
  button.data("value", { label, value, date, status });

  // 선택된 엑셀 정보 저장
  setCurrenJoint(value, label).catch((e) => console.error(e));
  // project 정보를 가져오 셋팅
  callApiProjectDetail(value)
    .then((detail) => {
      setProjectSettings(detail, keepData);
    })
    .catch((e) => {
      console.error(e);
    });
}

function makeProjectList(data) {
  const optionData = (data || []).map((e) => makeProjectOption(e));
  const projectSelect = $(".project-name-box");
  const selectBox = makeSelectBox(
    DEFAULT_PROJECT_LABEL,
    "select-project-name",
    {
      optionData,
      //close: true,
      //closeCallback: handleDeleteProject,
    },
    handleProjectOptionSelect
  );
  selectBox.appendTo(projectSelect);
}
function makeJoinedBJRow(tbody, data, index, user) {
  const {
    memberId = Date.now(),
    show = true,
    rate = 0,
    custom = "",
    colors,
  } = data;

  const thead = $(".join-joint-area").find("thead");

  // 비고
  const isEnableCustom = thead
    .find(".col-custom input[type=checkbox]")
    .is(":checked");

  const tr = $("<tr>", {
    uid: memberId,
    "data-value": JSON.stringify(data),
  }).appendTo(tbody);
  // 순번
  $("<td>", { class: "col-no", text: index }).appendTo(tr);
  // 참여 호스트 아이디
  $("<td>", {
    class: "col-bj",
    text: user.loginId,
  }).appendTo(tr);
  // excel 표기
  $("<td>", { class: "col-show" })
    .append(makeCheckbox(`show-${memberId}`, "", show))
    .appendTo(tr);
  //nickname
  $("<td>", { class: "col-nickname", text: user.nickname }).appendTo(tr);
  //배분율(%)
  $("<td>", { class: "col-rate" })
    .append(
      $("<input>", {
        type: "number",
        placeholder: "0",
        max: "100",
        value: rate,
      }).on("input", (e) => {
        onNumberInputOnly(e.currentTarget);
      })
    )
    .appendTo(tr);
  // 비고
  $("<td>", { class: "col-custom" })
    .append(
      $("<input>", {
        type: "text",
        placeholder: "비고 입력",
        disabled: !isEnableCustom,
        value: custom,
      })
    )
    .appendTo(tr);

  //배경 색
  const bgId = `bj-bg-${memberId}`;
  const bjBGColor = colors?.bg || DEFAULT.BJ.COLORS.BG;
  const bgColorpicker = makeColorPicker(bgId, bjBGColor);
  $("<td>", { class: "col-bg-color" }).append(bgColorpicker).appendTo(tr);
  setTextColor($(`#${bgId}`), bjBGColor, (color) => {
    handleChangeBjBGColor(color, memberId);
  });

  const nameId = `bj-name-${memberId}`;
  const bjNameColor = colors?.name || DEFAULT.BJ.COLORS.NAME;
  const nameColorpicker = makeColorPicker(nameId, bjNameColor);
  $("<td>", { class: "col-name-color" }).append(nameColorpicker).appendTo(tr);
  setTextColor($(`#${nameId}`), bjNameColor, (color) => {
    handleChangeBjNameColor(color, memberId);
  });

  const delButton = $("<td>", { class: "col-del" })
    .append(
      $("<button>", {
        class: "btn btn-outline-danger btn-sm font-sm",
        text: "삭제",
      }).on("click", () => {
        const data = tr.data("value");
        handleDeleteBj(data);
      })
    )
    .appendTo(tr);
}

async function callApiJoinedBJList(jointId) {
  const url = `${g_url}/api/joint/bj/list?jointId=${jointId}`;

  const response = await axios.get(url);
  const json = response.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }

  return json.resultMap.data || [];
}
async function loadJoinedBJSettings(jointId) {
  const members = await callApiJoinedBJList(jointId);
  const tbody = $(".join-joint-area").find("tbody");
  if (0 === tbody.length) {
    return;
  }
  tbody.empty();

  members.forEach((member, index) => {
    const { id, nickname, show, user, payoutRate: rate, options } = member;
    const { memberId } = user;
    const { colors, custom } = options;
    const data = {
      // FIXME memeberId로 변경(필요한 정보 memberId, options, id)
      id,
      memberId,
      nickname,
      show,
      rate,
      custom,
      colors,
      isNew: false,
    };
    makeJoinedBJRow(tbody, data, index + 1, user);
  });
}

// 후원 설정 ///////////////////////////////////////////////////////////////////////////////////
function makeSponsorRow(data, bjlist) {
  const {
    id = "",
    createdAt = "",
    memberId,
    displayName,
    userLoginId,
    userNickname,
    amount: gold = 0, // 후원 렉스
  } = data;
  const tr = $("<tr>", {
    sid: id,
    "data-value": JSON.stringify(data),
  });

  const sponsrName = _.isEmpty(userLoginId)
    ? ""
    : `${userLoginId ?? ""}/${userNickname ?? ""}`;

  // 후원 일자
  $("<td>", {
    class: "col-sponsor-date",
    text: moment.utc(createdAt).local().format("YYYY-MM-DD HH:mm:ss"),
  }).appendTo(tr);
  // 후원(아이디/닉네임)
  $("<td>", {
    class: "col-sponsor-id",
    text: sponsrName,
  }).appendTo(tr);
  // 참여. BJ
  $("<td>", {
    class: "col-bj-nickname",
    text: displayName || "미지정",
    uid: memberId,
  }).appendTo(tr);
  //후원렉스
  $("<td>", {
    class: "col-sponsor-gold",
    text: numberWithCommas(gold),
  }).appendTo(tr);

  return tr;
}

async function callApiSponsorList(page, limit) {
  const { value: jointId } = getSelectProjectData();
  const offset = (Math.max(page, 1) - 1) * limit;
  const url = `${g_url}/api/joint/sponsor/list?jointId=${jointId}&offset=${offset}&limit=${limit}`;

  const response = await axios.get(url);
  const json = response.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }
  return json.resultMap.data;
}

async function loadSponsorList(page, limit) {
  const tbody = $(".sponsor-joint-area").find("tbody");
  if (0 === tbody.length) {
    return;
  }
  const { list, totalCount } = await callApiSponsorList(page, limit);

  // 전체 참여 호스트
  const bjlist = getJoinedBJ();

  tbody.empty();
  list.forEach((value) => {
    const tr = makeSponsorRow(value, bjlist);
    tr.appendTo(tbody);
  });

  // pagination 추가
  const tabPaging = $(".sponsor-joint-area .paging-area .tab-paging");
  createPagination(
    tabPaging,
    PG.BUTTON_CONUT.NORMAL,
    totalCount,
    limit,
    page,
    {},
    "loadSponsorList"
  );
}

function makeCheckbox(id, label, isCheck) {
  const layer = $("<div>", {
    class: "custom-control custom-control-inline custom-checkbox",
  });
  const inputEl = $("<input>", {
    type: "checkbox",
    class: "custom-control-input",
    id: id,
  }).appendTo(layer);
  const lableEl = $("<label>", {
    class: "custom-control-label",
    for: id,
    text: label,
  }).appendTo(layer);

  inputEl.prop("checked", isCheck);

  return layer;
}

function makeColorPicker(id, color) {
  const colorPicker = $("<input>", {
    type: "text",
    value: color,
    name: id,
    id: id,
    readonly: true,
    class: "form-control",
  });

  return colorPicker;
}

function setTextColor(_target, _color, callback) {
  _target.val(_color);
  _target.attr("color", _color);
  _target.spectrum({
    color: _color,
    showInput: false,
    showAlpha: true,
    className: "color-picker",
    showInitial: true,
    preferredFormat: "hex",
    chooseText: "선택",
    cancelText: "취소",
    change: function (color) {
      console.log("color.toHex8String()", color.toHex8String());
      $(this).val(color.toHex8String());
      $(this).attr("color", color.toHex8String());
      callback(color.toHex8String());
    },
  });
}

function makeSelectOption(
  parent,
  data,
  close,
  closeCallback,
  callback,
  isPrepend = false
) {
  const { label, value, id } = data;
  const item = $("<button>", {
    class: "dropdown-item",
    type: "buttonm",
    value: value,
    "data-label": label,
  }).on("click", (e) => {
    callback(e);
  });

  if (!isPrepend) {
    parent.append(item);
  } else {
    parent.prepend(item);
  }

  // lable
  if (typeof label === "string") {
    item.append($("<div>", { text: label }));
  } else {
    item.append(label);
  }

  if (!_.isNil(id)) {
    item.data("id", id);
  }

  if (close) {
    item.append(
      $('<span aria-hidden="true">&times;</span>').on("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!_.isNil(closeCallback)) {
          const value = item.val();
          const label = item.data("label");
          closeCallback(item, value, label);
        }
      })
    );
  }
}

function makeSelectBox(label, className, options, callback) {
  const dropdown = $("<div>", { class: "dropdown" });
  if (!_.isNil(className)) {
    dropdown.addClass(className);
  }
  const {
    optionData = [],
    className: optClasName,
    close = false,
    closeCallback,
  } = options;

  const dropdownToggle = $("<button>", {
    class: "btn btn-normal dropdown-toggle",
    type: "button",
    "data-toggle": "dropdown",
    "aria-expanded": false,
    text: label,
  }).appendTo(dropdown);

  if (!_.isNil(optClasName)) {
    dropdownToggle.addClass(optClasName);
  }

  const dropDownMenu = $("<div>", {
    class: "dropdown-menu",
  }).appendTo(dropdown);

  for (el of optionData) {
    makeSelectOption(dropDownMenu, el, close, closeCallback, callback);
  }

  return dropdown;
}

function disableTableInput(columnSelector, disabled) {
  let target;
  if (typeof columnSelector === "string") {
    target = $(columnSelector);
  } else {
    target = columnSelector;
  }
  target.attr("disabled", disabled);
}

function getEndTimerString() {
  const hours = $("#timer-hour").val();
  const minutes = $("#timer-minutes").val();
  const seconds = $("#timer-seconds").val();
  const delimit = ["시간", "분", "초"];

  if (_.isNil(hours) && _.isNil(minutes) && _.isNil(seconds)) {
    return "";
  }

  return [hours, minutes, seconds].reduce((pv, val, index) => {
    if ("" === val) {
      return pv;
    }
    const cv = val + delimit[index];
    return pv === "" ? cv : pv + " " + cv;
  }, "");
}

function startSocket(_key) {
  const socket = io(g_url_socket, {
    autoConnect: false,
    //secure: true,
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    socket.emit(
      "login",
      {
        page: _key,
      },
      function (data) {
        console.log("login:");
      }
    );
  });

  socket.on("disconnect", function (data) {
    console.log("disconnect~~~~~~~", data);
    // alert("통신이 끊어졌습니다");
  });

  socket.on("eventaction", function (data) {
    switch (data.type) {
      case JOINT.DATA_TYPE.STOP_PROJECT:
      case JOINT.DATA_TYPE.END_PROJECT: {
        const { value: jointId } = getSelectProjectData();
        setStartJointButton(JOINT.STATUS.END, jointId);
        disableBJSetting(JOINT.STATUS.END);
      }
      default:
        return;
    }
  });

  socket.open();
}

function goToPrevious(url) {
  location.href = url;
}

g_login_checking(login_callbackFn);
function login_callbackFn(member) {
  console.log("🔥 ~ login_callbackFn ~ member:", member);
  const page = getQueryParam(location.href, "page");

  $("#user_pic").data("me", member);
  if (member.IMG_URL && member.IMG_URL != "") {
    $("#user_pic").find("img").attr("src", member.IMG_URL);
  }

  $("#user_name").text(member.NAME);
  $("#user_mid").text("(" + member.MID + ")");

  init(page);
}
