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
  // window.ftr.onEnd = () => { 
  //   console.log("luckyrace onEnd!!");
  //   callGameOver();
  // }
 // window.horseRace.on('end', (rankings) => console.log(rankings))

  // window.horseRace.on('end', (rankings) =>{
  //   console.log("rankings~~~",rankings)
  //   callGameOver( rankings.map(r => r.name).join(',') )
  // });
}

async function callGameOver(event, arr) {
  //let arrStrName = [];
  const arrStr = arr.rankings.map(r => r.name).join(',')
  console.log('callGameOver: ',event, arr, arrStr) 
  console.log('arrStr:', arrStr)
  if(event == 'end'){
      const url = `${g_url}/callback/horse-race/end_round`;
      const param = { 
        bjId: t_bjId, 
        uid:t_uId,
        rankings:arrStr
      };
      const respons = await axios.post(url, param);
      const json = respons.data;
      console.log("json.success :", json.success )
      if(json.success){
        isGameing = false;
        setTimeout(gameReady, 1000 * 10);  
      }  
  }else if(event == 'predict'){
      const url = `${g_url}/callback/horse-race/update-ranking`;
      const param = { 
        bjId: t_bjId,        
        rankings:arrStr
      };
      const respons = await axios.post(url, param);
      const json = respons.data;
      console.log("update-ranking :", json )
      // if(json.success){       
      // } 
  }
}

function setVisibleGame(_flag){
  if(_flag){
    isGameVisible = true;
    $('#unity-container').show();
    setTimeout(()=>{
        window.horseRace.soundOn();
    }, 3000)

    // $('#banner').hide();
  }else{
    isGameVisible = false;
    $('#unity-container').hide();
    window.horseRace.soundOff()
    // $('#banner').show();
  }
}

function init() { 
  console.log('init~~~~!!!~') 
  // setTimeout(()=>{
  //     $('#GameCanvas').show();
  //     console.log('init~~~~!!!22222') 
  // }, 2000)
  
  console.log("win_horserace init~~!");
  var parts_ = window.location.pathname.split("/");
  my_key = parts_.pop();
  console.log("my_key", my_key, g_url_socket);
  //alert("플랙스티비 도우미 실행합니다." + my_key);
  startSocket(my_key);
  setTimeout(()=>{
    //addListenerEndgame();  
    window.horseRace.soundOff();
  },3000);
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

// function startGame(){
//   console.log('startGame')
//   setVisibleGame(true);    
//   window.horseRace.start();
//   //window.ftr.setData([1,2,3,4,5,6,7,8])
// }

function socketStartgame(_now, _target, _isCompleted){
  // console.log('socketStartgame 11111: arr ~~>:', arr)
  if(!isGameing){
      const now = moment(_now);
      const target = moment(_target);
      const diffSec = target.diff(now, "seconds");
      if (diffSec <= 0  && _isCompleted == false ) {
        //  console.log('socketStartgame 22222: arr ~~>:', arr)
          window.horseRace.start();        
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
    if (data.type == "12") {
      if(data.cancel && data.cancel == true){
        gameReady();
        return;
      }
      if(data.sign == 'ticket'){
        openTicketAni(data.nickname);
      }else{
        winningOptionIds = data.winningOptionIds
        socketStartgame(data.now, data.closeAt, data.isCompleted);
        t_bjId = data.bjId;
        t_uId = data.id;
        //console.log("isGameVisible:", isGameVisible, data.isCompleted )
        if(!isGameVisible && data.isCompleted == false){
          setTimeout(()=>{
            setVisibleGame(true); 
          },500)      
        }
      }

      
    }
  });

  socket.open();
}


//init();