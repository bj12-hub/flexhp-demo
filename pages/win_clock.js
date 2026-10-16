console.log("win_clock_js")



var my_key;
var current_data;












function init() {

  // console.log( "init~~!" );
  var parts_ = window.location.pathname.split('/');
  my_key = parts_.pop();
  //console.log("my_key", my_key)
  //alert("플랙스티비 도우미 실행합니다." + my_key);
  startSocket(my_key);
}




function startSocket(_key) {
  //console.log("startSocket", _key)
  const socket = io(g_url_socket, {
    autoConnect: false,
    //secure: true,
    transports: ['websocket']
  });

  socket.on('connect', () => {
    //console.log("conneected key: ",_key , socket.connected); // true
    get_data(_key)
    socket.emit("login", {
      // page: 'e7bDqOGcHZ4mUKME1gV02zWIrw5vS6A9'
      page: _key
    }, function (data) {
      //console.log(data);
    })
  });

  socket.on('disconnect', function (data) {
    // console.log('disconnect~~~~~~~', data);
    // alert("통신이 끊어졌습니다");
  });
  socket.on('clock', function (data) {
    // console.log('event', data);
    var _level;
    if (data.level == "v") _level = "VIP";
    else if (data.level == "m") _level = "매니저";
    else if (data.level == "b") _level = "BJ";
    else if (data.level == "n") _level = "일반";

    //채팅
    //pushChat(_level, data.mid, data.nick, data.msg);
  });
  socket.on('notice', function (data) {
    // console.log('notice', data);
    var _level;
    if (data.level == "v") _level = "VIP";
    else if (data.level == "m") _level = "매니저";
    else if (data.level == "b") _level = "BJ";
    else if (data.level == "n") _level = "일반";

    if (data.type == "1") {
      //하트
      //show_noti_popup(data.mid, parseInt(data.msg))
    }
    else if (data.type == "2") {
      //추천

    }
    else if (data.type == "3") {
      //즐겨찾기

    }
    else if (data.type == "4") {
      //팬클럽

    }
    else if (data.type == "5") {
      //등급

    }
    else if (data.type == "6") {
      //입장

    }

  });
  socket.on('help', function (data) {
    // console.log('help', data);
  });

  socket.on('testMessage', function (data) {
    // console.log('testMessage', data);
    var _data = data.data;
    if (_data.type == "1") {
      //새로고침
      window.location.reload();
    }
    else if (_data.type == "2") {
      //초기화
      get_data(my_key);
    }
    else if (_data.type == "3") {
      //추천

    }
    else if (_data.type == "4") {
      //하트
      // show_noti_popup("플렉스티비", parseInt(_data.msg))
    }

  });

  socket.open();
}

function createDefaultJson() {

  var jsonObj = {}

  jsonObj.win_transparency = 0;

  jsonObj.clock_type = "테마1";

  jsonObj.clock_background_use = "사용안함";
  jsonObj.clock_background_color = "#ffffff";




  // console.log("createDefaultJson:", JSON.stringify(jsonObj))

  return jsonObj;

  // return JSON.stringify(jsonObj)

}

function get_data(_key) {
  //console.log("get_data  ~: ", _key)
  axios.get(g_url + "/pages/preset/" + _key)
    .then(function (response) {
      current_data = response.data;
      if (current_data == "" || current_data == null) {
        current_data = createDefaultJson();

      }
      setDisplay(current_data)

    })
    .catch(function (error) {

    })
    .then(function () {
      // always executed
    });
}



function clockType1() {

  var clockT1;
  clockT1 = $('.clock').FlipClock({
    clockFace: 'TwentyFourHourClock',
    autoStart: true
  });

}






function setDisplay(_data) {

  prev_set_transparency(_data.win_transparency);
  clockType1();
  select_clock_type(_data.clock_type);
  if (_data.clock_background_use == "배경색상") {
    $(".clock-area").css("background", _data.clock_background_color);
  }
  else if (_data.clock_background_use == "사용안함") {
    $(".clock-area").css("background", "");
  }

}

function select_clock_type(_str) {
  // console.log("select_clock_type :", _str)
  var classNmae;

  if (_str == "테마1") {
    classNmae = "clock-type-1";
  }
  else if (_str == "테마2") {
    classNmae = "clock-type-2";
  }
  else if (_str == "테마3") {
    classNmae = "clock-type-3";
  }

  if ($(".clock-area").hasClass("clock-type-1")) $(".clock-area").removeClass("clock-type-1");
  if ($(".clock-area").hasClass("clock-type-2")) $(".clock-area").removeClass("clock-type-2");
  if ($(".clock-area").hasClass("clock-type-3")) $(".clock-area").removeClass("clock-type-3");
  $(".clock-area").addClass(classNmae);
}



//////////////////////////////////
function prev_set_transparency(_temp) {
  // console.log("prev_set_transparency", _temp );
  _temp = 100 - _temp;
  var t_val = _temp * 0.01;
  $(".clock-area").css("opacity", t_val)
}




init()