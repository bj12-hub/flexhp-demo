axios.defaults.withCredentials = true;

let current_preset_id;
let current_preset_div;
let current_data;
let current_preset_type = "challenge-lex";
let prevFontExcelTitle; //excelTitle
let prevFontExcelItem; // excelItem
let myModal = new bootstrap.Modal(document.getElementById("setupCompleted"), {
  keyboard: false,
});

function selectPresetBtn(t_div) {
  current_preset_id = t_div.attr("id");
  current_preset_div = t_div;
  localStorage.setItem("preset_id_challenge", current_preset_id);
  t_div.addClass("selected").siblings().removeClass("selected");
  $("#urlCopy").val(current_preset_div.attr("url"));

  //console.log("selectPresetBtn :", current_preset_div.attr("data_list"));
  current_data = JSON.parse(current_preset_div.attr("data_list"));
  console.log("current_data :", current_data);
  setDisplay(current_data);
}

function init() {
  // $(".chat-list").empty();
  if (localStorage.getItem("preset_id_challenge") == null) {
  } else {
    current_preset_id = localStorage.getItem("preset_id_challenge");
  }
  // preset button 숨김 처리(하나만 존재)
  $(".preset-list").css("visibility", "hidden");

  addEvent();
  $(".preset-list-box").empty();
  setTimeout(getPresetList, 100);
}
//
function createDefaultJson() {
  var jsonObj = {};
  // 후원활성화
  jsonObj.isAvailable = "off";
  // 최소 렉스 갯수
  jsonObj.min_lex = "100";
  // 알림 테그스트
  jsonObj.noti_text_reg =
    "{닉네임}님 도전 렉스 {미션내용} 상금 플렉스 {개수}개 등록하셨습니다.";
  jsonObj.noti_text_start =
    "{닉네임}님 도전 렉스 {미션내용} 상금 플렉스 {개수}개 시작하셨습니다.";
  jsonObj.noti_text_fund =
    "{닉네임}님 도전 렉스 {미션내용} 상금 플렉스 {개수}개 상금을 추가하셨습니다.";
  jsonObj.noti_text_success =
    "{닉네임}님 도전 렉스 {미션내용} 총 상금 플렉스 {개수}개 상금 획득!";
  jsonObj.noti_text_failure = "{닉네임}님 도전 렉스 {미션내용} 미션 실패!";
  jsonObj.noti_text_cancel = "{닉네임}님 도전 렉스 {미션내용} 미션 취소!";
  // 알림방식,채팅 음성
  jsonObj.noti_type = "알림음성";
  jsonObj.is_chat_voice = "on";

  // nickname font
  jsonObj.nick_font_name = "ff-28";
  jsonObj.nick_font_bold = "off";
  jsonObj.nick_font_size = 14;
  jsonObj.nick_font_color = "#1d1d1d";
  // mission font
  jsonObj.mission_font_name = "ff-27";
  jsonObj.mission_font_bold = "on";
  jsonObj.mission_font_size = 14;
  jsonObj.mission_font_color = "#1d1d1d";
  // 상금 폰트
  jsonObj.lex_font_name = "ff-27";
  jsonObj.lex_font_bold = "off";
  jsonObj.lex_font_size = 12;
  jsonObj.lex_font_color = "#1d1d1d";
  // 남은시간 폰트
  jsonObj.time_font_name = "ff-27";
  jsonObj.time_font_bold = "off";
  jsonObj.time_font_size = 12;
  jsonObj.time_font_color = "#1d1d1d";
  return JSON.stringify(jsonObj);
}

function addEvent() {
  // 사용하지 않음(preset button 없음)
  addEventPreset();

  // 화면 보기
  $("#btn_open_pop").on("click", function () {
    let url = $("#urlCopy").val();
    openWin(url, "플렉스", 500, 500);
  });

  // 도전렉스 설정 탭 - 후원 활성화
  $("#giftYn").on("change", function () {
    current_data.isAvailable = $(this).prop("checked") ? "on" : "off";
  });

  // 최소 당첨 렉스(숫자만)
  $("#input_txt_gift_start").on("keyup", function () {
    $(this).val(
      $(this)
        .val()
        .replace(/[^0-9]/g, "")
    );
  });
  // 최소 당첨 렉스(validation)
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

  // 알림 방식
  $("input[name=notiSys]").on("input", function () {
    current_data.noti_type = $(this).val();
  });
  // 알림 텍스트-등록
  $("#notiTxtReg").on("change", function () {
    current_data.noti_text_reg = $(this).val();
  });
  // 알림 텍스트-시작
  $("#notiTxtStart").on("change", function () {
    current_data.noti_text_start = $(this).val();
  });
  // 알림 텍스트-추가후원
  $("#notiTxtFund").on("change", function () {
    current_data.noti_text_fund = $(this).val();
  });

  // 알림 텍스트-성공
  $("#notiTxtSuccess").on("change", function () {
    current_data.noti_text_success = $(this).val();
  });

  // 알림 텍스트-실패
  $("#notiTxtFailure").on("change", function () {
    current_data.noti_text_failure = $(this).val();
  });

  // 알림 텍스트-취소
  $("#notiTxtCancel").on("change", function () {
    current_data.noti_text_cancel = $(this).val();
  });

  // 채팅음성 사용 유무
  $("#chVoiceYn").on("change", function () {
    current_data.is_chat_voice = $(this).prop("checked") ? "on" : "off";
  });
  // 닉네임 폰트 굵게(미리보기 적용)
  $("#nicknameFontBold").on("change", function () {
    if ($(this).prop("checked")) {
      $(".nick-color").addClass("font-weight-bold");
      current_data.nick_font_bold = "on";
    } else {
      $(".nick-color").removeClass("font-weight-bold");
      current_data.nick_font_bold = "off";
    }
  });
  $("#missionFontBold").on("change", function () {
    if ($(this).prop("checked")) {
      $(".mission-color").addClass("font-weight-bold");
      current_data.mission_font_bold = "on";
    } else {
      $(".mission-color").removeClass("font-weight-bold");
      current_data.nick_font_bold = "off";
    }
  });

  // 상금폰트 굵게(미리보기 적용)
  $("#rewardFontBold").on("change", function () {
    if ($(this).prop("checked")) {
      $(".reward-color").addClass("font-weight-bold");
      current_data.lex_font_bold = "on";
    } else {
      $(".reward-color").removeClass("font-weight-bold");
      current_data.lex_font_bold = "off";
    }
  });
  // 남은시간 푠트 굵게(미리보기 적용)
  $("#timeFontBold").on("change", function () {
    if ($(this).prop("checked")) {
      $(".time-color").addClass("font-weight-bold");
      current_data.time_font_bold = "on";
    } else {
      $(".time-color").removeClass("font-weight-bold");
      current_data.time_font_bold = "off";
    }
  });
  // 설정 저장
  $("#btn_save").on("click", function () {
    //console.log("current_preset_div", current_preset_div, current_data)
    savePreset(current_preset_div, current_data);
  });
  // 설정 초기화
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

function setPreview() {
  const element = document.querySelector(".card-txt.alert");
  element.style.setProperty("--content", '"도전렉스 진행중"');

  const makeImageAniImg = (src) => {
    return $("<p>", { class: "ani-img" }).append($("<img>", { src: src }));
  };
  setTimeout(
    (el) => {
      el.style.setProperty("--content", '"도전렉스 성공"');
      $(el).find("p span").hide();
      $(el).append(makeImageAniImg("../images/img_success.svg"));
      $(el).addClass("success success-ani");
    },
    2000,
    element
  );

  setTimeout(
    (el) => {
      el.style.setProperty("--content", '"도전렉스 실패"');
      $(el).find("p.ani-img img").attr("src", "../images/img_failure.svg");
      $(el).removeClass("success success-ani");
      $(el).addClass("failure failure-ani");
    },
    5000,
    element
  );

  setTimeout(
    (el) => {
      el.style.setProperty("--content", '"도전렉스 진행중"');
      $(el).find("p span").show();
      $(el).find("p img").remove();
      $(el).removeClass("failure failure-ani");
    },
    8100,
    element
  );
}

function setDisplay(_data) {
  //console.log("setDisplay~~", _data)
  // 미리보기
  setPreview();

  $(".spinner-border").css("display", "none");
  // 후원활성화
  $("#giftYn").prop("checked", _data.isAvailable == "on");
  //최소담첨금액
  $("#input_txt_gift_start").val(parseInt(_data.min_lex));

  // 알림방식
  $("input[name=notiSys][value=" + _data.noti_type + "]").prop("checked", true);
  //알림 텍스트-등록
  $("#notiTxtReg").val(_data.noti_text_reg);
  //알림 텍스트-시작
  $("#notiTxtStart").val(_data.noti_text_start);
  //알림 텍스트-추가 후원
  $("#notiTxtFund").val(_data.noti_text_fund);
  //알림 텍스트-성공
  $("#notiTxtSuccess").val(_data.noti_text_success);
  //알림 텍스트-실패
  $("#notiTxtFailure").val(_data.noti_text_failure);
  //알림 텍스트-취소
  $("#notiTxtCancel").val(_data.noti_text_cancel);

  //채팅음성 사용유무
  $("#chVoiceYn").prop("checked", _data.is_chat_voice == "on");

  // 알림 텍스트 폰트 설정
  let isFontBold1 = _data.nick_font_bold == "on";
  // 닉네임 폰트 굵기 및 사이즈
  $("#nicknameFontBold").prop("checked", isFontBold1);
  let fontNick = document.getElementById("fontSelect1");
  let fontViewList1 = document.getElementById("font-view-list1");
  let nickFontFamily = document.getElementById("nickNamefontFamily");
  setFontFamily(fontNick, _data.nick_font_name, nickFontFamily, fontViewList1);
  setFontSize(
    _data.nick_font_size,
    "slide_nick_font_size",
    "slide_nick_font_size_val",
    isFontBold1
  );

  // 미션 폰트 굵기 및 사이즈
  let isFontBold2 = _data.mission_font_bold == "on";

  $("#missionFontBold").prop("checked", isFontBold2);
  let fontMission = document.getElementById("fontSelect2");
  let fontViewList2 = document.getElementById("font-view-list2");
  let missionFontFamily = document.getElementById("missionfontFamily");

  setFontFamily(
    fontMission,
    _data.mission_font_name,
    missionFontFamily,
    fontViewList2
  );
  setFontSize(
    _data.mission_font_size,
    "slide_mission_font_size",
    "slide_mission_font_size_val",
    isFontBold2
  );

  // 상금 폰트 굵기 및 사이즈
  let isFontBold3 = _data.lex_font_bold == "on";
  $("#rewardFontBold").prop("checked", isFontBold3);
  let fontLex = document.getElementById("fontSelect3");
  let fontViewList3 = document.getElementById("font-view-list3");
  let rewardFontFamily = document.getElementById("rewardFontFamily");
  setFontFamily(fontLex, _data.lex_font_name, rewardFontFamily, fontViewList3);
  setFontSize(
    _data.lex_font_size,
    "slide_reward_font_size",
    "slide_reward_font_size_val",
    isFontBold3
  );
  // 남은시간 폰트 굵기 및 사이즈
  let isFontBold4 = _data.time_font_bold == "on";
  $("#timeFontBold").prop("checked", isFontBold4);
  let fontTime = document.getElementById("fontSelect4");
  let fontViewList4 = document.getElementById("font-view-list4");
  let timeFontFamily = document.getElementById("timeFontFamily");
  setFontFamily(fontTime, _data.time_font_name, timeFontFamily, fontViewList4);
  setFontSize(
    _data.time_font_size,
    "slide_time_font_size",
    "slide_time_font_size_val",
    isFontBold4
  );

  // var $nickFontSize = $(".nick-color");
  // if(isBold)$nickFontSize.addClass('font-weight-bold');
  // $nickFontSize.css('font-size', fontSize + 'px');
  // 닉네임, 상금, 타임 폰트 색상 및 미리보기 적용
  setTextColor($("#colorPicker_nick_color"), _data.nick_font_color);
  setTextColor($("#colorPicker_mission_color"), _data.mission_font_color);
  setTextColor($("#colorPicker_reward_color"), _data.lex_font_color);
  setTextColor($("#colorPicker_time_color"), _data.time_font_color);

  // 미리보기에 닉네임 폰트 설정(fontfamily, font-bold, font-size, font-color)
  let $nickFontSize = $(".nick-color");
  if (_data.nick_font_bold == "on") $nickFontSize.addClass("font-weight-bold");
  $nickFontSize.css("font-size", _data.nick_font_size + "px");
  $nickFontSize.css("color", _data.nick_font_color);
  $nickFontSize.addClass(_data.nick_font_name);
  prevFont_1 = _data.nick_font_name;

  // 미리보기에 닉네임 폰트 설정(fontfamily, font-bold, font-size, font-color)
  let $missionFontSize = $(".mission-color");
  if (_data.mission_font_bold == "on")
    $missionFontSize.addClass("font-weight-bold");
  $missionFontSize.css("font-size", _data.mission_font_size + "px");
  $missionFontSize.css("color", _data.mission_font_color);
  $missionFontSize.addClass(_data.mission_font_name);
  prevFont_2 = _data.mission_font_name;

  // 미리보기에 상금 폰트 설정(fontfamily, font-bold, font-size, font-color)
  var $rewardColor = $(".reward-color");
  if (_data.lex_font_bold == "on") $nickFontSize.addClass("font-weight-bold");
  $rewardColor.css("font-size", _data.lex_font_size + "px");
  $rewardColor.css("color", _data.lex_font_color);
  $rewardColor.addClass(_data.lex_font_name);
  prevFont_3 = _data.lex_font_name;
  // 미리보기에 남은시간 폰트 설정(fontfamily, font-bold, font-size, font-color)
  var $timeColor = $(".time-color");
  if (_data.time_font_bold == "on") $nickFontSize.addClass("font-weight-bold");
  $timeColor.css("font-size", _data.time_font_size + "px");
  $timeColor.css("color", _data.time_font_color);
  $timeColor.addClass(_data.time_font_name);
  prevFont_4 = _data.time_font_name;
}
// 폰트 리스트 구성
function setFontFamily(element, font_name, fontFamily, fontViewList) {
  //console.log('element, font_name, fontFamily, fontViewList', element, font_name, fontFamily, fontViewList)
  var fontTag = element;
  var ff_str = get_font_str_from_value(font_name);
  element.innerHTML = ff_str;
  // console.log("aaaa:", element, ff_str, get_font_str_from_value(font_name))

  initFont(fontTag, ff_str, fontFamily);
  // set 리스트 추가
  $(fontFamily.children).each(function () {
    let img = $(this).attr("data-thumbnail");
    let text = this.innerText;
    let value = $(this).val();
    let item =
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
// 폰트 기본값 set.
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

//폰트 설정 select( html의 onclick event)
function fontFamilyChallengeLex(e, num) {
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
    } else if (slideID == "slide_mission_font_size") {
      changeFontSize_mission(isBold);
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
function changeFontSize_mission(isBold) {
  var fontSize = $("#slide_mission_font_size_val").val();
  // update css
  current_data.mission_font_size = fontSize;
  var $missionFontSize = $(".mission-color");
  if (isBold) $missionFontSize.addClass("font-weight-bold");
  $missionFontSize.css("font-size", fontSize + "px");
}

// 폰트 사이즈 변경
function changeFontSize_lex(isBold) {
  var fontSize = $("#slide_reward_font_size_val").val();
  // update css
  current_data.lex_font_size = fontSize;
  var $lexFontSize = $(".reward-color");
  var $rewardTitleFontSize = $(".reward-title");
  if (isBold) $lexFontSize.addClass("font-weight-bold");
  $lexFontSize.css("font-size", fontSize + "px");
  $rewardTitleFontSize.css("font-size", fontSize + "px");
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
// 폰트 색상
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
        case "colorPicker_mission_color":
          current_data.mission_font_color = $(this).val();
          $(".mission-color").css("color", current_data.mission_font_color);
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
  if (num == 1) {
    // 닉네임
    let selectValue = $("#fontSelect1").val();
    current_data.nick_font_name = selectValue;
    console.log("selectValue:", selectValue);
    if (prevFont_1) {
      $(".nick-color").removeClass(prevFont_1);
    }
    $(".nick-color").addClass(selectValue);
    // console.log("changeFontFamily", $(".nick-color"));
    prevFont_1 = selectValue;
  } else if (num == 2) {
    // 미션
    let selectValue = $("#fontSelect2").val();
    current_data.mission_font_name = selectValue;
    if (prevFont_2) {
      $(".mission-color").removeClass(prevFont_2);
    }
    $(".mission-color").addClass(selectValue);
    prevFont_2 = selectValue;
  } else if (num == 3) {
    // 상금
    let selectValue = $("#fontSelect3").val();
    current_data.lex_font_name = selectValue;
    if (prevFont_3) {
      $(".reward-color").removeClass(prevFont_3);
    }
    $(".reward-color").addClass(selectValue);
    prevFont_3 = selectValue;
  } else if (num == 4) {
    // 남은시간
    let selectValue = $("#fontSelect4").val();
    current_data.time_font_name = selectValue;
    if (prevFont_4) {
      $(".time-color").removeClass(prevFont_4);
    }
    $(".time-color").addClass(selectValue);
    prevFont_4 = selectValue;
  }
}
