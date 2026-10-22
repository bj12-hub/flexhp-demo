axios.defaults.withCredentials = true;
const TAB_ID_EXCEL = "tab-excel";
const TAB_ID_BATTLE = "tab-battle";
const TAB_ID_TEAM = "tab-team";
// excel
let current_preset_id;
let current_preset_div;
let current_data;
let current_theme_class;
let current_preset_type = "excel";

//battle
/** @type {BattleCompoment} */
let battlePreview;
let current_battle_preset_id;
let current_battle_preset_div;
let current_battle_data;
const CURRENT_PRESET_BATTLE_TYPE = "battle";
const BATTLE_SELECTOR = ".preset-list-box-battle";
let prevFontBattleTitle;

/** @type {Team} */
let teamPreview;
let current_team_preset_id;
let current_team_preset_div;
let current_team_data;
const CURRENT_PRESET_TEAM_TYPE = "team";
const TEAM_SELECTOR = ".preset-list-box-team";
let prevFontTeamTitle;
let prevFontTeamItem;

// rocket (FLEXTV 이벤트 탭: 설정은 customjs/rocket.js 가 서버에 저장한다)
const TAB_ID_ROCKET = "tab-rocket";
const CURRENT_PRESET_ROCKET_TYPE = "rocket";
const ROCKET_SELECTOR = ".preset-list-box-rocket";
let current_rocket_preset_id;
let current_rocket_preset_div;

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
  rate_color: "#171A1C",
};
const DEFAULT_TOPTOOM_COLOR_THEME_WHITE = {
  title_color: "#ffffff",
  title_stroke: "#00000000",
  title_stroke_size: 0,
  ranking_color: "#ffffff",
  bj_color: "#ffffff",
  gold_color: "#ffffff",
  rate_color: "#ffffff",
};
const DEFAULT_TOPTOOM_COLOR_THEME_BLACK = {
  title_color: "#000000",
  title_stroke: "#00000000",
  title_stroke_size: 0,
  ranking_color: "#000000",
  bj_color: "#000000",
  gold_color: "#000000",
  rate_color: "#000000",
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
    rate_color: "#ffffff", */
  },
  "excel-theme-g": {
    title_color: "#00FFF6",
    ...DEFAULT_TOPTOOM_COLOR_THEME_WHITE,
    /* title_stroke: "#00000000",
    title_stroke_size: 0,
    ranking_color: "#ffffff",
    bj_color: "#ffffff",
    gold_color: "#ffffff",
    rate_color: "#ffffff", */
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
    rate_color: "#021433",
  },
  "excel-theme-palette": {
    title_color: "#faa622",
    title_stroke: "#000000",
    title_stroke_size: 2,
    ranking_color: "#000000",
    bj_color: "#000000",
    gold_color: "#000000",
    rate_color: "#000000",
  },
  "excel-theme-neon": {
    title_color: "#F1AEE8",
    title_stroke: "#ffffff00",
    title_stroke_size: 0,
    ranking_color: "#ffffff",
    bj_color: "#ffffff",
    gold_color: "#43E29A",
    rate_color: "#efbd0b",
  },
  "excel-theme-report": {
    title_color: "#ffffff",
    title_stroke: "#000000",
    title_stroke_size: 2,
    ranking_color: "#000000",
    bj_color: "#000000",
    gold_color: "#000000",
    rate_color: "#000000",
  },
  "excel-theme-fluorescent": {
    title_color: "#000000",
    title_stroke: "#00000000",
    title_stroke_size: 0,
    ranking_color: "#000000",
    bj_color: "#000000",
    gold_color: "#000000",
    rate_color: "#000000",
  },
  "excel-theme-wave": {
    title_color: "#FFDE02",
    title_stroke: "#000000",
    title_stroke_size: 2,
    ranking_color: "#ffffff",
    bj_color: "#ffffff",
    gold_color: "#ffffff",
    rate_color: "#ffffff",
  },
  "excel-theme-cyber": {
    title_color: "#FFFFFF",
    title_stroke: "#FFFFFF00",
    title_stroke_size: 0,
    ranking_color: "#FFFFFF",
    bj_color: "#FFFFFF",
    gold_color: "#2C9AFE",
    rate_color: "#62ECD9",
  },
  "excel-theme-receipt": {
    title_color: "#000000",
    title_stroke: "#00000000",
    title_stroke_size: 0,
    ranking_color: "#000000",
    bj_color: "#000000",
    gold_color: "#FF7408",
    rate_color: "#FBA900",
  },
  "excel-theme-vintage": {
    title_color: "#382304",
    title_stroke: "#38230400",
    title_stroke_size: 0,
    ranking_color: "#E8D4B4",
    bj_color: "#E8D4B4",
    gold_color: "#E8D4B4",
    rate_color: "#E8D4B4",
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
  setTimeout(getPresetList, 200);
  setTimeout(() => {
    getPresetList(CURRENT_PRESET_BATTLE_TYPE, BATTLE_SELECTOR);
  }, 400);
  setTimeout(() => {
    getPresetList(CURRENT_PRESET_TEAM_TYPE, TEAM_SELECTOR);
  }, 600);
  setTimeout(() => {
    getPresetList(CURRENT_PRESET_ROCKET_TYPE, ROCKET_SELECTOR);
    if (typeof RocketTab !== "undefined") RocketTab.init();
  }, 800);
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

function selectPresetBtn(t_div, parentTab) {
  console.log("🔥 ~ selectPresetBtn ~ t_div:", t_div);
  // set current preset(for excel, for battle)
  setCurrentPresetId(parentTab, t_div);

  clearPreview(parentTab);
  setPreview(parentTab);
  setDisplay(parentTab);
}

function setCurrentPresetId(parentTab, t_div) {
  const parentId = parentTab.attr("id");
  if (TAB_ID_EXCEL === parentId) {
    current_preset_id = t_div.attr("id");
    current_preset_div = t_div;
    localStorage.setItem("preset_id_excel", current_preset_id);

    t_div.addClass("selected").siblings().removeClass("selected");
    parentTab.find(".urlCopy").val(current_preset_div.attr("url"));

    current_data = JSON.parse(current_preset_div.attr("data_list"));
  } else if (TAB_ID_BATTLE === parentId) {
    current_battle_preset_id = t_div.attr("id");
    current_battle_preset_div = t_div;
    localStorage.setItem("preset_battle_id_excel", current_battle_preset_id);

    t_div.addClass("selected").siblings().removeClass("selected");
    parentTab.find(".urlCopy").val(current_battle_preset_div.attr("url"));

    current_battle_data = JSON.parse(
      current_battle_preset_div.attr("data_list")
    );
  } else if (TAB_ID_TEAM === parentId) {
    current_team_preset_id = t_div.attr("id");
    current_team_preset_div = t_div;
    localStorage.setItem("preset_team_id_excel", current_team_preset_id);

    t_div.addClass("selected").siblings().removeClass("selected");
    parentTab.find(".urlCopy").val(current_team_preset_div.attr("url"));

    current_team_data = JSON.parse(
      current_team_preset_div.attr("data_list")
    );
  } else if (TAB_ID_ROCKET === parentId) {
    current_rocket_preset_id = t_div.attr("id");
    current_rocket_preset_div = t_div;
    localStorage.setItem("preset_rocket_id_excel", current_rocket_preset_id);

    t_div.addClass("selected").siblings().removeClass("selected");
    parentTab.find(".urlCopy").val(current_rocket_preset_div.attr("url"));
    // 같은 프리셋의 목표 UI · 룰렛 주소(따로 두 소스)
    if (typeof RocketTab !== "undefined") RocketTab.setUrls(current_rocket_preset_div.attr("url"));
  }
}

function reset_setting() {
  // FLEXTV 이벤트 탭에서 누르면 이 탭 설정만 되돌린다(서버 설정)
  if ($(".tab-box.active").attr("id") === TAB_ID_ROCKET) {
    if (typeof RocketTab !== "undefined") RocketTab.reset();
    return;
  }
  $(".tab-box").each(function () {
    const parentTab = $(this);
    const parentId = parentTab.attr("id");
    if (TAB_ID_ROCKET === parentId) {
      return;
    }
    if (TAB_ID_EXCEL === parentId) {
      const defult_data = createDefaultJson();
      current_preset_div.attr("data_list", defult_data);
      current_data = JSON.parse(current_preset_div.attr("data_list"));
    } else if (TAB_ID_BATTLE === parentId) {
      const defult_data = createDefaultJson(CURRENT_PRESET_BATTLE_TYPE);
      current_battle_preset_div.attr("data_list", defult_data);
      current_battle_data = JSON.parse(
        current_battle_preset_div.attr("data_list")
      );
    } else if (TAB_ID_TEAM === parentId) {
      const defult_data = createDefaultJson(CURRENT_PRESET_TEAM_TYPE);
      current_team_preset_div.attr("data_list", defult_data);
      current_team_data = JSON.parse(
        current_team_preset_div.attr("data_list")
      );
    }

    clearPreview(parentTab);
    setPreview(parentTab);
    setDisplay(parentTab);
    savePresetData();
  });
}

function createDefaultJson(pageType = null) {
  let jsonObj = {};

  if (_.isNil(pageType) || current_preset_type === pageType) {
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
  } else if (CURRENT_PRESET_BATTLE_TYPE === pageType) {
    jsonObj.battle_theme = "theme-a";
    // 투명도
    jsonObj.win_transparency = 0;
    // 엑셀 배틀 설정
    jsonObj.battle_title = "플렉스 대결";
    jsonObj.battle_title_font_name = "ff-01";
    jsonObj.battle_title_font_color = "#ffffff";
    jsonObj.battle_title_font_bold = "on";
    jsonObj.battle_title_font_size = 28;
  } else if (CURRENT_PRESET_TEAM_TYPE === pageType) {
    jsonObj.team_theme = "theme-team-a";
    // 투명도
    jsonObj.win_transparency = 0;
    // 팀 타이틀 설정

    jsonObj.team_title = "플렉스 대결";
    jsonObj.team_title_font_name = "ff-01";
    jsonObj.team_title_font_color = "#ffffff";
    jsonObj.team_title_font_bold = "on";
    jsonObj.team_title_font_size = 28;
    jsonObj.team_title_font_outline = 0;
    jsonObj.team_title_font_outline_color = "#000000";
    // 팀 폰트(항목)
    jsonObj.team_item_font_name = "ff-01";
    jsonObj.team_item_font_bold = "on";
    jsonObj.team_item_font_size = 16;
    // 팀 항목별 색상
    jsonObj.team_color_header = "#171A1C";
    jsonObj.team_color_bj = "#171A1C";
    jsonObj.team_color_lex = "#171A1C";
    jsonObj.team_color_rate = "#171A1C";
  }


  return JSON.stringify(jsonObj);
}

function addEvent() {
  //console.log("chatjs  addEvent")
  // bj 설정 페이지 URL 복사 binding
  copyText(".btn-setting-btn-copy");

  // bind excel preset event
  addEventPresetForExel();
  // bind battle preset event
  addEventPresetForBattle();
  // bind battle preset event
  addEventPresetForTeam();
  // bind rocket preset event
  addEventPresetForRocket();


  // bind excel event
  addEventForExcel();
  // bind battle event
  addEventForBattle();
  // bind team event
  addEventForTeam();

  // 저장
  $("#btn_save").on("click", function () {
    // console.log("btn_save : ", current_data)
    savePresetData();
  });
  // 초기화
  $("#btn_reset").on("click", function () {
    //  console.log("btn_reset")
    reset_setting();
  });
}

// preset excel event
function addEventPresetForExel() {
  addEventPreset();
}
// preset battle event
function addEventPresetForBattle() {
  addEventPreset(CURRENT_PRESET_BATTLE_TYPE, BATTLE_SELECTOR);
}

function addEventPresetForTeam() {
  addEventPreset(CURRENT_PRESET_TEAM_TYPE, TEAM_SELECTOR);
}

function addEventPresetForRocket() {
  addEventPreset(CURRENT_PRESET_ROCKET_TYPE, ROCKET_SELECTOR);
}

// 엑셀용 이벤트바인드
function addEventForExcel() {
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
    changeThemeColor("colorPickerRate", colorSchema.rate_color);
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

  // 초기화
  $("#tab-excel #btn_win_reset").on("click", function () {
    //  console.log("btn_win_reset")
    //서버로 알린다.
    testmessage_to_server(current_preset_type, "2", "");
  });
  // 새로고침
  $("#tab-excel #btn_win_reload").on("click", function () {
    testmessage_to_server(current_preset_type, "1", "");
    //서버로 알린다.
  });
  // 미리보기 화면
  $("#tab-excel #btn_open_pop").on("click", function () {
    var url = $("#tab-excel #urlCopy").val();
    // console.log("btn_open_pop url", url);
    openWin(url, "플렉스", 500, 500);
    //  window.open(url,"new","width=500,height=500");
  });
}

// bind battle setting event
function addEventForBattle() {
  // excel은 help_ui.js에서 처리
  // battle은 직접 처리
  windowOpacity("sliderChatOpacityBattle", "opacityValBattle");

  // 테마 변경
  $("input[name=chBattleThemeType]").on("input", function () {
    current_battle_data.battle_theme = $(this).val();
  });

  // 엑셀타이틀 변경
  $("#battleTitle").keyup((e) => {
    if (_.isNil(battlePreview)) return;

    const title = $(e.currentTarget).val();
    current_battle_data.battle_title = title;
    // set battle title
    battlePreview.setTitle(current_battle_data.battle_title);
    setTextColor(
      $("#colorPickerBattleTitle"),
      current_battle_data.battle_title_font_color
    );
  });

  // 타이틀 폰트 bold
  $("#battleTitlefontBold").on("change", function () {
    if ($(this).prop("checked")) {
      current_battle_data.battle_title_font_bold = "on";
      battlePreview.addTitleClass("font-weight-bold");
    } else {
      current_battle_data.battle_title_font_bold = "off";
      battlePreview.removeTitleClass("font-weight-bold");
    }
  });

  // 초기화
  $("#tab-battle #btn_win_reset").on("click", function () {
    //  console.log("btn_win_reset")
    //서버로 알린다.
    testmessage_to_server(CURRENT_PRESET_BATTLE_TYPE, "2", "");
  });
  // 새로고침
  $("#tab-battle #btn_win_reload").on("click", function () {
    testmessage_to_server(CURRENT_PRESET_BATTLE_TYPE, "1", "");
    //서버로 알린다.
  });
  // 미리보기 화면
  $("#tab-battle #btn_open_pop").on("click", function () {
    var url = $("#tab-battle #urlCopyBattle").val();
    // console.log("btn_open_pop url", url);
    openWin(url, "플렉스", 500, 500);
    //  window.open(url,"new","width=500,height=500");
  });
}

function setTeamExcelStyle() {
  if (_.isNil(teamPreview)) return;

  const {
    team_title,
    team_title_font_bold,
    team_title_font_color,
    team_title_font_name,
    team_title_font_outline,
    team_title_font_outline_color,
    team_title_font_size,
    team_item_font_size,
    team_item_font_name,
    team_item_font_bold,
    team_color_rate,
    team_color_lex,
    team_color_header,
    team_color_bj
  } = current_team_data;

  teamPreview.teamInfo = getTeamPrevData();
  teamPreview.render();

  teamPreview.setTitle(team_title);
  teamPreview.setItemFontSize(team_item_font_size);
  // font name
  teamPreview.setItemFontName(team_item_font_name);
  // font bold
  teamPreview.setItemFontBold(team_item_font_bold);
  // font team color
  teamPreview.setTeamColor(team_color_header);
  // font bj color
  teamPreview.setBjColor(team_color_bj);
  // font lex color
  teamPreview.setLexColor(team_color_lex);
  // font rate color
  teamPreview.setRateColor(team_color_rate);

  teamPreview.setTitleCSS("color", team_title_font_color);
  // title bold
  if ('on' === team_title_font_bold) {
    teamPreview.addTitleClass("font-weight-bold");
  } else {
    teamPreview.removeTitleClass("font-weight-bold");
  }
  // font name
  teamPreview.addTitleClass(team_title_font_name);
  //title font  size
  teamPreview.setTitleCSS("font-size", `${team_title_font_size}px`);
  //타이틀 외곽선
  teamPreview.setTitleOutline(team_title_font_outline_color, team_title_font_outline);

  teamPreview.applyStyle();
}

function setTeamBattleStyle() {
  if (_.isNil(teamPreview)) return;

  const {
    team_title,
    team_title_font_bold,
    team_title_font_color,
    team_title_font_name,
    team_title_font_size,
  } = current_team_data;

  teamPreview.teamInfo = getTeamBattlePreviewData();
  teamPreview.render();

  teamPreview.setTitle(team_title);
  // title color
  teamPreview.setTitleCSS("color", team_title_font_color);
  // title bold
  if ('on' === team_title_font_bold) {
    teamPreview.addTitleClass("font-weight-bold");
  } else {
    teamPreview.removeTitleClass("font-weight-bold");
  }
  // font name
  teamPreview.addTitleClass(team_title_font_name);
  //title font  size
  teamPreview.setTitleCSS("font-size", `${team_title_font_size}px`);
}

function changePreviewClone() {
  $(".preview-area.clone-preview-box").remove();
  $(".preview-area").each(function () {
    const previewBox = $(this);
    previewBox.after(previewBox.clone().addClass("clone-preview-box"));
  });
}

// bind team setting event
function addEventForTeam() {
  // excel은 help_ui.js에서 처리
  // team은 직접 처리
  windowOpacity("sliderChatOpacityTeam", "opacityValTeam");

  // 테마 변경
  $("input[name=chTeamThemeType]").on("input", function () {
    console.log("🌼🌼🌼🌼🌼🌼");
    current_team_data.team_theme = $(this).val();
    if (_.isNil(teamPreview)) return;

    teamPreview.theme = current_team_data.team_theme;
    if (teamPreview.isTeamType) {
      // 테마 변경 시 스타일 적용
      setTeamExcelStyle();
    } else {
      // 테마 변경 시 스타일 적용
      setTeamBattleStyle();
    }
    // 테마에따른 프리셋을 교체
    changePreviewClone();
  });

  // 엑셀타이틀 변경
  $("#teamTitle").keyup((e) => {
    const title = $(e.currentTarget).val();
    current_team_data.team_title = title;
    // set team title
    setTextColor(
      $("#colorPickerTeamTitle"),
      current_team_data.team_title_font_color
    );

    if (_.isNil(teamPreview)) return;
    teamPreview.setTitle(current_team_data.team_title);
  });

  // 타이틀 폰트 bold
  $("#teamTitlefontBold").on("change", function () {
    if ($(this).prop("checked")) {
      current_team_data.team_title_font_bold = "on";
      if (!_.isNil(teamPreview)) teamPreview.addTitleClass("font-weight-bold");
    } else {
      current_team_data.team_title_font_bold = "off";
      if (!_.isNil(teamPreview)) teamPreview.removeTitleClass("font-weight-bold");
    }
  });

  // 아이템 폰트 bold
  $("#teamItemfontBold").on("change", function () {
    if ($(this).prop("checked")) {
      current_team_data.team_item_font_bold = "on";
      if (!_.isNil(teamPreview)) teamPreview.addItemClass("font-weight-bold");
    } else {
      current_team_data.team_item_font_bold = "off";
      if (!_.isNil(teamPreview)) teamPreview.removeItemClass("font-weight-bold");
    }
  });

  // 초기화
  $("#tab-team #btn_win_reset").on("click", function () {
    //  console.log("btn_win_reset")
    //서버로 알린다.
    testmessage_to_server(CURRENT_PRESET_TEAM_TYPE, "2", "");
  });
  // 새로고침
  $("#tab-team #btn_win_reload").on("click", function () {
    testmessage_to_server(CURRENT_PRESET_TEAM_TYPE, "1", "");
    //서버로 알린다.
  });
  // 미리보기 화면
  $("#tab-team #btn_open_pop").on("click", function () {
    var url = $("#tab-team #urlCopyTeam").val();
    // console.log("btn_open_pop url", url);
    openWin(url, "플렉스", 500, 500);
    //  window.open(url,"new","width=500,height=500");
  });
}

function savePresetData() {
  const parentTab = $(".tab-box.active");
  if (parentTab.length === 0) {
    return;
  }

  const parentId = parentTab.attr("id");

  let targetDiv;
  let targetData;
  if (TAB_ID_EXCEL === parentId) {
    targetDiv = current_preset_div;
    targetData = current_data;
  } else if (TAB_ID_BATTLE == parentId) {
    targetDiv = current_battle_preset_div;
    targetData = current_battle_data;
  } else if (TAB_ID_TEAM == parentId) {
    targetDiv = current_team_preset_div;
    targetData = current_team_data;
  } else if (TAB_ID_ROCKET == parentId) {
    if (typeof RocketTab !== "undefined") RocketTab.save();
    return;
  }

  savePreset(targetDiv, targetData);
}

function testmessage_to_server(presetType, _type, _msg) {
  var param = {};
  param.type = presetType;
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
  const currentTab = $(".tab-box.active");
  currentTab.find(".preview-list-area").css({ opacity: t_val });
}
function setPreview(parentTab) {
  const parentId = parentTab.attr("id");
  if (TAB_ID_EXCEL === parentId) {
    setPreviewForExcel(parentTab);
  } else if (TAB_ID_BATTLE === parentId) {
    setPreviewForBattle(parentTab);
  } else if (TAB_ID_TEAM === parentId) {
    setPreviewForTeam(parentTab);
  }
}

function prev_handle_battle_transparency(_temp) {
  if (current_battle_data) current_battle_data.win_transparency = _temp;
  _temp = 100 - _temp;
  var t_val = _temp * 0.01;
  const currentTab = $(".tab-box.active");
  currentTab.find(".preview-list-area").css({ opacity: t_val });
}

function prev_handle_team_transparency(_temp) {
  if (current_team_data) current_team_data.win_transparency = _temp;
  _temp = 100 - _temp;
  var t_val = _temp * 0.01;
  const currentTab = $(".tab-box.active");
  currentTab.find(".preview-list-area").css({ opacity: t_val });
}

function setPreviewForExcel(parentTab) {
  const previewList = parentTab.find(".preview-list");
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
    text: "BJ",
  }).appendTo(tr);
  // table header gold
  $("<th>", {
    scope: "col",
    class: "excel-gold-th",
    text: "렉스",
  }).appendTo(tr);
  // table header rate
  $("<th>", {
    scope: "col",
    class: "excel-rate-th",
    text: "기여도",
  }).appendTo(tr);
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
      class: "excel-rate",
      text: `${numberWithCommas(gold / Math.pow(10, i))}`,
    }).appendTo(tr);
  }
}

// battle preview
function setPreviewForBattle(parentTab) {
  if (battlePreview) {
    return battlePreview.reRender();
  }

  const previewList = parentTab.find(".preview-list");
  // const previewParent = previewList.parent();
  if (previewList.length < 0) return;

  const BATTLE_PREVIEW_DATA = {
    excel: 1234,
    title: "플렉스 대결",
    teams: [
      {
        teamId: 0,
        members: [{ memberId: 1234566, nickname: "닉네임1" }],
        options: {
          lex: 5300,
          rate: 5300,
          colors: {
            bg: "#ff0000",
            name: "#ffffff",
            win: "#00ff00",
            score: "#ffffff",
          },
        },
      },
      {
        teamId: 1,
        members: [{ memberId: 3234566, nickname: "닉네임2" }],
        options: {
          lex: 2300,
          rate: 2300,
          colors: {
            bg: "#0000ff",
            name: "#ffffff",
            win: "#00ff00",
            score: "#ffffff",
          },
        },
      },
    ],
  };

  battlePreview = new BattleCompoment(previewList);
  battlePreview.setBattleInfo(BATTLE_PREVIEW_DATA);
  battlePreview.render();
  battlePreview.resetTeamSum();
}

function getTeamBattlePreviewData() {
  return {
    excelId: 634,
    title: "플렉스 팀 대전",
    teams: [
      {
        teamId: 42,
        teamName: "A 팀",
        options: {
          lex: "800",
          rate: "0",
          colors: { bg: "#00000000", win: "#00ff00", name: "#00000000" },
          sumLex: 0,
          sumRate: 0,
        },
        members: [
          { memberId: 989564, nickname: "닉네임 1" },
          { memberId: 601215, nickname: "닉네임 2" },
        ],
      },
      {
        teamId: 43,
        teamName: "B 팀",
        options: {
          lex: "740",
          rate: "0",
          colors: { bg: "#00000000", win: "#00ff00", name: "#00000000" },
          sumLex: 0,
          sumRate: 0,
        },
        members: [
          { memberId: 601026, nickname: "닉네임 3" },
          { memberId: 600869, nickname: "닉네임 4" },
        ],
      },
    ],
  }
}

function getTeamPrevData() {
  return {
    title: "플렉스 팀 대전",
    sort: "lex",
    header: {
      lex: "렉스",
      rate: "기여도",
      enableRate: true,
    },
    teams: [
      {
        name: "A 팀",
        teamId: 42,
        totalSponsorScore: 800,
        totalSponsorContribution: 800,
        members: [
          {
            id: 131,
            nickname: "닉네임 1",
            memberId: 989564,
            sponsorScore: 200,
            sponsorContribution: 200,
            options: {
              lex: "0",
              rate: "0",
              colors: {
                bg: "#00000000",
                win: "#00ff00",
                name: "#00000000",
              },
            },
          },
          {
            id: 132,
            nickname: "닉네임 2",
            memberId: 601215,
            sponsorScore: 600,
            sponsorContribution: 600,
            options: {
              lex: "0",
              rate: "0",
              colors: {
                bg: "#00000000",
                win: "#00ff00",
                name: "#00000000",
              },
            },
          },
        ],
        options: {
          lex: "0",
          rate: "0",
          colors: {
            bg: "#00000000",
            win: "#00ff00",
            name: "#00000000",
          },
        },
      },
      {
        name: "B 팀",
        teamId: 43,
        totalSponsorScore: 740,
        totalSponsorContribution: 560,
        members: [
          {
            id: 133,
            nickname: "닉네임 3",
            memberId: 601026,
            sponsorScore: 540,
            sponsorContribution: 360,
            options: {
              lex: "0",
              rate: "0",
              colors: {
                bg: "#00000000",
                win: "#00ff00",
                name: "#00000000",
              },
            },
          },
          {
            id: 134,
            nickname: "닉네임 4",
            memberId: 600869,
            sponsorScore: 200,
            sponsorContribution: 200,
            options: {
              lex: "0",
              rate: "0",
              colors: {
                bg: "#00000000",
                win: "#00ff00",
                name: "#00000000",
              },
            },
          },
        ],
        options: {
          lex: "0",
          rate: "0",
          colors: {
            bg: "#00000000",
            win: "#00ff00",
            name: "#00000000",
          },
        },
      },
    ],
  };
}

// team preview
function setPreviewForTeam(parentTab) {
  console.log("current_team_data", current_team_data);
  if (teamPreview) {
    return teamPreview.reRender();
  }

  const previewList = parentTab.find(".preview-list");
  // const previewParent = previewList.parent();
  if (previewList.length < 0) return;

  const { team_theme } = current_team_data;

  teamPreview = new Team(previewList);
  teamPreview.theme = team_theme;

  if (teamPreview.isTeamType) {
    teamPreview.teamInfo = getTeamPrevData();
  } else {
    teamPreview.teamInfo = getTeamBattlePreviewData();
  }

  teamPreview.render();

}

// display
function setDisplay(parentTab) {
  // 설정페이지 접속
  $(".btn-setting").attr("disabled", false);

  const parentId = parentTab.attr("id");
  if (TAB_ID_EXCEL === parentId) {
    setDisplayForExcel(current_data, parentTab);
  } else if (TAB_ID_BATTLE === parentId) {
    setDisplayForBattle(current_battle_data, parentTab);
  } else if (TAB_ID_TEAM === parentId) {
    setDisplayForTeam(current_team_data, parentTab);
  }
}
// display for excel
function setDisplayForExcel(_data, parentTab) {
  // 엑셀 투명도
  const win_transparency = _data.win_transparency;
  const excelOpt = document.getElementById("sliderChatOpacity");
  excelOpt.noUiSlider.set(win_transparency);
  prev_set_transparency(win_transparency, parentTab);

  // 엑셀 테마
  parentTab
    .find("input[name=chType1][value=" + _data.excel_theme + "]")
    .prop("checked", true);
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
  setTextColor($("#colorPickerRate"), _data.excel_color_rate);

  $(".spinner-border").css("display", "none");
}

// battle display
function setDisplayForBattle(_data, parentTab) {
  // 배틀 투명도
  const win_transparency = _data.win_transparency;
  const battleOpt = document.getElementById("sliderChatOpacityBattle");
  battleOpt.noUiSlider.set(win_transparency);
  prev_set_transparency(win_transparency, parentTab);

  // 엑셀 테마
  parentTab
    .find("input[name=chBattleThemeType][value=" + _data.battle_theme + "]")
    .prop("checked", true);

  // 엑셀 타이틀
  battlePreview.setTitle(_data.battle_title);
  $("#battleTitle").val(_data.battle_title);

  // 엑셀 타이틀 color
  setTextColor($("#colorPickerBattleTitle"), _data.battle_title_font_color);
  // 타이틀 폰트 bold
  const isTitleFontBold = _data.battle_title_font_bold == "on";
  $("#battleTitlefontBold").prop("checked", isTitleFontBold);

  const titleFont = document.getElementById("battleTitleFont");
  const titleFontViewList = document.getElementById(
    "font-view-list-battle-title"
  );
  const titleFontFamily = document.getElementById("battleTitlefontFmaily");
  prevFontBattleTitle = _data.battle_title_font_name;

  setFontFamily(
    ".battle-title",
    titleFont,
    _data.battle_title_font_name,
    titleFontFamily,
    titleFontViewList
  );

  setFontSize(
    _data.battle_title_font_size,
    "sliderBattleTitleFontSize",
    "sliderBattleTitlefontSizeVal",
    isTitleFontBold
  );
}

// team display
function setDisplayForTeam(_data, parentTab) {
  // 배틀 투명도
  const win_transparency = _data.win_transparency;
  const teamOpt = document.getElementById("sliderChatOpacityTeam");
  teamOpt.noUiSlider.set(win_transparency);
  prev_set_transparency(win_transparency, parentTab);

  //console.log("🔥~ setDisplayForTeam ~ _data.team_theme:", _data.team_theme, _data);
  // 엑셀 테마
  parentTab
    .find("input[name=chTeamThemeType][value=" + _data.team_theme + "]")
    .prop("checked", true).trigger('input');

  // 엑셀 타이틀
  if (!_.isNil(teamPreview)) {
    teamPreview.setTitle(_data.team_title);
  }
  $("#teamTitle").val(_data.team_title);

  // 엑셀 타이틀 color
  setTextColor($("#colorPickerTeamTitle"), _data.team_title_font_color);
  // 타이틀 폰트 bold
  const isTitleFontBold = _data.team_title_font_bold == "on";
  $("#teamTitlefontBold").prop("checked", isTitleFontBold);

  // 타이틀 폰트
  const titleFont = document.getElementById("teamTitleFont");
  const titleFontViewList = document.getElementById(
    "font-view-list-team-title"
  );
  const titleFontFamily = document.getElementById("teamTitlefontFmaily");
  prevFontTeamTitle = _data.team_title_font_name;

  // 타이틀 폰트 bold
  const isItemFontBold = _data.team_item_font_bold == "on";
  $("#teamItemfontBold").prop("checked", isItemFontBold);

  // 팀 아이템 폰트
  const itemFont = document.getElementById("teamItemFont");
  const itemFontViewList = document.getElementById(
    "font-view-list-team-item"
  );
  const itemFontFamily = document.getElementById("teamItemfontFmaily");
  prevFontTeamItem = _data.team_item_font_name;

  setFontFamily(
    ".team-title",
    titleFont,
    _data.team_title_font_name,
    titleFontFamily,
    titleFontViewList
  );

  setFontSize(
    _data.team_title_font_size,
    "sliderTeamTitleFontSize",
    "sliderTeamTitlefontSizeVal",
    isTitleFontBold
  );

  //엑셀 타이틀 외곽선 color
  setTextColor(
    $("#colorPickerTeamTitleStrokeColor"),
    _data.team_title_font_outline_color
  );

  //엑셀 타이틀 외곽선 size
  setFontSize(
    _data.team_title_font_outline,
    "sliderTeamTitleFontBorder",
    "sliderTeamTitleFontBorderVal",
    isTitleFontBold,
    0,
    20,
    1
  );

  // 팀 아이템 폰트
  setFontFamily(
    ".team-item",
    itemFont,
    _data.team_item_font_name,
    itemFontFamily,
    itemFontViewList
  );

  // 팀 아이템 폰트 크기
  setFontSize(
    _data.team_item_font_size,
    "sliderTeamItemFontSize",
    "sliderTeamItemfontSizeVal",
    isTitleFontBold,
    0,
    60,
    1
  );

  setTextColor($("#colorPickerTeamHeader"), _data.team_color_header);
  setTextColor($("#colorPickerTeamBJ"), _data.team_color_bj);
  setTextColor($("#colorPickerTeamLex"), _data.team_color_lex);
  setTextColor($("#colorPickerTeamRate"), _data.team_color_rate);

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
    case "colorPickerRate":
      current_data.excel_color_rate = fontColor;
      $(".excel-rate").css("color", fontColor);
      break;
    case "colorPickerExcelTitle":
      current_data.excel_title_font_color = fontColor;
      $(".excel-title").css("color", fontColor);
      break;
    case "colorPickerExcelTitleStrokeColor":
      current_data.excel_title_font_outline_color = fontColor;
      changeFontSizeExcelTitleStroke("sliderTitleFontBorderVal");
      break;
    case "colorPickerBattleTitle":
      current_battle_data.battle_title_font_color = fontColor;
      battlePreview.setTitleCSS("color", fontColor);
      break;
    case "colorPickerTeamTitle":
      current_team_data.team_title_font_color = fontColor;
      if (!_.isNil(teamPreview)) {
        teamPreview.setTitleCSS("color", fontColor);
      }
      break;
    case "colorPickerTeamTitleStrokeColor":
      current_team_data.team_title_font_outline_color = fontColor;
      if (!_.isNil(teamPreview)) {
        const width = current_team_data.team_title_font_outline;
        teamPreview.setTitleOutline(fontColor, width);
      }
      break;
    case "colorPickerTeamHeader":
      current_team_data.team_color_header = fontColor;
      if (_.isNil(teamPreview)) return;

      if (!teamPreview.isTeamType) {
        return Message.show("팀 테마에서만 설정 가능합니다.");
      }

      teamPreview.setTeamColor(fontColor);

      break;
    case "colorPickerTeamBJ":
      current_team_data.team_color_bj = fontColor;
      if (_.isNil(teamPreview)) return;

      if (!teamPreview.isTeamType) {
        return Message.show("팀 테마에서만 설정 가능합니다.");
      }

      teamPreview.setBjColor(fontColor);

      break;
    case "colorPickerTeamLex":
      current_team_data.team_color_lex = fontColor;
      if (_.isNil(teamPreview)) return;

      if (!teamPreview.isTeamType) {
        return Message.show("팀 테마에서만 설정 가능합니다.");
      }

      teamPreview.setLexColor(fontColor);

      break;
    case "colorPickerTeamRate":
      current_team_data.team_color_rate = fontColor;
      if (_.isNil(teamPreview)) return;

      if (!teamPreview.isTeamType) {
        return Message.show("팀 테마에서만 설정 가능합니다.");
      }

      teamPreview.setRateColor(fontColor);
      break;
  }
}

////////////////////////////////////////////////////////////////////셋팅

function prev_set_transparency(_temp, parentTab) {
  _temp = 100 - _temp;
  var t_val = _temp * 0.01;
  parentTab.find(".preview-list-area").css({ opacity: t_val });
}

var cnt = 0;
var myTimeout = [];

$(".preview-list").empty();

function clearPreview(parentTab) {
  cnt = 0;
  for (var i = 0; i < myTimeout.length; i++) {
    clearTimeout(myTimeout[i]);
  }

  parentTab.find(".preview-list").empty();
}

async function callApiCheckApprove() {
  const url = `${g_url}/api/excel/project/checkApprove`;

  const response = await axios.get(url);
  const json = response.data;
  //console.log("🔥 ~ callApiCheckApprove ~ json:", json);

  if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
    throw new Error(json.message || "");
  }
  return json.resultMap.data || [];
}

async function checkApproveExcel() {
  try {
    await callApiCheckApprove();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

g_login_checking(login_callbackFn);
function login_callbackFn(member) {
  //console.log("login_callbackFn", member )
  checkApproveExcel()
    .then(() => {
      init();
    })
    .catch((e) => {
      Message.show(
        Message.multiLineMessage([
          "엑셀방송 신청은 방송페이지에서 가능합니다.",
        ]),
        {
          type: "warn",
          title: "안내",
          label: "이동하기",
          closeHandler: () => {
            history.back();
            //g_flextv
            window.open(`${g_flextv}/channels/broadcast`, "_blank");
          },
        }
      );

      $(".spinner-border").css("display", "none");
    });
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
    // 엑셀탸이틀
    let selectValue = $("#excelTitleFont").val();

    current_data.excel_title_font_name = selectValue;
    if (prevFontExcelTitle) {
      $(".excel-title").removeClass(prevFontExcelTitle);
    }
    $(".excel-title").addClass(selectValue);
    prevFontExcelTitle = selectValue;
  } else if (num == 2) {
    // 엑셀 아이템
    let selectValue = $("#excelItemFont").val();
    current_data.excel_item_font_name = selectValue;
    if (prevFontExcelItem) {
      $(".excel-row").removeClass(prevFontExcelItem);
      $("table thead tr th").removeClass(prevFontExcelItem);
    }
    $(".excel-row").addClass(selectValue);
    $("table thead tr th").addClass(selectValue);

    prevFontExcelItem = selectValue;
  } else if (num == 3) {
    // 엑셀탸이틀
    const selectValue = $("#battleTitleFont").val();

    current_battle_data.battle_title_font_name = selectValue;
    if (prevFontBattleTitle) {
      battlePreview.removeTitleClass(prevFontBattleTitle);
    }

    battlePreview.addTitleClass(selectValue);
    prevFontBattleTitle = selectValue;
  } else if (num == 4) {
    // 엑셀탸이틀
    const selectValue = $("#teamTitleFont").val();

    current_team_data.team_title_font_name = selectValue;
    if (prevFontTeamTitle) {
      if (!_.isNil(teamPreview)) {
        teamPreview.removeTitleClass(prevFontTeamTitle);
      }
    }

    prevFontTeamTitle = selectValue;
    if (!_.isNil(teamPreview)) {
      teamPreview.addTitleClass(selectValue);
    }

  } else if (num == 5) {
    // 엑셀 팀 아이템
    let selectValue = $("#teamItemFont").val();
    current_team_data.team_item_font_name = selectValue;

    if (prevFontTeamItem) {
      if (teamPreview) {
        teamPreview.removeItemClass(prevFontTeamItem);
      }
    }

    prevFontTeamItem = selectValue;
    if (!_.isNil(teamPreview)) {
      teamPreview.setItemFontName(selectValue);
    }
  }
}

function goToExcelBjSettings() {
  // const settingUrl = $("#settingUrlCopy").val();
  const settingUrl = `/view/excel_setting.html?page=${current_preset_div.attr(
    "page"
  )}`;
  //console.log("🔥 ~ goToExcelBjSettings ~ settingUrl:", settingUrl);
  //location.href = settingUrl;
  // 새 탭으로 변경
  window.open(settingUrl, "excel_settings");
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
  } else if (".excel-row" === selector) {
    // .excel-row
    changeFontFamily(2);
  } else if (".battle-title" === selector) {
    changeFontFamily(3);
  } else if (".team-title" === selector) {
    changeFontFamily(4);
  } else if (".team-item" === selector) {
    changeFontFamily(5);
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

  //console.log('🔥🌼🌼setFontSize:', startVal, slideID, sizeValID, isBold)

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
    } else if (slideID == "sliderBattleTitleFontSize") {
      changeFontSizeBattleTitle(isBold, sizeValID);
    } else if (slideID == "sliderTeamTitleFontSize") {
      changeFontSizeTeamTitle(isBold, sizeValID);
    } else if (slideID == "sliderTeamTitleFontBorder") {
      changeFontSizeTeamTitleStroke(isBold, sizeValID);
    } else if (sliderId = 'sliderTeamItemFontSize') {
      changeFontSizeTeamItem(isBold, sizeValID);
    }
  });

  fsVal.addEventListener("change", function () {
    fs.noUiSlider.set(this.value);
  });
}

function windowOpacity(sliderId, valueId) {
  //console.log("🔥 ~ windowOpacity ~ sliderId:", sliderId)
  const sliderOpt = document.getElementById(sliderId);
  const optVal = document.getElementById(valueId);

  if (!sliderOpt || !optVal) return;

  noUiSlider.create(sliderOpt, {
    start: 0,
    connect: "lower",
    step: 1,
    range: {
      min: 0,
      max: 100,
    },
  });

  sliderOpt.noUiSlider.on("update", function (values, handle) {
    optVal.value = parseInt(values[handle]);
    prev_handle_battle_transparency(optVal.value);
  });

  optVal.addEventListener("change", function () {
    sliderOpt.noUiSlider.set(this.value);
  });
}

// 배틀 폰트 사이즈 변경
function changeFontSizeBattleTitle(isBold, sizeValID) {
  const fontSize = $(`#${sizeValID}`).val();
  // update css
  current_battle_data.battle_title_font_size = fontSize;
  if (isBold) {
    battlePreview.addTitleClass("font-weight-bold");
  }

  battlePreview.setTitleCSS("font-size", fontSize + "px");
  battlePreview.setTitleCSS(
    "color",
    current_battle_data.battle_title_font_color
  );
}

function changeFontSizeTeamTitle(isBold, sizeValID) {
  const fontSize = $(`#${sizeValID}`).val();
  // update css
  current_team_data.team_title_font_size = fontSize;
  if (_.isNil(teamPreview)) return;

  if (isBold) {
    teamPreview.addTitleClass("font-weight-bold");
  }

  teamPreview.setTitleCSS("font-size", fontSize + "px");
  teamPreview.setTitleCSS(
    "color",
    current_team_data.team_title_font_color
  );
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

function changeFontSizeTeamTitleStroke(isBold, sizeValID) {
  const strokeSize = $(`#${sizeValID}`).val();
  current_team_data.team_title_font_outline = strokeSize ?? 0;

  const strokeColor = $("#colorPickerTeamTitleStrokeColor").val();
  console.log("🔥🌼 ~ changeFontSizeTeamTitleStroke ~ strokeColor:", strokeColor);

  // const fontSize = $("#sliderTeamTitlefontSizeVal").val();

  if (!_.isNil(teamPreview)) {
    teamPreview.setTitleOutline(strokeColor, strokeSize);
  };
}


function changeFontSizeTeamItem(isBold, sizeValID) {
  const fontSize = $(`#${sizeValID}`).val();
  // update css
  current_team_data.team_item_font_size = fontSize;
  if (!_.isNil(teamPreview)) {
    teamPreview.setItemFontSize(fontSize);

  };
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
