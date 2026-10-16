axios.defaults.withCredentials = true;
let current_preset_id;
let current_preset_div;
let current_data;
//var arr_preset_list = [];
let current_theme_class;
let current_preset_type = "joint";
let prev_font_name;
let prevFontExcelTitle;
let prevFontExcelItem;
const DEFAULT_TOPTOOM_COLOR_THEME = {
  title_color: "#000000",
  title_stroke: "#00000000",
  title_stroke_size: 0,
  ranking_color: "#000000",
  bj_color: "#171A1C",
  gold_color: "#171A1C",
};
const DEFAULT_TOPTOOM_COLOR_THEME_WHITE = {
  title_color: "#ffffff",
  title_stroke: "#00000000",
  title_stroke_size: 0,
  ranking_color: "#ffffff",
  bj_color: "#ffffff",
  gold_color: "#ffffff",
};
const DEFAULT_TOPTOOM_COLOR_THEME_BLACK = {
  title_color: "#000000",
  title_stroke: "#00000000",
  title_stroke_size: 0,
  ranking_color: "#000000",
  bj_color: "#000000",
  gold_color: "#000000",
};
const DEFAULT_THEME_COLOR_SCHEMA = {
  // flex them
  "excel-theme-a": {
    ...DEFAULT_TOPTOOM_COLOR_THEME,
  },
  "excel-theme-b": {
    ...DEFAULT_TOPTOOM_COLOR_THEME,
  },
  "excel-theme-c": {
    ...DEFAULT_TOPTOOM_COLOR_THEME,
  },
  "excel-theme-d": {
    ...DEFAULT_TOPTOOM_COLOR_THEME,
  },
  "excel-theme-e": {
    ...DEFAULT_TOPTOOM_COLOR_THEME,
  },
  "excel-theme-f": {
    title_color: "#FF024A",
    ...DEFAULT_TOPTOOM_COLOR_THEME_WHITE,
    /* title_stroke: "#00000000",
    title_stroke_size: 0,
    ranking_color: "#ffffff",
    bj_color: "#ffffff",
    gold_color: "#ffffff",
    */
  },
  "excel-theme-g": {
    title_color: "#00FFF6",
    ...DEFAULT_TOPTOOM_COLOR_THEME_WHITE,
    /* title_stroke: "#00000000",
    title_stroke_size: 0,
    ranking_color: "#ffffff",
    bj_color: "#ffffff",
    gold_color: "#ffffff",
    */
  },
  "excel-theme-h": {
    ...DEFAULT_TOPTOOM_COLOR_THEME_BLACK,
  },
  "excel-theme-i": {
    ...DEFAULT_TOPTOOM_COLOR_THEME_BLACK,
  },
  "excel-theme-j": {
    ...DEFAULT_TOPTOOM_COLOR_THEME_BLACK,
  },
  "excel-theme-k": {
    ...DEFAULT_TOPTOOM_COLOR_THEME_BLACK,
    title_color: "#FF024A",
  },
  "excel-theme-l": {
    ...DEFAULT_TOPTOOM_COLOR_THEME_WHITE,
    title_color: "#944DFF",
  },
  "excel-theme-m": {
    ...DEFAULT_TOPTOOM_COLOR_THEME_BLACK,
    title_color: "#00BC3A",
  },
  "excel-theme-n": {
    ...DEFAULT_TOPTOOM_COLOR_THEME_WHITE,
    title_color: "#008ED6",
  },
  "excel-theme-o": {
    ...DEFAULT_TOPTOOM_COLOR_THEME_BLACK,
    title_color: "#00FFF6",
  },
  // ////////////////////////
  "excel-theme-electronice": {
    title_color: "#ffffff",
    title_stroke: "#ffffff00",
    title_stroke_size: 0,
    ranking_color: "#021433",
    bj_color: "#021433",
    gold_color: "#021433",
  },
  "excel-theme-palette": {
    title_color: "#faa622",
    title_stroke: "#000000",
    title_stroke_size: 2,
    ranking_color: "#000000",
    bj_color: "#000000",
    gold_color: "#000000",
  },
  "excel-theme-neon": {
    title_color: "#F1AEE8",
    title_stroke: "#ffffff00",
    title_stroke_size: 0,
    ranking_color: "#ffffff",
    bj_color: "#ffffff",
    gold_color: "#43E29A",
  },
  "excel-theme-report": {
    title_color: "#ffffff",
    title_stroke: "#000000",
    title_stroke_size: 2,
    ranking_color: "#000000",
    bj_color: "#000000",
    gold_color: "#000000",
  },
  "excel-theme-fluorescent": {
    title_color: "#000000",
    title_stroke: "#00000000",
    title_stroke_size: 0,
    ranking_color: "#000000",
    bj_color: "#000000",
    gold_color: "#000000",
  },
  "excel-theme-wave": {
    title_color: "#FFDE02",
    title_stroke: "#000000",
    title_stroke_size: 2,
    ranking_color: "#ffffff",
    bj_color: "#ffffff",
    gold_color: "#ffffff",
  },
  "excel-theme-cyber": {
    title_color: "#FFFFFF",
    title_stroke: "#FFFFFF00",
    title_stroke_size: 0,
    ranking_color: "#FFFFFF",
    bj_color: "#FFFFFF",
    gold_color: "#2C9AFE",
  },
  "excel-theme-receipt": {
    title_color: "#000000",
    title_stroke: "#00000000",
    title_stroke_size: 0,
    ranking_color: "#000000",
    bj_color: "#000000",
    gold_color: "#FF7408",
  },
  "excel-theme-vintage": {
    title_color: "#382304",
    title_stroke: "#38230400",
    title_stroke_size: 0,
    ranking_color: "#E8D4B4",
    bj_color: "#E8D4B4",
    gold_color: "#E8D4B4",
  },
};

let myModal = new bootstrap.Modal(document.getElementById("setupCompleted"), {
  keyboard: false,
});

function init() {
  if (localStorage.getItem("preset_id_excel") == null) {
  } else {
    current_preset_id = localStorage.getItem("preset_id_excel");
  }

  addEvent();
  $(".preset-list-box").empty();
  setTimeout(getPresetList, 100);
  // console.log("current_preset_id", current_preset_id)
}

function getThemeClassName(s_theme) {
  switch (s_theme) {
    case "전광판":
      return "excel-theme-electronice";
    case "팔레트":
      return "excel-theme-palette";
    case "네온사인":
      return "excel-theme-neon";
    case "리포트":
      return "excel-theme-report";
    case "형광팬":
      return "excel-theme-fluorescent";
    case "웨이브":
      return "excel-theme-wave";
    case "사이버":
      return "excel-theme-cyber";
    case "영수증":
      return "excel-theme-receipt";
    case "빈티지":
      return "excel-theme-vintage";
    // flex theme
    default:
      return `excel-${s_theme}`;
  }
}

function selectPresetBtn(t_div) {
  current_preset_id = t_div.attr("id");
  current_preset_div = t_div;
  localStorage.setItem("preset_id_chat", current_preset_id);
  t_div.addClass("selected").siblings().removeClass("selected");
  $("#urlCopy").val(current_preset_div.attr("url"));

  console.log(
    "selectPresetBtn :",
    JSON.parse(current_preset_div.attr("data_list"))
  );
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
  clearPreview();
  setPreview();
  setDisplay(current_data);
  savePreset(current_preset_div, current_data);
}

function createDefaultJson() {
  var jsonObj = {};

  // 엑셀방송 BJ 설정
  jsonObj.excel_bj_setting_url = "";
  jsonObj.excel_bj_setting_permission = "";

  // 투명도
  jsonObj.win_transparency = 0;

  // 엑셀 theme
  jsonObj.excel_theme = "theme-a";

  // 엑셀 타이틀
  jsonObj.excel_title = "플렉스 티비";
  jsonObj.excel_title_font_name = "ff-01";
  jsonObj.excel_title_font_color = "#000000";
  jsonObj.excel_title_font_bold = "on";
  jsonObj.excel_title_font_size = 60;
  jsonObj.excel_title_font_outline = 0;
  jsonObj.excel_title_font_outline_color = "#000000";
  // 엑셀항목
  jsonObj.excel_item_font_name = "ff-01";
  jsonObj.excel_item_font_bold = "on";
  jsonObj.excel_item_font_size = 30;
  // 엑셀 color
  jsonObj.excel_color_item = "#171A1C";
  jsonObj.excel_color_bj = "#171A1C";
  jsonObj.excel_color_gold = "#171A1C";
  jsonObj.excel_color_rate = "#171A1C";

  return JSON.stringify(jsonObj);
}

function addEvent() {
  //console.log("chatjs  addEvent")
  // bj 설정 페이지 URL 복사 binding
  copyText(".btn-setting-btn-copy");

  addEventPreset();

  // 테마 변경
  $("input[name=chType1]").on("input", function () {
    current_data.excel_theme = $(this).val();

    if (current_theme_class != null) {
      $(".excel-ranking-li").removeClass(current_theme_class);
    }

    current_theme_class = getThemeClassName(current_data.excel_theme);

    if (current_theme_class != null) {
      $(".excel-ranking-li").addClass(current_theme_class);
    }
    const colorSchema = DEFAULT_THEME_COLOR_SCHEMA[current_theme_class];
    if (!colorSchema) return;

    // 타이틀
    changeThemeColor("colorPickerExcelTitle", colorSchema.title_color);
    // 타이틀 외곽선
    changeThemeColor(
      "colorPickerExcelTitleStrokeColor",
      colorSchema.title_stroke
    );
    setExcelTitleStroke(
      "sliderTitleFontBorder",
      colorSchema.title_stroke_size,
      0,
      20,
      1
    );

    // 아이템
    changeThemeColor("colorPickerItem", colorSchema.ranking_color);
    changeThemeColor("colorPickerBJ", colorSchema.bj_color);
    changeThemeColor("colorPickerGold", colorSchema.gold_color);
  });

  // 엑셀타이틀 변경
  $("#excelTitle").keyup((e) => {
    current_data.excel_title = $(e.currentTarget).val();
    $(".excel-title").text(current_data.excel_title);
  });

  // 타이틀 폰트 bold
  $("#excelTitlefontBold").on("change", function () {
    if ($(this).prop("checked")) {
      $(".excel-title").addClass("font-weight-bold");
      current_data.excel_title_font_bold = "on";
    } else {
      $(".excel-title").removeClass("font-weight-bold");
      current_data.excel_title_font_bold = "off";
    }
  });

  // 아이템 폰트 bold
  $("#excelItemfontBold").on("change", function () {
    if ($(this).prop("checked")) {
      $(".excel-ranking").addClass("font-weight-bold");
      $(".excel-bj").addClass("font-weight-bold");
      $(".excel-gold").addClass("font-weight-bold");
      $(".excel-rate").addClass("font-weight-bold");
      current_data.excel_item_font_bold = "on";
    } else {
      $(".excel-ranking").removeClass("font-weight-bold");
      $(".excel-bj").removeClass("font-weight-bold");
      $(".excel-gold").removeClass("font-weight-bold");
      $(".excel-rate").removeClass("font-weight-bold");
      current_data.excel_item_font_bold = "off";
    }
  });

  // 저장
  $("#btn_save").on("click", function () {
    // console.log("btn_save : ", current_data)
    savePreset(current_preset_div, current_data);
  });
  // 초기화
  $("#btn_reset").on("click", function () {
    //  console.log("btn_reset")
    reset_setting();
  });

  //////////////////////////
  // 초기화
  $("#btn_win_reset").on("click", function () {
    //  console.log("btn_win_reset")
    //서버로 알린다.
    testmessage_to_server("2", "");
  });
  // 새로고침
  $("#btn_win_reload").on("click", function () {
    testmessage_to_server("1", "");
    //서버로 알린다.
  });
  // 미리보기 화면
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
// 투명도 변경 시 help_ui.js에서 호출됨
function prev_handle_transparency(_temp) {
  if (current_data) current_data.win_transparency = _temp;
  _temp = 100 - _temp;
  var t_val = _temp * 0.01;
  $(".preview-list-area").css({ opacity: t_val });
}

function setPreview() {
  const previewList = $(".preview-list");
  if (previewList.length < 0) return;

  const container = $("<li>", { class: "excel-ranking-li" }).appendTo(
    previewList
  );
  const title = current_data.excel_title || "";
  $("<div>", { class: "excel-title", text: title }).appendTo(container);
  const tableArea = $("<div>", { class: "excel-table-area" }).appendTo(
    container
  );

  const table = $("<table>").appendTo(tableArea);
  const theader = $("<thead>").appendTo(table);
  const tr = $("<tr>").appendTo(theader);

  // table header 순위
  $("<th>", {
    scope: "col",
    class: "excel-ranking-th",
    text: "순위",
  }).appendTo(tr);
  // table header BJ
  $("<th>", {
    scope: "col",
    class: "excel-bj-th",
    text: "BJ명",
  }).appendTo(tr);
  // table header gold
  $("<th>", {
    scope: "col",
    class: "excel-gold-th",
    text: "렉스",
  }).appendTo(tr);
  // table header custom
  $("<th>", {
    scope: "col",
    class: "excel-custom-th",
    text: "비고",
  }).appendTo(tr);
  // data

  // data
  const tbody = $("<tbody>").appendTo(table);
  const gold = 1000000;
  for (let i = 1; i <= 5; i++) {
    const tr = $("<tr>", { class: "excel-row" }).appendTo(tbody);
    $("<td>", { class: "excel-ranking", text: i }).appendTo(tr);
    $("<td>", {
      class: "excel-bj",
      text: `닉네임${String.fromCharCode(64 + i)}`,
    }).appendTo(tr);
    $("<td>", {
      class: "excel-gold",
      text: `${numberWithCommas(gold / Math.pow(10, i))}`,
    }).appendTo(tr);
    $("<td>", {
      class: "excel-custom",
      text: "",
    }).appendTo(tr);
  }
}

function setDisplay(_data) {
  // 설정페이지 접속
  $(".btn-setting").attr("disabled", false);

  //엑셀방송 BJ 설정
  // URL
  const host = `${location.protocol}://${location.host}`;

  // 엑셀 투명도
  var win_transparency = _data.win_transparency;
  var chatOpt = document.getElementById("sliderChatOpacity");
  chatOpt.noUiSlider.set(win_transparency);
  prev_set_transparency(win_transparency);

  // 엑셀 테마
  $("input[name=chType1][value=" + _data.excel_theme + "]").prop(
    "checked",
    true
  );
  current_theme_class = getThemeClassName(_data.excel_theme);
  if (current_theme_class != null) {
    $(".excel-ranking-li").addClass(current_theme_class);
  }
  // 엑셀 타이틀
  $("#excelTitle").val(_data.excel_title);
  // 엑셀 타이틀 color
  setTextColor($("#colorPickerExcelTitle"), _data.excel_title_font_color);
  // 타이틀 폰트 bold
  const isTitleFontBold = _data.excel_title_font_bold == "on";
  $("#excelTitlefontBold").prop("checked", isTitleFontBold);
  const titleFont = document.getElementById("excelTitleFont");
  const titleFontViewList = document.getElementById("font-view-list-title");
  const titleFontFamily = document.getElementById("excelTitlefontFmaily");
  prevFontExcelTitle = _data.excel_title_font_name;

  setFontFamily(
    ".excel-title",
    titleFont,
    _data.excel_title_font_name,
    titleFontFamily,
    titleFontViewList
  );
  setFontSize(
    _data.excel_title_font_size,
    "sliderTitleFontSize",
    "sliderTitlefontSizeVal",
    isTitleFontBold
  );

  //엑셀 타이틀 외곽선 color
  setTextColor(
    $("#colorPickerExcelTitleStrokeColor"),
    _data.excel_title_font_outline_color
  );
  setFontSize(
    _data.excel_title_font_outline,
    "sliderTitleFontBorder",
    "sliderTitleFontBorderVal",
    isTitleFontBold,
    0,
    20,
    1
  );
  // 엑셀 항목
  // 아이템 폰트 bold
  let isItemFontBold = _data.excel_item_font_bold == "on";
  $("#excelItemfontBold").prop("checked", isItemFontBold);
  let itemFont = document.getElementById("excelItemFont");
  let itemFontViewList = document.getElementById("font-view-list-item");
  let itemFontFamily = document.getElementById("excelItemfontFmaily");
  prevFontExcelItem = _data.excel_item_font_name;
  setFontFamily(
    ".excel-row",
    itemFont,
    _data.excel_item_font_name,
    itemFontFamily,
    itemFontViewList
  );
  setFontSize(
    _data.excel_item_font_size,
    "sliderItemFontSize",
    "sliderItemfontSizeVal",
    isItemFontBold,
    6,
    36
  );
  setTextColor($("#colorPickerItem"), _data.excel_color_item);
  setTextColor($("#colorPickerBJ"), _data.excel_color_bj);
  setTextColor($("#colorPickerGold"), _data.excel_color_gold);
  $(".spinner-border").css("display", "none");
}

function changeThemeColor(id, fontColor) {
  setTextColor($(`#${id}`), fontColor);
  changeColor(id, fontColor);
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
      const fontColor = $(this).val();
      changeColor($(this).attr("id"), fontColor);
    },
  });
}

function changeColor(id, fontColor) {
  switch (id) {
    case "colorPickerItem":
      current_data.excel_color_item = fontColor;
      $(".excel-ranking").css("color", fontColor);
      break;
    case "colorPickerBJ":
      current_data.excel_color_bj = fontColor;
      $(".excel-bj").css("color", fontColor);
      break;
    case "colorPickerGold":
      current_data.excel_color_gold = fontColor;
      $(".excel-gold").css("color", fontColor);
      break;
    case "colorPickerExcelTitle":
      current_data.excel_title_font_color = fontColor;
      $(".excel-title").css("color", fontColor);
      break;
    case "colorPickerExcelTitleStrokeColor":
      current_data.excel_title_font_outline_color = fontColor;
      changeFontSizeExcelTitleStroke("sliderTitleFontBorderVal");

      break;
  }
}

////////////////////////////////////////////////////////////////////셋팅

function prev_set_transparency(_temp) {
  _temp = 100 - _temp;
  var t_val = _temp * 0.01;
  $(".preview-list-area").css({ opacity: t_val });
}

var cnt = 0;
var myTimeout = [];

$(".preview-list").empty();

function clearPreview() {
  cnt = 0;
  for (var i = 0; i < myTimeout.length; i++) {
    clearTimeout(myTimeout[i]);
  }
  $(".preview-list").empty();
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

//폰트 설정 select( html의 onclick event)
function fontFamilyExcel(e, num) {
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

function changeFontFamily(num) {
  if (num == 1) {
    // 닉네임
    let selectValue = $("#excelTitleFont").val();

    current_data.excel_title_font_name = selectValue;
    if (prevFontExcelTitle) {
      $(".excel-title").removeClass(prevFontExcelTitle);
    }
    $(".excel-title").addClass(selectValue);
    prevFontExcelTitle = selectValue;
  } else if (num == 2) {
    // 미션
    let selectValue = $("#excelItemFont").val();
    current_data.excel_item_font_name = selectValue;
    if (prevFontExcelItem) {
      $(".excel-row").removeClass(prevFontExcelItem);
      $("table thead tr th").removeClass(prevFontExcelItem);
    }
    $(".excel-row").addClass(selectValue);
    $("table thead tr th").addClass(selectValue);

    prevFontExcelItem = selectValue;
  }
}

function goToExcelBjSettings() {
  // const settingUrl = $("#settingUrlCopy").val();
  const settingUrl = `/view/joint_setting.html?page=${current_preset_div.attr(
    "page"
  )}`;
  //console.log("🔥 ~ goToExcelBjSettings ~ settingUrl:", settingUrl);
  //location.href = settingUrl;
  // 새 탭으로 변경
  window.open(settingUrl, "joint_setting");
}

function addPermission() {
  console.log("🔥add permission");
}

// 폰트 리스트 구성
function setFontFamily(selector, element, font_name, fontFamily, fontViewList) {
  var fontTag = element;
  var ff_str = get_font_str_from_value(font_name);
  element.innerHTML = ff_str;
  element.value = font_name;

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

  if (".excel-title" === selector) {
    changeFontFamily(1);
  } else {
    changeFontFamily(2);
  }
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

function setExcelTitleStroke(slideID, val, min, max, step) {
  const fs = document.getElementById(slideID);
  getNoUiSlider(fs, val, min, max, step);
  fs.noUiSlider.set(val);
}

function getNoUiSlider(fs, startVal, min, max, step) {
  if (!fs || !fs.noUiSlider) {
    noUiSlider.create(fs, {
      start: startVal,
      connect: "lower",
      step: isNaN(step) ? 2 : step,
      range: {
        min: isNaN(min) ? 12 : min,
        max: isNaN(max) ? 60 : max,
      },
    });
  }

  return fs.noUiSlider;
}

// slider 폰트 사이즈
function setFontSize(startVal, slideID, sizeValID, isBold, min, max, step) {
  var fs = document.getElementById(slideID);
  var fsVal = document.getElementById(sizeValID);

  //console.log('setFontSize:', startVal, slideID, sizeValID, isBold )

  if (!fs) return;
  getNoUiSlider(fs, startVal, min, max, step);

  fs.noUiSlider.on("update", function (values, handle) {
    fsVal.value = parseInt(values[handle]);
    if (slideID == "sliderTitleFontSize") {
      changeFontSizeExcelTitle(isBold, sizeValID);
    } else if (slideID == "sliderItemFontSize") {
      changeFontSizeExcelItem(isBold, sizeValID);
    } else if (slideID == "sliderTitleFontBorder") {
      changeFontSizeExcelTitleStroke(sizeValID);
    }
  });

  fsVal.addEventListener("change", function () {
    fs.noUiSlider.set(this.value);
  });
}

// 엑셀 폰트 사이즈 변경
function changeFontSizeExcelTitle(isBold, sizeValID) {
  const fontSize = $(`#${sizeValID}`).val();
  // update css
  current_data.excel_title_font_size = fontSize;

  const titleFontSize = $(".excel-title");
  if (isBold) titleFontSize.addClass("font-weight-bold");
  titleFontSize.css("font-size", fontSize + "px");
  titleFontSize.css("color", current_data.excel_title_font_color);
}

// 엑셀 폰트 사이즈 변경
function changeFontSizeExcelItem(isBold, sizeValID) {
  const fontSize = $(`#${sizeValID}`).val();
  // update css
  current_data.excel_item_font_size = fontSize;
  const {
    excel_color_item: rankingColor,
    excel_color_bj: bjColor,
    excel_color_gold: goldColor,
    excel_color_rate: rateColor,
  } = current_data;

  const rangkingFontSize = $(".excel-ranking");
  const bjFontSize = $(".excel-bj");
  const goldFontSize = $(".excel-gold");
  const rateFontSize = $(".excel-rate");
  if (isBold) {
    rangkingFontSize.addClass("font-weight-bold");
    bjFontSize.addClass("font-weight-bold");
    goldFontSize.addClass("font-weight-bold");
    rateFontSize.addClass("font-weight-bold");
    // header
    $("table thead tr th").addClass("font-weight-bold");
  }
  // font size
  rangkingFontSize.css("font-size", fontSize + "px");
  bjFontSize.css("font-size", fontSize + "px");
  goldFontSize.css("font-size", fontSize + "px");
  rateFontSize.css("font-size", fontSize + "px");
  // header
  $("table thead tr th").css("font-size", fontSize + "px");

  rangkingFontSize.css("color", rankingColor);
  bjFontSize.css("color", bjColor);
  goldFontSize.css("color", goldColor);
  rateFontSize.css("color", rateColor);
}

function changeFontSizeExcelTitleStroke(sizeValID) {
  const strokeSize = $(`#${sizeValID}`).val();
  current_data.excel_title_font_outline = strokeSize;

  const strokeColor = $("#colorPickerExcelTitleStrokeColor").val();
  const fontSize = $("#sliderTitlefontSizeVal").val();

  $(".excel-title").css("font-size", fontSize + "px");
  $(".excel-title").css("text-shadow", "");

  //console.log("prev_chat_fontStroke~~~~~~~~~~~~: ",  strokeSize, strokeColor, fontSize )

  for (var angle = 0; angle < 2 * Math.PI; angle += 1 / strokeSize) {
    appendShadow(
      $(".excel-title"),
      Math.cos(angle) * strokeSize,
      Math.sin(angle) * strokeSize,
      strokeColor
    );
  }
}

function numberWithCommas(x) {
  if (x == null) return "";
  if (isNaN(x)) return 0;
  // return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");

  const parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

function onNumberInputOnly(obj) {
  const max = obj.getAttribute("max");
  const val = obj.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
  obj.value = Math.min(max, val);
}
