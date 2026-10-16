axios.defaults.withCredentials = true;



var current_data_roulettes = [];
var current_date;


function createItem(r_data, index) {

  // console.log('createItem', r_data)

  var t_item = $('<div>').addClass('roulette-contents')

    .append(
      $('<div>').addClass('roulette-time')
        .append(
          $('<span>').text('최종설정')
        )
        .append(
          $('<span>').attr('id', 'roulette_date').addClass('roulette_date').text(current_date)
        )
    )

    .append(
      $('<div>').addClass('roulette-conts')
        .append(
          $('<div>').addClass('box')
            .append(
              $('<div>').addClass('tit').text('룰렛이름')
            )
            .append(
              $('<div>').addClass('txt').text(r_data.title)
            )
        )
        .append(
          $('<div>').addClass('box')
            .append(
              $('<div>').addClass('tit').text('후원개수')
            )
            .append(
              $('<div>').addClass('txt').addClass('text-right').text(r_data.lex)
                .append(
                  $('<p>').addClass('w-100').text('설정한 개수에 해당하는 후원을 받을 경우 알림팝업이 표시됩니다.')
                )
            )
            .append(
              $('<span>').addClass('ml-2').text('LEX')
            )
        )
        .append(
          $('<div>').addClass('box r-list')
            .append(
              $('<div>').addClass('tit').text('룰렛설정')
            )

            .append(
              $('<div>').addClass('roulette-list')
                .append(
                  $('<div>').addClass('head')
                    .append(
                      $('<span>').text('룰렛 이름')
                    )
                    .append(
                      $('<span>').text('룰렛 확률')
                    )
                )

                .append(
                  $('<div>').addClass('list').attr('id', 'list-area' + index)
                )

                .append(
                  $('<div>').addClass('list-total').attr('id', 'list-total' + index).text('합계')
                )
            )


        )

    )







  var totalPer = 0
  for (let i = 0; i < r_data.rouletteData.length; i++) {
    var rou_item = r_data.rouletteData[i];
    totalPer += Number(rou_item.percent)

    createRoulItem(rou_item, index, i)


    //console.log('rou_item:', rou_item, $('#list-area' + index))
  }


  setTimeout(() => {
    $('#list-total' + index)
      .append(
        $('<div>').addClass('ml-2').text(totalPer)
      )
  }, 1000)

  $('.roulette-view-area').append(t_item)
  $('.roulette-contents').eq(0).addClass('first');


  //console.log("t_item :", t_item)
}



function createRoulItem(data, index, i) {
  //console.log('createRoulItem:', data, index)
  var t_tag = $('<div>').addClass('inner-box')
    .append(
      $('<div>').addClass('name').text(data.name)
    )
    .append(
      $('<div>').addClass('per').text(data.percent)
    )



  setTimeout(function () {
    $('#list-area' + index).append(t_tag)
  }, 10 * i)
}


function setDisplay() {
  // console.log("setDisplay~~")
  $('#roulette_date').text(current_date);




  current_data_roulettes.forEach(function (element, index) {
    createItem(element, index)
  })



}






function init() {
  console.log("init~~")

  let query = window.location.search;
  let param = new URLSearchParams(query);
  let uid = param.get('uid');
  let name = param.get('name');
  $("#user_name").text(name);
  getRouletteData(uid);
}










// g_login_checking(login_callbackFn);

// function login_callbackFn(member)
// {
//   console.log("login_callbackFn", member )
//   init();

//   $("#user_name").text(member.NAME);
//   //$("#user_mid").text("("+ member.MID+")");
// }



function getRouletteData(uid) {

  axios.get(g_url + '/pages/presetinfo?type=info_roulette&uid=' + uid)
    .then(function (response) {
      let json = response.data;

      console.log('getRouletteData', response)
      //if (json.returnCode == 1) {
      //    if (json.resultMap.returnVal == 1) {


      var t_data = response.data;

      var r_data
      if (t_data.VAL) {

        try {
          r_data = JSON.parse(t_data.VAL)
        } catch (err) {
          r_data = [];
        }


      }
      else {
        r_data = [];
      }

      // console.log('r_data :',r_data);
      current_date = t_data.MODIFICATIONDATE;


      if (!r_data || r_data.length < 1 || r_data[0].rouletteData.length < 2) {
        current_data_roulettes = [];

        $('.roulette-none').css('display', 'block')


      }
      else {
        current_data_roulettes = r_data;

      }

      //console.log('current_data_roulettes:', current_data_roulettes)


      setDisplay()


      //  } else {
      //        alert(json.message);
      //   }
      //  } else {
      //      alert(json.message);
      //  }
    })
    .catch(function (error) { })
    .then(function () {
      // always executed
    });
}




init();