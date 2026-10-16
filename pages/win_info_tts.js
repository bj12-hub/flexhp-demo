console.log("win_info_js@@@@@@@@@@@@@@@@~~~~~~~~~~~~~~~~~~");

axios.defaults.withCredentials = true;
let isPause = false;
var my_key;
var current_data;
var prev_font_name;
var eff_sound;
var voice_sound = null;
var my_timeout_id_parent;
var my_timeout_id;
var current_roulette_array_data;

var current_data_luckycard;
let current_data_challengelex;

var arr_pop_cue = [];
var arr_tts_cue = [];
var arr_sponsor_cue = [];
var timer_count = 28;
// queu에 대기 중인 알림이 있을 경우 후원알림 시간(없을 경우에는 설정한 시간으로 표시)
var next_pop_stay_cnt = 4;
//var currentBgmId = null;
var currentSoundId = null;
var isSoundStay = false;
var arr_luckycard_cue = [];
const previousRouletteDomain = "";
const previousRouletteUrl = `${previousRouletteDomain}/sounds/roulette.mp3`;

const SPONSORTYPE = {
  PLUS: 1,
  MINUS: 2,
};

function init_sound() {
  buzz.defaults.preload = "auto";
  eff_sound = new buzz.sound("../../sounds/zap-zip-up3-high.mp3");
  eff_sound.load();
  eff_sound.loop = false;
}
// 알림 방식이 알림음 일 경우의 effect sound
function play_eff_sound() {
  if (eff_sound) eff_sound.stop();
  eff_sound.setVolume(current_data.noti_sound_volume);
  // eff_sound.setSpeed(current_data.noti_voice_speed); // x2
  eff_sound.stop();
  eff_sound.play();
}

function play_bgm_sound(
  obj,
  soundId,
  tts_msg = null,
  actorId = null,
  callback = null,
) {
  console.log("play_bgm_sound : obj", obj);
  if (!obj) return;
  var ttsObj = {
    isBgm: true,
    // 'bgmId' : obj.bgmId,
    url: obj.bgmurl,
    volume: obj.volume,
    tts_msg: tts_msg,
    actorId: actorId,
    soundId: soundId,
  };
  arr_tts_cue.push(ttsObj);
  play_tts(callback);
}

function play_voice_sound(msg, soundId, actorId = null, callback = null) {
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
  play_tts(callback);
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

async function play_tts(callback) {
  console.log("play_tts:");

  if (voice_sound) {
    voice_sound.stop();
  }

  // if (!voice_sound || voice_sound.isEnded()) {
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

  // 음소거 체크
  if (isPause) {
    //voice_sound._volume = voice_sound.getVolume();
    //voice_sound.setVolume(0);
    return voice_sound.pause();
  }

  voice_sound.play();

  // voice_sound.bind("loadstart", function(){
  //    // console.log('voice_sound play!!')
  //     //if(ttsObj.isBgm)
  //    // {
  //         currentSoundId = ttsObj.soundId;
  //     //}

  //      console.log('loadstart play!! currentSoundId:', currentSoundId)
  // })

  voice_sound.bind("play", function () {
    currentSoundId = ttsObj.soundId;
    console.log("voice_sound play!! currentSoundId:", currentSoundId);
    if (callback) callback("play");
  });
  voice_sound.bind("error", function (e) {
    //console.log("❌ Error: " + this.getErrorMessage());
    voice_sound = null;
    currentSoundId = null;
    isSoundStay = false;
    if (callback) callback("error");
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
          console.log("❌❌ Error: " + this.getErrorMessage());
          voice_sound = null;
          currentSoundId = null;
          isSoundStay = false;
          if (callback) callback("error");
        });

        voice_sound.bindOnce("ended", function () {
          console.log("voice_sound ended!!2222");
          voice_sound = null;
          currentSoundId = null;
          isSoundStay = false;
          // play_tts();
          if (callback) callback("ended");
        });
      } else {
        console.log("voice_sound11", ttsObj);
        voice_sound = null;
        currentSoundId = null;
        isSoundStay = false;
        // play_tts();
        if (callback) callback("ended");
      }
    } else {
      voice_sound = null;
      currentSoundId = null;
      isSoundStay = false;
      // play_tts();
      if (callback) callback("ended");
    }
  });

  // }
}

function show_noti_popup_roulette(_data, rouletteData, bgmObj = null) {
  let t_flexNum = parseInt(_data.msg);
  let t_imgUrl = _data.url ? _data.url : null;
  let t_roulette_imgUrl;
  const excel = _data.excel ? _data.excel : null;
  const joint = _data.joint ? _data.joint : null;

  if (rouletteData.imgData && rouletteData.imgData.url) {
    t_roulette_imgUrl = rouletteData.imgData.url;
  } else {
    t_roulette_imgUrl = null;
  }

  if (
    rouletteData.bgmData.url === previousRouletteUrl ||
    rouletteData.bgmData.url.startsWith(previousRouletteDomain)
  ) {
    rouletteData.bgmData.url = g_url_roulette_sound;
  }

  // img url
  if (bgmObj && "ON" === (rouletteData.isBgmFirst || "")) {
    if (bgmObj.imgurl) {
      t_roulette_imgUrl = bgmObj.imgurl;
    }
    if (bgmObj.bgmurl) {
      rouletteData.bgmData.url = bgmObj.bgmurl;
    }
  }

  let t_nick = _data.nick;
  let t_mid = _data.mid;
  let t_actorId = _data.actorId ? _data.actorId : null;
  let t_tts_msg = _data.tts_msg ? _data.tts_msg : null;
  var str_text = get_replace_str_to_array(
    rouletteData.noti_text,
    t_nick,
    numberWithCommas(t_flexNum),
  );
  var img_src;

  if (t_roulette_imgUrl) {
    img_src = t_roulette_imgUrl;
  } else {
    if (t_imgUrl) {
      img_src = t_imgUrl;
    } else {
      img_src = "../../images/img_gift_100.png";
    }
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
      plus,
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
      null,
    );

    _data.joint = joint || {};
    _data.joint.joint_text_arr = joint_str_text;
  }

  pushNotiPop(_data, null, rouletteData);
}

// FLEXTV 이벤트 도전(392) → 이벤트 룰렛(배너형 · 원판형, pages/event_roulette.js). 결과는 서버 값.
// FLEXTV 이벤트 위젯의 3 · 2 · 1과 같은 때 돌도록 후원 알림 대기열을 거치지 않고 바로 띄운다(자리는 기존 룰렛처럼 알림 아래).
// 도전이 연달아 오면 앞 룰렛이 끝난 뒤 차례로 돈다.
let rocketRouletteQueue = Promise.resolve();
function showRocketRoulette(data) {
  if (!data || String(data.type) !== "392" || !data.wheel) return;
  if (!data.wheel.on || data.wheel.where !== "src") return;
  if (typeof EventRoulette === "undefined") return;
  rocketRouletteQueue = rocketRouletteQueue.then(() => runRocketRoulette(data)).catch((e) => console.log("rocket roulette", e));
}

async function runRocketRoulette(data) {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const layer = document.getElementById("evRouletteLayer");
  if (!layer) return;
  const w = data.wheel;
  const win = data.result === "WIN";
  const winName = w.winName || "성공";
  const loseName = w.loseName || "실패";
  const amount = parseInt(data.amount) || 0;
  const prize = numberWithCommas(parseInt(data.prizeAmount) || 0) + (data.prizeUnit || "");
  layer.querySelector(".ev-roulette-text").textContent = String(w.text || "{닉네임}님 도전! 결과는?")
    .replace("{닉네임}", data.sponsorNickname || "후원자")
    .replace("{BJ}", data.bjNickname || "BJ")
    .replace("{렉스}", numberWithCommas(amount))
    .replace("{당첨금액}", prize);

  const winRate = Math.max(0.01, Math.min(99.99, Number(data.winRate) || 5));
  const theme = EventRoulette.themeOf(w.theme);
  const box = layer.querySelector(".ev-roulette-box");
  box.className = "ev-roulette-box is-" + EventRoulette.kindOf(theme);
  const roulette = EventRoulette.create(box, { theme, slices: Math.max(4, Math.min(24, Math.round(100 / winRate))), winName, loseName });
  const seconds = Math.max(2, Math.min(10, Math.round(Number(w.time) || 4)));
  const hold = Math.max(1, Math.min(10, Math.round(Number(w.hold) || 3)));

  let bgm = null;
  if (w.sound !== "off" && typeof g_url_roulette_sound === "string" && g_url_roulette_sound) {
    try {
      bgm = new Audio(g_url_roulette_sound);
      bgm.volume = 0.8;
      bgm.play().catch(() => {});
    } catch (e) {}
  }
  layer.classList.add("show");
  await wait(200);
  await roulette.spin(win, seconds);
  if (w.voice && typeof g_url_tts === "string" && g_url_tts) {
    try {
      const a = new Audio(g_url_tts + encodeURIComponent(`${win ? winName : loseName}!`));
      a.volume = 0.9;
      a.play().catch(() => {});
    } catch (e) {}
  }
  await wait(hold * 1000);
  layer.classList.remove("show");
  if (bgm) {
    try {
      bgm.pause();
    } catch (e) {}
  }
  await wait(350);
}

function show_noti_popup(_data, bgmObj = null) {
  let t_flexNum = parseInt(_data.msg);
  let t_imgUrl = _data.url ? _data.url : null;
  let t_nick = _data.nick;
  let t_mid = _data.mid;
  let t_actorId = _data.actorId ? _data.actorId : null;
  let t_tts_msg = _data.tts_msg ? _data.tts_msg : null;
  let effectSound = _data.effectSound ? _data.effectSound : null;
  const excel = _data.excel ? _data.excel : null;
  const joint = _data.joint ? _data.joint : null;

  var str_text = get_replace_str_to_array(
    current_data.noti_text,
    t_nick,
    numberWithCommas(t_flexNum),
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
    effectSound: effectSound,
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
      plus,
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
      null,
    );

    _data.joint = joint || {};
    _data.joint.joint_text_arr = joint_str_text;
  }

  if (bgmObj) {
    if (bgmObj.imgurl) _data.img_src = bgmObj.imgurl;
    pushNotiPop(_data, bgmObj);
  } else {
    pushNotiPop(_data);
  }
}

function show_noti_popup_luckycard(_data) {
  if (current_data_luckycard.isAvailable == "off") return;
  let t_flexNum = parseInt(_data.maxLex);
  let t_imgUrl = _data.url ? _data.url : null;
  let t_nick = _data.nick;
  let t_mid = _data.mid;
  let t_actorId = _data.actorId ? _data.actorId : null;
  let t_tts_msg = _data.cardMsg ? _data.cardMsg : null;

  var str_text = get_replace_str_to_array(
    current_data_luckycard.noti_text,
    t_nick,
    numberWithCommas(t_flexNum),
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
    isLuckyCard: "true",
  };

  pushNotiPop(_data);
}

// FIXME: flextv 서버에서 정상정보를 받아와야 함.
function show_noti_popup_challengeLex(_data) {
  if (current_data_challengelex.isAvailable == "off") return;
  // 후원금액
  let t_flexNum = parseInt(_data.funds.amount || 0);
  let t_imgUrl = _data.url ? _data.url : null;
  // FIXME: 테스트 코드 제거(|| "ted8192")
  let t_nick = _data.nick || "테드8192";
  // FIXME: 테스트 코드 제거(|| "ted8192")
  let t_mid = _data.mid || "ted8192";

  let notiText;
  var img_src;
  if (t_imgUrl) {
    img_src = t_imgUrl;
  } else {
    // TODO: 서버에서 이미지가 넘어오는지 확인 필요
    switch (_data.type) {
      case CHALLENGELEX.DATA_TYPE.CREATE:
        img_src = "../../images/create-mission.svg";
        notiText = current_data_challengelex.noti_text_reg;
        break;
      case CHALLENGELEX.DATA_TYPE.START:
        img_src = "../../images/start-mission.svg";
        notiText = current_data_challengelex.noti_text_start;
        break;
      case CHALLENGELEX.DATA_TYPE.CANCELED:
        img_src = "../../images/failed-mission.svg";
        notiText = current_data_challengelex.noti_text_cancel;
        break;
      case CHALLENGELEX.DATA_TYPE.FUND:
        img_src = "../../images/fund-mission.svg";
        notiText = current_data_challengelex.noti_text_fund;
        break;
      case CHALLENGELEX.DATA_TYPE.SUCCESS:
        img_src = "../../images/success-mission.svg";
        notiText = current_data_challengelex.noti_text_success;
        break;
      case CHALLENGELEX.DATA_TYPE.FAILED:
        img_src = "../../images/failed-mission.svg";
        notiText = current_data_challengelex.noti_text_failure;
        break;
    }
  }
  notiText = replaceString(notiText, { 미션내용: `"${_data.title}"` });

  var str_text = get_replace_str_to_array(
    notiText,
    t_nick,
    numberWithCommas(t_flexNum),
  );
  console.log("🔥 ~ show_noti_popup_challengeLex ~ str_text:", str_text);

  var _data = {
    nick: t_nick,
    flexNum: t_flexNum,
    img_src: img_src,
    text_arr: str_text,
    mid: t_mid,
    isChallengeLex: "true",
  };

  pushNotiPop(_data);
}

function pushNotiPop(_data, bgmObj = null, rouletteObj = null) {
  console.log("pushNotiPop:", _data);

  let t_nick = _data.nick;
  let t_flexNum = _data.flexNum;
  let t_img_src = _data.img_src;
  let effectSound = _data.effectSound;
  let t_text_arr = _data.text_arr;
  let t_mid = _data.mid;
  let t_tts_msg = _data.tts_msg;
  let t_actorId = _data.actorId;

  //console.log("t_img_src", t_img_src);
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
  // nickname, lex animation(도우미 설정: 텍스트 표시효과)
  for (var i = 0; i < t_text_arr.length; i++) {
    var txt;
    var str = t_text_arr[i];

    if (str == t_nick) {
      txt = $("<p>")
        .addClass("word ani-1")
        .addClass("word_nick")
        .css("color", current_data.noti_nick_color)
        .css("white-space", "pre");

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
        .css("color", current_data.noti_number_color)
        .css("white-space", "pre");

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
        .css("color", current_data.noti_font_color)
        .css("white-space", "pre");
      noti_txt.append(txt);
    }
  }
  // nickname 텍스트 표시 효과 방향
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
  // LEX 텍스트 표시 효과 방향
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
  // bj 정보 추가
  if (excel && !!excel.isExcel) {
    const container = $("<div>", { class: "noti-text" }).appendTo(noti_txt);
    apppendExcelBJ(container, excel);
  } else if (joint) {
    const container = $("<div>", { class: "noti-text" }).appendTo(noti_txt);
    apppendJointBJ(container, joint);
  }

  noti_pop._mid = t_mid;
  noti_pop._nick = t_nick;
  noti_pop._flexNum = t_flexNum;
  noti_pop._tts_msg = t_tts_msg;
  noti_pop._actorId = t_actorId;
  noti_pop.effectSound = effectSound;

  if (_data.isLuckyCard == "true") {
    noti_pop.isLuckyCard = "true";
  }

  // excel, joint
  if (excel && !!excel.isExcel) {
    noti_pop.excel = {
      _bjnick: excel.bjNickname || "",
      _plus: excel.plus,
      _sponsorId: excel.id || -1,
    };
  } else if (joint) {
    noti_pop.joint = { _bjnick: joint.bjNickname || "" };
  }

  noti_pop._soundId = Math.floor(Math.random() * 10000) + 1;

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
        .css("color", current_data.noti_font_color),
    );
    setTimeout(() => {
      noti_pop.append(noti_txt_chat);
    }, 1000);
  }

  if (rouletteObj) {
    noti_pop.rouletteObj = rouletteObj;
  } else {
    if (bgmObj) {
      noti_pop.bgmObj = bgmObj;
    }
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

function buildSignatureBgmPop(source, bgmObj) {
  //console.log("🔥 ~ buildSignatureBgmPop ~ source:", source);
  // 기존 팝업 DOM 복제 → noti-txt 문구, 색상, 애니메이션 스타일 그대로 유지
  const sigPop = source.clone();
  delete sigPop["rouletteObj"];
  delete sigPop["prevObject"];

  // 이미지만 bgmObj 이미지로 교체 (없으면 기본 이미지 유지)
  if (bgmObj) {
    sigPop
      .find(".noti-img img")
      .attr("src", bgmObj.imgurl || "../../images/img_gift_100.png");
  }

  // 속성 복사
  sigPop._nick = source._nick;
  sigPop._flexNum = source._flexNum;
  sigPop._mid = source._mid;
  sigPop._actorId = source._actorId;
  sigPop._soundId = Math.floor(Math.random() * 10000) + 1;
  sigPop.bgmObj = bgmObj;

  // _tts_msg: pushNotiPop의 setTimeout DOM 추가가 아직 반영 안 됐으므로 직접 추가
  if (source._tts_msg) {
    sigPop._tts_msg = source._tts_msg;
    var limitStr = parseInt(current_data.voice_limit_txtnum);
    var ttsText = limitStr
      ? source._tts_msg.substring(0, limitStr)
      : source._tts_msg;
    sigPop.append(
      $("<div>").append(
        $("<p>")
          .addClass("word")
          .text(ttsText)
          .css("color", current_data.noti_font_color),
      ),
    );
  }

  // excel / joint: visible_noti_pop에서 voice_str 조합에 사용됨 (line 995-1004)
  if (source.excel) {
    sigPop.excel = { ...source.excel };
    // excel roulette의 경우 unique한 sponsorId를 위해 - 값으로 변경
    sigPop.excel._sponsorId = source.excel._sponsorId || 0;
  } else if (source.joint) {
    sigPop.joint = { ...source.joint };
    // joint roulette의 경우 unique한 sponsorId를 위해 - 값으로 변경
    sigPop.joint._sponsorId = source.joint._sponsorId || 0;
  }

  // isRoulettSig = true로 설정
  sigPop.isRouletteSig = true;
  return sigPop;
}
var isVisibleNotiPop = false;

function visible_noti_pop() {
  if (!isVisibleNotiPop) {
    if (isPause) return;

    var t_pop = arr_pop_cue.shift();
    if (t_pop) {
      if (t_pop.rouletteObj) {
        // Roullette /////////////////////////////////////////
        var rouletteSoundObj = {};
        rouletteSoundObj.bgmurl = t_pop.rouletteObj.bgmData.url;
        rouletteSoundObj.volume = t_pop.rouletteObj.bgmData.volume;

        $(".rouletteContainer").css("display", "block");
        var textList = [];
        var persentList = [];
        var prevPer = 0;
        t_pop.rouletteObj.rouletteData.forEach((element) => {
          textList.push(element.name);
          var t_perset = Number(element.percent);
          persentList.push(t_perset + prevPer);
          prevPer = t_perset + prevPer;
        });

        var randomNum = Math.floor(Math.random() * 100) + 1;
        var selectindex = 0;
        for (var i = 0; i < persentList.length; i++) {
          var num = persentList[i];
          if (randomNum <= num) {
            selectindex = i;
            break;
          }
        }

        setTimeout(() => {
          addRouletteList(textList, selectindex);
        }, 500);

        const selectTitle = textList[selectindex];

        // * 룰렛의 경우 시그타입 체크 후 pop queue 에 시그 추가
        var selectedItem = t_pop.rouletteObj.rouletteData[selectindex];
        if (selectedItem) {
          const sig_num = selectedItem.name || -1;
          var bgmObj = getBgmObj(current_data.title_bgm_objs, sig_num);
          if (selectedItem && selectedItem.type === "signature" && bgmObj) {
            // 룰렛 팝업 종료 후 bgm 이미지+사운드가 바로 재생되도록 큐 앞에 삽입
            var sigPop = buildSignatureBgmPop(t_pop, bgmObj);
            arr_pop_cue.unshift(sigPop);
          }
        }

        // roulette 경우.
        if (t_pop.rouletteObj.isVoiceSound == "ON") {
          if (t_pop._tts_msg) {
            if (selectTitle)
              t_pop._tts_msg = selectTitle + "당첨입니다.!!  " + t_pop._tts_msg;

            play_bgm_sound(
              rouletteSoundObj,
              t_pop._soundId,
              t_pop._tts_msg,
              t_pop._actorId,
              (event) => {
                broadcastSigEvent(event, t_pop);
              },
            );
          } else {
            if (selectTitle) {
              play_bgm_sound(
                rouletteSoundObj,
                t_pop._soundId,
                selectTitle,
                null,
                (event) => {
                  broadcastSigEvent(event, t_pop);
                },
              );
            } else {
              play_bgm_sound(
                rouletteSoundObj,
                t_pop._soundId,
                null,
                null,
                (event) => {
                  broadcastSigEvent(event, t_pop);
                },
              );
            }
          }
        } else {
          play_bgm_sound(
            rouletteSoundObj,
            t_pop._soundId,
            null,
            null,
            (event) => {
              broadcastSigEvent(event, t_pop);
            },
          );
        }
      } else {
        // BGM /////////////////////////////////////////
        if (t_pop.bgmObj && t_pop.bgmObj.bgmurl) {
          if (t_pop.bgmObj.isTTSVoice) {
            if (t_pop._tts_msg) {
              // play_voice_sound(t_pop._tts_msg, t_pop._actorId)
              play_bgm_sound(
                t_pop.bgmObj,
                t_pop._soundId,
                t_pop._tts_msg,
                t_pop._actorId,
                (event) => {
                  broadcastSigEvent(event, t_pop);
                },
              );
            } else {
              play_bgm_sound(
                t_pop.bgmObj,
                t_pop._soundId,
                null,
                null,
                (event) => {
                  broadcastSigEvent(event, t_pop);
                },
              );
            }
          } else {
            play_bgm_sound(
              t_pop.bgmObj,
              t_pop._soundId,
              null,
              null,
              (event) => {
                broadcastSigEvent(event, t_pop);
              },
            );
          }
        } else {
          if (current_data.noti_type == "알림음") {
            play_eff_sound();
          } else if (current_data.noti_type == "알림음성") {
            const effectSound = t_pop.effectSound || "";
            var voice_str = current_data.noti_text
              .replace("{닉네임}", t_pop._nick)
              .replace("{개수}", numberWithCommas(t_pop._flexNum));

            voice_str += t_pop.joint
              ? current_data.noti_joint_text.replace(
                  "{닉네임}",
                  t_pop.joint._bjnick || "",
                )
              : "";
            voice_str += t_pop.excel
              ? current_data.noti_excel_text
                  .replace("{닉네임}", t_pop.excel._bjnick || "")
                  .replace("{플러스}", t_pop.excel._plus || "")
              : "";

            if (t_pop.isLuckyCard == "true") {
              voice_str = current_data_luckycard.noti_text
                .replace("{닉네임}", t_pop._nick)
                .replace("{개수}", numberWithCommas(t_pop._flexNum));
            }

            if (current_data.is_chat_voice == "on") {
              if (t_pop._tts_msg) {
                voice_str = voice_str + ".  " + t_pop._tts_msg;
              }
            }
            if (!effectSound) {
              play_voice_sound(
                voice_str,
                t_pop._soundId,
                t_pop._actorId,
                (event) => {
                  broadcastSigEvent(event, t_pop);
                },
              );
            } else {
              play_bgm_sound(
                {
                  bgmurl: effectSound,
                  volume: current_data.noti_sound_volume,
                },
                t_pop._soundId,
                voice_str,
                t_pop._actorId,
                (event) => {
                  broadcastSigEvent(event, t_pop);
                },
              );
            }
          }
        }
      }

      isVisibleNotiPop = true;

      $(".chat-list").append(t_pop);
      animateCSS(".chat-list", current_data.pop_fade_in_type, function () {});
      if (arr_pop_cue.length > 0) {
        timer_count = next_pop_stay_cnt;
      } else {
        timer_count = current_data.pop_visible_time;
      }

      //룰렛

      if (t_pop.rouletteObj) {
        // $(".rouletteContainer").css("display", "block");
        // var textList = [];
        // var persentList = [];
        // var prevPer = 0;
        // t_pop.rouletteObj.rouletteData.forEach(element=>{
        //     textList.push(element.name);
        //     var t_perset =  parseInt(element.percent)
        //     persentList.push(t_perset + prevPer);
        //     prevPer = t_perset + prevPer;
        // })
        //  var randomNum = Math.floor(Math.random() * 100) + 1;
        //  var selectindex = 0;
        //  for(var i=0; i<persentList.length; i++)
        //  {
        //     var num = persentList[i];
        //     if(randomNum <= num)
        //     {
        //         selectindex = i;
        //         break;
        //     }
        //  }
        // console.log("textList:", textList, "persentList:", persentList, "randomNum", randomNum, "selectindex:", selectindex )
        // setTimeout(()=>{
        //       addRouletteList(textList, selectindex);
        // },1000)
      }

      const myWorker = new Worker("../../pages/setInterval.js?123");
      myWorker.postMessage(1000);
      myWorker.onmessage = function (event) {
        timer_count--;
        /* console.log(
          `🌼🌸 timer_count: ${timer_count}, t_pop._soundId: ${t_pop._soundId}, currentSoundId: ${currentSoundId}, isSoundStay: ${isSoundStay}`,
        ); */
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
            function () {},
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

function addRouletteList(array_text, stopNumber) {
  console.log("🌼 addRouletteList", "stopNumber=", stopNumber);

  var rouletteTag = $("<div>").addClass("roulette");
  $(".roulette-area").append(rouletteTag);

  document.querySelector(".roulette").innerHTML =
    '<div class="roulette-inner"></div>';
  var innerElement = document.querySelector(".roulette-inner");

  for (var i in array_text) {
    innerElement.innerHTML += `<span class="item" data-value="${[i]}">${
      array_text[i]
    }</span>`;
  }
  rouletteStart(stopNumber, array_text.length);
}

function rouletteStart(stopNumber, num) {
  var t_duration;
  let t_speed = 3;

  if (num < 4) {
    t_duration = 9;
    t_speed = 2;
  } else if (num < 6) {
    t_duration = 6;
  } else if (num < 11) {
    t_duration = 5;
  } else if (num < 16) {
    t_duration = 3;
  } else if (num < 21) {
    t_duration = 1;
  } else {
    // item 수가 많아질수록 roulette.js 내부의 감속 거리(totalHeight 기반)가
    // 크게 늘어나므로, speed를 같이 올려서 전체 종료 시점을 사운드(약 9초)에 맞춘다.
    t_duration = 1;
    t_speed = Math.max(3, Math.ceil(num / 3.2));
  }

  console.log("roulette option:", {
    stopNumber,
    num,
    t_duration,
    t_speed,
  });
  var option = {
    speed: t_speed,
    duration: t_duration,
    stopImageNumber: stopNumber,
    // maxPlayCount : null, // x >= 0 or null
    // rollCount : 3, // x >= 0

    startCallback: function () {
      console.log("start");
    },
    slowDownCallback: function () {
      console.log("slowDown");
    },
    stopCallback: function ($stopElm) {
      console.log("stop");

      var currentItem = document.querySelector(`[data-value="${stopNumber}"]`);
      if (currentItem) currentItem.classList.add("current");
    },
  };
  console.log("duration:", option.duration);
  $(".roulette").roulette(option);
  $(".roulette").roulette("start");

  //$('div.roulette').roulette('start');
  // $('div.roulette').roulette('reset');
  // $('div.roulette').roulette('stop');
  // document.querySelector(`[data-value=${stopNumber}]`).add('test');
}

function set_txt_ani(node, delay) {
  //console.log("node :", node, delay)
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

function replaceString(src, params) {
  if (!src) return src;

  const keys = Object.keys(params);
  const repaceMap = {};
  (keys || []).map((key) => {
    repaceMap[`{${key}}`] = params[key];
  });

  repaceMap;
  let prevIdx = 0;
  let eIdx = 0;
  const regex = new RegExp(Object.keys(repaceMap).join("|"), "gi");
  const message = src.replace(regex, (matched, ...args) => {
    const [sIdx, source] = args;
    eIdx = sIdx + matched.length;

    prevIdx = eIdx;
    return repaceMap[matched];
  });
  return message;
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
  console.log("my_key", my_key);
  //alert("플랙스티비 도우미 실행합니다." + my_key);
  startSocket(my_key);
}

function showNotiFromSocket(data) {
  console.log("notice~~", data);
  // var _level;
  // if (data.level == "v") _level = "VIP";
  // else if (data.level == "m") _level = "매니저";
  // else if (data.level == "b") _level = "BJ";
  // else if (data.level == "n") _level = "일반";

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

    if (data.isluckycard == "Y") {
      arr_luckycard_cue.push(data);
      return;
    }

    //음성영상후원일때 bgm후원 안함
    if (data.isvsponsor && data.isvsponsor == "Y") {
      show_noti_popup(data);
    } else {
      var rouletteObj = getRouletteObj(current_roulette_array_data, flex_num);
      var bgmObj = getBgmObj(current_data.title_bgm_objs, flex_num);

      // console.log("🌼🌼🌼🌼rouletteObj=", rouletteObj, "bgmObj=", bgmObj);
      if (rouletteObj) {
        //   console.log("rouletteObj:222", rouletteObj)
        show_noti_popup_roulette(data, rouletteObj, bgmObj);
      } else {
        //var bgmObj = getBgmObj(current_data.title_bgm_objs, flex_num);
        if (bgmObj) {
          show_noti_popup(data, bgmObj);
        } else {
          show_noti_popup(data);
        }
      }
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
  } else if (data.type == "9") {
    //럭키카드 알림
    show_noti_popup_luckycard(data);
  } else {
    switch (data.type) {
      case CHALLENGELEX.DATA_TYPE.CREATE:
      case CHALLENGELEX.DATA_TYPE.FUND:
      case CHALLENGELEX.DATA_TYPE.START:
      case CHALLENGELEX.DATA_TYPE.CANCELED:
      case CHALLENGELEX.DATA_TYPE.SUCCESS:
      case CHALLENGELEX.DATA_TYPE.FAILED:
      case CHALLENGELEX.DATA_TYPE.EXTEND: {
        show_noti_popup_challengeLex(data);
        break;
      }
    }
  }
}

function setPause(pause) {
  isPause = pause;

  // if (!voice_sound) return;

  if (isPause) {
    //voice_sound._volume = voice_sound.getVolume();
    //voice_sound.setVolume(0)
    //voice_sound.pause();
  } else {
    //voice_sound.setVolume(voice_sound._volume || 80)
    //if (!voice_sound) voice_sound.play();
    visible_noti_pop();
  }
}

let socket = null;
function startSocket(_key) {
  socket = io(g_url_socket, {
    autoConnect: false,
    //secure: true,
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    // console.log("conneected key: ",_key , socket.connected); // true
    get_data(_key);
    get_roulette_data();
    get_luckycard_data();
    get_challengelex_data();
    socket.emit(
      "login",
      {
        // page: '<preset-key>'
        page: _key,
      },
      function (data) {
        //    console.log(data);
      },
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

  // FLEXTV 이벤트(엑셀방송): 룰렛을 '룰렛 후원 위젯에서' 돌리는 설정이면 도전 때 서버 결과로 룰렛을 띄운다
  socket.on("rocket", function (data) {
    showRocketRoulette(data);
  });

  socket.on("tranfer", function (data) {
    console.log("tranfer", data);
    show_luckycard_endpop(data);
  });

  socket.on("help", function (data) {
    console.log("help", data);
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
      get_data(my_key);
    } else if (_data.type == "3") {
      //추천
    } else if (_data.type == "4") {
      //하트
      //show_noti_popup("플렉스티비", parseInt(_data.msg), "", _data.mid)
      _data.type = "1";
      showNotiFromSocket(_data);
    }
  });

  socket.on("eventaction", function (data) {
    console.log("eventaction", data);
    if (data.type == "5") {
      //전체스킵
      console.log("전체스킵");
      arr_pop_cue = [];
    } else if (data.type == "6") {
      //부분스킵
      console.log("부분스킵");
      arr_pop_cue.shift();
    } else if (data.data.type == "111") {
      // pause
      setPause(true);
    } else if (data.data.type == "110") {
      // play
      setPause(false);
    }
  });

  socket.open();
}

function broadcastSigEvent(event, data) {
  const { excel, bgmObj, isRouletteSig = false } = data;

  // console.log("🔥 ~ broadcastSigEvent ~ event, excel:", event, excel);

  const isSetRouletteSig = !!isRouletteSig;
  if (isSetRouletteSig) {
    //return;
  }

  // 오류 발생 시 도우미 리모컨에는 엑셀시그 종료이벤트로 전달
  event = "error" === event ? "ended" : event;

  if (socket && excel) {
    socket.emit("broadcasting-excel-sig", {
      event,
      data: {
        ...Object.keys(excel || {}).reduce((acc, key) => {
          const k = key.substring(1);
          acc = { ...acc, [k]: excel[key] };
          return acc;
        }, {}),
      },
    });
  }
}

function show_luckycard_endpop(data) {
  for (let i = 0; i < arr_luckycard_cue.length; i++) {
    var cue_data = arr_luckycard_cue[i];
    if (cue_data.reqkey == data.reqkey) {
      show_noti_popup(cue_data);
      arr_luckycard_cue.splice(i, 1);
      break;
    }
  }
}

function createDefaultJson() {
  var jsonObj = {};

  jsonObj.isRouletteAvailable = "on";
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

  jsonObj.is_chat_voice = "on";

  jsonObj.text_fade_type = "flash";
  jsonObj.text_fade_dir = "역방향";

  jsonObj.pop_fade_in_type = "tada";
  jsonObj.pop_fade_out_type = "pulse";

  jsonObj.pop_visible_time = "10";
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

  jsonObj.title_bgm_objs = [];

  //console.log("createDefaultJson:", JSON.stringify(jsonObj));

  return jsonObj;

  // return JSON.stringify(jsonObj)
}

function get_data(_key) {
  //console.log("get_data  ~: ", _key)
  axios
    .get(g_url + "/pages/preset/" + _key)
    .then(function (response) {
      current_data = response.data;
      console.log("current_data 1:", current_data);

      if (current_data == "" || current_data == null) {
        current_data = createDefaultJson();
      }
      setDisplay(current_data);
    })
    .catch(function (error) {})
    .then(function () {
      // always executed
    });
}

function createDefaultJson_luckycard() {
  var jsonObj = {};

  jsonObj.isAvailable = "off";

  jsonObj.min_lex = "100";
  jsonObj.payback_time = "15";
  jsonObj.noti_text = "{닉네임}님 플렉스{개수}개 럭키카드를 등록하셨습니다.";
  jsonObj.noti_type = "알림음성";
  jsonObj.is_chat_voice = "on";

  jsonObj.nick_font_name = "ff-28";
  jsonObj.nick_font_bold = "off";
  jsonObj.nick_font_size = 16;
  jsonObj.nick_font_color = "#00FFF6";

  jsonObj.lex_font_name = "ff-28";
  jsonObj.lex_font_bold = "off";
  jsonObj.lex_font_size = 16;
  jsonObj.lex_font_color = "#ffffff";

  jsonObj.time_font_name = "ff-28";
  jsonObj.time_font_bold = "off";
  jsonObj.time_font_size = 16;
  jsonObj.time_font_color = "#ffffff";
  //  return JSON.stringify(jsonObj);

  return jsonObj;
}

function createDefaultJson_challengelex() {
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

  return jsonObj;
}

function get_luckycard_data() {
  //console.log("get_data  ~: ", _key)
  axios
    .get(g_url + "/pages/presetinfobypage?key=luckycard&page=" + my_key)
    .then(function (response) {
      current_data_luckycard = response.data;
      console.log("get_luckycard_data:~~", current_data_luckycard);
      if (!current_data_luckycard) {
        current_data_luckycard = createDefaultJson_luckycard();
      }

      // 재화변경에따른 데이터 변경
      if (needsCurrencyConversion(current_data_luckycard.noti_text)) {
        const noti_text = replaceCurrencyInNotiText(
          current_data_luckycard.noti_text,
        );
        current_data_luckycard.noti_text = noti_text;
      }

      // if (current_roulette_array_data.length > 0) {
      //       console.log("current_roulette_array_data 1:", current_roulette_array_data[0]);
      // }
    })
    .catch(function (error) {})
    .then(function () {
      // always executed
    });
}

function get_challengelex_data() {
  axios
    .get(g_url + "/pages/presetinfobypage?key=challenge-lex&page=" + my_key)
    .then(function (response) {
      current_data_challengelex = response.data;
      console.log("current_data_challengelex:~~", current_data_challengelex);
      if (!current_data_challengelex) {
        current_data_challengelex = createDefaultJson_challengelex();
      }
    })
    .catch(function (error) {})
    .then(function () {
      // always executed
    });
}

function get_roulette_data() {
  //console.log("get_data  ~: ", _key)
  axios
    .get(g_url + "/pages/presetinfobypage?key=info_roulette&page=" + my_key)
    .then(function (response) {
      current_roulette_array_data = response.data;
      //console.log("get_roulette_data:~~", response.data, 'llll',current_roulette_array_data.length)

      if (current_roulette_array_data.length > 0) {
        // 재화변경에따른 데이터 변경
        (current_roulette_array_data || []).forEach((e) => {
          if (needsCurrencyConversion(e.noti_text)) {
            const noti_text = replaceCurrencyInNotiText(e.noti_text);
            e.noti_text = noti_text;
          }
        });
        console.log(
          "current_roulette_array_data 1:",
          current_roulette_array_data[0],
        );
      }
    })
    .catch(function (error) {})
    .then(function () {
      // always executed
    });
}

function getRouletteObj(arr_roulette, t_lex) {
  var resultObj = null;
  if (
    current_data.isRouletteAvailable &&
    current_data.isRouletteAvailable == "off"
  ) {
    return resultObj;
  }
  console.log("getRouletteObj :", current_data, t_lex);
  if (arr_roulette) {
    for (
      var i = arr_roulette.length - 1;
      i >= 0;
      i-- // for(var i=0; i<arr_roulette.length; i++)
    ) {
      var t_obj = arr_roulette[i];
      if (parseInt(t_obj.lex) == t_lex) {
        console.log("t_obj.rouletteData", t_obj.rouletteData, t_obj);
        if (isCheckPer100(t_obj.rouletteData)) {
          resultObj = t_obj;
          break;
        }
      }
    }
  }
  return resultObj;
}

function isCheckPer100(arr_per) {
  var result = false;
  var checkPer = 0;

  arr_per.forEach((element) => {
    checkPer += Number(element.percent);
  });

  if (checkPer == 100) {
    result = true;
  } else {
    result = false;
  }

  console.log("isCheckPer100 :", checkPer, result);
  return result;
}

function getBgmObj(arr_bgm, t_lex) {
  var resultObj = null;
  if (arr_bgm) {
    for (var i = arr_bgm.length - 1; i >= 0; i--) {
      // console.log("element111:", t_lex, i)
      var t_obj = arr_bgm[i];
      if (
        parseInt(t_obj.startlex) <= t_lex &&
        parseInt(t_obj.endlex) >= t_lex &&
        t_obj.bgmData &&
        t_obj.bgmData.url
      ) {
        resultObj = {};
        resultObj.bgmurl = t_obj.bgmData ? t_obj.bgmData.url : null;
        resultObj.imgurl = t_obj.imgData ? t_obj.imgData.url : null;
        resultObj.volume = t_obj.bgmData
          ? parseInt(t_obj.bgmData.volume)
          : null;
        //resultObj.bgmId = Math.floor(Math.random() * 1000) + 1;

        resultObj.isTTSVoice = t_obj.isTTSVoice ? t_obj.isTTSVoice : false;

        // console.log("element222:", t_obj, t_lex);
        break;
      }
    }
  }
  return resultObj;
}

function setDisplay(_data) {
  // 재화변경에따른 데이터 변경
  if (needsCurrencyConversion(_data.noti_text)) {
    const noti_text = replaceCurrencyInNotiText(_data.noti_text);
    current_data.noti_text = noti_text;
  }

  timer_count = parseInt(_data.pop_visible_time);

  // console.log("setDisplay~~~~~~~~~~~~~~~~", _data, "timer_count:", timer_count);

  prev_set_transparency(_data.win_transparency);
  //set_prev_text_align(_data.text_align);

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

// function pre_set_chat_font_size(_size)
// {
//     $(".chat-list-area").css('font-size', _size + 'px');

// }

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

  // update css
  //var $prev_chat = $('.chat-list');

  $(".chat-list-area").css("font-size", fontSize + "px");
  $(".chat-list-area").css("text-shadow", "");

  //console.log("prev_chat_fontStroke~~~~~~~~~~~~: ", $prev_chat, strokeSize, strokeColor, fontSize )

  for (var angle = 0; angle < 2 * Math.PI; angle += 1 / strokeSize) {
    appendShadow(
      $(".chat-list-area"),
      Math.cos(angle) * strokeSize,
      Math.sin(angle) * strokeSize,
      strokeColor,
    );
  }
}

init_sound();
init();
