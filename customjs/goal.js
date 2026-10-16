axios.defaults.withCredentials = true;
var current_preset_id;
var current_preset_div;
var current_data;
//var arr_preset_list = [];
var current_preset_type = "target";
var prev_font_name;
var current_flex_num = 50;
var current_doosan_num = 10;
var slide_graph_border;
var slide_target_repeat;
var current_bar_type = "flex";
var m_psCircle;
var m_psHeart;
var m_psStar;
var m_psFan;

var myModal = new bootstrap.Modal(document.getElementById("setupCompleted"), {
  keyboard: false,
});

var myModal2 = new bootstrap.Modal(document.getElementById("setupCompleted3"), {
  keyboard: false,
});

progressCircle(10);
progressFan(10);
progressHeart(10);
progressStar(10);
addCSSRule(
  document.styleSheets[0],
  ".ldBar-label:before",
  "content: attr(data-before)"
);

function init() {
  if (localStorage.getItem("preset_id_target") == null) {
  } else {
    current_preset_id = localStorage.getItem("preset_id_target");
  }
  addEvent();
  $(".preset-list-box").empty();
  set_slide_graph_border_init();
  set_slide_target_repeat_init();
  setTimeout(getPresetList, 100);
}

function visibleGraph(t_str) {
  switch (t_str) {
    case "바":
      $(".goal-box").css("display", "block");
      $(".ldCircle").css("display", "none");
      $(".ldHeart").css("display", "none");
      $(".ldStar").css("display", "none");
      $(".ldFan").css("display", "none");
      break;
    case "원":
      $(".goal-box").css("display", "none");
      $(".ldCircle").css("display", "block");
      $(".ldHeart").css("display", "none");
      $(".ldStar").css("display", "none");
      $(".ldFan").css("display", "none");
      break;
    case "하트":
      $(".goal-box").css("display", "none");
      $(".ldCircle").css("display", "none");
      $(".ldHeart").css("display", "block");
      $(".ldStar").css("display", "none");
      $(".ldFan").css("display", "none");
      break;
    case "별":
      $(".goal-box").css("display", "none");
      $(".ldCircle").css("display", "none");
      $(".ldHeart").css("display", "none");
      $(".ldStar").css("display", "block");
      $(".ldFan").css("display", "none");
      break;
    case "반원":
      $(".goal-box").css("display", "none");
      $(".ldCircle").css("display", "none");
      $(".ldHeart").css("display", "none");
      $(".ldStar").css("display", "none");
      $(".ldFan").css("display", "block");
      break;
  }
}

function progressCircle(t_value) {
  m_psCircle = new ldBar(".ldCircle", {
    type: "stroke",
    preset: "circle",
    "stroke-trail": "#ddd",
  });
  m_psCircle.set(
    t_value /* target value. */,
    true /* enable animation. default is true */
  );
}

function progressHeart(t_value) {
  m_psHeart = new ldBar(".ldHeart", {
    type: "stroke",
    "stroke-trail": "#ddd",
    path: "M200 251.67l-2.053-1.67c-44.96-36.62-57.136-49.51-57.136-70.45 0-17.213 14.01-31.22 31.224-31.22 14.386 0 22.518 8.17 27.97 14.315 5.448-6.146 13.58-14.315 27.968-14.315 17.215 0 31.22 14.007 31.22 31.22 0 20.94-12.175 33.83-57.134 70.45L200 251.67z",
  });
  m_psHeart.set(
    t_value /* target value. */,
    true /* enable animation. default is true */
  );
}

function progressStar(t_value) {
  m_psStar = new ldBar(".ldStar", {
    type: "stroke",
    "stroke-trail": "#ddd",
    path: "M31.7569,1.14435 L39.2006,16.94809 C39.4742047,17.5450605 40.0274966,17.9662669 40.67576,18.07109 L57.32037,20.60534 C58.0728338,20.7512497 58.6840769,21.2991656 58.9110909,22.0312558 C59.1381048,22.7633461 58.9440977,23.560962 58.4062,24.107 L46.36205,36.40845 C45.8969861,36.8906851 45.6879532,37.5647752 45.79858,38.22553 L48.64182,55.59553 C48.7969313,56.3422303 48.5093863,57.1116407 47.9025754,57.5735945 C47.2957646,58.0355484 46.4775729,58.1079148 45.7991,57.75964 L30.9117,49.55864 C30.3445605,49.2442297 29.6554395,49.2442297 29.0883,49.55864 L14.2009,57.75964 C13.5224271,58.1079148 12.7042354,58.0355484 12.0974246,57.5735945 C11.4906137,57.1116407 11.2030687,56.3422303 11.35818,55.59553 L14.20142,38.22553 C14.3120468,37.5647752 14.1030139,36.8906851 13.63795,36.40845 L1.5938,24.107 C1.05593046,23.5609597 0.861941478,22.7633618 1.08895299,22.0312898 C1.31596449,21.2992177 1.92718692,20.7513115 2.67963,20.60539 L19.32424,18.0711 C19.9725034,17.9662769 20.5257953,17.5450705 20.7994,16.9481 L28.2431,1.14435 C28.5505421,0.448721422 29.2394609,-5.16717968e-06 30,-5.16717968e-06 C30.7605391,-5.16717968e-06 31.4494579,0.448721422 31.7569,1.14435 Z",
  });
  m_psStar.set(
    t_value /* target value. */,
    true /* enable animation. default is true */
  );
}

function progressFan(t_value) {
  m_psFan = new ldBar(".ldFan", {
    type: "stroke",
    preset: "fan",
    "stroke-trail": "#ddd",
  });
  m_psFan.set(
    t_value /* target value. */,
    true /* enable animation. default is true */
  );
}

function selectPresetBtn(t_div) {
  current_preset_id = t_div.attr("id");
  current_preset_div = t_div;
  localStorage.setItem("preset_id_target", current_preset_id);
  t_div.addClass("selected").siblings().removeClass("selected");
  $("#urlCopy").val(current_preset_div.attr("url"));
  // console.log("selectPresetBtn :" , current_preset_div.attr('data_list'))
  current_data = JSON.parse(current_preset_div.attr("data_list"));
  setDisplay(current_data);
  change_goal_type();
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

  jsonObj.graph_type = "바";
  jsonObj.graph_dir = "가로";
  jsonObj.graph_border = 50;
  jsonObj.graph_only_text = "off";

  jsonObj.goal_type_1 = "on";
  jsonObj.goal_type_2 = "on";
  jsonObj.goal_start_val = "0";
  jsonObj.goal_end_val = "100";
  jsonObj.goal_start_val_doosan = "0";
  jsonObj.goal_end_val_doosan = "100";
  jsonObj.goal_target_text = "오늘의 {목표종류} 목표치";
  jsonObj.goal_target_inside_text = "{목표값}{개} ({목표퍼센트})";
  jsonObj.goal_value_auto_add = "off";
  jsonObj.goal_value_auto_add_val = 100;
  jsonObj.goal_target_repeat_time = 10;
  jsonObj.goal_text_outside_color = "#ffffff";
  jsonObj.goal_text_inside_color = "#77089c";
  jsonObj.graph_gradient_start_color = "#1d976c";
  jsonObj.graph_gradient_end_color = "#93f9b9";
  jsonObj.graph_background_color = "#dddddd";
  jsonObj.graph_circle_color = "#ba5fdf";
  jsonObj.graph_animation = "on";
  jsonObj.font_name = "ff-01";
  jsonObj.font_bold = "off";
  jsonObj.font_size = 22;
  jsonObj.font_outline = 2;
  jsonObj.font_outline_color = "#000000";

  //console.log("createDefaultJson:", JSON.stringify(jsonObj))
  return JSON.stringify(jsonObj);
}

function addEvent() {
  addEventPreset();
  //$( "input[name=graphType][value="+_data.graph_type+"]").prop("checked", true);
  $("input[name=graphType").on("input", function () {
    current_data.graph_type = $(this).val();
    // console.log("graph_type :", current_data.graph_type);
    visibleGraph(current_data.graph_type);
  });

  $("#gTxtYn").on("change", function () {
    current_data.graph_only_text = $(this).prop("checked") ? "on" : "off";
    set_graph_text_only(current_data.graph_only_text);
  });

  $("#chk_sp_1").on("change", function () {
    current_data.goal_type_1 = $(this).prop("checked") ? "on" : "off";

    if ($(this).prop("checked")) {
      $("#chkGift").css("display", "block");
    } else {
      $("#chkGift").css("display", "none");
    }
    change_goal_type();
  });

  $("#chk_sp_2").on("change", function () {
    current_data.goal_type_2 = $(this).prop("checked") ? "on" : "off";

    if ($(this).prop("checked")) {
      $("#chkDoosan").css("display", "block");
    } else {
      $("#chkDoosan").css("display", "none");
    }
    change_goal_type();
  });

  $("#input_text_start_num").on("change", function () {
    current_data.goal_start_val = $(this).val();
    current_flex_num = parseInt($(this).val());
  });

  $("#input_text_start_num").on("keyup", function () {
    $(this).val(
      $(this)
        .val()
        .replace(/[^0-9]/g, "")
    );
    if ($(this).val() == "") $(this).val(0);
  });

  $("#input_text_end_num").on("change", function () {
    current_data.goal_end_val = $(this).val();
  });

  $("#input_text_end_num").on("keyup", function () {
    $(this).val(
      $(this)
        .val()
        .replace(/[^0-9]/g, "")
    );
    if ($(this).val() == "") $(this).val(0);
  });

  ///doosan
  $("#input_text_start_num_doosan").on("change", function () {
    current_data.goal_start_val_doosan = $(this).val();
    current_doosan_num = parseInt($(this).val());
  });

  $("#input_text_start_num_doosan").on("keyup", function () {
    $(this).val(
      $(this)
        .val()
        .replace(/[^0-9]/g, "")
    );
    if ($(this).val() == "") $(this).val(0);
  });

  $("#input_text_end_num_doosan").on("change", function () {
    current_data.goal_end_val_doosan = $(this).val();
  });

  $("#input_text_end_num_doosan").on("keyup", function () {
    $(this).val(
      $(this)
        .val()
        .replace(/[^0-9]/g, "")
    );
    if ($(this).val() == "") $(this).val(0);
  });

  $("#input_text_noti_text").on("change", function () {
    current_data.goal_target_text = $(this).val();
  });

  $("#input_text_noti_text_inside").on("change", function () {
    current_data.goal_target_inside_text = $(this).val();
  });

  $("#autoInc").on("change", function () {
    current_data.goal_value_auto_add = $(this).prop("checked") ? "on" : "off";
  });

  $("#input_txt_auto_add_num").on("change", function () {
    current_data.goal_value_auto_add_val = $(this).val();
  });

  $("#input_txt_auto_add_num").on("change", function () {
    current_data.goal_value_auto_add_val = $(this).val();
  });

  $("#input_txt_auto_add_num").on("keyup", function () {
    $(this).val(
      $(this)
        .val()
        .replace(/[^0-9]/g, "")
    );
    if ($(this).val() == "") $(this).val(0);
  });

  $("#bgAni").on("change", function () {
    current_data.graph_animation = $(this).prop("checked") ? "on" : "off";
    set_bg_ani(current_data.graph_animation);
  });

  $("#gradient_1").on("click", function () {
    current_data.graph_gradient_start_color = "#bf41c4";
    current_data.graph_gradient_end_color = "#2bd4ce";
    $("#colorPicker_gradent_start").spectrum(
      "set",
      current_data.graph_gradient_start_color
    );
    $("#colorPicker_gradent_end").spectrum(
      "set",
      current_data.graph_gradient_end_color
    );
    set_gradient_goal_bar(
      current_data.graph_gradient_start_color,
      current_data.graph_gradient_end_color
    );
  });

  $("#gradient_2").on("click", function () {
    current_data.graph_gradient_start_color = "#ffb75e";
    current_data.graph_gradient_end_color = "#ffb75e";
    $("#colorPicker_gradent_start").spectrum(
      "set",
      current_data.graph_gradient_start_color
    );
    $("#colorPicker_gradent_end").spectrum(
      "set",
      current_data.graph_gradient_end_color
    );
    set_gradient_goal_bar(
      current_data.graph_gradient_start_color,
      current_data.graph_gradient_end_color
    );
  });

  $("#gradient_3").on("click", function () {
    current_data.graph_gradient_start_color = "#f5af19";
    current_data.graph_gradient_end_color = "#f12711";
    $("#colorPicker_gradent_start").spectrum(
      "set",
      current_data.graph_gradient_start_color
    );
    $("#colorPicker_gradent_end").spectrum(
      "set",
      current_data.graph_gradient_end_color
    );
    set_gradient_goal_bar(
      current_data.graph_gradient_start_color,
      current_data.graph_gradient_end_color
    );
  });

  $("#gradient_4").on("click", function () {
    current_data.graph_gradient_start_color = "#2ebf91";
    current_data.graph_gradient_end_color = "#8360c3";
    $("#colorPicker_gradent_start").spectrum(
      "set",
      current_data.graph_gradient_start_color
    );
    $("#colorPicker_gradent_end").spectrum(
      "set",
      current_data.graph_gradient_end_color
    );
    set_gradient_goal_bar(
      current_data.graph_gradient_start_color,
      current_data.graph_gradient_end_color
    );
  });

  $("#gradient_5").on("click", function () {
    current_data.graph_gradient_start_color = "#eaafc8";
    current_data.graph_gradient_end_color = "#654ea3";
    $("#colorPicker_gradent_start").spectrum(
      "set",
      current_data.graph_gradient_start_color
    );
    $("#colorPicker_gradent_end").spectrum(
      "set",
      current_data.graph_gradient_end_color
    );
    set_gradient_goal_bar(
      current_data.graph_gradient_start_color,
      current_data.graph_gradient_end_color
    );
  });

  $("#gradient_6").on("click", function () {
    current_data.graph_gradient_start_color = "#ff4b2b";
    current_data.graph_gradient_end_color = "#ff416c";
    $("#colorPicker_gradent_start").spectrum(
      "set",
      current_data.graph_gradient_start_color
    );
    $("#colorPicker_gradent_end").spectrum(
      "set",
      current_data.graph_gradient_end_color
    );
    set_gradient_goal_bar(
      current_data.graph_gradient_start_color,
      current_data.graph_gradient_end_color
    );
  });

  $("#gradient_7").on("click", function () {
    current_data.graph_gradient_start_color = "#0083b0";
    current_data.graph_gradient_end_color = "#00b4db";
    $("#colorPicker_gradent_start").spectrum(
      "set",
      current_data.graph_gradient_start_color
    );
    $("#colorPicker_gradent_end").spectrum(
      "set",
      current_data.graph_gradient_end_color
    );
    set_gradient_goal_bar(
      current_data.graph_gradient_start_color,
      current_data.graph_gradient_end_color
    );
  });

  $("#gradient_8").on("click", function () {
    current_data.graph_gradient_start_color = "#2c3e50";
    current_data.graph_gradient_end_color = "#bdc3c7";
    $("#colorPicker_gradent_start").spectrum(
      "set",
      current_data.graph_gradient_start_color
    );
    $("#colorPicker_gradent_end").spectrum(
      "set",
      current_data.graph_gradient_end_color
    );
    set_gradient_goal_bar(
      current_data.graph_gradient_start_color,
      current_data.graph_gradient_end_color
    );
  });

  $("#gradient_9").on("click", function () {
    current_data.graph_gradient_start_color = "#348ac7";
    current_data.graph_gradient_end_color = "#7474bf";
    $("#colorPicker_gradent_start").spectrum(
      "set",
      current_data.graph_gradient_start_color
    );
    $("#colorPicker_gradent_end").spectrum(
      "set",
      current_data.graph_gradient_end_color
    );
    set_gradient_goal_bar(
      current_data.graph_gradient_start_color,
      current_data.graph_gradient_end_color
    );
  });

  $("#gradient_10").on("click", function () {
    current_data.graph_gradient_start_color = "#ffedbc";
    current_data.graph_gradient_end_color = "#ed4264";
    $("#colorPicker_gradent_start").spectrum(
      "set",
      current_data.graph_gradient_start_color
    );
    $("#colorPicker_gradent_end").spectrum(
      "set",
      current_data.graph_gradient_end_color
    );
    set_gradient_goal_bar(
      current_data.graph_gradient_start_color,
      current_data.graph_gradient_end_color
    );
  });

  $("#gradient_11").on("click", function () {
    current_data.graph_gradient_start_color = "#ED4264";
    current_data.graph_gradient_end_color = "#FFEDBC";
    $("#colorPicker_gradent_start").spectrum(
      "set",
      current_data.graph_gradient_start_color
    );
    $("#colorPicker_gradent_end").spectrum(
      "set",
      current_data.graph_gradient_end_color
    );
    set_gradient_goal_bar(
      current_data.graph_gradient_start_color,
      current_data.graph_gradient_end_color
    );
  });

  $("#gradient_12").on("click", function () {
    current_data.graph_gradient_start_color = "#93f9b9";
    current_data.graph_gradient_end_color = "#1d976c";
    $("#colorPicker_gradent_start").spectrum(
      "set",
      current_data.graph_gradient_start_color
    );
    $("#colorPicker_gradent_end").spectrum(
      "set",
      current_data.graph_gradient_end_color
    );
    set_gradient_goal_bar(
      current_data.graph_gradient_start_color,
      current_data.graph_gradient_end_color
    );
  });

  $("#gradient_13").on("click", function () {
    current_data.graph_gradient_start_color = "#ffc500";
    current_data.graph_gradient_end_color = "#c21500";
    $("#colorPicker_gradent_start").spectrum(
      "set",
      current_data.graph_gradient_start_color
    );
    $("#colorPicker_gradent_end").spectrum(
      "set",
      current_data.graph_gradient_end_color
    );
    set_gradient_goal_bar(
      current_data.graph_gradient_start_color,
      current_data.graph_gradient_end_color
    );
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
    // console.log("btn_save~~~~~~~~~~~~~~~~~~~ : ", current_data)
    savePreset(current_preset_div, current_data);
  });

  $("#btn_reset").on("click", function () {
    // console.log("btn_reset")
    reset_setting();
  });
  $("#btn_flex").on("click", function () {
    var numOfFlex = $("#val_flex").val();
    // console.log("btn_flex", numOfFlex)
    addFlexNum(numOfFlex);
    testmessage_to_server("4", numOfFlex);
  });
  $("#btn_win_reset").on("click", function () {
    // console.log("btn_win_reset")
    //서버로 알린다.
    // testmessage_to_server("2" , "");
    myModal2.show();
  });
  $("#btn_reset_ok3").on("click", function () {
    // console.log("btn_reset_ok3")
    //서버로 알린다.
    //  myModal2.show();
    testmessage_to_server("2", "");
  });
  $("#btn_win_reload").on("click", function () {
    testmessage_to_server("1", "");
    //서버로 알린다.
  });
  $("#btn_open_pop").on("click", function () {
    var url = $("#urlCopy").val();
    //  console.log("btn_open_pop url", url);
    openWin(url, "플렉스", 500, 500);
  });
}
////////////////////////////////////////////////////////////////////핸들

function testmessage_to_server(_type, _msg) {
  var param = {};
  param.type = "target";
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
          //   console.log("서버로 성공적으로 보냄")
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
  $(".goal-bar-area").css("opacity", t_val);
}

function pre_handle_chat_font(_className) {
  if (current_data) current_data.font_name = _className;

  $(".goal-bar-area").removeClass(prev_font_name);
  $(".font-preview").removeClass(prev_font_name);

  $(".goal-bar-area").addClass(_className);
  $(".font-preview").addClass(_className);

  prev_font_name = _className;
}

function pre_handle_chat_font_bold(_flag) {
  if (current_data) {
    if (_flag) {
      current_data.font_bold = "on";
      $(".goal-bar-area").addClass("font-weight-bold");
    } else {
      current_data.font_bold = "off";
      $(".goal-bar-area").removeClass("font-weight-bold");
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

function set_slide_graph_border_init() {
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
    $(".goal-box").css("height", spVal02.value + "px");

    var t_val = parseInt(spVal02.value * 0.2) + 1;
    //console.log("sssss:", t_val)
    $(".baseline").css("strokeWidth", t_val + "px");
    $(".mainline").css("strokeWidth", t_val + "px");

    if (current_data) current_data.graph_border = spVal02.value;
  });
}

function set_slide_target_repeat_init() {
  slide_target_repeat = document.getElementById("slide_target_repeat");
  var spVal02 = document.getElementById("slide_target_repeat_val");

  noUiSlider.create(slide_target_repeat, {
    start: 1,
    connect: "lower",
    step: 1,
    range: {
      min: 0,
      max: 100,
    },
  });

  slide_target_repeat.noUiSlider.on("update", function (values, handle) {
    spVal02.value = parseInt(values[handle]);
    if (current_data) {
      current_data.goal_target_repeat_time = spVal02.value;
      start_goal_change_timer();
    }
  });
}

function set_graph_text_only(_toggle) {
  if (_toggle == "on") {
    if ($(".goal-bar-area").hasClass("bar-none"))
      $(".goal-bar-area").removeClass("bar-none");
    $(".goal-bar-area").addClass("bar-none");
  } else if (_toggle == "off") {
    $(".goal-bar-area").removeClass("bar-none");
  }
}

function set_bg_ani(_toggle) {
  if (_toggle == "on") {
    if ($(".goal-bar-area").hasClass("progress-ani"))
      $(".goal-bar-area").removeClass("progress-ani");
    $(".goal-bar-area").addClass("progress-ani");
  } else if (_toggle == "off") {
    $(".goal-bar-area").removeClass("progress-ani");
  }
}

function set_goal_bar(_type) {
  //console.log("set_goal_bar:", _type, current_flex_num)
  var str_1 = current_data.goal_target_text;
  var str_2 = current_data.goal_target_inside_text;

  var pre;
  var restr_1;
  var restr_2;

  // var targetPer = parseInt(current_data.goal_end_val) - parseInt(current_data.goal_start_val);
  var targetPer = parseInt(current_data.goal_end_val);
  var endVal = parseInt(current_data.goal_end_val);

  // var targetPer_doosan = parseInt(current_data.goal_end_val_doosan) - parseInt(current_data.goal_start_val_doosan);
  var targetPer_doosan = parseInt(current_data.goal_end_val_doosan);
  var endVal_doosan = parseInt(current_data.goal_end_val_doosan);

  if (current_data.goal_value_auto_add == "on") {
    if (parseInt(current_data.goal_end_val) <= current_flex_num) {
      // targetPer = (current_flex_num + parseInt(current_data.goal_value_auto_add_val)) - parseInt(current_data.goal_start_val);
      targetPer =
        current_flex_num + parseInt(current_data.goal_value_auto_add_val);
      endVal =
        current_flex_num + parseInt(current_data.goal_value_auto_add_val);
    }

    if (parseInt(current_data.goal_end_val_doosan) <= current_doosan_num) {
      // targetPer_doosan = (current_flex_num + parseInt(current_data.goal_value_auto_add_val)) - parseInt(current_data.goal_start_val_doosan);
      targetPer_doosan =
        current_doosan_num + parseInt(current_data.goal_value_auto_add_val);
      endVal_doosan =
        current_doosan_num + parseInt(current_data.goal_value_auto_add_val);
    }
  }

  if (_type == "flex") {
    pre = Math.floor((current_flex_num / targetPer) * 100);
    // restr_1 = str_1.replace("{목표종류}", "플렉스");
    restr_1 = g_replaceAll(str_1, "{목표종류}", "플렉스");

    // restr_2= str_2.replace("{목표값}", numberWithCommas(current_flex_num)).replace("{개}", "개").replace("{목표퍼센트}", pre + "%");
    var tempTxt = g_replaceAll(
      str_2,
      "{목표값}",
      numberWithCommas(current_flex_num)
    );
    tempTxt = g_replaceAll(tempTxt, "{개}", "개");
    restr_2 = g_replaceAll(tempTxt, "{목표퍼센트}", pre + "%");
    // svgTxtAdd(current_flex_num, _type )
  } else if (_type == "doosan") {
    pre = Math.floor((current_doosan_num / targetPer_doosan) * 100);
    // restr_1 = str_1.replace("{목표종류}", "두산");
    restr_1 = g_replaceAll(str_1, "{목표종류}", "두산");

    var tempTxt = g_replaceAll(
      str_2,
      "{목표값}",
      numberWithCommas(current_doosan_num)
    );
    tempTxt = g_replaceAll(tempTxt, "{개}", "두산");
    restr_2 = g_replaceAll(tempTxt, "{목표퍼센트}", pre + "%");
    // svgTxtAdd(current_doosan_num, _type )
    //restr_2= str_2.replace("{목표값}", numberWithCommas(current_doosan_num)).replace("{개}", "두산").replace("{목표퍼센트}", pre + "%");
  }

  var bar_per = 100 - pre;
  if (bar_per < 0) {
    bar_per = 0;
  }
  svgTxtAdd(restr_2);

  $(".goal-inner").css("width", bar_per + "%");
  $(".goal-tit").text(restr_1);
  $(".inner-txt").text(restr_2);

  if (_type == "flex") {
    // $('.goal_start').children(".value").text(numberWithCommas(current_data.goal_start_val));
    $(".goal_start").children(".value").text(numberWithCommas("0"));
    $(".goal_end").children(".value").text(numberWithCommas(endVal));
  } else if (_type == "doosan") {
    // $('.goal_start').children(".value").text(numberWithCommas(current_data.goal_start_val_doosan));
    $(".goal_start").children(".value").text(numberWithCommas("0"));
    $(".goal_end").children(".value").text(numberWithCommas(endVal_doosan));
  }

  m_psCircle.set(
    pre /* target value. */,
    true /* enable animation. default is true */
  );

  m_psHeart.set(
    pre /* target value. */,
    true /* enable animation. default is true */
  );

  m_psStar.set(
    pre /* target value. */,
    true /* enable animation. default is true */
  );

  m_psFan.set(
    pre /* target value. */,
    true /* enable animation. default is true */
  );

  $(".pro-title").text(restr_1);
}

// 텍스트 추가
// text 추가 관련 class
// 두산/t-doo, 하트/t-heart, 후원/t-gift
function svgTxtAdd(st_val) {
  var isClass = $(".ldBar.pNone");
  if (isClass) {
    $(".temp_str_aaa").remove();
    isClass.append(
      '<span class="ldBar-label t2 temp_str_aaa"  style="color:' +
      current_data.goal_text_inside_color +
      '">' +
      st_val +
      "</span>"
    );
  }
}

// css rule 추가
function addCSSRule(sheet, selector, rules, index) {
  if ("insertRule" in sheet) {
    sheet.insertRule(selector + "{" + rules + "}", index);
  } else if ("addRule" in sheet) {
    sheet.addRule(selector, rules, index);
  }
}

function addFlexNum(num) {
  var num = parseInt(num);
  if (isNaN(num)) return;
  if (current_doosan_num + 1 == num) {
    current_doosan_num = parseInt(current_doosan_num) + 1;
  }
  current_flex_num = parseInt(current_flex_num) + num;
  set_goal_bar(current_bar_type);
}

function change_goal_type() {
  if (current_bar_type == "flex") {
    if (current_data.goal_type_2 == "on") {
      current_bar_type = "doosan";
    }
  } else if (current_bar_type == "doosan") {
    if (current_data.goal_type_1 == "on") {
      current_bar_type = "flex";
    }
  }
  addFlexNum(0);
}

var interval_goal_change;
function start_goal_change_timer() {
  if (interval_goal_change) {
    //console.log("clearInterval")
    clearInterval(interval_goal_change);
  }
  //console.log("setInterval~11", current_data.goal_target_repeat_time)
  if (parseInt(current_data.goal_target_repeat_time) == 0) return;
  interval_goal_change = setInterval(function () {
    //console.log("setInterval~")
    change_goal_type();
  }, parseInt(current_data.goal_target_repeat_time) * 1000);
}

function setDisplay(_data) {
  //console.log("setDisplay~~")
  // current_flex_num = 50;
  // current_doosan_num = 10;
  current_flex_num = parseInt(_data.goal_start_val);
  current_doosan_num = parseInt(_data.goal_start_val_doosan);

  $(".goal-bar-area").css("visibility", "visible");
  visibleGraph(_data.graph_type);

  var chatOpt = document.getElementById("sliderChatOpacity");
  chatOpt.noUiSlider.set(_data.win_transparency);
  prev_set_transparency(_data.win_transparency);
  $("input[name=graphType][value=" + _data.graph_type + "]").prop(
    "checked",
    true
  );
  $("input[name=gDrection][value=" + _data.graph_dir + "]").prop(
    "checked",
    true
  );
  slide_graph_border.noUiSlider.set(_data.graph_border);
  $("#gTxtYn").prop("checked", _data.graph_only_text == "on");
  set_graph_text_only(_data.graph_only_text);
  addFlexNum(0);
  $("#chk_sp_1").prop("checked", _data.goal_type_1 == "on");
  $("#chk_sp_2").prop("checked", _data.goal_type_2 == "on");

  if (_data.goal_type_1 == "on") {
    $("#chkGift").css("display", "block");
  } else {
    $("#chkGift").css("display", "none");
  }

  if (_data.goal_type_2 == "on") {
    $("#chkDoosan").css("display", "block");
  } else {
    $("#chkDoosan").css("display", "none");
  }

  $("#input_text_start_num").val(_data.goal_start_val);
  $("#input_text_end_num").val(_data.goal_end_val);

  $("#input_text_start_num_doosan").val(_data.goal_start_val_doosan);
  $("#input_text_end_num_doosan").val(_data.goal_end_val_doosan);

  $("#input_text_noti_text").text(_data.goal_target_text);
  $("#input_text_noti_text_inside").text(_data.goal_target_inside_text);

  $("#autoInc").prop("checked", _data.goal_value_auto_add == "on");
  $("#input_txt_auto_add_num").val(_data.goal_value_auto_add_val);

  slide_target_repeat.noUiSlider.set(_data.goal_target_repeat_time);
  start_goal_change_timer();

  setTextColor($("#color_font"), _data.goal_text_outside_color);
  setTextColor_out(_data.goal_text_outside_color);

  setTextColor($("#color_font_inside"), _data.goal_text_inside_color);
  setTextColor_in(_data.goal_text_inside_color);

  set_gradient_goal_bar(
    _data.graph_gradient_start_color,
    _data.graph_gradient_end_color
  );
  set_inside_goal_bar(_data.graph_background_color);

  set_graph_goal_circle(_data.graph_circle_color);

  setTextColor(
    $("#colorPicker_gradent_start"),
    _data.graph_gradient_start_color
  );
  setTextColor($("#colorPicker_gradent_end"), _data.graph_gradient_end_color);
  setTextColor($("#colorPicker_gradent_inside"), _data.graph_background_color);
  setTextColor($("#colorPicker_graph_circle"), _data.graph_circle_color);

  $("#bgAni").prop("checked", _data.graph_animation == "on");

  set_bg_ani(_data.graph_animation);

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
      //console.log(" $(this) :",  $(this), e);
      switch ($(this).attr("id")) {
        case "color_font":
          current_data.goal_text_outside_color = $(this).val();
          setTextColor_out(current_data.goal_text_outside_color);
          break;
        case "color_font_inside":
          current_data.goal_text_inside_color = $(this).val();
          setTextColor_in(current_data.goal_text_inside_color);
          break;
        case "colorPicker_gradent_start":
          current_data.graph_gradient_start_color = $(this).val();
          set_gradient_goal_bar(
            current_data.graph_gradient_start_color,
            current_data.graph_gradient_end_color
          );
          break;
        case "colorPicker_gradent_end":
          current_data.graph_gradient_end_color = $(this).val();
          set_gradient_goal_bar(
            current_data.graph_gradient_start_color,
            current_data.graph_gradient_end_color
          );
          break;
        case "colorPicker_gradent_inside":
          current_data.graph_background_color = $(this).val();
          set_inside_goal_bar(current_data.graph_background_color);
          break;
        case "colorPicker_graph_circle":
          current_data.graph_circle_color = $(this).val();
          set_graph_goal_circle(current_data.graph_circle_color);
          break;
      }
    },
  });
}

function set_graph_goal_circle(color) {
  $(".mainline").css("stroke", color);
}

function set_inside_goal_bar(color) {
  $(".goal-inner").css("background-color", color);
  $(".baseline").css("stroke", color);
}

function set_gradient_goal_bar(_start, _end) {
  $(".goal-bar").css({
    background: _start,
    background:
      "-moz-linear-gradient(left, " + _start + " 0%, " + _end + " 100%)",
    background:
      "-webkit-linear-gradient(left, " + _start + " 0%, " + _end + " 100%)",
    background:
      "linear-gradient(to right, " + _start + " 0%, " + _end + " 100%)",
  });
}

function setTextColor_out(color) {
  $(".goal-tit").css("color", color);
  $(".goal_start").css("color", color);
  $(".goal_end").css("color", color);
  $(".pro-title").css("color", color);
}

function setTextColor_in(color) {
  $(".inner-txt").css("color", color);
  $(".ldBar-label").css("color", color);
}

////////////////////////////////////////////////////////////////////셋팅
//font Stroke
function prev_chat_fontStroke() {
  var strokeSize = $("#fontBorderVal").val();
  strokeColor = $("#fontStrokeColor").val();
  fontSize = $("#fontSizeVal").val();

  $(".goal-bar-area").css("font-size", fontSize + "px");
  $(".goal-bar-area").css("text-shadow", "");

  for (var angle = 0; angle < 2 * Math.PI; angle += 1 / strokeSize) {
    appendShadow(
      $(".goal-bar-area"),
      Math.cos(angle) * strokeSize,
      Math.sin(angle) * strokeSize,
      strokeColor
    );
  }
}

function pre_set_chat_font_size(_size) {
  $(".goal-bar-area").css("font-size", _size + "px");
}

function pre_set_chat_font_bold(_toggle) {
  if (_toggle == "on") {
    $(".goal-bar-area").addClass("font-weight-bold");
    $(".font-preview").addClass("font-preview-bold");
  } else {
    $(".goal-bar-area").removeClass("font-weight-bold");
    $(".font-preview").removeClass("font-preview-bold");
  }
}

function pre_set_chat_font(_className) {
  if (prev_font_name) {
    if ($(".goal-bar-area").hasClass(prev_font_name))
      $(".goal-bar-area").removeClass(prev_font_name);
    if ($(".font-preview").hasClass(prev_font_name))
      $(".font-preview").removeClass(prev_font_name);
  }

  $(".goal-bar-area").addClass(_className);
  $(".font-preview").addClass(_className);
  prev_font_name = _className;
}

function prev_set_transparency(_temp) {
  //console.log("prev_set_transparency", _temp );
  _temp = 100 - _temp;
  var t_val = _temp * 0.01;
  $(".goal-bar-area").css("opacity", t_val);
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
