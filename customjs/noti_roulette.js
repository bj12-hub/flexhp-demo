axios.defaults.withCredentials = true;
var rouletteidnum = 0;
const maxRouletteCount = 300;
var prevBgmUrl = null;
var bgm_sound;
var current_data_roulettes = [];
var current_delete_selete_obj = null;

// input 파일 삭제
var bgmDeleteFile = null;
var m_inputFileBgmSoundName = null;
var n_member;

var myModal = new bootstrap.Modal(document.getElementById("setupCompleted"), {
  keyboard: false,
});

function init() {
  var t_url =
    "(" +
    window.location.origin +
    "/noti_roulette_view.html?uid=" +
    n_member.MEMBER_UID +
    "&name=" +
    n_member.NAME +
    ")";
  $("#rlinkTxt").text(t_url);

  getRouletteData();
  addEvent();
}

function addEvent() {
  $("#btn_save").on("click", function () {
    // console.log("btn_save : ", current_data)
    saveRouletteData();
    // setDisplay(current_data)
  });

  $("#btn_reset").on("click", function () {
    // console.log("btn_reset")
    resetRouletteData();
  });
}

function go_roulette_view() {
  var t_url =
    "noti_roulette_view.html?uid=" +
    n_member.MEMBER_UID +
    "&name=" +
    n_member.NAME;
  // window.location.href = t_url;
  window.open(t_url);
}

function saveRouletteData(isNotPop = false) {
  if (!rouletteNameVal()) {
    return;
  }

  // console.log("saveRouletteData", current_data_roulettes)
  var params = {};
  params.key = "info_roulette";
  params.val = JSON.stringify(current_data_roulettes);
  axios
    .post(g_url + "/preset/setpresetsetting", params)
    .then(function (response) {
      let json = response.data;
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
          //var t_data = json.resultMap;
          if (isNotPop) {
          } else {
            myModal.show();
          }
        } else {
          alert(json.message);
        }
      } else {
        alert(json.message);
      }
    })
    .catch(function (error) {})
    .then(function () {
      // always executed
    });
}

function removeBgmData() {
  if (current_data_roulettes) {
    current_data_roulettes.forEach((element) => {
      if (element.imgData && element.imgData.key) {
        //console.log(element.imgData.key)
        deleteBgmFile(element.imgData.key);
      }
    });
  }
}

function resetRouletteData() {
  var params = {};
  params.key = "info_roulette";
  params.val = "_";
  axios
    .post(g_url + "/preset/setpresetsetting", params)
    .then(function (response) {
      let json = response.data;
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
          removeBgmData();
          myModal.show();
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          alert(json.message);
        }
      } else {
        alert(json.message);
      }
    })
    .catch(function (error) {})
    .then(function () {
      // always executed
    });
}

function createDefaultJson() {
  var default_data = {};
  default_data.title = "";
  default_data.lex = "0";
  default_data.noti_text = "{닉네임}님 플렉스{개수}개 룰렛 결과는?";
  default_data.bgmData = {
    url: g_url_roulette_sound,
    name: "플렉스",
    volume: 80,
  };
  default_data.imgData = null;
  default_data.rouletteData = [
    { type: "text", name: "", percent: 1 },
    { type: "text", name: "", percent: 1 },
  ];
  default_data.isVoiceSound = "ON";
  // return JSON.stringify(default_data)
  return default_data;
}

function getRouletteData() {
  axios
    .get(g_url + "/preset/getpresetsetting?key=info_roulette")
    .then(function (response) {
      let json = response.data;
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
          var t_data = json.resultMap.dataRow;
          var r_data = JSON.parse(t_data.VAL);

          //console.log('r_data :',r_data[0]);
          if (
            !r_data ||
            r_data.length < 1 ||
            r_data[0].rouletteData.length < 2
          ) {
            current_data_roulettes = [];
            //current_data_roulettes.push(createDefaultJson())
          } else {
            current_data_roulettes = r_data;
          }

          // console.log('current_data_roulettes:', current_data_roulettes)

          setDisplay();
        } else {
          // alert(json.message);
        }
      } else {
        alert(json.message);
      }
    })
    .catch(function (error) {})
    .then(function () {
      // always executed
    });
}

function setDisplay() {
  // console.log("setDisplay~~")
  // 재화변경에따른 데이터 변경
  (current_data_roulettes || []).forEach((e) => {
    // 재화변경에따른 데이터 변경
    if (needsCurrencyConversion(e.noti_text)) {
      const noti_text = replaceCurrencyInNotiText(e.noti_text);
      e.noti_text = noti_text;
    }
  });

  const rouletteListBox = document.querySelector(".roulette-list-area");
  while (rouletteListBox.hasChildNodes()) {
    rouletteListBox.removeChild(rouletteListBox.firstChild);
  }
  rouletteidnum = 0;
  if (current_data_roulettes) {
    current_data_roulettes.forEach((element, index) => {
      // console.log("index :", index)
      element.idx = index + 1;
      addNewSetup(element);
    });
  }
}

g_login_checking(login_callbackFn);
function login_callbackFn(member) {
  //console.log("login_callbackFn", member )
  n_member = member;
  init();
  if (member.IMG_URL && member.IMG_URL != "") {
    //console.log("~~~~~~~~~~~~@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@", member.IMG_URL)
    $("#user_pic").find("img").attr("src", member.IMG_URL);
  }

  $("#user_name").text(member.NAME);
  $("#user_mid").text("(" + member.MID + ")");
}

//설정 추가

function addNewSetup(t_obj = null) {
  // console.log("t_obj :", t_obj)
  if (!t_obj) {
    // t_obj = {};
    //console.log(current_data.title_bgm_objs[current_data.title_bgm_objs.length-1])

    t_obj = createDefaultJson();

    //console.log("t_obj :", t_obj.lex)

    //    t_obj.title = 'aaa';
    //    t_obj.lex = '10';
    //    t_obj.notiTxt = '{닉네임}님 플렉스{개수}개 감사합니다.'
    //    t_obj.imgData = {'url':'https://flexhp-bgm.s3.ap-northeast-2.amazonaws.com/202403/image_10804_65f14631cdc579.83237492.jpg', 'name':'bgmtest2.jpg', 'key':'202403/image_10804_65f14631cdc579.83237492.jpg' };
    //    t_obj.rouletteData = [
    //     {'name':'test01', 'percent':20 },
    //     {'name':'test02', 'percent':20 },
    //     {'name':'test03', 'percent':20 },
    //     {'name':'test04', 'percent':20 },
    //     {'name':'test05', 'percent':20 },
    //    ];
    //    t_obj.isVoiceSound = 'ON'

    if (current_data_roulettes && current_data_roulettes.length > 0) {
      t_obj.idx =
        current_data_roulettes[current_data_roulettes.length - 1].idx + 1;
    } else {
      t_obj.idx = 1;
    }
    current_data_roulettes.push(t_obj);
  }

  const rouletteListBox = document.querySelector(".roulette-list-area");
  let rouletteLastId = 0;
  let rouletteCount = rouletteListBox.children.length;

  if (rouletteCount > 0) {
    if (rouletteCount <= 9) {
      rouletteLastId = rouletteListBox.lastElementChild.id.slice(-1);
    } else if (rouletteCount <= 99) {
      rouletteLastId = rouletteListBox.lastElementChild.id.slice(-2);
    } else {
      rouletteLastId = rouletteListBox.lastElementChild.id.slice(-3);
    }
    /* rouletteLastId =
      rouletteCount <= 9
        ? rouletteListBox.lastElementChild.id.slice(-1)
        : rouletteListBox.lastElementChild.id.slice(-2); */

    if (rouletteCount === maxRouletteCount) {
      alert("설정은 최대 " + maxRouletteCount + "개까지 가능합니다.");
      return false;
    }
  }

  var newSetupItemBox = document.createElement("div");
  newSetupItemBox.className = "setup-item-box title-bgm";
  rouletteidnum++;
  newSetupItemBox.setAttribute("rouletteidnum", rouletteidnum);
  // 새로운 ID 설정
  var formFieldId = Number(rouletteLastId) + 1;
  var newSetupItemId = "rouletteList" + formFieldId;
  newSetupItemBox.id = newSetupItemId;

  htmlTagInner = `
        <div class="setup-item-list">
            <p class="setup-txt">TITLE ${rouletteCount + 1}</p>
            <div class="setup-item">
                <div class="input">
                    <input type="text" id="inputRouletteReadTitle${formFieldId}" class="form-control w-25 text-center d-inline-block" value="${
                      t_obj.title
                    }" readonly="readonly">
                    <span class="text-white mr-2 ml-2">후원 렉스</span>
                    <input type="text" id="inputRouletteReadLex${formFieldId}" class="form-control w-5 text-right d-inline-block" value="${numberWithCommas(
                      t_obj.lex,
                    )}" readonly="readonly"> <span class="text-white mr-2">LEX</span>
                </div>

                <div class="button">
                    <button type="button" class="btn btn-bgm-dropdown on" onclick="toggleDropdown(this)"><i></i>닫힘</button>
                    <button type="button" class="btn btn-bgm-delete ml-2"  data-bs-toggle="modal" data-bs-target="#titleRouletteDeletePopup" onclick="rouletteDeletePopup(this)"><i>&times;</i>삭제</button>
                </div>
            </div>

            <div class="bgm-dropdown-content open" id="drop-down-list${formFieldId}">

                <div class="drop-item">
                    <div class="drop-tit">TITLE</div>
                    <div class="drop-conts">
                        <input type="text" id="inputRouletteTitle${formFieldId}" class="form-control w-50 d-inline-block" placeholder="제목 입력" value="${
                          t_obj.title
                        }">
                    </div>
                </div>

                <div class="drop-item">
                    <div class="drop-tit">후원렉스</div>
                    <div class="drop-conts">
                        <input type="text" id="inputRouletteLex${formFieldId}" class="form-control w-20" value="${numberWithCommas(
                          t_obj.lex,
                        )}"><span class="text-white ml-1 mr-2">LEX</span>
                    </div>
                </div>

                <div class="drop-item">
                    <div class="drop-tit">알림텍스트</div>
                    <div class="drop-conts">
                        <input type="text" id="inputAlertText${formFieldId}" class="form-control w-75" value="${
                          t_obj.noti_text
                        }"><span class="text-white ml-1 mr-2"></span>
                    </div>
                </div>

                <div class="drop-item">
                    <div class="drop-tit">BGM우선사용</div>
                    <div class="drop-conts">
                        <div class="chk-switch-box">
                            <input type="checkbox" id="chBGMYn${formFieldId}" name="chBGMYn${formFieldId}" class="switch-input">
                            <label for="chBGMYn${formFieldId}" class="switch-label">
                                <span class="marble"></span>
                                <span class="on">ON</span>
                                <span class="off">OFF</span>
                            </label>
                        </div>
                        <div class="drop-txt">선택 시  BGM 후원과 겹칠 경우 BGM 사운드와 이미지로 룰렛이 표시됩니다.</div>
                    </div>
                </div>

                <div class="drop-item">
                    <div class="drop-tit">사운드</div>
                    <div class="drop-conts" style="align-items:flex-start">
                        <div class="file-box">
                            <label for="inputFileBgmSound${formFieldId}">파일선택</label>
                            <input type="text" id="inputFileBgmSoundName${formFieldId}" value ="${
                              t_obj.bgmData ? t_obj.bgmData.name : ""
                            }"  readonly="readonly" style="border-radius:.25rem">
                        </div>

                        <div class="file-sound-play" style="margin-top:60px">
                            <div class="play-btn">
                                <span class="play"><button type="button" class="btn" id="bgmSoundPlay${formFieldId}" ><img src="../images/ico_sound_play.png" alt="play"></button></span>
                                <span class="time" id="bgmSoundTime${formFieldId}"></span>
                            </div>
                            <div class="play-volume">
                                <div id="sliderBgmSoundVolume${formFieldId}" class="slider-item"></div>
                                <div class="slider-value">
                                    <input id="bgmSoundVolume${formFieldId}" class="input-num" readonly><span class="input-unit"></span>
                                </div>
                            </div>
                            <span class="ico-sound"><img src="../images/ico_speaker.svg" alt="play"></span>
                        </div>
                    </div>
                </div>

                <div class="drop-item">
                    <div class="drop-tit">이미지</div>
                    <div class="drop-conts">
                        <div class="file-thum">
                            <div class="thum" id="fileImageThum${formFieldId}"></div>
                        </div>
                        <div class="file-box">
                            <label for="inputFileBgmImage${formFieldId}">파일선택</label>
                            <input type="text" id="inputFileBgmImageName${formFieldId}"  value ="${
                              t_obj.imgData ? t_obj.imgData.name : ""
                            }"  readonly="readonly" onclick="onClickTextToFile(this)">
                            <input type="file" id="i_inputFileBgmImage${formFieldId}" accept=".png, .gif, .jpg" value="" >
                        </div>
                        <span class="file-delete" id="bgmImageDelete${formFieldId}"  data-bs-toggle="modal" data-bs-target="#bgmDeleteFilePopup"><button type="button" class="btn"><i>&times;</i>파일삭제</button></span>

                        <div class="file-images-checkbox">
                            <div class="drop-txt">
                                8MB 이하 png, jpg, gif 파일만 가능합니다.이미지 권장 사이즈 (300x200 픽셀)<br>
                                *이미지 미등록시 플렉스 기본이미지 사용
                            </div>
                        </div>
                    </div>
                </div>

                <div class="drop-item">
                    <div class="drop-tit">룰렛 설정</div>
                    <div class="drop-conts">
                        <div class="roulette-head">
                            <span class="mr-2" style="width:auto">타입</span>
                            <span class="w-40 mr-2">룰렛이름(시그니처숫자번호)</span>
                            <span class="w-20">룰렛 확률</span>
                        </div>
                        <div class="roulette-setting">
                            <div class="roulette-list">


                            </div>

                            <div class="total">
                                <div class="w-60 mr-2 txt">룰렛의 확률은 각각 0보다 크고 총 합계가 100% 이어야 합니다. (룰렛확률은 소수점 1자리까지만 적용됩니다.)</div>
                                <div class="w-20 d-flex justify-content-start m-4">항목 : <span class="count">0</span> 개 &nbsp;|&nbsp; 합계 : <span class="per">0</span> %</div>
                            </div>

                            <div class="btn-add-roulette">
                                <button type="button" class="btn" id ="addNewRouletteBtn${formFieldId}">추가</button>
                            </div>
                        </div>

                    </div>
                </div>

                <div class="drop-item">
                    <div class="drop-tit">채팅음성</div>
                    <div class="drop-conts">
                        <div class="chk-switch-box">
                            <input type="checkbox" id="chVoiceYn${formFieldId}" name="chVoiceYn${formFieldId}" class="switch-input">
                            <label for="chVoiceYn${formFieldId}" class="switch-label">
                                <span class="marble"></span>
                                <span class="on">ON</span>
                                <span class="off">OFF</span>
                            </label>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    `;

  //다른 드롭다운 닫고 태그 추가
  closeAllDropdowns();
  newSetupItemBox.innerHTML = htmlTagInner;
  rouletteListBox.appendChild(newSetupItemBox);

  var inputAlertText = document.getElementById("inputAlertText" + formFieldId);
  inputAlertText.onchange = function () {
    //  console.log(inputAlertText.value)
    t_obj.noti_text = inputAlertText.value;
  };

  var chVoiceYn = document.getElementById("chVoiceYn" + formFieldId);
  chVoiceYn.checked = t_obj.isVoiceSound == "ON" ? true : false;
  chVoiceYn.onchange = function (e) {
    //  console.log('chVoiceYn',  chVoiceYn.checked)
    if (chVoiceYn.checked) {
      t_obj.isVoiceSound = "ON";
    } else {
      t_obj.isVoiceSound = "OFF";
    }
  };

  // chBGMYn BGM 우선 사용
  const chBGMYn = document.getElementById("chBGMYn" + formFieldId);
  chBGMYn.checked = t_obj.isBgmFirst == "ON" ? true : false;
  chBGMYn.onchange = function (e) {
    //  console.log('chBGMYn',  chBGMYn.checked)
    if (chBGMYn.checked) {
      t_obj.isBgmFirst = "ON";
    } else {
      t_obj.isBgmFirst = "OFF";
    }
  };

  var inputRouletteReadTitle = document.getElementById(
    "inputRouletteReadTitle" + formFieldId,
  );
  var inputRouletteTitle = document.getElementById(
    "inputRouletteTitle" + formFieldId,
  );
  inputRouletteTitle.oninput = function (e) {
    t_obj.title = e.target.value;
    inputRouletteReadTitle.value = t_obj.title;
  };

  var inputRouletteReadLex = document.getElementById(
    "inputRouletteReadLex" + formFieldId,
  );
  var inputRouletteLex = document.getElementById(
    "inputRouletteLex" + formFieldId,
  );
  inputRouletteLex.oninput = function (e) {
    //console.log("startlex",e.target.value, e.type)
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
    let num = parseInt(e.target.value);
    if (isNaN(num)) {
      num = 0;
    }
    t_obj.lex = num;
    e.target.value = numberWithCommas(num);
    inputRouletteReadLex.value = e.target.value;
  };

  var dropDownList = document.getElementById("drop-down-list" + formFieldId);
  t_obj.rouletteData.forEach((element) => {
    //console.log("element :", element);
    // dropDownList.name = element.name;
    // dropDownList.percent = element.percent;
    addNewRoulette(dropDownList, element);
  });

  var addNewRouletteBtn = document.getElementById(
    "addNewRouletteBtn" + formFieldId,
  );
  addNewRouletteBtn.onclick = function (e) {
    var r_obj = { type: "text", name: "", percent: 1 };
    t_obj.rouletteData.push(r_obj);
    addNewRoulette(dropDownList, r_obj);
  };

  var bgmImageDelete = document.getElementById("bgmImageDelete" + formFieldId);
  bgmImageDelete.onclick = function (e) {
    bgmDeleteFilePopup(bgmImageDelete, t_obj, inputFileBgmImageName);
  };

  var imgThum = document.getElementById("fileImageThum" + formFieldId);
  if (t_obj.imgData) setImg(t_obj.imgData.url, imgThum);

  var inputFileBgmImageName = document.getElementById(
    "inputFileBgmImageName" + formFieldId,
  );

  var inputFileBgmImage = document.getElementById(
    "i_inputFileBgmImage" + formFieldId,
  );
  inputFileBgmImage.onchange = function (e) {
    addFileImage(inputFileBgmImage, t_obj.idx, inputFileBgmImageName);
  };

  newSliderItem(formFieldId, t_obj);
  var soundTime = document.getElementById("bgmSoundTime" + formFieldId);
  soundTime.innerHTML = "00:00";

  var bgmSoundPlay = document.getElementById("bgmSoundPlay" + formFieldId);
  bgmSoundPlay.onclick = function () {
    playBgm(
      t_obj.bgmData ? t_obj.bgmData.url : "",
      soundTime,
      t_obj.bgmData ? t_obj.bgmData.volume : 80,
    );
  };
}

// 리스트 삭제
var rouletteDeleteList = null;
function rouletteDeletePopup(target) {
  var rouletteDeletePop = new bootstrap.Modal(
    document.getElementById("titleRouletteDeletePopup"),
    {
      keyboard: false,
    },
  );
  rouletteDeletePop.show();
  rouletteDeleteList = target.closest(".title-bgm");
  //console.log("rouletteDeleteList :", rouletteDeleteList.rouletteIdnum, "rouletteDeleteList:", rouletteDeleteList.getAttribute("rouletteIdnum"))
}

function onRouletteListDelete() {
  //console.log("current_data.title_bgm_objs 1:", current_data.title_bgm_objs)
  if (rouletteDeleteList) {
    current_data_roulettes.forEach((element, index) => {
      //console.log("element:",element.idx, rouletteDeleteList.getAttribute("rouletteIdnum"))
      if (element.idx == rouletteDeleteList.getAttribute("rouletteIdnum")) {
        var deletRouletteObj = current_data_roulettes.splice(index, 1)[0];
        if (deletRouletteObj.imgData && deletRouletteObj.imgData.key)
          deleteBgmFile(deletRouletteObj.imgData.key);

        // console.log("deletRouletteObj :", deletRouletteObj)
      }
    });
    rouletteDeleteList.remove();

    saveRouletteData(true);
    //savePreset(current_preset_div, current_data, true)
    //console.log("current_data.title_bgm_objs 2:", current_data.title_bgm_objs)
    alert("BGM리스트가 삭제되었습니다.");
  }
}

var regexp = /^\d*(\.\d{0,2})?$/;

//룰렛 설정 추가
function addNewRoulette(dropDownList, r_data) {
  var dropDownList = dropDownList;

  const rouletteListBox = dropDownList.querySelector(".roulette-list");
  const maxRouletteItemCount = 300;

  let rouletteLastId = 0;
  let rouletteCount = rouletteListBox.children.length;

  if (rouletteCount > 0) {
    if (rouletteCount <= 9) {
      rouletteLastId = rouletteListBox.lastElementChild.id.slice(-1);
    } else if (rouletteCount <= 99) {
      rouletteLastId = rouletteListBox.lastElementChild.id.slice(-2);
    } else {
      rouletteLastId = rouletteListBox.lastElementChild.id.slice(-3);
    }

    if (rouletteCount === maxRouletteItemCount) {
      alert("설정은 최대 " + maxRouletteItemCount + "개까지 가능합니다.");
      return false;
    }
  }

  var dropDownListId = dropDownList.closest(".setup-item-box").id;
  var newRouletteItem = document.createElement("div");
  var rouletteItemId = `${dropDownListId}_roulette_${
    Number(rouletteLastId) + 1
  }`;

  //console.log('rouletteItemId', rouletteItemId)

  newRouletteItem.className = "inner";
  newRouletteItem.id = rouletteItemId;
  r_data.key = rouletteItemId;

  htmlTagInner = `
        <select id="${rouletteItemId}_type" class="form-control mr-2" style="width:auto">
            <option value="text">텍스트</option>
            <option value="signature">시그니처</option>
        </select>
        <input type="text" id="${rouletteItemId}_name" placeholder="룰렛 이름" class="form-control w-40 mr-2">
        <input type="number" id="${rouletteItemId}_percent"  placeholder="확률 입력" class="form-control w-20" min="0" max="100" >
        <span class="file-delete" data-bs-toggle="modal" data-bs-target="#rouletteDeleteConfirmPopup" onclick="rouletteDeleteConfirmPopup(this)">
            <button type="button" class="btn"><i>&times;</i>삭제</button>
        </span>
    `;
  newRouletteItem.innerHTML = htmlTagInner;
  rouletteListBox.appendChild(newRouletteItem);

  let n_type = document.getElementById(`${rouletteItemId}_type`);
  var n_name = document.getElementById(`${rouletteItemId}_name`);
  var n_percent = document.getElementById(`${rouletteItemId}_percent`);

  r_data.type = r_data.type || "text";
  n_type.value = r_data.type;
  n_name.value = r_data.name;
  n_percent.value = r_data.percent;

  n_type.onchange = function (e) {
    r_data.type = e.target.value;
  };

  n_name.oninput = function (e) {
    r_data.name = e.target.value;
  };

  n_percent.oninput = function (e) {
    //console.log('oninput')

    // e.target.value = e.target.value.replace(/[^0-9]/g,"");
    let num = Number(e.target.value);

    if (isNaN(num)) {
      num = 0;
      n_percent.value = 0;
    }

    //  n_percent.value =  num.toFixed(2)

    r_data.percent = Number(num.toFixed(2));
  };

  n_percent.onchange = function (e) {
    let num = Number(n_percent.value).toFixed(2);
    n_percent.value = Number(num);
    onChangePercent(n_percent);
  };

  onChangePercent(n_percent);
}

// 파일 삭제
function onDeleteFile(delFile) {
  const target = document.getElementById(delFile);
  // var fileType = null;
  if (target.files[0]) {
    fileType = target.files[0].type;
  }
  var arrDelStr = delFile.split("_");
  // console.log("arrDelStr:", arrDelStr)

  // if(arrDelStr[0] == 's')
  // {
  //      deleteBgmFile(current_delete_selete_obj.bgmData.key);
  //      current_delete_selete_obj.bgmData = null;
  //      current_delete_selete_obj.checkBgm()

  //      savePreset(current_preset_div, current_data, true)
  // }else
  if (arrDelStr[0] == "i") {
    deleteBgmFile(current_delete_selete_obj.imgData.key);
    current_delete_selete_obj.imgData = null;

    // savePreset(current_preset_div, current_data, true);

    var fileParent = target.parentNode;
    var fileThum = fileParent.previousElementSibling.children;
    var fileThumImg = document.getElementById(fileThum[0].id + "-add");

    if (fileThumImg) fileThumImg.remove();
  }

  m_inputFileBgmSoundName.value = "";

  //console.log("onDeleteFile aaaaaaaaaaaaaaaa:",  current_data.title_bgm_objs);
  // 이미지일때 썸네일도 삭제
  //    if(fileType && fileType.indexOf('image') !== -1) {
  //         var fileParent = target.parentNode;
  //         var fileThum = fileParent.previousElementSibling.children;
  //         var fileThumImg = document.getElementById(fileThum[0].id + '-add');

  //         if(fileThumImg) fileThumImg.remove();
  //    }

  target.value = "";
  alert("파일이 삭제되었습니다.");
}

// 파일 삭제 확인 팝업 표시
function bgmDeleteFilePopup(btn, t_obj, inputFileBgmSoundName) {
  const inputElement = btn.previousElementSibling.lastElementChild;
  bgmDeleteFile = inputElement.id;

  var arrDelStr = bgmDeleteFile.split("_");
  // if(arrDelStr[0] == 's')
  // {
  //     if(t_obj.bgmData)
  //     {
  //         modalId = 'bgmDeleteFilePopup';
  //     }
  //     else
  //     {
  //         modalId = 'bgmDeleteFileNonePopup';
  //     }
  // }else
  if (arrDelStr[0] == "i") {
    if (t_obj.imgData) {
      modalId = "bgmDeleteFilePopup";
    } else {
      modalId = "bgmDeleteFileNonePopup";
    }
  }
  //const modalId = inputElement.files[0] ? 'bgmDeleteFilePopup' : 'bgmDeleteFileNonePopup';

  const modal = new bootstrap.Modal(document.getElementById(modalId), {
    keyboard: false,
  });
  modal.show();

  current_delete_selete_obj = t_obj;
  m_inputFileBgmSoundName = inputFileBgmSoundName;
}

// 파일 추가 시 확장자, 파일크기 확인
function addFileCheck(file, extension, maxSize) {
  var fileName = file.files[0].name;
  var fileSize = file.files[0].size;

  if (fileName !== "") {
    var ext = fileName.slice(fileName.lastIndexOf(".") + 1).toLowerCase();

    if (extension.includes(ext)) {
      if (fileSize > maxSize) {
        alert("파일의 최대 용량을 초과하였습니다.");
        file.value = "";
        return false;
      }
      //console.log('파일 추가:', ext);
    } else {
      alert("추가 가능한 파일이 아닙니다. 다시 확인하여 주십시오.");
      file.value = "";
      return false;
    }
  } else {
    return false;
  }
  return true;
}

// 이미지 추가
function addFileImage(imageFile, idx, txtName) {
  var t_imgObj = null;
  current_data_roulettes.forEach((element) => {
    //console.log("element :", element);
    if (element.idx == idx) {
      t_imgObj = element;
    }
  });

  if (imageFile.files[0]) {
    if (!addFileCheck(imageFile, ["jpg", "png", "gif"], 8 * 1024 * 1024)) {
      imageFile.value = "";
    } else {
      if (t_imgObj.imgData && t_imgObj.imgData.key) {
        deleteBgmFile(t_imgObj.imgData.key);
      }

      addFileImageThum(imageFile);
      uploadBgmImage(imageFile.files[0], t_imgObj, txtName);
    }
  } else {
    imageFile.value = "";
  }
}

function uploadBgmImage(file, t_bgmObj, txtName) {
  //console.log("current_data.title_bgm_objs111: ", current_data.title_bgm_objs)
  // console.log("uploadBgmSound1: ", file)
  const formData = new FormData();
  formData.append("upfile", file);
  axios
    .post(g_url + "/upload/bgmimageupload2", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then(function (response) {
      let json = response.data;
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
          //console.log("uploadBgmSound2: ", json.resultMap.data)
          t_bgmObj.imgData = json.resultMap.data;
          txtName.value = t_bgmObj.imgData.name;

          saveRouletteData(true);

          // savePreset(current_preset_div, current_data, true)
          // console.log("current_data.title_bgm_objs222: ", current_data.title_bgm_objs)
        } else {
          alert(json.message);
        }
      } else {
        alert(json.message);
      }
    })
    .catch(function (error) {});
}

//이미지 추가 시 썸네일 생성
function addFileImageThum(fileTarget) {
  const fileImgParent = fileTarget.parentNode;
  const thumBox = fileImgParent.previousElementSibling.children;
  let thumImg = document.getElementById(thumBox[0].id + "-add");
  // let thumImgSrc = '';

  if (thumImg) thumImg.remove();

  var reader = new FileReader();
  reader.onload = function (e) {
    var img = document.createElement("img");
    img.setAttribute("src", e.target.result);
    img.setAttribute("id", thumBox[0].id + "-add");
    // thumImgSrc = e.target.result;
    thumBox[0].appendChild(img);
    // console.log('reader : ', e , thumBox[0].id)
  };

  reader.readAsDataURL(fileTarget.files[0]);
}

function deleteBgmFile(key) {
  //console.log("deleteBgmFile :", key)
  axios
    .post(g_url + "/upload/bgmfiledelete", { key: key })
    .then(function (response) {
      let json = response.data;
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
          console.log("json :", json);
        } else {
          alert(json.message);
        }
      } else {
        alert(json.message);
      }
    })
    .catch(function (error) {})
    .then(function () {
      // always executed
    });
}

function setImg(url, imgThum) {
  if (url) {
    var img = document.createElement("img");
    img.setAttribute("src", url);
    img.setAttribute("id", imgThum.id + "-add");
    imgThum.appendChild(img);
    // console.log(" imgThum.id:",  imgThum.id)
  }
}

function playBgm(url, soundTime, volume) {
  //console.log("playBgm:", url)

  if (url && prevBgmUrl != url) {
    if (bgm_sound) bgm_sound.stop();
    bgm_sound = new buzz.sound(url);
    bgm_sound.loop = false;
    bgm_sound.setVolume(volume);
    bgm_sound.bind("timeupdate", function () {
      var timer = buzz.toTimer(bgm_sound.getDuration() - bgm_sound.getTime());
      //console.log("timer:", timer)
      soundTime.innerHTML = timer;
    });
  }
  if (url) bgm_sound.togglePlay();
  prevBgmUrl = url;
}

// 슬라이더 생성
function newSliderItem(num, t_obj) {
  var startVolume = 80;
  //console.log("t_obj:", t_obj)
  if (t_obj.bgmData) {
    startVolume = t_obj.bgmData.volume;
  }
  var slider = document.getElementById("sliderBgmSoundVolume" + num);
  var sliderVal = document.getElementById("bgmSoundVolume" + num);

  noUiSlider.create(slider, {
    start: startVolume,
    step: 1,
    connect: "lower",
    range: {
      min: 0,
      max: 100,
    },
  });

  slider.noUiSlider.on("update", function (values, handle) {
    sliderVal.value = parseInt(values[handle]);
    if (bgm_sound) {
      bgm_sound.setVolume(sliderVal.value);
    }
    if (t_obj.bgmData) {
      t_obj.bgmData.volume = sliderVal.value;
    }
  });

  sliderVal.addEventListener("change", function () {
    slider.noUiSlider.set(this.value);
  });
}

// 드롭다운 토글 contents
function toggleDropdown(btn) {
  var setupItem = btn.closest(".setup-item");
  var itemContents = setupItem.nextElementSibling;

  if (btn.classList.contains("on")) {
    closeDropdown(btn, itemContents);
  } else {
    closeAllDropdowns();
    openDropdown(btn, itemContents);
  }
}

function openDropdown(_btn, _contents) {
  _btn.classList.add("on");
  _btn.innerHTML = "<i></i>닫힘";
  _contents.classList.add("open");
}

function closeDropdown(_btn, _contents) {
  _btn.classList.remove("on");
  _btn.innerHTML = "<i></i>펼침";
  _contents.classList.remove("open");
}

// 모든 드롭다운 닫기
function closeAllDropdowns() {
  var dropBtns = document.querySelectorAll(".btn-bgm-dropdown");
  var dropConts = document.querySelectorAll(".bgm-dropdown-content");

  dropBtns.forEach(function (btn) {
    closeDropdown(btn, btn.closest(".setup-item").nextElementSibling);
  });

  dropConts.forEach(function (content) {
    content.classList.remove("open");
  });
}

// 룰렛 삭제 확인 팝업 표시
var rouletteListId = null;
function rouletteDeleteConfirmPopup(btn) {
  const inputElement = btn.closest(".inner");
  rouletteListId = inputElement.id;

  var rouletteCnt = inputElement
    .closest(".roulette-list")
    .querySelectorAll(".inner").length;
  // console.log("rouletteCnt: ", rouletteCnt)
  var modalBodyText = document.getElementById("rouletteDeleteText");
  var modalFooterBtn = document.getElementById("rouletteDeleteButton");

  if (rouletteCnt <= 2) {
    modalBodyText.innerHTML = "최소 2개로 룰렛을 이용하여 주세요.";
    modalFooterBtn.style.display = "none";
  } else {
    modalBodyText.innerHTML = "룰렛을 삭제 하시겠습니까?";
    modalFooterBtn.style.display = "block";
  }

  const modal = new bootstrap.Modal(
    document.getElementById("rouletteDeleteConfirmPopup"),
    { keyboard: false },
  );
  modal.show();
}

// 룰렛 삭제
function onDeleteRoulette(rouletteListId) {
  var target = document.getElementById(rouletteListId);

  var arr_rouletteData = null;
  var targetPer = target.querySelector('input[type="number"]');
  //console.log("target :", target, "targetPer :", targetPer, "rouletteListId :", rouletteListId)
  current_data_roulettes.forEach((element) => {
    for (let i = 0; i < element.rouletteData.length; i++) {
      var t_obj = element.rouletteData[i];
      // console.log("t_obj :", t_obj.key , "rouletteListId :", rouletteListId )
      if (t_obj.key == rouletteListId) {
        element.rouletteData.splice(i, 1);
        arr_rouletteData = element.rouletteData;
        break;
      }
    }
  });

  onChangePercent(targetPer, arr_rouletteData);
  if (target) target.remove();
  // alert('룰렛이 삭제되었습니다.');
}

// 룰렛 확률 변경
function onChangePercent(el, arr_rouletteData = null) {
  // console.log('onChangePercent', el,  el.value);
  var changeNumberParent = el.closest(".roulette-list");
  var numberInputs = changeNumberParent.querySelectorAll(
    'input[type="number"]',
  );
  //console.log('numberInputs~: ', numberInputs)
  var totalBox = changeNumberParent.nextElementSibling;
  var totalTxt = totalBox.querySelector(".txt");
  var totalPer = totalBox.querySelector(".per");
  var totalCount = totalBox.querySelector(".count");
  var percent = 0;
  //roulettePercentVal(el);

  numberInputs.forEach((input) => {
    //console.log("numberInputs input.value :", input.value)
    percent += Number(input.value);
  });
  percent = Math.round(percent * 100) / 100;
  if (totalCount) totalCount.innerHTML = numberInputs.length;
  totalPer.innerHTML = Number(percent);
  if (totalPer.innerText == 0) return false;
  //룰렛데이터 삭제시
  if (arr_rouletteData) {
    percent = 0;
    arr_rouletteData.forEach((obj) => {
      // console.log("arr_rouletteData input.value :", input.value)
      percent += Number(obj.percent);
    });
    percent = Math.round(percent * 100) / 100;
  }

  //console.log("onChangePercent :", percent)

  if (Number(percent) == 100) {
    totalTxt.innerHTML = "";
    totalPer.parentNode.style.color = "#00FFF6";
    numberInputs.forEach((num) => num.classList.remove("warning"));
  } else {
    totalTxt.innerHTML =
      "룰렛의 확률은 각각 0보다 크고 총 합계가 100% 이어야 합니다.<br/>(룰렛확률은 소수점 1자리까지만 적용됩니다.)";
    totalPer.parentNode.style.color = "#FF67A0";
    numberInputs.forEach((num) => num.classList.add("warning"));
  }
}

// 룰렛 확률 변경 값 확인
function roulettePercentVal(element) {
  if (element.value.length > element.maxLength) {
    element.value = element.value.slice(0, element.maxLength);
  }

  if (element.value == null || element.value == 0) {
    element.value = 0;
  }
}

// 설정 저장 시 룰렛 이름 값  체크
function rouletteNameVal() {
  //let openContents = document.querySelector(".bgm-dropdown-content.open");
  let rouletteList = document.querySelectorAll(
    ".bgm-dropdown-content .roulette-list",
  );

  let sigNotNumberCount = 0;
  let index = -1;
  let title = "";
  rouletteList.forEach((roulette) => {
    const rouletteItems = roulette.querySelectorAll(".inner");

    rouletteItems.forEach((list, key) => {
      let typeSelect = list.querySelector("select");
      let nameInput = list.querySelector('input[type="text"]');

      if (typeSelect && typeSelect.value === "signature") {
        if (!/^\d+$/.test(nameInput.value.trim())) {
          sigNotNumberCount++;
          index = key;
          title =
            $(list)
              .parents("div.setup-item-list")
              .find("input")
              .first()
              .val() || "";
        }
      }
    });
  });

  // Message.multiLineMessage
  if (sigNotNumberCount >= 1) {
    Message.show(
      Message.multiLineMessage([
        "시그니처 타입은 룰렛 이름에 숫자만 입력할 수 있습니다.",
        `- 타이틀: ${title}`,
        `- ${index + 1}번째 룰렛 아이템`,
      ]),
    );
    return false;
  }

  return true;
}
