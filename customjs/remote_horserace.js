axios.defaults.withCredentials = true;
var preset_setting_data_horserace = {};
var intervalID_horserace;
var raceStt_horserace;
var currenMembers_horserace = [];
var currentTickets_horserace = [
  {
    id: 18,
    nickname: "--",
    loginId: "--",
    createdAt: "2025-12-31T09:47:09.000Z",
  },
];

// gameSettingData.isLuckyRaceStt = "off";
// gameSettingData.gameType = "호스트";
// gameSettingData.minBetMoney = "100";
// gameSettingData.betStayMinute = "5";
// gameSettingData.winningRange = "2"
// gameSettingData.gameVolume = "50";
// gameSettingData.trackType = "1"; // 1,2

//var current_preset_type = "luckyrace";

function callIsAllowedBj_horserace() {
  // const url = `${g_url}/callback/horse-race/allowed?bjId=${memberData.MID}&uid=${memberData.MEMBER_UID}`;
  // const response = await axios.get(url);
  // const json = response.data;
  // console.log('isAllowedBj:',  json)
  // if(json.allowed){
  //   return true;
  // }else{
  //   return false;
  // }
  return true;
}

function createDefaultJson_horserace() {
  var jsonObj = {};
  jsonObj.isHorseRaceStt = "off";
  jsonObj.betMode = "single";
  jsonObj.gameType = "호스트";
  jsonObj.horseRaceOpenRex = "500";
  jsonObj.betStayMinute = "5";
  jsonObj.winningRange = "3";
  jsonObj.gameVolume = "50";
  jsonObj.trackType = "1"; // 1,2,3

  //console.log("createDefaultJson:", JSON.stringify(jsonObj))
  return JSON.stringify(jsonObj);
}

function createPreset_horserace() {
  axios
    .post(g_url + "/preset/createpreset", {
      type: "horserace",
    })
    .then(function (response) {
      let json = response.data;
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
          console.log("createPreset success: ", json);
          //  $('.spinner-border').css("display", "none");

          var t_data = json.resultMap.dataRow;
          t_data.DATA = createDefaultJson_horserace();
          preset_setting_data_horserace = t_data.DATA;
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

async function getPresetList_horserace() {
  await axios
    .get(g_url + "/preset/getpresetlist?type=horserace")
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
              data.DATA = createDefaultJson_horserace();
              preset_setting_data_horserace = data.DATA;
            }
            preset_setting_data_horserace = JSON.parse(data.DATA);
          });
        } else {
          createPreset_horserace();
          //  console.log("하나도 없을시 데이터 생성: ");
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

async function start_round_horserace() {
  return false;
  //{ "bjId": memberData.MID, "waitingMinutes": preset_setting_data_horserace.betStayMinute }
  /* await axios
    .post(g_url + "/callback/horse-race/start_round", {
      bjId: memberData.MID,
      waitingMinutes: preset_setting_data_horserace.betStayMinute,
      betMode: preset_setting_data_horserace.betMode
        ? preset_setting_data_horserace.betMode
        : "single",
    })
    .then(function (response) {
      let json = response;
      console.log("start_round ", json.data);
      setHorseraceStt("2");
      $("#playerList_horserace").show();
      intervalID_horserace = setInterval(getLatest_round_horserace, 1000);
    })
    .catch(function (error) {})
    .then(function () {
      // always executed
    }); */
}

function setTickets_horserace(arr) {
  console.log("setTickets_horserace", arr);
  //currentTickets_horserace = arr;
  // $("#numOfTicket_horserace").text("수량:" + currentTickets_horserace.length)
}

async function getLatest_round_horserace(isInit = null) {
  let result = "stay";
  // console.log('getLatest_round_horserace isInit',  isInit)
  let roundId;
  let startAt;
  await axios
    .get(
      g_url +
        `/callback/horse-race/latest_round?bjId=${memberData.MID}&uid=${memberData.MEMBER_UID}`,
    )
    .then(function (response) {
      let json = response.data;
      // setTickets_horserace(json.tickets);
      roundId = json.roundId;
      startAt = moment(json.startAt).format("YYYY.MM.DD");
      if (isInit && json.isCompleted == false) {
        result = "inGame";
      } else if (isInit == null && !json.isCompleted) {
        var isStartTime = setRemainingTime_horserace(json.now, json.closeAt);
        appendMembers_horserace(json.members);
        if (isStartTime) {
          setHorseraceStt("3"); // 게임이 끝나는 시점으로 옮겨야 함
          //clearInterval(intervalID_horserace);
        } else {
          setHorseraceStt("2");
        }
      } else if (
        raceStt_horserace == "3" &&
        isInit == null &&
        json.isCompleted
      ) {
        setHorseraceStt("4");
        appendMembers_horserace(json.members);
      }
    })
    .catch(function (error) {})
    .then(function () {
      // always executed
    });
  $("#betInfoMember_horserace").text(
    startAt + "(" + roundId + "회차) 참여자 리스트",
  );
  return result;
}

function setHorseraceStt(stt) {
  console.log("setHorseraceStt : ", stt);
  raceStt_horserace = stt;
  if (raceStt_horserace == "1") {
    //console.log("111111", currentTickets.length)
    if (currentTickets_horserace.length > 0) {
      $("#stt01-1_horserace").prop("disabled", false);
    } else {
      // console.log("222222", currentTickets.length)
      $("#stt01-1_horserace").prop("disabled", true);
    }
    $("#stt01_horserace").show();
    $("#stt02_horserace").hide();
    $("#stt03_horserace").hide();
  } else if (raceStt_horserace == "2") {
    $("#stt01_horserace").hide();
    $("#stt02_horserace").show();
    $("#stt03_horserace").hide();
  } else if (raceStt_horserace == "3") {
    $("#stt01_horserace").hide();
    $("#stt02_horserace").hide();
    $("#stt03_horserace").hide();
  } else if (raceStt_horserace == "4") {
    $("#stt01_horserace").hide();
    $("#stt02_horserace").hide();
    $("#stt03_horserace").show();
  }
}

function removeHoresrace() {
  clearInterval(intervalID_horserace);
  //setTimeout(onGameReplay_horserace, 100);
  onGameReplay_horserace();
}

async function horserace_init() {
  $("#stt01_horserace").hide();
  const isAllowedBj = callIsAllowedBj_horserace();
  if (isAllowedBj) {
    await getPresetList_horserace();
    setTimeout(setDiaplay_horserace, 0);
  } else {
    alert("지원하지 않는 기능입니다.");
    $("#stt01-1_horserace").prop("disabled", true);
    $("#stt01-1_horserace").hide();
  }
}

function setRemainingTime_horserace(_now, _target) {
  // console.log(_now, _target)
  const now = moment(_now);
  const target = moment(_target);
  const diff = moment.duration(target.diff(now));
  const minutes = String(Math.floor(diff.asSeconds() / 60)).padStart(2, "0");
  const seconds = String(Math.floor(diff.asSeconds() % 60)).padStart(2, "0");
  const diffSec = target.diff(now, "seconds");
  if (diffSec <= 0) {
    //console.log("남은 시간이 0초 이하입니다");
    $("#betStaySec_horserace").text(`${"0"}:${"00"}`);
    return true;
  } else {
    $("#betStaySec_horserace").text(`${minutes}:${seconds}`);
    // console.log(`${minutes}:${seconds}`);
    return false;
  }
}

async function setDiaplay_horserace() {
  const result = await getLatest_round_horserace(true);
  console.log("result ~~~:", result);
  //console.log("luckyrace_init", preset_setting_data_luckyrace);
  //console.log("setDiaplay currentTickets_horserace", currentTickets_horserace);
  //$("#nickName_horserace").text(currentTickets_horserace[0]?currentTickets_horserace[0].nickname+'('+currentTickets_horserace[0].loginId+')':'');
  //$("#rexMoney_horserace").text(preset_setting_data_horserace.horseRaceOpenRex + '렉스');
  //$("#winningRange").text(preset_setting_data_luckyrace.winningRange + '등');
  $("#betStaySec_horserace").text(
    preset_setting_data_horserace.betStayMinute + ":00",
  );

  if (preset_setting_data_horserace.isHorseRaceStt == "off") {
    alert("게임설정이 비활성화 되어 있습니다.");
    $("#stt01-1_horserace").prop("disabled", true);
    $("#stt01-1_horserace").hide();
  }

  if (result == "inGame") {
    console.log("진행중!!");
    // setHorseraceStt("2")
    $("#playerList_horserace").show();
    intervalID_horserace = setInterval(getLatest_round_horserace, 1000);
  } else {
    if (preset_setting_data_horserace.isHorseRaceStt == "off") {
      $("#stt01-1_horserace").prop("disabled", true);
      $("#stt01-1_horserace").hide();
    } else {
      $("#stt01-1_horserace").prop("disabled", false);
      $("#stt01-1_horserace").show();
    }

    setHorseraceStt("1");
    console.log("대기중!!");
  }
}

function onShowResult_horserace() {
  $(".result-text_horserace").show();
}

function onGameCreate_horserace() {
  console.log("onGameCreate_horserace");
  start_round_horserace();
}

async function callApiRoundCancle_horserace() {
  const url = `${g_url}/callback/horse-race/cancel_round`;
  const param = {
    uid: memberData.MEMBER_UID,
    bjId: memberData.MID,
  };
  const response = await axios.post(url, param);
  const json = response.data;
  if (json.success) {
    return true;
  } else {
    return false;
  }
}

async function onGameCancel_horserace() {
  const isRoundCancel = await callApiRoundCancle_horserace();
  if (isRoundCancel) {
    console.log("onGameCancel");
    $("#betStaySec_horserace").text(
      preset_setting_data_horserace.betStayMinute + ":00",
    );
    $("#playerList_horserace").hide();
    $("#playerList-body_horserace").empty();
    currenMembers_horserace = [];
    clearInterval(intervalID_horserace);
    console.log("onGameCancel_horserace");
    setHorseraceStt("1");
  }
}

function onGameReplay_horserace() {
  clearInterval(intervalID_horserace);
  $("#playerList_horserace").hide();
  $("#playerList-body_horserace").empty();
  currenMembers_horserace = [];
  setHorseraceStt("1");
  // setTimeout(()=>{
  //   console.log('onGameReplay_horserace')
  //   setHorseraceStt("1");
  // },500)
}

// const PlayerData = {
//   "loginId": "newbj2",
//   "nickname": "오라오라헝.",
//   "optionId": "2",
//   "optionName": "젖소",
//   "amount": 1000,
//   "rank": 5,
//   "reward": 0
// }

function appendMembers_horserace(arr) {
  $("#playerList-body_horserace").empty();
  arr.forEach(function (member) {
    // const isMember = currenMembers_horserace.find(m => m.loginId === member.loginId);
    //if(isMember == undefined){
    //   currenMembers_horserace.push(member);
    $("#playerList-body_horserace").append(createPlayer_horserace(member));
    // }
  });
}

function createPlayer_horserace(pdata) {
  console.log("createPlayer_horserace", pdata.reward, pdata.reward == 0);
  const result = $("<div>")
    .addClass("list-alarm-area")
    .append(
      $("<div>")
        .addClass("alarm-box")
        .append($("<div>").append($("<span>").text(pdata.loginId)))
        .append($("<div>").append($("<span>").text(pdata.nickname)))
        .append(
          $("<div>").append(
            $("<span>").text(Number(pdata.amount).toLocaleString()),
          ),
        )
        .append(
          $("<div>").append(
            $("<span>").addClass("list-txt-point").text(pdata.optionName),
          ),
        )
        .append(
          $("<div>")
            .addClass("result-text_horserace")
            .hide()
            .append(
              $("<span>")
                .addClass(pdata.reward == 0 ? "" : "list-txt-point")
                .text(pdata.reward == 0 ? "예측 실패" : "예측 성공"),
            ),
        )
        .append(
          $("<div>")
            .addClass("result-text_horserace")
            .hide()
            .append(
              $("<span>")
                .addClass("result-text_horserace")
                .addClass(pdata.reward == 0 ? "" : "list-txt-point")
                .text(
                  pdata.reward == 0
                    ? "0"
                    : "+" + Number(pdata.reward).toLocaleString(),
                ),
            ),
        ),
    );

  return result;
}
