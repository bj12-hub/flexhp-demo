axios.defaults.withCredentials = true;
var current_preset_id;
var current_preset_div;
var current_data;
//var arr_preset_list = [];
var current_preset_type = "sponsor"
var prev_font_name;


var test_user_1 = {};
test_user_1.nick_name = "플렉스 티비15";
test_user_1.arr_flex = [10000, 200, 10, 1];

var test_user_2 = {};
test_user_2.nick_name = "플렉스 티비2";
test_user_2.arr_flex = [200, 500, 5, 1];

var test_user_3 = {};
test_user_3.nick_name = "플렉스 티비8";
test_user_3.arr_flex = [1000, 200, 10, 1000];

var test_user_4 = {};
test_user_4.nick_name = "플렉스 티비4";
test_user_4.arr_flex = [3000];

var test_user_5 = {};
test_user_5.nick_name = "플렉스 티비7";
test_user_5.arr_flex = [200, 200, 500, 10];

var test_user_6 = {};
test_user_6.nick_name = "플렉스 티비3";
test_user_6.arr_flex = [600, 400, 10, 1];

var test_user_7 = {};
test_user_7.nick_name = "플렉스 티비50";
test_user_7.arr_flex = [800, 900, 40, 6];

var test_user_8 = {};
test_user_8.nick_name = "플렉스 티비44";
test_user_8.arr_flex = [2, 100, 2];

var test_user_9 = {};
test_user_9.nick_name = "플렉스 티비9";
test_user_9.arr_flex = [1, 10, 1];

var test_user_10 = {};
test_user_10.nick_name = "플렉스 티비";
test_user_10.arr_flex = [];

var arr_test_users = [];
arr_test_users.push(test_user_1);
arr_test_users.push(test_user_2);
arr_test_users.push(test_user_3);
arr_test_users.push(test_user_4);
arr_test_users.push(test_user_5);
arr_test_users.push(test_user_6);
arr_test_users.push(test_user_7);
arr_test_users.push(test_user_8);
arr_test_users.push(test_user_9);
arr_test_users.unshift(test_user_10)

var sort_arr_test_users;




var arr_latest_gift = [];

latest_gift_1 = {};
latest_gift_1.nick_name = "플렉스 티비9"
latest_gift_1.flex = "1"

latest_gift_2 = {};
latest_gift_2.nick_name = "플렉스 티비8"
latest_gift_2.flex = "1000"

latest_gift_3 = {};
latest_gift_3.nick_name = "플렉스 티비15"
latest_gift_3.flex = "10000"

latest_gift_4 = {};
latest_gift_4.nick_name = "플렉스 티비50"
latest_gift_4.flex = "40"

latest_gift_5 = {};
latest_gift_5.nick_name = "플렉스 티비3"
latest_gift_5.flex = "10"

latest_gift_6 = {};
latest_gift_6.nick_name = "플렉스 티비44"
latest_gift_6.flex = "100"

latest_gift_7 = {};
latest_gift_7.nick_name = "플렉스 티비7"
latest_gift_7.flex = "900"

arr_latest_gift.push(latest_gift_1);
arr_latest_gift.push(latest_gift_2);
arr_latest_gift.push(latest_gift_3);
arr_latest_gift.push(latest_gift_4);
arr_latest_gift.push(latest_gift_5);
arr_latest_gift.push(latest_gift_6);
arr_latest_gift.push(latest_gift_7);

var sort_arr_latest_gift;

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

  sort_ranking()

  //console.log("~~~ sort_arr_test_users, ", sort_arr_test_users)

  for (var i = 0; i < 10; i++) {
    if (sort_arr_test_users[i] && parseInt(current_data.min_gift_num) < arrSum(sort_arr_test_users[i].arr_flex)) {

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
}




var myModal = new bootstrap.Modal(document.getElementById('setupCompleted'), {
  keyboard: false
})

var myModal2 = new bootstrap.Modal(document.getElementById('setupCompleted2'), {
  keyboard: false
})



function init() {

  $(".gift-list-area").css("visibility", "hidden");
  if (localStorage.getItem("preset_id_sponsor") == null) {
  }
  else {
    current_preset_id = localStorage.getItem("preset_id_sponsor");
  }
  addEvent();
  $('.preset-list-box').empty();
  setTimeout(getPresetList, 100);
}






function selectPresetBtn(t_div) {
  current_preset_id = t_div.attr('id');
  current_preset_div = t_div;
  localStorage.setItem("preset_id_sponsor", current_preset_id)
  t_div.addClass("selected").siblings().removeClass('selected');
  $('#urlCopy').val(current_preset_div.attr('url'))


  //console.log("selectPresetBtn :" , current_preset_div.attr('data_list'))
  current_data = JSON.parse(current_preset_div.attr('data_list'));
  setDisplay(current_data);
}

function reset_setting() {
  var defult_data = createDefaultJson();
  current_preset_div.attr('data_list', defult_data)
  current_data = JSON.parse(current_preset_div.attr('data_list'));
  setDisplay(current_data);
  savePreset(current_preset_div, current_data);
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


  //console.log("createDefaultJson:", JSON.stringify(jsonObj))

  return JSON.stringify(jsonObj)

}

function addEvent() {
  addEventPreset();
  //console.log("goaljs  addEvent ~~~~~~~~~~~~~")


  $("input[name=wordType]").on("input", function () {
    current_data.board_type = $(this).val();
    set_board_type(current_data.board_type);
  })


  $("#input_text_min_gift_num").on("change", function () {
    current_data.min_gift_num = $(this).val();

    if (current_data.board_type == "메달" || current_data.board_type == "순위") {
      draw_rank_board();
    }
    if (current_data.board_type == "개수") {
      draw_count_board();
    }
    else if (current_data.board_type == "합산") {
      draw_sum_board();
    }
    else if (current_data.board_type == "최대개수") {
      draw_best_score();
    }
    else if (current_data.board_type == "최근후원시청자") {
      draw_latest_gift();
    }
    else if (current_data.board_type == "후원이미지") {
      draw_latest_gift_img()
    }

  })





  $("#input_text_min_gift_num").on("keyup", function () {
    $(this).val($(this).val().replace(/[^0-9]/g, ""));
  });


  $(".num_of_sort").on("change", function () {
    current_data.num_of_sort = $(this).prop('checked') ? "on" : "off";

    if (current_data.board_type == "개수") {
      draw_count_board();
    }
    else if (current_data.board_type == "합산") {
      draw_sum_board();
    }
    else if (current_data.board_type == "후원이미지") {
      draw_latest_gift_img();
    }

  })

  $("#chk3_plus_mark").on("change", function () {
    current_data.num_add_plusmark = $(this).prop('checked') ? "on" : "off";
    set_plus_mark();

  })



  $("#notiTxtArea1").on("change", function () {

    if (current_data.board_type == "메달" || current_data.board_type == "순위") {
      current_data.board_title_text = $(this).val();
      $(".gift-tit").text(current_data.board_title_text);
    }
    else {
      current_data.board_info_text = $(this).val();
      if (current_data.board_type == "개수") draw_count_board();
      else if (current_data.board_type == "합산") draw_sum_board();
      else if (current_data.board_type == "최대개수") draw_best_score();
      else if (current_data.board_type == "최근후원시청자") draw_latest_gift();
      else if (current_data.board_type == "후원이미지") draw_latest_gift_img();

    }
  })



  $("#chk7_img_width").on("change", function () {
    current_data.gift_img_width = $(this).val();
    draw_latest_gift_img();
  })



  $("#chk7_img_width").on("keyup", function () {
    $(this).val($(this).val().replace(/[^0-9]/g, ""));
  });


  ///////////////////////////////////////////////////
  $("#btn_save").on("click", function () {
    // console.log("btn_save~~~~~~~~~~~~~~~~~~~ : ", current_data)
    savePreset(current_preset_div, current_data)
  })


  $("#btn_reset").on("click", function () {
    //  console.log("btn_reset")
    reset_setting();
  })


  $("#val_flex").on("keyup", function () {
    $(this).val($(this).val().replace(/[^0-9]/g, ""));
  });

  $("#btn_flex").on("click", function () {
    //   console.log("btn_flex");

    var numOfFlex = $('#val_flex').val();
    test_user_10.arr_flex.push(numOfFlex);

    testmessage_to_server("4", numOfFlex);



    var latest_test = {};
    latest_test.nick_name = "플렉스 티비"
    latest_test.flex = numOfFlex;

    arr_latest_gift.unshift(latest_test);
    //draw_rank_board();

    set_board_type(current_data.board_type);

  })

  $("#btn_recommend").on("click", function () {
    //   console.log("btn_recommend ")

  })


  $("#btn_win_reset").on("click", function () {
    //   console.log("btn_win_reset")
    //서버로 알린다.
    myModal2.show();
    //testmessage_to_server("2" , "");
  })

  $("#btn_reset_ok").on("click", function () {
    console.log("btn_reset_ok")
    //서버로 알린다.
    //  myModal2.show();
    testmessage_to_server("2", "");
  })



  $("#btn_win_reload").on("click", function () {
    testmessage_to_server("1", "");
    //서버로 알린다.
  })

  $("#btn_open_pop").on("click", function () {
    var url = $("#urlCopy").val()
    //   console.log("btn_open_pop url", url);
    openWin(url, "플렉스", 500, 500)
    //  window.open(url,"new","width=500,height=500");
  })

}


function testmessage_to_server(_type, _msg) {
  var param = {}
  param.type = "sponsor";
  param.data = {};
  param.data.type = _type;
  param.data.msg = _msg;
  $('.spinner-border').css("display", "block");
  axios.post(g_url + '/preset/testmessage', param)
    .then(function (response) {
      let json = response.data;
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
          // console.log("서버로 성공적으로 보냄")
          $('.spinner-border').css("display", "none");
        }
        else {
          alert(json.message);
        }
      }
      else {
        alert(json.message);
      }
    })
    .catch(function (error) {
    })
    .then(function () {
      // always executed
    });
}




function set_plus_mark() {
  if ($(".board_type_2").hasClass("plus-unit")) {
    $(".board_type_2").removeClass("plus-unit")
  }

  if (current_data.num_add_plusmark == "on") {
    $(".board_type_2").addClass("plus-unit");
  }
  else {

  }
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




  $.each(temp_arr_latest, function (index, data) {

    if (index < 20 && parseInt(current_data.min_gift_num) < parseInt(data.flex)) {
      var temp_flex = $("<span>").addClass("value").addClass("color_value")
        .append($("<span>").addClass("flex").text(numberWithCommas(parseInt(data.flex))));


      var temp_nick = $("<span>").addClass("nick").addClass("color_nick").text(data.nick_name);



      var replace_tag = t_replaceAll(current_data.board_info_text, "{닉네임}", "{개수}", temp_nick, temp_flex)
      //  var temp_user = $("<li>").addClass("text").append(replace_tag);







      var temp_user = $("<li>").addClass("img_container").css("width", current_data.gift_img_width + "px")
        .append($("<img>").attr('src', "../images/d-img.png").addClass("d-img"))
        .append($("<div>").addClass("img").css("background-image", "url(../images/img_gift_100.png)"))
        .append($("<div>").addClass("text").append(replace_tag))


      $(".gift_count_board").append(temp_user);

    }
  })

  $(".color_nick").css("color", current_data.board_nick_color);
  $(".color_value").css("color", current_data.board_number_color);

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

    if (index < 12 && parseInt(current_data.min_gift_num) < parseInt(data.flex)) {
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

  sort_ranking();
  var best_flex_user = sort_arr_test_users[0];

  if (best_flex_user.arr_flex.length > 0 && parseInt(current_data.min_gift_num) < arrSum(best_flex_user.arr_flex)) {
    var temp_flexs = $("<span>").addClass("value").addClass("color_value")
      .append($("<span>").addClass("flex").text(numberWithCommas(arrSum(best_flex_user.arr_flex))));


    var temp_nick = $("<span>").addClass("nick").addClass("color_nick").text(best_flex_user.nick_name);



    var replace_tag = t_replaceAll(current_data.board_info_text, "{닉네임}", "{개수}", temp_nick, temp_flexs)
    var temp_user = $("<li>").addClass("text").append(replace_tag);




    //  var temp_user = $("<li>").addClass("text")
    //  .append($("<span>").addClass("nick").addClass("color_nick").text(data.nick_name))
    //  .append($("<span>").addClass("color_title").text("님"))
    //  .append(temp_flexs);

    $(".gift_count_board").append(temp_user);

  }

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

    if (data.arr_flex.length > 0 && parseInt(current_data.min_gift_num) < arrSum(data.arr_flex)) {
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
    if (data.arr_flex.length > 0 && parseInt(current_data.min_gift_num) < arrSum(data.arr_flex)) {
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
    // var joinStr = stripStr[0];
    for (var m = 1; m < stripStr.length; m++) {
      //joinStr += s_dstChr + stripStr[m];
      var value_tag = s_dstChr.clone();
      joinStr.append(value_tag).append($("<span>").text(stripStr[m]));
      //joinStr.append(value_tag).append( stripStr[m]);

    }
    return (joinStr);
  }
  else {
    return $("<span>").text(s_Txt);
  }
}




function set_board_type(_type) {

  //console.log("set_board_type :", _type)
  prev_chat_fontStroke()
  if (_type == "메달") {

    $(".board_type_1").css("display", "block")
    $(".board_type_2").css("display", "none")
    draw_rank_board();
    $(".my-3").css("display", "none");
    $(".my-4").css("display", "none");
    $(".my-7").css("display", "none");
    if ($(".gift-list-area").hasClass("gift-rank")) {
      $(".gift-list-area").removeClass("gift-rank");
    }


    $("#notiTxtArea1").val(current_data.board_title_text);

  }
  else if (_type == "순위") {
    $(".board_type_1").css("display", "block")
    $(".board_type_2").css("display", "none")
    draw_rank_board();
    $(".my-3").css("display", "none");
    $(".my-4").css("display", "none");
    $(".my-7").css("display", "none");
    $(".gift-list-area").addClass("gift-rank");

    $("#notiTxtArea1").val(current_data.board_title_text);
  }
  else if (_type == "개수") {

    $(".board_type_1").css("display", "none")
    $(".board_type_2").css("display", "block")
    draw_count_board();
    $(".my-3").css("display", "block");
    $(".my-4").css("display", "none");
    $(".my-7").css("display", "none");



    if (current_data.num_of_sort == "on") $("#chk3_num_sort").prop("checked", true);
    else $("#chk3_num_sort").prop("checked", false);

    if (current_data.num_add_plusmark == "on") $("#chk3_plus_mark").prop("checked", true);
    else $("#chk3_plus_mark").prop("checked", false);

    $("#notiTxtArea1").val(current_data.board_info_text);




  }
  else if (_type == "합산") {
    $(".board_type_1").css("display", "none")
    $(".board_type_2").css("display", "block")
    draw_sum_board();
    $(".my-3").css("display", "none");
    $(".my-4").css("display", "block");
    $(".my-7").css("display", "none");

    if (current_data.num_of_sort == "on") $("#chk4_num_sort").prop("checked", true);
    else $("#chk4_num_sort").prop("checked", false);

    $("#notiTxtArea1").val(current_data.board_info_text);

  }
  else if (_type == "최대개수") {
    $(".board_type_1").css("display", "none")
    $(".board_type_2").css("display", "block")
    draw_best_score();
    $(".my-3").css("display", "none");
    $(".my-4").css("display", "none");
    $(".my-7").css("display", "none");

    $("#notiTxtArea1").val(current_data.board_info_text);

  }
  else if (_type == "최근후원시청자") {

    $(".board_type_1").css("display", "none")
    $(".board_type_2").css("display", "block")
    draw_latest_gift();
    $(".my-3").css("display", "none");
    $(".my-4").css("display", "none");
    $(".my-7").css("display", "none");

    $("#notiTxtArea1").val(current_data.board_info_text);
  }
  else if (_type == "후원이미지") {

    $(".board_type_1").css("display", "none")
    $(".board_type_2").css("display", "block")
    draw_latest_gift_img();
    $(".my-3").css("display", "none");
    $(".my-4").css("display", "none");
    $(".my-7").css("display", "block");
    if (current_data.num_of_sort == "on") $("#chk7_num_sort").prop("checked", true);
    else $("#chk7_num_sort").prop("checked", false);






    $("#chk7_img_width").val(current_data.gift_img_width)
    $("#notiTxtArea1").val(current_data.board_info_text);

  }
}

function setDisplay(_data) {

  // console.log("setDisplay~~")
  test_user_10.arr_flex = [];


  var chatOpt = document.getElementById('sliderChatOpacity');
  chatOpt.noUiSlider.set(_data.win_transparency);
  prev_set_transparency(_data.win_transparency);

  $("input[name=wordType][value=" + _data.board_type + "]").prop("checked", true);
  set_board_type(_data.board_type);


  $("#input_text_min_gift_num").val(_data.min_gift_num);
  // $("#notiTxtArea1").val(_data.board_title_text);

  $(".gift-tit").text(_data.board_title_text);


  setTextColor($("#colorPicker_font_color"), _data.board_font_color);
  $(".gift-list-area").css("color", _data.board_font_color)


  setTextColor($("#colorPicker_nick_color"), _data.board_nick_color);
  change_text_color_nick(_data.board_nick_color)

  setTextColor($("#colorPicker_number_color"), _data.board_number_color);
  change_text_color_flex(_data.board_number_color)


  //////////////////////폰트//////////////////////////////////////
  var ff_str = get_font_str_from_value(_data.font_name);
  $('.btn-select').html(ff_str);
  $('.btn-select').attr('value', _data.font_name);
  pre_set_chat_font(_data.font_name);



  var isFontBold = (_data.font_bold == "on")
  $("#fontBold").prop('checked', isFontBold);
  if (isFontBold) {
    $(".goal-bar-area").addClass('font-weight-bold');
    $('.font-preview').addClass('font-preview-bold');
  }
  else {
    $(".goal-bar-area").removeClass('font-weight-bold');
    $('.font-preview').removeClass('font-preview-bold');
  }


  var sliderFontSize = document.getElementById('sliderFontSize');
  sliderFontSize.noUiSlider.set(_data.font_size);
  pre_set_chat_font_size(_data.font_size)


  var sliderFontBorder = document.getElementById('sliderFontBorder');
  sliderFontBorder.noUiSlider.set(_data.font_outline);


  //console.log("_data.font_outline_color :~~~", _data.font_outline_color)
  $('#fontStrokeColor').val(_data.font_outline_color);
  $("#fontStrokeColor").spectrum({
    color: _data.font_outline_color,
    showInput: true,
    showAlpha: false,
    className: "color-picker",
    showInitial: true,
    preferredFormat: "hex",
    chooseText: "선택",
    cancelText: "취소",
    change: function () {
      fontStroke();
      prev_chat_fontStroke();
      if (current_data) {
        current_data.font_outline_color = $('#fontStrokeColor').val();
      }

    }
  });
  fontStroke();
  prev_chat_fontStroke();

  $(".gift-list-area").css("visibility", "visible");
  $('.spinner-border').css("display", "none");
}






////////////////////////////////////////////////////////////////////핸들
function prev_handle_transparency(_temp) {
  if (current_data) current_data.win_transparency = _temp;
  _temp = 100 - _temp;
  var t_val = _temp * 0.01;
  $(".gift-list-area").css("opacity", t_val)
}


function pre_handle_chat_font(_className) {

  // console.log("pre_handle_chat_font@@@", _className)
  if (current_data) current_data.font_name = _className;

  $(".gift-list-area").removeClass(prev_font_name);
  $('.font-preview').removeClass(prev_font_name);

  $(".gift-list-area").addClass(_className);
  $('.font-preview').addClass(_className);

  prev_font_name = _className;

}

function pre_handle_chat_font_bold(_flag) {
  if (current_data) {
    if (_flag) {
      current_data.font_bold = "on";
      $(".gift-list-area").addClass('font-weight-bold');
    }
    else {
      current_data.font_bold = "off";
      $(".gift-list-area").removeClass('font-weight-bold');
    }
  }
}

function pre_handle_chat_font_size() {
  var fontSize = $('#fontSizeVal').val();
  if (current_data) {
    current_data.font_size = fontSize;
    prev_chat_fontStroke();
  }
}

function pre_handle_chat_font_outline() {
  var fontborderVal = $('#fontBorderVal').val();
  if (current_data) {
    current_data.font_outline = fontborderVal;
    prev_chat_fontStroke();
  }
}




function setTextColor(_target, _color) {

  _target.val(_color);
  _target.spectrum({
    color: _color,
    showInput: true,
    showAlpha: false,
    className: "color-picker",
    showInitial: true,
    preferredFormat: "hex",
    chooseText: "선택",
    cancelText: "취소",
    change: function (e) {
      // console.log(" $(this) :",  $(this), e);
      switch ($(this).attr("id")) {
        case "colorPicker_font_color":
          current_data.board_font_color = $(this).val();
          $(".gift-list-area").css("color", current_data.board_font_color)

          break;
        case "colorPicker_nick_color":
          current_data.board_nick_color = $(this).val();
          change_text_color_nick(current_data.board_nick_color);

          break;
        case "colorPicker_number_color":
          current_data.board_number_color = $(this).val();
          change_text_color_flex(current_data.board_number_color)
          break;
      }

    },
    // move: function(color){
    //     console.log('background-color~~~',color.toHex8String());
    // }
  });
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


  $(".color_nick").css("color", _color)


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

  $(".color_value").css("color", _color)
}



////////////////////////////////////////////////////////////////////셋팅
//font Stroke
function prev_chat_fontStroke() {
  // get form values
  //var fontFamily = $('#fontFamily').val();
  //var fontColor = $('#fontColorPicker').val();

  var strokeSize = $('#fontBorderVal').val();
  strokeColor = $('#fontStrokeColor').val();
  fontSize = $('#fontSizeVal').val();
  // update css
  //var $prev_chat = $(".rank_grop");
  fontSize = parseInt(fontSize);


  if (current_data.board_type == "메달" || current_data.board_type == "순위") {
    $(".r_tit").css('font-size', (fontSize + 8) + 'px');
    $(".r_1").css('font-size', (fontSize + 6) + 'px');
    $(".r_2").css('font-size', (fontSize + 4) + 'px');
    $(".r_3").css('font-size', (fontSize + 0) + 'px');
    $(".r_4").css('font-size', (fontSize - 2) + 'px');
  }
  else {

    $(".gift_count_board").css('font-size', (fontSize) + 'px');




  }



  //  $(".rank").css('font-size', fontSize + 'px');
  //  $(".val").css('font-size', fontSize + 'px');
  //  $(".nick").css('font-size', fontSize + 'px');
  // $(".gift-tit").css('font-size', (fontSize +1) + 'px');


  $(".gift-list-area").css('text-shadow', '');

  //console.log("prev_chat_fontStroke~~~~~~~~~~~~: ", $prev_chat, strokeSize, strokeColor, fontSize )

  for (var angle = 0; angle < 2 * Math.PI; angle += 1 / strokeSize) {
    appendShadow($(".gift-list-area"), Math.cos(angle) * strokeSize, Math.sin(angle) * strokeSize, strokeColor);
  }
}




function pre_set_chat_font_size(_size) {
  _size = parseInt(_size)
  // console.log("pre_set_chat_font_size", _size)

  // $(".rank").css('font-size', _size + 'px');
  // $(".val").css('font-size', _size + 'px');
  // $(".nick").css('font-size', _size + 'px');
  // $(".gift-tit").css('font-size', (_size + 1) + 'px');

  // $(".r_tit").css('font-size', (_size + 4) + 'px');
  // $(".r_1").css('font-size', (_size + 2) + 'px');
  // $(".r_2").css('font-size', (_size + 1) + 'px');
  // $(".r_3").css('font-size', (_size + 0) + 'px');
  // $(".r_4").css('font-size', (_size - 1) + 'px');




}


function pre_set_chat_font_bold(_toggle) {
  if (_toggle == "on") {
    $(".gift-list-area").addClass('font-weight-bold');
    //    $(".board_type_1").addClass('font-weight-bold');
    //    $(".board_type_2").addClass('font-weight-bold');
    $('.font-preview').addClass('font-preview-bold');
  } else {
    $(".gift-list-area").removeClass('font-weight-bold');
    //    $(".board_type_1").removeClass('font-weight-bold');
    //    $(".board_type_2").addClass('font-weight-bold');
    $('.font-preview').removeClass('font-preview-bold');
  }
}

function pre_set_chat_font(_className) {

  console.log("pre_set_chat_font~~@@", _className)
  $(".gift-list-area").addClass(_className);


  // $(".board_type_1").addClass(_className);
  // $(".board_type_2").addClass(_className);


  $('.font-preview').addClass(_className);
  prev_font_name = _className;
}


function prev_set_transparency(_temp) {
  //console.log("prev_set_transparency", _temp );
  _temp = 100 - _temp;
  var t_val = _temp * 0.01;
  $(".gift-list-area").css("opacity", t_val)
}



g_login_checking(login_callbackFn);
function login_callbackFn(member) {
  //console.log("login_callbackFn", member )
  init();
  if (member.IMG_URL && member.IMG_URL != "") {
    //console.log("~~~~~~~~~~~~", member.IMG_URL)
    $("#user_pic").find("img").attr("src", member.IMG_URL);
  }

  $("#user_name").text(member.NAME);
  $("#user_mid").text("(" + member.MID + ")");
}
