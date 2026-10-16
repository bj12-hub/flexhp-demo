axios.defaults.withCredentials = true;
var current_preset_id;
var current_preset_div;
var current_data;

var current_preset_type = "honeypot";
var prev_font_name;
var current_flex_num_goal = 0;
var current_flex_num = 0;
var slide_graph_border;

// const HONEY_LIMIT = 10000;

//honey-pot loading bar
/** @type {HoneypotLoadingBar} */
const honeypotLoadBar = new HoneypotLoadingBar(
  $(".preview-area .chat-box.preview-box-area"),
);

var myModal = new bootstrap.Modal(document.getElementById("setupCompleted"), {
  keyboard: false,
});

var myModal2 = new bootstrap.Modal(document.getElementById("setupCompleted3"), {
  keyboard: false,
});

addCSSRule(
  document.styleSheets[0],
  ".ldBar-label:before",
  "content: attr(data-before)",
);

function init() {
  if (localStorage.getItem("preset_id_honeypot") == null) {
  } else {
    current_preset_id = localStorage.getItem("preset_id_honeypot");
  }
  addEvent();
  $(".preset-list-box").empty();

  setTimeout(getPresetList, 100);
}

function selectPresetBtn(t_div) {
  current_preset_id = t_div.attr("id");
  current_preset_div = t_div;
  localStorage.setItem("preset_id_honeypot", current_preset_id);
  t_div.addClass("selected").siblings().removeClass("selected");
  $("#urlCopy").val(current_preset_div.attr("url"));
  // console.log("selectPresetBtn :" , current_preset_div.attr('data_list'))
  current_data = JSON.parse(current_preset_div.attr("data_list"));
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
  return JSON.stringify(HoneypotLoadingBar.createDefaultJson());
}

function addEvent() {
  addEventPreset();

  // 꿀단지 텍스트
  $("#input_text_noti_text").on("change", function () {
    current_data.main_text = $(this).val();
    set_honey_bar();
  });
  // 꿀 후원 텍스트
  $("#input_text_noti_text_inside").on("change", function () {
    current_data.sub_text = $(this).val();
    set_honey_bar();
  });

  // 꿀 후원 테스트
  $("#val_flex").on("keyup", function () {
    $(this).val(
      $(this)
        .val()
        .replace(/[^0-9]/g, ""),
    );
    if ($(this).val() == "") $(this).val(1);
  });
  ///////////////////////////////////////////////////
  $("#btn_save").on("click", function () {
    savePreset(current_preset_div, current_data);
  });

  $("#btn_reset").on("click", function () {
    reset_setting();
  });
  $("#btn_flex").on("click", function () {
    var numOfFlex = $("#val_flex").val();
    addHoneyNum(numOfFlex, current_flex_num_goal);
    // 4: 벨, 5:하트, 6: 꿀
    testmessage_to_server("6", numOfFlex);
  });
  $("#btn_win_reset").on("click", function () {
    myModal2.show();
  });
  $("#btn_reset_ok3").on("click", function () {
    testmessage_to_server("2", "");
  });
  $("#btn_win_reload").on("click", function () {
    testmessage_to_server("1", "");
  });
  $("#btn_open_pop").on("click", function () {
    var url = $("#urlCopy").val();
    openWin(url, "플렉스", 500, 500);
  });
}
////////////////////////////////////////////////////////////////////핸들

function testmessage_to_server(_type, _msg) {
  var param = {};
  param.type = "honeypot";
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

// 투명도
function prev_handle_transparency(_temp) {
  if (current_data) current_data.win_transparency = _temp;
  _temp = 100 - _temp;
  var t_val = _temp * 0.01;
  $(".honeypot-bar-area").css("opacity", t_val);
}

// 폰트
function pre_handle_chat_font(_className) {
  if (current_data) current_data.font_name = _className;

  honeypotLoadBar.removeClassBySelector(".honeypot-bar-area", prev_font_name);
  $(".font-preview").removeClass(prev_font_name);

  honeypotLoadBar.addClassBySelector(".honeypot-bar-area", _className);
  $(".font-preview").addClass(_className);

  prev_font_name = _className;
}

// 폰트 볼드
function pre_handle_chat_font_bold(_flag) {
  if (current_data) {
    if (_flag) {
      current_data.font_bold = "on";
      honeypotLoadBar.addClassBySelector(
        ".honeypot-bar-area",
        "font-weight-bold",
      );
    } else {
      current_data.font_bold = "off";
      honeypotLoadBar.removeClassBySelector(
        ".honeypot-bar-area",
        "font-weight-bold",
      );
    }
  }
}
//폰트사이즈
function pre_handle_chat_font_size() {
  var fontSize = $("#fontSizeVal").val();
  if (current_data) {
    current_data.font_size = fontSize;
    prev_chat_fontStroke();
  }
}
//외곽선사이지
function pre_handle_chat_font_outline() {
  var fontborderVal = $("#fontBorderVal").val();
  if (current_data) {
    current_data.font_outline = fontborderVal;
    prev_chat_fontStroke();
  }
}

function getTitle() {
  const str_2 = current_data.main_text;

  let txt = g_replaceAll(
    str_2,
    "{개}",
    numberWithCommas(current_flex_num_goal),
  );
  return { txt, pre: current_data };
}

function getIndsideText() {
  const str_2 = current_data.sub_text;

  let pre = Math.floor(
    (current_flex_num / HoneypotLoadingBar.HONEY_LIMIT) * 100,
  );

  let tempTxt = g_replaceAll(
    str_2,
    "{꿀값}",
    numberWithCommas(current_flex_num),
  );
  tempTxt = g_replaceAll(tempTxt, "{개}", "개");
  const txt = g_replaceAll(tempTxt, "{퍼센트}", pre + "%");
  return { txt, pre };
}

function set_honey_bar() {
  if (!honeypotLoadBar || !honeypotLoadBar.isInitialized) {
    return;
  }

  const { txt: mainTxt } = getTitle();
  honeypotLoadBar.setData(HoneypotLoadingBar.UI_TREE.TITLE, mainTxt);

  const { txt, pre } = getIndsideText();

  honeypotLoadBar.setData(HoneypotLoadingBar.UI_TREE.SUB_TITLE, txt);
  honeypotLoadBar.setGaugeValue(pre);
}

// css rule 추가
function addCSSRule(sheet, selector, rules, index) {
  if ("insertRule" in sheet) {
    sheet.insertRule(selector + "{" + rules + "}", index);
  } else if ("addRule" in sheet) {
    sheet.addRule(selector, rules, index);
  }
}

function addHoneyNum(num, goalnum) {
  var num = parseInt(num);
  if (isNaN(num)) return;

  // 최종값을 보내줌(increase하지 않음.)
  // 꿀갯수
  current_flex_num = num;
  // 꿀단지 갯수
  current_flex_num_goal = goalnum;
  set_honey_bar();
}

function setPreview(_data) {
  honeypotLoadBar.setData(HoneypotLoadingBar.UI_TREE.TITLE, getTitle());
  honeypotLoadBar.setData(
    HoneypotLoadingBar.UI_TREE.SUB_TITLE,
    getIndsideText(),
  );

  if (!honeypotLoadBar.isInitialized) {
    honeypotLoadBar.initialize();
  }
}

function handleChangeFontColor(e, id) {
  //console.log(" $(this) :",  $(this), e);
  switch ($(this).attr("id")) {
    case "color_font":
      current_data.text_main_color = $(this).val();
      setTextColor_out(current_data.text_main_color);
      break;
    case "color_font_inside":
      current_data.text_sub_color = $(this).val();
      setTextColor_in(current_data.text_sub_color);
      break;
    case "colorPicker_gradent_inside":
      current_data.graph_background_color = $(this).val();
      set_inside_honey_bar(current_data.graph_background_color);
      break;
  }
}

function setDisplay(_data) {
  try {
    // 미리보기
    setPreview(_data);

    // 투명도
    var chatOpt = document.getElementById("sliderChatOpacity");
    chatOpt.noUiSlider.set(_data.win_transparency);

    const opacity = (100 - _data.win_transparency) * 0.01;
    honeypotLoadBar.setCssBySelector("honeypot-bar-area", { opacity });

    // 그래프 굵기
    //slide_graph_border.noUiSlider.set(_data.graph_border);

    addHoneyNum(200, 1);

    // 하트후원 텍스트 및 내부텍스트
    $("#input_text_noti_text").text(_data.main_text);
    $("#input_text_noti_text_inside").text(_data.sub_text);

    // 폰트색
    setTextColor($("#color_font"), _data.text_main_color);
    setTextColor_out(_data.text_main_color);
    // 내부폰트색
    setTextColor($("#color_font_inside"), _data.text_sub_color);
    setTextColor_in(_data.text_sub_color);

    // 그래프내부색
    set_inside_honey_bar(_data.graph_background_color);

    setTextColor(
      $("#colorPicker_gradent_inside"),
      _data.graph_background_color,
    );

    //////////////////////폰트//////////////////////////////////////
    var ff_str = get_font_str_from_value(_data.font_name);
    $(".btn-select").html(ff_str);
    $(".btn-select").attr("value", _data.font_name);
    pre_set_chat_font(_data.font_name);

    var isFontBold = _data.font_bold == "on";
    $("#fontBold").prop("checked", isFontBold);
    pre_set_chat_font_bold(_data.font_bold);
    var sliderFontSize = document.getElementById("sliderFontSize");
    sliderFontSize.noUiSlider.set(_data.font_size);
    pre_set_chat_font_size(_data.font_size);

    var sliderFontBorder = document.getElementById("sliderFontBorder");
    sliderFontBorder.noUiSlider.set(_data.font_outline);

    setFontStorke(_data);
    $(".spinner-border").css("display", "none");
  } catch (e) {
    console.error(e);
  }
}

function setFontStorke(_data) {
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
      console.log($(this).attr("id"));
      switch ($(this).attr("id")) {
        case "color_font":
          // 꿀단지 색
          current_data.text_main_color = $(this).val();
          setTextColor_out(current_data.text_main_color);
          break;
        case "color_font_inside":
          // 후원꿀 색
          current_data.text_sub_color = $(this).val();
          setTextColor_in(current_data.text_sub_color);
          break;
        case "colorPicker_gradent_inside":
          // 그래프 내부 색
          current_data.graph_background_color = $(this).val();
          set_inside_honey_bar(current_data.graph_background_color);
          break;
      }
    },
  });
}

// 그래프 내부색
function set_inside_honey_bar(color) {
  honeypotLoadBar.setCssBySelector(".honey_path", { fill: color });
}

// 꿀단지 텍스트
function setTextColor_out(color) {
  honeypotLoadBar.setCssBySelector(".main-title", { color: color });
}

// 후원꿀텍스트
function setTextColor_in(color) {
  honeypotLoadBar.setCssBySelector(".sub-title", { color: color });
}

////////////////////////////////////////////////////////////////////셋팅

//font Stroke
function prev_chat_fontStroke() {
  var strokeSize = $("#fontBorderVal").val();
  strokeColor = $("#fontStrokeColor").val();
  fontSize = $("#fontSizeVal").val();

  const selector = ".honeypot-bar-area";
  honeypotLoadBar.setCssBySelector(selector, { "font-size": `${fontSize}px` });
  honeypotLoadBar.setCssBySelector(selector, { "text-shadow": "" });

  for (var angle = 0; angle < 2 * Math.PI; angle += 1 / strokeSize) {
    const textShadow = getShadow(
      selector,
      Math.cos(angle) * strokeSize,
      Math.sin(angle) * strokeSize,
      strokeColor,
    );

    honeypotLoadBar.setCssBySelector(selector, { "text-shadow": textShadow });
  }
}

function pre_set_chat_font_size(_size) {
  honeypotLoadBar.setCssBySelector(".pro-title", { "font-size": `${_size}px` });
  honeypotLoadBar.setCssBySelector(".ldBar-title", {
    "font-size": `${_size}px`,
  });
}

function pre_set_chat_font_bold(_toggle) {
  if (_toggle == "on") {
    honeypotLoadBar.setCssBySelector(".honeypot-bar-area", {
      "font-weight": "bold",
    });
    $(".font-preview").addClass("font-preview-bold");
  } else {
    honeypotLoadBar.removeClassBySelector(
      ".honeypot-bar-area",
      "font-weight-bold",
    );
    $(".font-preview").removeClass("font-preview-bold");
  }
}

function pre_set_chat_font(_className) {
  if (prev_font_name) {
    if (
      honeypotLoadBar.hasClassBySelector(".honeypot-bar-area", prev_font_name)
    ) {
      honeypotLoadBar.removeClassBySelector(
        ".honeypot-bar-area",
        prev_font_name,
      );
    }
    if ($(".font-preview").hasClass(prev_font_name))
      $(".font-preview").removeClass(prev_font_name);
  }

  honeypotLoadBar.addClassBySelector(".honeypot-bar-area", _className);
  $(".font-preview").addClass(_className);
  prev_font_name = _className;
}

g_login_checking(login_callbackFn);
function login_callbackFn(member) {
  //console.log("login_callbackFn", member )
  init();
  if (member.IMG_URL && member.IMG_URL != "") {
    //console.log("~~~~~~~~~~~~", member.IMG_URL)
    $("#user_pic").find("img").attr("src", member.IMG_URL);
  }
  $("#user_name").text(member.NAME);
  $("#user_mid").text("(" + member.MID + ")");
}
