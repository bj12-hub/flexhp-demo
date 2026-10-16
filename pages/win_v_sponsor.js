console.log("win_videosponsor_js")


//buzz.defaults.formats = [ 'ogg', 'mp3', 'aac', 'wav', 'm4a' ];

var my_key;
var current_data;
var isAutoPlay = false;
var spon_sound;
var arr_video_audio_cue = [];
//var arr_video_cue = [];
//var arr_audio_cue = [];
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var isYouTubeIframeAPIReady = false;


function pushAudio(url, nick, lex){
    var audioObj = {
        url:url,
        nick:nick,
        lex:lex,
        type:'audio' 
    }
    arr_video_audio_cue.push(audioObj)
    //arr_audio_cue.push(audioObj);
    //startAudio();
     startVideoAudio();
}



function startVideoAudio(){


    if(!spon_sound || spon_sound && spon_sound.isEnded())
    {
       if(!player || player &&  player.getPlayerState && player.getPlayerState() != 1)
       {
            var videoAudioObj = arr_video_audio_cue.shift();
            console.log('startVideoAudio:', videoAudioObj, current_data)
            if(videoAudioObj)
            {
                if(videoAudioObj.type == 'audio')
                {
                    //startAudio();
                     playAudio(videoAudioObj);
                }
                else if(videoAudioObj.type == 'video')
                {
                    //startVideo()  
                     playVideo(videoAudioObj)
                }
                
            }
       }
    }

    
 
    

}

// function startAudio(){
//     //사운드 첨시작이거나  기존플레이 종료했거나
//     //if(!spon_sound || spon_sound && spon_sound.isEnded())
//     if((!spon_sound || spon_sound && spon_sound.isEnded()) && (!player || player &&  player.getPlayerState && player.getPlayerState() != 1))
//     {        
//         var audioObj = arr_audio_cue.shift();
//         if(audioObj)
//         {
//             playAudio(audioObj);
//         }
//     }
// }


// function startVideo()
// {
//     console.log("startVideo1", player )
//     //if(!player || player &&  player.getPlayerState && player.getPlayerState() != 1)
//     if((!spon_sound || spon_sound && spon_sound.isEnded()) && (!player || player &&  player.getPlayerState && player.getPlayerState() != 1))
//     {
//         console.log("startVideo2", player)
//         var videoObj = arr_video_cue.shift();
//         if(videoObj)
//         {
//              console.log("startVideo3", videoObj)
//             playVideo(videoObj)
//         }		   
//     }	
// }




var setIntervalId_audio

function playAudio(audioObj){
    if(current_data.isAudioSponStt != 'on')return;
    console.log("aaaaaaaaaaaaaaaa")
    spon_sound = new buzz.sound(audioObj.url);
    spon_sound.setVolume(parseInt(current_data.a_audioVolume))
    spon_sound.play()       
    spon_sound.bind("ended", onAudioEnded);
    spon_sound.bind("error", onAudioError);
    if(setIntervalId_audio)clearTimeout(setIntervalId_audio);
    setIntervalId_audio = setTimeout(()=>{
        console.log('setTimeout audio spon_sound.stop() pause', spon_sound)
        spon_sound.stop();   
        spon_sound = null; 
        $(".playerAudio-txt").attr('style', 'display:none');
        //startAudio();
        startVideoAudio();
    }, parseInt(current_data.a_maxAudioSec)*1000)


       
    $("#a_nick").text(audioObj.nick)
    $("#a_lex").text(numberWithCommas(parseInt(audioObj.lex)))
// parseInt(current_data.v_maxVideoSec)
    $(".playerAudio-txt").attr('style', 'display:block');
}


function onAudioEnded(){
    console.log("onAudioEnded")
    if(setIntervalId_audio)clearTimeout(setIntervalId_audio);
    spon_sound = null; 
    $(".playerAudio-txt").attr('style', 'display:none');
    //startAudio();
    startVideoAudio();
}

function onAudioError(){
    
    console.log("onAudioError")
    location.reload();
}






var player;
function onYouTubeIframeAPIReady() {
    isYouTubeIframeAPIReady = true;	
    console.log("onYouTubeIframeAPIReady")
    //playVideo('kW5WDrCGZeI', 20, 30)

}


function pushVideo(id, startSeconds = null, endSeconds = null, nick, lex)
{
    var videoObj = {
        id:id,
        startSeconds:startSeconds,
        endSeconds:endSeconds,
        nick:nick,
        lex:lex,
        type:'video'       
    }

    arr_video_audio_cue.push(videoObj);
    //arr_video_cue.push(videoObj);
    //startVideo()
    startVideoAudio();
}



function playVideo(videoObj)
{
     console.log("playVideo1 ", current_data, isYouTubeIframeAPIReady)
    if(current_data.isVideoSponStt != 'on')return;
    if(!isYouTubeIframeAPIReady)return   
    console.log('playVideo',videoObj.id, videoObj.startSeconds, videoObj.endSeconds)


    let playerOption = {
       height: '100%',
       width: '100%',
        //videoId: 'kW5WDrCGZeI',
        playerVars: { 
                'rel': 0,    //연관동영상 표시여부(0:표시안함)
                'loop' : 0,    //반복재생여부(1:반복재생 함)
                'autoplay': 1,
                'mute':1,
                'enablejsapi':1,
                'controls': 0, 
                'disablekb': 1, 
                'playsinline':1,
                'modestbranding':1,
                'showinfo': 0,
                'fs':0,
                'iv_load_policy':3,
            // 'start' : 20,
            // 'end' :40,
              'origin': g_url_current,
            // 'playlist' : ['EphAu0ZwCJc', 'kW5WDrCGZeI' ]   //재생할 영상 리스트
                },
        events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange,
        'onError': onPlayerError
        }
    }





    playerOption.videoId = videoObj.id;


    if(videoObj.startSeconds) playerOption.playerVars.start = videoObj.startSeconds;  
    if(videoObj.endSeconds)playerOption.playerVars.end = videoObj.endSeconds;
   // console.log("playerOption : ", playerOption)
    player = new YT.Player('player', playerOption);


    $("#v_nick").text(videoObj.nick);
    $("#v_lex").text(numberWithCommas(parseInt(videoObj.lex)));
}

var intervalId = null;

function onPlayerStateChange(event) {
    //console.log("onPlayerStateChange", event.data, player.getVideoUrl(), YT.PlayerState.ENDED)

    if(event.data == YT.PlayerState.ENDED)
    {      
         console.log("onPlayerStateChange", event.data)
        if(intervalId) clearTimeout(intervalId)
        stopVideo();
        //startVideo();	
        startVideoAudio();
    }

    if (event.data == YT.PlayerState.PLAYING) {        
        player.setVolume(Number(current_data.v_videoVolume))
        console.log('setTimeout!0', current_data.v_maxVideoSec, current_data.v_videoVolume)
        if(intervalId) clearTimeout(intervalId)
        intervalId =  setTimeout(()=>{
              console.log('setTimeout!1', current_data.v_maxVideoSec)
              stopVideo();
              //startVideo();
              startVideoAudio();
        }, Number(current_data.v_maxVideoSec) * 1000);	
    }  
}



function onPlayerReady(event) {
    console.log("onPlayerReady~^^~", current_data.v_videoVolume)
    player.unMute();   
   // player.mute();
   $(".player-txt").attr('style', 'display:block');
 
}

function onPlayerError(event){
     console.log("onPlayerError~", event)
     location.reload();
}

function stopVideo() {
       console.log("ddd",)
    //player.nextVideo();
        player.stopVideo();
        player.destroy()
        player = null;

        $(".player-txt").attr('style', 'display:none');
}





function createDefaultJson()
{

    var jsonObj = {}

    jsonObj.isVideoSponStt = "off";
    jsonObj.v_minSponLex = 10;
    jsonObj.v_oneSecForLex = 1;
    jsonObj.v_maxVideoSec = 60; 
    jsonObj.v_autoPlay = "off"; 
    jsonObj.v_videoVolume = 70;
    jsonObj.v_filterLevel = 1;

    jsonObj.isAudioSponStt = "off";
    jsonObj.a_minSponLex = 10;  
    jsonObj.a_oneSecForLex = 1;
    jsonObj.a_maxAudioSec = 60; 
    jsonObj.a_autoPlay = "off"; 
    jsonObj.a_audioVolume = 70;
    //console.log("createDefaultJson:", JSON.stringify(jsonObj))
   // return JSON.stringify(jsonObj)   
     return jsonObj;
}


function init() {
    console.log( "init~~!", buzz.defaults.formats );   
   // var parts_ = window.location.pathname.split('/');
   // my_key = parts_.pop();
    //console.log("my_key", my_key)
    //alert("플랙스티비 도우미 실행합니다." + my_key);

    const _url = new URL(window.location.href);
    var parts_ = _url.pathname.split('/');
    my_key = parts_.pop();

    startSocket(my_key);

    const urlParams = _url.searchParams;
    console.log("my_key", my_key)
    console.log("autoplay:", urlParams.get('autoplay'))
    
    isAutoPlay = urlParams.get('autoplay');



}





function startSocket(_key) {
    const socket = io(g_url_socket, {
        autoConnect: false,
        //secure: true,
        transports: ['websocket']
    });

    socket.on('connect', () => {
        console.log("conneected key: ",_key ); // true
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

    socket.on('help', function(data) {
        console.log('help', data);
        window.location.reload();
    });

    socket.on('eventaction', function(data) {
        console.log('eventaction', data); 


        if (data.type == "7") {
            //영상후원

            if(isAutoPlay)
            {
                console.log("영상후원 자동재생")           
                const url = new URL(getYoutubeURL(data.url));
                var urlParams = url.searchParams;
                y_id= urlParams.get('v');      


                if(!y_id)return;


                if(data.isPlayAll == 'Y')
                {
                    pushVideo(y_id, null, null, data.nick, data.lex);
                }
                else
                {
                    const startSec = parseInt(data.startSec)
                    const endSec = parseInt(data.endSec)
                    pushVideo(y_id, startSec, endSec, data.nick, data.lex);
                }
            }

        }
        else  if (data.type == "8") {
            //영상후원
            console.log("음성후원 자동재생")
            if(isAutoPlay)
            {
                pushAudio(data.url, data.nick, data.lex);
            }

        }

        else if (data.type == "17") {
            //영상후원
            console.log("영상후원")

            const url = new URL(data.url);
            var urlParams = url.searchParams;
            y_id= urlParams.get('v');      


            if(!y_id)return;


            if(data.isPlayAll == 'Y')
            {
                pushVideo(y_id, null, null, data.nick, data.lex);
            }
            else
            {
                const startSec = parseInt(data.startSec)
                const endSec = parseInt(data.endSec)
                pushVideo(y_id, startSec, endSec, data.nick, data.lex);
            }
        }
        else  if (data.type == "18") {
            //영상후원
            console.log("음성후원")
            pushAudio(data.url, data.nick, data.lex);
        }
    });

    socket.open();
}


function getYoutubeURL(orgUrl)
{
    const _url = new URL(orgUrl);
    var arrPath =  _url.pathname.split('/');
   // console.log('arrPath :', arrPath, _url.pathname, _url)
    var y_id = null;
    var url = null;
    if(arrPath.includes('shorts'))
    {
        y_id = arrPath.at(-1);
        url  = 'https://www.youtube.com/watch?v=' + y_id;
    }  
    else
    {   
       if(_url.hostname == 'youtu.be')
       {
             y_id = _url.pathname.split('/')[1];
             url  = 'https://www.youtube.com/watch?v=' + y_id;
       }
       else
       {
            var urlParams = _url.searchParams;
            y_id= urlParams.get('v');
            url  = 'https://www.youtube.com/watch?v=' + y_id;
       }
    }  

    return url;
}



function get_data(_key) {
    //console.log("get_data  ~: ", _key)    
    axios.get(g_url + "/pages/preset/" + _key)
        .then(function(response) {
            console.log('response~~:', response)
            current_data = response.data;



            if (current_data == "" || current_data == null ) {
                current_data = createDefaultJson();
                //console.log("current_data~~~~~~~~~~~~~~~~~~000",  current_data);
            }
           //  console.log("current_data~~~~~~~~~~~~~~~~~~111",  current_data);
            setDisplay(current_data)
                // console.log("get_data~~~~~~~~~~~~~~~~~~",  JSON.parse(json))
                // if (json.returnCode == 1) {	            	    
                //     if(json.resultMap.returnVal != 1)
                //     {       
                //         alert(json.message);		    			
                //         return;
                //     }
                //     console.log("get_data success: ")        
                // }
                // else
                // {
                //     alert(json.message);		 
                // }       
        })
        .catch(function(error) {

        })
        .then(function() {
            // always executed          
        });
}



function setDisplay(_data) {

    console.log('setDisplay', _data)
    // $('.chat-list').empty();
    // // console.log("setDisplay~~~~~~~~~~~~~~~~")
    // prev_set_theme(getThemeClassName(_data.chat_theme))
    // prev_set_transparency(_data.win_transparency);
    // prev_set_chat_sort(_data.chat_sort);
    // prev_set_chat_align(_data.chat_direction);
    // pre_set_chat_scroll(_data.set_chating.scroll);
    // pre_set_chat_fadeout(_data.set_chating.fadeout);
    // pre_set_chat_font(_data.font_name);

    // var isFontBold = (_data.font_bold == "on")
    // if (isFontBold) {
    //     if ($('.chat-list-area').hasClass("font-weight-bold")) $('.chat-list-area').removeClass('font-weight-bold');
    //     $('.chat-list-area').addClass('font-weight-bold');
    // } else {
    //     $('.chat-list-area').removeClass('font-weight-bold');
    // }

    // pre_set_chat_font_size(_data.font_size);
    // setTimeout(prev_chat_fontStroke, 1000);
    // prev_chat_fontStroke();

}


function numberWithCommas (x)
{
    if(x == null)return  '';
    if(isNaN(x))return 0
    // return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");

    const parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}





init()