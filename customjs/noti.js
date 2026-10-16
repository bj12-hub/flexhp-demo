axios.defaults.withCredentials = true;
var current_preset_id;
var current_preset_div;
var current_data;
//var arr_preset_list = [];
var current_preset_type = "info";
var prev_font_name;

var slide_popup_visible_time;
//var slide_chat_input_time;
var slide_noti_sound_volume;
var slide_voice_play_speed;

var bgm_sound;
var my_timeout_id_parent;
var my_timeout_id;

var my_nick = "플렉스티비";
var flex_num = 100;
var eff_sound;
var voice_sound;
var prevBgmUrl = null;

var bgmidnum = 0;
var actorList = [];
var current_delete_selete_obj = null;

var myModal = new bootstrap.Modal(document.getElementById("setupCompleted"), {
  keyboard: false,
});

function init_sound() {
  buzz.defaults.preload = "auto";
  eff_sound = new buzz.sound("../sounds/zap-zip-up3-high.mp3");
  eff_sound.load();
}

function play_eff_sound() {
  if (eff_sound) eff_sound.stop();
  eff_sound.setVolume(current_data.noti_sound_volume);
  // eff_sound.setSpeed(current_data.noti_voice_speed); // x2
  eff_sound.stop();
  eff_sound.play();
}

function play_bgm_sound(obj) {
  if (!obj) return;
  if (voice_sound) voice_sound.stop();
  voice_sound = new buzz.sound(obj.bgmurl);
  voice_sound.setVolume(obj.volume);
  voice_sound.stop();
  voice_sound.play();
}

function play_voice_sound(msg) {
  var limitStr = parseInt(current_data.voice_limit_txtnum);
  if (limitStr) {
    msg = msg.substring(0, limitStr);
  }

  if (voice_sound) voice_sound.stop();
  voice_sound = new buzz.sound(g_url_tts + msg);
  voice_sound.stop();
  voice_sound.setVolume(current_data.noti_sound_volume);
  voice_sound.setSpeed(current_data.noti_voice_speed);
  voice_sound.play();
}

function init() {
  $(".chat-list").empty();
  if (localStorage.getItem("preset_id_info") == null) {
  } else {
    current_preset_id = localStorage.getItem("preset_id_info");
  }

  set_slide_popup_visible_time_init();
  // set_slide_chat_input_time_init();
  set_slide_noti_sound_volume_init();
  set_slide_voice_play_speed_init();

  addEvent();
  $(".preset-list-box").empty();
  setTimeout(getPresetList, 100);
  init_sound();
  fnBgmSoundVolume();

  getActorlist();
}

function get_replace_str_to_array(_str, _nick, _flex) {
  var result_arr = [];
  var st1 = _str.replace("{닉네임}", "@^!#nick").replace("{개수}", "@^!#num");
  var st2 = st1.split("@^!");

  for (var i = 0; i < st2.length; i++) {
    var txt = st2[i];
    if (txt.search("#nick") != -1) {
      var tt1 = txt.split("#nick");
      result_arr.push(_nick);
      if (tt1[1] != "") result_arr.push(tt1[1]);
    } else if (txt.search("#num") != -1) {
      var tt2 = txt.split("#num");
      result_arr.push(_flex);
      if (tt2[1] != "") result_arr.push(tt2[1]);
    } else {
      if (txt != "") result_arr.push(txt);
    }
  }
  return result_arr;
}

function selectPresetBtn(t_div) {
  current_preset_id = t_div.attr("id");
  current_preset_div = t_div;
  localStorage.setItem("preset_id_info", current_preset_id);
  t_div.addClass("selected").siblings().removeClass("selected");
  $("#urlCopy").val(current_preset_div.attr("url"));

  //console.log("selectPresetBtn :" , current_preset_div.attr('data_list'))
  current_data = JSON.parse(current_preset_div.attr("data_list"));
  //console.log("current_data :", current_data)
  setDisplay(current_data);
}

function removeBgmData() {
  if (current_data && current_data.title_bgm_objs) {
    current_data.title_bgm_objs.forEach((element) => {
      if (element.bgmData && element.bgmData.key) {
        //console.log(element.bgmData.key)
        deleteBgmFile(element.bgmData.key);
      }

      if (element.imgData && element.imgData.key) {
        // console.log(element.imgData.key)
        deleteBgmFile(element.imgData.key);
      }
    });
  }
}

function reset_setting() {
  //console.log("current_data :", current_data)
  removeBgmData();

  var defult_data = createDefaultJson();
  current_preset_div.attr("data_list", defult_data);
  current_data = JSON.parse(current_preset_div.attr("data_list"));
  setDisplay(current_data);

  savePreset(current_preset_div, current_data);
}

function set_slide_popup_visible_time_init() {
  slide_popup_visible_time = document.getElementById(
    "slide_popup_visible_time",
  );
  var spVal02 = document.getElementById("slide_popup_visible_time_val");

  noUiSlider.create(slide_popup_visible_time, {
    start: 1,
    connect: "lower",
    step: 1,
    range: {
      min: 0,
      max: 100,
    },
  });

  slide_popup_visible_time.noUiSlider.on("update", function (values, handle) {
    spVal02.value = parseInt(values[handle]);
    //$('.goal-box').css('height', spVal02.value + 'px');
    if (current_data) current_data.pop_visible_time = spVal02.value;
  });
}

// function set_slide_chat_input_time_init() {
//     slide_chat_input_time = document.getElementById('slide_chat_input_time');
//     var spVal02 = document.getElementById('slide_chat_input_time_val');

//     noUiSlider.create(slide_chat_input_time, {
//         start: 1,
//         connect: 'lower',
//         step: 1,
//         range: {
//             'min': 0,
//             'max': 30
//         }
//     });

//     slide_chat_input_time.noUiSlider.on('update', function (values, handle) {
//         spVal02.value = parseInt(values[handle]);

//         if(current_data)current_data.chat_input_time = spVal02.value;
//     });
// }

function set_slide_noti_sound_volume_init() {
  slide_noti_sound_volume = document.getElementById("slide_noti_sound_volume");
  var spVal02 = document.getElementById("slide_noti_sound_volume_val");

  noUiSlider.create(slide_noti_sound_volume, {
    start: 1,
    connect: "lower",
    step: 1,
    range: {
      min: 0,
      max: 100,
    },
  });

  slide_noti_sound_volume.noUiSlider.on("update", function (values, handle) {
    spVal02.value = parseInt(values[handle]);

    if (current_data) current_data.noti_sound_volume = spVal02.value;
  });
}

function set_slide_voice_play_speed_init() {
  slide_voice_play_speed = document.getElementById("slide_voice_play_speed");
  var spVal02 = document.getElementById("slide_voice_play_speed_val");

  noUiSlider.create(slide_voice_play_speed, {
    start: 1,
    connect: "lower",
    step: 1,
    range: {
      min: 1,
      max: 40,
    },
  });

  slide_voice_play_speed.noUiSlider.on("update", function (values, handle) {
    var val = parseInt(values[handle]);
    spVal02.value = Number(val * 0.1).toFixed(1);
    if (current_data) current_data.noti_voice_speed = spVal02.value;
  });
}

function createDefaultJson() {
  var jsonObj = {};

  jsonObj.isRouletteAvailable = "on";
  jsonObj.win_transparency = 0;

  jsonObj.layout_type = "type_1";
  jsonObj.text_align = "가운데";

  jsonObj.gift_type = "일반";

  jsonObj.gift_number_start = "1";
  jsonObj.gift_number_end = "";

  jsonObj.noti_text = "{닉네임}님 플렉스{개수}개 감사합니다.";
  jsonObj.noti_type = "알림음성";

  jsonObj.is_chat_voice = "on";

  jsonObj.text_fade_type = "flash";
  jsonObj.text_fade_dir = "역방향";

  jsonObj.pop_fade_in_type = "tada";
  jsonObj.pop_fade_out_type = "pulse";

  jsonObj.pop_visible_time = "10";
  jsonObj.chat_input_time = "6";

  //0~100
  jsonObj.noti_sound_volume = "50";
  //0.1~4
  jsonObj.noti_voice_speed = "1";

  jsonObj.voice_select = "여성";

  jsonObj.voice_limit_txtnum = "300";

  jsonObj.is_delete_special_text = "off";

  jsonObj.noti_font_color = "#20c9b0";
  jsonObj.noti_nick_color = "#d89816";
  jsonObj.noti_number_color = "#93ff47";

  jsonObj.font_name = "ff-01";
  jsonObj.font_bold = "off";
  jsonObj.font_size = 16;
  jsonObj.font_outline = 2;
  jsonObj.font_outline_color = "#000000";

  // 정렬 순서
  jsonObj.bgmtSort = "add";
  jsonObj.title_bgm_objs = [];

  //console.log("createDefaultJson:", JSON.stringify(jsonObj))

  return JSON.stringify(jsonObj);
}

function set_prev_text_align(_dir) {
  if ($(".noti").hasClass("text-left")) $(".noti").removeClass("text-left");
  if ($(".noti").hasClass("text-center")) $(".noti").removeClass("text-center");
  if ($(".noti").hasClass("text-right")) $(".noti").removeClass("text-right");

  if (_dir == "왼쪽") {
    $(".noti").addClass("text-left");
  } else if (_dir == "가운데") {
    $(".noti").addClass("text-center");
  } else if (_dir == "오른쪽") {
    $(".noti").addClass("text-right");
  }
}

function addEvent() {
  addEventPreset();
  //console.log("goaljs  addEvent ~~~~~~~~~~~~~")

  $("#rouletteYn").on("change", function () {
    current_data.isRouletteAvailable = $(this).prop("checked") ? "on" : "off";
    //console.log("current_data: ", current_data)
  });

  $("input[name=txtAlign]").on("input", function () {
    current_data.text_align = $(this).val();
    set_prev_text_align(current_data.text_align);
  });

  $("#input_txt_gift_start").on("keyup", function () {
    $(this).val(
      $(this)
        .val()
        .replace(/[^0-9]/g, ""),
    );
  });

  $("#input_txt_gift_start").on("change", function () {
    current_data.gift_number_start = parseInt($(this).val());
  });

  $("#input_txt_gift_end").on("keyup", function () {
    $(this).val(
      $(this)
        .val()
        .replace(/[^0-9]/g, ""),
    );
  });

  $("#input_txt_gift_end").on("change", function () {
    var val = $(this).val();
    if (val == "") {
      current_data.gift_number_end = "";
      $("#input_txt_gift_end").attr("placeholder", "마지막");
    } else {
      current_data.gift_number_end = parseInt(val);
    }
  });

  $("#notiTxtArea1").on("change", function () {
    current_data.noti_text = $(this).val();
  });

  $("input[name=notiSys]").on("input", function () {
    current_data.noti_type = $(this).val();
    // console.log("ssssssssss  current_data.noti_type",  current_data.noti_type)
  });

  $("#chVoiceYn").on("change", function () {
    current_data.is_chat_voice = $(this).prop("checked") ? "on" : "off";
  });

  $("#wordEffect").on("change", function () {
    current_data.text_fade_type = $(this).val();

    $("#smaple_txt_n1").removeClass();
    $("#smaple_txt_n1").addClass(
      "animated  " + current_data.text_fade_type + " infinite item-delay-1s",
    );
    $("#smaple_txt_n2").removeClass();
    $("#smaple_txt_n3").addClass(
      "animated  " + current_data.text_fade_type + " infinite item-delay-1s",
    );
    $("#smaple_txt_n3").removeClass();
    $("#smaple_txt_n3").addClass(
      "animated  " + current_data.text_fade_type + " infinite item-delay-1s",
    );
    $("#smaple_txt_f1").removeClass();
    $("#smaple_txt_f1").addClass(
      "animated  " + current_data.text_fade_type + " infinite item-delay-1s",
    );
    $("#smaple_txt_f2").removeClass();
    $("#smaple_txt_f2").addClass(
      "animated  " + current_data.text_fade_type + " infinite item-delay-1s",
    );
    $("#smaple_txt_f3").removeClass();
    $("#smaple_txt_f3").addClass(
      "animated  " + current_data.text_fade_type + " infinite item-delay-1s",
    );
  });

  $("#wordEffect_dir").on("change", function () {
    current_data.text_fade_dir = $(this).val();
    // console.log("wordEffect_dir :",  current_data.text_fade_dir)
    sample_text_eff_dir(current_data.text_fade_dir);
  });

  $("#popupEffectStart").on("change", function () {
    current_data.pop_fade_in_type = $(this).val();
    $("#noti_smaple_pop").removeClass();
    $("#noti_smaple_pop").addClass(
      "animated  " + current_data.pop_fade_in_type + " infinite item-delay-1s",
    );
  });

  $("#popupEffectEnd").on("change", function () {
    current_data.pop_fade_out_type = $(this).val();
    $("#noti_smaple_pop").removeClass();
    $("#noti_smaple_pop").addClass(
      "animated  " + current_data.pop_fade_out_type + " infinite item-delay-1s",
    );
  });

  $("input[name=voice_type]").on("input", function () {
    current_data.voice_select = $(this).val();
  });

  $("#wordDel").on("change", function () {
    current_data.is_delete_special_text = $(this).prop("checked")
      ? "on"
      : "off";
  });

  $("#btn_save").on("click", function () {
    // console.log("btn_save : ", current_data)

    savePreset(current_preset_div, current_data);
    // setDisplay(current_data)
  });

  $("#btn_reset").on("click", function () {
    // console.log("btn_reset")
    reset_setting();
  });

  $("#input_text_voice_limit_txtnum").on("keyup", function () {
    $(this).val(
      $(this)
        .val()
        .replace(/[^0-9]/g, ""),
    );
  });

  $("#input_text_voice_limit_txtnum").on("change", function () {
    current_data.voice_limit_txtnum = $(this).val();
  });

  $("#val_flex").on("keyup", function () {
    $(this).val(
      $(this)
        .val()
        .replace(/[^0-9]/g, ""),
    );
  });
  ///////////////////////////////////////////////////
  $("#btn_flex").on("click", function () {
    // console.log("btn_flex")

    var numOfFlex = $("#val_flex").val();
    flex_num = parseInt(numOfFlex);

    if (flex_num < parseInt(current_data.gift_number_start)) {
      // console.log("금액이 작다")
      return;
    }

    if (current_data.gift_number_end == "") {
    } else {
      if (flex_num > parseInt(current_data.gift_number_end)) {
        // console.log("금액이 크다")
        return;
      }
    }

    show_noti_popup();
    //pushNoti_image("플렉스티비", "님께서 "+ numOfFlex + "개를 선물하셨습니다." );

    testmessage_to_server("4", flex_num);
  });

  $("#btn_recommend").on("click", function () {
    // console.log("btn_recommend ")
    // pushNoti("플랙스티비", "님께서 추천하셨습니다." )
    testmessage_to_server("3", "");
  });

  $("#btn_win_reset").on("click", function () {
    // console.log("btn_win_reset")
    //서버로 알린다.
    testmessage_to_server("2", "");
  });

  $("#btn_win_reload").on("click", function () {
    testmessage_to_server("1", "");
    //서버로 알린다.
  });

  $("#btn_open_pop").on("click", function () {
    var url = $("#urlCopy").val();
    // console.log("btn_open_pop url", url);
    openWin(url, "플렉스", 500, 500);
  });

  // 정렬 순서
  $("input[name=bgmtSort]").on("input", function () {
    const bgmsort = $(this).val();
    current_data.bgmtSort = bgmsort;
    setDisplayBGM(bgmsort, current_data.title_bgm_objs || []);
  });
}

function testmessage_to_server(_type, _msg) {
  var param = {};
  param.type = "info";
  param.data = {};
  param.data.type = _type;
  param.data.msg = _msg;
  param.data.mid = "test";
  param.data.level = "v";
  param.data.nick = "플렉스티비";
  $(".spinner-border").css("display", "block");
  axios
    .post(g_url + "/preset/testmessage", param)
    .then(function (response) {
      let json = response.data;
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
          //  console.log("서버로 성공적으로 보냄")
          $(".spinner-border").css("display", "none");
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

function sample_text_eff_dir(dir) {
  if (dir == "정방향") {
    for (var i = 0; i < 3; i++) {
      // console.log("~~~~^^^^", $("#smaple_txt_n" + (i+1)))
      $("#smaple_txt_n" + (i + 1)).css("animation-delay", i * 0.1 + "s");
      $("#smaple_txt_f" + (i + 1)).css("animation-delay", i * 0.1 + "s");

      // console.log("~~~~^^^^2222", $("#smaple_txt_n" + (i+1)))
    }
  } else if (dir == "역방향") {
    for (var i = 0; i < 3; i++) {
      $("#smaple_txt_n" + (i + 1)).css("animation-delay", (3 - i) * 0.1 + "s");
      $("#smaple_txt_f" + (i + 1)).css("animation-delay", (3 - i) * 0.1 + "s");
    }
  } else if (dir == "랜덤") {
    for (var i = 0; i < 3; i++) {
      var ran = Math.floor(Math.random() * 3 + 1);
      $("#smaple_txt_n" + (i + 1)).css("animation-delay", ran * 0.1 + "s");
      $("#smaple_txt_f" + (i + 1)).css("animation-delay", ran * 0.1 + "s");
    }
  }
}

function setDisplay(_data) {
  // console.log("setDisplay~~", _data);

  const bgmListBox = document.querySelector(".bgm-list-area");
  while (bgmListBox.hasChildNodes()) {
    //  console.log("bgmListBox :", bgmListBox)
    bgmListBox.removeChild(bgmListBox.firstChild);
  }

  var chatOpt = document.getElementById("sliderChatOpacity");
  chatOpt.noUiSlider.set(_data.win_transparency);
  prev_set_transparency(_data.win_transparency);

  $("#rouletteYn").prop("checked", _data.isRouletteAvailable == "on");

  $("input[name=txtAlign][value=" + _data.text_align + "]").prop(
    "checked",
    true,
  );
  set_prev_text_align(_data.text_align);

  $("#input_txt_gift_start").val(_data.gift_number_start);
  $("#input_txt_gift_end").val(_data.gift_number_end);

  if (_data.gift_number_end == "") {
    $("#input_txt_gift_end").attr("placeholder", "마지막");
  }

  // 재화변경에따른 데이터 변경
  if (needsCurrencyConversion(_data.noti_text)) {
    const noti_text = replaceCurrencyInNotiText(_data.noti_text);
    $("#notiTxtArea1").val(noti_text);
    current_data.noti_text = noti_text;
  } else {
    $("#notiTxtArea1").val(_data.noti_text);
  }

  $("input[name=notiSys][value=" + _data.noti_type + "]").prop("checked", true);

  // $("input[name=notiSys][value="+_data.noti_type+"]").prop("checked", true);

  $("#chVoiceYn").prop("checked", _data.is_chat_voice == "on");

  $("#wordEffect").val(_data.text_fade_type);

  $("#wordEffect_dir").val(_data.text_fade_dir);

  sample_text_eff_dir(_data.text_fade_dir);

  $("#popupEffectStart").val(_data.pop_fade_in_type);

  $("#popupEffectEnd").val(_data.pop_fade_out_type);

  slide_popup_visible_time.noUiSlider.set(_data.pop_visible_time);
  // slide_chat_input_time.noUiSlider.set(_data.chat_input_time);
  slide_noti_sound_volume.noUiSlider.set(_data.noti_sound_volume);
  slide_voice_play_speed.noUiSlider.set(
    parseFloat(_data.noti_voice_speed) * 10,
  );

  $("input[name=voice_type][value=" + _data.voice_select + "]").prop(
    "checked",
    true,
  );
  $("#input_text_voice_limit_txtnum").val(_data.voice_limit_txtnum);

  $("#wordDel").prop("checked", _data.is_delete_special_text == "on");

  setTextColor($("#colorPicker_font_color"), _data.noti_font_color);
  setTextColor($("#colorPicker_nick_color"), _data.noti_nick_color);
  setTextColor($("#colorPicker_number_color"), _data.noti_number_color);

  //////////////////////폰트//////////////////////////////////////
  var ff_str = get_font_str_from_value(_data.font_name);
  $(".btn-select").html(ff_str);
  $(".btn-select").attr("value", _data.font_name);
  pre_set_chat_font(_data.font_name);

  var isFontBold = _data.font_bold == "on";
  $("#fontBold").prop("checked", isFontBold);
  if (isFontBold) {
    $(".goal-bar-area").addClass("font-weight-bold");
    $(".font-preview").addClass("font-preview-bold");
  } else {
    $(".goal-bar-area").removeClass("font-weight-bold");
    $(".font-preview").removeClass("font-preview-bold");
  }

  var sliderFontSize = document.getElementById("sliderFontSize");
  sliderFontSize.noUiSlider.set(_data.font_size);
  pre_set_chat_font_size(_data.font_size);

  var sliderFontBorder = document.getElementById("sliderFontBorder");
  sliderFontBorder.noUiSlider.set(_data.font_outline);

  //console.log("_data.font_outline_color :~~~", _data.font_outline_color)
  $("#fontStrokeColor").val(_data.font_outline_color);
  $("#fontStrokeColor").spectrum({
    color: _data.font_outline_color,
    showInput: true,
    showAlpha: false,
    className: "color-picker",
    showInitial: true,
    preferredFormat: "hex",
    chooseText: "선택",
    cancelText: "취소",
    change: function () {
      fontStroke();
      prev_chat_fontStroke();
      if (current_data) {
        current_data.font_outline_color = $("#fontStrokeColor").val();
      }
    },
  });
  fontStroke();
  prev_chat_fontStroke();

  show_noti_popup();
  //var str_test = get_replace_str_to_array(current_data.noti_text , my_nick, flex_num);
  // pushNotiPop("../images/img_gift_100.png", str_test,  "안녕하세요 채팅메시지 입니다.", parseInt(current_data.pop_visible_time)*1000 );

  $(".word").css("color", current_data.noti_font_color);
  $(".word_nick").css("color", current_data.noti_nick_color);
  $(".word_flex").css("color", current_data.noti_number_color);

  $("#smaple_txt_n1").removeClass();
  $("#smaple_txt_n1").addClass(
    "animated  " + current_data.text_fade_type + " infinite item-delay-1s",
  );
  $("#smaple_txt_n2").removeClass();
  $("#smaple_txt_n2").addClass(
    "animated  " + current_data.text_fade_type + " infinite item-delay-1s",
  );
  $("#smaple_txt_n3").removeClass();
  $("#smaple_txt_n3").addClass(
    "animated  " + current_data.text_fade_type + " infinite item-delay-1s",
  );
  $("#smaple_txt_f1").removeClass();
  $("#smaple_txt_f1").addClass(
    "animated  " + current_data.text_fade_type + " infinite item-delay-1s",
  );
  $("#smaple_txt_f2").removeClass();
  $("#smaple_txt_f2").addClass(
    "animated  " + current_data.text_fade_type + " infinite item-delay-1s",
  );
  $("#smaple_txt_f3").removeClass();
  $("#smaple_txt_f3").addClass(
    "animated  " + current_data.text_fade_type + " infinite item-delay-1s",
  );

  $("#noti_smaple_pop").removeClass();
  $("#noti_smaple_pop").addClass(
    "animated  " + current_data.pop_fade_in_type + " infinite item-delay-1s",
  );

  $(".spinner-border").css("display", "none");

  // bgm 설정 /////////////////////////////////
  // btm sort
  const bgmsort = _data.bgmtSort || "add";
  $("input[name=bgmtSort][value=" + bgmsort + "]").prop("checked", true);

  // bgm list

  setDisplayBGM(bgmsort, current_data.title_bgm_objs);
  /*   bgmidnum = 0;
    var bgmObj = current_data.title_bgm_objs || [];
    // lex 크기별 정렬
    if( bgmsort !== 'add'){
      bgmObj = bgmObj.sort(
        function(a, b) {
          return a.startlex - b.startlex;
        }
      );
    }

    if (bgmObj) {
      bgmObj.forEach((element, index) => {
        // console.log("index :", index)
        element.idx = index + 1;
        addNewSetup(element);
      });
    } */
}

function setDisplayBGM(bgmtSort, bgmObj) {
  $(".bgm-list-area").empty();
  // bgm list
  bgmidnum = 0;
  // lex 크기별 정렬
  let newBgmObj = bgmObj;

  newBgmObj = bgmObj.sort(function (a, b) {
    if (bgmtSort === "add") {
      return a.idx - b.idx;
    } else if (bgmtSort === "lex-desc") {
      return b.startlex - a.startlex;
    } else {
      return a.startlex - b.startlex;
    }
  });

  if (newBgmObj) {
    newBgmObj.forEach((element, index) => {
      // console.log("index :", index)
      //element.idx = index + 1;
      addNewSetup(element);
    });
  }
}

////////////////////////////////////////////////////////////////////핸들
function prev_handle_transparency(_temp) {
  if (current_data) current_data.win_transparency = _temp;
  _temp = 100 - _temp;
  var t_val = _temp * 0.01;
  $(".chat-list-area").css("opacity", t_val);
}

function pre_handle_chat_font(_className) {
  if (current_data) current_data.font_name = _className;

  $(".chat-list-area").removeClass(prev_font_name);
  $(".font-preview").removeClass(prev_font_name);

  $(".chat-list-area").addClass(_className);
  $(".font-preview").addClass(_className);

  prev_font_name = _className;
}

function pre_handle_chat_font_bold(_flag) {
  if (current_data) {
    if (_flag) {
      current_data.font_bold = "on";
      $(".chat-list-area").addClass("font-weight-bold");
    } else {
      current_data.font_bold = "off";
      $(".chat-list-area").removeClass("font-weight-bold");
    }
  }
}

function pre_handle_chat_font_size() {
  var fontSize = $("#fontSizeVal").val();
  if (current_data) {
    current_data.font_size = fontSize;
    prev_chat_fontStroke();
  }
}

function pre_handle_chat_font_outline() {
  var fontborderVal = $("#fontBorderVal").val();
  if (current_data) {
    current_data.font_outline = fontborderVal;
    prev_chat_fontStroke();
  }
}

function setTextColor(_target, _color) {
  _target.val(_color);
  _target.spectrum({
    color: _color,
    showInput: true,
    showAlpha: false,
    className: "color-picker",
    showInitial: true,
    preferredFormat: "hex",
    chooseText: "선택",
    cancelText: "취소",
    change: function (e) {
      // console.log(" $(this) :",  $(this), e);
      switch ($(this).attr("id")) {
        case "colorPicker_font_color":
          current_data.noti_font_color = $(this).val();
          $(".word").css("color", current_data.noti_font_color);

          break;
        case "colorPicker_nick_color":
          current_data.noti_nick_color = $(this).val();
          // console.log("dddd", $(".word_nick"), current_data.noti_nick_color)
          $(".word_nick").css("color", current_data.noti_nick_color);

          break;
        case "colorPicker_number_color":
          current_data.noti_number_color = $(this).val();
          $(".word_flex").css("color", current_data.noti_number_color);
          break;
      }
    },
    // move: function(color){
    //     console.log('background-color~~~',color.toHex8String());
    // }
  });
}

function pushNotiPop(_img_src, _arr_str, _chat_msg, _duration) {
  //console.log("pushNotiPop", _img_src, _arr_str, _chat_msg, _duration);

  // if(current_data.gift_number_start)

  var txt_align_class;
  if (current_data.text_align == "왼쪽") {
    txt_align_class = "text-left";
  } else if (current_data.text_align == "가운데") {
    txt_align_class = "text-center";
  } else if (current_data.text_align == "오른쪽") {
    txt_align_class = "text-right";
  }

  //console.log("ssss:, txt_align_class~~~~~~~~~~~~~~~~~~~~", txt_align_class, current_data.pop_fade_in_type)
  $(".chat-list").empty();
  var noti = $("<div>").addClass("noti").addClass(txt_align_class);

  var noti_img = $("<div>")
    .addClass("noti-img")
    .append($("<img>").attr("src", _img_src).attr("alt", "level"));

  var noti_txt = $("<div>").addClass("noti-txt");
  var arr_txt_ani_nick = [];
  var arr_txt_ani_flex = [];
  for (var i = 0; i < _arr_str.length; i++) {
    var txt;
    var str = _arr_str[i];

    if (str == my_nick) {
      txt = $("<p>")
        .addClass("word ani-1")
        .addClass("word_nick")
        .css("color", current_data.noti_nick_color);

      for (var j = 0; j < str.length; j++) {
        var char = str.charAt(j);

        var t_span = $("<span>").text(char);
        arr_txt_ani_nick.push(t_span);
        txt.append(t_span);
      }
      noti_txt.append(txt);
    } else if (str == numberWithCommas(flex_num)) {
      txt = $("<p>")
        .addClass("word ani-2")
        .addClass("word_flex")
        .css("color", current_data.noti_number_color);

      for (var j = 0; j < str.length; j++) {
        var char = str.charAt(j);

        var t_span = $("<span>").text(char);
        arr_txt_ani_flex.push(t_span);
        txt.append(t_span);
      }
      noti_txt.append(txt);
    } else {
      txt = $("<p>")
        .addClass("word")
        .text(str)
        .css("color", current_data.noti_font_color);
      noti_txt.append(txt);
    }
  }

  // console.log("arr_txt_ani_nick.length  !",  arr_txt_ani_nick.length)

  for (var ii = 0; ii < arr_txt_ani_nick.length; ii++) {
    var node = arr_txt_ani_nick[ii];
    //console.log("wwww:", ii)

    var delray_num;

    if (current_data.text_fade_dir == "정방향") {
      delray_num = ii;
    } else if (current_data.text_fade_dir == "역방향") {
      delray_num = arr_txt_ani_nick.length - (ii + 1);
    } else if (current_data.text_fade_dir == "랜덤") {
      delray_num = Math.floor(Math.random() * arr_txt_ani_nick.length);
    }

    set_txt_ani(node, delray_num * 0.1);
  }
  for (var jj = 0; jj < arr_txt_ani_flex.length; jj++) {
    var node = arr_txt_ani_flex[jj];

    var delray_num;

    if (current_data.text_fade_dir == "정방향") {
      delray_num = jj;
    } else if (current_data.text_fade_dir == "역방향") {
      delray_num = arr_txt_ani_nick.length - (jj + 1);
    } else if (current_data.text_fade_dir == "랜덤") {
      delray_num = Math.floor(Math.random() * arr_txt_ani_nick.length);
    }

    set_txt_ani(node, delray_num * 0.1);
  }

  var noti_txt_chat = $("<div>").append(
    $("<p>")
      .addClass("word")
      .text(_chat_msg)
      .css("color", current_data.noti_font_color),
  );
  noti.append(noti_img);
  noti.append(noti_txt);
  noti.append(noti_txt_chat);
  $(".chat-list").append(noti);
  animateCSS(".chat-list", current_data.pop_fade_in_type, function () {
    // console.log("RRRRRRRRRRRRRRRRR~");
  });

  if (my_timeout_id_parent) clearTimeout(my_timeout_id_parent);
  my_timeout_id_parent = setTimeout(function () {
    animateCSS(".chat-list", current_data.pop_fade_out_type, function () {
      $(".chat-list").empty();
      if (my_timeout_id) clearTimeout(my_timeout_id);
      // my_timeout_id =  setTimeout(show_noti_popup, 3000)

      //    console.log("FFFFFFFFFFFFFFF~");
    });
  }, _duration);
}

function getBgmObj(arr_bgm, t_lex) {
  var resultObj = null;
  if (arr_bgm) {
    for (var i = arr_bgm.length - 1; i >= 0; i--) {
      // console.log("element111:", t_lex, i)
      var t_obj = arr_bgm[i];
      if (
        parseInt(t_obj.startlex) <= t_lex &&
        parseInt(t_obj.endlex) >= t_lex &&
        t_obj.bgmData &&
        t_obj.bgmData.url
      ) {
        resultObj = {};
        resultObj.bgmurl = t_obj.bgmData ? t_obj.bgmData.url : null;
        resultObj.imgurl = t_obj.imgData ? t_obj.imgData.url : null;
        resultObj.volume = t_obj.bgmData
          ? parseInt(t_obj.bgmData.volume)
          : null;
        resultObj.bgmId = Math.floor(Math.random() * 1000) + 1;

        // console.log("element222:", t_obj, t_lex);
        break;
      }
    }
  }
  return resultObj;
}

function show_noti_popup() {
  if (current_data.noti_type == "알림음") {
    play_eff_sound();
  } else if (current_data.noti_type == "알림음성") {
    var voice_str = current_data.noti_text
      .replace("{닉네임}", my_nick)
      .replace("{개수}", numberWithCommas(flex_num));
    var str_text = get_replace_str_to_array(
      current_data.noti_text,
      my_nick,
      numberWithCommas(flex_num),
    );

    if (!current_data.title_bgm_objs) current_data.title_bgm_objs = [];
    var bgmObj = getBgmObj(current_data.title_bgm_objs, flex_num);
    if (bgmObj) {
      // show_noti_popup(data.nick, flex_num, data.url, data.mid, bgmObj);
      pushNotiPop(
        bgmObj.imgurl ? bgmObj.imgurl : "../images/img_gift_100.png",
        str_text,
        "",
        parseInt(current_data.pop_visible_time) * 1000,
      );
      play_bgm_sound(bgmObj);
    } else {
      // show_noti_popup(data.nick, flex_num, data.url, data.mid);
      if (current_data.is_chat_voice == "on") {
        play_voice_sound(voice_str + "안녕하세요 채팅메시지 입니다.");
      } else {
        play_voice_sound(voice_str);
      }

      pushNotiPop(
        "../images/img_gift_100.png",
        str_text,
        "안녕하세요 채팅메시지 입니다.",
        parseInt(current_data.pop_visible_time) * 1000,
      );
    }
  }
}

function set_txt_ani(node, delay) {
  //console.log("node :", node, delay)
  node
    .addClass("animated " + current_data.text_fade_type)
    .addClass("infinite item-delay-1s")
    .css("animation-delay", delay + "s");
}

function animateCSS(element, animationName, callback) {
  const node = document.querySelector(element);
  node.classList.add("animated", animationName);

  function handleAnimationEnd() {
    node.classList.remove("animated", animationName);
    node.removeEventListener("animationend", handleAnimationEnd);

    if (typeof callback === "function") callback();
  }

  node.addEventListener("animationend", handleAnimationEnd);
}

////////////////////////////////////////////////////////////////////셋팅
//font Stroke
function prev_chat_fontStroke() {
  // get form values
  //var fontFamily = $('#fontFamily').val();
  //var fontColor = $('#fontColorPicker').val();

  var strokeSize = $("#fontBorderVal").val();
  strokeColor = $("#fontStrokeColor").val();
  fontSize = $("#fontSizeVal").val();
  // update css
  //var $prev_chat = $(".gift-list-area");

  $(".chat-list-area").css("font-size", fontSize + "px");
  $(".chat-list-area").css("text-shadow", "");

  //console.log("prev_chat_fontStroke~~~~~~~~~~~~: ", $prev_chat, strokeSize, strokeColor, fontSize )

  for (var angle = 0; angle < 2 * Math.PI; angle += 1 / strokeSize) {
    appendShadow(
      $(".chat-list-area"),
      Math.cos(angle) * strokeSize,
      Math.sin(angle) * strokeSize,
      strokeColor,
    );
  }
}

function pre_set_chat_font_size(_size) {
  //console.log("pre_set_chat_font_size", _size)
  $(".chat-list-area").css("font-size", fontSize + "px");
}

function pre_set_chat_font_bold(_toggle) {
  if (_toggle == "on") {
    $("chat-list-area").addClass("font-weight-bold");
    $(".font-preview").addClass("font-preview-bold");
  } else {
    $(".chat-list-area").removeClass("font-weight-bold");
    $(".font-preview").removeClass("font-preview-bold");
  }
}

function pre_set_chat_font(_className) {
  $(".chat-list-area").addClass(_className);
  $(".font-preview").addClass(_className);
  prev_font_name = _className;
}

function prev_set_transparency(_temp) {
  //console.log("prev_set_transparency", _temp );
  _temp = 100 - _temp;
  var t_val = _temp * 0.01;
  $(".chat-list-area").css("opacity", t_val);
}

g_login_checking(login_callbackFn);
function login_callbackFn(member) {
  //console.log("login_callbackFn", member )
  init();
  if (member.IMG_URL && member.IMG_URL != "") {
    //console.log("~~~~~~~~~~~~@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@", member.IMG_URL)
    $("#user_pic").find("img").attr("src", member.IMG_URL);
  }

  $("#user_name").text(member.NAME);
  $("#user_mid").text("(" + member.MID + ")");
}

function fnBgmSoundVolume() {
  var soundVolume = document.getElementById("sliderBgmSoundVolume1");
  var soundVolumeVal = document.getElementById("bgmSoundVolume1");

  if (!soundVolume) return;

  noUiSlider.create(soundVolume, {
    start: 50,
    connect: "lower",
    step: 1,
    range: {
      min: 0,
      max: 100,
    },
  });

  soundVolume.noUiSlider.on("update", function (values, handle) {
    soundVolumeVal.value = parseInt(values[handle]);
  });

  soundVolumeVal.addEventListener("change", function () {
    soundVolume.noUiSlider.set(this.value);
  });
}

function showTab(tabId) {
  var tabs = document.querySelectorAll(".setup-box");
  var tabBtns = document.querySelectorAll(".section-tit");

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

// 드롭다운 토글 contents
function toggleDropdown(btn) {
  var setupItem = btn.closest(".setup-item");
  var itemContents = setupItem.nextElementSibling;

  if (btn.classList.contains("on")) {
    closeDropdown(btn, itemContents);
  } else {
    closeAllDropdowns();
    openDropdown(btn, itemContents);
  }
}

function openDropdown(_btn, _contents) {
  _btn.classList.add("on");
  _btn.innerHTML = "<i></i>닫힘";
  _contents.classList.add("open");
}

function closeDropdown(_btn, _contents) {
  _btn.classList.remove("on");
  _btn.innerHTML = "<i></i>펼침";
  _contents.classList.remove("open");
}

// 모든 드롭다운 닫기
function closeAllDropdowns() {
  var dropBtns = document.querySelectorAll(".btn-bgm-dropdown");
  var dropConts = document.querySelectorAll(".bgm-dropdown-content");

  dropBtns.forEach(function (btn) {
    closeDropdown(btn, btn.closest(".setup-item").nextElementSibling);
  });

  dropConts.forEach(function (content) {
    content.classList.remove("open");
  });
}

// 리스트 삭제
var bgmDeleteList = null;
function bgmDeletePopup(target) {
  var bgmDeletePop = new bootstrap.Modal(
    document.getElementById("titleBgmDeletePopup"),
    {
      keyboard: false,
    },
  );
  bgmDeletePop.show();
  bgmDeleteList = target.closest(".title-bgm");
  // console.log("bgmDeleteList :", bgmDeleteList.bgmidnum, "bgmDeleteList:", bgmDeleteList.getAttribute("bgmidnum"))
}

function onBgmListDelete() {
  //console.log("current_data.title_bgm_objs 1:", current_data.title_bgm_objs)
  if (bgmDeleteList) {
    current_data.title_bgm_objs.forEach((element, index) => {
      // console.log("element:",element.idx, bgmDeleteList.getAttribute("bgmidnum"))
      if (element.idx == bgmDeleteList.getAttribute("bgmidnum")) {
        var deletBgmObj = current_data.title_bgm_objs.splice(index, 1)[0];
        if (deletBgmObj.bgmData) deleteBgmFile(deletBgmObj.bgmData.key);
        setTimeout(function () {
          if (deletBgmObj.imgData) deleteBgmFile(deletBgmObj.imgData.key);
        }, 100);

        //  console.log("deletBgmObj :", deletBgmObj)
      }
    });
    bgmDeleteList.remove();

    savePreset(current_preset_div, current_data, true);
    //console.log("current_data.title_bgm_objs 2:", current_data.title_bgm_objs)
    alert("BGM리스트가 삭제되었습니다.");
  }
}

//설정 추가
const maxBgmCount = 300;
function addNewSetup(t_obj = null) {
  if (!t_obj) {
    t_obj = {};
    //console.log(current_data.title_bgm_objs[current_data.title_bgm_objs.length-1])

    t_obj.title = "";
    t_obj.startlex = "";
    t_obj.endlex = "";
    t_obj.bgmData = null;
    t_obj.imgData = null;
    t_obj.isTTSVoice = false;

    if (current_data.title_bgm_objs && current_data.title_bgm_objs.length > 0) {
      let maxIndex = 0;
      (current_data.title_bgm_objs || []).forEach(function (obj) {
        maxIndex = Math.max(maxIndex, obj.idx);
      });

      t_obj.idx = maxIndex + 1;
    } else {
      t_obj.idx = 1;
    }
    if (!current_data.title_bgm_objs) current_data.title_bgm_objs = [];
    current_data.title_bgm_objs.push(t_obj);
    savePreset(current_preset_div, current_data, true);
  }

  if (!t_obj.isTTSVoice) t_obj.isTTSVoice = false;

  const bgmListBox = document.querySelector(".bgm-list-area");
  let bgmLastId = 0;
  let bgmCount = bgmListBox.children.length;

  if (bgmCount > 0) {
    if (bgmCount <= 9) {
      bgmLastId = bgmListBox.lastElementChild.id.slice(-1);
    } else if (bgmCount <= 99) {
      bgmLastId = bgmListBox.lastElementChild.id.slice(-2);
    } else {
      bgmLastId = bgmListBox.lastElementChild.id.slice(-3);
    }
    /* bgmLastId =
      bgmCount <= 9
        ? bgmListBox.lastElementChild.id.slice(-1)
        : bgmListBox.lastElementChild.id.slice(-2); */
    //console.log(bgmLastId, bgmCount <= 9 ? 1111 : 222);

    if (bgmCount === maxBgmCount) {
      alert("설정은 최대 " + maxBgmCount + "개까지 가능합니다.");
      return false;
    }
  }

  var newSetupItemBox = document.createElement("div");
  newSetupItemBox.className = "setup-item-box title-bgm";
  // bgmidnum++;
  bgmidnum = t_obj.idx;
  newSetupItemBox.setAttribute("bgmidnum", bgmidnum);
  // 새로운 ID 설정
  var formFieldId = Number(bgmLastId) + 1;
  var newSetupItemId = "bgmList" + formFieldId;
  newSetupItemBox.id = newSetupItemId;

  htmlTagInner = `
        <div class="setup-item-list">
            <p class="setup-txt">TITLE ${bgmCount + 1}</p>
            <div class="setup-item">
                <div class="input">
                    <input type="text" id="inputBgmReadTitle${formFieldId}" class="form-control w-25 text-center d-inline-block" value="${
                      t_obj.title
                    }" readonly="readonly">
                    <span class="text-white mr-2 ml-2">후원 렉스</span>
                    <input type="text" id="inputBgmReadLex_start${formFieldId}" class="form-control w-5 text-right d-inline-block" value="${numberWithCommas(
                      t_obj.startlex,
                    )}" readonly="readonly"> <span class="text-white mr-2">LEX 부터</span>
                    <input type="text" id="inputBgmReadLex_end${formFieldId}" class="form-control w-5 text-right d-inline-block" value="${numberWithCommas(
                      t_obj.endlex,
                    )}" readonly="readonly"> <span class="text-white">LEX 까지</span>
                </div>

                <div class="button">
                    <button type="button" class="btn btn-bgm-dropdown on" onclick="toggleDropdown(this)"><i></i>닫힘</button>
                    <button type="button" class="btn btn-bgm-delete ml-2"  data-bs-toggle="modal" data-bs-target="#titleBgmDeletePopup" onclick="bgmDeletePopup(this)"><i>&times;</i>삭제</button>
                </div>
            </div>

            <div class="bgm-dropdown-content open">

                <div class="drop-item">
                    <div class="drop-tit">TITLE</div>
                    <div class="drop-conts">
                        <input type="text" id="inputBgmTitle${formFieldId}" class="form-control w-50 d-inline-block" placeholder="제목 입력" value="${
                          t_obj.title
                        }">
                    </div>
                </div>

                <div class="drop-item">
                    <div class="drop-tit">후원 렉스</div>
                    <div class="drop-conts">
                        <input type="text" id="inputBgmLex_start${formFieldId}" class="form-control w-20 text-right" value="${numberWithCommas(
                          t_obj.startlex,
                        )}"><span class="text-white ml-1 mr-2">LEX 부터</span>
                        <input type="text" id="inputBgmLex_end${formFieldId}" class="form-control w-20 text-right" value="${numberWithCommas(
                          t_obj.endlex,
                        )}"> <span class="text-white ml-1">LEX 까지</span>
                        <p class="text-danger w-100 font-weight-bold mt-1" id="textLexDanger${formFieldId}"  style="display:block">&#33;후원 마지막 개수는 시작 개수와 같거나 큰 값이어야 합니다.</p>
                        <div class="drop-txt">
                            (*필수) 단일 개수 설정 시 시작 개수와 마지막 수를 동일하게 입력해주세요.<br>예 : [1000]개부터 [1000]개까지
                        </div>
                    </div>
                </div>

                <div class="drop-item">
                    <div class="drop-tit">사운드</div>
                    <div class="drop-conts" style="align-items:flex-start">
                        <div class="file-box">
                            <label for="inputFileBgmSound${formFieldId}">파일선택</label>
                            <input type="text" id="inputFileBgmSoundName${formFieldId}"   value ="${
                              t_obj.bgmData ? t_obj.bgmData.name : ""
                            }"  readonly="readonly" onclick="onClickTextToFile(this)">
                            <input type="file" id="s_inputFileBgmSound${formFieldId}"  accept=".mp3, .mp4, .wav">
                        </div>

                        <span class="file-delete"  id="bgmDelete${formFieldId}"  data-bs-toggle="modal" data-bs-target="#bgmDeleteFilePopup"><button type="button" class="btn"><i>&times;</i>파일 삭제</button></span>
                        <p class="text-danger w-100 font-weight-bold mt-1" id="textSoundDanger${formFieldId}" style="display:block">&#33; 사운드 파일을 업로드해주세요.</p>

                        <div class="drop-txt">
                            (*필수) 3MB 이하 mp3, wav 파일만 가능합니다. 사운드 사용 시 저작권에 유의해주세요.
                        </div>

                        <div class="file-sound-play">
                            <div class="play-btn">
                                <span class="play"><button type="button" class="btn" id="bgmSoundPlay${formFieldId}" ><img src="../images/ico_sound_play.png" alt="play"></button></span>
                                <span class="time" id="bgmSoundTime${formFieldId}"></span>
                            </div>
                            <div class="play-volume">
                                <div id="sliderBgmSoundVolume${formFieldId}" class="slider-item"></div>
                                <div class="slider-value">
                                    <input id="bgmSoundVolume${formFieldId}" class="input-num" readonly><span class="input-unit"></span>
                                </div>
                            </div>
                            <span class="ico-sound"><img src="../images/ico_speaker.svg" alt="play"></span>
                        </div>
                    </div>
                </div>

                <div class="drop-item">
                    <div class="drop-tit">이미지</div>
                    <div class="drop-conts">
                        <div class="file-thum">
                            <div class="thum" id="fileImageThum${formFieldId}"></div>
                        </div>
                        <div class="file-box">
                            <label for="inputFileBgmImage${formFieldId}">파일선택</label>
                            <input type="text" id="inputFileBgmImageName${formFieldId}"  value ="${
                              t_obj.imgData ? t_obj.imgData.name : ""
                            }"  readonly="readonly" onclick="onClickTextToFile(this)">
                            <input type="file" id="i_inputFileBgmImage${formFieldId}" accept=".png, .gif, .jpg" value="" >
                        </div>
                        <span class="file-delete" id="bgmImageDelete${formFieldId}"  data-bs-toggle="modal" data-bs-target="#bgmDeleteFilePopup"><button type="button" class="btn"><i>&times;</i>파일 삭제</button></span>

                        <div class="file-images-checkbox">
                            <div class="drop-txt">
                                8MB 이하 png, jpg, gif 파일만 가능합니다.이미지 권장 사이즈 (300x200 픽셀)<br>
                                *이미지 미등록시 플렉스 기본이미지 사용
                            </div>
                        </div>
                    </div>
                </div>

                <div class="drop-item">
                    <div class="drop-tit">채팅음성</div>
                    <div class="drop-conts">
                        <div class="chk-switch-box">
                            <input type="checkbox" id="chVoiceYn${formFieldId}" name="chVoiceYn${formFieldId}" class="switch-input">
                            <label for="chVoiceYn${formFieldId}" class="switch-label">
                                <span class="marble"></span>
                                <span class="on">ON</span>
                                <span class="off">OFF</span>
                            </label>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    `;

  //다른 드롭다운 닫고 태그 추가
  closeAllDropdowns();
  newSetupItemBox.innerHTML = htmlTagInner;
  bgmListBox.appendChild(newSetupItemBox);

  t_obj.checkBgm = function () {
    checkSoundValue();
  };

  // 슬라이더 생성
  newSliderItem(formFieldId, t_obj);

  var chVoiceYn = document.getElementById("chVoiceYn" + formFieldId);
  chVoiceYn.checked = t_obj.isTTSVoice;
  chVoiceYn.onchange = function (e) {
    console.log("chVoiceYn", chVoiceYn.checked);
    t_obj.isTTSVoice = chVoiceYn.checked;
  };

  var textLexDanger = document.getElementById("textLexDanger" + formFieldId);
  var textSoundDanger = document.getElementById(
    "textSoundDanger" + formFieldId,
  );

  var imgThum = document.getElementById("fileImageThum" + formFieldId);

  var inputFileBgmImageName = document.getElementById(
    "inputFileBgmImageName" + formFieldId,
  );

  var inputFileBgmImage = document.getElementById(
    "i_inputFileBgmImage" + formFieldId,
  );
  inputFileBgmImage.onchange = function (e) {
    addFileImage(inputFileBgmImage, t_obj.idx, inputFileBgmImageName);
  };

  var bgmImageDelete = document.getElementById("bgmImageDelete" + formFieldId);
  bgmImageDelete.onclick = function (e) {
    bgmDeleteFilePopup(bgmImageDelete, t_obj, inputFileBgmImageName);
  };

  var inputFileBgmSoundName = document.getElementById(
    "inputFileBgmSoundName" + formFieldId,
  );
  var inputFileBgmSound = document.getElementById(
    "s_inputFileBgmSound" + formFieldId,
  );
  inputFileBgmSound.onchange = function (e) {
    //console.log("1111:", t_obj)
    addFileSound(
      inputFileBgmSound,
      t_obj.idx,
      inputFileBgmSoundName,
      function () {
        //  console.log("2222:", t_obj)
        checkSoundValue();
      },
    );
  };

  var inputBgmReadTitle = document.getElementById(
    "inputBgmReadTitle" + formFieldId,
  );
  var inputBgmReadLex_start = document.getElementById(
    "inputBgmReadLex_start" + formFieldId,
  );
  var inputBgmReadLex_end = document.getElementById(
    "inputBgmReadLex_end" + formFieldId,
  );

  var bgmDelete = document.getElementById("bgmDelete" + formFieldId);
  bgmDelete.onclick = function (e) {
    bgmDeleteFilePopup(bgmDelete, t_obj, inputFileBgmSoundName);
  };

  var soundTime = document.getElementById("bgmSoundTime" + formFieldId);
  soundTime.innerHTML = "00:00";

  var bgmSoundPlay = document.getElementById("bgmSoundPlay" + formFieldId);
  bgmSoundPlay.onclick = function () {
    playBgm(
      t_obj.bgmData ? t_obj.bgmData.url : "",
      soundTime,
      t_obj.bgmData ? t_obj.bgmData.volume : 80,
    );
  };

  if (t_obj.bgmData) setBgm(t_obj.bgmData.url, soundTime);
  if (t_obj.imgData) setImg(t_obj.imgData.url, imgThum);

  var bgmTitle = document.getElementById("inputBgmTitle" + formFieldId);
  bgmTitle.oninput = function (e) {
    t_obj.title = e.target.value;
    inputBgmReadTitle.value = t_obj.title;
  };

  var bgmStartLex = document.getElementById("inputBgmLex_start" + formFieldId);
  bgmStartLex.oninput = function (e) {
    //console.log("startlex",e.target.value, e.type)
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
    let num = parseInt(e.target.value);
    if (isNaN(num)) {
      num = 0;
    }
    t_obj.startlex = num;
    e.target.value = numberWithCommas(num);
    inputBgmReadLex_start.value = e.target.value;
    checkLexValue();
  };

  var bgmEndLex = document.getElementById("inputBgmLex_end" + formFieldId);
  bgmEndLex.oninput = function (e) {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
    let num = parseInt(e.target.value);
    if (isNaN(num)) {
      num = 0;
    }
    t_obj.endlex = num;
    e.target.value = numberWithCommas(num);
    inputBgmReadLex_end.value = e.target.value;
    checkLexValue();
  };

  function checkSoundValue() {
    if (t_obj.bgmData) {
      textSoundDanger.setAttribute("style", "display:none");
    } else {
      textSoundDanger.setAttribute("style", "display:block");
    }
  }
  checkSoundValue();

  function checkLexValue() {
    var isStartVal = false;
    var isEndVal = false;
    if (t_obj.startlex && t_obj.startlex > 0) {
      isStartVal = true;
    } else {
      isStartVal = false;
    }

    if (t_obj.endlex && t_obj.endlex > 0) {
      isEndVal = true;
    } else {
      isEndVal = false;
    }

    if (isStartVal && isEndVal && t_obj.startlex <= t_obj.endlex) {
      textLexDanger.setAttribute("style", "display:none");
    } else {
      textLexDanger.setAttribute("style", "display:block");
    }
  }
  checkLexValue();
}

function setBgm(url, soundTime) {
  if (url) {
    var bgmSound = new buzz.sound(url);
    bgmSound.bind("loadeddata", function () {
      soundTime.innerHTML = buzz.toTimer(bgmSound.getDuration());
      // console.log("timer2:", buzz.toTimer(bgmSound.getDuration()) )
    });
  }
}

function playBgm(url, soundTime, volume) {
  //console.log("playBgm:", url)

  if (url && prevBgmUrl != url) {
    if (bgm_sound) bgm_sound.stop();
    bgm_sound = new buzz.sound(url);
    bgm_sound.loop = false;
    bgm_sound.setVolume(volume);
    bgm_sound.bind("timeupdate", function () {
      var timer = buzz.toTimer(bgm_sound.getDuration() - bgm_sound.getTime());
      //console.log("timer:", timer)
      soundTime.innerHTML = timer;
    });
  }
  if (url) bgm_sound.togglePlay();
  prevBgmUrl = url;
}

// 슬라이더 생성
function newSliderItem(num, t_obj) {
  var startVolume = 80;
  // console.log("t_obj:", t_obj)
  if (t_obj.bgmData) {
    startVolume = t_obj.bgmData.volume;
  }
  var slider = document.getElementById("sliderBgmSoundVolume" + num);
  var sliderVal = document.getElementById("bgmSoundVolume" + num);

  noUiSlider.create(slider, {
    start: startVolume,
    step: 1,
    connect: "lower",
    range: {
      min: 0,
      max: 100,
    },
  });

  slider.noUiSlider.on("update", function (values, handle) {
    sliderVal.value = parseInt(values[handle]);
    if (bgm_sound) {
      bgm_sound.setVolume(sliderVal.value);
    }
    if (t_obj.bgmData) {
      t_obj.bgmData.volume = sliderVal.value;
    }
  });

  sliderVal.addEventListener("change", function () {
    slider.noUiSlider.set(this.value);
  });
}

function deleteBgmFile(key) {
  //console.log("deleteBgmFile :", key)
  axios
    .post(g_url + "/upload/bgmfiledelete", { key: key })
    .then(function (response) {
      let json = response.data;
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
          console.log("json :", json);
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

function uploadBgmImage(file, t_bgmObj, txtName) {
  //console.log("current_data.title_bgm_objs111: ", current_data.title_bgm_objs)
  // console.log("uploadBgmSound1: ", file)
  const formData = new FormData();
  formData.append("upfile", file);
  axios
    .post(g_url + "/upload/bgmimageupload2", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then(function (response) {
      let json = response.data;
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
          // console.log("uploadBgmSound2: ", json.resultMap.data)
          t_bgmObj.imgData = json.resultMap.data;
          txtName.value = t_bgmObj.imgData.name;

          savePreset(current_preset_div, current_data, true);
          // console.log("current_data.title_bgm_objs222: ", current_data.title_bgm_objs)
        } else {
          alert(json.message);
        }
      } else {
        alert(json.message);
      }
    })
    .catch(function (error) {});
}

function uploadBgmSound(file, t_bgmObj, txtName, fn = null) {
  // console.log("current_data.title_bgm_objs111: ", current_data.title_bgm_objs)
  // console.log("uploadBgmSound1: ", file)
  const formData = new FormData();
  formData.append("upfile", file);
  axios
    .post(g_url + "/upload/bgmsoundupload2", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then(function (response) {
      let json = response.data;
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
          // console.log("uploadBgmSound2: ", json.resultMap.data)
          t_bgmObj.bgmData = json.resultMap.data;
          t_bgmObj.bgmData.volume = 80;
          txtName.value = t_bgmObj.bgmData.name;

          fn();
          savePreset(current_preset_div, current_data, true);
          // console.log("current_data.title_bgm_objs222: ", current_data.title_bgm_objs)
        } else {
          alert(json.message);
        }
      } else {
        alert(json.message);
      }
    })
    .catch(function (error) {});
}

// 사운드 추가
function addFileSound(soundFile, idx, txtName, fn = null) {
  // console.log("t_obj:", idx)
  var t_bgmObj = null;
  current_data.title_bgm_objs.forEach((element) => {
    //console.log("element :", element);
    if (element.idx == idx) {
      t_bgmObj = element;
    }
  });

  //  var soundFile = document.getElementById(id);
  if (soundFile.files[0]) {
    if (!addFileCheck(soundFile, ["mp3", "mp4", "wav"], 3 * 1024 * 1024)) {
      soundFile.value = "";
    } else {
      if (t_bgmObj.bgmData && t_bgmObj.bgmData.key) {
        deleteBgmFile(t_bgmObj.bgmData.key);
      }
      uploadBgmSound(soundFile.files[0], t_bgmObj, txtName, fn);
    }
  } else {
    soundFile.value = "";
  }
  // console.log('addFileSound:', soundFile, "soundFile.files[0] :", soundFile.files[0], "soundFile.value :", soundFile.value )
}

// 이미지 추가
function addFileImage(imageFile, idx, txtName) {
  var t_imgObj = null;
  current_data.title_bgm_objs.forEach((element) => {
    //console.log("element :", element);
    if (element.idx == idx) {
      t_imgObj = element;
    }
  });

  if (imageFile.files[0]) {
    if (!addFileCheck(imageFile, ["jpg", "png", "gif"], 8 * 1024 * 1024)) {
      imageFile.value = "";
    } else {
      if (t_imgObj.imgData && t_imgObj.imgData.key) {
        deleteBgmFile(t_imgObj.imgData.key);
      }

      addFileImageThum(imageFile);
      uploadBgmImage(imageFile.files[0], t_imgObj, txtName);
    }
  } else {
    imageFile.value = "";
  }
}

// 파일 추가 시 확장자, 파일크기 확인
function addFileCheck(file, extension, maxSize) {
  var fileName = file.files[0].name;
  var fileSize = file.files[0].size;

  if (fileName !== "") {
    var ext = fileName.slice(fileName.lastIndexOf(".") + 1).toLowerCase();

    if (extension.includes(ext)) {
      if (fileSize > maxSize) {
        alert("파일의 최대 용량을 초과하였습니다.");
        file.value = "";
        return false;
      }
      console.log("파일 추가:", ext);
    } else {
      alert("추가 가능한 파일이 아닙니다. 다시 확인하여 주십시오.");
      file.value = "";
      return false;
    }
  } else {
    return false;
  }
  return true;
}

//이미지 추가 시 썸네일 생성
function addFileImageThum(fileTarget) {
  const fileImgParent = fileTarget.parentNode;
  const thumBox = fileImgParent.previousElementSibling.children;
  let thumImg = document.getElementById(thumBox[0].id + "-add");
  // let thumImgSrc = '';

  if (thumImg) thumImg.remove();

  var reader = new FileReader();
  reader.onload = function (e) {
    var img = document.createElement("img");
    img.setAttribute("src", e.target.result);
    img.setAttribute("id", thumBox[0].id + "-add");
    // thumImgSrc = e.target.result;
    thumBox[0].appendChild(img);
    // console.log('reader : ', e , thumBox[0].id)
  };

  reader.readAsDataURL(fileTarget.files[0]);
}

function setImg(url, imgThum) {
  if (url) {
    var img = document.createElement("img");
    img.setAttribute("src", url);
    img.setAttribute("id", imgThum.id + "-add");
    imgThum.appendChild(img);
    // console.log(" imgThum.id:",  imgThum.id)
  }
}

// input 파일 삭제
var bgmDeleteFile = null;
var m_inputFileBgmSoundName = null;

// 파일 삭제 확인 팝업 표시
function bgmDeleteFilePopup(btn, t_obj, inputFileBgmSoundName) {
  const inputElement = btn.previousElementSibling.lastElementChild;
  bgmDeleteFile = inputElement.id;

  var arrDelStr = bgmDeleteFile.split("_");
  if (arrDelStr[0] == "s") {
    if (t_obj.bgmData) {
      modalId = "bgmDeleteFilePopup";
    } else {
      modalId = "bgmDeleteFileNonePopup";
    }
  } else if (arrDelStr[0] == "i") {
    if (t_obj.imgData) {
      modalId = "bgmDeleteFilePopup";
    } else {
      modalId = "bgmDeleteFileNonePopup";
    }
  }
  //const modalId = inputElement.files[0] ? 'bgmDeleteFilePopup' : 'bgmDeleteFileNonePopup';

  const modal = new bootstrap.Modal(document.getElementById(modalId), {
    keyboard: false,
  });
  modal.show();

  current_delete_selete_obj = t_obj;
  m_inputFileBgmSoundName = inputFileBgmSoundName;
}

// 파일 삭제
function onDeleteFile(delFile) {
  const target = document.getElementById(delFile);

  // var fileType = null;
  if (target.files[0]) {
    fileType = target.files[0].type;
  }

  var arrDelStr = delFile.split("_");
  // console.log("arrDelStr:", arrDelStr)

  if (arrDelStr[0] == "s") {
    deleteBgmFile(current_delete_selete_obj.bgmData.key);
    current_delete_selete_obj.bgmData = null;
    current_delete_selete_obj.checkBgm();

    savePreset(current_preset_div, current_data, true);
  } else if (arrDelStr[0] == "i") {
    deleteBgmFile(current_delete_selete_obj.imgData.key);
    current_delete_selete_obj.imgData = null;

    savePreset(current_preset_div, current_data, true);

    var fileParent = target.parentNode;
    var fileThum = fileParent.previousElementSibling.children;
    var fileThumImg = document.getElementById(fileThum[0].id + "-add");

    if (fileThumImg) fileThumImg.remove();
  }

  m_inputFileBgmSoundName.value = "";

  //console.log("onDeleteFile aaaaaaaaaaaaaaaa:",  current_data.title_bgm_objs);
  // 이미지일때 썸네일도 삭제
  //    if(fileType && fileType.indexOf('image') !== -1) {
  //         var fileParent = target.parentNode;
  //         var fileThum = fileParent.previousElementSibling.children;
  //         var fileThumImg = document.getElementById(fileThum[0].id + '-add');

  //         if(fileThumImg) fileThumImg.remove();
  //    }

  target.value = "";
  alert("파일이 삭제되었습니다.");
}

//only 전자녀
// function onClickTts(id) {
//     console.log(id)
//     var getEl = document.querySelector('.item-tts.pause');
//     var getId = document.getElementById(id);
//     // console.log(getId, getEl);
//     if(id == 'tts01')
//     {
//       var voice_str = current_data.noti_text.replace("{닉네임}", my_nick ).replace("{개수}", numberWithCommas(flex_num) );
//       console.log(id)
//       play_voice_sound(voice_str )
//     }

//     if( getId == getEl) {
//         getEl.classList.remove('pause');
//     } else {
//         if( getEl !== null ) {
//             getEl.classList.remove('pause');
//         }
//         getId.classList.add('pause');
//     }
// }

async function getTtsUrl(a_id, text) {
  var result = "";
  var params = {
    actorId: a_id,
    text: text,
  };
  try {
    const res = await axios.post(g_url_tts_base_url + "/voice/speak", params);
    let json = res.data;
    if (json.returnCode == 1) {
      if (json.resultMap.returnVal == 1) {
        // console.log("getTtsUrl1:", json)
        result = json.resultMap.data.audio_download_url;
      } else {
      }
    } else {
    }
  } catch (error) {
    //  triggerToast('Something went wrong!', 'danger');
    console.log(error);
  }

  // console.log("getTtsUrl2: result", result)
  return result;
}

function createTTScharacterBtn(actorList) {
  var baseTTs = {
    name: { ko: "전자녀" },
    actorId: null,
  };
  actorList.unshift(baseTTs);

  actorList.forEach(function (item, index) {
    var idNum = index + 2;
    var _id = null;
    var _name = item.name.ko;
    var actorId = item.actor_id;

    if (idNum < 10) {
      _id = "tts0" + idNum;
    } else {
      _id = "tts" + idNum;
    }

    //console.log("createTTScharacterBtn id :", _id, 'name:', _name, 'actorId:', actorId )

    var ttsBtn = $("<span>")
      .addClass("item-tts")
      .attr("id", _id)
      .append(
        $("<button>")
          .addClass("btn")
          .attr("type", "button")
          .text(_name)
          .append($("<i>").addClass("ico-tts")),
      );

    ttsBtn.on("click", async function () {
      var voice_str = current_data.noti_text
        .replace("{닉네임}", my_nick)
        .replace("{개수}", numberWithCommas(flex_num));
      if (actorId) {
        try {
          let ttsUrl = await getTtsUrl(actorId, voice_str);
          if (ttsUrl) {
            voice_sound = new buzz.sound(ttsUrl);
            voice_sound.setVolume(current_data.noti_sound_volume);
            voice_sound.setSpeed(current_data.noti_voice_speed);
            voice_sound.stop();
            voice_sound.loop = false;
            voice_sound.play();
          }
        } catch (error) {
          console.log(error);
        }
      } else {
        play_voice_sound(voice_str);
      }
    });

    $("#ttsbtns").append(ttsBtn);
  });
}

function getActorlist() {
  axios
    .get(g_url_tts_base_url + "/voice/getactorlist")
    .then(function (response) {
      actorList = response.data.resultMap.data;
      if (actorList == "" || actorList == null) {
        actorList = [];
      }

      //console.log("getActorlist :", actorList)
      createTTScharacterBtn(actorList);
    })
    .catch(function (error) {})
    .then(function () {
      // always executed
    });
}
