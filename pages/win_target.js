// console.log("win_target_js")

var my_key;
var current_data;
var current_data2;
var prev_font_name;
var current_flex_num = 0;
var current_doosan_num = 0;
var current_bar_type = "flex";
var m_psCircle;
var m_psHeart;
var m_psStar;
var m_psFan;

var m_id;

// 데이터 레디스 캐싱 작업 관련 추가 변수
// 실제 레디스에 저장된 리얼 렉스 현황
var realFlexNum = 0;
var realDoosanNum = 0;
// 도우미 설정 페이지의 테스트 및 시작 설정등을 통한 가상의 현재 렉스
var virtualFlexNum = 0;
var virtualDoosanNum = 0;

var startFlexNum = 0;
var startDoosanNum = 0;

function setCurrentNum(_realLex, _realFlexNum, _realDoosanNum) {
  // if (!_data.current_flex_num) {
  //     current_flex_num = 0;
  //   } else {
  //     current_flex_num = parseInt(_data.current_flex_num);
  //   }

  //   if (!_data.current_doosan_num) {
  //     current_doosan_num = 0;
  //   } else {
  //     current_doosan_num = parseInt(_data.current_doosan_num);
  //   }

  console.log("setCurrentNum params", _realDoosanNum, _realLex, _realFlexNum);

  realFlexNum = _realFlexNum;
  realDoosanNum = _realDoosanNum;
  current_flex_num = _realFlexNum + parseInt(startFlexNum);

  if (virtualDoosanNum + 1 == _realLex) {
    virtualDoosanNum = virtualDoosanNum + 1;
  }

  if (_realDoosanNum > virtualDoosanNum) {
    virtualDoosanNum = _realDoosanNum;
    current_doosan_num = _realDoosanNum;
  } else {
    current_doosan_num = virtualDoosanNum;
  }

  console.log("current_flex_num", current_flex_num);
  console.log("current_doosan_num", current_doosan_num);
  console.log("virtualDoosanNum", virtualDoosanNum);
}

function init() {
  var parts_ = window.location.pathname.split("/");
  my_key = parts_.pop();
  // var doosan = localStorage.getItem('doosan_'+ my_key);
  // var flex = localStorage.getItem('flex_'+ my_key);

  // if (!flex) {
  //   current_flex_num = 0;
  // } else {
  //   current_flex_num = parseInt(flex);
  // }

  // if (!doosan) {
  //   current_doosan_num = 0;
  // } else {
  //   current_doosan_num = parseInt(doosan);
  // }

  startSocket(my_key);
  progressCircle(0);
  progressFan(0);
  progressHeart(0);
  progressStar(0);
}

function startSocket(_key) {
  const socket = io(g_url_socket, {
    autoConnect: false,
    //secure: true,
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    // console.log("conneected key: ",_key , socket.connected); // true
    // console.log('connect')
    get_data(_key);
    socket.emit(
      "login",
      {
        // page: 'e7bDqOGcHZ4mUKME1gV02zWIrw5vS6A9'
        page: _key,
      },
      function (data) {
        // console.log(data);
      }
    );
  });

  socket.on("disconnect", function (data) {
    console.log("disconnect~~~~~~~", data); // alert("통신이 끊어졌습니다");
  });

  socket.on("target", function (data) {
    var _level;
    if (data.level == "v") _level = "VIP";
    else if (data.level == "m") _level = "매니저";
    else if (data.level == "b") _level = "BJ";
    else if (data.level == "n") _level = "일반";
    //pushChat(_level, data.mid, data.nick, data.msg);
  });

  socket.on("notice", function (data) {
    var _level;
    if (data.level == "v") _level = "VIP";
    else if (data.level == "m") _level = "매니저";
    else if (data.level == "b") _level = "BJ";
    else if (data.level == "n") _level = "일반";
    // console.log(data);
    if (data.type == "1") {
      //하트
      //   if (!data.current_flex_num) {
      //     current_flex_num = 0;
      //   } else {
      //     current_flex_num = parseInt(data.current_flex_num);
      //   }

      //   if (!data.current_doosan_num) {
      //     current_doosan_num = 0;
      //   } else {
      //     current_doosan_num = parseInt(data.current_doosan_num);
      //   }
      //setCurrentNum(parseInt(data.msg), parseInt(data.current_flex_num),parseInt(data.current_doosan_num));
      //addFlexNum(data.msg)
      if (data.isluckycard && data.isluckycard == "Y") {
        setTimeout(setCurrentTargetFromSocket, 1000 * 20, data);
      } else {
        setCurrentTargetFromSocket(data);
      }
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
    // console.log('help', data);
    window.location.reload();
  });

  socket.on("testMessage", function (data) {
    console.log("testMessage", data);
    var _data = data.data;
    if (_data.type == "1") {
      //새로고침
      window.location.reload();
    } else if (_data.type == "2") {
      //초기화
      // localStorage.removeItem('doosan_'+ my_key);
      // localStorage.removeItem('flex_'+ my_key);
      //   current_flex_num = 0;
      //   current_doosan_num = 0;
      get_data(my_key);
    } else if (_data.type == "3") {
      //추천
    } else if (_data.type == "4") {
      //하트
      // console.log('_data.msg', _data)
      // console.log('data.current_flex_num', _data.current_flex_num)

      setCurrentNum(
        parseInt(_data.msg),
        parseInt(_data.current_flex_num),
        parseInt(_data.current_doosan_num)
      );
      addFlexNum(_data.msg);
    }
  });

  socket.on("eventaction", function (data) {
    console.log("eventaction", data);
    if (data.type == "2") {
      //목표치초기화
      // console.log("피시목표치 초기화")
      localStorage.removeItem("doosan_" + my_key);
      localStorage.removeItem("flex_" + my_key);
      current_flex_num = 0;
      current_doosan_num = 0;
      get_data(my_key);
    }
  });

  socket.open();
}

function setCurrentTargetFromSocket(data) {
  setCurrentNum(
    parseInt(data.msg),
    parseInt(data.current_flex_num),
    parseInt(data.current_doosan_num)
  );
  addFlexNum(data.msg);
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

  return jsonObj;
}

function get_data(_key) {
  // console.log("get_data  ~: ", _key)
  axios
    .get(g_url + "/pages/preset/" + _key)
    .then(function (response) {
      current_data = response.data;
      if (current_data == "" || current_data == null) {
        current_data = createDefaultJson();
      }

      // 시작값 설정이 있을 경우 시작값이 현재 렉스 입니다.
      // current_flex_num = current_data.goal_start_val !== 0 ? current_data.goal_start_val : 0;
      // current_doosan_num = current_data.goal_start_val_doosan !== 0 ? current_data.goal_start_val_doosan : 0;
      if (current_data.goal_start_val !== 0) {
        current_flex_num = current_data.goal_start_val;
        startFlexNum = current_data.goal_start_val;
      }

      if (current_data.goal_start_val_doosan !== 0) {
        current_doosan_num = parseInt(current_data.goal_start_val_doosan);
        virtualDoosanNum = parseInt(current_data.goal_start_val_doosan);
        startDoosanNum = parseInt(current_data.goal_start_val_doosan);
      }

      setDisplay(current_data);

      get_num();
    })
    .catch(function (error) { })
    .then(function () {
      // always executed
      set_goal_bar(current_bar_type);
    });
}

function get_num() {
  axios
    .get(g_url + "/event/getcurrentlex/" + my_key)
    .then(function (response) {
      current_data2 = response.data;

      if (current_data2) {
        console.log("current_data2", current_data2);
        flex = current_data2["current_flex_num"];
        doosan = current_data2["current_doosan_num"];
        //   if (!flex) {
        //     current_flex_num = 0;
        //   } else {
        //     current_flex_num = parseInt(flex);
        //   }

        //   if (!doosan) {
        //     current_doosan_num = 0;
        //   } else {
        //     current_doosan_num = parseInt(doosan);
        //   }
        setCurrentNum(0, parseInt(flex), parseInt(doosan));
        console.log("flex", flex);
        console.log("doosan", doosan);
      }
    })
    .catch(function (error) { })
    .then(function () {
      // always executed
    });
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

function setDisplay(_data) {
  // current_flex_num = parseInt(_data.goal_start_val);
  // current_doosan_num = parseInt(_data.goal_start_val_doosan);

  $(".goal-bar-area").css("visibility", "visible");
  visibleGraph(_data.graph_type);
  prev_set_transparency(_data.win_transparency);
  $(".goal-box").css("height", _data.graph_border + "px");

  var _border = parseInt(_data.graph_border);
  var t_val = parseInt(_border * 0.2) + 1;
  $(".baseline").css("strokeWidth", t_val + "px");
  $(".mainline").css("strokeWidth", t_val + "px");

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

  set_graph_goal_circle(_data.graph_circle_color);
  set_bg_ani(_data.graph_animation);

  pre_set_chat_font(_data.font_name);
  pre_set_chat_font_bold(_data.font_bold);
  pre_set_chat_font_size(_data.font_size);
  prev_chat_fontStroke();
}

function set_graph_goal_circle(color) {
  $(".mainline").css("stroke", color);
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

function prev_set_transparency(_temp) {
  // console.log("prev_set_transparency", _temp );
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
  // if(current_doosan_num + 1 == num) {
  // current_doosan_num = current_doosan_num + 1;
  // localStorage.setItem('doosan_'+ my_key , current_doosan_num);
  // // // // }
  // // // // current_flex_num = current_flex_num + num;
  // localStorage.setItem('flex_'+ my_key , current_flex_num);
  // console.log(current_bar_type)
  set_goal_bar(current_bar_type);
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
    svgTxtAdd(current_flex_num, _type);
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

    svgTxtAdd(current_doosan_num, _type);
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
    $(".goal_start").children(".value").text(numberWithCommas(0));
    $(".goal_end").children(".value").text(numberWithCommas(endVal));
  } else if (_type == "doosan") {
    $(".goal_start").children(".value").text(numberWithCommas(0));
    $(".goal_end").children(".value").text(numberWithCommas(endVal_doosan));
  }

  // m_psCircle.set(
  // pre,     /* target value. */
  // true   /* enable animation. default is true */
  // );
  m_psCircle.set(
    pre /* target value. */,
    true /* enable animation. default is true */
  );

  m_psHeart.set(
    pre /* target value. */,
    true /* enable animation. default is true */
  );

  // console.log("current_data.graph_type", current_data.graph_type, pre)
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

function svgTxtAdd(st_val, type) {
  document.styleSheets[0].addRule(
    ".ldBar-label:before",
    "content: attr(data-before);"
  );

  var strHeart;

  if (type == "flex") {
    strHeart = st_val + "개" + " (";
  } else if (type == "doosan") {
    strHeart = st_val + "두산" + " (";
  }

  $(".t-gift > .ldBar-label").attr("data-before", strHeart);
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
  // console.log("setInterval~11", current_data.goal_target_repeat_time)
  if (interval_goal_change) {
    //  console.log("clearInterval")
    clearInterval(interval_goal_change);
  }

  if (parseInt(current_data.goal_target_repeat_time) == 0) return;
  interval_goal_change = setInterval(function () {
    //console.log("setInterval~")
    change_goal_type();
  }, parseInt(current_data.goal_target_repeat_time) * 1000);
}

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
  //var fontFamily = $('#fontFamily').val();
  //var fontColor = $('#fontColorPicker').val();
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

init();
