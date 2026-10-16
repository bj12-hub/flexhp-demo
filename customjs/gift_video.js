axios.defaults.withCredentials = true;
var current_preset_id;
var current_preset_div;
var current_data;
//var arr_preset_list = [];
var current_preset_type = "v_sponsor"
var prev_font_name;

var videoVolume = document.getElementById('sliderGiftVideoVolume');
var videoVolumeVal = document.getElementById('giftVideoVolume');
var audioVolume = document.getElementById('sliderGiftAudioVolume');
var audioVolumeVal = document.getElementById('giftAudioVolume');
var filterLevel = document.getElementById('sliderSpamFilterLevel');
var filterLevelVal = document.getElementById('spamFilterLevel');
var memberData = null;

// slider 스팸 설정
function fnSpamFilterLevel() {
  if (!filterLevel) return;
  noUiSlider.create(filterLevel, {
    start: 1,
    connect: 'lower',
    step: 1,
    range: {
      'min': 1,
      'max': 3
    }
  });

  filterLevel.noUiSlider.on('update', function (values, handle) {
    filterLevelVal.value = parseInt(values[handle]);
    console.log("filterLevel:", filterLevelVal.value)
    if (current_data) current_data.v_filterLevel = filterLevelVal.value;
    // prev_handle_volume(volVal.value)
  });

  filterLevelVal.addEventListener('change', function () {
    filterLevel.noUiSlider.set(this.value);
  });
}





// slider 영상 볼륨
function fnGiftVideoVolume() {
  if (!videoVolume) return;
  console.log('fnGiftVideoVolume')
  noUiSlider.create(videoVolume, {
    start: 0,
    connect: 'lower',
    step: 1,
    range: {
      'min': 0,
      'max': 100
    }
  });
  videoVolume.noUiSlider.on('update', function (values, handle) {
    videoVolumeVal.value = parseInt(values[handle]);
    // prev_handle_volume(volVal.value)
    if (current_data) current_data.v_videoVolume = videoVolumeVal.value;
    // console.log("videoVolume.value update : ", videoVolumeVal.value)
  });
  videoVolumeVal.addEventListener('change', function () {
    videoVolume.noUiSlider.set(this.value);
    // current_data.v_videoVolume = this.value;
    //console.log("avideoVolumeVal.value change: ", this.value)
  });
}

// slider 음성 볼륨
function fnGiftAudioVolume() {
  if (!audioVolume) return;
  console.log('fnGiftAudioVolume')
  noUiSlider.create(audioVolume, {
    start: 0,
    connect: 'lower',
    step: 1,
    range: {
      'min': 0,
      'max': 100
    }
  });

  audioVolume.noUiSlider.on('update', function (values, handle) {
    audioVolumeVal.value = parseInt(values[handle]);
    if (current_data) current_data.a_audioVolume = audioVolumeVal.value;
    // prev_handle_volume(volVal.value)

  });

  audioVolumeVal.addEventListener('change', function () {
    audioVolume.noUiSlider.set(this.value);
  });
}



var myModal = new bootstrap.Modal(document.getElementById('setupCompleted'), {
  keyboard: false
})

var myModal2 = new bootstrap.Modal(document.getElementById('setupCompleted2'), {
  keyboard: false
})


function init() {


  fnGiftVideoVolume();
  fnSpamFilterLevel()
  setTimeout(fnGiftAudioVolume, 0)
  addEvent();
  $('.preset-list-box').empty();
  setTimeout(getPresetList, 500);



}


function selectPresetBtn(t_div) {
  current_preset_id = t_div.attr('id');
  current_preset_div = t_div;
  localStorage.setItem("preset_id_sponsor", current_preset_id)
  t_div.addClass("selected").siblings().removeClass('selected');
  $('#urlCopy').val(current_preset_div.attr('url'))

  current_data = JSON.parse(current_preset_div.attr('data_list'));
  console.log("selectPresetBtn :", current_data)

  setDisplay(current_data);
}

function reset_setting() {
  var defult_data = createDefaultJson();
  current_preset_div.attr('data_list', defult_data)
  current_data = JSON.parse(current_preset_div.attr('data_list'));
  console.log("current_data~:", current_data, defult_data)
  setDisplay(current_data);
  savePreset(current_preset_div, current_data);
}





function createDefaultJson() {

  var jsonObj = {}

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
  return JSON.stringify(jsonObj)
}

function addEvent() {
  addEventPreset();
  //console.log("goaljs  addEvent ~~~~~~~~~~~~~")


  $("#chAudioGiftYn").on("change", function () {
    current_data.isAudioSponStt = $(this).prop('checked') ? "on" : "off";
    console.log("chAudioGiftYn ~~~~~~~~~~~~~", current_data)
  })


  $("#btn_save").on("click", function () {
    console.log("btn_save~~~~~~~~~~~~~~~~~~~ : ", current_data)
    savePreset(current_preset_div, current_data)
  })

  $("#btn_reset").on("click", function () {
    console.log("btn_reset")
    reset_setting();
  })

  $("#btn_videoplay").on("click", function () {

    // console.log("memberData:", memberData)
    var param = {};
    param.type = "v_sponsor";
    param.id = memberData.MEMBER_UID;
    param.bjid = memberData.MID;
    var data = {}
    data.type = '17';
    data.url = $('#test_video_gift_url').val();
    data.startSec = $('#test_video_min_second').val();
    data.endSec = $('#test_video_max_second').val();
    data.nick = "Flex";
    data.lex = "10";
    data.isPlayAll = 'N';
    param.data = data;
    if (data.url) {
      test_to_server(param);
    }

  });


  $("#btn_audioplay").on("click", function () {
    // console.log("memberData:", memberData)
    var param = {};
    param.type = "v_sponsor";
    param.id = memberData.MEMBER_UID;
    param.bjid = memberData.MID;
    var data = {}
    data.type = '18';
    data.url = $('#test_audio_gift_url').val();
    data.nick = 'Flex';
    data.lex = '10'
    param.data = data;
    if (data.url) {
      test_to_server(param);
    }
  });

  $("#min_video_gift_num").on("change", function () {
    current_data.v_minSponLex = $(this).val();
  })

  $("#min_video_gift_num").on("keyup", function () {
    $(this).val($(this).val().replace(/[^0-9]/g, ""));
  });


  $("#second_video_gift_num").on("change", function () {
    current_data.v_oneSecForLex = $(this).val();
  })

  $("#second_video_gift_num").on("keyup", function () {
    $(this).val($(this).val().replace(/[^0-9]/g, ""));
  });


  $("#max_video_length").on("change", function () {
    current_data.v_maxVideoSec = $(this).val();
  })

  $("#max_video_length").on("keyup", function () {
    $(this).val($(this).val().replace(/[^0-9]/g, ""));
  });




  $("#min_audio_gift_num").on("change", function () {
    current_data.a_minSponLex = $(this).val();
  })
  $("#min_audio_gift_num").on("keyup", function () {
    $(this).val($(this).val().replace(/[^0-9]/g, ""));
  });


  $("#second_audio_gift_num").on("change", function () {
    current_data.a_oneSecForLex = $(this).val();
  })
  $("#second_audio_gift_num").on("keyup", function () {
    $(this).val($(this).val().replace(/[^0-9]/g, ""));
  });


  $("#max_audio_gift_length").on("change", function () {
    current_data.a_maxAudioSec = $(this).val();
  })
  $("#max_audio_gift_length").on("keyup", function () {
    $(this).val($(this).val().replace(/[^0-9]/g, ""));
  });




}


function test_to_server(param) {
  var param = param;

  axios.post(g_url + '/preset/eventaction', param)
    .then(function (response) {
      let json = response.data;
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {

        }
        else {
          alert(json.message);
        }
      }
      else {
        alert(json.message);
      }
    })
    .catch(function (error) {
    })
    .then(function () {
      // always executed
    });
}








var chkVideoGift = document.getElementById('chVideoGiftYn');
var videoTermsPop = new bootstrap.Modal(document.getElementById('videoGiftTerms'), {
  keyboard: false
})

document.querySelector(".switch-video-chk").onclick = function (e) {
  e.preventDefault();

  chkVideoGift.checked == false ? videoTermsPop.show() : chkVideoGift.checked = false;
  // chkVideoGift.checked == false ? '' : chkVideoGift.checked = false;
  // console.log(chkVideoGift.checked)
  if (!chkVideoGift.checked) current_data.isVideoSponStt = "off"
}

function videoGiftConfirm() {
  chkVideoGift.checked = true;
  current_data.isVideoSponStt = "on"
  // console.log(chkVideoGift.checked)
}

function setDisplay(_data) {

  console.log("setDisplay~~~", _data)
  $("#chVideoGiftYn").prop('checked', (_data.isVideoSponStt == "on"));
  $("#min_video_gift_num").val(_data.v_minSponLex);
  $("#second_video_gift_num").val(_data.v_oneSecForLex);
  $("#max_video_length").val(_data.v_maxVideoSec);

  $("#chAutoPlayYn").prop('checked', (_data.v_autoPlay == "on"));
  $("#chAudioGiftYn").prop('checked', (_data.isAudioSponStt == "on"));


  $("#min_audio_gift_num").val(_data.a_minSponLex);
  $("#second_audio_gift_num").val(_data.a_oneSecForLex);
  $("#max_audio_gift_length").val(_data.a_maxAudioSec);
  $("#chAutoPlayAudioYn").prop('checked', (_data.a_autoPlay == "on"));

  videoVolume.noUiSlider.set(parseInt(current_data.v_videoVolume));
  setTimeout(() => {
    audioVolume.noUiSlider.set(parseInt(current_data.a_audioVolume));
  }, 0)

  setTimeout(() => {
    filterLevel.noUiSlider.set(parseInt(current_data.v_filterLevel));
  }, 100)



}











g_login_checking(login_callbackFn);
function login_callbackFn(member) {
  //console.log("login_callbackFn", member )
  init();
  memberData = member;
  if (member.IMG_URL && member.IMG_URL != "") {
    //console.log("~~~~~~~~~~~~", member.IMG_URL)
    $("#user_pic").find("img").attr("src", member.IMG_URL);
  }

  $("#user_name").text(member.NAME);
  $("#user_mid").text("(" + member.MID + ")");
}
