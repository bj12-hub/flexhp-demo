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

const excelTeam = new Team("#preview-list");

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
      case EXCEL.DATA_TYPE.ADD_TEAM:
      case EXCEL.DATA_TYPE.UPDATE_TEAM:
      case EXCEL.DATA_TYPE.REMOVE_TEAM:
        getTeamList(my_key);
        break;
      case EXCEL.DATA_TYPE.REMOVE_TEAM_MEMBER:
        getTeamList(my_key);
        break;
      case EXCEL.DATA_TYPE.CHANGE_PROJECT:
      case EXCEL.DATA_TYPE.TEAM_START:
        getTeamList(my_key);
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
    //console.log("🔥💦 ~ eventaction:", data);

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
        break;
      // change event
      case EXCEL.DATA_TYPE.CHANGE_PROJECT:
      case EXCEL.DATA_TYPE.ADD_PROJECT:
        getTeamList(my_key);
        break;
      case EXCEL.DATA_TYPE.ADD_TEAM:
      case EXCEL.DATA_TYPE.UPDATE_TEAM:
      case EXCEL.DATA_TYPE.ADD_TEAM_MEMBER:
      case EXCEL.DATA_TYPE.UPDATE_TEAM_MEMBER:
        break;
      case EXCEL.DATA_TYPE.REMOVE_TEAM:
      case EXCEL.DATA_TYPE.REMOVE_TEAM_MEMBER:
        getTeamList(my_key);
        break;
      case EXCEL.DATA_TYPE.TEAM_START:
        getTeamList(my_key);
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
  if (excelTeam.isEndTimer) {
    excelTeam.setTime(seconds);
  }

  excelTeam.startTimer();
}

function stopTimer(data,) {
  const { excelId } = data;
  const currentExcelId = getExcelId();
  if (Number(currentExcelId) !== Number(excelId)) return;

  excelTeam.stopTimer();
}

function initTimer(data) {
  const { excelId, seconds } = data;
  const currentExcelId = getExcelId();
  if (Number(currentExcelId) !== Number(excelId)) return;

  if (excelTeam.isStartTimer) {
    excelTeam.stopTimer();
  }

  excelTeam.setTime(seconds);
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

  jsonObj.team_theme = "theme-team-a";
  // 투명도
  jsonObj.win_transparency = 0;
  // 팀 타이틀 설정
  jsonObj.team_title = "플렉스 대결";
  jsonObj.team_title_font_name = "ff-01";
  jsonObj.team_title_font_color = "#ffffff";
  jsonObj.team_title_font_bold = "on";
  jsonObj.team_title_font_size = 28;
  jsonObj.team_title_font_outline = 0;
  jsonObj.team_title_font_outline_color = "#000000";
  // 팀 폰트(항목)
  jsonObj.team_item_font_name = "ff-01";
  jsonObj.team_item_font_bold = "on";
  jsonObj.team_item_font_size = 30;
  // 팀 항목별 색상
  jsonObj.team_color_header = "#171A1C";
  jsonObj.team_color_bj = "#171A1C";
  jsonObj.team_color_lex = "#171A1C";


  return jsonObj;
}

function getExcelId() {
  if (_.isEmpty(currentExcel)) return "";

  const { excelId } = currentExcel;

  return excelId || '';
}

async function callApiExcelBattle() {
  const url = `${g_url}/api/pages/team/list`;
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

function mappperForTeam(data, excel) {
  //_.groupBy(data, 'teamId');
  if (_.isNil(current_data) || _.isNil(data) || _.isNil(excel)) {
    return;
  }
  const { options: { team: teamOption } } = excel;


  const title = _.get(current_data, 'team_title', '');
  const sort = _.get(excel, ['options', "team", "sort"], "lex")
  const header = _.get(excel, ['options', "team", "header"])
  const teamInfo = { title, sort, header, teams: data };

  for (let team of teamInfo.teams) {
    const teamMembers = team.members;
    team.options = _.get(teamMembers, [0, 'options']);
  };

  return teamInfo;
}

function mappperForBattle(data, excel) {
  if (_.isNil(current_data) || _.isNil(data)) {
    return;
  }
  const { excelId } = excel;
  const title = _.get(current_data, 'team_title', '');


  const battleInfo = { excelId, title, teams: [] };
  // // {options: {lex, rate, sumLex : sumRate}}
  for (let team of data) {
    const { totalSponsorScore, totalSponsorContribution } = team;
    const teamMembers = team.members;

    // member
    const members = [];
    teamMembers.forEach((m) => members.push({
      memberId: m.memberId, nickname: m.nickname
    })
    );

    const teamData = {
      teamId: _.get(team, ['teamId']),
      teamName: _.get(team, ['name']),
      options: { ..._.get(teamMembers, [0, 'options'], {}), sumLex: totalSponsorScore, sumRate: totalSponsorContribution },
      members
    };

    const skip = _.get(teamData, ['options', 'skip'], false);
    if (!skip) {
      battleInfo.teams.push(teamData);
    }
  }

  return battleInfo;
}


async function setDisplayBattle(data, excel) {
  if (_.isNil(data) || _.isNil(excel)) {
    return;
  }

  const { options: { battle: battleOptions } } = excel;

  const excelTeamInfo = mappperForBattle(data, excel);
  excelTeam.teamInfo = excelTeamInfo;
  excelTeam.scoreType = battleOptions.dspScore;
  excelTeam.setUesDifferenceScores = battleOptions.useDifferenceScores;

  excelTeam.render();

  // title style //////////////////////////////////////////////
  const {
    team_title_font_bold,
    team_title_font_color,
    team_title_font_name,
    team_title_font_size,
    win_transparency
  } = current_data;
  // title color
  excelTeam.setTitleCSS("color", team_title_font_color);
  // title bold
  if ('on' === team_title_font_bold) {
    excelTeam.addTitleClass("font-weight-bold");
  } else {
    excelTeam.removeTitleClass("font-weight-bold");
  }
  // font name
  excelTeam.addTitleClass(team_title_font_name);
  //title font  size
  excelTeam.setTitleCSS("font-size", `${team_title_font_size}px`);

  prev_set_transparency(win_transparency);
}

async function setDisplayTeam(data, excel) {
  if (_.isNil(data) || _.isNil(excel)) {
    return;
  }

  const excelTeamInfo = mappperForTeam(data, excel);
  excelTeam.theme = current_data.team_theme;
  excelTeam.teamInfo = excelTeamInfo;

  const {
    team_title_font_bold,
    team_title_font_color,
    team_title_font_name,
    team_title_font_outline,
    team_title_font_outline_color,
    team_title_font_size,
    team_item_font_size,
    team_item_font_name,
    team_item_font_bold,
    team_color_rate,
    team_color_lex,
    team_color_header,
    team_color_bj
  } = current_data;

  excelTeam.render();

  //font size
  excelTeam.setItemFontSize(team_item_font_size);
  // font name
  excelTeam.setItemFontName(team_item_font_name);
  // font bold
  excelTeam.setItemFontBold(team_item_font_bold);
  // font team color
  excelTeam.setTeamColor(team_color_header);
  // font bj color
  excelTeam.setBjColor(team_color_bj);
  // font lex color
  excelTeam.setLexColor(team_color_lex);
  // font rate color
  excelTeam.setRateColor(team_color_rate);

  excelTeam.setTitleCSS("color", team_title_font_color);
  // title bold
  if ('on' === team_title_font_bold) {
    excelTeam.addTitleClass("font-weight-bold");
  } else {
    excelTeam.removeTitleClass("font-weight-bold");
  }
  // font name
  excelTeam.addTitleClass(team_title_font_name);
  //title font  size
  excelTeam.setTitleCSS("font-size", `${team_title_font_size}px`);
  //타이틀 외곽선
  excelTeam.setTitleOutline(team_title_font_outline_color, team_title_font_outline);

  excelTeam.applyStyle();
}

async function getTeamList(_key) {
  try {
    const { team_theme } = current_data;
    const { data, excel } = await callApiExcelBattle();
    if (_.isNil(data) || _.isNil(excel)) {
      return;
    }

    setDisplay(data, excel, team_theme);


  } catch (e) {
    console.error(e);
    // 종료된 엑셀
    excelTeam.battleInfo = null;
    excelTeam.render();
  }
}

async function setTeamSum() {
  const { data, excel } = await callApiExcelBattle();
  if (_.isNil(data) || _.isNil(excel)) {
    return;
  }

  const teamData = excelTeam.isTeamType ?
    mappperForTeam(data, excel) :
    mappperForBattle(data, excel);

  for (let team of teamData.teams) {
    excelTeam.receiveSponsor(team);
  }
}

function restTeamSum() {
  excelTeam.resetTeamSum();
}

function setDisplay(teamData, excel, team_theme) {
  const { options: { battle: battleOptions } } = excel;
  const { win_transparency } = current_data;
  excelTeam.theme = team_theme;
  if (excelTeam.isTeamType) {
    setDisplayTeam(teamData, excel);
  } else {
    setDisplayBattle(teamData, excel);
  }

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
