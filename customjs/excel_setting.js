axios.defaults.withCredentials = true;
let aggregationIntervalId = undefined;
const DEFAULT_PROJECT_LABEL = "프로젝트 선택";
const DEFAULT_MIN_SEARCH_TXT = 3;
//상태: 1(등록중) 2(대기) 3(진행중) 4(종료) 5(삭제)
const ERROR_EXCEL = {
  INPROGRESS: 2000,
  END: 1028,
};
const TBL_ROW_TYPE_BATTLES = "BATTLES";
const TBL_ROW_TYPE_TEAM = "TEAM";

const DEFAULT = {
  BJ: {
    COLORS: { BG: "#00000000", NAME: "#00000000" },
    SHOWZEROSCOREON: true, // 0 점표기
    SHOWMAINBJ: false, // 대표 BJ
    MINUSSCOREON: false,
    HEADER: {
      NICKNAME: "호스트",
      GOLD: "렉스",
      RATE: "기여도",
      ENABLERATE: true,
      CUSTOM: "비고",
      ENABLECUSTOM: false,
    },
  },
  RANKING: {
    COLORS: { BG: "#00000000", NAME: "#00000000" },
    HEADER: {
      ENABLEDAILYPAY: false,
      CUSTOM: "",
      ENABLECUSTOM: false,
    },
    SORTALIGN: false,
    SORT: "gold",
  },
  TEAM: {
    SORT: 'lex',
    COLUMNS: [
      { name: "렉스", enable: true },
      { name: "기여도", enable: true },
    ],
    COLORS: { BG: "#00000000", NAME: "#00000000", WIN: "#00ff00" },
  },
  BATTLE: {
    DSPSCORE: "lex",
    DIFFERENCESCORES: false,
    TIMER: {
      USE: false,
      STATUS: 2,
    }
  }
};
// 팀 작업 시 모두 제거
const joinedBJs = {
  members: [],
};

const teamSetting = {
  columns: [],
  teams: [],
};

const sponsorlist = {
  oneNoneNode: false,
  list: [],
};
///////////////////////////////////////////

async function init(page) {
  try {
    addEvent();

    clearAllExcelData();
    await loadSettings();
    startSocket(page);
  } finally {
    $(".spinner-border").css("display", "none");
  }
}

function addEvent() {
  const me = getMeInfo();

  $(".btn-goto-previous").attr("disabled", false);

  // 신규생성 버튼
  $(".btn-create-project").click(function (e) {
    handleCreateProject();
  });
  // 엑셀방송 시작
  $(".btn-start-project").click(function (e) {
    handleStartExcel();
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
      $(`.join-excel-area tbody tr[uid=${meMemberId}] .col-show input`).prop(
        "checked",
        true
      );
    } else {
      $(`.join-excel-area tbody tr[uid=${meMemberId}] .col-show input`).prop(
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

  // BJ timer action
  $('.bj-timer-action').change(function (e) {
    handleBJTimerAction(e.currentTarget);
  });

  // 팀 전체 초기화
  $(".btn-team-init").click(function (e) {
    handleTeamInit();
  });
  // 팀 추가
  $(".btn-team-add").click(function (e) {
    handleAddTeam();
  });
  $('.btn-team-start').click(function (e) {
    handleStartTeam();
  });

  // 배틀 시작/종료
  $(".btn-battle-start").click(function (e) {
    handleStartBattle();
  });
  // 배틀 time 셋팅(check box)
  $(".setUseBattleTimer").click(function (e) {
    //console.log("use battle timer.");
  });
  // 점수차이표시
  $('#setUseDifferenceScores').click(function (e) {
    //console.log("use battle timer.");
  });
  /*  // 타이머 초 설정
   $("#battle-seconds").on("keyup", (e) => {
     // 값 변경 시 렉스 점수 및 기여도 함께 변경
     const data = $(e.currentTarget).val();
   }); */
  // 배틀 타이머 시작/종료
  $(".btn-battle-timer-start").click(function (e) {
    handleTimerStart();
  });
  $(".btn-battle-timer-pause").click(function (e) {
    handleTimerStop();
  });
  // 배틀 타이머 초기화
  $(".btn-battle-timer-init").click(function (e) {
    handleTimerInit();
  });

  $(".btn-battle-team-add").click(function (e) {
    handleAddBattleTeam();
  });
  $(".btn-battle-team-init").click(function (e) {
    handleBattleTeamInit();
  });

  // 1:1 모드 시작
  $(".btn-start-one-n-one").click(function (e) {
    handleStartOneNOneMode();
  });
  // 추가
  $(".btn-sponsor-add").click(function (e) {
    handleAddSponsor();
  });
  //집계정지
  $(".btn-sponsor-stop").click(function (e) {
    handleStopAggregation();
  });
  //결과다운로드
  $(".btn-download-sponsor").click(function (e) {
    const { value: excelId, label, date } = getSelectProjectData();
    if (!_.isNil(excelId)) {
      handleDownloadSponsorResult(excelId, label, date);
    } else {
      Message.show("먼저 프로젝트를 선택하거나 생성해 주세요");
    }
  });
  //내역다운로드
  $(".btn-download-sponsor-history").click(function (e) {
    const { value: excelId, label, date } = getSelectProjectData();
    if (!_.isNil(excelId)) {
      handleDownloadSponsorHistory(excelId, label, date);
    } else {
      Message.show("먼저 프로젝트를 선택하거나 생성해 주세요");
    }
  });

  // 저장
  $("#btn_save").on("click", function () {
    const { label: title, status } = getSelectProjectData() || {};

    if (EXCEL.STATUS.END === status) {
      return Message.show("종료된 방송입니다.");
    }

    if (_.isNil(title)) {
      return Message.show("먼저 프로젝트를 선택하거나 생성해 주세요");
    }
    // 일급체크
    let totalDailyPay = 0;
    $(".ranking-excel-area tbody .col-daily-pay input").each(function () {
      totalDailyPay += +$(this).val();
    });

    if (totalDailyPay > 100) {
      return Message.show(
        Message.multiLineMessage([
          "일급 설정을 다시해주세요.",
          `일급 퍼센트는 100을 초과할 수 없습니다.`,
          `설정한 일급 퍼센트는 ${totalDailyPay}% 입니다.`,
        ])
      );
    }

    // BJ 명은 반드 시 입력해야 함.(표시될 BJ 명을 입력해 주세요.)
    let isVaildBJName = true;
    let isDuplicateBjName = false;
    const bjNameMap = {};
    $(".join-excel-area tbody td.col-nickname input").each(function () {
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
        await saveExcelSettins();
      }
    );
  });
}
// handler ///////////////////////////////////////////////////////////////////////
async function callApiDeleteProject(excelId) {
  const url = `${g_url}/api/excel/project/delete`;
  const param = { excelId };

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
  if (EXCEL.STATUS.INPROGRESS === status) {
    return Message.show(`"${label}" 엑셀방송이 진행 중입니다.`, {
      type: "warn",
    });
  }

  // 삭제 확인
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
function getInprogressExcelId() {
  let finedItem = undefined;
  $(`.project-excel-area .project-box .dropdown-item .prj-label-box`).each(
    function () {
      if (EXCEL.STATUS.INPROGRESS === $(this).data("status")) {
        finedItem = $(this);
      }
    }
  );
  return _.isNil(finedItem) ? undefined : finedItem.parent().attr("value");
}

// 진행 중인 회차
function existInprogressExcel() {
  const excelId = getInprogressExcelId();
  return !_.isNil(excelId);
}

function setInprogressExcel(excelId, status) {
  const findedItem = $(
    `.project-excel-area .project-box .dropdown-item[value=${excelId}]`
  );
  if (0 < findedItem.length) {
    findedItem.find(".prj-label-box").data("status", status);
  } else {
    console.warn(`Not found dropdown-item value=${excelId}`);
  }
}

// 프로젝트 생성
function handleCreateProject() {
  if (existInprogressExcel()) {
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

        //글자 수 체크
        const val = msgObject.find("input").val();
        if (2 > val.length) {
          Message.show("최소 2줄자 이상 입력해야 합니다.");
          Message.preventClose();
          return;
        }

        const result = await callApiProjectCreate(val);

        const { mainBjId } = result;
        if (isKeepData) {
          keepAllExcelData(mainBjId);
        } else {
          clearAllExcelData();
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
            `.project-area .select-project-name .dropdown-item[value=${result.excelId}]`
          ),
          isKeepData
        );
      } catch (e) {
        console.error(e);
      }
    }
  );
}

function makeProjectUpdateParams(excelId, title) {
  return {
    excelId,
    title,
    minAmount: Number($("#minAmount").val() || 0),
    showMainBJ: $("#showMainBJ").prop("checked"),
    minusScoreOn: $("#minusRate").prop("checked"),
    enableTeam: $("#setTeam").prop("checked"),
    onePlusOneMode: $(".btn-start-one-n-one").data("enable"),
    options: {
      bj: {
        showZeroScoreOn: $("#showZeroScoreOn").prop("checked"),
        header: {
          nickname: $(".join-excel-area input[name=nickname]").val(),
          gold: $(".join-excel-area input[name=gold]").val(),
          rate: $(".join-excel-area input[name=rate]").val(),
          enableRate: $(".join-excel-area input[name=enableRate]").prop(
            "checked"
          ),
          custom: $(".join-excel-area input[name=custom]").val(),
          enableCustom: $(".join-excel-area input[name=enableCustom]").prop(
            "checked"
          ),
        },
        timer: {
          action: $('.bj-timer-action').val(),
          second: $('.bj-timer-second').val(),
          minlex: $('.bj-timer-lex').val()
        }
      },
      timer: {
        hours: $("#timer-hour").val(),
        minutes: $("#timer-minutes").val(),
        seconds: $("#timer-seconds").val(),
        start: false,
        timestamp: null,
      },
      ranking: {
        sort: $("input[name=sortRanking]:checked").val(),
        align: {
          value: $("#sortAlign").prop("checked"),
          column: $("#alignLength").val(),
        },
        header: {
          enableDailyPay: $(
            ".ranking-excel-area input[name=enableDailyPay]"
          ).prop("checked"),
          rankingCustom: $(
            ".ranking-excel-area input[name=rankingCustom]"
          ).val(),
          enableRankingCustom: $(
            ".ranking-excel-area input[name=enableRankingCustom]"
          ).prop("checked"),
        },
      },
      team: {
        isAlign: $("#setTeamAlign").prop("checked"),
        sort: $('[name=sortTeam]:checked').val(),
        header: {
          lex: $(".team-excel-area .col-team-gold input[name=lex]").val(),
          rate: $(".team-excel-area .col-team-rate input[name=rate]").val(),
          enableRate: $(".team-excel-area input[name=enableTeamRate]").prop(
            "checked"
          )
        },
      },
      battle: {
        dspScore: $('[name=dspScore]:checked').val(),
        useDifferenceScores: $("#setUseDifferenceScores").prop('checked'),
        timer: {
          useBattleTimer: $('#setUseBattleTimer').prop('checked'),
          seconds: $('#battle-seconds').val()
        }
      }
    },
  };
}

async function callApiProjectUpdate(title, excelId) {
  const url = `${g_url}/api/excel/project/update`;

  const param = makeProjectUpdateParams(excelId, title);

  const response = await axios.post(url, param);
  const json = response.data;
  //console.log("🔥 ~ callApiProjectUpdate ~ json:", json.resultMap.data);

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }
  return json.resultMap.data;
}

async function callApiProjectCreate(title) {
  const url = `${g_url}/api/excel/project/add`;
  const param = {
    title,
    minAmount: Number($("#minAmount").val() || 0),
    showMainBJ: $("#showMainBJ").prop("checked"),
    minusScoreOn: $("#minusRate").prop("checked"),
    enableTeam: $("#setTeam").prop("checked"),
    onePlusOneMode: $(".btn-start-one-n-one").data("enable"),
    options: {
      bj: {
        showZeroScoreOn: $("#showZeroScoreOn").prop("checked"),
        header: {
          nickname: $(".join-excel-area input[name=nickname]").val(),
          gold: $(".join-excel-area input[name=gold]").val(),
          rate: $(".join-excel-area input[name=rate]").val(),
          enableRate: $(".join-excel-area input[name=enableRate]").val(),
          custom: $(".join-excel-area input[name=custom]").val(),
          enableCustom: $(".join-excel-area input[name=enableCustom]").val(),
        },
        timer: {
          useBJTimer: $('.bj-timer-action').val(),
          seconds: $('.bj-timer-second').val(),
          minlex: $('.bj-timer-lex').val()
        }
      },
      timer: {
        hours: $("#timer-hour").val(),
        minutes: $("#timer-minutes").val(),
        seconds: $("#timer-seconds").val(),
      },
      ranking: {
        sort: $("input[name=sortRanking]:checked").val(),
        align: {
          value: $("#sortAlign").prop("checked"),
          column: $("#alignLength").val(),
        },
        header: {
          enableDailyPay: $(
            ".ranking-excel-area input[name=enableDailyPay]"
          ).prop("checked"),
          rankingCustom: $(
            ".ranking-excel-area input[name=rankingCustom]"
          ).val(),
          enableRankingCustom: $(
            ".ranking-excel-area input[name=enableRankingCustom]"
          ).prop("checked"),
        },
      },
      team: {
        isAlign: $("#setTeamAlign").prop("checked"),
        sort: $('[name=sortTeam]:checked').val(),
        header: {
          lex: $(".team-excel-area .col-team-gold input[name=lex]").val(),
          rate: $(".team-excel-area .col-team-rate input[name=rate]").val(),
          enableRate: $(".team-excel-area input[name=enableTeamRate]").prop(
            "checked"
          )
        },
      },
      battle: {
        dspScore: $('[name=dspScore]:checked').val(),
        useDifferenceScores: $("#setUseDifferenceScores").prop('checked'),
        timer: {
          useBattleTimer: $('#setUseBattleTimer').prop('checked'),
          seconds: $('#battle-seconds').val()
        }
      }
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
  const { value: excelId } = getSelectProjectData();

  const url = `${g_url}/api/excel/project/start`;
  const param = { excelId };

  const response = await axios.post(url, param);
  const json = response.data;
  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }

  return json.resultMap.data;
}

async function callApiStopExcel() {
  const { value: excelId } = getSelectProjectData();

  const url = `${g_url}/api/excel/project/stop`;
  const param = { excelId };

  const response = await axios.post(url, param);
  const json = response.data;
  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }

  return json.resultMap.data;
}

// 엑셀 시작
function handleStartExcel() {
  const { status, value: excelId } = getSelectProjectData();
  const message =
    EXCEL.STATUS.INPROGRESS === status
      ? "엑셀방송을 종료하시겠습니까?"
      : "엑셀방송을 시작하시겠습니까?";
  Message.confirm({ title: "엑셀방송", message }, async () => {
    try {
      switch (status) {
        case EXCEL.STATUS.REG:
        case EXCEL.STATUS.WAIT:
          // 엑셀방송 시작
          await callApiStartExcel();
          setStartExcelButton(EXCEL.STATUS.INPROGRESS, excelId);
          break;
        case EXCEL.STATUS.INPROGRESS:
          // bj timer초기화
          await handleBJTimerEnd();

          // 엑셀방송 종료
          await callApiStopExcel();
          setStartExcelButton(EXCEL.STATUS.END, excelId);

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
      if (ERROR_EXCEL.INPROGRESS === +code) {
        message = Message.multiLineMessage([
          "종료되지 않는 엑셀방송(또는 합동방송)이 있습니다.",
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
  const { value: excelId, label: title } = getSelectProjectData();
  const param = makeProjectUpdateParams(excelId, title);
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
  /* console.log(
    "🔥 ~ callApiStartTime ~ param.options.timer:",
    param.options.timer
  ); */

  if (start) {
    param.options.timer.timestamp = timestamp;
  } else {
    param.options.timer.timestamp = null;
  }
  const url = `${g_url}/api/excel/project/timer/start`;

  const response = await axios.post(url, param);
  const json = response.data;
  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }
}
// 타이머 시작
function handleStartTimer() {
  const { value: excelId, status } = getSelectProjectData();

  if (EXCEL.STATUS.INPROGRESS !== status) {
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
  const trs = $(".join-excel-area tbody tr");
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

async function handleDeleteAllRanking() {
  const trs = $(".ranking-excel-area tbody tr");
  let results = [];
  let findError = false;
  for await (let e of trs) {
    const tr = $(e);
    const { isNew, id } = tr.data("value");
    // 랭킹1위 는 남겨둔다(대표 BJ용)
    const order = tr.attr("order");
    if ("1" === order) {
      continue;
    }

    if (!isNew) {
      try {
        const result = await callApiDeleteRanking(id);
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
        $(".join-excel-area table tbody tr").each(function () {
          const target = $(this);
          const uid = target.attr("uid");
          if (String(meMemberId) !== String(uid)) {
            target.remove();
          }
        });

        //랭킹 초기화
        await handleDeleteAllRanking();
        // 랭킹 설정 초기화(order 1은 제외)
        $(".ranking-excel-area table tbody tr").each(function () {
          const target = $(this);
          const order = target.attr("order");
          if ("1" !== order) {
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
  const url = `${g_url}/api/excel/bj/search?loginId=${loginId}&offset=${offset}&limit=${limit}`;

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
  const tbodyBJ = $(".join-excel-area").find("tbody");
  if (0 === tbodyBJ.length) {
    return;
  }

  // 랭킹
  const tbodyRanking = $(".ranking-excel-area").find("tbody");
  if (0 === tbodyRanking.length) {
    return;
  }

  // 이미 추가된 사용자 검증
  const trs = $(`.join-excel-area tbody tr[uid=${member.memberId}]`);

  if (0 < trs.length) {
    return Message.show("이미 추가된 호스트 입니다.");
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
  joinedBJs.members.push(member);
  makeJoinedBJRow(tbodyBJ, data, ++idx, user);

  // 랭킹추가
  const dataRanking = { isNew: true, id: Date.now() };
  makeRankingRow(tbodyRanking, dataRanking, idx);

  //팀원추가 dropdown item 추가
  const dropDownMenu = $(".team-excel-area .col-select-memeber .dropdown-menu");
  const dropdownData = { label: data.nickname, value: data.memberId };
  makeSelectOption(
    dropDownMenu,
    dropdownData,
    null,
    null,
    handleSelectTeamMember
  );
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

async function handleBJTimerEnd() {
  try {
    $target = $('.bj-timer-action');
    $target.find(`option[value=${EXCEL.DATA_TYPE.BJ_TIMER_END}]:first`).prop('selected', true);

    const { value: excelId, label: title } = getSelectProjectData() || {};

    const params = {
      action: EXCEL.DATA_TYPE.BJ_TIMER_END,
      second: 0,
      minlex: 0
    };

    await callApiBJTimerAction(title, excelId, params);
  } catch (e) {
    console.error(e);
  }
}

// BJ Timer Action
async function handleBJTimerAction(target) {
  try {

    const { status } = getSelectProjectData() || {};

    const timerAction = $(target);
    const timerActionVal = timerAction.val();
    const timerSeconds = parseInt($('.bj-timer-second').val() || 0);
    const timerLex = parseInt($('.bj-timer-lex').val() || 0);

    if (EXCEL.STATUS.END === status) {
      Message.show("종료된 엑셀입니다.", { title: "타이머 설정" });
      return timerAction.find('option:first').prop('selected', true);
    }

    if (0 === timerSeconds && EXCEL.DATA_TYPE.TIMER_END !== timerActionVal) {
      Message.show("타이머 초를 설정해 주세요.", { title: "타이머 설정" });
      return timerAction.find('option:first').prop('selected', true);
    }

    let params = {};
    switch (timerActionVal) {
      case EXCEL.DATA_TYPE.BJ_TIMER_READY:
      case EXCEL.DATA_TYPE.BJ_TIMER_START:
      case EXCEL.DATA_TYPE.BJ_TIMER_STOP:
      case EXCEL.DATA_TYPE.BJ_TIMER_END:
        params = {
          action: timerActionVal,
          second: timerSeconds,
          minlex: timerLex
        };
        break;
      default:
        throw new Error("BJ 타이머 액션이 올바르지 않습니다.");
    }

    /* await sendTimerAction({
      type: 'excel',
      data: params
    }); */
    const { value: excelId, label: title } = getSelectProjectData() || {};
    if (_.isNil(title) || _.isNil(excelId)) {
      return Message.show("먼저 프로젝트를 선택하거나 생성해 주세요");
    }

    await callApiBJTimerAction(title, excelId, params);
  } catch (e) {
    console.error(e)
  }
}



function handleBJTimerReset(data) {
  console.log("🔥 ~ handleBJTimerReset ~ data:", data)
  const { nickname } = data;
  const msg = _.isEmpty(nickname) ? "타이머를 초기화 하시겠습니까?" : `${nickname}의 타이머를 초기화 하시겠습니까?`;
  Message.confirm({ title: "타이머 초기화", message: msg }, async () => {
    console.log('😀 handle bj timer reset', data);
    try {
      const param = {
        type: 'excel',
        data: {
          type: EXCEL.DATA_TYPE.BJ_TIMER_RESET,
          memberId: data.memberId,
          msg: "timer reset"
        }
      };

      await sendTimerReset(param);
    } catch (e) {
      Message.show("타이머 초기화에 실패하였습니다.", { type: "wran" });
    }
  });
}

async function callApiBJTimerAction(title, excelId, params) {
  const url = `${g_url}/api/excel/project/bjtimer`;

  const param = makeProjectUpdateParams(excelId, title);
  param['action'] = params.action;
  param['second'] = params.second;

  const response = await axios.post(url, param);
  const json = response.data;
  //console.log("🔥 ~ callApiProjectUpdate ~ json:", json.resultMap.data);

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }
  return json.resultMap.data;
}


async function sendTimerReset(param) {
  try {
    const response = await axios.post(g_url + "/preset/eventaction", param);
    let json = response.data;
    console.log("🔥 ~ sendTimerReset ~ json:", json);
  } catch (error) {
    console.error("Error sending timer action:", error);
  }
}



// 참여호스트 추가
function handleAddBj() {
  const msgObj = makeBJSearch();
  Message.confirm({ title: "참여회원 호스트", message: msgObj });
}
// 팀 초기화
function handleTeamInit() {
  Message.confirm(
    { title: "팀 초기화", message: Message.multiLineMessage(["팀 설정을 초기화 하시겠습니까?", "삭제하면 바로 적용됩니다."]) },
    async () => {
      try {

        // 이미 저장된 데이터
        await handleDeleteAllTeam();

      } catch (e) {
        Message.show("팀 삭제를 실패하였습니다.", { type: "wran" });
      }
    }
  );
}

//팀 추가
function handleAddTeam() {
  const tbody = $(".team-excel-area").find("tbody");
  if (0 === tbody.length) {
    return;
  }
  // 팀원에 추가된 사용자
  const items = $(
    ".team-excel-area .col-select-memeber .dropdown-menu:first .dropdown-item"
  );
  let disableMembers = [];

  for (let item of items) {
    if ($(item).prop("disabled")) {
      disableMembers.push($(item).val());
    }
  }

  const nextIndex = tbody.find("tr").length + 1;
  const data = { isNew: true, teamId: Date.now() };
  makeTeamRow(tbody, data, nextIndex, TBL_ROW_TYPE_TEAM, handleDeleteTeam);

  // 멤버들을 모두 모아 disabled 처리(새로운 조에 들어가지 못하도록)
  (disableMembers || []).forEach((memberId) => {
    disableTeamMember(memberId, true, tbody);
  });
}

// bj background color
function handleChangeBjBGColor(color, id) {
  console.log("handleChangeBjBGColor", color, id);
}
// bj name color
function handleChangeBjNameColor(color, id) {
  console.log("handleChangeBjNameColor", color, id);
}

// ranking background color
function handleChangeRankingBGColor(color, id) {
  console.log("handleChangeRankingBGColor", color, id);
}
// ranking name color
function handleChangeRankingNameColor(color, id) {
  console.log("handleChangeRankingNameColor", color, id);
}
// 참여호스트 삭제 api 호출
async function callApiDeleteBJ(id, memberId) {
  const { value: excelId } = getSelectProjectData();

  const url = `${g_url}/api/excel/bj/remove`;
  const param = { excelId, id, bjMemberId: memberId };

  const response = await axios.post(url, param);
  const json = response.data;
  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }
}
// 랭킹 삭제
async function callApiDeleteRanking(id) {
  const { value: excelId } = getSelectProjectData();
  const url = `${g_url}/api/excel/ranking/remove`;
  const param = { excelId, id };

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
      //
      joinedBJs.members = joinedBJs.members.filter(
        (d) => d.memberId !== data.memberId
      );

      if (!data.isNew) {
        // 이미 저장된 데이터
        await callApiDeleteBJ(data.id, data.memberId);
      }

      const tbodyBj = $(`.join-excel-area table tbody`);
      tbodyBj.find(`tr[uid=${data.memberId}]`).remove();
      const bjcount = tbodyBj.find("tr").length;

      // 참여 호스트 번호 변경
      const bjTrs = tbodyBj.find("tr") || [];
      reNumbering(bjTrs);

      // 랭캥 삭제 (제일 마지막 부터 삭제한다.)
      const tbodyRk = $(".ranking-excel-area table tbody");
      const rkcount = tbodyRk.find("tr").length;

      // 방어코드(ranking의 갯수가 bj 갯수보다 크지 않으면 삭제하지 않는다.)
      if (bjcount < rkcount) {
        const trLast = tbodyRk.find("tr:last");
        //const trLast = $(".ranking-excel-area table tbody tr:last");
        const { isNew, id } = trLast.data("value");
        if (!isNew) {
          await callApiDeleteRanking(id);
        }
        trLast.remove();
      }

      // 팀원선택항목에서 삭제
      leaveTeam(data.memberId);

      // 후원 참여호스트 제거
      deleteJoinedBJOptions(data.memberId);
    }
  );
}


// ranking background color
function handleChangeTeamBGColor(color, id) {
  console.log("handleChangeTeamBGColor", color, id);
}
// ranking name color
function handleChangeTeamNameColor(color, id) {
  console.log("handleChangeTeamNameColor", color, id);
}

function handleChangeTeamWinColor(color, id) {
  console.log("handleChangeTeamWinColor", color, id);
}
// one plus one
async function callApiOnePlusOne(excelId, enable) {
  const url = `${g_url}/api/excel/sponsor/oneplusone`;
  const param = {
    excelId,
    enable,
  };

  const response = await axios.post(url, param);
  const json = response.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }

  return json.resultMap.data;
}

function setOnePlusOneButton(enable) {
  if (enable) {
    $(".btn-start-one-n-one").addClass("btn-accent").text("1+1모드 종료");
  } else {
    $(".btn-start-one-n-one").removeClass("btn-accent").text("1+1모드 시작");
  }
  $(".btn-start-one-n-one").data("enable", enable);
}

// 1:1 모드 시작
async function handleStartOneNOneMode() {
  const isEnable = !$(".btn-start-one-n-one").data("enable");
  const { value: excelId, status } = getSelectProjectData();

  if (EXCEL.STATUS.INPROGRESS !== status) {
    return Message.show("엑셀 방송 중이 아닙니다.");
  }

  if (isEnable) {
    Message.show("1+1 모드를 시작합니다.");
  } else {
    Message.show("1+1 모드를 종료합니다.");
  }
  try {
    await callApiOnePlusOne(excelId, isEnable);
    setOnePlusOneButton(isEnable);
  } catch (err) {
    console.error(err);
    Message.show("1+1 실행 중 오류가 발생하였습니다.", { type: "error" });
  }
}

// 전체 BJ (저장됮 않는 BJ 포함)
function getAllJoinedBJ() {
  const trs = $(".join-excel-area table tbody tr");
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

function makeSelectBoxWithBJ(option, defaultValue = "-1") {
  // select
  const selectBJ = $("<select>", option || {});
  // 미지정 옵션
  $("<option>", {
    disabled: true,
    selected: ["-1", null].includes(defaultValue),
    text: "미지정",
    value: "-1",
  }).appendTo(selectBJ);

  // 전체 참여 호스트(대표 BJ 제거)
  const me = getMeInfo();
  const bjlist = (getJoinedBJ() || []).filter(
    (e) => e.memberId !== me.MEMBER_UID
  );

  bjlist.forEach((m) => {
    const selected = String(m.memberId) === String(defaultValue);
    $("<option>", { value: m.memberId, text: m.nickname, selected }).appendTo(
      selectBJ
    );
  });

  return selectBJ;
}

function makeSponsorAdd() {
  const container = $("<div>", { class: "add-sponsor-area" });
  // table 구성
  const table = $("<table>", { class: "add-sponsor-table" }).appendTo(
    container
  );
  const thead = $("<thead>", { class: "add-sponsor-thead" }).appendTo(table);
  const thr = $("<tr>").appendTo(thead);
  $("<th>", { text: "후원닉네임", class: "add-sponsor-nickname-th" }).appendTo(
    thr
  );
  $("<th>", { text: "후원아이디", class: "add-sponsor-id-th" }).appendTo(thr);
  $("<th>", { text: "후원렉스", class: "add-sponsor-lex-th" }).appendTo(thr);
  $("<th>", { text: "참여호스트", class: "add-sponsor-bj-th" }).appendTo(thr);
  $("<th>", { text: "렉스점수", class: "add-sponsor-lex-score-th" }).appendTo(
    thr
  );
  $("<th>", { text: "기여도", class: "add-sponsor-rate-score-th" }).appendTo(
    thr
  );
  $("<th>", { text: "관리", class: "add-sponsor-manage-th" }).appendTo(thr);

  const tbody = $("<tbody>", { class: "add-sponsor-tbody" }).appendTo(table);
  const tr = $("<tr>").appendTo(tbody);
  // 후원닉네임
  $("<td>")
    .append(
      $("<input>", {
        class: "form-control add-sponsor-nickname",
        placeholder: "닉네임을 입력하세요.",
      })
    )
    .appendTo(tr);
  // 후원아이디
  $("<td>")
    .append(
      $("<input>", {
        class: "form-control add-sponsor-id",
        placeholder: "아이디를 입력하세요.",
      })
    )
    .appendTo(tr);
  // 후원렉스
  $("<td>")
    .append(
      $("<input>", {
        class: "form-control add-sponsor-lex",
        placeholder: "렉스를 입력하세요",
        type: "number",
        value: 0,
      }).on("keyup", (e) => {
        // 값 변경 시 렉스 점수 및 기여도 함께 변경
        const data = $(e.currentTarget).val();
        $("input.add-sponsor-lex-score").val(data);
        $("input.add-sponsor-rate-score").val(data);
      })
    )
    .appendTo(tr);

  // 참여호스트
  const selectBjItem = $("<td>").appendTo(tr);

  makeSelectBoxWithBJ({
    class: "custom-select add-sponsor-bj",
  }).appendTo(selectBjItem);

  // 렉스 점수
  $("<td>")
    .append(
      $("<input>", {
        class: "form-control add-sponsor-lex-score",
        placeholder: "렉스점수를 입력하세요",
        type: "number",
        value: 0,
      })
    )
    .appendTo(tr);
  // 기여도
  $("<td>")
    .append(
      $("<input>", {
        class: "form-control add-sponsor-rate-score",
        placeholder: "기여도를 입력하세요",
        type: "number",
        value: 0,
      })
    )
    .appendTo(tr);
  // 삭제 버튼
  $("<td>")
    .append(
      $("<button>", {
        class: "btn btn-normal btn-sponsor-add",
        text: "추가",
      }).on("click", () => {
        appendSponsorConfirm();
      })
    )
    .appendTo(tr);

  return container;
}

// 후원리스트 - 대기열에서 확정으로 이동.
function appendSponsorConfirm() {
  const sponsorNickname = $(".add-sponsor-nickname");
  const sponsorId = $(".add-sponsor-id");
  const sponsorGold = $(".add-sponsor-lex");
  const sponsorBjId = $(".add-sponsor-bj");
  const sponsorGoldScore = $(".add-sponsor-lex-score");
  const sponsorRateScore = $(".add-sponsor-rate-score");

  const tr = $("<tr>").insertAfter(".add-sponsor-tbody tr:first");
  // 후원릭네임
  $("<td>", {
    class: "add-sponsor-nickname-data",
  })
    .append(
      $("<input>", {
        class: "form-control",
        placeholder: "닉네임을 입력하세요.",
        value: sponsorNickname.val(),
      })
    )
    .appendTo(tr);
  //후원아이디
  $("<td>", {
    class: "add-sponsor-id-data",
  })
    .append(
      $("<input>", {
        class: "form-control",
        placeholder: "아이디를 입력하세요.",
        value: sponsorId.val(),
      })
    )
    .appendTo(tr);
  //후훤렉스
  $("<td>", {
    class: "add-sponsor-lex-data",
  })
    .append(
      $("<input>", {
        class: "form-control",
        placeholder: "렉스를 입력하세요",
        type: "number",
        value: sponsorGold.val(),
      }).on("keyup", (e) => {
        // 값 변경 시 렉스 점수 및 기여도 함께 변경
        const data = $(e.currentTarget).val();
        $(tr).find("td.add-sponsor-lex-score-data input").val(data);
        $(tr).find("td.add-sponsor-rate-score-data input").val(data);
      })
    )
    .appendTo(tr);
  //참여호스트

  $("<td>", {
    class: "add-sponsor-bj-data",
  })
    .append(makeSelectBoxWithBJ({ class: "custom-select" }, sponsorBjId.val()))
    .appendTo(tr);
  //렉스점수
  $("<td>", {
    class: "add-sponsor-lex-score-data",
  })
    .append(
      $("<input>", {
        class: "form-control",
        placeholder: "렉스점수를 입력하세요",
        type: "number",
        value: sponsorGoldScore.val(),
      })
    )
    .appendTo(tr);
  //기여도
  $("<td>", {
    class: "add-sponsor-rate-score-data",
  })
    .append(
      $("<input>", {
        class: "form-control",
        placeholder: "기여도를 입력하세요",
        type: "number",
        value: sponsorRateScore.val(),
      })
    )
    .appendTo(tr);
  // 삭제버튼
  $("<td>")
    .append(
      $("<button>", {
        text: "삭제",
        class: "btn btn-sm btn-accent",
      }).on("click", () => {
        tr.remove();
      })
    )
    .appendTo(tr);

  // clear input data
  sponsorNickname.val("");
  sponsorId.val("");
  sponsorGold.val(0);
  sponsorBjId.val("-1");
  //sponsorBjText.
  sponsorGoldScore.val(0);
  sponsorRateScore.val(0);
}

async function callApiSponsorCancel(
  excelId,
  id,
  targetId,
  sponsorScore,
  sponsorContribution
) {
  const url = `${g_url}/api/excel/sponsor/cancel`;
  const param = {
    id,
    excelId,
    targetId,
    sponsorScore,
    sponsorContribution,
  };

  const response = await axios.post(url, param);
  const json = response.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }

  return json.resultMap.data;
}

async function handleCancelSponsor(
  id,
  targetId,
  sponsorScore,
  sponsorContribution
) {
  if ("" === targetId) {
    return Message.show("참여B를 선택해 주세요.");
  }
  Message.confirm(
    {
      title: "후원리스트",
      message: "선택한 후원항목을 취소하시겠습니까?",
    },
    async () => {
      const { value: excelId } = getSelectProjectData();
      try {
        await callApiSponsorCancel(
          excelId,
          id,
          targetId,
          sponsorScore,
          sponsorContribution
        );
        // 데이터 클리어
        $(
          `.sponsor-excel-area tbody tr[sid=${id}] td.col-bj-nickname select`
        ).val("");
        $(
          `.sponsor-excel-area tbody tr[sid=${id}] td.col-gold-score input`
        ).val("");
        $(`.sponsor-excel-area tbody tr[sid=${id}] td.col-rate input`).val("");
      } catch (err) {
        console.error(err);
        Message.show("후원 취소를 실패하여습니다.", { type: "error " });
      }
    }
  );
}

async function callApiSponsorUpdate(
  excelId,
  id,
  targetId,
  sponsorScore,
  sponsorContribution
) {
  const url = `${g_url}/api/excel/sponsor/update`;
  const param = {
    id,
    excelId,
    targetId,
    sponsorScore,
    sponsorContribution,
  };

  const response = await axios.post(url, param);
  const json = response.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }

  return json.resultMap.data;
}

async function handleUpdateSponsor(
  id,
  targetId,
  sponsorScore,
  sponsorContribution
) {
  if ("" === targetId) {
    return Message.show("참여 호스트를 선택하세요.");
  }

  Message.confirm(
    {
      title: "후원리스트",
      message: "선택한 후원항목을 수정하시겠습니까?",
    },
    async () => {
      const { value: excelId } = getSelectProjectData();
      try {
        await callApiSponsorUpdate(
          excelId,
          id,
          targetId,
          sponsorScore,
          sponsorContribution
        );
      } catch (err) {
        console.error(err);
        Message.show("후원 수정을 실패하였습니다.", { type: "error" });
      }
    }
  );
}

async function callApiSponsorAdd(data) {
  const { value: excelId } = getSelectProjectData();
  const {
    userLoginId,
    userNickname,
    sponsorAmount,
    memberId: targetId,
    sponsorScore,
    sponsorContribution,
  } = data;

  const url = `${g_url}/api/excel/sponsor/add`;
  const param = {
    excelId,
    targetId,
    loginId: userLoginId,
    nickname: userNickname,
    sponsorAmount,
    sponsorScore,
    sponsorContribution,
  };

  const response = await axios.post(url, param);
  const json = response.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }

  return json.resultMap.data;
}

// 후원추가
function handleAddSponsor() {
  const msgObject = makeSponsorAdd();
  Message.confirm(
    {
      title: "후원리스트를 추가하시겠습니까?",
      message: msgObject,
      className: "modal-xl",
    },
    async () => {
      const tbody = $(".sponsor-excel-area").find("tbody");
      if (0 === tbody.length) {
        return;
      }
      const sponsorBody = msgObject.find(".add-sponsor-tbody");
      const dataLen = sponsorBody.find("tr").length;
      if (0 === dataLen) {
        return;
      }
      const datas = [];
      for (let i = 1; i < dataLen; i++) {
        const trow = sponsorBody.find(`tr:nth(${i})`);
        trow.find("input, select").removeClass("invalid-input");

        const userLoginId = trow.find("td.add-sponsor-id-data input").val();
        const userNickname = trow
          .find("td.add-sponsor-nickname-data input")
          .val();
        const sponsorAmount = trow.find("td.add-sponsor-lex-data input").val();
        const displayName = trow
          .find("td.add-sponsor-bj-data select option:selected")
          .text();
        const memberId = trow.find("td.add-sponsor-bj-data select").val();
        const sponsorScore = trow
          .find("td.add-sponsor-lex-score-data input")
          .val();
        const sponsorContribution = trow
          .find("td.add-sponsor-rate-score-data input")
          .val();

        // check valudation
        if (_.isEmpty(userNickname)) {
          Message.preventClose();
          Message.show("후원닉네임을 입력하세요.");
          trow
            .find("td.add-sponsor-nickname-data input")
            .addClass("invalid-input");
          return;
        } else if (_.isEmpty(userLoginId)) {
          Message.preventClose();
          Message.show("후원아이디를 입력하세요.");
          trow.find("td.add-sponsor-id-data input").addClass("invalid-input");
          return;
        } else if (_.isEmpty(memberId)) {
          Message.preventClose();
          Message.show("참여 호스트를 선택하세요.");
          trow.find("td.add-sponsor-bj-data select").addClass("invalid-input");
          return;
        }

        datas.unshift({
          userLoginId,
          userNickname,
          sponsorAmount,
          displayName,
          memberId,
          sponsorScore,
          sponsorContribution,
        });
      }

      try {
        for await (let data of datas) {
          const result = await callApiSponsorAdd(data);

          bjlist = getJoinedBJ();
          const { id, createdAt } = result;
          const tr = makeSponsorRow({ ...data, id, createdAt }, bjlist);
          tr.prependTo(tbody);
        }
      } catch (err) {
        Message.preventClose();
        Message.show(
          Message.multiLineMessage([
            "후원추가를 실패하였습니다.",
            "잠시 후 다시 시도해 주세요.",
          ])
        );
      }
    }
  );
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
      ".sponsor-excel-area .paging-area .tab-paging .paging.current"
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

function setExcelSettingByStorage(value) {
  try {
    if (_.isEmpty(value)) return;
    localStorage.setItem("excel-setting", JSON.stringify(value));
  } catch (e) {
    console.error(e);
  }
}

function getExcelSettingByStorage() {
  try {
    const data = localStorage.getItem("excel-setting") || {};
    return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
}

function clearExcelSettingByStorage() {
  localStorage.removeItem("excel-setting");
}

function setAggregation(start) {
  const { value: excelId, status } = getSelectProjectData();
  const inProgress = EXCEL.STATUS.INPROGRESS === status;

  $(".btn-sponsor-stop").data("value", start);
  if (start) {
    $(".btn-sponsor-stop").text("집계정지");
    $(".btn-sponsor-stop").removeClass("btn-normal");
  } else {
    $(".btn-sponsor-stop").text("집계시작");
    $(".btn-sponsor-stop").addClass("btn-normal");
  }

  setExcelSettingByStorage({ aggregationTimer: { excelId, start } });

  if (inProgress) {
    setAggregationTimer(start, status);
  }
}

// 집계정지
function handleStopAggregation() {
  const { status } = getSelectProjectData();
  const inProgress = EXCEL.STATUS.INPROGRESS === status;
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
// 결과다운로드
function handleDownloadSponsorResult(excelId, label, date) {
  const url = `${g_url}/api/excel/sponsor/result/download?excelId=${excelId}`;
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
function callApiSponsorHistoryDownload(excelId, label, date) {
  const url = `${g_url}/api/excel/sponsor/history/download?excelId=${excelId}`;

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
function handleDownloadSponsorHistory(excelId, label, date) {
  Message.confirm(
    { title: "내역다운로드", message: "내역다운로드를 다운로드하시겠습니까?" },
    () => {
      return new Promise(async (resolve) => {
        try {
          callApiSponsorHistoryDownload(excelId, label, date);
        } catch (e) {
          console.error(e);
          Message.show("내역 다운로드 중 오류가 발생했습니다.", {
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
      url = `${g_url}/api/excel/bj/add`;
    } else {
      url = `${g_url}/api/excel/bj/update`;
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
  const position = tr.find("td.col-position input").val();
  const nickname = tr.find("td.col-nickname input").val();
  const gold = tr.find("td.col-gold input").val();
  const rate = tr.find("td.col-rate input").val();
  const custom = tr.find("td.col-custom input").val();
  const bgcolor = tr.find("td.col-bg-color input").val();
  const namecolor = tr.find("td.col-name-color input").val();

  return { show, position, nickname, gold, rate, custom, bgcolor, namecolor };
}

function getRankingDataFromTr(tr) {
  const dailyPay = tr.find("td.col-daily-pay input").val() || 0;
  const custom = tr.find("td.col-ranking-custom input").val();
  const bgcolor = tr.find("td.col-bg-color input").val();
  const namecolor = tr.find("td.col-name-color input").val();

  return { dailyPay, custom, bgcolor, namecolor };
}

function makeTrDataValue(tr, func) {
  const bjData = func(tr);
  const prevVal = tr.data("value");
  for (let key in bjData) {
    if ("namecolor" === key) {
      _.set(prevVal, "colors.name", bjData[key]);
    } else if ("bgcolor" === key) {
      _.set(prevVal, "colors.bg", bjData[key]);
    } else if ('wincolor' === key) {
      _.set(prevVal, "colors.win", bjData[key]);
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

function isSameArryData(tr, func) {
  const prevVal = tr.data("value");
  const newVal = func(tr);

  const prevStr = JSON.stringify(prevVal);
  const newStr = JSON.stringify(newVal);

  const isSame = prevStr === newStr;

  return { isSame, newVal }
}

async function saveAllJoinedBJ(excelId) {
  const columnNameBJ = $(`.join-excel-area th.col-nickname input`).val();
  const columnNameGold = $(`.join-excel-area th.col-gold input`).val();
  const columnNameRate = $(`.join-excel-area th.col-rate input`).val();

  // retrn: value, error

  const trs = $(".join-excel-area tbody tr");
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

    const { show, position, nickname, gold, rate, custom, bgcolor, namecolor } =
      bjData;

    if (_.isEmpty(nickname) || 2 > nickname.length) {
      isValid = false;

      return Message.show(
        `${i + 1}번째 BJ의 ${columnNameBJ}를 입력해 주세요(최소 2자이상 입력)`
      );
    } else if (_.isEmpty(gold)) {
      isValid = false;

      return Message.show(
        `${i + 1}번째 BJ의 ${columnNameGold}를 입력해 주세요`
      );
    } else if (_.isEmpty(rate)) {
      isValid = false;
      return Message.show(
        `${i + 1}번째 BJ의 ${columnNameRate}를 입력해 주세요`
      );
    }

    const param = {
      excelId,
      bjMemberId: memberId,
      position,
      nickname,
      gold,
      rate,
      show,
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

      const tr = $(`.join-excel-area tbody tr[uid=${memberId}]`);
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

  return true;
}

async function callApiSaveRanking(saveParams) {
  const results = [];
  for await (let sp of saveParams) {
    const { id, param, isNew } = sp;
    let url = "";
    if (isNew) {
      url = `${g_url}/api/excel/ranking/add`;
    } else {
      url = `${g_url}/api/excel/ranking/update`;
      param.id = id;
    }

    const response = await axios.post(url, param);
    const json = response.data;

    if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
      results.push(new Error(json.message || ""));
    } else {
      results.push(json.resultMap.data);
    }
  }
  return results;
}

async function saveAllRanking(excelId) {
  const trs = $(".ranking-excel-area tbody tr");

  const saveParams = [];
  let findError = false;
  for (let i = 0; i < trs.length; i++) {
    const tr = $(trs.get(i));
    const { isNew, id } = tr.data("value");
    const { isSame, bjData } = isSameData(tr, getRankingDataFromTr);
    if (isSame) {
      continue;
    }
    const { dailyPay, custom, bgcolor, namecolor } = bjData;

    let param = {
      order: i + 1,
      excelId,
      dailyPay,
      custom,
      options: {
        colors: {
          bg: bgcolor,
          name: namecolor,
        },
      },
    };
    saveParams.push({ id, param, isNew: !!isNew });
  }

  const results = await callApiSaveRanking(saveParams);
  (results || []).forEach((e) => {
    // forEach에서 return 해당 건만 skip함.
    if (e instanceof Error) {
      findError = true;
      return;
    }
    const { id, order } = e;

    const tr = $(`.ranking-excel-area table tr[order=${order}]`);
    if (0 === tr.length) return;
    const newData = makeTrDataValue(tr, getRankingDataFromTr);
    const data = tr.data("value");
    newData.id = id;
    newData.isNew = false;
    newData.order = order;

    tr.data("value", newData);
  });

  // 후원리스트
  if (findError) {
    throw new Error("랭킹 설정 저장 중 오류가 발생했습니다.");
  }

  return true;
}
// 후원리스트 참여 호스트 추가
function appendJoinedBJOptions() {
  const bjlist = getJoinedBJ();
  let idMap = {};
  const selectObj = $(
    ".sponsor-excel-area tbody td.col-bj-nickname select:first"
  );
  selectObj.find("option").each(function () {
    const mid = $(this).val();
    idMap[mid] = mid;
  });

  const selectors = $(".sponsor-excel-area tbody td.col-bj-nickname select");
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
    `.sponsor-excel-area tbody td.col-bj-nickname select option[value=${memberId}]`
  ).remove();
}

// 후원리스트 참여 호스트 제거
function deleteAllJoinedBJOptions() {
  //$(`.sponsor-excel-area tbody td.col-bj-nickname select option[value!='']`).remove();
  const me = getMeInfo();
  $(`.sponsor-excel-area tbody td.col-bj-nickname select option`).each(
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
async function saveExcelSettins() {
  try {
    // 설정 저장
    // project settings
    const { value: excelId, label: title } = getSelectProjectData() || {};
    if (_.isNil(title)) {
      return Message.show("먼저 프로젝트를 선택하거나 생성해 주세요");
    }

    // 참여 호스트 설정
    const resultJoinBj = await saveAllJoinedBJ(excelId);
    // ranking 저장
    const resultRanking = await saveAllRanking(excelId);
    // 팀 저장
    const resultTeam = await saveAllTeam(excelId);
    // 배틀 저장
    const resultBattle = await saveAllBattle(excelId);

    // 프로젝트 저장
    await callApiProjectUpdate(title, excelId);

    if (!resultJoinBj || !resultRanking || !resultTeam || resultBattle) {
      return;
    }

    // 참여 호스트 정리.
    appendJoinedBJOptions();
    Message.show("설정이 저장되었습니다.");
  } catch (e) {
    if (ERROR_EXCEL.END === +e?.message || 0) {
      const { value: excelId } = getSelectProjectData();
      setStartExcelButton(EXCEL.STATUS.END, excelId);
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
  const currentExcel = await getCurrenExcel();
  await loadProjectList(currentExcel);
}

async function getCurrenExcel() {
  try {
    const url = `${g_url}/api/excel/settings/detail`;

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

async function setCurrenExcel(excelId, excelName) {
  try {
    const url = `${g_url}/api/excel/settings/update`;
    const param = { excelId, excelName };
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
async function loadProjectList(currentExcel) {
  ///excel_project_list
  try {
    const result = await callApiProjectList();
    //console.log("🔥 ~ loadProjectList ~ result:", result);
    makeProjectList(result);

    if (result) {
      const inprogressExcelId = _.get(
        _.find(result || [], (e) => EXCEL.STATUS.INPROGRESS === e.status),
        "excelId"
      );
      const latestExcelId = result[0]?.excelId;
      const currentExcelId = currentExcel.excelId;
      const excelId =
        inprogressExcelId || currentExcelId || latestExcelId || undefined;
      if (!excelId) {
        return;
      }
      // 최근 아이템 선택
      selectProjectOption(
        $(
          `.project-area .select-project-name .dropdown-item[value=${excelId}]`
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
function keepAllExcelData(mainBjId) {
  changeBJSettingsWithNew(mainBjId);
  changeRankingSettingsWithNew();
  clearTeamSetting();
  clearSponsorSetting();
  clearBattleSetting();
}

function clearAllExcelData() {
  // clear timer setting
  clearTimerSetting();
  clearBJSettings();
  clearRankingSettings();
  clearTeamSetting();
  clearSponsorSetting();
  clearBattleSetting();
}

// detail 로딩후 데이터 셋팅
async function setProjectSettings(detail, isOnlyProject = false) {
  // project detail settings.
  // 검증: 선택된 정보와 동일성.
  const { value } = getSelectProjectData();
  const {
    excelId,
    minAmount,
    minusScoreOn,
    onePlusOneMode,
    showMainBJ,
    status,
    battleStatus,
    teamStatus,
    options: { timer, bj, ranking, battle, team },
  } = detail;

  if ("" == excelId || +value !== excelId) {
    return;
  }
  // 엑셀방송 시작 버튼  //btn-start-project
  setStartExcelButton(status, excelId);
  setTimerButton(status);

  // 프로젝트 정보만 로딩한다.
  if (isOnlyProject) {
    disableBJSetting(EXCEL.STATUS.REG);
    disableRankingSetting(EXCEL.STATUS.REG);
    return;
  }

  // timer 설정
  const { hours = "", minutes = "", seconds = "", start } = timer || {};
  setTimerSetting(hours, minutes, seconds, status, start);

  //참여호스트 ///////////////////////////
  const { showZeroScoreOn, header: bjHeader, timer: bjTimer } = bj || {};
  await setBJSettgins(
    excelId,
    minAmount,
    showZeroScoreOn,
    showMainBJ,
    minusScoreOn,
    bjHeader,
    status,
    bjTimer
  );
  // 랭킹설정 ////////////////////////
  const {
    align: { value: align, column },
    sort,
    header: rankingHeader,
  } = ranking || { align: {} };
  await setRankingSettings(excelId, sort, align, column, rankingHeader, status);

  // 팀 셋팅
  await setTeamSettings(excelId, teamStatus, team);

  // 배틀 셋팅
  await setBattleSettings(excelId, battleStatus, battle);

  // 후원리스트 설정 ///////////////////////////
  await setSponsorSettings(excelId, onePlusOneMode, status);


}

function setTimerButton(status) {
  if (EXCEL.STATUS.END === status) {
    $(".excel-setting-box .timer-input-area input").attr("disabled", true);
    $(".excel-setting-box .timer-button-area button").attr("disabled", true);
  } else {
    $(".excel-setting-box .timer-input-area input").attr("disabled", false);
    $(".excel-setting-box .timer-button-area button").attr("disabled", false);
  }
}

function setStartExcelButton(status, excelId) {
  disableProjectSetting(status);
  disableBJSetting(status);
  disableRankingSetting(status);

  // 프로젝틀 리스트에 상태 변경
  setInprogressExcel(excelId, status);

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
      case EXCEL.STATUS.INPROGRESS:
        clsname = "btn-accent";
        return "엑셀방송 종료";
      case EXCEL.STATUS.END:
        return "엑셀방송 종료";
      case EXCEL.STATUS.DELETE: // 방어코드
        return "엑셀방송 삭제됨.";
      default:
        return "엑셀방송 시작";
    }
  };

  if (EXCEL.STATUS.INPROGRESS < status) {
    // 엑셀방송 진행 중
    $(".btn-start-project").addClass("btn-start-project-end");
    $(".btn-start-project").attr("disabled", true);
    $(".btn-start-project").text("엑셀방송이 종료되었습니다.");
    setAggregation(false);
  } else {
    // 엑셀방송 진행 중
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
  const disabled = EXCEL.STATUS.INPROGRESS < status;
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
  $(".join-excel-area")
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
  // 0점표기
  $("#showZeroScoreOn").prop("checked", DEFAULT.BJ.SHOWZEROSCOREON);
  // 대표 BJ
  $("#showMainBJ").prop("checked", DEFAULT.BJ.SHOWMAINBJ);
  // 기여도 마이너스
  $("#minusRate").prop("checked", DEFAULT.BJ.MINUSSCOREON);

  const thead = $(".join-excel-area").find("thead");
  // bj nickname
  thead.find(".col-nickname input[type=text]").val(DEFAULT.BJ.HEADER.NICKNAME);
  // 렉스
  thead.find(".col-gold input[type=text]").val(DEFAULT.BJ.HEADER.GOLD);
  // 기여도 타이틀
  thead.find(".col-rate input[type=text]").val(DEFAULT.BJ.HEADER.RATE);
  thead
    .find(".col-rate input[type=checkbox]")
    .prop("checked", DEFAULT.BJ.HEADER.ENABLERATE);
  // 비고
  thead.find(".col-custom input[type=text]").val(DEFAULT.BJ.HEADER.CUSTOM);
  thead
    .find(".col-custom input[type=checkbox]")
    .prop("checked", DEFAULT.BJ.HEADER.ENABLECUSTOM);

  $(".join-excel-area").find("tbody").empty();
}
async function setBJSettgins(
  excelId,
  minAmount = "",
  showZeroScoreOn = DEFAULT.BJ.SHOWZEROSCOREON, // 0 점표기
  showMainBJ = DEFAULT.BJ.SHOWMAINBJ, // 대표 BJ
  minusScoreOn = DEFAULT.BJ.MINUSSCOREON,
  header,
  status,
  bjTimer
) {
  //최소후원수량
  minAmount = 0 === minAmount ? 0 : minAmount;
  $("#minAmount").val(minAmount);
  // 0점표기
  $("#showZeroScoreOn").prop("checked", showZeroScoreOn);
  // 대표 BJ
  $("#showMainBJ").prop("checked", showMainBJ);
  // 기여도 마이너스
  $("#minusRate").prop("checked", minusScoreOn);
  // bjtimer action
  $(`.bj-timer-action option[value=${bjTimer.action}]`).prop("selected", true);
  //bj timer second
  $(`.bj-timer-second`).val(bjTimer.second);
  // bj timer lex
  $(`.bj-timer-lex`).val(bjTimer.minlex);

  // 참여자 리스트 헤더 셋팅
  setHeaderInJoinedBJ(header, status);

  // 참여 호스트 리스트
  await loadJoinedBJSettings(excelId);

  // 종료된 방송일 경우버튼 disabled
  disableBJSetting(status);
}

function disableBJSetting(status) {
  const me = getMeInfo();

  const container = $(".join-excel-area");
  if (EXCEL.STATUS.END === status) {
    container.find("button").attr("disabled", true);
    container.find("input").attr("disabled", true);
    container.find("table .col-bg-color > div").hide();
    container.find("table .col-name-color > div").hide();
  } else if (EXCEL.STATUS.INPROGRESS === status) {
    container.find("button").attr("disabled", true);
    container.find("table .col-bg-color > div").show();
    container.find("table .col-name-color > div").show();
    container.find("input").attr("disabled", false);
    // excel 표시 enable
    container.find("button.btn-bj-add").attr("disabled", false);
    container.find("button.btn-bj-timer-reset").attr("disabled", false);

    //container.find("table tbody .col-show input").attr("disabled", false);
    //container.find("table tbody .col-custom input").attr("disabled", false);
    //container.find("#minAmount").attr("disabled", false);
    //container.find("#showZeroScoreOn").attr("disabled", false);
    //container.find("#showMainBJ").attr("disabled", false);
    //container.find("#minusRate").attr("disabled", false);
  } else {
    const container = $(".join-excel-area");
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
  const { nickname, gold, rate, custom, enableRate, enableCustom } = header;
  const tbody = $(".join-excel-area").find("tbody");
  const thead = $(".join-excel-area").find("thead");
  if (0 === thead.length) {
    return;
  }
  // bj nickname
  thead.find(".col-nickname input[type=text]").val(nickname);
  //렉스
  thead.find(".col-gold input[type=text]").val(gold);
  // 기여도 타이틀
  thead.find(".col-rate input[type=text]").val(rate);
  // 기여도 체크박스
  const bjRate = thead.find(".col-rate input[type=checkbox]");
  bjRate.prop("checked", enableRate);
  bjRate.on("change", function () {
    const ischecked = $(this).is(":checked");
    disableTableInput(tbody.find("td.col-rate input"), !ischecked);
  });

  // custom
  thead.find(".col-custom input[type=text]").val(custom);
  const customEl = thead.find(".col-custom input[type=checkbox]");
  customEl.prop("checked", enableCustom);
  customEl.on("change", function () {
    const ischecked = $(this).is(":checked");
    disableTableInput(tbody.find("td.col-custom input"), !ischecked);
  });
}

// 랭킹설정 데이터는 유지하고 rid, isNew는 true로 변경
function changeRankingSettingsWithNew() {
  let timestamp = Date.now();
  $(".ranking-excel-area tbody tr").each(function () {
    const target = $(this);
    target.attr("rid", ++timestamp);
    const data = target.data("value");
    data.isNew = true;
    target.data("value", data);
  });
}

// 랭킹설정 셋팅
function clearRankingSettings() {
  $(`input[name=sortRanking][value=${DEFAULT.RANKING.SORT}]`).prop(
    "checked",
    true
  );
  $("#sortAlign").prop("checked", DEFAULT.RANKING.SORTALIGN);
  $("#alignLength").val("");
  //header
  const thead = $(".ranking-excel-area").find("thead");
  thead
    .find(".col-daily-pay input[type=checkbox]")
    .prop("checked", DEFAULT.RANKING.HEADER.ENABLEDAILYPAY);
  thead
    .find(".col-ranking-custom input[type=text]")
    .val(DEFAULT.RANKING.HEADER.CUSTOM);
  thead
    .find(".col-ranking-custom input[type=text]")
    .prop("checked", DEFAULT.RANKING.HEADER.ENABLECUSTOM);

  $(".ranking-excel-area tbody").empty();
}
async function setRankingSettings(
  excelId,
  sort,
  align,
  column,
  header,
  status
) {
  $(`input[name=sortRanking][value=${sort}]`).prop("checked", true);
  $("#sortAlign").prop("checked", align);
  $("#alignLength").val(column);

  // 랭킹 헤더
  setHeaderInRanking(header);
  // 랭킹 리스트
  await loadRankingSettings(excelId);

  // 종료된 방송일 경우버튼 disabled
  disableRankingSetting(status);
}

function disableRankingSetting(status) {
  // 종료된 방송일 경우버튼 disabled
  const container = $(".ranking-excel-area");
  if (EXCEL.STATUS.END === status) {
    container.find("button").attr("disabled", true);
    container.find("input").attr("disabled", true);
    container.find("tbody .col-bg-color > div").hide();
    container.find("tbody .col-name-color > div").hide();
  } else {
    container.find("button").attr("disabled", false);
    container.find("input").attr("disabled", false);
    container.find("tbody .col-bg-color > div").show();
    container.find("tbody .col-name-color > div").show();
  }
}


async function setSponsorSettings(excelId, onePlusOneMode, status) {
  // 집계 정지( 수동으로 할 수있도록 수정)
  //setAggregation(EXCEL.STATUS.INPROGRESS === status);

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
  // 1:1 모드 활성화
  setOnePlusOneButton(onePlusOneMode);
  await loadSponsorList(1, PG.LIMIT.LG);

  // 자동 집계 모드 확인
  const inProgress = EXCEL.STATUS.INPROGRESS === status;
  const { aggregationTimer } = getExcelSettingByStorage();

  if (_.isEmpty(aggregationTimer)) {
    return;
  }

  if (
    inProgress &&
    Number(aggregationTimer.excelId) === excelId &&
    aggregationTimer.start
  ) {
    setAggregation(true);
  }
}

function setHeaderInRanking(header) {
  const { enableDailyPay, enableRankingCustom, rankingCustom } = header;

  const thead = $(".ranking-excel-area").find("thead");
  const tbody = $(".ranking-excel-area").find("tbody");
  if (0 === thead.length) {
    return;
  }

  // 일급계산
  const dailyPay = thead.find(".col-daily-pay input[type=checkbox]");

  dailyPay.prop("checked", enableDailyPay);
  dailyPay.on("change", function () {
    //dailyPay.prop("checked", false);
    const ischecked = $(this).is(":checked");
    disableTableInput(tbody.find("td.col-daily-pay input"), !ischecked);
  });

  // custom
  thead.find(".col-ranking-custom input[type=text]").val(rankingCustom);
  const custom = thead.find(".col-ranking-custom input[type=checkbox]");
  custom.prop("checked", enableRankingCustom);
  custom.on("change", function () {
    const ischecked = $(this).is(":checked");
    disableTableInput(tbody.find("td.col-ranking-custom input"), !ischecked);
  });
}

function disableTeamSetting() {
  // 시작 TODO: 임시 추가 제거 //////////////////////////////////////////////////
  // $(".team-excel-area input").attr("disabled", true);
  // $(".team-excel-area button").attr("disabled", true);
  // $(".team-excel-area .dropdown-toggle").addClass("disabled");
  // $(".team-excel-area .selected-member").remove();
  // const teamRate = $(".team-excel-area .col-team-rate input[type=checkbox]");
  // teamRate.prop("checked", false);
  // const bgPicker = $(".team-excel-area .col-bg-color input");
  // const namePicker = $(".team-excel-area .col-name-color input");
  // const picker = [...bgPicker, ...namePicker];
  // for (p of picker) {
  //   $(p).spectrum("disable");
  // }
  // 종료 TODO: 임시 추가 제거 //////////////////////////////////////////////////
}

function clearTeamSetting() {
  $(".team-excel-area table tbody").empty();

  const thead = $(".team-excel-area").find("thead");
  //렉스
  thead.find(".col-team-gold input[type=text]").val(DEFAULT.BJ.HEADER.GOLD);
  // 기여도 타이틀
  thead.find(".col-team-rate input[type=text]").val(DEFAULT.BJ.HEADER.RATE);
  thead
    .find(".col-team-rate input[type=checkbox]")
    .prop("checked", DEFAULT.BJ.HEADER.ENABLERATE);
}

function clearSponsorSetting() {
  $(".sponsor-excel-area table tbody").empty();
}

// 대결 설정 ///////////////////////////////////////////////////////////////////////////////////
// event handler
async function callApiBattleStart(url, param) {

  const response = await axios.post(url, param);
  const json = response.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }
  return json.resultMap.data || [];
}


function handleStartBattle() {
  const { value: excelId } = getSelectProjectData();
  const status = getBattleStatus();

  switch (status) {
    case Battle.STATUS.START: {
      callApiBattleStart(`${g_url}/api/excel/battle/stop`, { excelId });
      setStartBattleStatus(Battle.STATUS.STOP)
      break;
    }
    case Battle.STATUS.READY:
    case Battle.STATUS.STOP: {
      callApiBattleStart(`${g_url}/api/excel/battle/start`, { excelId });
      setStartBattleStatus(Battle.STATUS.START)
      break;
    }
  }
}


// 배틸 팀 정보 로딩.
async function callApiBattleTimer(url, param) {
  const response = await axios.post(url, param);
  const json = response.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }
  return json.resultMap.data || [];
}


async function handleTimerStart() {
  const { value: excelId } = getSelectProjectData();
  const url = `${g_url}/api/excel/battle/starttimer`;

  let seconds = $('#battle-seconds').val();

  if (_.isEmpty(seconds)) {
    return Message.show("설정할 타이머 시간(초)을 입력해 주세요.", { type: "wran" });
  }

  seconds = Math.max(0, Number(seconds));
  if (0 === seconds) {
    return Message.show("설정할 타이머 시간(초)은 0보다 커야 합니다.", { type: "wran" });
  }

  const param = { excelId, seconds };
  await callApiBattleTimer(url, param);
};

async function handleTimerStop() {
  const { value: excelId } = getSelectProjectData();
  const url = `${g_url}/api/excel/battle/stoptimer`;
  const param = { excelId };
  await callApiBattleTimer(url, param);
};

async function handleTimerInit() {
  const { value: excelId } = getSelectProjectData();
  const url = `${g_url}/api/excel/battle/inittimer`;

  let seconds = $('#battle-seconds').val();

  if (_.isEmpty(seconds)) {
    return Message.show("설정할 타이머 시간(초)을 입력해 주세요.", { type: "wran" });
  }

  seconds = Math.max(0, Number(seconds));
  if (0 === seconds) {
    return Message.show("설정할 타이머 시간(초)은 0보다 커야 합니다.", { type: "wran" });
  }

  const param = { excelId, seconds };
  await callApiBattleTimer(url, param);
};

// 배틀 팀 추가
function handleAddBattleTeam() {
  const tbody = $(".battle-excel-area").find("tbody");
  if (0 === tbody.length) {
    return;
  }
  // 팀원에 추가된 사용자
  const items = $(
    ".battle-excel-area .col-select-memeber .dropdown-menu:first .dropdown-item"
  );
  let disableMembers = [];

  for (let item of items) {
    if ($(item).prop("disabled")) {
      disableMembers.push($(item).val());
    }
  }

  const nextIndex = tbody.find("tr").length + 1;
  const data = { isNew: true, teamId: Date.now() };
  makeTeamRow(tbody, data, nextIndex, TBL_ROW_TYPE_BATTLES, handleBattleDeleteTeam);

  // 멤버들을 모두 모아 disabled 처리(새로운 조에 들어가지 못하도록)
  (disableMembers || []).forEach((memberId) => {
    disableTeamMember(memberId, true, tbody);
  });
}


// 대결 초기화
function clearBattleSetting() {
  setStartBattleStatus(Battle.STATUS.STOP);

  // battle timer 상태 셋팅
  //setBattleTimerStatus(Battle.TIMER_STATUS.STOP);

  // score표시(렉스표시, 기여도 표시)
  $('input[name="dspScore"]').prop('checked', false);

  // 점수차이 표시
  $("#setUseDifferenceScores").prop("checked", DEFAULT.BATTLE.DIFFERENCESCORES);
  // 타이머 사용
  $("#setUseBattleTimer").prop("checked", DEFAULT.BATTLE.TIMER.USE);
  // battle seconds
  $("#battle-seconds").val("");

  // table clear
  $(".battle-excel-area tbody").empty();
}


// 배틀 타이머 상태
function getBattleTimerStatus() {
  return $$('.btn-battle-timer-start').data('status');
}

// 배틀 시작 종료 상태 변경
function setStartBattleStatus(status) {
  $('.btn-battle-start').data('status', status);

  switch (status) {
    case Battle.STATUS.START:
      $('.btn-battle-start').addClass("btn-accent");
      $('.btn-battle-start').text("배틀 종료");
      $('.btn-battle-start').prepend(
        $("<i>", { class: "fa fa-stop mr-1" })
      );
      break;
    case Battle.STATUS.READY:
    case Battle.STATUS.STOP:
    default:
      $('.btn-battle-start').removeClass("btn-accent");
      $('.btn-battle-start').text("배틀 시작");
      $('.btn-battle-start').prepend(
        $("<i>", { class: "fa fa-play mr-1" })
      );
  }
}
// 배틀 상태 리턴
function getBattleStatus() {
  return $('.btn-battle-start').data('status');
}


// 배틀 셋팅 초기화
async function setBattleSettings(excelId, battleStatus, battle) {
  try {

    const dspScore = _.get(battle, ['dspScore'], DEFAULT.BATTLE.DSPSCORE);
    const useDifferenceScores = _.get(battle, ['useDifferenceScores'], false);
    const useTime = _.get(battle, ['timer', 'useBattleTimer'], false);
    const timerSeconds = _.get(battle, ['timer', 'seconds'], '');
    const battleTimerStatus = _.get(battle, ['timerStatus'], Battle.TIMER_STATUS.STOP);

    // 배틀 상태 및 시작 버튼
    setStartBattleStatus(battleStatus);
    // score display
    $(`input[name="dspScore"][value="${dspScore}"]`).prop('checked', true);

    // 점수차이 표시
    $('#setUseDifferenceScores').prop('checked', useDifferenceScores);
    // 타이머 사용 여부
    $('#setUseBattleTimer').prop('checked', useTime);
    // 타이머 시간
    $("#battle-seconds").val(timerSeconds)
    // 타이머 상태
    //setBattleTimerStatus(battleTimerStatus);


    // 랭킹 리스트
    await loadBattleSettings(excelId);

    // 종료된 방송일 경우버튼 disabled
    //disableBattleSetting(status);
  } catch (e) {
    console.error(e);
  }
}


// 배틸 팀 정보 로딩.
async function callApiBattleTeamMembers(excelId) {
  const url = `${g_url}/api/excel/battle/memberall`;
  const param = { excelId };

  const response = await axios.post(url, param);
  const json = response.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }
  return json.resultMap.data || [];
}

async function loadBattleSettings(excelId) {

  const tbody = $(".battle-excel-area").find("tbody");
  if (0 === tbody.length) {
    return;
  }
  tbody.empty();

  const list = await callApiBattleTeamMembers(excelId);
  const dataMapper = function (value) {
    const { teamName, options: { lex, rate, colors } } = value;

    return {
      ...value, id: value.id, name: teamName, colors, lex, rate, isNew: false,
    };
  }

  list.forEach((value, index) => {
    const data = dataMapper(value);
    makeBattleRow(tbody, data, index + 1);
  });


  //팀원 추가 및 선택항목 disabled(팀 추가 이후 처리해야 함.)
  list.forEach((value, index) => {
    const data = dataMapper(value);
    const { teamId, memberId } = data;
    if (!_.isNil(memberId)) {
      joinedTeam(`#joined-team-${teamId}`, data, (e, el, joindata) => {
        handleBattleDeleteMember(e, el, { ...joindata, teamId })
      });
    }
  });
}

// 대결 리스트 생성
function makeBattleRow(tbody, data, index) {
  const {
    teamId,
  } = data;

  // 팀이 존재하는 지 확인
  const trLen = tbody.find(`tr[tid="${teamId}"]`).length;
  // tr 추가
  if (0 === trLen) {
    const tr = makeTeamRow(tbody, data, index, TBL_ROW_TYPE_BATTLES, handleBattleDeleteTeam);
    tr.data('value', data);
  }
}

// 배틀 팀 멤버 삭제
async function callApiDeleteBattleTeamMember(excelId, teamId, memberId) {
  const url = `${g_url}/api/excel/battle/memberremove`;
  const param = { excelId, teamId, id: memberId };

  const response = await axios.post(url, param);
  const json = response.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }
  return json.resultMap.data || [];
}

// 멤버 삭제.
function handleBattleDeleteMember(e, el, data) {
  Message.confirm(
    { title: "배틀 팀 멤버 삭제", message: Message.multiLineMessage(["멤버를 삭제하시겠습니까?", "삭제하면 바로 적용됩니다."]) },
    async () => {
      try {
        const { value: excelId } = getSelectProjectData();
        const { memberId } = data

        const teamId = el.parents('tr').attr('tid');
        const id = el.find(`.selected-member[value=${memberId}]`).attr('id');

        if (!_.isNil(id)) {
          await callApiDeleteBattleTeamMember(excelId, teamId, id);
        }

        el.find(`.selected-member[value=${memberId}]`).remove();
        const tbody = $(".battle-excel-area").find("tbody");

        disableTeamMember(memberId, false, tbody);
      } catch (e) {
        Message.show("배틀 팀 멤버 삭제를 실패하였습니다.", { type: "wran" });
      }
    }
  );
}

// 배틀 팀 삭제
async function callApiDeleteBattleTeam(excelId, teamId) {
  const url = `${g_url}/api/excel/battle/teamremove`;
  const param = { excelId, teamId };

  const response = await axios.post(url, param);
  const json = response.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }
  return json.resultMap.data || [];
}

// 배틀팀 전체 삭제
async function handleDeleteAllBattleTeam() {
  const { value: excelId } = getSelectProjectData();
  const trs = $(".battle-excel-area tbody tr");

  let findError = false;

  for await (let e of trs) {
    const tr = $(e);
    const data = tr.data('value');
    const isNew = _.get(data, 'isNew', true);
    const teamId = $(tr).attr('tid');

    if (!isNew) {
      try {
        await callApiDeleteBattleTeam(excelId, teamId);
        tr.remove();
      } catch (e) {
        findError = true;
      }
    }
  }

  if (findError) {
    throw new Error("배틀 초기화 중 오류가 발생했습니다.");
  }
}
// 배틀 팀 삭제(1개)
function handleBattleDeleteTeam(e, tr) {
  const { value: excelId } = getSelectProjectData();
  const data = tr.data('value');
  const isNew = _.get(data, 'isNew', true);

  //const tbody = tr.parent("tbody");
  const tbody = $(".battle-excel-area").find("tbody");
  const teamId = $(tr).attr('tid');
  const selMembers = tr.find(`.selected-member`);

  if (_.isNil(teamId)) {
    return Message.show("팀정보(아이디)를 알수 없습니다.", { type: "wran" });
  }

  Message.confirm(
    { title: "배틀 팀 삭제", message: Message.multiLineMessage(["배틀팀을 삭제하시겠습니까?", "삭제하면 바로 적용됩니다."]) },
    async () => {
      try {

        if (!isNew) {
          // 이미 저장된 데이터
          await callApiDeleteBattleTeam(excelId, teamId);
        }
        // 비활성화 사용자를 활성화
        for (e of selMembers) {
          const val = $(e).attr("value");
          disableTeamMember(val, false, tbody);
        }
        // tr remove
        tr.remove();

      } catch (e) {
        Message.show("배틀 팀 삭제를 실패하였습니다.", { type: "wran" });
      }
    }
  );
}

//배틀 팀 전체 삭제
function handleBattleTeamInit() {
  Message.confirm(
    { title: "배틀 팀 초기화", message: Message.multiLineMessage(["배틀 팀 설정을 초기화 하시겠습니까?", "삭제하면 바로 적용됩니다."]) },
    async () => {
      try {

        // 이미 저장된 데이터
        await handleDeleteAllBattleTeam();

      } catch (e) {
        Message.show("배틀 팀 삭제를 실패하였습니다.", { type: "wran" });
      }
    }
  );
}

// 배틀 팀 정보
function getBattleTeamDataFromTr(tr) {
  const name = tr.find("td.col-team-name input").val();
  const lex = tr.find("td.col-team-gold input").val();
  const rate = tr.find("td.col-team-rate input").val();
  const bgcolor = tr.find("td.col-bg-color input").val();
  const namecolor = tr.find("td.col-name-color input").val();
  const wincolor = tr.find("td.col-win-color input").val();

  return { name, lex, rate, bgcolor, namecolor, wincolor, };
}
// 베틀 멤버
function getBattleMemberDataFromTr(tr) {
  const members = [];
  tr.find('.joined-team .selected-member').each(function () {
    const target = $(this);
    const nickname = target.attr('label') ?? '';
    const memberId = target.attr('value') ?? '';
    const id = target.attr('id') ?? null;
    members.push({ nickname, memberId, id });
  });

  return members;
}

// 배틀 팀 저장
async function callApiBattleTeamSave(teamParam) {
  const { isNew, excelId, teamId, name, options } = teamParam;
  let url = "";

  const param = { excelId, name, options };
  if (isNew && !_.isNil(teamId)) {
    url = `${g_url}/api/excel/battle/teamadd`;
  } else {
    url = `${g_url}/api/excel/battle/teamupdate`;
    param.teamId = teamId;
  }

  const response = await axios.post(url, param);
  const json = response.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    return new Error(json.message || "");
  } else {
    return json.resultMap.data;
  }
}

// 배틀 멤버 저장
async function callApiBattleMemberSave(memberParam) {
  const { excelId, teamId, memberId, nickname, id } = memberParam;
  let url = "";

  const param = { excelId, teamId, bjMemberId: memberId, nickname };
  if (_.isNil(id)) {
    url = `${g_url}/api/excel/battle/memberadd`;
  } else {
    url = `${g_url}/api/excel/battle/memberupdate`;
    param.id = id;
  }

  const response = await axios.post(url, param);
  const json = response.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    return new Error(json.message || "");
  } else {
    return json.resultMap.data;
  }
}


// 배틀 팀 및 멤버 추가
async function handleSaveBattleTeamAndMember(saveParams) {
  const teamAndMemberPart = function* (datas) {
    while (0 < datas.length) {
      const [part] = datas.splice(0, 1);
      const { team, members } = part;
      if (!_.isNil(team)) {
        yield { type: 'team', param: team };
      }

      if (_.isNil(members)) continue;

      const prevTeamId = _.get(members, ["teamId"]);
      const teamId = _.get(team, "teamId", prevTeamId);
      const excelId = _.get(members, ['excelId'])
      for (let member of members.members) {
        yield { type: 'member', param: { ...member, excelId, teamId, prevTeamId } };
      }
    }
  };

  const results = [];
  for await (let data of teamAndMemberPart(saveParams)) {
    const { type, param } = data;
    switch (type) {
      case 'team': {
        const result = await callApiBattleTeamSave(param);
        results.push({ type, result: { ...result, prevTeamId: data.param.teamId } });

        const newTeamId = _.get(result, 'teamId');
        if (!_.isNil(newTeamId)) {
          data.param.teamId = newTeamId;
        }
        break;
      }
      case "member":
      default: {
        const result = await callApiBattleMemberSave(param);
        results.push({ type, result: { ...result, prevTeamId: data.param.prevTeamId } });
      }
    }
  }

  let findError = false;
  (results || []).forEach((e) => {
    // forEach에서 return 해당 건만 skip함.
    if (e instanceof Error) {
      findError = true;
      return;
    }

    const {
      type, result
    } = e;

    // 저장결과 처리
    switch (type) {
      case "team": {
        const { teamId, prevTeamId } = result;

        const tr = $(`.battle-excel-area tbody tr[tid=${prevTeamId}]`);
        if (0 !== tr.length) {
          const newData = makeTrDataValue(tr, getBattleTeamDataFromTr);
          newData.isNew = false;
          newData.teamId = teamId;

          tr.data('value', newData);
          tr.attr('tid', teamId);

          $(`.col-select-memeber[data-teamid=${prevTeamId}]`).data('teamid', teamId);
          $(`.battle-excel-area tbody tr td div#joined-team-${prevTeamId}`).attr("id", `joined-team-${teamId}`);
        }
        break;
      }
      case "member":
      default: {
        const { id, teamId, prevTeamId, memberId } = result;
        const joinedTeam = $(`.battle-excel-area tbody tr td div#joined-team-${teamId}`);
        if (0 !== joinedTeam.length) {
          joinedTeam.find(`.selected-member[value=${memberId}]`).attr("id", id);
        }
      }
    }
  });

  // 배틀 리스트 저장 오류
  if (findError) {
    throw new Error("배틸 설정 저장 중 오류가 발생했습니다.");
  }
}

// 배틀 설정 저장
async function saveAllBattle(excelId) {
  const trs = $(".battle-excel-area tbody tr");
  // 저장대상 없음.
  if (0 === trs.length) {
    return;
  }

  const saveParams = [];

  let findError = false;
  for (let i = 0; i < trs.length; i++) {
    const tr = $(trs.get(i));
    const { isNew, teamId } = tr.data("value");
    const { isSame: isTeamSame, bjData: saveTeamData } = isSameData(tr, getBattleTeamDataFromTr);
    const { isSame: isMemberSame, newVal: members } = isSameArryData(tr, getBattleMemberDataFromTr);

    const { name, lex, rate, bgcolor, namecolor, wincolor } = saveTeamData;

    // team validation 체크
    /*  if (_.isEmpty(name)) {
       return Message.show(
         `배틀 설정에서 ${i + 1}번째 팀명을 입력해 주세요.`
       );
     } */
    // member validation
    if (0 === members.length) {
      return Message.show(
        `배틀설정에서 ${i + 1}번째 팀 멤버를 지정해 주세요.`
      );
    }
    // 배틀 팀은 최소 2개 이상
    if (2 > trs.length) {
      return Message.show(
        `배틀은 2개 이상의 팀을 설정해야합니다.`
      );
    }

    const param = { team: null, members: null };
    // 팀추가
    if (!isTeamSame) {
      param.team = {
        isNew,
        excelId,
        teamId,
        name: name || '',
        options: {
          lex, rate,
          colors: {
            bg: bgcolor, name: namecolor, win: wincolor,
          },
        },

      };
    }

    // member 추가
    if (!isMemberSame) {
      param.members = {
        excelId, teamId, members
      };
    }

    if (!isTeamSame || !isMemberSame) {
      saveParams.push(param);
    }
  }

  if (0 === saveParams.length) {
    return;
  }

  // 데이터 저장
  await handleSaveBattleTeamAndMember(saveParams);

  return true;
}


// 참여 호스트 설정 ///////////////////////////////////////////////////////////////////////////////////
async function callApiProjectDetail(excelId) {
  if (_.isNil(excelId)) {
    throw new Error('"excelId" is Notfound.');
  }
  const url = `${g_url}/api/excel/project/detail?excelId=${excelId}`;

  const response = await axios.get(url);
  const json = response.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }
  return json.resultMap.data;
}

async function callApiProjectList() {
  const url = `${g_url}/api/excel/project/list`;

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
    value: data.excelId,
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

  const inprogressExcelId = getInprogressExcelId();
  if (!_.isNil(inprogressExcelId) && value !== inprogressExcelId) {
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
              clearAllExcelData();
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
  setCurrenExcel(value, label).catch((e) => console.error(e));
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
    nickname = "",
    show = true,
    position = "",
    gold = 0,
    rate = 0,
    custom = "",
    colors,
    isNew,
  } = data;

  const thead = $(".join-excel-area").find("thead");
  //기여도
  const isEnableRate = thead
    .find(".col-rate input[type=checkbox]")
    .is(":checked");
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
  // 참여 호스트
  $("<td>", {
    class: "col-bj",
    text: `${user.loginId}(${user.nickname})`,
  }).appendTo(tr);
  // excel 표기
  $("<td>", { class: "col-show" })
    .append(makeCheckbox(`show-${memberId}`, "", show))
    .appendTo(tr);
  //직책
  $("<td>", { class: "col-position", maxlength: 20 })
    .append(
      $("<input>", { type: "text", placeholder: "직책입력", value: position })
    )
    .appendTo(tr);
  //nickname
  $("<td>", { class: "col-nickname" })
    .append(
      $("<input>", {
        type: "text",
        placeholder: "BJ닉네임 입력",
        value: nickname,
        maxlength: 20,
      })
    )
    .appendTo(tr);
  //렉스
  $("<td>", { class: "col-gold" })
    .append(
      $("<input>", {
        type: "number",
        placeholder: "0",
        value: gold,
      }).on("input", (e) => {
        onNumberInputOnly(e.currentTarget);
      })
    )
    .appendTo(tr);
  //기여도
  $("<td>", { class: "col-rate" })
    .append(
      $("<input>", {
        type: "number",
        placeholder: "0",
        value: rate,
        disabled: !isEnableRate,
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
  //타이머 초기화
  $("<td>", { class: "col-reset-timer" })
    .append(
      $("<button>", {
        class: "btn btn-outline-normal btn-sm font-sm btn-bj-timer-reset",
        text: "초기화",
      })
        .on("click", () => {
          const data = tr.data("value");
          handleBJTimerReset(data);
        })
    )
    .appendTo(tr);

  // 삭제 버틑
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

async function callApiJoinedBJList(excelId) {
  const url = `${g_url}/api/excel/bj/list?excelId=${excelId}`;

  const response = await axios.get(url);
  const json = response.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }

  return json.resultMap.data || [];
}
async function loadJoinedBJSettings(excelId) {
  const members = await callApiJoinedBJList(excelId);
  const tbody = $(".join-excel-area").find("tbody");
  if (0 === tbody.length) {
    return;
  }
  tbody.empty();

  members.forEach((member, index) => {
    const {
      id,
      nickname,
      position,
      score: rate,
      show,
      sponsorAmount: gold,
      user,
      options,
    } = member;
    const { memberId } = user;
    const { colors, custom } = options;
    const data = {
      // FIXME memeberId로 변경(필요한 정보 memberId, options, id)
      id,
      memberId,
      nickname,
      show,
      position,
      gold,
      rate,
      custom,
      colors,
      isNew: false,
    };
    makeJoinedBJRow(tbody, data, index + 1, user);
  });
}

// 랭킹 설정 ///////////////////////////////////////////////////////////////////////////////////
function makeRankingRow(tbody, data, index) {
  const { id, dailyPay, custom, isNew, colors } = data;
  const tr = $("<tr>", {
    rid: id,
    "data-value": JSON.stringify(data),
    order: index,
  }).appendTo(tbody);

  const isEnableDailyPay = $(
    ".ranking-excel-area thead .col-daily-pay input[type=checkbox]"
  ).is(":checked");
  const isEnableCustom = $(
    ".ranking-excel-area thead .col-ranking-custom input[type=checkbox]"
  ).is(":checked");

  // 순번
  $("<td>", { class: "col-no", text: `${index}위` }).appendTo(tr);
  // 일급계산
  $("<td>", {
    class: "col-daily-pay",
  })
    .append(
      $("<input>", {
        class: "text-align-left",
        type: "number",
        max: "100",
        placeholder: "일급(%)",
        value: `${0 === dailyPay ? "" : dailyPay}`,
        disabled: !isEnableDailyPay,
      }).on("input", (e) => {
        onNumberInputOnly(e.currentTarget);
      })
    )
    .appendTo(tr);
  $("<td>", { class: "col-ranking-custom" })
    .append(
      $("<input>", {
        type: "text",
        maxlength: 10,
        placeholder: "직급 입력(최대 10자)",
        value: custom,
        disabled: !isEnableCustom,
      })
    )
    .appendTo(tr);
  //배경 색
  const bgId = `ranking-bg-${id}`;
  const bgColor = colors?.bg || DEFAULT.RANKING.COLORS.BG;
  const bgColorpicker = makeColorPicker(bgId, bgColor);
  $("<td>", { class: "col-bg-color" }).append(bgColorpicker).appendTo(tr);
  setTextColor($(`#${bgId}`), bgColor, (color) => {
    handleChangeRankingBGColor(color, id);
  });

  const nameId = `ranking-name-${id}`;
  const nameColor = colors?.name || DEFAULT.RANKING.COLORS.NAME;
  const nameColorpicker = makeColorPicker(nameId, nameColor);
  $("<td>", { class: "col-name-color" }).append(nameColorpicker).appendTo(tr);
  setTextColor($(`#${nameId}`), nameColor, (color) => {
    handleChangeRankingNameColor(color, id);
  });
}

async function callApiRankingList(excelId) {
  const url = `${g_url}/api/excel/ranking/list?excelId=${excelId}`;

  const response = await axios.get(url);
  const json = response.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }
  return json.resultMap.data || [];
}

async function loadRankingSettings(excelId) {
  const bjCount = $(".join-excel-area table tbody tr").length;
  const list = await callApiRankingList(excelId);

  const tbody = $(".ranking-excel-area").find("tbody");
  if (0 === tbody.length) {
    return;
  }

  tbody.empty();
  list.forEach((value, index) => {
    const {
      id,
      percentPerDay,
      rewardText,
      options: { colors },
    } = value;
    //const { id, dailyPay, custom, isNew, colors } = data;
    const data = {
      id,
      dailyPay: percentPerDay,
      custom: rewardText,
      isNew: false,
      colors,
    };
    makeRankingRow(tbody, data, index + 1);
  });
  //ranking 갯수가 맞지않을때(방어코드 나머지만큼 채워준다.)
  const rankingCount = list.length;
  const restCount = Math.max(0, bjCount - rankingCount);


  for (let idx = 0; idx < restCount; idx++) {
    // bj 수보다 모자란 사용자 수만큼 채워 준다.
    const dataRanking = { isNew: true, id: Date.now() };
    const index = 1 + idx + rankingCount;
    makeRankingRow(tbody, dataRanking, index);
  }
}
// 팀 설정 ///////////////////////////////////////////////////////////////////////////////////
// 배틀 상태 리턴
function getTeamStatus() {
  return $('.btn-team-start').data('status');
}

async function callApiTeamStart(url, param) {
  const response = await axios.post(url, param);
  const json = response.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }
  return json.resultMap.data || [];
}


function handleStartTeam() {
  const { value: excelId } = getSelectProjectData();
  const status = getTeamStatus();

  switch (status) {
    case Team.STATUS.START: {
      callApiTeamStart(`${g_url}/api/excel/team/stop`, { excelId });
      setStartTeamStatus(Team.STATUS.STOP)
      break;
    }
    case Team.STATUS.READY:
    case Team.STATUS.STOP: {
      callApiTeamStart(`${g_url}/api/excel/team/start`, { excelId });
      setStartTeamStatus(Team.STATUS.START)
      break;
    }
  }
}

// 배틀 셋팅 초기화
async function setTeamSettings(excelId, teamStatus, team) {
  try {

    const sort = _.get(team, ['sort'], DEFAULT.TEAM.SORT);

    // 배틀 상태 및 시작 버튼
    setStartTeamStatus(teamStatus);
    // score display
    $(`input[name="sortTeam"][value="${sort}"]`).prop('checked', true);

    // 랭킹 리스트
    await loadTeamSettings(excelId, team);

  } catch (e) {
    console.error(e);
  }
}

// 배틀 시작 종료 상태 변경
function setStartTeamStatus(status) {
  $('.btn-team-start').data('status', status);

  switch (status) {
    case Team.STATUS.START:
      $('.btn-team-start').addClass("btn-accent");
      $('.btn-team-start').text("팀 종료");
      $('.btn-team-start').prepend(
        $("<i>", { class: "fa fa-stop mr-1" })
      );
      break;
    case Team.STATUS.READY:
    case Team.STATUS.STOP:
    default:
      $('.btn-team-start').removeClass("btn-accent");
      $('.btn-team-start').text("팀 시작");
      $('.btn-team-start').prepend(
        $("<i>", { class: "fa fa-play mr-1" })
      );
  }
}

// 팀 / 배틀 공퉁
function handleSelectTeamMember(e) {
  const memberId = e.currentTarget.value;
  const nickname = $(e.currentTarget).data("label");
  const id = $(e.currentTarget).attr("id");
  const teamId = $(e.currentTarget)
    .parents(".col-select-memeber")
    .data("teamid");
  const isNew = true;

  joinedTeam(`#joined-team-${teamId}`, { memberId, nickname, isNew }, (e, el, data) => {
    if (el.parents('.setup-area').hasClass('battle-excel-area')) {
      // battle
      handleBattleDeleteMember(e, el, { ...data, teamId })
    } else {
      // 팀 작업 시 진행 해야 함.
      handleDeleteMember(e, el, { ...data, teamId })
    }
  });
}

function makeTeamRow(tbody, data, index, rowType, deleteCallBack) {
  // 팀 설정: 프로세스가 확인되기 전까지 disabled 처리
  const {
    teamId,
    name = "",
    members = [],
    lex = 0,
    gold = 0,
    rate = 0,
    colors,
    isNew,
    skip = false
  } = data;
  const tr = $("<tr>", {
    tid: teamId,
    "data-value": JSON.stringify(data),
  }).appendTo(tbody);

  // 순번
  $("<td>", { class: "col-no", text: index }).appendTo(tr);
  // 팀명
  $("<td>", {
    class: "col-team-name",
  })
    .append(
      $("<input>", {
        type: "text",
        placeholder: "팀명을 입력하세요",
        value: name,
      })
    )
    .appendTo(tr);
  // 팀원선택
  const optionData = _.chain(getJoinedBJ() || [])
    .filter((e) => e.show)
    .map((m) => ({
      label: m.nickname,
      value: m.memberId,
    }))
    .value();

  $("<td>", { class: "col-select-memeber", "data-teamid": teamId })
    .append(
      $("<div>", { class: "select-team-member-area" })
        .append(
          $(
            makeSelectBox(
              "팀원추가",
              "select-team-member",
              { optionData, className: "btn-sm" },
              handleSelectTeamMember
            )
          )
        )
        .append(
          $("<div>", {
            id: `joined-team-${teamId}`,
            class: "joined-team",
          })
        )
    )
    .appendTo(tr);

  // 팀 배틀 제외
  if (TBL_ROW_TYPE_TEAM === rowType) {
    $("<td>", { class: "col-team-skip" })
      .append(
        makeCheckbox(`skip-team-battle-${teamId}`, "", skip)
      )
      .appendTo(tr);
  }

  // 렉스
  $("<td>", { class: "col-team-gold" })
    .append(
      $("<input>", {
        type: "number",
        placeholder: "0",
        value: gold || lex,
      })
    )
    .appendTo(tr);
  //기여도
  $("<td>", { class: "col-team-rate" })
    .append(
      $("<input>", {
        type: "number",
        placeholder: "0",
        value: rate,
      })
    )
    .appendTo(tr);

  //배경 색
  const bgId = `team-bg-${teamId}`;
  const bgColor = colors?.bg || DEFAULT.TEAM.COLORS.BG;
  const bgColorpicker = makeColorPicker(bgId, bgColor);
  $("<td>", { class: "col-bg-color" }).append(bgColorpicker).appendTo(tr);
  setTextColor($(`#${bgId}`), bgColor, (color) => {
    handleChangeTeamBGColor(color, teamId);
  });

  // 이름 색
  const nameId = `team-name-${teamId}`;
  const nameColor = colors?.name || DEFAULT.TEAM.COLORS.NAME;
  const nameColorpicker = makeColorPicker(nameId, nameColor);
  $("<td>", { class: "col-name-color" }).append(nameColorpicker).appendTo(tr);
  setTextColor($(`#${nameId}`), nameColor, (color) => {
    handleChangeTeamNameColor(color, teamId);
  });

  // 승리색(배틀 설정일 경우)

  // 이름 색
  const winId = `team-win-${teamId}`;
  const winColor = colors?.win || DEFAULT.TEAM.COLORS.WIN;
  const winColorpicker = makeColorPicker(winId, winColor);
  $("<td>", { class: "col-win-color" }).append(winColorpicker).appendTo(tr);
  setTextColor($(`#${winId}`), winColor, (color) => {
    handleChangeTeamWinColor(color, teamId);
  });


  $("<td>", { class: "col-del" })
    .append(
      $("<button>", {
        class: "btn btn-normal btn-sm font-sm",
        text: "삭제",
      }).on("click", (e) => {
        if (_.isFunction(deleteCallBack)) {
          deleteCallBack(e, tr);
        } else {
          handleDeleteTeam(e, tr);
        }
      })
    )
    .appendTo(tr);
  // members 처리
  (members || []).forEach((val) => {
    const { nickname, memberId } = val;
    joinedTeam(`#joined-team-${teamId}`, { memberId, nickname, isNew }, (e, el, data) => {
      console.log("팀 설정에서 멤버 삭제시");
      const { memberId } = data;
      el.find(`.selected-member[value=${memberId}]`).remove();
      disableTeamMember(memberId, false, tbody);
    });
  });

  return tr;
}

function setHeaderInTeam(headers) {
  const cnLex = _.get(headers, 'lex', DEFAULT.TEAM.COLUMNS[0].name);
  const cnRate = _.get(headers, 'rate', DEFAULT.TEAM.COLUMNS[1].name);
  const enableRate = _.get(headers, 'enableRate', true);

  const tbody = $(".team-excel-area").find("tbody");
  const thead = $(".team-excel-area").find("thead");
  if (0 === thead.length) {
    return;
  }

  //렉스
  thead.find(".col-team-gold input[type=text]").val(cnLex);
  // 기여도
  thead.find(".col-team-rate input[type=text]").val(cnRate);
  const teamRate = thead.find(".col-team-rate input[type=checkbox]");
  teamRate.prop("checked", enableRate);
  disableTableInput(tbody.find("td.col-team-rate input"), !enableRate);
  teamRate.on("change", function () {
    const ischecked = $(this).is(":checked");
    disableTableInput(tbody.find("td.col-team-rate input"), !ischecked);
  });
}


// 배틸 팀 정보 로딩.
async function callApiTeamMembers(excelId) {
  const url = `${g_url}/api/excel/team/memberall`;
  const param = { excelId };

  const response = await axios.post(url, param);
  const json = response.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }
  return json.resultMap.data || [];
}



async function loadTeamSettings(excelId, teamOptions) {
  const tbody = $(".team-excel-area").find("tbody");
  if (0 === tbody.length) {
    return;
  }
  tbody.empty();

  const { header } = teamOptions;

  const list = await callApiTeamMembers(excelId) || [];

  const dataMapper = function (value, includeMember = false) {
    const { name, teamId, members } = value;
    const options = _.get(members, [0, 'options'], {});
    const { lex = 0, rate = 0, skip = false, colors = {} } = options;

    const data = {
      name, teamId, colors, lex, rate, isNew: false, skip
    }

    if (!!includeMember) {
      data.members = members;
    };

    return data;
  }

  list.forEach((value, index) => {
    const data = dataMapper(value);
    makeTeamListRow(tbody, data, index + 1);
  })


  console.log("🔥 ~ loadTeamSettings ~ columns:", header);
  // header 컬럼명 설정
  setHeaderInTeam(header);

  //팀원 추가 및 선택항목 disabled(팀 추가 이후 처리해야 함.)
  list.forEach((value, index) => {
    const data = dataMapper(value, true);
    const { teamId, members } = data;
    if (!_.isNil(members)) {
      members.forEach((member) => {
        joinedTeam(`#joined-team-${teamId}`, member, (e, el, joindata) => {
          handleDeleteMember(e, el, { ...joindata, teamId })
        });
      })
    }
  });
}


function makeTeamListRow(tbody, data, index) {
  const {
    teamId,
  } = data;

  // 팀이 존재하는 지 확인
  const trLen = tbody.find(`tr[tid="${teamId}"]`).length;
  // tr 추가
  if (0 === trLen) {
    const tr = makeTeamRow(tbody, data, index, TBL_ROW_TYPE_TEAM, handleDeleteTeam);
    tr.data('value', data);
  }
}


// 배틀 팀 정보
function getTeamDataFromTr(tr) {
  const name = tr.find("td.col-team-name input").val();
  const lex = tr.find("td.col-team-gold input").val();
  const rate = tr.find("td.col-team-rate input").val();
  const skip = tr.find("td.col-team-skip input[type=checkbox]").prop("checked");
  const bgcolor = tr.find("td.col-bg-color input").val();
  const namecolor = tr.find("td.col-name-color input").val();
  const wincolor = tr.find("td.col-win-color input").val();

  return { name, lex, rate, skip, bgcolor, namecolor, wincolor };
}
// 베틀 멤버
function getTeamMemberDataFromTr(tr) {
  const members = [];
  tr.find('.joined-team .selected-member').each(function () {
    const target = $(this);
    const nickname = target.attr('label') ?? '';
    const memberId = target.attr('value') ?? '';
    const id = target.attr('id') ?? null;
    members.push({ nickname, memberId, id });
  });

  return members;
}



// 배틀 설정 저장
async function saveAllTeam(excelId) {
  const trs = $(".team-excel-area tbody tr");
  // 저장대상 없음.
  if (0 === trs.length) {
    return;
  }

  const saveParams = [];

  let findError = false;
  for (let i = 0; i < trs.length; i++) {
    const tr = $(trs.get(i));
    const { isNew, teamId } = tr.data("value");
    const { isSame: isTeamSame, bjData: saveTeamData } = isSameData(tr, getTeamDataFromTr);
    const { isSame: isMemberSame, newVal: members } = isSameArryData(tr, getTeamMemberDataFromTr);

    const { name, lex, rate, skip, bgcolor, namecolor, wincolor } = saveTeamData;

    // team validation 체크
    if (_.isEmpty(name) || 2 > (name || "").length) {
      return Message.show(
        `팀 설정에서 ${i + 1}번째 팀명을 입력해 주세요.(최소 2자이상)`
      );
    }
    // member validation
    if (0 === members.length) {
      return Message.show(
        `팀 설정에서 ${i + 1}번째 팀 멤버를 지정해 주세요.`
      );
    }
    // 배틀 팀은 최소 2개 이상
    if (2 > trs.length) {
      return Message.show(
        `2개 이상의 팀을 설정해야합니다.`
      );
    }

    const param = { team: null, members: null };
    // 팀추가
    if (!isTeamSame) {
      param.team = {
        isNew,
        excelId,
        teamId,
        name: name || '',
        options: {
          lex, rate, skip,
          colors: {
            bg: bgcolor, name: namecolor, win: wincolor
          },
        },

      };
    }

    // member 추가
    if (!isMemberSame) {
      param.members = {
        excelId, teamId, members
      };
    }

    if (!isTeamSame || !isMemberSame) {
      saveParams.push(param);
    }
  }

  if (0 === saveParams.length) {
    return;
  }

  // 데이터 저장
  await handleSaveTeamAndMember(saveParams);

  return true;
}


// 배틀 팀 저장
async function callApiTeamSave(teamParam) {
  const { isNew, excelId, teamId, name, options } = teamParam;
  let url = "";

  const param = { excelId, name, options };
  if (isNew && !_.isNil(teamId)) {
    url = `${g_url}/api/excel/team/add`;
  } else {
    url = `${g_url}/api/excel/team/update`;
    param.teamId = teamId;
  }

  const response = await axios.post(url, param);
  const json = response.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    return new Error(json.message || "");
  } else {
    return json.resultMap.data;
  }
}

// 배틀 멤버 저장
async function callApiTeamMemberSave(memberParam) {
  const { excelId, teamId, memberId, nickname, id } = memberParam;
  let url = "";

  const param = { excelId, teamId, bjMemberId: memberId, nickname };
  if (_.isNil(id)) {
    url = `${g_url}/api/excel/team/memberadd`;
  } else {
    url = `${g_url}/api/excel/team/memberupdate`;
    param.id = id;
  }

  const response = await axios.post(url, param);
  const json = response.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    return new Error(json.message || "");
  } else {
    return json.resultMap.data;
  }
}


// 배틀 팀 및 멤버 추가
async function handleSaveTeamAndMember(saveParams) {
  const teamAndMemberPart = function* (datas) {
    while (0 < datas.length) {
      const [part] = datas.splice(0, 1);
      const { team, members } = part;
      if (!_.isNil(team)) {
        yield { type: 'team', param: team };
      }

      if (_.isNil(members)) continue;

      const prevTeamId = _.get(members, ["teamId"]);
      const teamId = _.get(team, "teamId", prevTeamId);
      const excelId = _.get(members, ['excelId'])
      for (let member of members.members) {
        const id = _.get(member, "id");
        if (!_.isNil(id)) continue;

        yield { type: 'member', param: { ...member, excelId, teamId, prevTeamId } };
      }
    }
  };

  const results = [];
  for await (let data of teamAndMemberPart(saveParams)) {
    const { type, param } = data;
    switch (type) {
      case 'team': {
        const result = await callApiTeamSave(param);
        results.push({ type, result: { ...result, prevTeamId: data.param.teamId } });

        const newTeamId = _.get(result, 'teamId');
        if (!_.isNil(newTeamId)) {
          data.param.teamId = newTeamId;
        }
        break;
      }
      case "member":
      default: {
        const result = await callApiTeamMemberSave(param);
        console.log("🔥 ~ forawait ~ result:", result);
        results.push({ type, result: { ...result, prevTeamId: data.param.prevTeamId } });
      }
    }
  }

  let findError = false;
  (results || []).forEach((e) => {
    // forEach에서 return 해당 건만 skip함.
    if (e instanceof Error) {
      findError = true;
      return;
    }

    const {
      type, result
    } = e;

    // 저장결과 처리
    switch (type) {
      case "team": {
        const { teamId, prevTeamId } = result;

        const tr = $(`.team-excel-area tbody tr[tid=${prevTeamId}]`);
        if (0 !== tr.length) {
          const newData = makeTrDataValue(tr, getTeamDataFromTr);
          newData.isNew = false;
          newData.teamId = teamId;

          tr.data('value', newData);
          tr.attr('tid', teamId);

          $(`.col-select-memeber[data-teamid=${prevTeamId}]`).data('teamid', teamId);
          $(`.team-excel-area tbody tr td div#joined-team-${prevTeamId}`).attr("id", `joined-team-${teamId}`);
        }
        break;
      }
      case "member":
      default: {
        const { id, teamId, prevTeamId, memberId } = result;
        const joinedTeam = $(`.team-excel-area tbody tr td div#joined-team-${teamId}`);
        if (0 !== joinedTeam.length) {
          joinedTeam.find(`.selected-member[value=${memberId}]`).attr("id", id);
        }
      }
    }
  });

  // 배틀 리스트 저장 오류
  if (findError) {
    throw new Error("팀 설정 저장 중 오류가 발생했습니다.");
  }
}


// 배틀 팀 삭제
async function callApiDeleteTeam(excelId, teamId) {
  const url = `${g_url}/api/excel/team/remove`;
  const param = { excelId, teamId };

  const response = await axios.post(url, param);
  const json = response.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }
  return json.resultMap.data || [];
}


// 팀 전체 삭제
async function handleDeleteAllTeam() {
  const { value: excelId } = getSelectProjectData();
  const trs = $(".team-excel-area tbody tr");

  let findError = false;

  for await (let e of trs) {
    const tr = $(e);
    const data = tr.data('value');
    const isNew = _.get(data, 'isNew', true);
    const teamId = $(tr).attr('tid');

    if (!isNew) {
      try {
        await callApiDeleteTeam(excelId, teamId);
        tr.remove();
      } catch (e) {
        findError = true;
      }
    }
  }

  if (findError) {
    throw new Error("배틀 초기화 중 오류가 발생했습니다.");
  }
}
// 팀 삭제(1개)
function handleDeleteTeam(e, tr) {
  const { value: excelId } = getSelectProjectData();
  const data = tr.data('value');
  const isNew = _.get(data, 'isNew', true);

  const tbody = $(".team-excel-area").find("tbody");
  const teamId = $(tr).attr('tid');
  const selMembers = tr.find(`.selected-member`);

  if (_.isNil(teamId)) {
    return Message.show("팀정보(아이디)를 알수 없습니다.", { type: "wran" });
  }

  Message.confirm(
    { title: "팀 삭제", message: Message.multiLineMessage(["팀을 삭제하시겠습니까?", "삭제하면 바로 적용됩니다."]) },
    async () => {
      try {

        if (!isNew) {
          // 이미 저장된 데이터
          await callApiDeleteTeam(excelId, teamId);
        }
        // 비활성화 사용자를 활성화
        for (e of selMembers) {
          const val = $(e).attr("value");
          disableTeamMember(val, false, tbody);
        }
        // tr remove
        tr.remove();

      } catch (e) {
        Message.show("팀 삭제를 실패하였습니다.", { type: "wran" });
      }
    }
  );
}

// 배틀 팀 멤버 삭제
async function callApiDeleteTeamMember(excelId, teamId, memberId) {
  const url = `${g_url}/api/excel/team/memberremove`;
  const param = { excelId, teamId, id: memberId };

  const response = await axios.post(url, param);
  const json = response.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }
  return json.resultMap.data || [];
}

// 멤버 삭제.
function handleDeleteMember(e, el, data) {
  Message.confirm(
    { title: "팀 멤버 삭제", message: Message.multiLineMessage(["멤버를 삭제하시겠습니까?", "삭제하면 바로 적용됩니다."]) },
    async () => {
      try {
        const { value: excelId } = getSelectProjectData();
        const { memberId } = data

        const teamId = el.parents('tr').attr('tid');
        const id = el.find(`.selected-member[value=${memberId}]`).attr('id');

        if (!_.isNil(id)) {
          await callApiDeleteTeamMember(excelId, teamId, id);
        }

        el.find(`.selected-member[value=${memberId}]`).remove();
        const tbody = $(".team-excel-area").find("tbody");

        disableTeamMember(memberId, false, tbody);
      } catch (e) {
        Message.show("팀 멤버 삭제를 실패하였습니다.", { type: "wran" });
      }
    }
  );
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
    sponsorAmount: gold = 0, // 후원렉스
    sponsorScore: goldScore = 0, // 렉스 점수
    sponsorContribution: rate = 0, // 기여도
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
  //후원렉스
  $("<td>", {
    class: "col-sponsor-gold",
    text: numberWithCommas(gold),
  }).appendTo(tr);
  /*   // 참여한 BJ
  $("<td>", {
    class: "col-bj-nickname",
    text: displayName,
    "data-id": memberId,
  }).appendTo(tr); */

  // 참여. BJ
  const selectBJ = $("<select>", {
    class: "custom-select bj-nickname",
  }).appendTo(tr);
  // 미지정
  $("<option>", {
    /* disabled: true, */
    selected: true,
    text: "미지정",
    value: "",
  }).appendTo(selectBJ);
  /*   // 대표 BJ
  const { NAME: mainBJName } = getMeInfo();
  $("<option>", {
    selected: true,
    text: `${mainBJName}(대표BJ)`,
    value: "",
  }).appendTo(selectBJ); */

  (bjlist || []).forEach((m) => {
    const option = $("<option>", {
      value: m.memberId,
      text: m.nickname,
    }).appendTo(selectBJ);
    if (String(m.memberId) === String(memberId)) {
      option.attr("selected", true);
    }
  });
  $("<td>", { class: "col-bj-nickname" }).append(selectBJ).appendTo(tr);

  // 렉스 점수
  $("<td>", { class: "col-gold-score" })
    .append($("<input>", { type: "number", placeholder: 0, value: goldScore }))
    .appendTo(tr);
  // 기여도
  $("<td>", { class: "col-rate" })
    .append($("<input>", { type: "number", placeholder: 0, value: rate }))
    .appendTo(tr);

  $("<td>", { class: "col-mng" })
    .append(
      $("<button>", {
        class: "btn btn-sm font-sm",
        text: "수정",
      }).on("click", () => {
        const targetId = tr.find(".col-bj-nickname select").val();
        const sponsorScore = tr.find(".col-gold-score input").val();
        const sponsorContribution = tr.find(".col-rate input").val();

        handleUpdateSponsor(id, targetId, sponsorScore, sponsorContribution);
      })
    )
    .append(
      $("<button>", {
        class: "btn btn-normal btn-sm font-sm",
        text: "취소",
      }).on("click", () => {
        const id = tr.attr("sid");
        const targetId = tr.find(".col-bj-nickname select").val();
        const sponsorScore = tr.find(".col-gold-score input").val();
        const sponsorContribution = tr.find(".col-rate input").val();
        handleCancelSponsor(id, targetId, sponsorScore, sponsorContribution);
      })
    )
    .appendTo(tr);

  return tr;
}

async function callApiSponsorList(page, limit) {
  const { value: excelId } = getSelectProjectData();
  const offset = (Math.max(page, 1) - 1) * limit;
  const url = `${g_url}/api/excel/sponsor/list?excelId=${excelId}&offset=${offset}&limit=${limit}`;

  const response = await axios.get(url);
  const json = response.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }
  return json.resultMap.data;
}

async function loadSponsorList(page, limit) {
  const tbody = $(".sponsor-excel-area").find("tbody");
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
  const tabPaging = $(".sponsor-excel-area .paging-area .tab-paging");
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

function disableTeamMember(id, isDisabled, parent) {
  let target;
  if (_.isNil(parent)) {
    target = $(".select-team-member");
  } else {
    target = parent.find(".select-team-member");
  }

  target.find(`.dropdown-item[value=${id}]`)
    .attr("disabled", isDisabled);
}

function joinedTeam(selector, data, deleteCallback) {
  const { id, memberId, nickname: label } = data;

  const el = $(selector);
  const parent = el.parent();
  if (!parent) return;

  const tbody = parent.parents('tbody');

  const removeMember = $("<div>", {
    class: "selected-member-remove badge-dark",
    /* text: "x", */
  }).append($('<span aria-hidden="true">&times;</span>'));

  removeMember.on("click", (e) => {
    if (_.isFunction(deleteCallback)) {
      deleteCallback(e, el, data);
    }
  });

  const options = {
    class: "selected-member badge-secondary",
    text: label,
    label,
    memberId,
    value: memberId,
  };

  if (!_.isNil(options)) {
    options.id = id;
  }

  $("<div>", options)
    .append(removeMember)
    .appendTo(el);

  const members = parent.data("members") || [];
  members.push(memberId);
  parent.data("members", members);

  disableTeamMember(memberId, true, tbody);
}

function leaveTeam(id) {
  const container = $(".select-team-member-area");
  // dropdownmenu에서 삭제
  const dropdownMenu = container.find(".select-team-member .dropdown-menu");
  dropdownMenu.find(`.dropdown-item[value=${id}]`).remove();
  // 선택된 사용자 삭제
  container.find(`.selected-member[value=${id}]`).remove();
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
      case EXCEL.DATA_TYPE.STOP_PROJECT:
      case EXCEL.DATA_TYPE.END_PROJECT: {
        const { value: excelId } = getSelectProjectData();
        setStartExcelButton(EXCEL.STATUS.END, excelId);
        disableBJSetting(EXCEL.STATUS.END);
        disableRankingSetting(EXCEL.STATUS.END);
      }
      default:
        return;
    }
  });

  socket.open();
}

async function callApiCheckApprove() {
  const url = `${g_url}/api/excel/project/checkApprove`;

  const response = await axios.get(url);
  const json = response.data;
  //console.log("🔥 ~ callApiCheckApprove ~ json:", json);

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }
  return json.resultMap.data || [];
}

async function checkApproveExcel() {
  try {
    await callApiCheckApprove();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

function goToPrevious(url) {
  location.href = url;
}

g_login_checking(login_callbackFn);
function login_callbackFn(member) {
  checkApproveExcel()
    .then(() => {
      const page = getQueryParam(location.href, "page");
      init(page);
    })
    .catch((e) => {
      Message.show(
        Message.multiLineMessage([
          "엑셀방송은 신청 승인 후",
          "사용하실 수 있습니다.",
          "(플렉스티비 > 고객센터 > 1:1문의)",
        ]),
        {
          type: "warn",
          label: "문의하기",
          closeHandler: () => {
            history.back();
            //g_flextv
            window.open(`${g_flextv}/channels/broadcast`, "_blank");
          },
        }
      );

      $(".spinner-border").css("display", "none");
    });

  $("#user_pic").data("me", member);
  if (member.IMG_URL && member.IMG_URL != "") {
    $("#user_pic").find("img").attr("src", member.IMG_URL);
  }

  $("#user_name").text(member.NAME);
  $("#user_mid").text("(" + member.MID + ")");
}
