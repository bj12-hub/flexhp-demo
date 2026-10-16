axios.defaults.withCredentials = true;
var preset_setting_data_luckyrace = {}
var intervalID;
var raceStt;
var currenMembers = [];
var currentTickets = [
  {
    "id": 18,
    "nickname": "--",
    "loginId": "--",
    "createdAt": "2025-12-31T09:47:09.000Z"
  }
];

  // gameSettingData.isLuckyRaceStt = "off";
  // gameSettingData.gameType = "호스트";
  // gameSettingData.minBetMoney = "100";
  // gameSettingData.betStayMinute = "5";
  // gameSettingData.winningRange = "2"
  // gameSettingData.gameVolume = "50";
  // gameSettingData.trackType = "1"; // 1,2

//var current_preset_type = "luckyrace";




function callIsAllowedBj(){
  // const url = `${g_url}/callback/allowed?bjId=${memberData.MID}&uid=${memberData.MEMBER_UID}`;
  // const response = await axios.get(url);
  // const json = response.data;
  // console.log('isAllowedBj:',  json)
  // if(true){
  //   return true;      
  // }else{
  //   return false;
  //}
  return true;
}


function createDefaultJson_luckyrace() {

  var jsonObj = {}
  jsonObj.isLuckyRaceStt = "off";
  jsonObj.gameType = "호스트";
  jsonObj.luckyRaceOpenRex = "500";
  jsonObj.betStayMinute = "3";
  jsonObj.winningRange = "3"
  jsonObj.gameVolume = "50";
  jsonObj.trackType = "1"; // 1,2,3

  //console.log("createDefaultJson:", JSON.stringify(jsonObj))
  return JSON.stringify(jsonObj)
}


function createPreset_luckyrace() {
  //console.log("createPreset_luckyrace~~~");
  axios
    .post(g_url + "/preset/createpreset", {
      type: "luckyrace",
    })
    .then(function (response) {
      let json = response.data;
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
          console.log("createPreset success: ", json);
          //  $('.spinner-border').css("display", "none");

          var t_data = json.resultMap.dataRow;
          t_data.DATA = createDefaultJson_luckyrace();
          preset_setting_data_luckyrace = t_data.DATA;
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
    .catch(function (error) { })
    .then(function () {
      // always executed
    });
}


async function getPresetList_luckyrace() {
  await axios
    .get(g_url + "/preset/getpresetlist?type=luckyrace")
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
              data.DATA = createDefaultJson_luckyrace();
              preset_setting_data_luckyrace = data.DATA;          
            }
            preset_setting_data_luckyrace = JSON.parse(data.DATA);  
          });
        } else {
          
          createPreset_luckyrace();
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




async function start_round() {  
  //console.log('start_round',  memberData.MID , preset_setting_data_luckyrace.betStayMinute)
  await axios.post(g_url + '/callback/start_round', { "bjId": memberData.MID, "waitingMinutes": preset_setting_data_luckyrace.betStayMinute })
    .then(function (response) {
      let json = response;
      console.log('start_round ', json.data);
      setLuckyraceStt("2")
      $("#playerList").show();
      intervalID = setInterval(getLatest_round, 1000);
    })
    .catch(function (error) {
    })
    .then(function () {
      // always executed
    });
}



function setTickets(arr){
  console.log('setTickets',arr)
  // currentTickets = arr;
 // $("#numOfTicket").text("수량:" + currentTickets.length)

}

async function getLatest_round(isInit = null) {

  let result =  'stay';
  //console.log('getLatest_round',  memberData.MID)
  let roundId;
  let startAt;
  await axios
    .get(g_url + `/callback/latest_round?bjId=${memberData.MID}&uid=${memberData.MEMBER_UID}`)
    .then(function (response) {
      let json = response.data; 
      roundId = json.roundId;
      startAt = moment(json.startAt).format("YYYY.MM.DD");
      //setTickets(json.tickets);      
      if(isInit && json.isCompleted == false){
          result = 'inGame'
      }else if(isInit == null){
        var isStartTime = setRemainingTime(json.now, json.closeAt);
        appendMembers(json.members);
        if(isStartTime){
            setLuckyraceStt("3"); // 게임이 끝나는 시점으로 옮겨야 함
            clearInterval(intervalID);
        }       
      }else{       
      }
    })
    .catch(function (error) {})
    .then(function () {
      // always executed
    });
    $('#betInfoMember').text(startAt + '(' + roundId + '회차) 참여자 리스트' );
    return result;
}


function setLuckyraceStt(stt){
  console.log('setLuckyraceStt : ', stt)
  raceStt = stt;
  if(stt == "1"){
    //console.log("111111", currentTickets.length)
    if(currentTickets.length > 0){
        $("#stt01-1").prop("disabled", false);
    }else{
       // console.log("222222", currentTickets.length)
        $("#stt01-1").prop("disabled", true);
    }
    $('#stt01').show();
    $('#stt02').hide();
    $('#stt03').hide();
  }else if(stt == "2"){
    $('#stt01').hide();
    $('#stt02').show();
    $('#stt03').hide();
  }else if(stt == "3"){  
    $('#stt01').hide();
    $('#stt02').hide();
    $('#stt03').show();
  }
}

function removeLuckyrace(){
  onGameReplay();
  clearInterval(intervalID);
}
async function luckyrace_init(){ 
  $("#stt01").hide(); 
  const isAllowedBj = callIsAllowedBj()
  if(isAllowedBj){
      await  getPresetList_luckyrace()  
      setTimeout(setDiaplay,1000);   
  }else{
    alert("지원하지 않는 기능입니다.")
    $("#stt01-1").prop("disabled", true);
    $("#stt01-1").hide();      
  }
}


function setRemainingTime(_now, _target){
  console.log(_now, _target)
  const now = moment(_now);
  const target = moment(_target);
  const diff = moment.duration(target.diff(now));
  const minutes = String(Math.floor(diff.asSeconds() / 60)).padStart(2, "0");
  const seconds = String(Math.floor(diff.asSeconds() % 60)).padStart(2, "0");
  const diffSec = target.diff(now, "seconds");
  if (diffSec <= 0) {
    //console.log("남은 시간이 0초 이하입니다");
    $("#betStaySec").text(`${'0'}:${'00'}`);  
    return true;
  }
  else{    
    $("#betStaySec").text(`${minutes}:${seconds}`);  
    console.log(`${minutes}:${seconds}`);
    return false;
  }



}


async function setDiaplay(){  


  const result = await getLatest_round(true);
  console.log('result :', result)

  console.log("luckyrace_init", preset_setting_data_luckyrace);
  //console.log("setDiaplay currentTickets", currentTickets);

  //$("#nickName").text(currentTickets[0]?currentTickets[0].nickname+'('+currentTickets[0].loginId+')':'');

  //$("#rexMoney").text(preset_setting_data_luckyrace.luckyRaceOpenRex + '렉스');
  //$("#winningRange").text(preset_setting_data_luckyrace.winningRange + '등');  
  $("#betStaySec").text(preset_setting_data_luckyrace.betStayMinute + ':00'); 

  if(preset_setting_data_luckyrace.isLuckyRaceStt == "off"){  
    alert("게임설정이 비활성화 되어 있습니다.")
    $("#stt01-1").prop("disabled", true);
    $("#stt01-1").hide();    
  }


  
 

  if(result == 'inGame'){
    console.log("진행중!!")
    setLuckyraceStt("2")
    $("#playerList").show();
    intervalID = setInterval(getLatest_round, 1000);
  }else{

    if(preset_setting_data_luckyrace.isLuckyRaceStt == "off"){        
      $("#stt01-1").prop("disabled", true);     
      $("#stt01-1").hide()      
    }else{
      $("#stt01-1").prop("disabled", false);
      $("#stt01-1").show()      
    }

    setLuckyraceStt("1")
    console.log("대기중!!")
  }
  


}

function onShowResult(){
  $(".result-text").show();  
}

function onGameCreate(){
  console.log("onGameCreate");
  start_round();
}

async function callApiRoundCancle() {
  const url = `${g_url}/callback/cancel_round`;
  const param = {
    "uid": memberData.MEMBER_UID,
    "bjId": memberData.MID
  }
  const response = await axios.post(url, param);
  const json = response.data;
  if(json.success){
      return true;
  }else{
      return false;
  }
}


async function onGameCancel(){
  const isRoundCancel = await callApiRoundCancle();
  if(isRoundCancel){
    console.log("onGameCancel")
    $("#betStaySec").text(preset_setting_data_luckyrace.betStayMinute + ':00'); 
    $("#playerList").hide();
    $("#playerList-body").empty();
    currenMembers = [];
    clearInterval(intervalID);
    setLuckyraceStt("1");
  }
}

function onGameReplay(){    
    $("#playerList").hide();
    $("#playerList-body").empty();
    currenMembers = [];
    setLuckyraceStt("1")
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




function appendMembers(arr){
  arr.forEach(function(member) {    
    const isMember = currenMembers.find(m => m.loginId === member.loginId);
    if(isMember == undefined){
        currenMembers.push(member);
        $("#playerList-body").append(createPlayer(member));
    }
  });
}



function createPlayer(pdata){
  const result = $("<div>").addClass("list-alarm-area")
  .append(
    $("<div>").addClass("alarm-box")
    .append(
      $("<div>").append(
        $("<span>").text(pdata.loginId)
      )
    )
    .append(
      $("<div>").append(
        $("<span>").text(pdata.nickname)
      )
    )
    .append(
      $("<div>").append(
        $("<span>").text(Number(pdata.amount).toLocaleString())
      )
    )
    .append(
      $("<div>").append(
        $("<span>").addClass("list-txt-point").text(pdata.optionName)
      )
    )
    .append(
      $("<div>").addClass("result-text").hide().append(
        $("<span>").addClass(pdata.reward==0?"":"list-txt-point").text(pdata.reward==0?"예측 실패":pdata.rank + "등 당첨")
      )
    )
    .append(
      $("<div>").addClass("result-text").hide().append(
        $("<span>").addClass("result-text").addClass(pdata.reward==0?"":"list-txt-point").text(pdata.reward==0?"0": "+"+Number(pdata.reward).toLocaleString())
      )
    )
  )

  return result
} 