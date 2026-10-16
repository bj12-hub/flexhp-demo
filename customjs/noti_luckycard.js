axios.defaults.withCredentials = true;

var current_preset_id;
var current_preset_div;
var current_data;
var current_preset_type = "luckycard";
var prevFont_1;
var prevFont_2;
var prevFont_3;
var myModal = new bootstrap.Modal(document.getElementById("setupCompleted"), {
  keyboard: false,
});

function selectPresetBtn(t_div) {
  current_preset_id = t_div.attr("id");
  current_preset_div = t_div;
  localStorage.setItem("preset_id_luckycard", current_preset_id);
  t_div.addClass("selected").siblings().removeClass("selected");
  $("#urlCopy").val(current_preset_div.attr("url"));

  //console.log("selectPresetBtn :" , current_preset_div.attr('data_list'))
  current_data = JSON.parse(current_preset_div.attr("data_list"));
  // console.log("current_data :", current_data)
  setDisplay(current_data);
}

function init() {
  // $(".chat-list").empty();
  if (localStorage.getItem("preset_id_luckycard") == null) {
  } else {
    current_preset_id = localStorage.getItem("preset_id_luckycard");
  }

  $(".preset-list").css("visibility", "hidden");

  addEvent();
  $(".preset-list-box").empty();
  setTimeout(getPresetList, 100);
}

function createDefaultJson() {
  var jsonObj = {};

  jsonObj.isAvailable = "off";

  jsonObj.min_lex = "100";
  jsonObj.payback_time = "15";
  jsonObj.noti_text = "{닉네임}님 플렉스{개수}개 럭키카드를 등록하셨습니다.";
  jsonObj.noti_type = "알림음성";
  jsonObj.is_chat_voice = "on";

  jsonObj.nick_font_name = "ff-28";
  jsonObj.nick_font_bold = "off";
  jsonObj.nick_font_size = 16;
  jsonObj.nick_font_color = "#00FFF6";

  jsonObj.lex_font_name = "ff-28";
  jsonObj.lex_font_bold = "off";
  jsonObj.lex_font_size = 16;
  jsonObj.lex_font_color = "#ffffff";

  jsonObj.time_font_name = "ff-28";
  jsonObj.time_font_bold = "off";
  jsonObj.time_font_size = 16;
  jsonObj.time_font_color = "#ffffff";
  return JSON.stringify(jsonObj);
}

function addEvent() {
  addEventPreset();

  $("#btn_open_pop").on("click", function () {
    var url = $("#urlCopy").val();
    // console.log("btn_open_pop url", url);
    openWin(url, "플렉스", 500, 500);
  });

  $("#giftYn").on("change", function () {
    current_data.isAvailable = $(this).prop("checked") ? "on" : "off";
    // console.log("current_data: ", current_data)
  });

  $("#input_txt_gift_start").on("keyup", function () {
    $(this).val(
      $(this)
        .val()
        .replace(/[^0-9]/g, "")
    );
  });

  $("#input_txt_gift_start").on("change", function () {
    var minlex = parseInt($(this).val());
    if (minlex < 100) {
      $(this).val(100);
      current_data.min_lex = 100;
      alert("100이하는 입력할 수 없습니다.");
    } else {
      current_data.min_lex = parseInt($(this).val());
    }
  });

  $("input[name=autoReturn]").on("input", function () {
    current_data.payback_time = $(this).val();
  });

  $("input[name=notiSys]").on("input", function () {
    current_data.noti_type = $(this).val();
  });

  $("#notiTxtArea1").on("change", function () {
    current_data.noti_text = $(this).val();
  });

  $("#chVoiceYn").on("change", function () {
    current_data.is_chat_voice = $(this).prop("checked") ? "on" : "off";
  });

  $("#nicknameFontBold").on("change", function () {
    if ($(this).prop("checked")) {
      $(".nick-color").addClass("font-weight-bold");
      current_data.nick_font_bold = "on";
    } else {
      $(".nick-color").removeClass("font-weight-bold");
      current_data.nick_font_bold = "off";
    }
  });

  $("#rewardFontBold").on("change", function () {
    if ($(this).prop("checked")) {
      $(".reward-color").addClass("font-weight-bold");
      current_data.lex_font_bold = "on";
    } else {
      $(".reward-color").removeClass("font-weight-bold");
      current_data.lex_font_bold = "off";
    }
  });

  $("#timeFontBold").on("change", function () {
    if ($(this).prop("checked")) {
      $(".time-color").addClass("font-weight-bold");
      current_data.time_font_bold = "on";
    } else {
      $(".time-color").removeClass("font-weight-bold");
      current_data.time_font_bold = "off";
    }
  });

  $("#btn_save").on("click", function () {
    //console.log("current_preset_div", current_preset_div, current_data)
    savePreset(current_preset_div, current_data);
  });

  $("#btn_reset").on("click", function () {
    reset_setting();
  });
}

function reset_setting() {
  //console.log("current_data :", current_data)
  var defult_data = createDefaultJson();
  current_preset_div.attr("data_list", defult_data);
  current_data = JSON.parse(current_preset_div.attr("data_list"));

  savePreset(current_preset_div, current_data);

  setTimeout(function () {
    window.location.reload();
  }, 1000);
}

function setDisplay(_data) {
  //console.log("setDisplay~~", _data)
  $(".spinner-border").css("display", "none");

  $("#giftYn").prop("checked", _data.isAvailable == "on");
  $("#input_txt_gift_start").val(parseInt(_data.min_lex));
  $("input[name=autoReturn][value=" + _data.payback_time + "]").prop(
    "checked",
    true
  );
  $("input[name=notiSys][value=" + _data.noti_type + "]").prop("checked", true);


  // 재화변경에따른 데이터 변경
  if (needsCurrencyConversion(_data.noti_text)) {
    const noti_text = replaceCurrencyInNotiText(_data.noti_text);
    $("#notiTxtArea1").val(noti_text);
    current_data.noti_text = noti_text;
  } else {
    $("#notiTxtArea1").val(_data.noti_text);
  }

  $("#chVoiceYn").prop("checked", _data.is_chat_voice == "on");

  //var ff_str = get_font_str_from_value(_data.nick_font_name);
  //console.log("ddddd:", ff_str)
  //$('#fontSelect1').html(ff_str);
  // $('#fontSelect1').attr('value', _data.nick_font_name);
  var isFontBold1 = _data.nick_font_bold == "on";
  $("#nicknameFontBold").prop("checked", isFontBold1);
  var fontNick = document.getElementById("fontSelect1");
  var fontViewList1 = document.getElementById("font-view-list1");
  var nickFontFamily = document.getElementById("nickNamefontFamily");
  setFontFamily(fontNick, _data.nick_font_name, nickFontFamily, fontViewList1);
  setFontSize(
    _data.nick_font_size,
    "slide_nick_font_size",
    "slide_nick_font_size_val",
    isFontBold1
  );

  var isFontBold2 = _data.lex_font_bold == "on";
  $("#rewardFontBold").prop("checked", isFontBold2);
  var fontLex = document.getElementById("fontSelect2");
  var fontViewList2 = document.getElementById("font-view-list2");
  var rewardFontFamily = document.getElementById("rewardFontFamily");
  setFontFamily(fontLex, _data.lex_font_name, rewardFontFamily, fontViewList2);
  setFontSize(
    _data.lex_font_size,
    "slide_reward_font_size",
    "slide_reward_font_size_val",
    isFontBold2
  );

  var isFontBold3 = _data.time_font_bold == "on";
  $("#timeFontBold").prop("checked", isFontBold3);
  var fontTime = document.getElementById("fontSelect3");
  var fontViewList3 = document.getElementById("font-view-list3");
  var timeFontFamily = document.getElementById("timeFontFamily");
  setFontFamily(fontTime, _data.time_font_name, timeFontFamily, fontViewList3);
  setFontSize(
    _data.time_font_size,
    "slide_time_font_size",
    "slide_time_font_size_val",
    isFontBold3
  );

  // var $nickFontSize = $(".nick-color");
  // if(isBold)$nickFontSize.addClass('font-weight-bold');
  // $nickFontSize.css('font-size', fontSize + 'px');

  setTextColor($("#colorPicker_nick_color"), _data.nick_font_color);
  setTextColor($("#colorPicker_reward_color"), _data.lex_font_color);
  setTextColor($("#colorPicker_time_color"), _data.time_font_color);

  var $nickFontSize = $(".nick-color");
  if (_data.nick_font_bold == "on") $nickFontSize.addClass("font-weight-bold");
  $nickFontSize.css("font-size", _data.nick_font_size + "px");
  $nickFontSize.css("color", _data.nick_font_color);
  $nickFontSize.addClass(_data.nick_font_name);
  prevFont_1 = _data.nick_font_name;

  var $rewardColor = $(".reward-color");
  if (_data.lex_font_bold == "on") $nickFontSize.addClass("font-weight-bold");
  $rewardColor.css("font-size", _data.lex_font_size + "px");
  $rewardColor.css("color", _data.lex_font_color);
  $rewardColor.addClass(_data.lex_font_name);
  prevFont_2 = _data.lex_font_name;

  var $timeColor = $(".time-color");
  if (_data.time_font_bold == "on") $nickFontSize.addClass("font-weight-bold");
  $timeColor.css("font-size", _data.time_font_size + "px");
  $timeColor.css("color", _data.time_font_color);
  $timeColor.addClass(_data.time_font_name);
  prevFont_3 = _data.time_font_name;
}

function setFontFamily(element, font_name, fontFamily, fontViewList) {
  //console.log('element, font_name, fontFamily, fontViewList', element, font_name, fontFamily, fontViewList)
  var fontTag = element;
  var ff_str = get_font_str_from_value(font_name);
  element.innerHTML = ff_str;
  // console.log("aaaa:", element, ff_str, get_font_str_from_value(font_name))
  initFont(fontTag, ff_str, fontFamily);
  // set 리스트 추가
  $(fontFamily.children).each(function () {
    var img = $(this).attr("data-thumbnail");
    var text = this.innerText;
    var value = $(this).val();
    var item =
      '<li><img src="' +
      img +
      '" alt="" value="' +
      value +
      '"/><span>' +
      text +
      "</span></li>";
    fontViewList.innerHTML += item;
  });
}

function initFont(_target, _value, _select) {
  // console.log('target', _target, _value, _select);

  $(_select.children).each(function () {
    if (_value == this.value) {
      var img = $(this).attr("data-thumbnail");
      var text = this.innerText;
      var value = $(this).val();
      var item =
        '<li><img src="' +
        img +
        '" alt="" value="' +
        value +
        '"/><span>' +
        text +
        "</span></li>";
      _target.innerHTML = item;
      return false;
    }
  });
}

//폰트 설정 select
function fontFamilyLuckycard(e, num) {
  var target = e.parentElement.previousElementSibling;
  var selectOption = target.children;
  var fontList = e.nextElementSibling.children[0];
  //console.log('e', e, target, selectOption, fontList, fontList.children.length);

  $(e.nextElementSibling).toggle();

  $(fontList.children).click(function () {
    var img = $(this).find("img").attr("src");
    var value = $(this).find("img").attr("value");
    var text = this.innerText;
    var item =
      '<li><img src="' + img + '" alt="" /><span>' + text + "</span></li>";

    $(e).html(item).val(value);
    $(e).next().css("display", "none");

    changeFontFamily(num);
    // .siblings().css({"border": "2px solid red"});
  });
}

// slider 폰트 사이즈
function setFontSize(startVal, slideID, sizeValID, isBold) {
  var fs = document.getElementById(slideID);
  var fsVal = document.getElementById(sizeValID);

  //console.log('setFontSize:', startVal, slideID, sizeValID, isBold )

  if (!fs) return;
  noUiSlider.create(fs, {
    start: startVal,
    connect: "lower",
    step: 2,
    range: {
      min: 12,
      max: 60,
    },
  });

  fs.noUiSlider.on("update", function (values, handle) {
    fsVal.value = parseInt(values[handle]);
    //console.log('슬라이더', fsVal, values, handle);

    if (slideID == "slide_nick_font_size") {
      changeFontSize_nick(isBold);
    } else if (slideID == "slide_reward_font_size") {
      changeFontSize_lex(isBold);
    } else if (slideID == "slide_time_font_size") {
      changeFontSize_time(isBold);
    }

    // pre_handle_chat_font_size()
  });

  fsVal.addEventListener("change", function () {
    fs.noUiSlider.set(this.value);
  });
}

g_login_checking(login_callbackFn);
function login_callbackFn(member) {
  //console.log("login_callbackFn", member )
  init();
  if (member.IMG_URL && member.IMG_URL != "") {
    $("#user_pic").find("img").attr("src", member.IMG_URL);
  }

  $("#user_name").text(member.NAME);
  $("#user_mid").text("(" + member.MID + ")");
}

// 폰트 사이즈 변경
function changeFontSize_nick(isBold) {
  var fontSize = $("#slide_nick_font_size_val").val();
  // update css
  current_data.nick_font_size = fontSize;

  var $nickFontSize = $(".nick-color");
  if (isBold) $nickFontSize.addClass("font-weight-bold");
  $nickFontSize.css("font-size", fontSize + "px");
}

// 폰트 사이즈 변경
function changeFontSize_lex(isBold) {
  var fontSize = $("#slide_reward_font_size_val").val();
  // update css
  current_data.lex_font_size = fontSize;
  var $lexFontSize = $(".reward-color");
  if (isBold) $lexFontSize.addClass("font-weight-bold");
  $lexFontSize.css("font-size", fontSize + "px");
}

// 폰트 사이즈 변경
function changeFontSize_time(isBold) {
  var fontSize = $("#slide_time_font_size_val").val();
  // update css
  current_data.time_font_size = fontSize;
  var $timeFontSize = $(".time-color");
  if (isBold) $timeFontSize.addClass("font-weight-bold");
  $timeFontSize.css("font-size", fontSize + "px");
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
        case "colorPicker_nick_color":
          current_data.nick_font_color = $(this).val();
          // console.log("dddd", $(".word_nick"), current_data.noti_nick_color)
          $(".nick-color").css("color", current_data.nick_font_color);
          break;
        case "colorPicker_reward_color":
          current_data.lex_font_color = $(this).val();
          $(".reward-color").css("color", current_data.lex_font_color);
          break;
        case "colorPicker_time_color":
          current_data.time_font_color = $(this).val();
          $(".time-color").css("color", current_data.time_font_color);
          break;
      }
    },
    // move: function(color){
    //     console.log('background-color~~~',color.toHex8String());
    // }
  });
}

function changeFontFamily(num) {
  console.log("changeFontFamily");
  var selectValue;
  if (num == 1) {
    selectValue = $("#fontSelect1").val();
    current_data.nick_font_name = selectValue;
    console.log("selectValue:", selectValue);
    if (prevFont_1) {
      $(".nick-color").removeClass(prevFont_1);
    }
    $(".nick-color").addClass(selectValue);
    console.log("changeFontFamily", $(".nick-color"));
    prevFont_1 = selectValue;
  } else if (num == 2) {
    selectValue = $("#fontSelect2").val();
    current_data.lex_font_name = selectValue;
    if (prevFont_2) {
      $(".reward-color").removeClass(prevFont_2);
    }
    $(".reward-color").addClass(selectValue);
    prevFont_2 = selectValue;
  } else if (num == 3) {
    selectValue = $("#fontSelect3").val();
    current_data.time_font_name = selectValue;
    if (prevFont_3) {
      $(".time-color").removeClass(prevFont_3);
    }
    $(".time-color").addClass(selectValue);
  }
}
