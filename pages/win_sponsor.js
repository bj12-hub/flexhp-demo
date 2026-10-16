console.log("win_sponsor_js")

var my_key;
var current_data;
var prev_font_name;

var arr_test_users = [];
var sort_arr_test_users;

var arr_latest_gift = [];
var sort_arr_latest_gift;

function push_flex(_id, _nick, _flex, _imgUrl) {
  var _user = arr_test_users.find(function (element) {
    return element.mid == _id;
  })

  if (_user) {
    _user.arr_flex.push(parseInt(_flex));
  } else {
    var user = {}
    user.mid = _id;
    user.nick_name = _nick;
    user.arr_flex = [parseInt(_flex)];
    arr_test_users.push(user);
  }

  localStorage.setItem('users_' + my_key, JSON.stringify(arr_test_users));

  var output = localStorage.getItem('users_' + my_key);
  var arr = JSON.parse(output);

  var latest_temp = {};
  latest_temp.mid = _id;
  latest_temp.nick_name = _nick;
  latest_temp.flex = parseInt(_flex);
  latest_temp.imgUrl = _imgUrl;



  arr_latest_gift.unshift(latest_temp);

  localStorage.setItem('latest_gift_' + my_key, JSON.stringify(arr_latest_gift));

  set_board_type(current_data.board_type);
}

function init() {
  $(".gift-list-area").css("visibility", "hidden");
  console.log("init~~!");
  var parts_ = window.location.pathname.split('/');
  my_key = parts_.pop();

  var arr_users = localStorage.getItem('users_' + my_key);
  var arr_latest = localStorage.getItem('latest_gift_' + my_key);

  if (!arr_users) {
    arr_test_users = [];
  } else {
    arr_test_users = JSON.parse(arr_users);
  }

  if (!arr_latest) {
    arr_latest_gift = [];
  } else {
    arr_latest_gift = JSON.parse(arr_latest);
  }

  startSocket(my_key);
}




function startSocket(_key) {
  const socket = io(g_url_socket, {
    autoConnect: false,
    transports: ['websocket']
  });

  socket.on('connect', () => {
    get_data(_key)
    socket.emit("login", {
      page: _key
    }, function (data) {
      // console.log(data);
    })
  });

  socket.on('disconnect', function (data) {
    console.log('disconnect~~~~~~~', data);
  });

  socket.on('sponsor', function (data) {
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
      // 후원
      //push_flex(data.mid, data.nick, parseInt(data.msg), data.url)
      if (data.isluckycard && data.isluckycard == 'Y') {
        setTimeout(pushFlexFromSocket, 1000 * 20, data)
      }
      else {
        pushFlexFromSocket(data)
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
  socket.on('help', function (data) {
    // console.log('help', data);
    window.location.reload();
  });

  socket.on('testMessage', function (data) {
    //  console.log('testMessage', data);
    var _data = data.data;
    if (_data.type == "1") {
      //새로고침
      window.location.reload();
    } else if (_data.type == "2") {
      //초기화
      localStorage.removeItem('users_' + my_key);
      localStorage.removeItem('latest_gift_' + my_key);
      arr_test_users = [];
      arr_latest_gift = [];
      get_data(my_key);

      console.log("초기화")
    } else if (_data.type == "3") {
      //추천
    } else if (_data.type == "4") {
      //하트
      push_flex("_flex_tv", "플렉스티비", parseInt(_data.msg), '../../images/img_gift_100.png')
    }

  });

  socket.open();
}

function pushFlexFromSocket(data) {
  push_flex(data.mid, data.nick, parseInt(data.msg), data.url)
}

function createDefaultJson() {

  var jsonObj = {}

  jsonObj.win_transparency = 0;

  jsonObj.board_type = "메달";

  jsonObj.min_gift_num = 1;
  jsonObj.board_title_text = "오늘의 후원 순위";
  jsonObj.board_info_text = "{닉네임}님 {개수}개";

  jsonObj.num_of_sort = "off";
  jsonObj.num_add_plusmark = "on";
  jsonObj.gift_img_width = "200";

  jsonObj.board_font_color = "#ffffff";
  jsonObj.board_nick_color = "#ffffff";
  jsonObj.board_number_color = "#ffffff";

  jsonObj.font_name = "ff-01";
  jsonObj.font_bold = "off";
  jsonObj.font_size = 16;
  jsonObj.font_outline = 2;
  jsonObj.font_outline_color = "#000000";

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
    }).catch(function (error) {
    }).then(function () {
      // always executed
    });
}

function sort_latest_gift() {
  sort_arr_latest_gift = [...arr_latest_gift];
  sort_arr_latest_gift.sort(function (a, b) {
    if (parseInt(a.flex) > parseInt(b.flex)) {
      return -1;
    }
    if (parseInt(a.flex) < parseInt(b.flex)) {
      return 1;
    }
    return 0;
  });
}




function sort_ranking() {
  sort_arr_test_users = [...arr_test_users];
  sort_arr_test_users.sort(function (a, b) {
    if (arrSum(a.arr_flex) > arrSum(b.arr_flex)) {
      return -1;
    }
    if (arrSum(a.arr_flex) < arrSum(b.arr_flex)) {
      return 1;
    }
    return 0;
  });

}


function arrSum(arr) {
  var result = arr.reduce(function add(sum, currValue) {
    currValue = parseInt(currValue)
    return sum + currValue;
  }, 0);

  return result;
}


function draw_rank_board() {
  //console.log("~~~, draw_rank_board")
  sort_ranking()
  //setTimeout(function()
  // {
  // console.log("~~~, sort_arr_test_users", sort_arr_test_users)
  for (var i = 0; i < 10; i++) {
    if (sort_arr_test_users[i] && parseInt(current_data.min_gift_num) <= arrSum(sort_arr_test_users[i].arr_flex)) {
      //console.log("~~~, ",i , sort_arr_test_users[i].nick_name)
      $(".nick_rank_" + (i + 1)).text(sort_arr_test_users[i].nick_name);
      $(".rank_val_" + (i + 1)).text(numberWithCommas(arrSum(sort_arr_test_users[i].arr_flex)));
      $(".nick_rank_" + (i + 1)).parent().css("visibility", "visible");
    }
    else {
      $(".nick_rank_" + (i + 1)).text("");
      $(".rank_val_" + (i + 1)).text("");
      $(".nick_rank_" + (i + 1)).parent().css("visibility", "hidden");
    }

  }

  // },100)

  change_text_color_nick(current_data.board_nick_color)
  change_text_color_flex(current_data.board_number_color)
}

function draw_latest_gift() {
  $(".gift_count_board").empty();
  if ($(".board_type_2").hasClass("plus-unit")) {
    $(".board_type_2").removeClass("plus-unit")
  }

  if ($(".board_type_2").hasClass("flex-recent")) {
    $(".board_type_2").removeClass("flex-recent")
  }

  if ($(".board_type_2").hasClass("gift-img-box")) {
    $(".board_type_2").removeClass("gift-img-box")
  }

  $(".board_type_2").addClass("flex-recent");

  $.each(arr_latest_gift, function (index, data) {

    if (index < 12 && parseInt(current_data.min_gift_num) <= parseInt(data.flex)) {
      var temp_flex = $("<span>").addClass("value").addClass("color_value")
        .append($("<span>").addClass("flex").text(numberWithCommas(parseInt(data.flex))));


      var temp_nick = $("<span>").addClass("nick").addClass("color_nick").text(data.nick_name);



      var replace_tag = t_replaceAll(current_data.board_info_text, "{닉네임}", "{개수}", temp_nick, temp_flex)
      var temp_user = $("<li>").addClass("text").append(replace_tag);

      $(".gift_count_board").append(temp_user);

    }

  })

  $(".color_nick").css("color", current_data.board_nick_color);
  $(".color_value").css("color", current_data.board_number_color);
}



// function draw_best_score()
// {

//     $(".gift_count_board").empty();
//     if($(".board_type_2").hasClass("plus-unit"))
//     {
//         $(".board_type_2").removeClass("plus-unit")
//     }

//     if($(".board_type_2").hasClass("flex-recent"))
//     {
//         $(".board_type_2").removeClass("flex-recent")
//     }

//     if($(".board_type_2").hasClass("gift-img-box"))
//     {
//         $(".board_type_2").removeClass("gift-img-box")
//     }

//     sort_ranking();
//     var best_flex_user = sort_arr_test_users[0];

//     console.log("best_flex_user~~", best_flex_user)
//     if(best_flex_user.arr_flex.length > 0 && parseInt(current_data.min_gift_num) < arrSum (best_flex_user.arr_flex))
//     {
//         var temp_flexs = $("<span>").addClass("value").addClass("color_value")
//         .append($("<span>").addClass("flex").text(numberWithCommas( arrSum (best_flex_user.arr_flex))));


//         var temp_nick = $("<span>").addClass("nick").addClass("color_nick").text(best_flex_user.nick_name);



//         var replace_tag = t_replaceAll(current_data.board_info_text, "{닉네임}", "{개수}" , temp_nick , temp_flexs )
//         var temp_user = $("<li>").addClass("text").append(replace_tag);


//        console.log("sssssssssssssssss", best_flex_user.nick_name)

//     //  var temp_user = $("<li>").addClass("text")
//     //  .append($("<span>").addClass("nick").addClass("color_nick").text(data.nick_name))
//     //  .append($("<span>").addClass("color_title").text("님"))
//     //  .append(temp_flexs);

//         $(".gift_count_board").append(temp_user);
//         console.log("sssssssssssssssssgift_count_board ", best_flex_user.nick_name,  $(".gift_count_board"))

//     }

//     $(".color_nick").css("color", current_data.board_nick_color );
//     $(".color_value").css("color", current_data.board_number_color );

// }



function draw_best_score() {
  $(".gift_count_board").empty();
  if ($(".board_type_2").hasClass("plus-unit")) {
    $(".board_type_2").removeClass("plus-unit")
  }

  if ($(".board_type_2").hasClass("flex-recent")) {
    $(".board_type_2").removeClass("flex-recent")
  }

  if ($(".board_type_2").hasClass("gift-img-box")) {
    $(".board_type_2").removeClass("gift-img-box")
  }


  var temp_arr_user;
  if (true) {
    sort_ranking();
    temp_arr_user = sort_arr_test_users;
  } else {
    temp_arr_user = arr_test_users;
  }


  $.each(temp_arr_user, function (index, data) {

    if (data.arr_flex.length > 0 && parseInt(current_data.min_gift_num) <= arrSum(data.arr_flex)) {
      if (index == 0) {

        // console.log("index :", index)
        var temp_flexs = $("<span>").addClass("value").addClass("color_value")
          .append($("<span>").addClass("flex").text(numberWithCommas(arrSum(data.arr_flex))));


        var temp_nick = $("<span>").addClass("nick").addClass("color_nick").text(data.nick_name);



        var replace_tag = t_replaceAll(current_data.board_info_text, "{닉네임}", "{개수}", temp_nick, temp_flexs)
        var temp_user = $("<li>").addClass("text").append(replace_tag);

        //  var temp_user = $("<li>").addClass("text")
        //  .append($("<span>").addClass("nick").addClass("color_nick").text(data.nick_name))
        //  .append($("<span>").addClass("color_title").text("님"))
        //  .append(temp_flexs);

        $(".gift_count_board").append(temp_user);

      }


    }

  })

  $(".color_nick").css("color", current_data.board_nick_color);
  $(".color_value").css("color", current_data.board_number_color);

}




function draw_sum_board() {
  $(".gift_count_board").empty();
  if ($(".board_type_2").hasClass("plus-unit")) {
    $(".board_type_2").removeClass("plus-unit")
  }

  if ($(".board_type_2").hasClass("flex-recent")) {
    $(".board_type_2").removeClass("flex-recent")
  }

  if ($(".board_type_2").hasClass("gift-img-box")) {
    $(".board_type_2").removeClass("gift-img-box")
  }


  var temp_arr_user;
  if (current_data.num_of_sort == "on") {
    sort_ranking();
    temp_arr_user = sort_arr_test_users;
  }
  else {
    temp_arr_user = arr_test_users;
  }


  $.each(temp_arr_user, function (index, data) {

    if (data.arr_flex.length > 0 && parseInt(current_data.min_gift_num) <= arrSum(data.arr_flex)) {
      var temp_flexs = $("<span>").addClass("value").addClass("color_value")
        .append($("<span>").addClass("flex").text(numberWithCommas(arrSum(data.arr_flex))));


      var temp_nick = $("<span>").addClass("nick").addClass("color_nick").text(data.nick_name);



      var replace_tag = t_replaceAll(current_data.board_info_text, "{닉네임}", "{개수}", temp_nick, temp_flexs)
      var temp_user = $("<li>").addClass("text").append(replace_tag);




      //  var temp_user = $("<li>").addClass("text")
      //  .append($("<span>").addClass("nick").addClass("color_nick").text(data.nick_name))
      //  .append($("<span>").addClass("color_title").text("님"))
      //  .append(temp_flexs);

      $(".gift_count_board").append(temp_user);

    }

  })

  $(".color_nick").css("color", current_data.board_nick_color);
  $(".color_value").css("color", current_data.board_number_color);

}

function draw_count_board() {
  $(".gift_count_board").empty();
  if ($(".board_type_2").hasClass("flex-recent")) {
    $(".board_type_2").removeClass("flex-recent")
  }

  if ($(".board_type_2").hasClass("gift-img-box")) {
    $(".board_type_2").removeClass("gift-img-box")
  }


  var temp_arr_user;
  if (current_data.num_of_sort == "on") {
    sort_ranking();
    temp_arr_user = sort_arr_test_users;
  }
  else {
    temp_arr_user = arr_test_users;
  }

  set_plus_mark();


  $.each(temp_arr_user, function (index, data) {
    if (data.arr_flex.length > 0 && parseInt(current_data.min_gift_num) <= arrSum(data.arr_flex)) {
      var temp_flexs = $("<span>").addClass("value").addClass("color_value");

      $.each(data.arr_flex, function (index, data) {
        temp_flexs.append($("<span>").addClass("flex").text(numberWithCommas(data)))
      })

      var temp_nick = $("<span>").addClass("nick").addClass("color_nick").text(data.nick_name);


      var replace_tag = t_replaceAll(current_data.board_info_text, "{닉네임}", "{개수}", temp_nick, temp_flexs)
      var temp_user = $("<li>").addClass("text").append(replace_tag);

      $(".gift_count_board").append(temp_user);
    }

  })

  $(".color_nick").css("color", current_data.board_nick_color);
  $(".color_value").css("color", current_data.board_number_color);


}


function draw_latest_gift_img() {

  $(".gift_count_board").empty();
  if ($(".board_type_2").hasClass("plus-unit")) {
    $(".board_type_2").removeClass("plus-unit")
  }

  if ($(".board_type_2").hasClass("flex-recent")) {
    $(".board_type_2").removeClass("flex-recent")
  }

  if ($(".board_type_2").hasClass("gift-img-box")) {
    $(".board_type_2").removeClass("gift-img-box")
  }

  $(".board_type_2").addClass("gift-img-box");


  var temp_arr_latest;
  if (current_data.num_of_sort == "on") {
    sort_latest_gift();
    temp_arr_latest = sort_arr_latest_gift;
  }
  else {
    temp_arr_latest = arr_latest_gift;
  }
  console.log("draw_latest_gift_img   :  temp_arr_latest", temp_arr_latest)

  $.each(temp_arr_latest, function (index, data) {

    if (index < 20 && parseInt(current_data.min_gift_num) <= parseInt(data.flex)) {
      var temp_flex = $("<span>").addClass("value").addClass("color_value")
        .append($("<span>").addClass("flex").text(numberWithCommas(parseInt(data.flex))));

      var temp_nick = $("<span>").addClass("nick").addClass("color_nick").text(data.nick_name);

      var replace_tag = t_replaceAll(current_data.board_info_text, "{닉네임}", "{개수}", temp_nick, temp_flex)

      var temp_user = $("<li>").addClass("img_container").css("width", current_data.gift_img_width + "px")
        .append($("<img>").attr('src', "../../images/d-img.png").addClass("d-img"))
        .append($("<div>").addClass("img").css("background-image", `url(${data.imgUrl})`))
        .append($("<div>").addClass("text").append(replace_tag))


      $(".gift_count_board").append(temp_user);

    }
  })

  $(".color_nick").css("color", current_data.board_nick_color);
  $(".color_value").css("color", current_data.board_number_color);
}


function t_replaceAll(s_Txt, s_srcChr_1, s_srcChr_2, s_dstChr_1, s_dstChr_2) {
  var tmpValue = String(s_Txt);
  if (tmpValue.indexOf(s_srcChr_1) != -1) {

    var stripStr = tmpValue.split(s_srcChr_1);
    var joinStr = t_replace(stripStr[0], s_srcChr_2, s_dstChr_2);
    for (var m = 1; m < stripStr.length; m++) {
      //joinStr += s_dstChr_1 + t_replace(stripStr[m], s_srcChr_2, s_dstChr_2);
      var nick_tag = s_dstChr_1.clone();
      joinStr.append(nick_tag).append(t_replace(stripStr[m], s_srcChr_2, s_dstChr_2));
    }
    return (joinStr);
  }
  else {
    return t_replace(s_Txt, s_srcChr_2, s_dstChr_2);
  }
}

function t_replace(s_Txt, s_srcChr, s_dstChr) {
  var tmpValue = String(s_Txt);
  if (tmpValue.indexOf(s_srcChr) != -1) {
    var stripStr = tmpValue.split(s_srcChr);
    var joinStr = $("<span>").text(stripStr[0])

    for (var m = 1; m < stripStr.length; m++) {
      var value_tag = s_dstChr.clone();
      joinStr.append(value_tag).append($("<span>").text(stripStr[m]));
    }
    return (joinStr);
  } else {
    return $("<span>").text(s_Txt);
  }
}

function set_plus_mark() {
  if ($(".board_type_2").hasClass("plus-unit")) {
    $(".board_type_2").removeClass("plus-unit")
  }

  if (current_data.num_add_plusmark == "on") {
    $(".board_type_2").addClass("plus-unit");
  }
}

function setDisplay(_data) {
  console.log("setDisplay~~~~~~~~~~~~~~~~", _data);

  prev_set_transparency(_data.win_transparency);
  set_board_type(_data.board_type);
  $(".gift-tit").text(_data.board_title_text);
  $(".gift-list-area").css("color", _data.board_font_color)

  pre_set_chat_font(_data.font_name);
  pre_set_chat_font_bold(_data.font_bold);

  $(".gift-list-area").css("visibility", "visible");
}


function change_text_color_nick(_color) {
  $(".nick_rank_1").css("color", _color)
  $(".nick_rank_2").css("color", _color)
  $(".nick_rank_3").css("color", _color)
  $(".nick_rank_4").css("color", _color)
  $(".nick_rank_5").css("color", _color)
  $(".nick_rank_6").css("color", _color)
  $(".nick_rank_7").css("color", _color)
  $(".nick_rank_8").css("color", _color)
  $(".nick_rank_9").css("color", _color)
  $(".nick_rank_10").css("color", _color)
}

function change_text_color_flex(_color) {
  $(".rank_val_1").css("color", _color)
  $(".rank_val_2").css("color", _color)
  $(".rank_val_3").css("color", _color)
  $(".rank_val_4").css("color", _color)
  $(".rank_val_5").css("color", _color)
  $(".rank_val_6").css("color", _color)
  $(".rank_val_7").css("color", _color)
  $(".rank_val_8").css("color", _color)
  $(".rank_val_9").css("color", _color)
  $(".rank_val_10").css("color", _color)
}



function set_board_type(_type) {

  // console.log("set_board_type :", _type)
  prev_chat_fontStroke()
  if (_type == "메달") {

    $(".board_type_1").css("display", "block")
    $(".board_type_2").css("display", "none")
    draw_rank_board();
    if ($(".gift-list-area").hasClass("gift-rank")) {
      $(".gift-list-area").removeClass("gift-rank");
    }

  }
  else if (_type == "순위") {
    $(".board_type_1").css("display", "block")
    $(".board_type_2").css("display", "none")
    draw_rank_board();
    $(".gift-list-area").addClass("gift-rank");


  }
  else if (_type == "개수") {

    $(".board_type_1").css("display", "none")
    $(".board_type_2").css("display", "block")
    draw_count_board();

  }
  else if (_type == "합산") {
    $(".board_type_1").css("display", "none")
    $(".board_type_2").css("display", "block")
    draw_sum_board();


  }
  else if (_type == "최대개수") {
    $(".board_type_1").css("display", "none")
    $(".board_type_2").css("display", "block")
    draw_best_score();

  }
  else if (_type == "최근후원시청자") {

    $(".board_type_1").css("display", "none")
    $(".board_type_2").css("display", "block")
    draw_latest_gift();


  }
  else if (_type == "후원이미지") {

    $(".board_type_1").css("display", "none")
    $(".board_type_2").css("display", "block")
    draw_latest_gift_img();

  }
}

function prev_set_transparency(_temp) {
  // console.log("prev_set_transparency", _temp );
  _temp = 100 - _temp;
  var t_val = _temp * 0.01;
  $('.gift-list-area').css({ "opacity": t_val })
}

function pre_set_chat_font(_className) {
  if (prev_font_name) {
    if ($('.gift-list-area').hasClass(prev_font_name)) $('.gift-list-area').removeClass(prev_font_name);
  }
  $(".gift-list-area").addClass(_className);
  prev_font_name = _className;
}


// function pre_set_chat_font_size(_size)
// {
//     $(".chat-list-area").css('font-size', _size + 'px');

// }

function pre_set_chat_font_bold(_toggle) {
  if ($('.gift-list-area').hasClass("font-weight-bold")) $('.gift-list-area').removeClass("font-weight-bold");
  if (_toggle == "on") {
    $(".gift-list-area").addClass('font-weight-bold');

  } else {
    $(".gift-list-area").removeClass('font-weight-bold');
  }
}


function prev_chat_fontStroke() {

  var strokeSize = current_data.font_outline;
  var strokeColor = current_data.font_outline_color;
  var fontSize = current_data.font_size;

  fontSize = parseInt(fontSize)

  $(".r_tit").css('font-size', (fontSize + 8) + 'px');
  $(".r_1").css('font-size', (fontSize + 6) + 'px');
  $(".r_2").css('font-size', (fontSize + 4) + 'px');
  $(".r_3").css('font-size', (fontSize + 0) + 'px');
  $(".r_4").css('font-size', (fontSize - 2) + 'px');

  $(".gift-list-area").css('text-shadow', '');
  $(".gift_count_board").css('font-size', fontSize + 'px');


  for (var angle = 0; angle < 2 * Math.PI; angle += 1 / strokeSize) {
    appendShadow($(".gift-list-area"), Math.cos(angle) * strokeSize, Math.sin(angle) * strokeSize, strokeColor);
  }
}

init()
