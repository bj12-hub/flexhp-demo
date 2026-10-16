jQuery(document).ready(function () {
  setTimeout(previewClone, 2000);
  //previewClone();

  //clipboard
  copyText();
  //sortable
  presetSortable();
  //font stroke
  fontStroke();

  // color picker sample
  // $("#colorPicker, #colorPicker2").spectrum({
  //     color: "#fff",
  //     showInput: true,
  //     showAlpha: true,
  //     className: "color-picker",
  //     showInitial: true,
  //     preferredFormat: "hex",
  //     chooseText: "선택",
  //     cancelText: "취소",
  //     move: function (color) {
  //     },
  //     show: function () {

  //     },
  //     beforeShow: function () {

  //     },
  //     hide: function () {

  //     },
  //     change: function() {

  //     }
  // });

  // font color
  if (0 < $("#fontStrokeColor").length) {
    $("#fontStrokeColor").spectrum({
      color: "#000",
      showInput: true,
      showAlpha: true,
      className: "color-picker",
      showInitial: true,
      preferredFormat: "hex",
      chooseText: "선택",
      cancelText: "취소",
      change: function () {
        fontStroke();
      },
    });
  }

  // font weight
  $(document).on("click", "#fontBold", function () {
    var fontBoldChk = $(this).is(":checked");
    pre_handle_chat_font_bold(fontBoldChk);
    if (fontBoldChk !== true) {
      $(".font-preview").removeClass("font-preview-bold");
    } else {
      $(".font-preview").addClass("font-preview-bold");
    }
  });

  //content scroll event
  $("#cont-view-area").on("scroll", function () {
    var getViewArea = $("#cont-view-area");
    scTop = getViewArea.scrollTop(); //스크롤 위치

    // top btn
    if (scTop > 200) {
      $(".btn-top-area").fadeIn("fast");
    } else {
      $(".btn-top-area").fadeOut("fast");
    }

    // 미리보기 추가
    $("body").toggleClass("fix-preview", scTop > 800);
  });

  //top btn
  $(".btn-top").click(function (e) {
    $("#cont-view-area").animate({ scrollTop: 0 }, 300);
    e.preventDefault();
  });

  //modal popup callback
  $("#setupCompleted").on("hidden.bs.modal", function (e) {
    // alert('모달 닫은 후 실행');
  });

  //폰트 설정
  fontFamilySelect();

  //slider sample
  chatOpacity();

  sdfontSize();

  sdfontBorder();

  //sampleSlider1();
  //sampleSlider2();
  //sampleSlider3();
  //sampleSlider4();

  //시계
  //clockType1();
});

//font Stroke
function fontStroke() {
  // get form values
  //var fontFamily = $('#fontFamily').val();
  //var fontColor = $('#fontColorPicker').val();

  var strokeSize = $("#fontBorderVal").val();
  strokeColor = $("#fontStrokeColor").val();
  fontSize = $("#fontSizeVal").val();

  // update css
  var $preview = $("#preview");
  //$preview.css('font-family', fontFamily);
  //$preview.css('color', fontColor);
  $preview.css("font-size", fontSize + "px");
  $preview.css("text-shadow", "");

  for (var angle = 0; angle < 2 * Math.PI; angle += 1 / strokeSize) {
    appendShadow(
      $preview,
      Math.cos(angle) * strokeSize,
      Math.sin(angle) * strokeSize,
      strokeColor
    );
  }
}

function getShadow(selector, x, y, col) {
  // compute new text-shadow property
  const item = $(selector);

  var textShadow = "";
  if (item.css("text-shadow") !== "none") {
    textShadow = item.css("text-shadow") + ", ";
  }
  textShadow = textShadow + x + "px " + y + "px " + col;

  // apply new text-shadow property
  return textShadow;
}

//font Stroke shadow
function appendShadow(item, x, y, col) {
  // compute new text-shadow property
  var textShadow = "";
  if (item.css("text-shadow") !== "none") {
    textShadow = item.css("text-shadow") + ", ";
  }
  textShadow = textShadow + x + "px " + y + "px " + col;

  // apply new text-shadow property
  item.css("text-shadow", textShadow);
}

//clipboard
function copyText(targetSelector) {
  const selector = targetSelector || ".btn-copy";
  const clipboard = new ClipboardJS(selector);

  clipboard.on("success", function (e) {
    alert("복사되었습니다. \n" + e.text);
  });
  clipboard.on("error", function (e) {
    alert("실패하였습니다. 다시 시도하여 주세요.");
  });
}

//sortable js
function presetSortable() {
  var sortTable = document.getElementById("sortList");
  if (sortTable) {
    new Sortable(sortTable, {
      animation: 150,
    });
  }
}

//Window Popup
function openWin(pUrl, pName, pW, pH) {
  var winPop = window.open(
    pUrl,
    pName,
    "width=" +
    pW +
    ",height=" +
    pH +
    ",top=0,left=0,toolbars=no,menubars=no,scrollbars=no,location=no,resizable=no"
  );
  winPop.focus();
}

//preview 화면 하단 표시
function previewClone() {
  /* var previewBox = $(".preview-area");
  var clonePreview = previewBox.after(
    previewBox.clone().addClass("clone-preview-box")
  ); */
  $(".preview-area").each(function () {
    const previewBox = $(this);
    previewBox.after(previewBox.clone().addClass("clone-preview-box"));
  });
}

// 폰트 설정 select
function fontFamilySelect() {
  //test for getting url value from attr
  // var img1 = $('.test').attr("data-thumbnail");
  // console.log(img1);

  //test for iterating over child elements
  g_langArray = [];

  $(".font-family-select option").each(function () {
    var img = $(this).attr("data-thumbnail");
    var text = this.innerText;
    var value = $(this).val();
    var item =
      '<li><img src="' +
      img +
      '" alt="" value="' +
      value +
      '"/><span>' +
      text +
      "</span></li>";
    g_langArray.push(item);
  });

  $("#font-view-list").html(g_langArray);
  //Set the butto value to the first el of the array
  $(".btn-select").html(g_langArray[0]);
  $(".btn-select").attr("value", "ff-01");

  //change button stuff on click
  $("#font-view-list li").click(function () {
    var img = $(this).find("img").attr("src");
    var value = $(this).find("img").attr("value");
    var text = this.innerText;
    var item =
      '<li><img src="' + img + '" alt="" /><span>' + text + "</span></li>";
    $(".btn-select").html(item);
    $(".btn-select").attr("value", value);
    $(".font-view-area").toggle();
    console.log(value);
    pre_handle_chat_font(value);
  });

  $(".btn-select").click(function () {
    $(".font-view-area").toggle();
  });

  // //check local storage for the lang
  // var sessionLang = localStorage.getItem('lang');
  // if (sessionLang){
  //     //find an item with value of sessionLang
  //     var langIndex = langArray.indexOf(sessionLang);
  //     $('.btn-select').html(langArray[langIndex]);
  //     $('.btn-select').attr('value', sessionLang);
  // } else {
  //     var langIndex = langArray.indexOf('ch');
  //     console.log(langIndex);
  //     $('.btn-select').html(langArray[langIndex]);
  //     //$('.btn-select').attr('value', 'en');
  // }
}

// slider 투명도
function chatOpacity() {
  var chatOpt = document.getElementById("sliderChatOpacity");
  var optVal = document.getElementById("opacityVal");

  if (!chatOpt) return;
  noUiSlider.create(chatOpt, {
    start: 0,
    connect: "lower",
    step: 1,
    range: {
      min: 0,
      max: 100,
    },
  });

  chatOpt.noUiSlider.on("update", function (values, handle) {
    optVal.value = parseInt(values[handle]);
    prev_handle_transparency(optVal.value);
  });

  optVal.addEventListener("change", function () {
    chatOpt.noUiSlider.set(this.value);
  });
}

// slider 폰트 사이즈
function sdfontSize() {
  var fs = document.getElementById("sliderFontSize");
  var fsVal = document.getElementById("fontSizeVal");

  if (!fs) return;
  noUiSlider.create(fs, {
    start: 16,
    connect: "lower",
    step: 2,
    range: {
      min: 12,
      max: 60,
    },
  });

  fs.noUiSlider.on("update", function (values, handle) {
    fsVal.value = parseInt(values[handle]);
    fontStroke();
    pre_handle_chat_font_size();
  });

  fsVal.addEventListener("change", function () {
    fs.noUiSlider.set(this.value);
  });
}

// slider 폰트 외곽선
function sdfontBorder() {
  var fb = document.getElementById("sliderFontBorder");
  var fbVal = document.getElementById("fontBorderVal");
  if (!fb) return;
  noUiSlider.create(fb, {
    start: 3,
    connect: "lower",
    step: 1,
    range: {
      min: 0,
      max: 20,
    },
  });

  fb.noUiSlider.on("update", function (values, handle) {
    fbVal.value = parseInt(values[handle]);
    fontStroke();
    pre_handle_chat_font_outline();
  });

  fbVal.addEventListener("change", function () {
    fb.noUiSlider.set(this.value);
  });
}

// slider 샘플 슬라이더1
function sampleSlider1() {
  var getSampleId01 = document.getElementById("slidesample01");
  var spVal01 = document.getElementById("sampleVal01");

  noUiSlider.create(getSampleId01, {
    start: 0,
    connect: "lower",
    step: 1,
    range: {
      min: 0,
      max: 50,
    },
  });

  getSampleId01.noUiSlider.on("update", function (values, handle) {
    // spVal01.value = Number((values[handle])*0.1).toFixed(1);
    //  prev_handle_fadein_speed(spVal01.value);
  });

  spVal01.addEventListener("change", function () {
    // getSampleId01.noUiSlider.set(this.value);
  });
}

// slider 샘플 슬라이더 2
function sampleSlider2() {
  var getSampleId02 = document.getElementById("slidesample02");
  var spVal02 = document.getElementById("sampleVal02");

  noUiSlider.create(getSampleId02, {
    start: 1,
    connect: "lower",
    step: 1,
    range: {
      min: 0,
      max: 30,
    },
  });

  getSampleId02.noUiSlider.on("update", function (values, handle) {
    spVal02.value = parseInt(values[handle]);
  });

  spVal02.addEventListener("change", function () {
    getSampleId02.noUiSlider.set(this.value);
  });
}

// slider 샘플 슬라이더 3
function sampleSlider3() {
  var getSampleId03 = document.getElementById("slidesample03");
  var spVal03 = document.getElementById("sampleVal03");

  noUiSlider.create(getSampleId03, {
    start: 1,
    connect: "lower",
    step: 1,
    range: {
      min: 0,
      max: 100,
    },
  });

  getSampleId03.noUiSlider.on("update", function (values, handle) {
    spVal03.value = parseInt(values[handle]);
  });

  spVal03.addEventListener("change", function () {
    getSampleId03.noUiSlider.set(this.value);
  });
}

// slider 샘플 슬라이더 4
function sampleSlider4() {
  var getSampleId04 = document.getElementById("slidesample04");
  var spVal04 = document.getElementById("sampleVal04");

  noUiSlider.create(getSampleId04, {
    start: 1,
    connect: "lower",
    step: 1,
    range: {
      min: 0,
      max: 4,
    },
  });

  getSampleId04.noUiSlider.on("update", function (values, handle) {
    spVal04.value = parseInt(values[handle]);
  });

  spVal04.addEventListener("change", function () {
    getSampleId04.noUiSlider.set(this.value);
  });
}

// 시계 샘플
function clockType1() {
  var clockT1;
  clockT1 = $(".clock").FlipClock({
    clockFace: "TwentyFourHourClock",
    autoStart: true,
  });
}

//console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~000000")
// 시계 라이브러리 옵션
/*
    function clockOption(){

      // Grab the current date
      var currentDate = new Date();

      // Set some date in the past. In this case, it's always been since Jan 1
      var pastDate  = new Date(currentDate.getFullYear(), 0, 1);

      // Calculate the difference in seconds between the future and current date
      var diff = currentDate.getTime() / 1000 - pastDate.getTime() / 1000;

      var clockOp;
        clockOp = $('.clock-type-1 ').FlipClock(diff, {
        clockFace: 'TwentyFourHourClock',    // DailyCounter, HourlyCounter, MinuteCounter, TwelveHourClock, TwelveHourClock,TwentyFourHourClock
        autoStart: true,
        countdown: true,
        showSeconds: false,
        language: 'ko',
        minimumDigits: 6,
        callbacks: {
          start: function() {
          },
          stop: function() {
          },
          interval: function() {
            var time = this.factory.getTime().time;

            if(time) {
              console.log('interval', time);
            }
            }
        }
      });

      clockOp.setTime(220880);
      clockOp.setCountdown(true);
      clockOp.start();
      clockOp.setTime(60*100-5); //count overflow

      //load new
      // setTimeout(function() {
      // 	clockOp.loadClockFace('MinuteCounter');
      // }, 3000);

      // setTimeout(function() {
      // 	clockOp.loadClockFace('HourlyCounter');
      // }, 7000);

      // setTimeout(function() {
      // 	clockOp.loadClockFace('Counter', {
      // 		autoStart: true
      // 	});
      // }, 10000);


      // multiple
      //var clocks = [];
      // clocks.push($('.clock-1').FlipClock({
      // 	clockFace: 'MinuteCounter'
      // }));

      // clocks.push($('.clock-2').FlipClock({
      // 	clockFace: 'HourlyCounter'
      // }));

    }
    */
