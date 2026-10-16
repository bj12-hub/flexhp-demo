axios.defaults.withCredentials = true;
var current_preset_id;
var current_preset_div;
var current_data;

var current_preset_type = "heart";
var prev_font_name;
var current_flex_num = 0;
var slide_graph_border;
var slide_heart_repeat;

const HEART_LIMIT = 10000;

//heart loading bar
/** @type {HeartLoadingBar} */
const heartLoadBar = new HeartLoadingBar($(".preview-area .chat-box.heart-box-area"));

var myModal = new bootstrap.Modal(document.getElementById("setupCompleted"), {
  keyboard: false,
});

var myModal2 = new bootstrap.Modal(document.getElementById("setupCompleted3"), {
  keyboard: false,
});

//progressHeart(10);

addCSSRule(
  document.styleSheets[0],
  ".ldBar-label:before",
  "content: attr(data-before)"
);

function init() {
  if (localStorage.getItem("preset_id_heart") == null) {
  } else {
    current_preset_id = localStorage.getItem("preset_id_heart");
  }
  addEvent();
  $(".preset-list-box").empty();

  // 그래프 굵기.
  set_slide_graph_border_init(handleGraphBorderWidth);

  setTimeout(getPresetList, 100);
}

function selectPresetBtn(t_div) {
  current_preset_id = t_div.attr("id");
  current_preset_div = t_div;
  localStorage.setItem("preset_id_heart", current_preset_id);
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
  return JSON.stringify(HeartLoadingBar.createDefaultJson());
}

function addEvent() {
  addEventPreset();

  // 하트후원 텍스트
  $("#input_text_noti_text").on("change", function () {
    current_data.heart_text = $(this).val();
    set_heart_bar();
  });
  // 내부 텍스트
  $("#input_text_noti_text_inside").on("change", function () {
    current_data.heart_inside_text = $(this).val();
    set_heart_bar();
  });


  $("#val_flex").on("keyup", function () {
    $(this).val(
      $(this)
        .val()
        .replace(/[^0-9]/g, "")
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
    addHeartNum(numOfFlex);
    // 4: 벨, 5:하트
    testmessage_to_server("5", numOfFlex);
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
  param.type = "heart";
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
    .catch(function (error) { })
    .then(function () {
      // always executed
    });
}

function prev_handle_transparency(_temp) {
  if (current_data) current_data.win_transparency = _temp;
  _temp = 100 - _temp;
  var t_val = _temp * 0.01;
  $(".heart-bar-area").css("opacity", t_val);
}

function pre_handle_chat_font(_className) {
  if (current_data) current_data.font_name = _className;

  heartLoadBar.removeClassBySelector(".heart-bar-area", prev_font_name);
  $(".font-preview").removeClass(prev_font_name);

  heartLoadBar.addClassBySelector(".heart-bar-area", _className);
  $(".font-preview").addClass(_className);

  prev_font_name = _className;
}

// 폰트 볼드
function pre_handle_chat_font_bold(_flag) {
  if (current_data) {
    if (_flag) {
      current_data.font_bold = "on";
      heartLoadBar.addClassBySelector(".heart-bar-area", "font-weight-bold");
    } else {
      current_data.font_bold = "off";
      heartLoadBar.removeClassBySelector(".heart-bar-area", "font-weight-bold");
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

// 그래프 굵기
function set_slide_graph_border_init(callback) {
  slide_graph_border = document.getElementById("slide_graph_border");
  var spVal02 = document.getElementById("slide_graph_border_val");

  noUiSlider.create(slide_graph_border, {
    start: 1,
    connect: "lower",
    step: 1,
    range: {
      min: 1,
      max: 100,
    },
  });

  slide_graph_border.noUiSlider.on("update", function (values, handle) {
    spVal02.value = parseInt(values[handle]);
    var t_val = parseInt(spVal02.value * 0.2) + 1;

    callback(t_val);

    if (current_data) current_data.graph_border = spVal02.value;

  });
}

function getTitle() {
  return current_data.heart_text;
}

function getIndsideText() {
  const str_2 = current_data.heart_inside_text;

  let pre = Math.floor((current_flex_num / HEART_LIMIT) * 100);

  let tempTxt = g_replaceAll(
    str_2,
    "{하트값}",
    numberWithCommas(current_flex_num)
  );
  tempTxt = g_replaceAll(tempTxt, "{개}", "개");
  const txt = g_replaceAll(tempTxt, "{퍼센트}", pre + "%");
  return { txt, pre }
}

function set_heart_bar() {
  const { txt, pre } = getIndsideText();

  heartLoadBar.setData(HeartLoadingBar.UI_TREE.SUB_TITLE, txt);
  heartLoadBar.setGaugeValue(pre);
  heartLoadBar.setData(HeartLoadingBar.UI_TREE.TITLE, getTitle());
}

// css rule 추가
function addCSSRule(sheet, selector, rules, index) {
  if ("insertRule" in sheet) {
    sheet.insertRule(selector + "{" + rules + "}", index);
  } else if ("addRule" in sheet) {
    sheet.addRule(selector, rules, index);
  }
}

function addHeartNum(num) {
  var num = parseInt(num);
  if (isNaN(num)) return;
  // current_flex_num = parseInt(current_flex_num) + num;
  // 최종값을 보내줌(increase하지 않음.)
  current_flex_num = num;
  set_heart_bar();
  /*  if (0 < num) {
    heartLoadBar.createFloatingHeart();
   } */
}

function setPreview(_data) {
  heartLoadBar.setData(HeartLoadingBar.UI_TREE.TITLE, getTitle());
  heartLoadBar.setData(HeartLoadingBar.UI_TREE.SUB_TITLE, getIndsideText());

  if (!heartLoadBar.isInitialized) {
    heartLoadBar.initialize();
  }
}

// 그래프 borer size
// noUiSlider update callback2
function handleGraphBorderWidth(value,) {
  heartLoadBar.setBorderWidth(value);
}

function handleChangeFontColor(e, id) {
  //console.log(" $(this) :",  $(this), e);
  switch ($(this).attr("id")) {
    case "color_font":
      current_data.text_outside_color = $(this).val();
      setTextColor_out(current_data.text_outside_color);
      break;
    case "color_font_inside":
      current_data.text_inside_color = $(this).val();
      setTextColor_in(current_data.text_inside_color);
      break;
    case "colorPicker_gradent_inside":
      current_data.graph_background_color = $(this).val();
      set_inside_heart_bar(current_data.graph_background_color);
      break;
    case "colorPicker_graph_circle":
      current_data.graph_circle_color = $(this).val();
      set_graph_circle(current_data.graph_circle_color);
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
    heartLoadBar.setCssBySelector('heart-bar-area', { opacity });

    // 그래프 굵기
    slide_graph_border.noUiSlider.set(_data.graph_border);

    addHeartNum(0);

    // 하트후원 텍스트 및 내부텍스트
    $("#input_text_noti_text").text(_data.heart_text);
    $("#input_text_noti_text_inside").text(_data.heart_inside_text);

    // 폰트색
    setTextColor($("#color_font"), _data.text_outside_color);
    setTextColor_out(_data.text_outside_color);
    // 내부폰트색
    setTextColor($("#color_font_inside"), _data.text_inside_color);
    setTextColor_in(_data.text_inside_color);

    // 그래프내부색
    set_inside_bar(_data.graph_background_color);
    // 그래프 모양색
    set_graph_circle(_data.graph_circle_color);

    setTextColor($("#colorPicker_gradent_inside"), _data.graph_background_color);
    setTextColor($("#colorPicker_graph_circle"), _data.graph_circle_color);

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
      //console.log(" $(this) :",  $(this), e);
      switch ($(this).attr("id")) {
        case "color_font":
          current_data.text_outside_color = $(this).val();
          setTextColor_out(current_data.text_outside_color);
          break;
        case "color_font_inside":
          current_data.text_inside_color = $(this).val();
          setTextColor_in(current_data.text_inside_color);
          break;
        case "colorPicker_gradent_inside":
          current_data.graph_background_color = $(this).val();
          set_inside_heart_bar(current_data.graph_background_color);
          break;
        case "colorPicker_graph_circle":
          current_data.graph_circle_color = $(this).val();
          set_graph_circle(current_data.graph_circle_color);
          break;
      }
    },
  });
}

function set_graph_circle(color) {
  heartLoadBar.setCssBySelector(".mainline", { stroke: color });
}

function set_inside_heart_bar(color) {
  heartLoadBar.setCssBySelector(".baseline", { stroke: color });
}

function set_inside_bar(color) {
  heartLoadBar.setCssBySelector(".heart-inner", { 'background-color': color });
  heartLoadBar.setCssBySelector(".baseline", { stroke: color });
}


function setTextColor_out(color) {
  heartLoadBar.setCssBySelector(".pro-title", { color: color });
}

function setTextColor_in(color) {
  heartLoadBar.setCssBySelector(".inner-txt", { color: color });
  heartLoadBar.setCssBySelector(".ldBar-label", { color: color });
}

////////////////////////////////////////////////////////////////////셋팅

//font Stroke
function prev_chat_fontStroke() {
  var strokeSize = $("#fontBorderVal").val();
  strokeColor = $("#fontStrokeColor").val();
  fontSize = $("#fontSizeVal").val();

  const selector = ".heart-bar-area";
  heartLoadBar.setCssBySelector(selector, { "font-size": `${fontSize}px` });
  heartLoadBar.setCssBySelector(selector, { "text-shadow": "" });

  for (var angle = 0; angle < 2 * Math.PI; angle += 1 / strokeSize) {
    const textShadow = getShadow(
      selector,
      Math.cos(angle) * strokeSize,
      Math.sin(angle) * strokeSize,
      strokeColor
    );

    heartLoadBar.setCssBySelector(selector, { "text-shadow": textShadow });
  }
}

function pre_set_chat_font_size(_size) {
  heartLoadBar.setCssBySelector(".pro-title", { "font-size": `${_size}px` });
  heartLoadBar.setCssBySelector(".ldBar-title", { "font-size": `${_size}px` });
}

function pre_set_chat_font_bold(_toggle) {
  if (_toggle == "on") {
    heartLoadBar.setCssBySelector(".heart-bar-area", { "font-weight": "bold" });
    $(".font-preview").addClass("font-preview-bold");
  } else {
    heartLoadBar.removeClassBySelector(".heart-bar-area", "font-weight-bold");
    $(".font-preview").removeClass("font-preview-bold");
  }
}

function pre_set_chat_font(_className) {
  if (prev_font_name) {
    if (heartLoadBar.hasClassBySelector(".heart-bar-area", prev_font_name)) {
      heartLoadBar.removeClassBySelector(".heart-bar-area", prev_font_name);
    };
    if ($(".font-preview").hasClass(prev_font_name))
      $(".font-preview").removeClass(prev_font_name);
  }

  heartLoadBar.addClassBySelector(".heart-bar-area", _className);
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
