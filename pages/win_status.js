console.log("win_chat_js")



var my_key;
var current_data;
var prev_font_name;
var m_url;
var play_time;

function init() {
    console.log("init~~!^^^^^^^^^");
    var parts_ = window.location.pathname.split('/');
    my_key = parts_.pop();
    console.log("my_key", my_key)
        //alert("플랙스티비 도우미 실행합니다." + my_key);
    startSocket(my_key);
    m_url = new URL(window.location.href);
    var urlParams = m_url.searchParams;
    play_time = urlParams.get("playtime");

    // $('.debug').text(window.location.href)
    //console.log("urlParams", window.location.pathname)
}




function startSocket(_key) {
    const socket = io(g_url_socket, {
        autoConnect: false,
        //secure: true,
        transports: ['websocket']
    });

    socket.on('connect', () => {
        console.log("conneected key: ", _key, socket.connected); // true
        get_data(_key)
        socket.emit("login", {
            // page: 'e7bDqOGcHZ4mUKME1gV02zWIrw5vS6A9'
            page: _key
        }, function(data) {
            console.log(data);
        })
    });

    socket.on('disconnect', function(data) {
        console.log('disconnect~~~~~~~', data);
        // alert("통신이 끊어졌습니다");
    });
    socket.on('chat', function(data) {
        console.log('event', data);
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
    socket.on('notice', function(data) {
        console.log('notice', data);
        var _level;
        if (data.level == "v") _level = "VIP";
        else if (data.level == "m") _level = "매니저";
        else if (data.level == "b") _level = "BJ";
        else if (data.level == "n") _level = "일반";

        if (data.type == "1") {
            //하트 
            var num_msg = parseInt(data.msg);
            pushNoti_image(data.nick, "님께서 " + numberWithCommas(num_msg) + "개를 선물하셨습니다.", data.url);
        } else if (data.type == "2") {
            //추천
            pushNoti(data.nick, "님께서 추천하셨습니다.")
        } else if (data.type == "3") {
            //즐겨찾기
            pushNoti(data.nick, "님께서 즐겨찾기 하셨습니다.")
        } else if (data.type == "4") {
            //팬클럽
            pushNoti(data.nick, "님께서 팬클럽에 가입하셨습니다.")
        } else if (data.type == "5") {
            //등급
            pushNoti(data.nick, "님의 등급이 ♡" + _level + "♡로 변경되었습니다.")
        } else if (data.type == "6") {
            //입장
            pushNoti(data.nick, "님께서 입장하셨습니다.")
        }

    });
    socket.on('help', function(data) {
        console.log('help', data);
    });

    socket.on('status', function(data) {
        //console.log('status~~', data);
        let n_r = parseInt(data.r);
        let n_h = parseInt(data.h);
        let n_m = parseInt(data.m);        
        updateDisplay(numberWithCommas(n_r),numberWithCommas(n_h), numberWithCommas(n_m) + "개");

    });

    socket.on('testMessage', function(data) {
        console.log('testMessage', data);
        var _data = data.data;
        if (_data.type == "1") {
            //새로고침
            window.location.reload();
        } else if (_data.type == "2") {
            //초기화
            get_data(my_key);
        } else if (_data.type == "3") {
            //추천
            pushNoti("플랙스티비", "님께서 추천하셨습니다.")
        } else if (_data.type == "4") {
            //하트
            var num_msg = parseInt(_data.msg);
            pushNoti_image("플랙스티비", "님께서 " + numberWithCommas(num_msg) + "개를 선물하셨습니다.", "")
        }

    });

    socket.open();
}



function get_data(_key) {
    console.log("get_data  ~: ", _key)
    axios.get(g_url + "/pages/preset/" + _key)
        .then(function(response) {
            console.log("response~~~~~~~~~~~~~~~~~~111", response);
            setDisplay()
        })
        .catch(function(error) {

        })
        .then(function() {
            // always executed          
        });
}

function setDisplay(_data) {


    // 최초에 함수를 한번 실행시켜주고 
    setInterval(clock, 1000);

    updateDisplay("대기중", "대기중", "대기중");
    // setInterval이라는 함수로 매초마다 실행을 해줍니다.

    // setInterval은 첫번째 파라메터는 함수이고 두번째는 시간인데 밀리초단위로 받습니다. 1000 = 1초 



}

function updateDisplay(t_r, t_h, t_m) {

    $('.viewer_num > span').text(t_r);
    $('.flex_num > span').text(t_h);
    $('.recom_num > span').text(t_m)
}




function clock() {


    play_time++
    var time_str = getSecToDate(play_time);
    $('.m_clock').text(time_str)
}




function getSecToDate(str) {

    var resultStr;
    if (str) {
        var mSec = parseInt(str);
        var mMin = parseInt(mSec / 60);
        var mHours = parseInt(mMin / 60);
        mSec = mSec % 60;
        mMin = mMin % 60;
        mHours = mHours % 24;
        resultStr = regTime(mHours) + ":" + regTime(mMin) + ":" + regTime(mSec);
        return resultStr;
    } else {

        return null;
    }
}


function regTime(n) {
    var str;
    if (n == 0) {
        str = "00";
    } else if (n < 10) {
        str = "0" + n
    } else str = String(n);
    return str;
}


// function clock() {
//     var date = new Date();

//     // date Object를 받아오고 
//     var month = date.getMonth();

//     // 달을 받아옵니다 
//     var clockDate = date.getDate();

//     // 몇일인지 받아옵니다 
//     var day = date.getDay();

//     // 요일을 받아옵니다. 
//     var week = ['일', '월', '화', '수', '목', '금', '토'];

//     // 요일은 숫자형태로 리턴되기때문에 미리 배열을 만듭니다. 
//     var hours = date.getHours();

//     // 시간을 받아오고 
//     var minutes = date.getMinutes();

//     // 분도 받아옵니다.
//     var seconds = date.getSeconds();

//     // 초까지 받아온후 



//     // var time_txt = `${month+1}월 ${clockDate}일 ${week[day]}요일` +

//     // `${hours < 10 ? `0${hours}` : hours}:${minutes < 10 ? `0${minutes }`  : minutes }:${seconds < 10 ? `0${seconds }`  : seconds }`;



//     var time_txt = `${hours < 10 ? `0${hours}` : hours}:${minutes < 10 ? `0${minutes }`  : minutes }:${seconds < 10 ? `0${seconds }`  : seconds }`;

//     // 월은 0부터 1월이기때문에 +1일을 해주고 

//     // 시간 분 초는 한자리수이면 시계가 어색해보일까봐 10보다 작으면 앞에0을 붙혀주는 작업을 3항연산으로 했습니다. 

//     $('.m_clock').text(time_txt)
// }





init();