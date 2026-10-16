axios.defaults.withCredentials = true;
var current_preset_id;
var current_preset_div;
var current_data;
//var arr_preset_list = [];
var current_theme_class;
var current_preset_type = "chat";
var prev_font_name;
const flexup_ico_url = "../images/" + 'ico_preview_flex' + ".png";
const youtube_ico_url = "../images/" + 'ico_circle_youtube' + ".png";
var slide_chat_pade_speed;

var myModal = new bootstrap.Modal(document.getElementById("setupCompleted"), {
  keyboard: false,
});

function init() {
  if (localStorage.getItem("preset_id_chat") == null) {
  } else {
    current_preset_id = localStorage.getItem("preset_id_chat");
  }
  addEvent();
  $(".preset-list-box").empty();
  slide_chat_pade_speed_init();
  setTimeout(getPresetList, 100);
  // console.log("current_preset_id", current_preset_id)
}

function slide_chat_pade_speed_init() {
  slide_chat_pade_speed = document.getElementById("slide_chat_pade_speed");
  var spVal01 = document.getElementById("slide_chat_pade_speed_val");

  noUiSlider.create(slide_chat_pade_speed, {
    start: 1,
    connect: "lower",
    step: 1,
    range: {
      min: 0,
      max: 50,
    },
  });

  slide_chat_pade_speed.noUiSlider.on("update", function (values, handle) {
    spVal01.value = Number(values[handle] * 0.1).toFixed(1);
    prev_handle_fadein_speed(spVal01.value);
  });
}

function getThemeClassName(s_theme) {
  switch (s_theme) {
    case "베이직":
      return null;
    case "버블":
      return "chat-theme-bubble";
    case "메신저":
      return "chat-theme-messenger";
    case "하트프레임":
      return "chat-theme-heart";
    case "컬러풀캣":
      return "chat-theme-cat";
    case "리본":
      return "chat-theme-ribbon";
    case "멍멍이":
      return "chat-theme-dog";
    case "네온":
      return "chat-theme-neon";
    case "칠판":
      return "chat-theme-board";
  }
}

function selectPresetBtn(t_div) {
  current_preset_id = t_div.attr("id");
  current_preset_div = t_div;
  localStorage.setItem("preset_id_chat", current_preset_id);
  t_div.addClass("selected").siblings().removeClass("selected");
  $("#urlCopy").val(current_preset_div.attr("url"));

  //console.log("selectPresetBtn :" , current_preset_div.attr('data_list'))
  current_data = JSON.parse(current_preset_div.attr("data_list"));

  // console.log("current_data ~~:", current_data)
  clearPreview();
  setPreview();
  setDisplay(current_data);
}

function reset_setting() {
  var defult_data = createDefaultJson();
  current_preset_div.attr("data_list", defult_data);
  current_data = JSON.parse(current_preset_div.attr("data_list"));
  setDisplay(current_data);
  savePreset(current_preset_div, current_data);
}

function createDefaultJson() {
  var jsonObj = {};

  jsonObj.win_transparency = 0;

  jsonObj.chat_theme = "베이직";
  jsonObj.chat_eff_fadein = "fadeIn";
  jsonObj.chat_eff_fadein_speed = 0;
  jsonObj.chat_sort = "채팅줄바꿈";
  jsonObj.chat_direction = "왼쪽";

  jsonObj.set_icon = {};
  jsonObj.set_icon.setting = "내부송출";
  jsonObj.set_icon.bj = "on";
  jsonObj.set_icon.manager = "on";
  jsonObj.set_icon.ranking = "on";
  // 외부송출
  jsonObj.set_icon.flex = "on";
  jsonObj.set_icon.userlevel = "on";
  // 방송프랫폼 아이콘
  jsonObj.set_icon.flexup = "off";
  jsonObj.set_icon.youtube = "on";


  jsonObj.set_chating = {};
  jsonObj.set_chating.scroll = "off";
  jsonObj.set_chating.id = "on";
  jsonObj.set_chating.random = "off";
  jsonObj.set_chating.fadeout = "off";

  jsonObj.sponsor_mark = "이미지";

  jsonObj.font_name = "ff-01";
  jsonObj.font_bold = "off";
  jsonObj.font_size = 16;
  jsonObj.font_outline = 2;
  jsonObj.font_outline_color = "#000000";

  jsonObj.chat_color = {};

  jsonObj.chat_color.BJ닉네임 = "#f1f1f1";
  jsonObj.chat_color.BJ채팅 = "#ffffff";

  jsonObj.chat_color.매니저닉네임 = "#f1f1f1";
  jsonObj.chat_color.매니저채팅 = "#ffffff";

  jsonObj.chat_color.VIP닉네임 = "#f1f1f1";
  jsonObj.chat_color.VIP채팅 = "#ffffff";

  jsonObj.chat_color.일반닉네임 = "#f1f1f1";
  jsonObj.chat_color.일반채팅 = "#ffffff";

  jsonObj.chat_color.후원 = "#7a70f4";
  jsonObj.chat_color.입장등급추천 = "#7a70f4";

  //console.log("createDefaultJson:", JSON.stringify(jsonObj))

  return JSON.stringify(jsonObj);
}

function addEvent() {
  //console.log("chatjs  addEvent")

  addEventPreset();
  //내부송출/외부송출
  $("input[name=icoType]").on("input", function () {
    const val = $(this).val();
    current_data.set_icon.setting = val;
    if ("내부송출" === val) {
      $(".ico_inner").show();
      $(".ico_outter").hide();
    } else {
      $(".ico_inner").hide();
      $(".ico_outter").show();
    }
  });

  $("input[name=chType1]").on("input", function () {
    current_data.chat_theme = $(this).val();
    // console.log("chType1 :",   current_data.chat_theme )

    if (current_theme_class != null) {
      $(".chat-box").removeClass(current_theme_class);
    }

    current_theme_class = getThemeClassName(current_data.chat_theme);

    if (current_theme_class != null) {
      $(".chat-box").addClass(current_theme_class);
    }
  });

  $("#item-chat-effect").on("change", function () {
    current_data.chat_eff_fadein = $(this).val();
  });

  $("input[name=txtType]").on("input", function () {
    current_data.chat_sort = $(this).val();
    prev_set_chat_sort(current_data.chat_sort);
  });

  $("input[name=txtAlign]").on("input", function () {
    current_data.chat_direction = $(this).val();
    prev_set_chat_align(current_data.chat_direction);
  });

  $("#chk1").on("change", function () {
    current_data.set_icon.bj = $(this).prop("checked") ? "on" : "off";
  });
  $("#chk2").on("change", function () {
    current_data.set_icon.manager = $(this).prop("checked") ? "on" : "off";
  });
  $("#chk3").on("change", function () {
    current_data.set_icon.ranking = $(this).prop("checked") ? "on" : "off";
  });
  $("#chkflex").on("change", function () {
    current_data.set_icon.flex = $(this).prop("checked") ? "on" : "off";
  });
  // 사용자Level 추가
  $("#chkuserlevel").on("change", function () {
    current_data.set_icon.userlevel = $(this).prop("checked") ? "on" : "off";
  });
  // 플렛폼아이콘 추가
  $("#chkFlexup").on("change", function () {
    current_data.set_icon.flexup = $(this).prop("checked") ? "on" : "off";
  });
  $("#chkYoutube").on("change", function () {
    current_data.set_icon.youtube = $(this).prop("checked") ? "on" : "off";
  });

  $("#chk4").on("change", function () {
    current_data.set_chating.scroll = $(this).prop("checked") ? "on" : "off";
    pre_set_chat_scroll(current_data.set_chating.scroll);
  });
  /* $("#chk5").on( "change", function(){
        current_data.set_chating.id = $( this ).prop('checked')?"on":"off";
    }) */
  $("#chk6").on("change", function () {
    current_data.set_chating.random = $(this).prop("checked") ? "on" : "off";
  });
  $("#chk7").on("change", function () {
    current_data.set_chating.fadeout = $(this).prop("checked") ? "on" : "off";
    pre_set_chat_fadeout(current_data.set_chating.fadeout);
  });

  $("input[name=giftType]").on("input", function () {
    current_data.sponsor_mark = $(this).val();
  });

  $("#btn_save").on("click", function () {
    // console.log("btn_save : ", current_data)
    savePreset(current_preset_div, current_data);
  });

  $("#btn_reset").on("click", function () {
    //  console.log("btn_reset")
    reset_setting();
  });

  //////////////////////////
  $("#val_flex").on("keyup", function () {
    $(this).val(
      $(this)
        .val()
        .replace(/[^0-9]/g, "")
    );
  });

  $("#btn_flex").on("click", function () {
    // console.log("btn_flex")

    var numOfFlex = $("#val_flex").val();

    numOfFlex = parseInt(numOfFlex);
    pushNoti_image(
      "플렉스티비",
      "님께서 " + numberWithCommas(numOfFlex) + "개를 선물하셨습니다.",
      "../images/img_gift_100.png"
    );

    testmessage_to_server("4", numOfFlex);
  });

  $("#btn_recommend").on("click", function () {
    // console.log("btn_recommend ")
    pushNoti("플랙스티비", "님께서 추천하셨습니다.");
    testmessage_to_server("3", "");
  });

  $("#btn_win_reset").on("click", function () {
    //  console.log("btn_win_reset")
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
    //  window.open(url,"new","width=500,height=500");
  });
}

function testmessage_to_server(_type, _msg) {
  var param = {};
  param.type = "chat";
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
          // console.log("서버로 성공적으로 보냄")
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

////////////////////////////////////////////////////////////////////핸들
function prev_handle_transparency(_temp) {
  if (current_data) current_data.win_transparency = _temp;
  _temp = 100 - _temp;
  var t_val = _temp * 0.01;
  $(".chat-list-area").css({ opacity: t_val });
}

function prev_handle_fadein_speed(_temp) {
  // console.log("prev_handle_fadein_speed :", _temp)
  if (current_data) current_data.chat_eff_fadein_speed = _temp;
}
function pre_handle_chat_font(_className) {
  //console.log("pre_handle_chat_font : prev_font_name ", prev_font_name,  _className)
  if (current_data) current_data.font_name = _className;

  $(".chat-list-area").removeClass(prev_font_name);
  $(".font-preview").removeClass(prev_font_name);

  //setTimeout(function()
  //{
  $(".chat-list-area").addClass(_className);
  $(".font-preview").addClass(_className);
  prev_font_name = _className;
  //  console.log("pre_handle_chat_font :222", _className)
  // },500)
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
    // console.log("pre_handle_chat_font_bold :", current_data.font_bold)
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

function setDisplay(_data) {
  //console.log("setDisplay ~~~~~~~~~~:", _data)
  var win_transparency = _data.win_transparency;
  var chatOpt = document.getElementById("sliderChatOpacity");
  chatOpt.noUiSlider.set(win_transparency);
  prev_set_transparency(win_transparency);

  // 테마
  $("input[name=chType1][value=" + _data.chat_theme + "]").prop(
    "checked",
    true
  );

  current_theme_class = getThemeClassName(_data.chat_theme);

  if (current_theme_class != null) {
    $(".chat-box").addClass(current_theme_class);
  }

  $("#item-chat-effect").val(_data.chat_eff_fadein);

  // var chat_eff_fadein_speed = _data.chat_eff_fadein_speed * 10;
  //var getSampleId01 = document.getElementById('slidesample01');
  // getSampleId01.noUiSlider.set(chat_eff_fadein_speed);

  slide_chat_pade_speed.noUiSlider.set(_data.chat_eff_fadein_speed * 10);

  $("input[name=txtType][value=" + _data.chat_sort + "]").prop("checked", true);
  prev_set_chat_sort(_data.chat_sort);

  $("input[name=txtAlign][value=" + _data.chat_direction + "]").prop(
    "checked",
    true
  );
  prev_set_chat_align(_data.chat_direction);

  // 내부/외부송출 아이콘
  const icoTypeVal = _data.set_icon.setting || "내부송출";
  console.log("🔥 ~ setDisplay ~ icoTypeVal:", icoTypeVal);
  if ("내부송출" === icoTypeVal) {
    $(".ico_inner").show();
    $(".ico_outter").hide();
    $("#icoType1").prop("checked", true);
  } else {
    $(".ico_inner").hide();
    $(".ico_outter").show();
    $("#icoType2").prop("checked", true);
  }

  $("#chk1").prop("checked", _data.set_icon.bj == "on");
  $("#chk2").prop("checked", _data.set_icon.manager == "on");
  $("#chk3").prop("checked", _data.set_icon.ranking == "on");
  // 외부송출
  $("#chkflex").prop("checked", (_data.set_icon.flex || "on") == "on");

  // 사용자 Level
  $("#chkuserlevel").prop("checked", (_data.set_icon.userlevel || "on") == "on");
  //플랫폼아이콘
  $("#chkFlexup").prop("checked", (_data.set_icon.flexup || "on") == "on");
  $("#chkYoutube").prop("checked", (_data.set_icon.youtube || "on") == "on");

  $("#chk4").prop("checked", _data.set_chating.scroll == "on");
  //$("#chk5").prop('checked', (_data.set_chating.id == "on"));
  $("#chk6").prop("checked", _data.set_chating.random == "on");
  $("#chk7").prop("checked", _data.set_chating.fadeout == "on");

  pre_set_chat_scroll(_data.set_chating.scroll);
  pre_set_chat_fadeout(_data.set_chating.fadeout);

  $("input[name=giftType][value=" + _data.sponsor_mark + "]").prop(
    "checked",
    true
  );

  var ff_str = get_font_str_from_value(_data.font_name);
  $(".btn-select").html(ff_str);
  $(".btn-select").attr("value", _data.font_name);
  pre_set_chat_font(_data.font_name);

  var isFontBold = _data.font_bold == "on";
  $("#fontBold").prop("checked", isFontBold);
  if (isFontBold) {
    if ($(".chat-list-area").hasClass("font-weight-bold"))
      $(".chat-list-area").removeClass("font-weight-bold");
    if ($(".font-preview").hasClass("font-preview-bold"))
      $(".font-preview").removeClass("font-preview-bold");

    $(".chat-list-area").addClass("font-weight-bold");
    $(".font-preview").addClass("font-preview-bold");
  } else {
    $(".chat-list-area").removeClass("font-weight-bold");
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
  setTextColor($("#colorPicker_1_1"), _data.chat_color.BJ닉네임);
  setTextColor($("#colorPicker_1_2"), _data.chat_color.BJ채팅);
  setTextColor($("#colorPicker_2_1"), _data.chat_color.매니저닉네임);
  setTextColor($("#colorPicker_2_2"), _data.chat_color.매니저채팅);
  setTextColor($("#colorPicker_3_1"), _data.chat_color.VIP닉네임);
  setTextColor($("#colorPicker_3_2"), _data.chat_color.VIP채팅);
  setTextColor($("#colorPicker_4_1"), _data.chat_color.일반닉네임);
  setTextColor($("#colorPicker_4_2"), _data.chat_color.일반채팅);
  setTextColor($("#colorPicker_5_1"), _data.chat_color.후원);
  setTextColor($("#colorPicker_5_2"), _data.chat_color.입장등급추천);

  $(".spinner-border").css("display", "none");
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
        case "colorPicker_1_1":
          current_data.chat_color.BJ닉네임 = $(this).val();
          break;
        case "colorPicker_1_2":
          current_data.chat_color.BJ채팅 = $(this).val();
          break;
        case "colorPicker_2_1":
          current_data.chat_color.매니저닉네임 = $(this).val();
          break;
        case "colorPicker_2_2":
          current_data.chat_color.매니저채팅 = $(this).val();
          break;
        case "colorPicker_3_1":
          current_data.chat_color.VIP닉네임 = $(this).val();
          break;
        case "colorPicker_3_2":
          current_data.chat_color.VIP채팅 = $(this).val();
          break;
        case "colorPicker_4_1":
          current_data.chat_color.일반닉네임 = $(this).val();
          break;
        case "colorPicker_4_2":
          current_data.chat_color.일반채팅 = $(this).val();
          break;
        case "colorPicker_5_1":
          current_data.chat_color.후원 = $(this).val();
          break;
        case "colorPicker_5_2":
          current_data.chat_color.입장등급추천 = $(this).val();
          break;
      }
    },
    // move: function(color){
    //     console.log('background-color~~~',color.toHex8String());
    // }
  });
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
  // var $prev_chat = $('.chat-list');

  $(".chat-list").css("font-size", fontSize + "px");
  $(".chat-list").css("text-shadow", "");

  //console.log("prev_chat_fontStroke~~~~~~~~~~~~: ",  strokeSize, strokeColor, fontSize )

  for (var angle = 0; angle < 2 * Math.PI; angle += 1 / strokeSize) {
    appendShadow(
      $(".chat-list"),
      Math.cos(angle) * strokeSize,
      Math.sin(angle) * strokeSize,
      strokeColor
    );
  }
}

function pre_set_chat_font_size(_size) {
  $(".chat-list-area").css("font-size", _size + "px");
}

function pre_set_chat_font_bold(_toggle) {
  if (_toggle == "on") {
    $(".chat-list-area").addClass("font-weight-bold");
    $(".font-preview").addClass("font-preview-bold");
  } else {
    $(".chat-list-area").removeClass("font-weight-bold");
    $(".font-preview").removeClass("font-preview-bold");
  }
}

function pre_set_chat_font(_className) {
  if (prev_font_name) {
    if ($(".chat-list-area").hasClass(prev_font_name))
      $(".chat-list-area").removeClass(prev_font_name);
    if ($(".font-preview").hasClass(prev_font_name))
      $(".font-preview").removeClass(prev_font_name);
  }

  $(".chat-list-area").addClass(_className);
  $(".font-preview").addClass(_className);
  prev_font_name = _className;
}

function pre_set_chat_fadeout(_toggle) {
  if (_toggle == "on") {
    if ($(".chat-list-area").hasClass("item-fade-out"))
      $(".chat-list-area").removeClass("item-fade-out");
    $(".chat-list-area").addClass("item-fade-out");
  } else {
    $(".chat-list-area").removeClass("item-fade-out");
  }
}

function pre_set_chat_scroll(_toggle) {
  if (_toggle == "on") {
    if ($(".chat-list-area").hasClass("item-srcoll"))
      $(".chat-list-area").removeClass("item-srcoll");
    $(".chat-list-area").addClass("item-srcoll");
  } else {
    $(".chat-list-area").removeClass("item-srcoll");
  }
}

function prev_set_chat_align(str) {
  if ($(".chat-list-area").hasClass("text-right"))
    $(".chat-list-area").removeClass("text-right");
  if ($(".chat-list-area").hasClass("text-left"))
    $(".chat-list-area").removeClass("text-left");

  if (str == "왼쪽") {
    $(".chat-list-area").addClass("text-left");
  } else if (str == "오른쪽") {
    $(".chat-list-area").addClass("text-right");
  }
}

function prev_set_transparency(_temp) {
  // console.log("prev_set_transparency", _temp );
  _temp = 100 - _temp;
  var t_val = _temp * 0.01;
  $(".chat-list-area").css({ opacity: t_val });
}

function prev_set_chat_sort(_temp) {
  var className;
  if (_temp == "채팅줄바꿈") {
    className = false;
  } else if (_temp == "채팅인라인") {
    className = "chat-align-inline";
  } else if (_temp == "채팅들여쓰기") {
    className = "chat-align-indent";
  } else if (_temp == "닉네임우측정렬") {
    className = "chat-align-ellipsis";
  } else {
    className = false;
  }

  // console.log("prev_set_chat_sort :", _temp,  className)

  if ($(".chat-list").hasClass("chat-align-inline"))
    $(".chat-list").removeClass("chat-align-inline");
  if ($(".chat-list").hasClass("chat-align-indent"))
    $(".chat-list").removeClass("chat-align-indent");
  if ($(".chat-list").hasClass("chat-align-ellipsis"))
    $(".chat-list").removeClass("chat-align-ellipsis");

  if (!className) return;
  $(".chat-list").addClass(className);
}

var cnt = 0;
var myTimeout = [];
$(".chat-list").empty();

function clearPreview() {
  cnt = 0;
  for (var i = 0; i < myTimeout.length; i++) {
    clearTimeout(myTimeout[i]);
  }
  $(".chat-list").empty();
}

function setPreview() {
  var t_timeout;
  myTimeout = [];
  //console.log("setPreview")
  if (cnt == 10) {
    cnt = 0;
    $(".chat-list").empty();
  }

  const userLevel = {
    badge_icon: "https://static.flextv.co.kr/assets/levelIcon/level_003.png",
    label: "LV.29",
    level_no: 29
  }

  t_timeout = setTimeout(function () {
    pushChat("BJ", "flextv", "플렉스티비", "안녕하세요 반갑습니다.", userLevel, -1);
  }, 2000);
  myTimeout.push(t_timeout);

  t_timeout = setTimeout(function () {
    pushChat("매니저", "flextv1", "플렉스티비1", "어서오세요~.", userLevel, -1, 'youtube');
  }, 3000);
  myTimeout.push(t_timeout);

  t_timeout = setTimeout(function () {
    pushChat("VIP", "flextv2", "플렉스티비2", "반가워요~~~~~", userLevel, -1);
  }, 4000);
  myTimeout.push(t_timeout);

  t_timeout = setTimeout(function () {
    pushChat(
      "일반",
      "flextv3",
      "플렉스티비3",
      "안녕하세요 긴내용 채팅메시지입니다.  긴내용 채팅메시지입니다.  긴내용 채팅메시지입니다.",
      userLevel, -1, 'youtube'
    );
  }, 5000);
  myTimeout.push(t_timeout);

  t_timeout = setTimeout(function () {
    pushNoti_image("플렉스티비", "께서 1,004개를 선물하셨습니다.");
  }, 10);
  myTimeout.push(t_timeout);

  t_timeout = setTimeout(function () {
    pushNoti("플렉스티비", "님의 등급이 ♡VIP♡로 변경되었습니다.");
  }, 1000);
  myTimeout.push(t_timeout);

  t_timeout = setTimeout(function () {
    pushNoti("플렉스티비4", "님께서 추천하셨습니다.");
  }, 6000);
  myTimeout.push(t_timeout);

  t_timeout = setTimeout(function () {
    setPreview();
  }, 9000);
  myTimeout.push(t_timeout);

  cnt++;
}

//입장등급추천
function pushNoti(_nick, _text) {
  var t_noti = $("<li>")
    .addClass("noti animated " + current_data.chat_eff_fadein)
    .append(
      $("<div>")
        .addClass("noti-txt")
        .append(
          $("<p>")
            .addClass("word")
            .text(_nick + " " + _text)
            .css("color", current_data.chat_color.입장등급추천)
        )
    );

  css_setEffspeed(t_noti, current_data.chat_eff_fadein_speed);
  $(".chat-list").append(t_noti);
}

//후원
function pushNoti_image(_nick, _text, _img_url) {
  var t_noti;
  if (current_data.sponsor_mark == "이미지") {
    var img_src;
    if (_img_url) {
      img_src = _img_url;
    } else {
      img_src = "../images/img_gift_100.png";
    }

    t_noti = $("<li>")
      .addClass("noti animated " + current_data.chat_eff_fadein)
      .append(
        $("<div>").addClass("noti-img").append($("<img>").attr("src", img_src))
      )
      .append(
        $("<div>")
          .addClass("noti-txt")
          .append(
            $("<p>")
              .addClass("word")
              .text(_nick + " " + _text)
              .css("color", current_data.chat_color.후원)
          )
      );
  } else if (current_data.sponsor_mark == "텍스트") {
    t_noti = $("<li>")
      .addClass("noti animated " + current_data.chat_eff_fadein)
      .append(
        $("<div>")
          .addClass("noti-txt")
          .append(
            $("<p>")
              .addClass("word")
              .text(_nick + " " + _text)
              .css("color", current_data.chat_color.후원)
          )
      );
  }

  css_setEffspeed(t_noti, current_data.chat_eff_fadein_speed);
  $(".chat-list").append(t_noti);
}

//채팅
function pushChat(_level, _id, _nick, _text, gUserLevel, ranking, platform = null) {
  /* if (current_data.set_chating.id == "on") {
    _id = "(" + _id + ")";
  } else {
    _id = "";
  } */

  _id = "";

  var nick_color;
  var txt_color;
  var image_icon = "";
  var _alt;
  var icon_class;

  const isInnerIcoType =
    (current_data.set_icon.setting || "내부송출") === "내부송출";


  // 사용자 Level
  let userLevel = gUserLevel;
  if (isInnerIcoType && (current_data.set_icon.userlevel || 'on') === "on") {
    if (!gUserLevel || !gUserLevel.badge_icon) {
      userLevel = null;
    }
  } else {
    userLevel = null;
  }


  if (_level == "BJ") {
    if (isInnerIcoType && current_data.set_icon.bj == "on") {
      image_icon = "ico_BJ";
      _alt = "bj";
      icon_class = "ico bj";
    } else if (!isInnerIcoType && current_data.set_icon.flex === "on") {
      image_icon = "ico_preview_flex";
      _alt = "flex";
      icon_class = "ico flex";
    }

    nick_color = current_data.chat_color.BJ닉네임;
    txt_color = current_data.chat_color.BJ채팅;
  } else if (_level == "매니저") {
    if (isInnerIcoType && current_data.set_icon.manager == "on") {
      image_icon = "ico_manager";
      _alt = "manager";
      icon_class = "ico manager";
    } else if (!isInnerIcoType && current_data.set_icon.flex === "on") {
      image_icon = "ico_preview_flex";
      _alt = "flex";
      icon_class = "ico flex";
    }
    nick_color = current_data.chat_color.매니저닉네임;
    txt_color = current_data.chat_color.매니저채팅;
  } else if (_level == "VIP") {
    if (isInnerIcoType && current_data.set_icon.ranking == "on") {
      image_icon = "ico_VIP";
      _alt = "level";
      icon_class = "ico level";
    } else if (!isInnerIcoType && current_data.set_icon.flex === "on") {
      image_icon = "ico_preview_flex";
      _alt = "flex";
      icon_class = "ico flex";
    }
    nick_color = current_data.chat_color.VIP닉네임;
    txt_color = current_data.chat_color.VIP채팅;
  } else if (_level == "일반") {
    if (isInnerIcoType && current_data.set_icon.ranking == "on") {
      image_icon = "ico_normal";
      _alt = "level";
      icon_class = "ico normal";
    } else if (!isInnerIcoType && current_data.set_icon.flex === "on") {
      image_icon = "ico_preview_flex";
      _alt = "flex";
      icon_class = "ico flex";
    }
    nick_color = current_data.chat_color.일반닉네임;
    txt_color = current_data.chat_color.일반채팅;
  }

  var t_nickname;
  t_nickname = $("<p>").addClass("nickname").css("color", nick_color);

  if ((current_data.set_icon.flexup || 'on') === "on" && platform !== "youtube") {
    t_nickname.append(
      $("<span>")
        .addClass(icon_class)
        .append($("<img>").attr("src", flexup_ico_url).attr("alt", _alt))
    )
  }

  if ((current_data.set_icon.youtube || 'on') === "on" && platform === "youtube") {
    t_nickname.append(
      $("<span>")
        .addClass(icon_class)
        .append($("<img>").attr("src", youtube_ico_url).attr("alt", _alt))
    )
  }






  if (userLevel && _level != "BJ") {
    const class_userlevel = `user_level_area user_level_area_${Math.floor((userLevel.level_no || 1) / 10)}`;
    t_nickname.append(
      $($('<span>', { class: 'user_level_wrapper' }))
        .css("line-height", current_data.font_size + "px")
        .append(
          $("<div>", { class: class_userlevel })
            .append($('<img>', { class: "user_level_badge", src: userLevel.badge_icon }))
            .append($('<div>', { class: "user_level_txt", text: userLevel.level_no })
            )
        )
    )
  }

  if (image_icon == "") {
    t_nickname
      .append($("<span>").addClass("nick").text(_nick))
      .append($("<span>").addClass("id").text(_id));
  } else if (_level == "매니저") {
    t_nickname
      .append($("<span>").addClass("nick").text(_nick))
      .append($("<span>").addClass("id").text(_id))
      .append(
        $("<span>")
          .addClass(icon_class)
          .append(
            $("<img>")
              .attr("src", "../images/" + image_icon + ".png")
              .attr("alt", _alt)
          )
      );
  } else {
    t_nickname.append(
      $("<span>")
        .addClass(icon_class)
        .append(
          $("<img>")
            .attr("src", "../images/" + image_icon + ".png")
            .attr("alt", _alt)
        )
    )
      .append($("<span>").addClass("nick").text(_nick))
      .append($("<span>").addClass("id").text(_id));
  }

  if (current_data.set_chating.random == "on") {
    var ranNum = Math.floor(Math.random() * 6 + 1);
    // console.log("ranNum :", ranNum);
    t_nickname.addClass("nick-random-color-" + ranNum);
  }

  var t_chat = $("<li>")
    .addClass("animated " + current_data.chat_eff_fadein)
    .append(t_nickname)
    .append($("<p>").addClass("txt").text(_text).css("color", txt_color));

  css_setEffspeed(t_chat, current_data.chat_eff_fadein_speed);
  $(".chat-list").append(t_chat);

  // setTimeout(function()
  // {
  //     $('.chat-list-area').scrollTop($('.chat-list-area').prop('scrollHeight'));

  // },200)
}

function css_setEffspeed(_target, _temp) {
  _target.css({ "transition-duration": _temp + "s" });
  _target.css({ "-webkit-transition-duration": _temp + "s" });
  _target.css({ "animation-duration": _temp + "s" });
  _target.css({ "transition-duration": _temp + "s" });
}

g_login_checking(login_callbackFn);
function login_callbackFn(member) {
  //console.log("login_callbackFn", member )
  init();
  if (member.IMG_URL && member.IMG_URL != "") {
    // console.log("~~~~~~~~~~~~@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@", member.IMG_URL)
    $("#user_pic").find("img").attr("src", member.IMG_URL);
  }

  $("#user_name").text(member.NAME);
  $("#user_mid").text("(" + member.MID + ")");
}
