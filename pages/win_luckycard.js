axios.defaults.withCredentials = true;
var my_key;
var current_data;
var prev_font_name;
var arr_left_times = [];
var intervalId_leftTime;

function init() {
  $(".chat-list").empty();
  console.log("init~~!");
  var parts_ = window.location.pathname.split("/");
  my_key = parts_.pop();
  console.log("my_key", my_key);
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
    console.log("conneected key: ", _key, socket.connected); // true
    get_data(_key);
    socket.emit(
      "login",
      {
        // page: 'e7bDqOGcHZ4mUKME1gV02zWIrw5vS6A9'
        page: _key,
      },
      function (data) {
        console.log("login:", data);
      }
    );
  });

  socket.on("disconnect", function (data) {
    console.log("disconnect~~~~~~~", data);
    // alert("통신이 끊어졌습니다");
  });

  socket.on("notice", function (data) {
    console.log("notice", data);
    if (data.type == "9") {
      data.exp_time = data.expirationDate;
      if (!data.status) data.status = 3;
      createLuckyCardItem(data);
    }
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
    }
  });

  socket.on("eventaction", function (data) {
    console.log("eventaction", data);
    if (data.type == "10") {
      // cardLexList:[10, 20, 600, 0, 0]
      // errorMsg: null
      // errorVal:1
      // reqkey:461
      // selectCard:2
      // selectLex:20
      // type:"10"

      var numOfCard = data.cardLexList.length;
      var selectCard = data.selectCard;
      var winLex = Math.max(...data.cardLexList);

      var successIndex =
        data.cardLexList.findIndex((element) => element == winLex) + 1;
      var isSuccess;
      if (successIndex == selectCard) {
        isSuccess = "true";
      } else {
        isSuccess = "false";
      }
      var loseLex = data.selectLex;

      // 카드선택 모션시작
      var redirect_url = window.location.href;
      var ani_url =
        window.location.origin +
        "/luckycard/ani_luckybox.html?redirect=" +
        redirect_url +
        "&numOfCard=" +
        numOfCard +
        "&selectCard=" +
        selectCard +
        "&isSuccess=" +
        isSuccess +
        "&successIndex=" +
        successIndex +
        "&winLex=" +
        winLex +
        "&loseLex=" +
        loseLex +
        "&key=" +
        my_key +
        "&reqkey=" +
        data.reqkey;
      console.log("ani_url:", ani_url);
      window.location.href = ani_url;
    }
  });

  socket.open();
}

function get_data(_key) {
  console.log("get_data  ~: ", _key);
  axios
    .get(g_url + "/pages/preset/" + _key)
    .then(function (response) {
      current_data = response.data;
      console.log("current_data 1:", current_data);

      if (current_data == "" || current_data == null) {
        current_data = createDefaultJson();
      }

      // 재화변경에따른 데이터 변경
      if (needsCurrencyConversion(current_data.noti_text)) {
        const noti_text = replaceCurrencyInNotiText(current_data.noti_text);
        current_data.noti_text = noti_text;
      }

      getSponList_luckycard();
    })
    .catch(function (error) { })
    .then(function () {
      // always executed
    });
}

function getSponList_luckycard() {
  var urlParams = "limit=30";

  if (current_data.isAvailable == "on") {
    urlParams = urlParams + "&dataType=9&status=3&page=" + my_key;
  } else {
    return;
  }

  console.log("getSponList_luckycard");
  axios
    .get(g_url + "/pages/getmessagelist?" + urlParams)
    .then(function (response) {
      let json = response.data;
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
          console.log("json :~~~~~", json);
          json.resultMap.dataList.reverse();
          $.each(json.resultMap.dataList, function (index, data) {
            console.log("getSponList : ", index, data);
            setTimeout(() => {
              if (data.DATA_TYPE == "9") {
                let _lData = JSON.parse(data.DATA);
                _lData.reqkey = data.REQKEY;
                _lData.time = data.CREATIONDATE;
                _lData.exp_time = _lData.expirationDate;
                _lData.status = data.STATUS;
                createLuckyCardItem(_lData);
              }
            }, index * 200);
          });
        } else {
        }
      } else {
      }
    })
    .catch(function (error) { })
    .then(function () {
      // always executed
    });
}

intervalId_leftTime = setInterval(updateLeftSec, 1000);

function updateLeftSec() {
  //console.log('updateLeftSec')
  arr_left_times.forEach((element) => {
    $("#" + element.id).text(getLeftTime(element.exp_time));
  });
}

function createLuckyCardItem(data) {
  // if(!data.exp_time)data.exp_time = '2024-05-30 22:50:00'

  var end = moment.utc(data.exp_time).format("YYYY-MM-DD HH:mm:ss");
  var end_stillUtc = moment.utc(end).toDate();
  var end_local = moment(end_stillUtc).local().format("YYYY-MM-DD HH:mm:ss");

  var now = moment(new Date());
  var duration = moment.duration(now.diff(end_local));

  console.log("createLuckyCardItem: ", end_local, Math.sign(duration));

  if (data.status == "3" && Math.sign(duration) == -1) {
    //읽지않았거나 시간이 남아있음

    // console.log('createLuckyCardItem222: ', data)

    var nick_text = $("<span>")
      .addClass(current_data.nick_font_name)
      .addClass("nick-color")
      .css("font-size", current_data.nick_font_size + "px")
      .css("color", current_data.nick_font_color)
      .text(data.nick);
    var lex_text = $("<span>")
      .addClass(current_data.lex_font_name)
      .addClass("reward-color")
      .css("font-size", current_data.lex_font_size + "px")
      .css("color", current_data.lex_font_color)
      .text(numberWithCommas(parseInt(data.maxLex)));
    var time_text = $("<span>")
      .addClass(current_data.time_font_name)
      .addClass("time time-color")
      .css("font-size", current_data.time_font_size + "px")
      .css("color", current_data.time_font_color)
      .attr("id", "left-time-" + data.reqkey)
      .text(getLeftTime(data.exp_time));

    if (current_data.nick_font_bold == "on")
      nick_text.addClass("font-weight-bold");
    if (current_data.lex_font_bold == "on")
      lex_text.addClass("font-weight-bold");
    if (current_data.time_font_bold == "on")
      time_text.addClass("font-weight-bold");

    var luckycradItem = $("<li>")
      .addClass("card-li")
      .append(
        $("<div>")
          .addClass("card-txt alert")
          .append($("<p>").addClass("word").append(nick_text))
          .append(
            $("<p>")
              .addClass("word inner-time")
              .append(
                $("<span>")
                  .append(lex_text)
                  .append($("<span>").text("LEX 럭키카드"))
              )
              .append(time_text)
          )
      );

    let t_obj = {};
    t_obj.reqkey = data.reqkey;
    t_obj.id = "left-time-" + data.reqkey;
    t_obj.exp_time = data.exp_time;
    arr_left_times.push(t_obj);

    $(".chat-list").prepend(luckycradItem);
  }
}

function getLeftTime(endTime) {
  var result;
  var min_str;
  var sec_str;
  var hour_str;

  var end = moment.utc(endTime).format("YYYY-MM-DD HH:mm:ss");
  var end_stillUtc = moment.utc(end).toDate();
  var end_local = moment(end_stillUtc).local().format("YYYY-MM-DD HH:mm:ss");

  var now = moment(new Date());
  var duration = moment.duration(now.diff(end_local));

  if (Math.sign(duration) == -1) {
    hour_str = moment(duration.hours(), "hh").format("HH");
    min_str = moment(duration.minutes(), "mm").format("mm");
    sec_str = moment(duration.seconds(), "ss").format("ss");
    result =
      parseInt(hour_str) * 60 + parseInt(min_str) + "분 " + sec_str + "초";
  } else {
    result = "00분 00초";
  }

  // console.log('getLeftTime', result)
  return result;
}

function numberWithCommas(x) {
  if (x == null) return "";
  if (isNaN(x)) return 0;
  // return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");

  const parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

function createDefaultJson() {
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

init();
