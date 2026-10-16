axios.defaults.withCredentials = true;
let my_key;
let currentExcel;
let current_data;
let prev_font_name;
let excelProject;
let excelRanking;
let excelBj;
let arr_left_times = undefined;
let isEndExcel = false;

const MINUTES_5 = 5 * 60;

const SORT = {
  GOLD: "gold",
  RATE: "rate",
};
const ANIMATE_CLASS_GOLD = "animated heartBeat";

const battle = new Battle("preview-list");

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
    console.log("disconnect!", data);
    // alert("통신이 끊어졌습니다");
  });

  socket.on("notice", function (data) {
    const dataType = data.type;
    //console.log("🔥🔥🔥 ~ notice data:", data);

    if (isEndExcel && dataType !== EXCEL.DATA_TYPE.DETAIL_PROJECT) {
      console.log("종료된 회차입니다.", data);
      return;
    }

    switch (dataType) {
      /*  case EXCEL.DATA_TYPE.START_PROJECT:
        isEndExcel = false;
        break;
      case EXCEL.DATA_TYPE.STOP_PROJECT:
        isEndExcel = true;
        break; */
      case EXCEL.DATA_TYPE.ADD_SPONSOR:
      case EXCEL.DATA_TYPE.UPDATE_SPONSOR:
      case EXCEL.DATA_TYPE.CANCEL_SPONSOR:
      case EXCEL.DATA_TYPE.SEND_SPONSOR:
        setTeamSum();
        break;
      // 처리하지 않음
      case EXCEL.DATA_TYPE.START_TIMER:
      case EXCEL.DATA_TYPE.ADD_BJ:
      case EXCEL.DATA_TYPE.CHANGE_BJ:
      case EXCEL.DATA_TYPE.ADD_RANKING:
      case EXCEL.DATA_TYPE.CHANGE_RANKING:
      case EXCEL.DATA_TYPE.DELETE_RANKING:
      case EXCEL.DATA_TYPE.ADD_TEAM:
      case EXCEL.DATA_TYPE.CHANGE_TEAM:
      case EXCEL.DATA_TYPE.DELETE_TEAM:
        return;
      case EXCEL.DATA_TYPE.ADD_BATTLE_TEAM:
      case EXCEL.DATA_TYPE.UPDATE_BATTLE_TEAM:
      case EXCEL.DATA_TYPE.ADD_BATTLE_MEMBER:
      case EXCEL.DATA_TYPE.UPDATE_BATTLE_MEMBER:
        break;
      case EXCEL.DATA_TYPE.REMOE_BATTLE_TEAM:
      case EXCEL.DATA_TYPE.REMOVE_BATTLE_MEMBER:
        getTeamList(my_key);
        break;
      case EXCEL.DATA_TYPE.BATTLE_TIMER_INIT:
        initTimer(data);
        break;
      case EXCEL.DATA_TYPE.BATTLE_TIMER_STOP:
        stopTimer(data);
        break;
      case EXCEL.DATA_TYPE.BATTLE_TIMER_START:
        startTimer(data)
        break;
      case EXCEL.DATA_TYPE.BATTLE_START:
        restTeamSum();
        break;
      /* case EXCEL.DATA_TYPE.BATTLE_TIMER_START:
      case EXCEL.DATA_TYPE.BATTLE_TIMER_START:
      case EXCEL.DATA_TYPE.BATTLE_STOP:
        console.log('battle start and stop');
        break; */
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
    // console.log("🔥💦 ~ eventaction:", data);

    if (isEndExcel && dataType !== EXCEL.DATA_TYPE.DETAIL_PROJECT) {
      console.log("종료된 회차입니다.", data);
      return;
    }

    switch (dataType) {
      case EXCEL.DATA_TYPE.START_PROJECT:
        isEndExcel = false;
        break;
      case EXCEL.DATA_TYPE.END_PROJECT:
      case EXCEL.DATA_TYPE.STOP_PROJECT:
        isEndExcel = true;
        break;

      case EXCEL.DATA_TYPE.DETAIL_PROJECT:
        getTeamList(my_key);
        break;
      case EXCEL.DATA_TYPE.DELETE_BJ:
        break;
      case EXCEL.DATA_TYPE.DELETE_PROJECT:
        break;
      case EXCEL.DATA_TYPE.START_TIMER:
        //startTimer(data);
        break;
      // change event
      case EXCEL.DATA_TYPE.CHANGE_PROJECT:
      case EXCEL.DATA_TYPE.ADD_PROJECT:
        getTeamList(my_key);
        break;
      case EXCEL.DATA_TYPE.ADD_BATTLE_TEAM:
      case EXCEL.DATA_TYPE.UPDATE_BATTLE_TEAM:
      case EXCEL.DATA_TYPE.ADD_BATTLE_MEMBER:
      case EXCEL.DATA_TYPE.UPDATE_BATTLE_MEMBER:
        break;
      case EXCEL.DATA_TYPE.REMOE_BATTLE_TEAM:
      case EXCEL.DATA_TYPE.REMOVE_BATTLE_MEMBER:
        getTeamList(my_key);
        break;
      case EXCEL.DATA_TYPE.BATTLE_TIMER_STOP:
      case EXCEL.DATA_TYPE.BATTLE_START:
        console.log('timer start and stop');
        break;
    }
  });

  socket.open();
}

function startTimer(data) {
  const { excelId, seconds } = data;

  const currentExcelId = getExcelId();
  if (Number(currentExcelId) !== Number(excelId)) return;
  // 설정된 시간 or 남아있는 시간이 없으면 시간을 초기화 후 타이머 시작
  // 시간이 남아있다면 남아 았는 시간으로 타이머를 시작 함.
  if (battle.isEndTimer) {
    battle.setTime(seconds);
  }

  battle.startTimer();
}

function stopTimer(data,) {
  const { excelId } = data;
  const currentExcelId = getExcelId();
  if (Number(currentExcelId) !== Number(excelId)) return;

  battle.stopTimer();
}

function initTimer(data) {
  const { excelId, seconds } = data;
  const currentExcelId = getExcelId();
  if (Number(currentExcelId) !== Number(excelId)) return;

  if (battle.isStartTimer) {
    battle.stopTimer();
  }

  battle.setTime(seconds);
}
// 후원합 가져오기
async function callApiSponsorSumAll() {
  try {
    const excelId = getExcelId();
    const url = `${g_url}/api/pages/battle/sponsorsumall`;
    const param = { excelId, page: my_key };
    const respons = await axios.post(url, param);
    const json = respons.data;

    if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
      return console.error(json.message || "");
    }
    const {
      resultMap: {
        data
      },
    } = json;

    return data ?? [];
  } catch (e) {
    console.error(e);
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
      // console.log("_key", _key, current_data);
      getTeamList(_key);
    })
    .catch(function (error) { })
    .then(function () {
      // always executed
    });
}

function createDefaultJson() {
  var jsonObj = {};

  jsonObj.battle_theme = "theme-a";
  // 투명도
  jsonObj.win_transparency = 0;
  // 엑셀 배틀 설정
  jsonObj.battle_title = "플렉스 대결";
  jsonObj.battle_title_font_name = "ff-01";
  jsonObj.battle_title_font_color = "#ffffff";
  jsonObj.battle_title_font_bold = "on";
  jsonObj.battle_title_font_size = 28;

  return jsonObj;
}

function getExcelId() {
  if (_.isEmpty(currentExcel)) return "";

  const { excelId } = currentExcel;

  return excelId || '';
}

async function callApiExcelBattle() {
  const url = `${g_url}/api/pages/battle/list`;
  const param = { page: my_key };
  const respons = await axios.post(url, param);
  const json = respons.data;

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    return console.error(json.message || "");
  }
  const {
    resultMap: {
      data, excel
    },
  } = json;

  currentExcel = excel;
  return { data, excel };
}

function mappperForBattle(data) {
  if (_.isNil(current_data) || _.isNil(data)) {
    return;
  }
  const title = _.get(current_data, 'battle_title', '');
  const groupData = _.groupBy(data, "teamId");

  const battleInfo = { title, teams: [] };

  for (let key in groupData) {
    const teamMembers = groupData[key];

    // member
    const members = [];
    teamMembers.forEach((m) => members.push({
      memberId: m.memberId, nickname: m.nickname
    })
    );

    const teamData = {
      teamId: _.get(teamMembers, [0, 'teamId']),
      teamName: _.get(teamMembers, [0, 'teamName']),
      options: _.get(teamMembers, [0, 'options']),
      members
    };

    battleInfo.teams.push(teamData);
  }

  return battleInfo;
}

async function getTeamList(_key) {
  try {
    const { data, excel } = await callApiExcelBattle();
    if (_.isNil(data) || _.isNil(excel)) {
      return;
    }

    const battleInfo = mappperForBattle(data);
    setDisplay(battleInfo, excel);

    setTeamSum();
  } catch (e) {
    console.error(e);
    // 종료된 엑셀
    battle.battleInfo = null;
    battle.render();
  }
}

async function setTeamSum() {
  const sumData = await callApiSponsorSumAll();
  if (_.isEmpty(sumData)) {
    return battle.resetTeamSum();
  };

  for (let teamSum of sumData) {
    const { memberId, sumAmount, sumContribution } = teamSum;
    battle.receiveSponsor(memberId, sumAmount, sumContribution);
  }
}

function restTeamSum() {
  battle.resetTeamSum();
}

function setDisplay(battleInfo, excel) {
  const { options: { battle: battleOptions } } = excel;

  battle.battleInfo = battleInfo;
  battle.scoreType = battleOptions.dspScore;
  battle.setUesDifferenceScores = battleOptions.useDifferenceScores;

  battle.render();

  // title style //////////////////////////////////////////////
  const { battle_title_font_bold, battle_title_font_color, battle_title_font_name, battle_title_font_size, win_transparency } = current_data;
  // title color
  battle.setTitleCSS("color", battle_title_font_color);
  // title bold
  if ('on' === battle_title_font_bold) {
    battle.addTitleClass("font-weight-bold");
  } else {
    battle.removeTitleClass("font-weight-bold");
  }
  // font name
  battle.addTitleClass(battle_title_font_name);
  //title font  size
  battle.setTitleCSS("font-size", `${battle_title_font_size}px`);
  // 투명도
  prev_set_transparency(win_transparency);

}

function prev_set_transparency(_temp,) {
  _temp = 100 - _temp;
  var t_val = _temp * 0.01;
  $(".preview-list-area").css({ opacity: t_val });
}

function getThemeClassName(s_theme) {
  return `excel-${s_theme}`;
}

function prev_set_transparency(_temp) {
  _temp = 100 - _temp;
  var t_val = _temp * 0.01;
  $(".preview-list-area").css({ opacity: t_val });
}

init();
