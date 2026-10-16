var my_key;
var current_data;
var prev_font_name;
var current_flex_num = 0;
var current_preset_type = "heart";

const HEART_LIMIT = 10000;

var startFlexNum = 0;


//heart loading bar
/** @type {HeartLoadingBar} */
const heartLoadBar = new HeartLoadingBar($(".chat-box.heart-box-area"));

// 현재 heart
function setCurrentNum(num) {
  // 최종값을 보내줌(increase하지 않음.)
  current_flex_num = parseInt(num);
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

    socket.emit("login", { page: _key, },
      function (data) {
        // console.log(data);
      }
    );
  });

  socket.on("disconnect", function (data) {
    console.log("disconnect~~~~~~~", data); // alert("통신이 끊어졌습니다");
  });


  socket.on("heart", function (data) {
    //console.log("🔥 ~ startSocket ~ data:", data);
    const { current_num, isSponsor, msg, sponsor_num, type } = data;
    if (parseInt(type) === '2') {
      get_data(my_key);
    } else {
      setCurrentNum(parseInt(current_num));
      addHeartNum(parseInt(current_num));
    }
  });

  socket.on("help", function (data) {
    // console.log('help', data);
    window.location.reload();
  });

  socket.on("testMessage", function (data) {
    var _data = data.data;
    console.log("🔥 ~ startSocket ~ _data:", _data)
    if (_data.type == "1") {
      //새로고침
      window.location.reload();
    } else if (_data.type == "2") {
      get_data(my_key);
    } else if (_data.type == "3") {
      //추천
    } else if (_data.type == "5") {
      //하트
      setCurrentNum(parseInt(_data.msg));
      addHeartNum(_data.msg);
    }
  });

  socket.on("eventaction", function (data) {
    console.log("eventaction", data);
    if (data.type == "2") {
      localStorage.removeItem("flex_" + my_key);
      current_flex_num = 0;
      get_data(my_key);
    }
  });

  socket.open();
}

// 받은 하트
function setCurrentTargetFromSocket(data) {
  setCurrentNum(parseInt(data.msg));
  addHeartNum(data.msg);
}

function createDefaultJson() {
  return HeartLoadingBar.createDefaultJson();
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
    set_heart_bar();

  } catch (e) {
    console.error(e);
  }
}


//현재 하트
async function get_num() {
  try {
    const response = await axios.get(g_url + "/event/getcurrentheart/" + my_key);
    const responseData = response.data;
    if (responseData) {
      const currentHeart = responseData["current_num"];
      setCurrentNum(currentHeart);
    }
  } catch (e) {
    console.error(e);
  }
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

function initHeartLoadingBar() {
  heartLoadBar.setData(HeartLoadingBar.UI_TREE.TITLE, getTitle());
  heartLoadBar.setData(HeartLoadingBar.UI_TREE.SUB_TITLE, getIndsideText());
  heartLoadBar.setGraphColor(current_data.graph_circle_color);

  if (!heartLoadBar.isInitialized) {
    heartLoadBar.initialize();
  }
}


function setDisplay(_data) {
  initHeartLoadingBar();

  // 투명도
  const opacity = (100 - _data.win_transparency) * 0.01;
  heartLoadBar.setCssBySelector('heart-bar-area', { opacity });

  heartLoadBar.setCssBySelector('heart-box', { height: `${_data.graph_border}px` });

  var _border = parseInt(_data.graph_border);
  var t_val = parseInt(_border * 0.2) + 1;
  heartLoadBar.setBorderWidth(t_val);


  addHeartNum(0, true);

  // 내부폰트색
  setTextColor_out(_data.text_outside_color);
  setTextColor_in(_data.text_inside_color);

  // 그래프내부색
  set_inside_heart_bar(_data.graph_background_color);
  // 그래프 모양색
  set_graph_heart_circle(_data.graph_circle_color);


  pre_set_chat_font(_data.font_name);
  pre_set_chat_font_bold(_data.font_bold);
  pre_set_chat_font_size(_data.font_size);
  prev_chat_fontStroke();
}

function set_graph_heart_circle(color) {
  heartLoadBar.setCssBySelector(".mainline", { stroke: color });
}

function setTextColor_out(color) {
  heartLoadBar.setCssBySelector(".pro-title", { color: color });
}

function setTextColor_in(color) {
  heartLoadBar.setCssBySelector(".inner-txt", { color: color });
  heartLoadBar.setCssBySelector(".ldBar-label", { color: color });
}

function set_inside_heart_bar(color) {
  heartLoadBar.setCssBySelector(".heart-inner", { 'background-color': color });
  heartLoadBar.setCssBySelector(".baseline", { stroke: color });
}


function addHeartNum(num, skipHeartAnimation = false) {
  var num = parseInt(num);

  if (isNaN(num)) return;

  set_heart_bar();

  if (!skipHeartAnimation) {
    heartLoadBar.createFloatingHeart(num);
  }

}

function set_heart_bar() {
  const { txt, pre } = getIndsideText();

  heartLoadBar.setData(HeartLoadingBar.UI_TREE.SUB_TITLE, txt);
  heartLoadBar.setGaugeValue(pre);
  heartLoadBar.setData(HeartLoadingBar.UI_TREE.TITLE, getTitle());
}


function pre_set_chat_font(_className) {
  if (prev_font_name) {
    if (heartLoadBar.hasClassBySelector(".heart-bar-area", prev_font_name))
      heartLoadBar.removeClassBySelector(".heart-bar-area", prev_font_name);
  }

  heartLoadBar.addClassBySelector(".heart-bar-area", _className);
  prev_font_name = _className;
}

function pre_set_chat_font_size(_size) {
  heartLoadBar.setCssBySelector(".pro-title", { "font-size": `${_size}px` });
  heartLoadBar.setCssBySelector(".ldBar-title", { "font-size": `${_size}px` });
}

function pre_set_chat_font_bold(_toggle) {
  if (_toggle == "on") {
    heartLoadBar.addClassBySelector(".heart-bar-area", "font-weight-bold");
  } else {
    heartLoadBar.removeClassBySelector(".heart-bar-area", "font-weight-bold");
  }
}

function prev_chat_fontStroke() {
  var strokeSize = current_data.font_outline;
  var strokeColor = current_data.font_outline_color;
  var fontSize = current_data.font_size;

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

init();
