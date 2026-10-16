console.log("win_target_js");

var my_key;
var current_data;
var prev_font_name;
var current_flex_num = 0;
var current_doosan_num = 0;
var current_bar_type = "flex";

function init() {
  // console.log("init~~!");
  var parts_ = window.location.pathname.split("/");
  my_key = parts_.pop();
  // console.log("my_key", my_key)
  //alert("플랙스티비 도우미 실행합니다." + my_key);
  var doosan = localStorage.getItem("doosan_" + my_key);
  var flex = localStorage.getItem("flex_" + my_key);

  if (!flex) {
    current_flex_num = 0;
  } else {
    current_flex_num = parseInt(flex);
  }

  if (!doosan) {
    current_doosan_num = 0;
  } else {
    current_doosan_num = parseInt(doosan);
  }
  startSocket(my_key);
}

function startSocket(_key) {
  const socket = io(g_url_socket, {
    autoConnect: false,
    //secure: true,
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    console.log("conneected key: ", _key, socket.connected); // true
    get_data(_key);
    socket.emit(
      "login",
      {
        // page: 'e7bDqOGcHZ4mUKME1gV02zWIrw5vS6A9'
        page: _key,
      },
      function (data) {
        console.log(data);
      }
    );
  });

  socket.on("disconnect", function (data) {
    console.log("disconnect~~~~~~~", data);
    // alert("통신이 끊어졌습니다");
  });

  socket.on("target", function (data) {
    console.log("event", data);
    var _level;
    if (data.level == "v") _level = "VIP";
    else if (data.level == "m") _level = "매니저";
    else if (data.level == "b") _level = "BJ";
    else if (data.level == "n") _level = "일반";

    //pushChat(_level, data.mid, data.nick, data.msg);
  });

  socket.on("notice", function (data) {
    console.log("notice", data);
    var _level;
    if (data.level == "v") _level = "VIP";
    else if (data.level == "m") _level = "매니저";
    else if (data.level == "b") _level = "BJ";
    else if (data.level == "n") _level = "일반";

    if (data.type == "1") {
      //하트
      /*if (!data.current_flex_num) {
        current_flex_num = 0;
      } else {
        current_flex_num = parseInt(data.current_flex_num);
      }

      if (!data.current_doosan_num) {
        current_doosan_num = 0;
      } else {
        current_doosan_num = parseInt(data.current_doosan_num);
      }*/ // 20221121
      addFlexNum(data.msg);
    } else if (data.type == "2") {
      //추천
    } else if (data.type == "3") {
      //즐겨찾기
    } else if (data.type == "4") {
      //팬클럽
    } else if (data.type == "5") {
      //등급
    } else if (data.type == "6") {
      //입장
    }
  });

  socket.on("help", function (data) {
    console.log("help", data);
  });

  socket.on("testMessage", function (data) {
    console.log("testMessage", data);
    var _data = data.data;
    if (_data.type == "1") {
      //새로고침
      window.location.reload();
    } else if (_data.type == "2") {
      //초기화
      localStorage.removeItem("doosan_" + my_key);
      localStorage.removeItem("flex_" + my_key);
      current_flex_num = 0;
      current_doosan_num = 0;
      get_data(my_key);
    } else if (_data.type == "3") {
      //추천
    } else if (_data.type == "4") {
      //하트
      /*if (!_data.current_flex_num) {
        current_flex_num = 0;
      } else {
        current_flex_num = parseInt(_data.current_flex_num);
      }

      if (!_data.current_doosan_num) {
        current_doosan_num = 0;
      } else {
        current_doosan_num = parseInt(_data.current_doosan_num);
      }*/ // 20221121
      addFlexNum(_data.msg);
    }
  });

  socket.on("eventaction", function (data) {
    console.log("eventaction", data);
    if (data.type == "9") {
      //목표치초기화
      // console.log("모바일목표치 초기화")
      localStorage.removeItem("doosan_" + my_key);
      localStorage.removeItem("flex_" + my_key);
      current_flex_num = 0;
      current_doosan_num = 0;
      get_data(my_key);
    }
  });

  socket.open();
}

function createDefaultJson() {
  var jsonObj = {};

  jsonObj.win_transparency = 0;

  jsonObj.graph_type = "바";
  jsonObj.graph_dir = "가로";
  jsonObj.graph_border = 15;
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
  jsonObj.goal_text_inside_color = "#000000";

  jsonObj.graph_gradient_start_color = "#1d976c";
  jsonObj.graph_gradient_end_color = "#93f9b9";
  jsonObj.graph_background_color = "#dddddd";

  jsonObj.graph_animation = "on";

  jsonObj.font_name = "ff-15";
  jsonObj.font_bold = "off";
  jsonObj.font_size = 14;
  jsonObj.font_outline = 1;
  jsonObj.font_outline_color = "#000000";

  console.log("createDefaultJson:", JSON.stringify(jsonObj));

  return jsonObj;
  // return JSON.stringify(jsonObj)
}

function get_data(_key) {
  console.log("get_data  ~: ", _key);
  axios
    .get(g_url + "/pages/preset/" + _key)
    .then(function (response) {
      current_data = response.data;
      if (current_data == "" || current_data == null) {
        current_data = createDefaultJson();
      }
      setDisplay(current_data);
    })
    .catch(function (error) { })
    .then(function () {
      // always executed
      set_goal_bar(current_bar_type);
    });
}

function setDisplay(_data) {
  //console.log("setDisplay~~~~~~~~~~~~~~~~", _data);
  prev_set_transparency(_data.win_transparency);
  $(".goal-box").css("height", _data.graph_border + "px");
  set_graph_text_only(_data.graph_only_text);
  addFlexNum(0);
  start_goal_change_timer();
  change_goal_type();

  setTextColor_out(_data.goal_text_outside_color);
  setTextColor_in(_data.goal_text_inside_color);

  set_gradient_goal_bar(
    _data.graph_gradient_start_color,
    _data.graph_gradient_end_color
  );
  set_inside_goal_bar(_data.graph_background_color);

  ////////////////////////////////////////////////
  pre_set_chat_font(_data.font_name);
  pre_set_chat_font_bold(_data.font_bold);
  pre_set_chat_font_size(_data.font_size);
  prev_chat_fontStroke();
}

function setTextColor_out(color) {
  $(".goal-tit").css("color", color);
  $(".goal_start").css("color", color);
  $(".goal_end").css("color", color);
}

function setTextColor_in(color) {
  $(".inner-txt").css("color", color);
}

function set_inside_goal_bar(color) {
  $(".goal-inner").css("background-color", color);
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

function prev_set_transparency(_temp) {
  console.log("prev_set_transparency", _temp);
  _temp = 100 - _temp;
  var t_val = _temp * 0.01;
  $(".goal-bar-area").css({ opacity: t_val });
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

function addFlexNum(num) {
  var num = parseInt(num);

  if (isNaN(num)) return;
  console.log("addFlexNum ", num);
  if (current_doosan_num + 1 == num) {
    current_doosan_num = current_doosan_num + 1;
    localStorage.setItem("doosan_" + my_key, current_doosan_num);
  }
  current_flex_num = current_flex_num + num;
  localStorage.setItem("flex_" + my_key, current_flex_num);
  set_goal_bar(current_bar_type);
}

function set_goal_bar(_type) {
  //console.log("set_goal_bar:", _type, current_flex_num)
  var str_1 = current_data.goal_target_text;
  var str_2 = current_data.goal_target_inside_text;

  var pre;
  var restr_1;
  var restr_2;

  var targetPer =
    parseInt(current_data.goal_end_val) - parseInt(current_data.goal_start_val);
  var endVal = parseInt(current_data.goal_end_val);

  var targetPer_doosan =
    parseInt(current_data.goal_end_val_doosan) -
    parseInt(current_data.goal_start_val_doosan);
  var endVal_doosan = parseInt(current_data.goal_end_val_doosan);

  if (current_data.goal_value_auto_add == "on") {
    if (parseInt(current_data.goal_end_val) <= current_flex_num) {
      targetPer =
        current_flex_num +
        parseInt(current_data.goal_value_auto_add_val) -
        parseInt(current_data.goal_start_val);
      endVal =
        current_flex_num + parseInt(current_data.goal_value_auto_add_val);
    }

    if (parseInt(current_data.goal_end_val_doosan) <= current_doosan_num) {
      targetPer_doosan =
        current_flex_num +
        parseInt(current_data.goal_value_auto_add_val) -
        parseInt(current_data.goal_start_val_doosan);
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
    //restr_2= str_2.replace("{목표값}", numberWithCommas(current_doosan_num)).replace("{개}", "두산").replace("{목표퍼센트}", pre + "%");
  }

  var bar_per = 100 - pre;
  if (bar_per < 0) {
    bar_per = 0;
  }

  $(".goal-inner").css("width", bar_per + "%");
  $(".goal-tit").text(restr_1);
  $(".inner-txt").text(restr_2);

  if (_type == "flex") {
    $(".goal_start")
      .children(".value")
      .text(numberWithCommas(current_data.goal_start_val));
    $(".goal_end").children(".value").text(numberWithCommas(endVal));
  } else if (_type == "doosan") {
    $(".goal_start")
      .children(".value")
      .text(numberWithCommas(current_data.goal_start_val_doosan));
    $(".goal_end").children(".value").text(numberWithCommas(endVal_doosan));
  }
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
  console.log("setInterval~11", current_data.goal_target_repeat_time);
  if (interval_goal_change) {
    console.log("clearInterval");
    clearInterval(interval_goal_change);
  }

  if (parseInt(current_data.goal_target_repeat_time) == 0) return;
  interval_goal_change = setInterval(function () {
    //console.log("setInterval~")
    change_goal_type();
  }, parseInt(current_data.goal_target_repeat_time) * 1000);
}

//////////////////////////////////
function pre_set_chat_font(_className) {
  if (prev_font_name) {
    if ($(".goal-bar-area").hasClass(prev_font_name))
      $(".goal-bar-area").removeClass(prev_font_name);
  }
  $(".goal-bar-area").addClass(_className);
  prev_font_name = _className;
}

function pre_set_chat_font_size(_size) {
  $(".goal-bar-area").css("font-size", _size + "px");
}

function pre_set_chat_font_bold(_toggle) {
  if (_toggle == "on") {
    $(".goal-bar-area").addClass("font-weight-bold");
  } else {
    $(".goal-bar-area").removeClass("font-weight-bold");
  }
}

function prev_chat_fontStroke() {
  // get form values
  var strokeSize = current_data.font_outline;
  var strokeColor = current_data.font_outline_color;
  var fontSize = current_data.font_size;

  // update css
  //var $prev_chat = $('.chat-list');

  $(".goal-bar-area").css("font-size", fontSize + "px");
  $(".goal-bar-area").css("text-shadow", "");

  //console.log("prev_chat_fontStroke~~~~~~~~~~~~: ", $prev_chat, strokeSize, strokeColor, fontSize )

  for (var angle = 0; angle < 2 * Math.PI; angle += 1 / strokeSize) {
    appendShadow(
      $(".goal-bar-area"),
      Math.cos(angle) * strokeSize,
      Math.sin(angle) * strokeSize,
      strokeColor
    );
  }
}

init();
