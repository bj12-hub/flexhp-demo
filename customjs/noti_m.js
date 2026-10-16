axios.defaults.withCredentials = true;
var current_preset_id;
var current_preset_div;
var current_data;
//var arr_preset_list = [];
var current_preset_type = "info_m";
var prev_font_name;

var slide_popup_visible_time;
//var slide_chat_input_time;
var slide_noti_sound_volume;
var slide_voice_play_speed;

var my_timeout_id_parent;
var my_timeout_id;

var my_nick = "플랙스티비";
var flex_num = 100;
var eff_sound;
var voice_sound;

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
  setDisplay(current_data);
}

function reset_setting() {
  var defult_data = createDefaultJson();

  // console.log("reset_setting", defult_data);

  current_preset_div.attr("data_list", defult_data);
  current_data = JSON.parse(current_preset_div.attr("data_list"));
  setDisplay(current_data);
  savePreset(current_preset_div, current_data);
}

function set_slide_popup_visible_time_init() {
  slide_popup_visible_time = document.getElementById(
    "slide_popup_visible_time"
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

  jsonObj.pop_visible_time = "28";
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

  $("input[name=txtAlign]").on("input", function () {
    current_data.text_align = $(this).val();
    set_prev_text_align(current_data.text_align);
  });

  $("#input_txt_gift_start").on("keyup", function () {
    $(this).val(
      $(this)
        .val()
        .replace(/[^0-9]/g, "")
    );
  });

  $("#input_txt_gift_start").on("change", function () {
    current_data.gift_number_start = parseInt($(this).val());
  });

  $("#input_txt_gift_end").on("keyup", function () {
    $(this).val(
      $(this)
        .val()
        .replace(/[^0-9]/g, "")
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
      "animated  " + current_data.text_fade_type + " infinite item-delay-1s"
    );
    $("#smaple_txt_n2").removeClass();
    $("#smaple_txt_n3").addClass(
      "animated  " + current_data.text_fade_type + " infinite item-delay-1s"
    );
    $("#smaple_txt_n3").removeClass();
    $("#smaple_txt_n3").addClass(
      "animated  " + current_data.text_fade_type + " infinite item-delay-1s"
    );
    $("#smaple_txt_f1").removeClass();
    $("#smaple_txt_f1").addClass(
      "animated  " + current_data.text_fade_type + " infinite item-delay-1s"
    );
    $("#smaple_txt_f2").removeClass();
    $("#smaple_txt_f2").addClass(
      "animated  " + current_data.text_fade_type + " infinite item-delay-1s"
    );
    $("#smaple_txt_f3").removeClass();
    $("#smaple_txt_f3").addClass(
      "animated  " + current_data.text_fade_type + " infinite item-delay-1s"
    );
  });

  $("#wordEffect_dir").on("change", function () {
    current_data.text_fade_dir = $(this).val();
    //console.log("wordEffect_dir :",  current_data.text_fade_dir)
    sample_text_eff_dir(current_data.text_fade_dir);
  });

  $("#popupEffectStart").on("change", function () {
    current_data.pop_fade_in_type = $(this).val();
    $("#noti_smaple_pop").removeClass();
    $("#noti_smaple_pop").addClass(
      "animated  " + current_data.pop_fade_in_type + " infinite item-delay-1s"
    );
  });

  $("#popupEffectEnd").on("change", function () {
    current_data.pop_fade_out_type = $(this).val();
    $("#noti_smaple_pop").removeClass();
    $("#noti_smaple_pop").addClass(
      "animated  " + current_data.pop_fade_out_type + " infinite item-delay-1s"
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
    //console.log("btn_save : ", current_data)
    savePreset(current_preset_div, current_data);
  });

  $("#btn_reset").on("click", function () {
    // console.log("btn_reset")
    reset_setting();
  });

  $("#input_text_voice_limit_txtnum").on("keyup", function () {
    $(this).val(
      $(this)
        .val()
        .replace(/[^0-9]/g, "")
    );
  });

  $("#input_text_voice_limit_txtnum").on("change", function () {
    current_data.voice_limit_txtnum = $(this).val();
  });

  $("#val_flex").on("keyup", function () {
    $(this).val(
      $(this)
        .val()
        .replace(/[^0-9]/g, "")
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
}

function testmessage_to_server(_type, _msg) {
  var param = {};
  param.type = "info";
  param.data = {};
  param.data.type = _type;
  param.data.msg = _msg;
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
    .catch(function (error) { })
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
  //console.log("setDisplay~~", _data )

  var chatOpt = document.getElementById("sliderChatOpacity");
  chatOpt.noUiSlider.set(_data.win_transparency);
  prev_set_transparency(_data.win_transparency);

  $("input[name=txtAlign][value=" + _data.text_align + "]").prop(
    "checked",
    true
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

  $("input[name=notiSys][value=" + _data.noti_type + "]").prop("checked", true);

  $("#chVoiceYn").prop("checked", _data.is_chat_voice == "on");

  $("#wordEffect").val(_data.text_fade_type);

  $("#wordEffect_dir").val(_data.text_fade_dir);

  sample_text_eff_dir(_data.text_fade_dir);

  $("#popupEffectStart").val(_data.pop_fade_in_type);

  $("#popupEffectEnd").val(_data.pop_fade_out_type);

  slide_popup_visible_time.noUiSlider.set(_data.pop_visible_time);
  //slide_chat_input_time.noUiSlider.set(_data.chat_input_time);
  slide_noti_sound_volume.noUiSlider.set(_data.noti_sound_volume);
  slide_voice_play_speed.noUiSlider.set(
    parseFloat(_data.noti_voice_speed) * 10
  );

  $("input[name=voice_type][value=" + _data.voice_select + "]").prop(
    "checked",
    true
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

  // show_noti_popup();
  //var str_test = get_replace_str_to_array(current_data.noti_text , my_nick, flex_num);
  // pushNotiPop("../images/img_gift_100.png", str_test,  "안녕하세요 채팅메시지 입니다.", parseInt(current_data.pop_visible_time)*1000 );

  $(".word").css("color", current_data.noti_font_color);
  $(".word_nick").css("color", current_data.noti_nick_color);
  $(".word_flex").css("color", current_data.noti_number_color);

  $("#smaple_txt_n1").removeClass();
  $("#smaple_txt_n1").addClass(
    "animated  " + current_data.text_fade_type + " infinite item-delay-1s"
  );
  $("#smaple_txt_n2").removeClass();
  $("#smaple_txt_n2").addClass(
    "animated  " + current_data.text_fade_type + " infinite item-delay-1s"
  );
  $("#smaple_txt_n3").removeClass();
  $("#smaple_txt_n3").addClass(
    "animated  " + current_data.text_fade_type + " infinite item-delay-1s"
  );
  $("#smaple_txt_f1").removeClass();
  $("#smaple_txt_f1").addClass(
    "animated  " + current_data.text_fade_type + " infinite item-delay-1s"
  );
  $("#smaple_txt_f2").removeClass();
  $("#smaple_txt_f2").addClass(
    "animated  " + current_data.text_fade_type + " infinite item-delay-1s"
  );
  $("#smaple_txt_f3").removeClass();
  $("#smaple_txt_f3").addClass(
    "animated  " + current_data.text_fade_type + " infinite item-delay-1s"
  );

  $("#noti_smaple_pop").removeClass();
  $("#noti_smaple_pop").addClass(
    "animated  " + current_data.pop_fade_in_type + " infinite item-delay-1s"
  );

  $(".spinner-border").css("display", "none");
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
      .css("color", current_data.noti_font_color)
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
      my_timeout_id = setTimeout(show_noti_popup, 3000);

      //    console.log("FFFFFFFFFFFFFFF~");
    });
  }, _duration);
}

function show_noti_popup() {
  if (current_data.noti_type == "알림음") {
    play_eff_sound();
  } else if (current_data.noti_type == "알림음성") {
    var voice_str = current_data.noti_text
      .replace("{닉네임}", my_nick)
      .replace("{개수}", numberWithCommas(flex_num));

    if (current_data.is_chat_voice == "on") {
      play_voice_sound(voice_str + "안녕하세요 채팅메시지 입니다.");
    } else {
      play_voice_sound(voice_str);
    }
  }
  var str_test = get_replace_str_to_array(
    current_data.noti_text,
    my_nick,
    numberWithCommas(flex_num)
  );
  pushNotiPop(
    "../images/img_gift_100.png",
    str_test,
    "안녕하세요 채팅메시지 입니다.",
    parseInt(current_data.pop_visible_time) * 1000
  );
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
      strokeColor
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
