axios.defaults.withCredentials = true;
// var arr_preset_list = [];

//console.log("presetjs ~: ")

function presetModify(targetSelector = null) {
  const selector = targetSelector || ".preset-list-box";
  $(selector)
    .on("click", ".preset-modify", function (e) {
      // 클릭 시 포커스 및 수정 진행
      e.preventDefault();

      var getList = $(this).closest("li");
      if (!getList.hasClass("on")) {
        getList.addClass("on");
        var getBtn = $(this)
          .closest("li")
          .find(".preset-txt")
          .prop("contenteditable", true)
          .focus();
        getBtn.attr("data-name", getBtn.text());
      }
      return false;
    })
    .on("focusout", ".preset-txt", function () {
      // 완료 포커스 아웃 시
      $(this).closest("li").removeClass("on");
      var getBtn = $(this).prop("contenteditable", false);
      if ($.trim(getBtn.text()) === "") {
        getBtn.html(getBtn.attr("data-name"));
      }

      //save();  완료 후 저장
    });
}

function addEventPreset(pageType = null, targetSelector = null) {
  // console.log("presetjs  addEventPreset")
  const targetPageType = pageType || current_preset_type;
  const selector = targetSelector || ".preset-list-box";
  const parentTab = $(selector).parents(".tab-box");

  $(selector).on("focusout", ".preset-txt", function () {
    // 완료 포커스 아웃 시
    $(this).closest("li").removeClass("on");
    var getBtn = $(this).prop("contenteditable", false);
    if ($.trim(getBtn.text()) === "") {
      getBtn.html(getBtn.attr("data-name"));
    }

    $(this).closest("li").attr("name", getBtn.text());
    //console.log("ssssssssssss,",  $(this).closest("li").attr("name"))
    //save();  완료 후 저장
  });

  $(selector).on("click", function (e) {
    var t_target = $(e.target);
    var t_parent = t_target.parent();
    // console.log("presetjs  addEventPreset",$(e.target).hasClass("preset-txt") )

    //console.log("presetjs  addEventPreset",t_target.attr('class') , t_parent.attr("name"))

    if (t_target.attr("class") == "preset-txt") {
      selectPresetBtn(t_parent, parentTab);
    } else if (t_target.attr("class") == "preset-modify") {
      // var getList = t_target.closest("li");
      if (!t_parent.hasClass("on")) {
        t_parent.addClass("on");
        var getBtn = t_parent
          .children(".preset-txt")
          .prop("contenteditable", true)
          .focus();
        getBtn.attr("data-name", getBtn.text());
      }
      //return false;

      // var t_inputText = t_parent.children('.preset-txt');
      // t_inputText.attr("disabled",false).select();
      // t_inputText.on("change", function()
      // {
      //     t_inputText.off("change");
      //     t_inputText.attr("disabled",true);
      //     t_parent.attr("name", t_inputText.val());

      // });
    } else if (t_target.attr("class") == "preset-delete") {
      deletePreset(t_parent, targetPageType, selector);
    }

    //console.log("presetjs  addEventPreset",$(e.target).parent().attr("id") )
    //selectPresetBtn( $(e.target).parent())
  });

  if (!targetSelector) {
    $("#btn_addpreset").click(function () {
      createPreset(targetPageType, selector);
    });
  } else {
    $(selector)
      .siblings(".preset-btn")
      .find("#btn_addpreset")
      .click(function () {
        createPreset(targetPageType, selector);
      });
  }
}

function getPresetList(pageType = null, targetSelector = null) {
  // console.log("getPresetList ~: ", current_preset_type)
  const targetPageType = pageType || current_preset_type;
  const selector = targetSelector || ".preset-list-box";

  const arr_preset_list = [];
  axios
    .get(g_url + "/preset/getpresetlist?type=" + targetPageType)
    .then(function (response) {
      let json = response.data;

      if (json.returnCode == 1) {
        if (json.resultMap.returnVal != 1) {
          alert(json.message);
          return;
        }
        console.log("getPresetList success: ", json.resultMap.dataList);
        if (json.resultMap.dataList) {
          $.each(json.resultMap.dataList, function (index, data) {
            if (data.DATA == null) {
              data.DATA = createDefaultJson(targetPageType);
              //   console.log("getPresetList data가 없다: ", index, data)
            }
            arr_preset_list.push(data);
          });
          setPresetBtns(arr_preset_list, selector);
        } else {
          //  console.log("하나도 없을시 데이터 생성: ");
          createPreset(targetPageType, selector);
          //하나도 없을시 데이터 생성
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

function setPresetBtns(arr_preset_list, targetSelector = null) {
  const selector = targetSelector || ".preset-list-box";
  const parentTab = $(selector).parents(".tab-box");

  $.each(arr_preset_list, function (index, data) {
    addPresetBtn(data, selector);
  });

  //   console.log("current_preset_id _ presetjs", current_preset_id)
  var t_div = $(selector).children("#" + current_preset_id);
  if (t_div.attr("id") == undefined) {
    selectPresetBtn($(selector).children(":first-child"), parentTab);
  } else {
    selectPresetBtn(t_div, parentTab);
  }
  if (!targetSelector) {
    $(".preset-btn").css("display", "block");
  } else {
    $(selector).siblings(".preset-btn").css("display", "block");
  }
}

function addPresetBtn(data, targetSelector = null) {
  const selector = targetSelector || ".preset-list-box";

  // console.log('addPresetBtn ~~~~~~~~~~~~:', data)
  var btn = $("<li>")
    .attr("id", data.ID)
    .attr("data_list", data.DATA)
    .attr("url", data.URL)
    .attr("name", data.NAME)
    .attr("page", data.PAGE)
    .append(
      $("<a>")
        .addClass("preset-txt")
        .attr("data-name", data.NAME)
        .attr("type", "text")
        .attr("value", data.NAME)
        .attr("disabled", true)
        .text(data.NAME)
    )
    .append($("<a>").addClass("preset-modify").text("수정"))
    .append($("<a>").addClass("preset-delete").text("삭제"))
    .css({ cursor: "pointer" });

  $(selector).append(btn);
}

function deletePreset(_div, pageType = null, targetSelector = null) {
  const targetPageType = pageType || current_preset_type;
  const selector = targetSelector || ".preset-list-box";
  const parentTab = $(selector).parents(".tab-box");

  $(".spinner-border").css("display", "block");
  axios
    .post(g_url + "/preset/presetdelete", {
      id: _div.attr("id"),
    })
    .then(function (response) {
      let json = response.data;
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
          _div.remove();

          if ($(selector).children().size() == 0) {
            createPreset(targetPageType, selector);
          }

          if ($(selector).children(".selected").attr("id") == undefined) {
            selectPresetBtn($(selector).children(":first-child"), parentTab);
          }

          $(".spinner-border").css("display", "none");
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

function createPreset(pageType = null, targetSelector = null) {
  const targetPageType = pageType || current_preset_type;
  const selector = targetSelector || ".preset-list-box";
  const parentTab = $(selector).parents(".tab-box");

  $(".spinner-border").css("display", "block");
  axios
    .post(g_url + "/preset/createpreset", {
      type: targetPageType,
    })
    .then(function (response) {
      let json = response.data;
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
          console.log("createPreset success: ", json);
          $(".spinner-border").css("display", "none");

          let t_data = json.resultMap.dataRow;
          t_data.DATA = createDefaultJson(targetPageType);
          addPresetBtn(t_data, selector);
          selectPresetBtn($(selector).children("#" + t_data.ID), parentTab);
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

function savePreset(_preset_div, _data, isNotPop = null) {
  _preset_div.attr("data_list", JSON.stringify(_data));
  //console.log("savePreset :~", _preset_div.attr("id"), _preset_div.attr("name"), _preset_div.attr("data_list"));

  $(".spinner-border").css("display", "block");

  axios
    .post(g_url + "/preset/presetmodify", {
      id: _preset_div.attr("id"),
      name: _preset_div.attr("name"),
      data: _preset_div.attr("data_list"),
    })
    .then(function (response) {
      let json = response.data;
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
          // console.log("savePreset success: ", json);
          $(".spinner-border").css("display", "none");

          if (isNotPop) {
          } else {
            myModal.show();
          }
        } else {
          alert("설정저장 실패:" + json.message);
        }
      } else {
        alert("설정저장 실패:" + json.message);
      }
    })
    .catch(function (error) {})
    .then(function () {
      // always executed
    });
}
