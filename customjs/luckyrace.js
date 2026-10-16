axios.defaults.withCredentials = true;
var current_preset_id;
var current_preset_div;
var current_data;
//var arr_preset_list = [];
var current_preset_type = "luckyrace"
var prev_font_name;

var gameVolume = document.getElementById('sliderGameVolume');

var memberData = null;





// slider 영상 볼륨
function fnGameVolume() {
    var gameVolume = document.getElementById('sliderGameVolume');
    var gameVolumeVal = document.getElementById('gameVolume');

    if (!gameVolume) return;

    noUiSlider.create(gameVolume, {
        start: 0,
        connect: 'lower',
        step: 1,
        range: {
            'min': 0,
            'max': 100
        }
    });

    gameVolume.noUiSlider.on('update', function(values, handle) {
        gameVolumeVal.value = parseInt(values[handle]);
        // prev_handle_volume(volVal.value)
        if (current_data) current_data.gameVolume = gameVolumeVal.value;
    });

    gameVolumeVal.addEventListener('change', function() {
        gameVolume.noUiSlider.set(this.value);
    });
}




var myModal = new bootstrap.Modal(document.getElementById('setupCompleted'), {
  keyboard: false
})



function init() {
  fnGameVolume();
  addEvent();
  $('.preset-list-box').empty();
  const isAllowedBj =  callIsAllowedBj();
  console.log('isAllowedBj:', isAllowedBj)
  if(isAllowedBj){
    setTimeout(getPresetList, 500);
  }else{
    alert("지원하지 않는 기능입니다.")
  }

}


function selectPresetBtn(t_div) {
  current_preset_id = t_div.attr('id');
  current_preset_div = t_div;
  localStorage.setItem("preset_id_sponsor", current_preset_id)
  t_div.addClass("selected").siblings().removeClass('selected');
  $('#urlCopy').val(current_preset_div.attr('url'))
  current_data = JSON.parse(current_preset_div.attr('data_list'));
  //console.log("selectPresetBtn :", current_data)
  setDisplay(current_data);
}


function callIsAllowedBj(){
  // const url = `${g_url}/callback/allowed?bjId=${memberData.MID}&uid=${memberData.MEMBER_UID}`;
  // const response = await axios.get(url);
  // const json = response.data;
  // console.log('isAllowedBj:',  json)
  // if(json.allowed){
  //   return true;      
  // }else{
  //   return false;
  //}
  return true;
}

// function reset_setting() {
//   var defult_data = createDefaultJson();
//   current_preset_div.attr('data_list', defult_data)
//   current_data = JSON.parse(current_preset_div.attr('data_list'));
//   console.log("current_data~:", current_data, defult_data)
//   setDisplay(current_data);
//   savePreset(current_preset_div, current_data);
// }





function createDefaultJson() {

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

function addEvent() {
  addEventPreset();
  //console.log("goaljs  addEvent ~~~~~~~~~~~~~")


  $("#chGameRaceYn").on("change", function () {
    current_data.isLuckyRaceStt = $(this).prop('checked') ? "on" : "off";
    //console.log("isLuckyRaceStt ~~~~~~~~~~~~~", current_data)
  })


  $("#btn_save").on("click", function () {
   //W console.log("btn_save~~~~~~~~~~~~~~~~~~~ : ", current_data)
    savePreset(current_preset_div, current_data)
  })  
  // $("#btn_reset").on("click", function () {
  //   console.log("btn_reset")
  //   reset_setting();
  // })


  $("input[name=radioGameType]").on("input", function () {
    current_data.gameType = $(this).val();    
  });


  $("#lucky_race_open_rex").on("change", function () {
    current_data.luckyRaceOpenRex = $(this).val();
  })

  $("#lucky_race_open_rex").on("keyup", function () {
    $(this).val($(this).val().replace(/[^0-9]/g, ""));
  });


  $("input[name=radioEndTime]").on("input", function () {
    current_data.betStayMinute = $(this).val();    
  });

  $("input[name=radioWinningRange]").on("input", function () {
    current_data.winningRange = $(this).val();    
  });

  $("input[name=trackType]").on("input", function () {
    current_data.trackType = $(this).val();    
  });
}





function setDisplay(_data) {

  console.log("setDisplay~~~", _data)
  $("#chGameRaceYn").prop('checked', (_data.isLuckyRaceStt == "on"));

  $("input[name=radioGameType][value=" + _data.gameType + "]").prop(
    "checked",
    true
  );
  if(_data.luckyRaceOpenRex)$("#lucky_race_open_rex").val(_data.luckyRaceOpenRex);

  $("input[name=radioEndTime][value=" + _data.betStayMinute + "]").prop(
    "checked",
    true
  );

  $("input[name=radioWinningRange][value=" + _data.winningRange + "]").prop(
    "checked",
    true
  );

  setTimeout(() => {
    gameVolume.noUiSlider.set(parseInt(current_data.gameVolume));
  }, 0);

  $("input[name=trackType][value=" + _data.trackType + "]").prop(
    "checked",
    true
  );
}











g_login_checking(login_callbackFn);
function login_callbackFn(member) {
  //console.log("login_callbackFn", member )  
  memberData = member;
  if (member.IMG_URL && member.IMG_URL != "") {
    //console.log("~~~~~~~~~~~~", member.IMG_URL)
    $("#user_pic").find("img").attr("src", member.IMG_URL);
  }
  $("#user_name").text(member.NAME);
  $("#user_mid").text("(" + member.MID + ")");
  init();
}
