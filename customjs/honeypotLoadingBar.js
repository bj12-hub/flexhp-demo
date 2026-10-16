class HoneypotLoadingBar {
  static UI_TREE = {
    TITLE: { NAME: "TITLE", node: { el: null, data: null } },
    SUB_TITLE: { NAME: "SUB_TITLE", node: { el: null, data: null } },
    OPACITY: { NAME: "OPACITY", node: { el: null, data: null } },
    NOTI_TEXT: { NAME: "NOTI_TEXT", node: { el: null, data: null } },
    NOTI_TEXT_INSIDE: {
      NAME: "NOTI_TEXT_INSIDE",
      node: { el: null, data: null },
    },
    COLOR_FONT: { NAME: "COLOR_FONT", node: { el: null, data: null } },
    COLOR_FONT_INSIDE: {
      NAME: "COLOR_FONT_INSIDE",
      node: { el: null, data: null },
    },
    FONT: { NAME: "FONT", node: { el: null, data: null } },
    FONT_BOLD: { NAME: "FONT_BOLD", node: { el: null, data: null } },
    FONT_SIZE: { NAME: "FONT_SIZE", node: { el: null, data: null } },
    FONT_STROKE: { NAME: "FONT_STROKE", node: { el: null, data: null } },
    FONT_STROKE_COLOR: {
      NAME: "FONT_STROKE_COLOR",
      node: { el: null, data: null },
    },
  };

  static HONEY_LIMIT = 10000;

  static createDefaultJson() {
    var jsonObj = {};

    jsonObj.win_transparency = 0;

    jsonObj.graph_type = "꿀";

    jsonObj.main_text = "꿀단지({개})";
    jsonObj.sub_text = "{꿀값}{개} ({퍼센트})";
    // 폰트색
    jsonObj.text_main_color = "#ffffff";
    // 내부폰트색
    jsonObj.text_sub_color = "#ff6060";

    // 그래프내부색
    jsonObj.graph_background_color = "#f9b938";

    jsonObj.font_name = "ff-01";
    jsonObj.font_bold = "off";
    jsonObj.font_size = 22;
    jsonObj.font_outline = 2;
    jsonObj.font_outline_color = "#000000";

    return jsonObj;
  }

  static EVENT = {
    CHANGE: "CHANGE",
  };

  static #DEFAULT_ANI_BG_COLOR = "#ff6060";

  // event emitter
  #emitter = new EventEmitter();

  // parent element
  #parent = null;
  #elRoot = null;
  #psHoneyGuage = null;
  #isInitialized = false;

  /////////////////////////////////////
  // 생성자
  /////////////////////////////////////
  constructor(parent) {
    if (_.isNil(parent)) {
      throw new Error("");
    }

    this.#parent = parent;

    this.addCallback(
      HoneypotLoadingBar.EVENT.CHANGE,
      this.#handleChangeData.bind(this),
    );
  }

  /////////////////////////////////////
  // private
  /////////////////////////////////////
  #verifyUI(element) {
    if (_.isNil(element) || element.length !== 1) {
      throw new Error("element is not valid");
    }
  }

  #verifyField(field) {
    const filedName = _.get(field, "NAME", "");
    const isIncludes = _.includes(
      _.keys(HoneypotLoadingBar.UI_TREE),
      filedName,
    );
    if (!isIncludes) {
      throw new Error("field is not valid");
    }

    const isValid = _.get(HoneypotLoadingBar.UI_TREE, [filedName], null);
    if (!isValid) {
      throw new Error("field is not valid");
    }
  }

  #verifyData(value) {
    if (_.isNil(value)) {
      throw new Error("value is not valid");
    } else if ("" === value) {
      throw new Error("value is not valid");
    }
  }

  #getElement(fieldName) {
    return _.get(HoneypotLoadingBar.UI_TREE, [fieldName, "node", "el"], null);
  }

  #hasElement(fieldName) {
    const node = _.get(HoneypotLoadingBar.UI_TREE, [fieldName, "node"], null);
    return !_.isNil(_.get(node, "el", null));
  }

  #verifyElement(fieldName) {
    if (!this.#hasElement(fieldName)) {
      throw new Error("element is not valid");
    }
  }

  #handleChangeData(data) {
    const { fieldName, value } = data;

    this.#verifyData(value);
    this.#verifyElement(fieldName);

    const node = _.get(HoneypotLoadingBar.UI_TREE, [fieldName, "node"], null);

    this.#setElementValue(node.el, value);
  }

  #emitChangeEvent(fieldName, value) {
    this.#emitter.emit(HoneypotLoadingBar.EVENT.CHANGE, { fieldName, value });
  }

  #setElementValue(el, value) {
    const $el = el instanceof jQuery ? el : $(el);

    if ($el.length === 0) return;

    const tag = ($el.prop("tagName") || "").toLowerCase();
    const type = ($el.attr("type") || "").toLowerCase();

    // input 계열
    if (tag === "input") {
      switch (type) {
        case "checkbox":
          // 체크 여부만 보면 되는 경우
          $el.prop("checked", !!value);
          break;

        case "radio":
          // 라디오의 경우: name 그룹 중에서 value에 해당하는 걸 체크
          const name = $el.attr("name");
          if (name) {
            $(`input[type="radio"][name="${name}"]`).prop("checked", false);
            $(`input[type="radio"][name="${name}"][value="${value}"]`).prop(
              "checked",
              true,
            );
          }
          break;

        default:
          // text, number, hidden, password 등
          $el.val(value);
          break;
      }
      return;
    }

    // select, textarea
    if (tag === "select" || tag === "textarea") {
      $el.val(value);
      return;
    }

    // 그 외 엘리먼트 (div, span, p 등)
    $el.text(value == null ? "" : String(value));
  }

  #adjustColor(color, amount) {
    return (
      "#" +
      color
        .replace(/^#/, "")
        .replace(/../g, (color) =>
          (
            "0" +
            Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(
              16,
            )
          ).substr(-2),
        )
    );
  }
  /////////////////////////////////////
  // public method
  /////////////////////////////////////
  get isInitialized() {
    return this.#isInitialized;
  }

  initialize() {
    this.#elRoot = $(".honeypot-bar-area").css({ visibility: "hidden" });
    this.#parent.append(this.#elRoot);
    this.#psHoneyGuage = $("#honey_path");

    this.render();

    this.#elRoot.css("visibility", "visible");

    this.#isInitialized = true;
  }

  // add event listener
  addCallback(eventname, callback) {
    this.#verifyUI(this.#parent);

    this.#emitter.on(eventname, callback);
  }

  //set event listener
  setCallback(eventname, callback) {
    this.#verifyUI(this.#parent);

    this.#emitter.set(eventname, callback);
  }

  reset() {
    this.resetData();
    this.#parent.empty();
    this.#elRoot = null;
    this.#psHoneyGuage = null;
  }

  // reset data
  resetData() {
    // elements는 그대로두고 데이터만 리셋한다.
    _.forEach(_.values(HoneypotLoadingBar.UI_TREE), (field) => {
      //this.setData(field, null);
      field.node.data = null;
      field.node.el = null;
    });
  }

  // get data
  getData(field, defaultValue = null) {
    this.#verifyUI(this.#parent);
    this.#verifyField(field);

    return (
      _.get(HoneypotLoadingBar.UI_TREE, [field.NAME, "node", "data"]) ||
      defaultValue
    );
  }

  // set data
  setData(field, value, el = null, skipChangeEvent = false) {
    this.#verifyUI(this.#parent);
    this.#verifyField(field);
    this.#verifyData(value);

    // set data
    _.set(HoneypotLoadingBar.UI_TREE, [field.NAME, "node", "data"], value);

    // set element
    if (!_.isNil(el)) {
      _.set(HoneypotLoadingBar.UI_TREE, [field.NAME, "node", "el"], el);
    }

    // emit change event
    if (this.#hasElement(field.NAME) && !skipChangeEvent) {
      this.#emitChangeEvent(field.NAME, value);
    }
  }

  // 투명도
  setOpacity(value) {
    const newval = 100 - value;
    const opacity = newval * 0.01;

    this.#elRoot.css("opacity", opacity);
  }

  setCss(field, value) {
    this.#verifyField(field);
    this.#verifyData(value);
    this.#verifyElement(field.NAME);

    const el = this.#getElement(field.NAME);
    el.css(value);
  }

  setCssBySelector(selector, value) {
    $(selector).css(value);
  }

  addClassBySelector(selector, className) {
    $(selector).addClass(className);
  }

  removeClassBySelector(selector, className) {
    $(selector).removeClass(className);
  }

  hasClassBySelector(selector, className) {
    return $(selector).hasClass(className);
  }
  /**
   * lucky race board를 렌더링 함.
   */
  render() {
    const $labelArea = $(".label-area");
    this.renderTitle($labelArea);
    this.renderSubTitle($labelArea);
  }

  setGaugeValue(percent) {
    this.#verifyUI(this.#psHoneyGuage);

    if (this.#psHoneyGuage) {
      let visualScale = 0;
      if (percent > 0) {
        // 공식: (percent / 100) * (가용범위) + (최소 시작점)
        // 아래 수치는 꿀단지 모양에 따라 0.1 ~ 0.2 사이로 조정해 보세요.
        visualScale = Math.min(
          (Math.min(percent, 100) / 100) * 0.85 + 0.1,
          100,
        );
      }
      this.#psHoneyGuage.get(0).style.transform = `scaleY(${visualScale})`;
    }
  }

  // 게임 타이틀
  renderTitle($parent) {
    this.#verifyUI($parent);
    this.#verifyField(HoneypotLoadingBar.UI_TREE.TITLE);

    if (!$parent) return;

    const value = this.getData(HoneypotLoadingBar.UI_TREE.TITLE, "꿀단지(0개)");

    const el = $("#main_text");
    this.setData(HoneypotLoadingBar.UI_TREE.TITLE, value, el);

    return { el };
  }

  renderSubTitle($parent) {
    this.#verifyUI($parent);
    this.#verifyField(HoneypotLoadingBar.UI_TREE.SUB_TITLE);

    if (!$parent) return;

    const value = this.getData(
      HoneypotLoadingBar.UI_TREE.SUB_TITLE,
      "0개 (0%)",
    );

    const el = $("#sub_text");
    this.setData(HoneypotLoadingBar.UI_TREE.SUB_TITLE, value, el);

    return { el };
  }

  createFloatingAnimation(count = 1) {
    const num = 20;
    for (let i = 0; i < num; i++) {
      setTimeout(() => {
        this.floatingAnimation();
      }, i * 100);
    }
  }

  floatingAnimation() {
    const heartColor = HoneypotLoadingBar.#DEFAULT_ANI_BG_COLOR;
    const lightColor = this.#adjustColor(heartColor, 40);
    // Random rotation: 30도
    const randomRotation = Math.random() * 60 - 30;
    //const imgSize = 20;
    //const margin = 20;
    //const maxLeft = $(window).width() - (imgSize + margin);
    //const randomLeft = Math.max(Math.random() * maxLeft, margin);

    // viewport size 기반으로 계산. (8vmin 를 pixel로 변환)
    const vminInPx = Math.min(window.innerWidth, window.innerHeight) * 0.08;
    const margin = vminInPx;

    const maxLeft = $(window).width() - (vminInPx + margin);
    const randomLeft = Math.max(Math.random() * maxLeft, margin);

    const container = $('<div class="floating-heart-container"></div>');
    container.css({
      "--heart-bg-color": heartColor,
      "--heart-bg-light-color": lightColor,
    });

    const heart = $('<div class="floating-heart"></div>');
    container.append(heart);

    this.#elRoot.append(container);

    container.css({
      /* left: Math.random() * 90 + 'vw', */
      left: `${randomLeft}px`,
      transform: `rotate(${randomRotation}deg)`,
      animationDuration: Math.random() * 2 + 3 + "s",
    });

    setTimeout(function () {
      heart.remove();
    }, 5000);
  }

  overflow() {
    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        this.floatingAnimation();
      }, i * 100);
    }
  }
}
