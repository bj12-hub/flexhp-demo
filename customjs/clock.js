axios.defaults.withCredentials = true;
var current_preset_id;
var current_preset_div;
var current_data;
//var arr_preset_list = [];
var current_preset_type = "clock";
var prev_font_name;

var myModal = new bootstrap.Modal(document.getElementById("setupCompleted"), {
  keyboard: false,
});

function init() {
  if (localStorage.getItem("preset_id_clock") == null) {
  } else {
    current_preset_id = localStorage.getItem("preset_id_clock");
  }

  chatOpacity_my();

  addEvent();
  $(".preset-list-box").empty();

  setTimeout(getPresetList, 100);
}

function clockType1() {
  var clockT1;
  clockT1 = $(".clock").FlipClock({
    clockFace: "TwentyFourHourClock",
    autoStart: true,
  });
}

function selectPresetBtn(t_div) {
  current_preset_id = t_div.attr("id");
  current_preset_div = t_div;
  localStorage.setItem("preset_id_clock", current_preset_id);
  t_div.addClass("selected").siblings().removeClass("selected");
  $("#urlCopy").val(current_preset_div.attr("url"));

  //console.log("selectPresetBtn :" , current_preset_div.attr('data_list'))
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
  var jsonObj = {};

  jsonObj.win_transparency = 0;

  jsonObj.clock_type = "테마1";

  jsonObj.clock_background_use = "사용안함";
  jsonObj.clock_background_color = "#ffffff";

  //console.log("createDefaultJson:", JSON.stringify(jsonObj))

  return JSON.stringify(jsonObj);
}

function addEvent() {
  addEventPreset();
  // console.log("goaljs  addEvent ~~~~~~~~~~~~~")

  $("input[name=timeType]").on("input", function () {
    current_data.clock_type = $(this).val();
    select_clock_type(current_data.clock_type);
  });

  $("input[name=bgYn]").on("input", function () {
    current_data.clock_background_use = $(this).val();

    if (current_data.clock_background_use == "사용안함") {
      $(".clock-area").css("background", "");
    } else if (current_data.clock_background_use == "배경색상") {
      $(".clock-area").css("background", current_data.clock_background_color);
    }
  });

  $("#btn_save").on("click", function () {
    //  console.log("btn_save : ", current_data)
    savePreset(current_preset_div, current_data);
  });

  $("#btn_reset").on("click", function () {
    // console.log("btn_reset")
    reset_setting();
  });

  $("#val_flex").on("keyup", function () {
    $(this).val(
      $(this)
        .val()
        .replace(/[^0-9]/g, "")
    );
  });

  //////////////////////////
  $("#btn_flex").on("click", function () {
    //  console.log("btn_flex")
    // var numOfFlex = $('#val_flex').val();
    // pushNoti_image("플렉스티비", "님께서 "+ numOfFlex + "개를 선물하셨습니다." );
    // testmessage_to_server("4" , numOfFlex);
  });

  $("#btn_recommend").on("click", function () {
    //  console.log("btn_recommend ")
    // testmessage_to_server("3" , "");
  });

  $("#btn_win_reset").on("click", function () {
    //   console.log("btn_win_reset")
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
    //openWin(url, "플렉스", 500, 500)
    window.open(url, "new", "width=500,height=500");
  });
}

function testmessage_to_server(_type, _msg) {
  var param = {};
  param.type = "clock";
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

function select_clock_type(_str) {
  // console.log("select_clock_type :", _str)
  var classNmae;

  if (_str == "테마1") {
    classNmae = "clock-type-1";
  } else if (_str == "테마2") {
    classNmae = "clock-type-2";
  } else if (_str == "테마3") {
    classNmae = "clock-type-3";
  }

  if ($(".clock-area").hasClass("clock-type-1"))
    $(".clock-area").removeClass("clock-type-1");
  if ($(".clock-area").hasClass("clock-type-2"))
    $(".clock-area").removeClass("clock-type-2");
  if ($(".clock-area").hasClass("clock-type-3"))
    $(".clock-area").removeClass("clock-type-3");
  $(".clock-area").addClass(classNmae);
}

function setDisplay(_data) {
  //console.log("setDisplay~~", _data)
  clockType1();
  var chatOpt = document.getElementById("sliderChatOpacity");
  chatOpt.noUiSlider.set(_data.win_transparency);
  prev_set_transparency(_data.win_transparency);

  $("input[name=timeType][value=" + _data.clock_type + "]").prop(
    "checked",
    true
  );
  select_clock_type(_data.clock_type);

  $("input[name=bgYn][value=" + _data.clock_background_use + "]").prop(
    "checked",
    true
  );

  setTextColor($("#colorPicker_clock_bg"), _data.clock_background_color);

  if (_data.clock_background_use == "배경색상") {
    $(".clock-area").css("background", _data.clock_background_color);
  } else if (_data.clock_background_use == "사용안함") {
    $(".clock-area").css("background", "");
  }
  $(".spinner-border").css("display", "none");
}

// slider 투명도
function chatOpacity_my() {
  var chatOpt = document.getElementById("sliderChatOpacity");
  var optVal = document.getElementById("opacityVal");

  noUiSlider.create(chatOpt, {
    start: 0,
    connect: "lower",
    step: 1,
    range: {
      min: 0,
      max: 100,
    },
  });

  chatOpt.noUiSlider.on("update", function (values, handle) {
    optVal.value = parseInt(values[handle]);
    prev_handle_transparency(optVal.value);
  });
}

////////////////////////////////////////////////////////////////////핸들
function prev_handle_transparency(_temp) {
  if (current_data) current_data.win_transparency = _temp;
  _temp = 100 - _temp;
  var t_val = _temp * 0.01;
  $(".clock-area").css("opacity", t_val);
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
      // console.log(" $(this) :", $(this), e);
      switch ($(this).attr("id")) {
        case "colorPicker_clock_bg":
          current_data.clock_background_color = $(this).val();
          if (current_data.clock_background_use == "배경색상") {
            $(".clock-area").css(
              "background",
              current_data.clock_background_color
            );
          }
          break;
      }
    },
    // move: function(color){
    //     console.log('background-color~~~',color.toHex8String());
    // }
  });
}

function prev_set_transparency(_temp) {
  // console.log("prev_set_transparency", _temp);
  _temp = 100 - _temp;
  var t_val = _temp * 0.01;
  $(".clock-area").css("opacity", t_val);
}

g_login_checking(login_callbackFn);

function login_callbackFn(member) {
  // console.log("login_callbackFn", member)
  init();
  if (member.IMG_URL && member.IMG_URL != "") {
    //  console.log("~~~~~~~~~~~~", member.IMG_URL)
    $("#user_pic").find("img").attr("src", member.IMG_URL);
  }

  $("#user_name").text(member.NAME);
  $("#user_mid").text("(" + member.MID + ")");
}

copyText();
presetSortable();
//clipboard
function copyText() {
  var clipboard = new ClipboardJS(".btn-copy");

  clipboard.on("success", function (e) {
    alert("복사되었습니다. \n" + e.text);
  });
  clipboard.on("error", function (e) {
    alert("실패하였습니다. 다시 시도하여 주세요.");
  });
}

//sortable js
function presetSortable() {
  var sortTable = document.getElementById("sortList");
  new Sortable(sortTable, {
    animation: 150,
  });
}

function openWin(pUrl, pName, pW, pH) {
  var winPop = window.open(
    pUrl,
    pName,
    "width=" +
    pW +
    ",height=" +
    pH +
    ",top=0,left=0,toolbars=no,menubars=no,scrollbars=no,location=no,resizable=no"
  );
  winPop.focus();
}

//console.log("~~~~~~~~~~~~~~~~~~~~~~~~nnn")
