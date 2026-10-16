class LuckyRaceBoard {

  static UI_TREE = {
    AVAILABLE: { NAME: "AVAILABLE", node: { el: null, data: null } },
    GAMETYPE: { NAME: "GAMETYPE", node: { el: null, data: null } },
    TITLE: { NAME: "TITLE", node: { el: null, data: null } },
    ENTRYFEE: { NAME: "ENTRYFEE", node: { el: null, data: null } },
    ENTRYTITLE: { NAME: "ENTRYTITLE", node: { el: null, data: null } },
    ENTRYCOUNT: { NAME: "ENTRYCOUNT", node: { el: null, data: null } },
    ENTRYLIST: { NAME: "ENTRYLIST", node: { el: null, data: null } },
    ENTRYITEM: { NAME: "ENTRYITEM", node: { el: null, data: null } },
    TRACK: { NAME: "TRACK", node: { el: null, data: null } },
    REWARD1: { NAME: "REWARD1", node: { el: null, data: null } },
    REWARD2: { NAME: "REWARD2", node: { el: null, data: null } },
    REWARD3: { NAME: "REWARD3", node: { el: null, data: null } },
    NOTITYPE: { NAME: "NOTITYPE", node: { el: null, data: null } },
    NOTITEXT: { NAME: "NOTITEXT", node: { el: null, data: null } },
    CHATSOUND: { NAME: "CHATSOUND", node: { el: null, data: null } },
  }

  static EVENT = {
    CHANGE: "CHANGE"
  }

  // event emitter
  #emitter = new EventEmitter();

  // parent element
  #parent = null;
  #elRoot = null;



  /////////////////////////////////////
  // 생성자
  /////////////////////////////////////
  constructor(parent) {
    if (_.isNil(parent)) {
      throw new Error("");
    }

    this.#parent = parent;

    this.addCallback(LuckyRaceBoard.EVENT.CHANGE, this.#handleChangeData.bind(this));
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
    const isIncludes = _.includes(_.keys(LuckyRaceBoard.UI_TREE), filedName);
    if (!isIncludes) {
      throw new Error("field is not valid");
    }

    const isValid = _.get(LuckyRaceBoard.UI_TREE, [filedName], null);
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

  #hasElement(fieldName) {
    const node = _.get(LuckyRaceBoard.UI_TREE, [fieldName, "node"], null);
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

    const node = _.get(LuckyRaceBoard.UI_TREE, [fieldName, "node"], null);

    this.#setElementValue(node.el, value);
  }


  #emitChangeEvent(fieldName, value) {
    this.#emitter.emit(LuckyRaceBoard.EVENT.CHANGE, { fieldName, value });
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


  /////////////////////////////////////
  // public method
  /////////////////////////////////////
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


  // reset data
  resetData() {
    // elements는 그대로두고 데이터만 리셋한다.
    _.forEach(_.values(LuckyRaceBoard.UI_TREE), (field) => {
      this.setData(field, null);
    });
  }

  // get data
  getData(field, defaultValue = null) {
    this.#verifyUI(this.#parent);
    this.#verifyField(field);

    return _.get(LuckyRaceBoard.UI_TREE, [field.NAME, "node", "data"], defaultValue);
  }

  // set data
  setData(field, value, el = null, skipChangeEvent = false) {
    this.#verifyUI(this.#parent);
    this.#verifyField(field);
    this.#verifyData(value);

    // set data
    _.set(LuckyRaceBoard.UI_TREE, [field.NAME, "node", "data"], value);

    // set element
    if (!_.isNil(el)) {
      _.set(LuckyRaceBoard.UI_TREE, [field.NAME, "node", "el"], el);
    }

    // emit change event
    if (this.#hasElement(field.NAME) && !skipChangeEvent) {
      this.#emitChangeEvent(field.NAME, value)
    }
  }


  /**
   * lucky race board를 렌더링 함.
   */
  render() {
    this.#elRoot = $("<div>", { class: "card-txt alert" });
    this.#parent.append($("<li>", { class: "card-li" }).append(this.#elRoot))

    this.#renderRaceTitle(this.#elRoot);
    this.#renderEntryFee(this.#elRoot);
    this.#renderEntryTitle(this.#elRoot);
    const { el } = this.#renderEntryList(this.#elRoot);

    const value = this.getData(LuckyRaceBoard.UI_TREE.ENTRYLIST, '');
    _.forEach(value, (item, index) => {
      this.#renderEntryListItem(el, index);
    });
  }

  // 게임 타이틀
  #renderRaceTitle($parent) {
    this.#verifyUI($parent);
    this.#verifyField(LuckyRaceBoard.UI_TREE.TITLE);

    const value = this.getData(LuckyRaceBoard.UI_TREE.TITLE, '');
    console.log("🔥 ~ LuckyRaceBoard ~ value:", value)

    const el = $('<span>', { class: 'race-title' });
    const elLayout = $('<p>', { class: "word" }).append(el);
    $parent.append(elLayout);

    this.setData(LuckyRaceBoard.UI_TREE.TITLE, value, el);
  }


  // 참가 비용
  #renderEntryFee($parent) {
    this.#verifyUI($parent);
    this.#verifyField(LuckyRaceBoard.UI_TREE.ENTRYFEE);

    const value = this.getData(LuckyRaceBoard.UI_TREE.ENTRYFEE, '');

    const el = $('<span>', { class: 'time time-color ml-2' });
    const elLayout = $('<p>', { class: "word inner-time mb-3 mt-2" })
      .append("참가비: ")
      .append(el);
    $parent.append(elLayout);

    this.setData(LuckyRaceBoard.UI_TREE.ENTRYFEE, value, el);

    return { elLayout, el };
  }

  // entry title
  #renderEntryTitle($parent) {
    this.#verifyUI($parent);
    this.#verifyField(LuckyRaceBoard.UI_TREE.ENTRYTITLE);

    const value = this.getData(LuckyRaceBoard.UI_TREE.ENTRYTITLE, '');

    const el = $('<span>', { class: 'race-entry' });
    const elLayout = $('<p>', { class: "word mb-2" }).append(el);
    $parent.append(elLayout);

    this.setData(LuckyRaceBoard.UI_TREE.ENTRYTITLE, value, el);

    return { elLayout, el };
  }

  // entry list
  #renderEntryList($parent) {
    this.#verifyUI($parent);
    this.#verifyField(LuckyRaceBoard.UI_TREE.ENTRYLIST);


    const value = this.getData(LuckyRaceBoard.UI_TREE.ENTRYLIST, '');


    const elLayout = $('<div>', { class: "ml-2" });
    $parent.append(elLayout);

    this.setData(LuckyRaceBoard.UI_TREE.ENTRYLIST, value, elLayout, true);

    return { elLayout, el: elLayout };
  }

  // entry item
  #renderEntryListItem($parent, index) {
    this.#verifyUI($parent);
    this.#verifyField(LuckyRaceBoard.UI_TREE.ENTRYITEM);

    const listValue = this.getData(LuckyRaceBoard.UI_TREE.ENTRYLIST, '');

    const value = _.get(listValue, [index], '');

    const el = $('<span>', { text: `${index + 1}. ` });
    const elLayout = $('<div>')
      .append(el)
      .append(value);

    $parent.append(elLayout);

    this.setData(LuckyRaceBoard.UI_TREE.ENTRYITEM, value, el);

    return { elLayout, el };
  }
}
