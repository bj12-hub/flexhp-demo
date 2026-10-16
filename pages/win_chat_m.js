console.log("win_chat_js");

var my_key;
var current_data;
var prev_font_name;

function init() {
  console.log("init~~!");
  var parts_ = window.location.pathname.split("/");
  my_key = parts_.pop();
  //console.log("my_key", my_key)
  //alert("플랙스티비 도우미 실행합니다." + my_key);
  startSocket(my_key);
}

function startSocket(_key) {
  const socket = io(g_url_socket, {
    autoConnect: false,
    //secure: true,
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    //console.log("conneected key: ", _key, socket.connected); // true
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
  socket.on("chat", function (data) {
    //console.log('event11', data);
    var _level;
    if (data.level == "v") _level = "VIP";
    else if (data.level == "m") _level = "매니저";
    else if (data.level == "b") _level = "BJ";
    else if (data.level == "n") _level = "일반";
    else {
      _level = data.level;
    }

    pushChat(_level, data.mid, data.nick, data.msg);
  });
  socket.on("notice", function (data) {
    //console.log('notice', data);
    var _level;
    if (data.level == "v") _level = "VIP";
    else if (data.level == "m") _level = "매니저";
    else if (data.level == "b") _level = "BJ";
    else if (data.level == "n") _level = "일반";

    if (data.type == "1") {
      //하트
      //var num_msg = parseInt(data.msg);
      //pushNoti_image(data.nick, "님께서 " + numberWithCommas(num_msg) + "개를 선물하셨습니다.", data.url);
      if (data.isluckycard && data.isluckycard == "Y") {
        setTimeout(pushNotiPopup, 1000 * 20, data);
      } else {
        pushNotiPopup(data);
      }
    } else if (data.type == "2") {
      //추천
      pushNoti(data.nick, "님께서 추천하셨습니다.");
    } else if (data.type == "3") {
      //즐겨찾기
      pushNoti(data.nick, "님께서 즐겨찾기 하셨습니다.");
    } else if (data.type == "4") {
      //팬클럽
      pushNoti(data.nick, "님께서 팬클럽에 가입하셨습니다.");
    } else if (data.type == "5") {
      //등급
      pushNoti(data.nick, "님의 등급이 ♡" + _level + "♡로 변경되었습니다.");
    } else if (data.type == "6") {
      //입장
      pushNoti(data.nick, "님께서 입장하셨습니다.");
    }
  });
  socket.on("help", function (data) {
    //  console.log('help', data);
    window.location.reload();
  });

  socket.on("testMessage", function (data) {
    //  console.log('testMessage', data);
    var _data = data.data;
    if (_data.type == "1") {
      //새로고침
      window.location.reload();
    } else if (_data.type == "2") {
      //초기화
      get_data(my_key);
    } else if (_data.type == "3") {
      //추천
      pushNoti("플랙스티비", "님께서 추천하셨습니다.");
    } else if (_data.type == "4") {
      //하트
      var num_msg = parseInt(_data.msg);
      pushNoti_image(
        "플랙스티비",
        "님께서 " + numberWithCommas(num_msg) + "개를 선물하셨습니다.",
        ""
      );
    }
  });

  socket.open();
}

function pushNotiPopup(data) {
  var num_msg = parseInt(data.msg);
  pushNoti_image(
    data.nick,
    "님께서 " + numberWithCommas(num_msg) + "개를 선물하셨습니다.",
    data.url
  );
}

function createDefaultJson() {
  var jsonObj = {};

  jsonObj.win_transparency = 0;

  jsonObj.chat_theme = "베이직";
  jsonObj.chat_eff_fadein = "fadeIn";
  jsonObj.chat_eff_fadein_speed = 0;
  jsonObj.chat_sort = "닉네임우측정렬";
  jsonObj.chat_direction = "왼쪽";

  jsonObj.set_icon = {};
  jsonObj.set_icon.bj = "on";
  jsonObj.set_icon.manager = "on";
  jsonObj.set_icon.ranking = "on";
  // 외부송출
  jsonObj.set_icon.flex = "on";
  jsonObj.set_icon.userlevel = "on";
  // 방송프랫폼 아이콘
  jsonObj.set_icon.flexup = "off";
  jsonObj.set_icon.youtube = "on";

  jsonObj.set_chating = {};
  jsonObj.set_chating.scroll = "off";
  jsonObj.set_chating.id = "off";
  jsonObj.set_chating.random = "off";
  jsonObj.set_chating.fadeout = "off";

  jsonObj.sponsor_mark = "이미지";

  jsonObj.font_name = "ff-28";
  jsonObj.font_bold = "off";
  jsonObj.font_size = 14;
  jsonObj.font_outline = 0;
  jsonObj.font_outline_color = "#000000";

  jsonObj.chat_color = {};

  jsonObj.chat_color.BJ닉네임 = "#f4ff93";
  jsonObj.chat_color.BJ채팅 = "#ffffff";

  jsonObj.chat_color.매니저닉네임 = "#0dfe00";
  jsonObj.chat_color.매니저채팅 = "#0dfe00";

  jsonObj.chat_color.VIP닉네임 = "#fffd00";
  jsonObj.chat_color.VIP채팅 = "#00ffff";

  jsonObj.chat_color.일반닉네임 = "#ffffff";
  jsonObj.chat_color.일반채팅 = "#ffffff";

  jsonObj.chat_color.후원 = "#ffda45";
  jsonObj.chat_color.입장등급추천 = "#ffda45";

  //console.log("createDefaultJson:", JSON.stringify(jsonObj))

  return jsonObj;

  // return JSON.stringify(jsonObj)
}

function get_data(_key) {
  //  console.log("get_data  ~: ", _key)
  axios
    .get(g_url + "/pages/preset/" + _key)
    .then(function (response) {
      current_data = response.data;
      if (current_data == "" || current_data == null) {
        current_data = createDefaultJson();
        // console.log("current_data~~~~~~~~~~~~~~~~~~000", current_data);
      }
      // console.log("current_data~~~~~~~~~~~~~~~~~~111", current_data);
      setDisplay(current_data);
      // console.log("get_data~~~~~~~~~~~~~~~~~~",  JSON.parse(json))
      // if (json.returnCode == 1) {
      //     if(json.resultMap.returnVal != 1)
      //     {
      //         alert(json.message);
      //         return;
      //     }
      //     console.log("get_data success: ")
      // }
      // else
      // {
      //     alert(json.message);
      // }
    })
    .catch(function (error) { })
    .then(function () {
      // always executed
    });
}

function setDisplay(_data) {
  $(".chat-list").empty();
  console.log("setDisplay~~~~~~~~~~~~~~~~");
  prev_set_transparency(_data.win_transparency);
  prev_set_chat_sort(_data.chat_sort);
  prev_set_chat_align(_data.chat_direction);
  pre_set_chat_scroll(_data.set_chating.scroll);
  pre_set_chat_fadeout(_data.set_chating.fadeout);
  pre_set_chat_font(_data.font_name);

  var isFontBold = _data.font_bold == "on";
  if (isFontBold) {
    if ($(".chat-list-area").hasClass("font-weight-bold"))
      $(".chat-list-area").removeClass("font-weight-bold");
    $(".chat-list-area").addClass("font-weight-bold");
  } else {
    $(".chat-list-area").removeClass("font-weight-bold");
  }

  pre_set_chat_font_size(_data.font_size);
  setTimeout(prev_chat_fontStroke, 1000);
  prev_chat_fontStroke();
}

function prev_set_transparency(_temp) {
  // console.log("prev_set_transparency", _temp);
  _temp = 100 - _temp;
  var t_val = _temp * 0.01;
  $(".chat-list-area").css({ opacity: t_val });
}

function prev_set_chat_align(str) {
  if ($(".chat-list-area").hasClass("text-right"))
    $(".chat-list-area").removeClass("text-right");
  if ($(".chat-list-area").hasClass("text-left"))
    $(".chat-list-area").removeClass("text-left");

  if (str == "왼쪽") {
    $(".chat-list-area").addClass("text-left");
  } else if (str == "오른쪽") {
    $(".chat-list-area").addClass("text-right");
  }
}

function prev_set_chat_sort(_temp) {
  var className;
  if (_temp == "채팅줄바꿈") {
    className = false;
  } else if (_temp == "채팅인라인") {
    className = "chat-align-inline";
  } else if (_temp == "채팅들여쓰기") {
    className = "chat-align-indent";
  } else if (_temp == "닉네임우측정렬") {
    className = "chat-align-ellipsis";
  } else {
    className = false;
  }

  // console.log("prev_set_chat_sort :", _temp,  className)

  if ($(".chat-list").hasClass("chat-align-inline"))
    $(".chat-list").removeClass("chat-align-inline");
  if ($(".chat-list").hasClass("chat-align-indent"))
    $(".chat-list").removeClass("chat-align-indent");
  if ($(".chat-list").hasClass("chat-align-ellipsis"))
    $(".chat-list").removeClass("chat-align-ellipsis");

  if (!className) return;
  $(".chat-list").addClass(className);
}

function pre_set_chat_scroll(_toggle) {
  if (_toggle == "on") {
    if ($(".chat-list-area").hasClass("item-srcoll"))
      $(".chat-list-area").removeClass("item-srcoll");
    $(".chat-list-area").addClass("item-srcoll");
  } else {
    $(".chat-list-area").removeClass("item-srcoll");
  }
}

function pre_set_chat_fadeout(_toggle) {
  if (_toggle == "on") {
    if ($(".chat-list-area").hasClass("item-fade-out"))
      $(".chat-list-area").removeClass("item-fade-out");
    $(".chat-list-area").addClass("item-fade-out");
  } else {
    $(".chat-list-area").removeClass("item-fade-out");
  }
}

function pre_set_chat_font(_className) {
  if (prev_font_name) {
    if ($(".chat-list-area").hasClass(prev_font_name))
      $(".chat-list-area").removeClass(prev_font_name);
  }
  $(".chat-list-area").addClass(_className);
  prev_font_name = _className;
}

function pre_set_chat_font_size(_size) {
  $(".chat-list-area").css("font-size", _size + "px");
}

function prev_chat_fontStroke() {
  // get form values
  //var fontFamily = $('#fontFamily').val();
  //var fontColor = $('#fontColorPicker').val();

  var strokeSize = current_data.font_outline;
  strokeColor = current_data.font_outline_color;
  fontSize = current_data.font_size;

  // update css

  $(".chat-list").css("font-size", fontSize + "px");
  $(".chat-list").css("text-shadow", "");

  // console.log("prev_chat_fontStroke~~~~~~~~~~~~winchat~: ", $('.chat-list'), strokeSize, strokeColor, fontSize)

  // for (var angle = 0; angle < 2 * Math.PI; angle += 1 / strokeSize) {
  //     appendShadow($('.chat-list'), Math.cos(angle) * strokeSize, Math.sin(angle) * strokeSize, strokeColor);
  // }
}

function css_setEffspeed(_target, _temp) {
  _target.css({ "transition-duration": _temp + "s" });
  _target.css({ "-webkit-transition-duration": _temp + "s" });
  _target.css({ "animation-duration": _temp + "s" });
  _target.css({ "transition-duration": _temp + "s" });
}

/////////////////////////////////////////////////////////////////chat
function pushChat(_level, _id, _nick, _text) {
  /*if (current_data.set_chating.id == "on") {
        _id = "(" + _id + ")"
    } else {
        _id = "";
    }*/
  _id = "";

  var nick_color;
  var txt_color;
  var image_icon = "";
  var _alt;
  var icon_class;

  const isInnerIcoType =
    (current_data.set_icon.setting || "내부송출") === "내부송출";

  if (_level == "BJ") {
    if (isInnerIcoType && current_data.set_icon.bj == "on") {
      image_icon = "ico_BJ";
      _alt = "bj";
      icon_class = "ico bj";
    } else if (!isInnerIcoType && current_data.set_icon.flex === "on") {
      image_icon = "ico_preview_flex";
      _alt = "flex";
      icon_class = "ico flex";
    }

    nick_color = current_data.chat_color.BJ닉네임;
    txt_color = current_data.chat_color.BJ채팅;
  } else if (_level == "매니저") {
    if (isInnerIcoType && current_data.set_icon.manager == "on") {
      image_icon = "ico_manager";
      _alt = "manager";
      icon_class = "ico manager";
    } else if (!isInnerIcoType && current_data.set_icon.flex === "on") {
      image_icon = "ico_preview_flex";
      _alt = "flex";
      icon_class = "ico flex";
    }
    nick_color = current_data.chat_color.매니저닉네임;
    txt_color = current_data.chat_color.매니저채팅;
  } else if (_level == "VIP") {
    if (isInnerIcoType && current_data.set_icon.ranking == "on") {
      image_icon = "ico_VIP";
      _alt = "level";
      icon_class = "ico level";
    } else if (!isInnerIcoType && current_data.set_icon.flex === "on") {
      image_icon = "ico_preview_flex";
      _alt = "flex";
      icon_class = "ico flex";
    }
    nick_color = current_data.chat_color.일반닉네임;
    txt_color = current_data.chat_color.일반채팅;
  } else if (_level == "일반") {
    if (isInnerIcoType && current_data.set_icon.ranking == "on") {
      image_icon = "ico_normal";
      _alt = "level";
      icon_class = "ico normal";
    } else if (!isInnerIcoType && current_data.set_icon.flex === "on") {
      image_icon = "ico_preview_flex";
      _alt = "flex";
      icon_class = "ico flex";
    }
    nick_color = current_data.chat_color.일반닉네임;
    txt_color = current_data.chat_color.일반채팅;
  } else {
    if (isInnerIcoType && current_data.set_icon.ranking == "on") {
      if (_level == "a") {
        //image_icon = "ico_admin";
        image_icon = "ico_operator";
      } else if (_level == "r") {
        image_icon = "ico_bronze";
      } else if (_level == "d") {
        image_icon = "ico_diamond";
      } else if (_level == "g") {
        image_icon = "ico_gold";
      } else if (_level == "s") {
        image_icon = "ico_silver";
      } else if (_level == "p") {
        image_icon = "ico_police";
      } else if (_level == "f") {
        image_icon = "ico_fan";
      } else if (_level == "1k") {
        image_icon = "ico_1k";
      } else if (_level == "2k") {
        image_icon = "ico_2k";
      } else if (_level == "j") {
        image_icon = "ico_jinny";
      }

      _alt = "level";
      icon_class = "ico level";
    } else if (!isInnerIcoType && current_data.set_icon.flex === "on") {
      image_icon = "ico_preview_flex";
      _alt = "flex";
      icon_class = "ico flex";
    }

    if (_level == "f" || _level == "1k" || _level == "2k") {
      nick_color = current_data.chat_color.VIP닉네임;
      txt_color = current_data.chat_color.VIP채팅;
    } else {
      nick_color = current_data.chat_color.일반닉네임;
      txt_color = current_data.chat_color.일반채팅;
    }
  }

  var t_nickname;

  if (image_icon == "") {
    t_nickname = $("<p>")
      .addClass("nickname")
      .css("color", nick_color)
      .append($("<span>").addClass("nick").text(_nick))
      .append($("<span>").addClass("id").text(_id));
  } else {
    t_nickname = $("<p>")
      .addClass("nickname")
      .css("color", nick_color)
      .append(
        $("<span>")
          .addClass(icon_class)
          .append(
            $("<img>")
              .attr("src", "../../images/" + image_icon + ".png")
              .attr("alt", _alt)
          )
      )
      .append($("<span>").addClass("nick").text(_nick))
      .append($("<span>").addClass("id").text(_id));
  }

  if (current_data.set_chating.random == "on") {
    var ranNum = Math.floor(Math.random() * 6 + 1);
    // console.log("ranNum :", ranNum);
    t_nickname.addClass("nick-random-color-" + ranNum);
  }

  var t_chat = $("<li>")
    .addClass("animated " + current_data.chat_eff_fadein)
    .append(t_nickname)
    .append($("<p>").addClass("txt").text(_text).css("color", txt_color));

  css_setEffspeed(t_chat, current_data.chat_eff_fadein_speed);
  let chat_list = $(".chat-list");
  chat_list.append(t_chat);

  $(".chat-list-area").scrollTop($(".chat-list-area").prop("scrollHeight"));

  let limitCnt = 50;
  let chatlist_length = chat_list.children().length;

  //console.log("chatlist_length ~~~~~~~~~11: ", chatlist_length)
  if (chatlist_length > limitCnt) {
    chat_list
      .children()
      .slice(0, chatlist_length - limitCnt)
      .remove();
  }
}

//입장등급추천
function pushNoti(_nick, _text) {
  var t_noti = $("<li>")
    .addClass("noti animated " + current_data.chat_eff_fadein)
    .append(
      $("<div>")
        .addClass("noti-txt")
        .append(
          $("<p>")
            .addClass("word")
            .text(_nick + " " + _text)
            .css("color", current_data.chat_color.입장등급추천)
        )
    );
  css_setEffspeed(t_noti, current_data.chat_eff_fadein_speed);
  // $('.chat-list').append(t_noti);

  let chat_list = $(".chat-list");
  chat_list.append(t_noti);
  // $('.chat-list-area').scrollTop( $('.chat-list-area').prop('scrollHeight'));
  let limitCnt = 50;
  let chatlist_length = chat_list.children().length;

  //console.log("chtalist_length ~~~~~~~~~22: ", chatlist_length)
  if (chatlist_length > limitCnt) {
    chat_list
      .children()
      .slice(0, chatlist_length - limitCnt)
      .remove();
  }

  // $('.chat-list-area').scrollTop( $('.chat-list-area').prop('scrollHeight'));
}

//후원
function pushNoti_image(_nick, _text, _img_url) {
  var t_noti;
  if (current_data.sponsor_mark == "이미지") {
    var img_src;
    if (_img_url) {
      img_src = _img_url;
    } else {
      img_src = "../../images/img_gift_100.png";
    }

    t_noti = $("<li>")
      .addClass("noti animated " + current_data.chat_eff_fadein)
      .append(
        $("<div>")
          .addClass("noti-img")
          .append(
            $("<img>").attr("src", img_src).css({ width: "25%", heigth: "25%" })
          )
      )
      .append(
        $("<div>")
          .addClass("noti-txt")
          .append(
            $("<p>")
              .addClass("word")
              .text(_nick + " " + _text)
              .css("color", current_data.chat_color.후원)
          )
      );
  } else if (current_data.sponsor_mark == "텍스트") {
    t_noti = $("<li>")
      .addClass("noti animated " + current_data.chat_eff_fadein)
      .append(
        $("<div>")
          .addClass("noti-txt")
          .append(
            $("<p>")
              .addClass("word")
              .text(_nick + " " + _text)
              .css("color", current_data.chat_color.후원)
          )
      );
  }

  css_setEffspeed(t_noti, current_data.chat_eff_fadein_speed);
  // $('.chat-list').append(t_noti);

  let chat_list = $(".chat-list");
  chat_list.append(t_noti);
  // $('.chat-list-area').scrollTop( $('.chat-list-area').prop('scrollHeight'));
  let limitCnt = 50;
  let chatlist_length = chat_list.children().length;

  //console.log("chtalist_length ~~~~~~~~~33: ", chatlist_length)
  if (chatlist_length > limitCnt) {
    chat_list
      .children()
      .slice(0, chatlist_length - limitCnt)
      .remove();
  }
  //  $('.chat-list-area').scrollTop( $('.chat-list-area').prop('scrollHeight'));
}

var arr_fontSize = [14, 17, 20];
var fontIndex = 0;
function changeFontSize() {
  fontIndex++;
  if (fontIndex > 2) fontIndex = 0;
  $(".chat-list").css("font-size", arr_fontSize[fontIndex] + "px");
}

function scroll_down() {
  //pushChat("p", "eee", "ffff", "ggggggggggggggggggggggggggggggggggg")
  // $('.chat-list-area').scrollTop( $('.chat-list-area').prop('scrollHeight'));
}

init();
