class Battle {
  //
  static STATUS = { READY: 0, START: 1, STOP: 2 };
  static TIMER_STATUS = CountdownTimer.STATUS;

  // display root
  #rootEl = null;
  /** @type {BattleCompoment} */
  #component = null;

  #timer = new CountdownTimer();

  #scoreType = BattleCompoment.SCORE_TYPE.LEX;
  // 타이틀
  #title = "";
  // 점수 표시 여부
  #isScoreVisible = true;
  // 점수 차 표시 여부.
  #isScoreGapVisible = true;
  // 배틀 참여자 정보
  #battleInfo = null;;

  // 배틀 상태: 시작 종료
  #status = Battle.STATUS.STOP;
  // 타이머 상태: 시작 종료

  constructor(rootElement) {
    this.#rootEl = $(`#${rootElement}`);

    if (this.#verify()) {
      this.#rootEl = null;
    }

    this.#component = new BattleCompoment(this.#rootEl);
    this.#component.setScoreType(this.#scoreType);
    // FIXME TESTCODE
    this.#component.setBattleInfo(this.#battleInfo);
  }

  /////////////////////////////////////////////////////////////////////////
  // properties
  /////////////////////////////////////////////////////////////////////////
  get status() {
    return this.#status;
  }

  get isStartTimer() {
    return this.#timer.isStart;
  }

  get timerStatus() {
    return this.#timer.isStart;
  }

  get battleInfo() {
    return this.#battleInfo;
  }

  set battleInfo(battleInfo) {
    this.#battleInfo = battleInfo;
    this.#component.setBattleInfo(this.#battleInfo);
  }

  get scoreType() {
    return this.#scoreType;
  }

  set scoreType(type) {
    if (!_.isEmpty(type)) {
      this.#scoreType = type;
      this.#component.setScoreType(this.#scoreType);
    }
  }

  set setUesDifferenceScores(isShow) {
    this.#component.setUesDifferenceScores(!!isShow);
  }

  get isEndTimer() {
    return this.#timer.isEndTime;
  }

  /////////////////////////////////////////////////////////////////////////
  // public method
  /////////////////////////////////////////////////////////////////////////
  setComponent(component) {
    if (component instanceof BattleCompoment) {
      throw new Error("component must be BattleCompoment class");
    }

    this.#component = component;
  }

  async startBattle() {
    try {
      this.#verify();

      await this.#callApiStartBattle();

      this.#status = Battle.STATUS.START;
      // component display

      this.#component.render();
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async stopBattle() {
    try {
      this.#verify();

      await this.#callApiStartBattle();

      this.#status = Battle.STATUS.STOP;
      // component display
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  // timer time 설정
  setTime(seconds) {
    this.#verify();

    /* const targetTime = moment(Date.now()).add(seconds, "seconds");
    const hour = targetTime.hour();
    const minute = targetTime.minute();
    const second = targetTime.second(); */

    if (this.#timer.isStart) {
      this.#timer.stop();
    }

    this.#timer.setTime(seconds);
    const timestr = this.#timer.leftTimeString || '';

    this.#verifyComponent();
    this.#component.setTime(timestr);
  }

  // 타이머 시작
  startTimer() {
    this.#verify();

    if (this.#timer.isStart) {
      throw new Error("이미 시작 중 입니다.");
    }

    this.#timer.setCallback((data) => {
      this.#timerCallback(data);
    });

    this.#timer.start();
  }

  // timer 종료
  stopTimer() {
    this.#verify();

    if (!this.#timer.isStart) {
      throw new Error("이미 종료 되었습니다.");
    }

    // event listener 모두삭제 됨.
    this.#timer.stop();
  }

  // 화면 display
  render() {
    this.#verify();

    this.#component.render();
  }

  reRender() {
    this.#verify();

    this.#component.reRender();
  }

  receiveSponsor(mbmerId, sumAmount, sumContribution) {
    this.#verifyComponent();

    this.#component.receiveSponsor(mbmerId, sumAmount, sumContribution);
  }

  setTitle(title) {
    this.#verifyComponent();

    this.#component.setTitle(title);
  }

  setTitleCSS(cssname, cssvalue) {
    this.#verifyComponent();

    this.#component.setTitleCSS(cssname, cssvalue);
  }

  addTitleClass(className) {
    this.#verifyComponent();

    this.#component.addTitleClass(className);
  }

  removeTitleClass(className) {
    this.#verifyComponent();

    this.#component.removeTitleClass(className);
  }

  resetTeamSum() {
    this.#verifyComponent();

    this.#component.resetTeamSum();
  }

  /////////////////////////////////////////////////////////////////////////
  // private method
  /////////////////////////////////////////////////////////////////////////

  #timerCallback(data) {
    this.#verifyComponent();

    const [time] = data;

    this.#component.setTime(time ?? "00:00:00");
  }

  #verify() {
    if (_.isNil(this.#rootEl) || this.#rootEl.length !== 1) {
      this.#rootEl = null;
      throw new Error("root element must be one");
    }
  }

  #verifyComponent() {
    if (_.isNil(this.#component)) {
      this.#rootEl = null;
      throw new Error("Not found battle component");
    }
  }

  async #callApiStartBattle() {
    return Promise.resolve();
  }

  async #callApiStopBattle() {
    return Promise.resolve();
  }
}
