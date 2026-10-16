var my_key;
var current_data;
var prev_font_name;
var eff_sound;
var voice_sound = null;
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

var isSoundStay = false;
var currentSoundId = null;

var is_mobile_sound = true;

const SPONSORTYPE = {
  PLUS: 1,
  MINUS: 2,
};

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

        voice_str += t_pop.joint
          ? current_data.noti_joint_text.replace(
            "{닉네임}",
            t_pop.joint._bjnick || ""
          )
          : "";
        voice_str += t_pop.excel
          ? current_data.noti_excel_text
            .replace("{닉네임}", t_pop.excel._bjnick || "")
            .replace("{플러스}", t_pop.excel._plus || "")
          : "";

        //console.log("🔥 ~ visible_noti_pop ~ voice_str:", voice_str);
        if (t_pop.isLuckyCard == "true") {
          voice_str = current_data_luckycard.noti_text
            .replace("{닉네임}", t_pop._nick)
            .replace("{개수}", numberWithCommas(t_pop._flexNum));
        }

        if (current_data.is_chat_voice == "on") {
          if (t_pop._tts_msg) {
            voice_str = voice_str + "  " + t_pop._tts_msg;
          }
        }
        play_voice_sound(voice_str, t_pop._soundId, t_pop._actorId);
      }

      isVisibleNotiPop = true;

      $(".chat-list").append(t_pop);
      animateCSS(".chat-list", current_data.pop_fade_in_type, function () { });
      if (arr_pop_cue.length > 0) {
        timer_count = next_pop_stay_cnt;
      } else {
        timer_count = current_data.pop_visible_time;
      }

      const myWorker = new Worker("../../pages/setInterval.js?123");
      myWorker.postMessage(1000);
      myWorker.onmessage = function (event) {
        timer_count--;
        //.log("timer_count :", timer_count, "t_pop._soundId:", t_pop._soundId, "currentSoundId :", currentSoundId,  "isSoundStay : ", isSoundStay)
        if (timer_count == 1) {
          if (t_pop._soundId == currentSoundId || isSoundStay) {
            timer_count++;
          }
          if (null == currentSoundId && isSoundStay) {
            voice_sound = null;
            currentSoundId = null;
            isSoundStay = false;
          }
        }
        if (timer_count == 0) {
          animateCSS(
            ".chat-list",
            current_data.pop_fade_out_type,
            function () { }
          );
          console.log("end");
          myWorker.terminate();
          isVisibleNotiPop = false;
          $(".chat-list").empty();
          $(".roulette-area").empty();
          $(".rouletteContainer").css("display", "none");
          visible_noti_pop();
        }
      };
    }
  } else {
    if (timer_count > next_pop_stay_cnt) {
      timer_count = next_pop_stay_cnt;
    }
  }
}

function play_voice_sound(msg, soundId, actorId = null) {
  var regExp = /[#&"]/gi;
  if (regExp.test(msg)) {
    msg = msg.replace(regExp, "");
  }
  if (!msg) return;

  var limitStr = parseInt(current_data.voice_limit_txtnum);
  if (limitStr) {
    msg = msg.substring(0, limitStr);
  }
  var ttsObj = {
    isBgm: false,
    msg: msg,
    actorId: actorId,
    soundId: soundId,
  };
  arr_tts_cue.push(ttsObj);
  play_tts();
}

async function play_tts() {
  if (!is_mobile_sound) {
    return;
  }

  console.log("play_tts:");
  if (voice_sound) {
    voice_sound.stop();
  }

  var ttsObj = arr_tts_cue.shift();
  if (!ttsObj) return;
  isSoundStay = true;
  if (ttsObj.isBgm) {
    voice_sound = new buzz.sound(ttsObj.url);
    voice_sound.setVolume(parseInt(ttsObj.volume));
  } else {
    if (ttsObj.actorId) {
      try {
        let ttsUrl = await getTtsUrl(ttsObj.actorId, ttsObj.msg);

        if (!ttsUrl) {
          voice_sound = null;
          currentSoundId = null;
          isSoundStay = false;
          return;
        }
        voice_sound = new buzz.sound(ttsUrl);
        // voice_sound = new buzz.sound(g_url_tts + msg);
        voice_sound.setVolume(current_data.noti_sound_volume);
        voice_sound.setSpeed(current_data.noti_voice_speed);
      } catch (error) {
        console.log(error);
      }
    } else {
      voice_sound = new buzz.sound(g_url_tts + ttsObj.msg);
      voice_sound.setVolume(current_data.noti_sound_volume);
      voice_sound.setSpeed(current_data.noti_voice_speed);
    }
  }
  voice_sound.stop();
  voice_sound.loop = false;
  voice_sound.play();

  voice_sound.bind("play", function () {
    currentSoundId = ttsObj.soundId;
    console.log("voice_sound play!! currentSoundId:", currentSoundId);
  });
  voice_sound.bind("error", function (e) {
    console.log("Error: " + this.getErrorMessage());
    voice_sound = null;
    currentSoundId = null;
    isSoundStay = false;
  });
  voice_sound.bindOnce("ended", async function () {
    console.log("voice_sound ended!!");
    if (ttsObj.isBgm) {
      if (ttsObj.tts_msg) {
        console.log("voice_sound11", ttsObj);
        if (ttsObj.actorId) {
          console.log("voice_sound22", ttsObj);
          let ttsUrl = await getTtsUrl(ttsObj.actorId, ttsObj.tts_msg);
          if (!ttsUrl) {
            voice_sound = null;
            currentSoundId = null;
            isSoundStay = false;
            return;
          }
          voice_sound = new buzz.sound(ttsUrl);
          voice_sound.setVolume(current_data.noti_sound_volume);
          voice_sound.setSpeed(current_data.noti_voice_speed);
        } else {
          voice_sound = new buzz.sound(g_url_tts + ttsObj.tts_msg);
          voice_sound.setVolume(current_data.noti_sound_volume);
          voice_sound.setSpeed(current_data.noti_voice_speed);
        }

        voice_sound.stop();
        voice_sound.loop = false;
        voice_sound.play();

        voice_sound.bind("error", function () {
          console.log("Error: " + this.getErrorMessage());
          voice_sound = null;
          currentSoundId = null;
          isSoundStay = false;
        });
        voice_sound.bindOnce("ended", function () {
          console.log("voice_sound ended!!2222");
          voice_sound = null;
          currentSoundId = null;
          isSoundStay = false;
        });
      } else {
        console.log("voice_sound11", ttsObj);
        voice_sound = null;
        currentSoundId = null;
        isSoundStay = false;
      }
    } else {
      voice_sound = null;
      currentSoundId = null;
      isSoundStay = false;
    }
  });
}

async function getTtsUrl(a_id, text) {
  var result = "";
  var params = {
    actorId: a_id,
    text: text,
  };
  try {
    const res = await axios.post(g_url_tts_base_url + "/voice/speak", params);
    let json = res.data;
    if (json.returnCode == 1) {
      if (json.resultMap.returnVal == 1) {
        //console.log("getTtsUrl1:", json)
        result = json.resultMap.data.audio_download_url;
      } else {
      }
    } else {
    }
  } catch (error) {
    //  triggerToast('Something went wrong!', 'danger');
    console.log(error);
  }

  //console.log("getTtsUrl2: result", result)
  return result;
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

function get_replace_str_to_array(_str, _nick, _flex, _plus) {
  var result_arr = [];
  var st1 = _str
    .replace("{닉네임}", "@^!#nick")
    .replace("{개수}", "@^!#num")
    .replace("{플러스}", "@^!#plus");
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
    } else if (txt.search("#plus") != -1) {
      const tt3 = txt.split("#plus");
      result_arr.push(_plus);
      if (tt3[1] != "") result_arr.push(tt3[1]);
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
  });
  socket.on("notice", function (data) {
    showNotiFromSocket(data);
  });
  socket.on("help", function (data) {
    //console.log('help', data);
    window.location.reload();
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
      arr_pop_cue = [];
    } else if (_data.type == "6") {
      //부분스킵
      console.log("부분 스킵");
      arr_pop_cue.shift();
    }
  });

  socket.open();
}

function showNotiFromSocket(data) {
  console.log("notice~~", data);
  var flex_num = parseInt(data.msg);
  if (data.type == "1") {
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
    show_noti_popup(data);
  }
}

function show_noti_popup(_data) {
  let t_flexNum = parseInt(_data.msg);
  let t_imgUrl = _data.url ? _data.url : null;
  let t_nick = _data.nick;
  let t_mid = _data.mid;
  let t_actorId = _data.actorId ? _data.actorId : null;
  let t_tts_msg = _data.tts_msg ? _data.tts_msg : null;
  const excel = _data.excel ? _data.excel : null;
  const joint = _data.joint ? _data.joint : null;

  var str_text = get_replace_str_to_array(
    current_data.noti_text,
    t_nick,
    numberWithCommas(t_flexNum)
  );

  var img_src;
  if (t_imgUrl) {
    img_src = t_imgUrl;
  } else {
    img_src = "../../images/img_gift_100.png";
  }

  var _data = {
    nick: t_nick,
    flexNum: t_flexNum,
    img_src: img_src,
    text_arr: str_text,
    mid: t_mid,
    tts_msg: t_tts_msg,
    actorId: t_actorId,
  };

  if (excel && !!excel.isExcel) {
    // 데이터 추가
    const bjNickname = excel.bjNickname;
    const sponsorType = excel.sponsorType;
    const plus = SPONSORTYPE.PLUS === sponsorType ? "플러스" : "마이너스";
    let excel_str_text = get_replace_str_to_array(
      current_data.noti_excel_text || "",
      bjNickname,
      null,
      plus
    );

    _data.excel = excel || {};
    _data.excel.plus = plus;
    _data.excel.excel_text_arr = excel_str_text;
  }

  if (joint) {
    // 데이터 추가
    const bjNickname = joint.bjNickname;
    let joint_str_text = get_replace_str_to_array(
      current_data.noti_joint_text || "",
      bjNickname,
      null
    );

    _data.joint = joint || {};
    _data.joint.joint_text_arr = joint_str_text;
  }

  pushNotiPop(_data);
}

function pushNotiPop(_data) {
  //  console.log('pushNotiPop:', _data)

  let t_nick = _data.nick;
  let t_flexNum = _data.flexNum;
  let t_img_src = _data.img_src;
  let t_text_arr = _data.text_arr;
  let t_mid = _data.mid;
  let t_tts_msg = _data.tts_msg;
  let t_actorId = _data.actorId;

  //console.log("t_img_src", t_img_src)

  var txt_align_class;
  if (current_data.text_align == "왼쪽") {
    txt_align_class = "text-left";
  } else if (current_data.text_align == "가운데") {
    txt_align_class = "text-center";
  } else if (current_data.text_align == "오른쪽") {
    txt_align_class = "text-right";
  }

  var noti_pop = $("<div>").addClass("noti").addClass(txt_align_class);

  var noti_img = $("<div>")
    .addClass("noti-img")
    .append($("<img>").attr("src", t_img_src).attr("alt", "level"));

  var noti_txt = $("<div>").addClass("noti-txt");
  var arr_txt_ani_nick = [];
  var arr_txt_ani_flex = [];
  for (var i = 0; i < t_text_arr.length; i++) {
    var txt;
    var str = t_text_arr[i];

    if (str == t_nick) {
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
    } else if (str == numberWithCommas(t_flexNum)) {
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

  // excel 지정 BJ정보를 추가로 표시
  // FIXME 테스트 코드: 서버작업 후 수정 필요
  const { excel, joint } = _data;
  // bj 정보 추가 (현 모바일에서는 음성만 송출, UI는 사용하지 않음.)
  /* if (excel && !!excel.isExcel) {
    const container = $("<div>", { class: "noti-text" }).appendTo(noti_txt);
    apppendExcelBJ(container, excel);
  } else if (joint) {
    const container = $("<div>", { class: "noti-text" }).appendTo(noti_txt);
    apppendJointBJ(container, joint);
  } */

  noti_pop._mid = t_mid;
  noti_pop._nick = t_nick;
  noti_pop._flexNum = t_flexNum;
  noti_pop._tts_msg = t_tts_msg;
  noti_pop._actorId = t_actorId;
  noti_pop._soundId = Math.floor(Math.random() * 10000) + 1;

  // excel, joint
  if (excel && !!excel.isExcel) {
    noti_pop.excel = { _bjnick: excel.bjNickname || "", _plus: excel.plus };
  } else if (joint) {
    noti_pop.joint = { _bjnick: joint.bjNickname || "" };
  }

  noti_pop.append(noti_img);
  noti_pop.append(noti_txt);
  //tts message add
  if (t_tts_msg) {
    var limitStr = parseInt(current_data.voice_limit_txtnum);
    if (limitStr) {
      var msg = t_tts_msg.substring(t_tts_msg, limitStr);
    }
    var noti_txt_chat = $("<div>").append(
      $("<p>")
        .addClass("word")
        .text(msg)
        .css("color", current_data.noti_font_color)
    );
    setTimeout(() => {
      noti_pop.append(noti_txt_chat);
    }, 1000);
  }
  arr_pop_cue.push(noti_pop);
  visible_noti_pop();
}

function apppendExcelBJ(container, excel) {
  try {
    var arr_txt_ani_excel_nick = [];

    const bjNickname = excel.bjNickname;
    const excel_text_arr = excel.excel_text_arr;
    const plus = excel.plus;
    const bjMemberId = excel.bjMemberId;

    if ("" === bjNickname || 0 === bjMemberId) {
      return;
    }
    for (var i = 0; i < excel_text_arr.length; i++) {
      let str = excel_text_arr[i];
      if (str == bjNickname) {
        const excelBjNickname = $("<p>")
          .addClass("word")
          .addClass("word_nick")
          .css("color", current_data.noti_nick_color)
          .css("white-space", "pre")
          .appendTo(container);

        // bj nickname
        const limit = (bjNickname || "").length || 0;
        for (let ei = 0; ei < limit; ei++) {
          const char = bjNickname.charAt(ei);
          const spanChar = $("<span>", { text: char });
          excelBjNickname.append(spanChar);
          arr_txt_ani_excel_nick.push(spanChar);
        }
      } else if (str === plus) {
        // 플러스
        $("<p>", { text: str })
          .addClass("word")
          .css("color", "#ff0000")
          .css("white-space", "pre")
          .appendTo(container);
      } else {
        $("<p>", { text: str })
          .addClass("word")
          .css("color", current_data.noti_font_color)
          .css("white-space", "pre")
          .appendTo(container);
      }
    }

    //bj nickname 효과추가
    for (let idx = 0; idx < arr_txt_ani_excel_nick.length; idx++) {
      var node = arr_txt_ani_excel_nick[idx];
      var delray_num;

      if (current_data.text_fade_dir == "정방향") {
        delray_num = idx;
      } else if (current_data.text_fade_dir == "역방향") {
        delray_num = arr_txt_ani_excel_nick.length - (idx + 1);
      } else if (current_data.text_fade_dir == "랜덤") {
        delray_num = Math.floor(Math.random() * arr_txt_ani_excel_nick.length);
      }

      set_txt_ani(node, delray_num * 0.1);
    }
  } catch (e) {
    console.error(e);
  }
}

function apppendJointBJ(container, joint) {
  try {
    var arr_txt_ani_joint_nick = [];

    const bjNickname = joint.bjNickname;
    const joint_text_arr = joint.joint_text_arr;
    const bjMemberId = joint.bjMemberId;

    if ("" === bjNickname || 0 === bjMemberId) {
      return;
    }
    for (var i = 0; i < joint_text_arr.length; i++) {
      let str = joint_text_arr[i];
      if (str == bjNickname) {
        const excelBjNickname = $("<p>")
          .addClass("word")
          .addClass("word_nick")
          .css("color", current_data.noti_nick_color)
          .css("white-space", "pre")
          .appendTo(container);

        // bj nickname
        const limit = (bjNickname || "").length || 0;
        for (let ei = 0; ei < limit; ei++) {
          const char = bjNickname.charAt(ei);
          const spanChar = $("<span>", { text: char });
          excelBjNickname.append(spanChar);
          arr_txt_ani_joint_nick.push(spanChar);
        }
      } else {
        $("<p>", { text: str })
          .addClass("word")
          .css("color", current_data.noti_font_color)
          .css("white-space", "pre")
          .appendTo(container);
      }
    }

    //bj nickname 효과추가
    for (let idx = 0; idx < arr_txt_ani_joint_nick.length; idx++) {
      var node = arr_txt_ani_joint_nick[idx];
      var delray_num;

      if (current_data.text_fade_dir == "정방향") {
        delray_num = idx;
      } else if (current_data.text_fade_dir == "역방향") {
        delray_num = arr_txt_ani_joint_nick.length - (idx + 1);
      } else if (current_data.text_fade_dir == "랜덤") {
        delray_num = Math.floor(Math.random() * arr_txt_ani_joint_nick.length);
      }

      set_txt_ani(node, delray_num * 0.1);
    }
  } catch (e) {
    console.error(e);
  }
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
  jsonObj.noti_excel_text = "{닉네임}님에게 {플러스} 선물";
  jsonObj.noti_joint_text = "{닉네임}님에게 선물";
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
  jsonObj.noti_voice_speed = "1";

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

  //엑셀 알림텍스트 체크
  const defaultData = createDefaultJson();
  const isExcelNoti = _data.noti_excel_text ? true : false;
  if (!isExcelNoti) {
    _data.noti_excel_text = defaultData.noti_excel_text;
    current_data.noti_excel_text = defaultData.noti_excel_text;
  }
  // 합방 알림텍스트 체크
  const isJointNoti = _data.noti_joint_text ? true : false;
  if (!isJointNoti) {
    _data.noti_joint_text = defaultData.noti_joint_text;
    current_data.noti_joint_text = defaultData.noti_joint_text;
  }
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
