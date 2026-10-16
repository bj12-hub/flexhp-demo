var my_key;
var current_data;
var prev_font_name;
var current_flex_num = 0;
var current_flex_num_goal = 0;
var current_preset_type = "honeypot";

var startFlexNum = 0;

//honeypot loading bar
/** @type {HoneypotLoadingBar} */
const honeypotLoadBar = new HoneypotLoadingBar($(".chat-box.display-box-area"));

// 현재 honey
function setCurrentNum(num, num_goal) {
  // 최종값을 보내줌(increase하지 않음.)
  current_flex_num = parseInt(num || 0);
  current_flex_num_goal = parseInt(num_goal || 0);
}

// 초기화
function init() {
  var parts_ = window.location.pathname.split("/");
  my_key = parts_.pop();

  startSocket(my_key);
}

function startSocket(_key) {
  const socket = io(g_url_socket, {
    autoConnect: false,
    //secure: true,
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    get_data(_key);

    socket.emit("login", { page: _key }, function (data) {
      // console.log(data);
    });
  });

  socket.on("disconnect", function (data) {
    console.log("❌ Disconnect~~~~~~~", data); // alert("통신이 끊어졌습니다");
  });

  socket.on("honeypot", function (data) {
    //console.log("🔥 ~ startSocket ~ data:", data);
    const { current_num, goal_num, type, isIncreased } = data;
    if (parseInt(type) === "2") {
      get_data(my_key);
    } else {
      setCurrentNum(current_num, goal_num);
      addHoneyNum(current_num, goal_num, !isIncreased);
    }
  });

  socket.on("help", function (data) {
    // console.log('help', data);
    window.location.reload();
  });

  socket.on("testMessage", function (data) {
    var _data = data.data;
    //console.log("🔥 ~ startSocket ~ _data:", _data);
    if (_data.type == "1") {
      //새로고침
      window.location.reload();
    } else if (_data.type == "2") {
      // 초기화
      get_data(my_key);
    } else if (_data.type == "3") {
      //추천
    } else if (_data.type == "6") {
      //꿀
      setCurrentNum(_data.msg, current_flex_num_goal);
      addHoneyNum(_data.msg, current_flex_num_goal, true);
    }
  });

  socket.on("eventaction", function (data) {
    console.log("eventaction", data);
    if (data.type == "2") {
      // 초기화
      localStorage.removeItem("flex_" + my_key);
      current_flex_num = 0;
      get_data(my_key);
    }
  });

  socket.open();
}

function createDefaultJson() {
  return HoneypotLoadingBar.createDefaultJson();
}

// 프레셋 로드
async function get_data(_key) {
  try {
    const response = await axios.get(g_url + "/pages/preset/" + _key);
    current_data = response.data;
    if (current_data == "" || current_data == null) {
      current_data = createDefaultJson();
    }

    await get_num();
    setDisplay(current_data);
    set_honey_bar();
  } catch (e) {
    console.error(e);
  }
}

//현재 하트
// FIXME FLEXTV의 현재 꿀단지 정보를 불러오는 것으로 변경 필요(API 연동 필요)
async function get_num() {
  try {
    const response = await axios.get(
      g_url + "/event/getcurrenthoney/" + my_key,
    );
    const responseData = response.data;

    if (responseData) {
      const currentHoney = responseData["current_num"];
      const goalHoney = responseData["goal_num"];
      setCurrentNum(currentHoney, goalHoney);
    }
  } catch (e) {
    console.error(e);
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

function initHoneypotLoadingBar() {
  honeypotLoadBar.setData(HoneypotLoadingBar.UI_TREE.TITLE, getTitle());
  honeypotLoadBar.setData(
    HoneypotLoadingBar.UI_TREE.SUB_TITLE,
    getIndsideText(),
  );

  if (!honeypotLoadBar.isInitialized) {
    honeypotLoadBar.initialize();
  }
}

function setDisplay(_data) {
  initHoneypotLoadingBar();

  // 투명도
  const opacity = (100 - _data.win_transparency) * 0.01;
  honeypotLoadBar.setCssBySelector("honeypot-bar-area", { opacity });

  addHoneyNum(0, 0, true);

  // 내부폰트색
  setTextColor_out(_data.text_main_color);
  setTextColor_in(_data.text_sub_color);
  // 그래프내부색
  set_inside_honey_bar(_data.graph_background_color);

  pre_set_chat_font(_data.font_name);
  pre_set_chat_font_bold(_data.font_bold);
  pre_set_chat_font_size(_data.font_size);
  prev_chat_fontStroke();
}

// 꿀단지 텍스트
function setTextColor_out(color) {
  honeypotLoadBar.setCssBySelector(".main-title", { color: color });
}

// 후원꿀텍스트
function setTextColor_in(color) {
  honeypotLoadBar.setCssBySelector(".sub-title", { color: color });
}

// 그래프 내부색
function set_inside_honey_bar(color) {
  honeypotLoadBar.setCssBySelector(".honey_path", { fill: color });
}

function addHoneyNum(num, num_goal, skipAnimation = true) {
  var num = parseInt(num);

  if (isNaN(num)) return;

  set_honey_bar();

  if (!skipAnimation) {
    honeypotLoadBar.createFloatingAnimation(num);
  }
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

function pre_set_chat_font(_className) {
  if (prev_font_name) {
    if (
      honeypotLoadBar.hasClassBySelector(".honeypot-bar-area", prev_font_name)
    )
      honeypotLoadBar.removeClassBySelector(
        ".honeypot-bar-area",
        prev_font_name,
      );
  }

  honeypotLoadBar.addClassBySelector(".honeypot-bar-area", _className);
  prev_font_name = _className;
}

function pre_set_chat_font_size(_size) {
  honeypotLoadBar.setCssBySelector(".pro-title", { "font-size": `${_size}px` });
  honeypotLoadBar.setCssBySelector(".ldBar-title", {
    "font-size": `${_size}px`,
  });
}

function pre_set_chat_font_bold(_toggle) {
  if (_toggle == "on") {
    honeypotLoadBar.addClassBySelector(
      ".honeypot-bar-area",
      "font-weight-bold",
    );
  } else {
    honeypotLoadBar.removeClassBySelector(
      ".honeypot-bar-area",
      "font-weight-bold",
    );
  }
}

function prev_chat_fontStroke() {
  var strokeSize = current_data.font_outline;
  var strokeColor = current_data.font_outline_color;
  var fontSize = current_data.font_size;

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

init();
