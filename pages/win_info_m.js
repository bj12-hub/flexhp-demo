var my_key;
var current_data;
var prev_font_name;
var eff_sound;
var voice_sound;
var my_timeout_id_parent;
var my_timeout_id;

var current_noti_pop;
var current_pop_id = "";
var is_push_chat_message = false;
var arr_pop_cue = [];
var arr_tts_cue = [];
var arr_sponsor_cue = [];
var timer_count = 28;
var next_pop_stay_cnt = 2;

var is_mobile_sound = true;

function tts_sound_on() {
  is_mobile_sound = true;
  arr_tts_cue = [];
}

function tts_sound_off() {
  is_mobile_sound = false;
  arr_tts_cue = [];
}

function init_sound() {
  buzz.defaults.preload = "auto";
  eff_sound = new buzz.sound("../../sounds/zap-zip-up3-high.mp3");
  eff_sound.load();
  eff_sound.loop = false;
}

function play_eff_sound() {
  if (eff_sound) eff_sound.stop();
  eff_sound.setVolume(current_data.noti_sound_volume);

  eff_sound.stop();
  eff_sound.play();
}

function play_voice_sound(msg) {
  var regExp = /[#&"]/gi;
  if (regExp.test(msg)) {
    msg = msg.replace(regExp, "");
  }
  if (!msg) return;

  var limitStr = parseInt(current_data.voice_limit_txtnum);
  if (limitStr) {
    msg = msg.substring(0, limitStr);
  }
  arr_tts_cue.push(msg);
  play_tts();
}

function play_tts() {
  if (is_mobile_sound) {
    if (!voice_sound || voice_sound.isEnded()) {
      var msg = arr_tts_cue.shift();
      if (msg) {
        voice_sound = new buzz.sound(g_url_tts + msg);
        voice_sound.stop();
        voice_sound.loop = false;
        voice_sound.setVolume(current_data.noti_sound_volume);
        voice_sound.setSpeed(current_data.noti_voice_speed);
        voice_sound.play();

        voice_sound.bindOnce("ended", function (t) {
          voice_sound = null;
          play_tts();
        });
      }
    }
  }
}

function push_chat_message(msg) {
  if (!is_push_chat_message) {
    var limitStr = parseInt(current_data.voice_limit_txtnum);
    if (limitStr) {
      msg = msg.substring(0, limitStr);
    }

    var noti_txt_chat = $("<div>").append(
      $("<p>")
        .addClass("word")
        .text(msg)
        .css("color", current_data.noti_font_color)
    );
    current_noti_pop.append(noti_txt_chat);
    is_push_chat_message = true;
  }
}

function show_noti_popup(t_nick, t_flexNum, img_url, a_mid) {
  var str_test = get_replace_str_to_array(
    current_data.noti_text,
    t_nick,
    numberWithCommas(t_flexNum)
  );

  var _img_src;
  if (img_url) {
    _img_src = img_url;
  } else {
    _img_src = "../../images/img_gift_100.png";
  }

  pushNotiPop(t_nick, t_flexNum, _img_src, str_test, a_mid);
}

function pushNotiPop(a_nick, a_flexNum, _img_src, _arr_str, a_mid) {
  is_push_chat_message = false;
  var txt_align_class;
  if (current_data.text_align == "왼쪽") {
    txt_align_class = "text-left";
  } else if (current_data.text_align == "가운데") {
    txt_align_class = "text-center";
  } else if (current_data.text_align == "오른쪽") {
    txt_align_class = "text-right";
  }

  current_noti_pop = $("<div>").addClass("noti").addClass(txt_align_class);

  var noti_img = $("<div>")
    .addClass("noti-img")
    .append($("<img>").attr("src", _img_src).attr("alt", "level"));

  var noti_txt = $("<div>").addClass("noti-txt");
  var arr_txt_ani_nick = [];
  var arr_txt_ani_flex = [];
  for (var i = 0; i < _arr_str.length; i++) {
    var txt;
    var str = _arr_str[i];

    if (str == a_nick) {
      txt = $("<p>")
        .addClass("word ani-1")
        .addClass("word_nick")
        .css("color", current_data.noti_nick_color);

      for (var j = 0; j < str.length; j++) {
        var char = str.charAt(j);

        var t_span = $("<span>").text(char);
        arr_txt_ani_nick.push(t_span);
        txt.append(t_span);
      }
      noti_txt.append(txt);
    } else if (str == numberWithCommas(a_flexNum)) {
      txt = $("<p>")
        .addClass("word ani-2")
        .addClass("word_flex")
        .css("color", current_data.noti_number_color);

      for (var j = 0; j < str.length; j++) {
        var char = str.charAt(j);

        var t_span = $("<span>").text(char);
        arr_txt_ani_flex.push(t_span);
        txt.append(t_span);
      }
      noti_txt.append(txt);
    } else {
      txt = $("<p>")
        .addClass("word")
        .text(str)
        .css("color", current_data.noti_font_color);
      noti_txt.append(txt);
    }
  }

  for (var ii = 0; ii < arr_txt_ani_nick.length; ii++) {
    var node = arr_txt_ani_nick[ii];
    var delray_num;

    if (current_data.text_fade_dir == "정방향") {
      delray_num = ii;
    } else if (current_data.text_fade_dir == "역방향") {
      delray_num = arr_txt_ani_nick.length - (ii + 1);
    } else if (current_data.text_fade_dir == "랜덤") {
      delray_num = Math.floor(Math.random() * arr_txt_ani_nick.length);
    }

    set_txt_ani(node, delray_num * 0.1);
  }
  for (var jj = 0; jj < arr_txt_ani_flex.length; jj++) {
    var node = arr_txt_ani_flex[jj];
    var delray_num;

    if (current_data.text_fade_dir == "정방향") {
      delray_num = jj;
    } else if (current_data.text_fade_dir == "역방향") {
      delray_num = arr_txt_ani_flex.length - (jj + 1);
    } else if (current_data.text_fade_dir == "랜덤") {
      delray_num = Math.floor(Math.random() * arr_txt_ani_flex.length);
    }

    set_txt_ani(node, delray_num * 0.1);
  }

  current_noti_pop._mid = a_mid;
  current_noti_pop._nick = a_nick;
  current_noti_pop._flexNum = a_flexNum;
  current_noti_pop._isPushChat = false;

  current_noti_pop.append(noti_img);
  current_noti_pop.append(noti_txt);

  arr_pop_cue.push(current_noti_pop);
  visible_noti_pop();
}

var isVisibleNotiPop = false;

function visible_noti_pop() {
  if (!isVisibleNotiPop) {
    var t_pop = arr_pop_cue.shift();
    if (t_pop) {
      if (current_data.noti_type == "알림음") {
        play_eff_sound();
      } else if (current_data.noti_type == "알림음성") {
        var voice_str = current_data.noti_text
          .replace("{닉네임}", t_pop._nick)
          .replace("{개수}", numberWithCommas(t_pop._flexNum));
        play_voice_sound(voice_str);
      }

      if (current_data.is_chat_voice == "on") {
        if (t_pop._chat_msg) {
          play_voice_sound(t_pop._chat_msg);
        }
      }

      isVisibleNotiPop = true;
      current_pop_id = t_pop._mid;
      $(".chat-list").append(t_pop);
      animateCSS(".chat-list", current_data.pop_fade_in_type, function () { });

      if (my_timeout_id_parent) clearInterval(my_timeout_id_parent);
      if (arr_pop_cue.length > 0) {
        timer_count = next_pop_stay_cnt;
      } else {
        timer_count = current_data.pop_visible_time;
      }

      my_timeout_id_parent = setInterval(function () {
        timer_count--;
        if (timer_count == 0) {
          clearInterval(my_timeout_id_parent);
          current_pop_id = "";
          animateCSS(".chat-list", current_data.pop_fade_out_type, function () {
            isVisibleNotiPop = false;
            $(".chat-list").empty();
            visible_noti_pop();
          });
        }
      }, 1000);
    }
  } else {
    if (timer_count > next_pop_stay_cnt) {
      timer_count = next_pop_stay_cnt;
    }
  }
}

function set_txt_ani(node, delay) {
  node
    .addClass("animated " + current_data.text_fade_type)
    .addClass("infinite item-delay-1s")
    .css("animation-delay", delay + "s");
}

function animateCSS(element, animationName, callback) {
  const node = document.querySelector(element);
  node.classList.add("animated", animationName);

  function handleAnimationEnd() {
    node.classList.remove("animated", animationName);
    node.removeEventListener("animationend", handleAnimationEnd);

    if (typeof callback === "function") callback();
  }

  node.addEventListener("animationend", handleAnimationEnd);
}

function get_replace_str_to_array(_str, _nick, _flex) {
  var result_arr = [];
  var st1 = _str.replace("{닉네임}", "@^!#nick").replace("{개수}", "@^!#num");
  var st2 = st1.split("@^!");

  for (var i = 0; i < st2.length; i++) {
    var txt = st2[i];
    if (txt.search("#nick") != -1) {
      var tt1 = txt.split("#nick");
      result_arr.push(_nick);
      if (tt1[1] != "") result_arr.push(tt1[1]);
    } else if (txt.search("#num") != -1) {
      var tt2 = txt.split("#num");
      result_arr.push(_flex);
      if (tt2[1] != "") result_arr.push(tt2[1]);
    } else {
      if (txt != "") result_arr.push(txt);
    }
  }
  return result_arr;
}

function init() {
  $(".chat-list").empty();
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
    // console.log("conneected key: ",_key , socket.connected); // true
    get_data(_key);
    socket.emit(
      "login",
      {
        // page: 'e7bDqOGcHZ4mUKME1gV02zWIrw5vS6A9'
        page: _key,
      },
      function (data) {
        //    console.log(data);
      }
    );
  });

  socket.on("disconnect", function (data) {
    // console.log('disconnect~~~~~~~', data);
    // alert("통신이 끊어졌습니다");
  });
  socket.on("chat", function (data) {
    // console.log('chat', data);
    var _level;
    if (data.level == "v") _level = "VIP";
    else if (data.level == "m") _level = "매니저";
    else if (data.level == "b") _level = "BJ";
    else if (data.level == "n") _level = "일반";

    if (current_data.is_delete_special_text == "on") {
      var regExp = /[\{\}\[\]\/,;:|\)*~`!^\-+<>@\#$%&\\\=\(\'\"]/gi;
      if (regExp.test(data.msg)) {
        data.msg = data.msg.replace(regExp, "");
      }
    }

    for (var i = 0; i < arr_sponsor_cue.length; i++) {
      if (arr_sponsor_cue[i].mid == data.mid && !arr_sponsor_cue[i].isUse) {
        arr_sponsor_cue[i].isUse = true;

        if (current_data.is_chat_voice == "on") {
          play_voice_sound(data.msg);
        }

        break;
      }
    }
  });
  socket.on("notice", function (data) {
    var _level;
    if (data.level == "v") _level = "VIP";
    else if (data.level == "m") _level = "매니저";
    else if (data.level == "b") _level = "BJ";
    else if (data.level == "n") _level = "일반";

    var flex_num = parseInt(data.msg);

    if (data.type == "1") {
      //하트

      if (flex_num < parseInt(current_data.gift_number_start)) {
        console.log("금액이 작다");
        return;
      }

      if (current_data.gift_number_end == "") {
      } else {
        if (flex_num > parseInt(current_data.gift_number_end)) {
          console.log("금액이 크다");
          return;
        }
      }
      if (current_data.noti_type == "알림음성") {
        var voice_str = current_data.noti_text
          .replace("{닉네임}", data.nick)
          .replace("{개수}", numberWithCommas(flex_num));
        play_voice_sound(voice_str);
      }

      arr_sponsor_cue.forEach(function (item, index) {
        if (item.mid == data.mid) {
          item.isUse = true;
        }
      });

      var _obj = { mid: data.mid, isUse: false };
      arr_sponsor_cue.push(_obj);

      setTimeout(function () {
        arr_sponsor_cue.forEach(function (item, index) {
          if (item == _obj) {
            arr_sponsor_cue.splice(index, 1);
          }
        });
      }, parseInt(current_data.chat_input_time) * 1000);
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
    //console.log('help', data);
  });

  socket.on("testMessage", function (data) {
    //console.log('testMessage', data);
    var _data = data.data;
    if (_data.type == "1") {
      //새로고침
      window.location.reload();
    } else if (_data.type == "2") {
      //초기화
      get_data(my_key);
    } else if (_data.type == "3") {
      //추천
    } else if (_data.type == "4") {
      //하트
      // show_noti_popup("플렉스티비", parseInt(_data.msg), "", _data.mid)
    }
  });

  socket.on("eventaction", function (data) {
    //console.log('help', data);
    var _data = data.data;
    if (_data.type == "5") {
      //전체스킵
      console.log("전체 스킵");
      // arr_pop_cue = [];
    } else if (_data.type == "6") {
      //부분스킵
      console.log("부분 스킵");
      //arr_pop_cue.shift();
    }
  });

  socket.open();
}

function createDefaultJson() {
  var jsonObj = {};

  jsonObj.win_transparency = 0;

  jsonObj.layout_type = "type_1";
  jsonObj.text_align = "가운데";

  jsonObj.gift_type = "일반";

  jsonObj.gift_number_start = "1";
  jsonObj.gift_number_end = "";

  jsonObj.noti_text = "{닉네임}님 플렉스{개수}개 감사합니다.";
  jsonObj.noti_type = "알림음성";

  jsonObj.is_chat_voice = "off";

  jsonObj.text_fade_type = "flash";
  jsonObj.text_fade_dir = "역방향";

  jsonObj.pop_fade_in_type = "tada";
  jsonObj.pop_fade_out_type = "pulse";

  jsonObj.pop_visible_time = "28";
  jsonObj.chat_input_time = "6";

  //0~100
  jsonObj.noti_sound_volume = "50";
  //0.1~4
  jsonObj.noti_voice_speed = "1.2";

  jsonObj.voice_select = "여성";

  jsonObj.voice_limit_txtnum = "300";

  jsonObj.is_delete_special_text = "off";

  jsonObj.noti_font_color = "#20c9b0";
  jsonObj.noti_nick_color = "#d89816";
  jsonObj.noti_number_color = "#93ff47";

  jsonObj.font_name = "ff-01";
  jsonObj.font_bold = "off";
  jsonObj.font_size = 16;
  jsonObj.font_outline = 2;
  jsonObj.font_outline_color = "#000000";

  return jsonObj;
}

function get_data(_key) {
  //console.log("get_data  ~: ", _key)
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
    });
}

function setDisplay(_data) {
  // 재화변경에따른 데이터 변경
  if (needsCurrencyConversion(_data.noti_text)) {
    const noti_text = replaceCurrencyInNotiText(_data.noti_text);
    current_data.noti_text = noti_text;
  }

  timer_count = parseInt(_data.pop_visible_time);

  prev_set_transparency(_data.win_transparency);

  ////////////////////////////////////////////////
  pre_set_chat_font(_data.font_name);
  pre_set_chat_font_bold(_data.font_bold);
  //pre_set_chat_font_size(_data.font_size)
  prev_chat_fontStroke();
}

//////////////////////////////////
function prev_set_transparency(_temp) {
  console.log("prev_set_transparency", _temp);
  _temp = 100 - _temp;
  var t_val = _temp * 0.01;
  $(".chat-list-area").css({ opacity: t_val });
}

function pre_set_chat_font(_className) {
  if (prev_font_name) {
    if ($(".chat-list-area").hasClass(prev_font_name))
      $(".chat-list-area").removeClass(prev_font_name);
  }
  $(".chat-list-area").addClass(_className);
  prev_font_name = _className;
}

function pre_set_chat_font_bold(_toggle) {
  if ($(".chat-list-area").hasClass("font-weight-bold"))
    $(".chat-list-area").removeClass("font-weight-bold");
  if (_toggle == "on") {
    $(".chat-list-area").addClass("font-weight-bold");
  } else {
    $(".chat-list-area").removeClass("font-weight-bold");
  }
}

function prev_chat_fontStroke() {
  var strokeSize = current_data.font_outline;
  var strokeColor = current_data.font_outline_color;
  var fontSize = current_data.font_size;

  $(".chat-list-area").css("font-size", fontSize + "px");
  $(".chat-list-area").css("text-shadow", "");

  for (var angle = 0; angle < 2 * Math.PI; angle += 1 / strokeSize) {
    appendShadow(
      $(".chat-list-area"),
      Math.cos(angle) * strokeSize,
      Math.sin(angle) * strokeSize,
      strokeColor
    );
  }
}

init_sound();
init();
