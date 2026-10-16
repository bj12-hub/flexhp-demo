axios.defaults.withCredentials = true;
var my_key;
var current_data;
var winningOptionIds;
var isGameing = false;
var t_bjId;
var t_uId;
var isGameVisible = false;
const imgBox = document.getElementById('banner');


function addListenerEndgame(){
  console.log('addListener~~~~!!')
  window.ftr.onEnd = () => { 
    console.log("luckyrace onEnd!!");
    callGameOver();
  }
}

async function callGameOver() {
  const url = `${g_url}/callback/end_round`;
  const param = { bjId: t_bjId, uid:t_uId};
  const respons = await axios.post(url, param);
  const json = respons.data;
  console.log("json.success :", json.success )
  if(json.success){
    isGameing = false;
    setTimeout(gameReady, 1000 * 10);  
  }  
}



function setVisibleGame(_flag){
  if(_flag){
    isGameVisible = true;
    $('#GameCanvas').show();
    window.ftr.setSoundState(true);
    // $('#banner').hide();
  }else{
    isGameVisible = false;
    $('#GameCanvas').hide();
    window.ftr.setSoundState(false);
    // $('#banner').show();
  }
}

function init() { 
  console.log('init~~~~!!!~') 
  // setTimeout(()=>{
  //     $('#GameCanvas').show();
  //     console.log('init~~~~!!!22222') 
  // }, 2000)
  
  console.log("win_luckyrace init~~!");
  var parts_ = window.location.pathname.split("/");
  my_key = parts_.pop();
  console.log("my_key", my_key, g_url_socket);
  //alert("플랙스티비 도우미 실행합니다." + my_key);
  startSocket(my_key);
  setTimeout(()=>{
    addListenerEndgame();  
    window.ftr.setSoundState(false);
  },5000);
}

// function setAllVolume(level) {
//   document.querySelectorAll("audio").forEach(audio => {
//     audio.volume = level; // 0.0 ~ 1.0 사이 값
//   });
// }


const fnBoxStart = () => {
    imgBox.classList.add('bannerImg');
}

const fnBoxEnd = () => {
    imgBox.classList.remove('bannerImg');
}

function openTicketAni(nick){
    //setAllVolume(0.1)
    fnBoxStart();
    $('#sponUserNick').text(nick);
    setTimeout(()=>{
      //$('#banner').hide();
      //setAllVolume(1)
      fnBoxEnd();
    }, 5000);
}

function gameReady(){
  console.log('ready')
  window.location.reload();
}

function startGame(){
  console.log('startGame', )
  //window.ftr.setData([1,2,3,4,5,6,7,8])
}

function socketStartgame(_now, _target, arr, _isCompleted){
  // console.log('socketStartgame 11111: arr ~~>:', arr)
  if(!isGameing){
      const now = moment(_now);
      const target = moment(_target);
      const diffSec = target.diff(now, "seconds");
      if (diffSec <= 0  && _isCompleted == false ) {
        //  console.log('socketStartgame 22222: arr ~~>:', arr)
          window.ftr.setData(arr, 25, 35);          
          isGameing = true;
      }
  }  
}

function startSocket(_key) {
  const socket = io(g_url_socket, {
    autoConnect: false,
    //secure: true,
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    console.log("conneected key: ", _key, socket.connected); // true   
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
    } else if (_data.type == "3") {
      //추천
    } else if (_data.type == "4") {
      //하트
      //show_noti_popup("플렉스티비", parseInt(_data.msg), "", _data.mid)
    }
  });


  
  socket.on("eventaction", function (data) {
    console.log("eventaction", data);
    if (data.type == "11") {
      if(data.cancel && data.cancel == true){
        gameReady();
        return;
      }
      if(data.sign == 'ticket'){
        openTicketAni(data.nickname);
      }else{
        winningOptionIds = data.winningOptionIds
        socketStartgame(data.now, data.closeAt , data.winningOptionIds, data.isCompleted);
        t_bjId = data.bjId;
        t_uId = data.id;
        //console.log("isGameVisible:", isGameVisible, data.isCompleted )
        if(!isGameVisible && data.isCompleted == false){
          setVisibleGame(true);       
        }
        // //게임대기중이다가 게임취소를 누를때
        // if(isGameVisible && data.isCompleted == 1){
        //   gameReady()
        // }
      }

      
    }
  });

  socket.open();
}


init();