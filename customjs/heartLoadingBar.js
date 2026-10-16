class HeartLoadingBar {

  static UI_TREE = {
    TITLE: { NAME: "TITLE", node: { el: null, data: null } },
    SUB_TITLE: { NAME: "SUB_TITLE", node: { el: null, data: null } },
    OPACITY: { NAME: "OPACITY", node: { el: null, data: null } },
    GRAPH_BORDER: { NAME: "GRAPH_BORDER", node: { el: null, data: null } },
    NOTI_TEXT: { NAME: "NOTI_TEXT", node: { el: null, data: null } },
    NOTI_TEXT_INSIDE: { NAME: "NOTI_TEXT_INSIDE", node: { el: null, data: null } },
    COLOR_FONT: { NAME: "COLOR_FONT", node: { el: null, data: null } },
    COLOR_FONT_INSIDE: { NAME: "COLOR_FONT_INSIDE", node: { el: null, data: null } },
    COLOR_GRAPH_INSIDE: { NAME: "COLOR_GRAPH_INSIDE", node: { el: null, data: null } },
    COLOR_GRAPH_CIRCLE: { NAME: "COLOR_GRAPH_CIRCLE", node: { el: null, data: null } },
    FONT: { NAME: "FONT", node: { el: null, data: null } },
    FONT_BOLD: { NAME: "FONT_BOLD", node: { el: null, data: null } },
    FONT_SIZE: { NAME: "FONT_SIZE", node: { el: null, data: null } },
    FONT_STROKE: { NAME: "FONT_STROKE", node: { el: null, data: null } },
    FONT_STROKE_COLOR: { NAME: "FONT_STROKE_COLOR", node: { el: null, data: null } },
  }

  static createDefaultJson() {
    var jsonObj = {};

    jsonObj.win_transparency = 0;

    jsonObj.graph_type = "하트";
    jsonObj.graph_border = 50;

    jsonObj.heart_text = "하트후원";
    jsonObj.heart_inside_text = "{하트값}{개} ({퍼센트})";
    // 폰트색
    jsonObj.text_outside_color = "#ffffff";
    // 내부폰트색
    jsonObj.text_inside_color = "#ff6060";

    // 그래프내부색
    jsonObj.graph_background_color = "#dddddd";
    // 그래프 모양색
    jsonObj.graph_circle_color = "#ff6060";

    jsonObj.font_name = "ff-01";
    jsonObj.font_bold = "off";
    jsonObj.font_size = 22;
    jsonObj.font_outline = 2;
    jsonObj.font_outline_color = "#000000";

    return jsonObj;
  }

  static EVENT = {
    CHANGE: "CHANGE"
  }

  static DEFAULT_TARGET_VALUE = 10;
  static #pathData = "M200 251.67l-2.053-1.67c-44.96-36.62-57.136-49.51-57.136-70.45 0-17.213 14.01-31.22 31.224-31.22 14.386 0 22.518 8.17 27.97 14.315 5.448-6.146 13.58-14.315 27.968-14.315 17.215 0 31.22 14.007 31.22 31.22 0 20.94-12.175 33.83-57.134 70.45L200 251.67z";
  static #DEFAULT_HEART_BG_COLOR = '#ff6060';

  // event emitter
  #emitter = new EventEmitter();

  // parent element
  #parent = null;
  #elRoot = null;
  #psHeart = null;
  #isInitialized = false;

  /////////////////////////////////////
  // 생성자
  /////////////////////////////////////
  constructor(parent) {
    if (_.isNil(parent)) {
      throw new Error("");
    }

    this.#parent = parent;


    this.addCallback(HeartLoadingBar.EVENT.CHANGE, this.#handleChangeData.bind(this));
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
    const filedName = _.get(field, 'NAME', '');
    const isIncludes = _.includes(_.keys(HeartLoadingBar.UI_TREE), filedName);
    if (!isIncludes) {
      throw new Error("field is not valid");
    }

    const isValid = _.get(HeartLoadingBar.UI_TREE, [filedName], null);
    if (!isValid) {
      throw new Error("field is not valid");
    }
  }

  #verifyData(value) {
    if (_.isNil(value)) {
      throw new Error("value is not valid");
    } else if ('' === value) {
      throw new Error("value is not valid");
    }
  }

  #getElement(fieldName) {
    return _.get(HeartLoadingBar.UI_TREE, [fieldName, "node", 'el'], null);
  }

  #hasElement(fieldName) {
    const node = _.get(HeartLoadingBar.UI_TREE, [fieldName, "node"], null);
    return !_.isNil(_.get(node, 'el', null));
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

    const node = _.get(HeartLoadingBar.UI_TREE, [fieldName, "node"], null);

    this.#setElementValue(node.el, value);
  }


  #emitChangeEvent(fieldName, value) {
    this.#emitter.emit(HeartLoadingBar.EVENT.CHANGE, { fieldName, value });
  }

  #setElementValue(el, value) {
    const $el = (el instanceof jQuery) ? el : $(el);

    if ($el.length === 0) return;

    const tag = ($el.prop('tagName') || '').toLowerCase();
    const type = ($el.attr('type') || '').toLowerCase();

    // input 계열
    if (tag === 'input') {
      switch (type) {
        case 'checkbox':
          // 체크 여부만 보면 되는 경우
          $el.prop('checked', !!value);
          break;

        case 'radio':
          // 라디오의 경우: name 그룹 중에서 value에 해당하는 걸 체크
          const name = $el.attr('name');
          if (name) {
            $(`input[type="radio"][name="${name}"]`).prop('checked', false);
            $(`input[type="radio"][name="${name}"][value="${value}"]`).prop('checked', true);
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
    if (tag === 'select' || tag === 'textarea') {
      $el.val(value);
      return;
    }

    // 그 외 엘리먼트 (div, span, p 등)
    $el.text(value == null ? '' : String(value));
  }

  #adjustColor(color, amount) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
  }
  /////////////////////////////////////
  // public method
  /////////////////////////////////////
  get isInitialized() {
    return this.#isInitialized;
  }

  initialize() {
    this.render();

    this.#psHeart = new ldBar(".ldHeart", {
      type: "stroke",
      "stroke-trail": "#ddd",
      path: HeartLoadingBar.#pathData, //"M200 251.67l-2.053-1.67c-44.96-36.62-57.136-49.51-57.136-70.45 0-17.213 14.01-31.22 31.224-31.22 14.386 0 22.518 8.17 27.97 14.315 5.448-6.146 13.58-14.315 27.968-14.315 17.215 0 31.22 14.007 31.22 31.22 0 20.94-12.175 33.83-57.134 70.45L200 251.67z",
    });
    this.#psHeart.set(
      HeartLoadingBar.DEFAULT_TARGET_VALUE /* target value. */,
      true /* enable animation. default is true */
    );

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
    this.#psHeart = null;

  }

  // reset data
  resetData() {
    // elements는 그대로두고 데이터만 리셋한다.
    _.forEach(_.values(HeartLoadingBar.UI_TREE), (field) => {
      //this.setData(field, null);
      field.node.data = null;
      field.node.el = null;
    });
  }

  // get data
  getData(field, defaultValue = null) {
    this.#verifyUI(this.#parent);
    this.#verifyField(field);

    return _.get(HeartLoadingBar.UI_TREE, [field.NAME, "node", "data"]) || defaultValue;
  }

  // set data
  setData(field, value, el = null, skipChangeEvent = false) {
    this.#verifyUI(this.#parent);
    this.#verifyField(field);
    this.#verifyData(value);

    // set data
    _.set(HeartLoadingBar.UI_TREE, [field.NAME, "node", "data"], value);

    // set element
    if (!_.isNil(el)) {
      _.set(HeartLoadingBar.UI_TREE, [field.NAME, "node", "el"], el);
    }

    // emit change event
    if (this.#hasElement(field.NAME) && !skipChangeEvent) {
      this.#emitChangeEvent(field.NAME, value)
    }
  }

  // 투명도
  setOpacity(value) {
    const newval = 100 - value;
    const opacity = newval * 0.01;

    this.#elRoot.css("opacity", opacity);
  }

  setBorderWidth(value) {
    $(".baseline").css("strokeWidth", value + "px");
    $(".mainline").css("strokeWidth", value + "px");
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

  setGraphColor(color) {
    console.log("🔥 ~ HeartLoadingBar ~ setGraphColor ~ color:", color)
    this.setData(HeartLoadingBar.UI_TREE.COLOR_GRAPH_INSIDE, color);
    $(':root').get(0).style.setProperty('--heart-bg-color', color);
  }
  /**
   * lucky race board를 렌더링 함.
   */
  render() {
    this.#elRoot = $("<div>", { class: "heart-bar-area" }).css({ visibility: 'hidden' });
    this.#parent.append(this.#elRoot)

    this.renderTitle(this.#elRoot);

    const $elLayer = $(".ldBar.pNone");
    this.renderSubTitle($elLayer);
  }

  setGaugeValue(value, isAnimate = true) {
    this.#psHeart.set(
      value /* target value. */,
      isAnimate /* enable animation. default is true */
    );
  }

  // 게임 타이틀
  renderTitle($parent) {
    this.#verifyUI($parent);
    this.#verifyField(HeartLoadingBar.UI_TREE.TITLE);

    const value = this.getData(HeartLoadingBar.UI_TREE.TITLE, '하트후원');


    const el = $('<span>', { class: 'pro-title' },);
    const elLayout = $("<div>", { class: "ldBar label-center ldHeart t-gift pNone" }).css({ width: '100%', height: '100%' });
    elLayout.attr('data-value', 0);
    elLayout.attr('data-stroke-width', 4);
    elLayout.attr('data-stroke-trail-width', 4);
    elLayout.attr('data-stroke', '#ff6060');
    elLayout.attr('data-min', 0);
    elLayout.attr('data-max', 100);

    elLayout.append(el);

    $parent.append(elLayout);

    this.setData(HeartLoadingBar.UI_TREE.TITLE, value, el);

    return { elLayout, el }
  }

  renderSubTitle($parent) {
    this.#verifyUI($parent);
    this.#verifyField(HeartLoadingBar.UI_TREE.SUB_TITLE);

    const value = this.getData(HeartLoadingBar.UI_TREE.SUB_TITLE, '');

    if (!$parent) return;

    $(".temp_str_aaa").remove();
    const el = $("<span>", { class: 'ldBar-label t2 temp_str_aaa' });

    $parent.append(el);

    this.setData(HeartLoadingBar.UI_TREE.SUB_TITLE, value, el);

    return { elLayout: $parent, el }
  }


  createFloatingHeart(count = 1) {
    /*  const num = (count < 10) ? count :
       (count < 20) ? 10 : 20; */
    const num = 5;
    for (let i = 0; i < num; i++) {
      setTimeout(() => {
        this.floatingHeart();
      }, i * 100);
    }
  }

  floatingHeart() {

    const heartColor = this.getData(HeartLoadingBar.UI_TREE.COLOR_GRAPH_INSIDE) || HeartLoadingBar.#DEFAULT_HEART_BG_COLOR;
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
      '--heart-bg-color': heartColor,
      '--heart-bg-light-color': lightColor
    });


    const heart = $('<div class="floating-heart"></div>');;
    container.append(heart);

    this.#elRoot.append(container);

    container.css({
      /* left: Math.random() * 90 + 'vw', */
      left: `${randomLeft}px`,
      transform: `rotate(${randomRotation}deg)`,
      animationDuration: (Math.random() * 2 + 3) + 's'
    });

    setTimeout(function () {
      heart.remove();
    }, 5000);
  }

  overflow() {
    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        this.floatingHeart();
      }, i * 100);
    }
  }
}
