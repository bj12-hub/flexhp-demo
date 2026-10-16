class Team {
  static THEME_TYPE = {
    TEAM: "team",
    BATTLE: "battle"
  }
  static STATUS = { READY: 0, START: 1, STOP: 2 };
  static TIMER_STATUS = CountdownTimer.STATUS;


  // display root
  #rootEl = null;
  /** @type {BattleCompoment} */
  #componentBattle = null;
  /** @type {ExcelTeamCompoment} */
  #componentTeam = null;

  #timer = new CountdownTimer();

  #scoreType = BattleCompoment.SCORE_TYPE.LEX;
  #themeType = Team.THEME_TYPE.TEAM;

  // 배틀 참여자 정보
  #teamInfo = null;

  // 배틀 상태: 시작 종료
  #status = Team.STATUS.STOP;
  // 타이머 상태: 시작 종료

  constructor(rootElement, themeType = null) {
    this.#rootEl = $(rootElement);
    if (this.#verify()) {
      this.#rootEl = null;
    }

    this.#themeType = themeType;
    this.#componentTeam = new ExcelTeamCompoment(this.#rootEl, this.#teamInfo);
    //this.#componentTeam.setScoreType(this.#scoreType);
    this.#componentTeam.setTeamInfo(this.#teamInfo);


    this.#componentBattle = new BattleCompoment(this.#rootEl);
    this.#componentBattle.setScoreType(this.#scoreType);
    this.#componentBattle.setBattleInfo(this.#teamInfo);
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

  get teamInfo() {
    return this.#teamInfo;
  }

  set teamInfo(teamInfo) {
    this.#teamInfo = teamInfo;

    //this.#componentBattle.setTeamInfo(this.#teamInfo);
    if (this.isTeamType) {
      this.#componentTeam.setTeamInfo(this.#teamInfo);
    } else {
      this.#componentBattle.setBattleInfo(this.#teamInfo);
    }
  }

  get scoreType() {
    return this.#scoreType;
  }

  set scoreType(type) {
    if (!_.isEmpty(type)) {
      this.#scoreType = type;
      if (this.isTeamType) {
        this.#componentTeam.setScoreType(this.#teamInfo);
      } else {
        this.#componentBattle.setScoreType(this.#scoreType);
      }
    }
  }

  set setUesDifferenceScores(isShow) {
    this.#verifyBattleType();
    this.#componentBattle.setUesDifferenceScores(!!isShow);

  }

  get isEndTimer() {
    return this.#timer.isEndTime;
  }

  set theme(theme) {
    if (_.isEmpty(theme)) {
      throw new Error("Theme name is empty.")
    }

    this.#themeType = theme.startsWith('theme-team') ? Team.THEME_TYPE.TEAM : Team.THEME_TYPE.BATTLE;

    if (_.isNil(this.component)) {
      throw new Error("Component is null")
    }

    this.component.theme = theme;
  }

  get isTeamType() {
    return this.#themeType === Team.THEME_TYPE.TEAM;
  }

  get component() {
    return this.isTeamType ? this.#componentTeam : this.#componentBattle;
  }

  /////////////////////////////////////////////////////////////////////////
  // public method
  /////////////////////////////////////////////////////////////////////////
  setComponent(component) {
    if (component instanceof BattleCompoment) {
      this.#componentBattle = component;
    } else if (component instanceof ExcelTeamCompoment) {
      this.#componentTeam = component;
    } else {
      throw new Error("The component must be a BattleCompoment or an ExcelTeamCompoment class");
    }
  }

  async startBattle() {
    try {
      this.#verify();

      await this.#callApiStartTeam();

      this.#status = Team.STATUS.START;
      // component display

      this.component.render();
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async stopBattle() {
    try {
      this.#verify();

      await this.#callApiStartTeam();

      this.#status = Team.STATUS.STOP;
      // component display
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  // timer time 설정
  setTime(seconds) {
    this.#verify();
    this.#verifyBattleType();

    if (this.#timer.isStart) {
      this.#timer.stop();
    }

    this.#timer.setTime(seconds);
    const timestr = this.#timer.leftTimeString || '';

    this.#verifyComponent();
    this.#componentBattle.setTime(timestr);
  }

  // 타이머 시작
  startTimer() {
    this.#verify();
    this.#verifyBattleType();

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
    this.#verifyBattleType();


    if (!this.#timer.isStart) {
      throw new Error("이미 종료 되었습니다.");
    }

    // event listener 모두삭제 됨.
    this.#timer.stop();
  }

  // 화면 display
  render() {
    this.#verify();

    this.component.render();
  }

  reRender() {
    this.#verify();

    this.component.reRender();
  }

  receiveSponsor(team) {
    this.#verifyComponent();

    if (this.isTeamType) {
      this.component.receiveSponsor(team);
    } else {
      const { options: { sumLex, sumRate } } = team;
      const memberId = _.get(team, ["members", 0, "memberId"])
      this.component.receiveSponsor(memberId, sumLex, sumRate);
    }
  }

  setTitle(title) {
    this.#verifyComponent();

    this.component.setTitle(title);
  }

  setTitleCSS(cssname, cssvalue) {
    this.#verifyComponent();

    this.component.setTitleCSS(cssname, cssvalue);
  }

  addTitleClass(className) {
    this.#verifyComponent();

    this.component.addTitleClass(className);
  }

  removeTitleClass(className) {
    this.#verifyComponent();

    this.component.removeTitleClass(className);
  }

  resetTeamSum() {
    this.#verifyComponent();

    this.component.resetTeamSum();
  }

  applyStyle() {
    this.#verifyComponent();

    if (this.isTeamType) {
      this.component.applyStyle();
    }
  }

  // only team type ////////////////////////////////////////////////
  setItemFontBold(fontBold) {
    this.#verifyTeamType();

    this.#componentTeam.setItemFontBold(fontBold);

  }

  setItemFontName(fontName) {
    this.#verifyTeamType();

    this.#componentTeam.setItemFontName(fontName);
  }

  setItemFontSize(fontsize) {
    this.#verifyTeamType();

    this.#componentTeam.setItemFontSize(fontsize);
  }

  setRateColor(color) {
    this.#verifyTeamType();

    this.#componentTeam.setRateColor(color);
  }

  setLexColor(color) {
    this.#verifyTeamType();

    this.#componentTeam.setLexColor(color);
  }

  setBjColor(color) {
    this.#verifyTeamType();

    this.#componentTeam.setBjColor(color);
  }

  setTeamColor(color) {
    this.#verifyTeamType();

    this.#componentTeam.setTeamColor(color);
  }

  setTitleOutline(color, width) {
    this.#verifyTeamType();

    this.#componentTeam.setTitleOutline(color, width);
  }

  addItemClass(classname) {
    this.#verifyTeamType();

    this.#componentTeam.addItemClass(classname);

  }

  removeItemClass(classname) {
    this.#verifyTeamType();

    this.#componentTeam.removeItemClass(classname);
  }

  /////////////////////////////////////////////////////////////////////////
  // private method
  /////////////////////////////////////////////////////////////////////////
  #verifyTeamType() {
    if (!this.isTeamType) {
      throw new Error('[WARN] Unsupported method.');
    }
  }

  #verifyBattleType() {
    if (this.isTeamType) {
      throw new Error('[WARN] Unsupported method.');
    }
  }

  #timerCallback(data) {
    this.#verifyComponent();

    const [time] = data;

    this.#componentBattle.setTime(time ?? "00:00:00");
  }

  #verify() {
    if (_.isNil(this.#rootEl) || this.#rootEl.length !== 1) {
      this.#rootEl = null;
      throw new Error("root element must be one");
    }
  }

  #verifyComponent() {
    if (_.isNil(this.component)) {
      this.#rootEl = null;
      throw new Error("Not found battle component");
    }
  }

  async #callApiStartTeam() {
    return Promise.resolve();
  }

  async #callApiStopTeam() {
    return Promise.resolve();
  }
}
