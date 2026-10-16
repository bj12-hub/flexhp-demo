class BattleCompoment {
  static DEFAULT_COLOR = "#FFFFFF";
  static DEFAULT_SKIP_COLOR = "#00000000";
  static VS_TXT = "VS";
  static SCORE_TYPE = { LEX: 'lex', RATE: 'rate' };

  static MODE = {
    SINGLE: 1,
    MULTI: 2,
  };
  // parent element
  #parent = null;
  // {title, teams[ { teamId, teamName, members: [{nickname, memberId}, ...], options: { lex,rate, colors: {bg, name, win } } },  ]}
  #battleInfo = null;

  #battleMode = BattleCompoment.MODE.SINGLE;
  #scoreType;

  #battleContainer = null;
  // title
  #titleEl = null;
  // vs area
  #vsAreaEl = null;

  // 점수차 표시
  #useDifferenceScores = false;
  #differenceScoresEl = null;

  // timer
  #timerEl;
  #vsEl;

  #uniqueIdMap = {};

  #theme = '';
  // vs area

  // timer elements

  // vs elements

  //guage bar

  constructor(parent, battleInfo = null) {
    if (_.isNil(parent)) {
      throw new Error("");
    }

    this.#parent = parent;
    this.setBattleInfo(battleInfo);
  }

  /////////////////////////////////////////////////////////////
  // properties
  /////////////////////////////////////////////////////////////
  get theme() {
    return this.#theme;
  }

  set theme(themename) {
    return this.#theme = themename ?? '';
  }

  get isSingleMode() {
    return this.#battleMode === BattleCompoment.MODE.SINGLE;
  }

  get isMultiMode() {
    return !this.isSingleMode;
  }

  /////////////////////////////////////////////////////////////
  // public method
  /////////////////////////////////////////////////////////////
  setScoreType(type) {
    if (!_.isEmpty(type)) {
      this.#scoreType = type;
    }
  }

  setBattleInfo(battleInfo) {
    this.#battleInfo = battleInfo;
    const len = _.get(battleInfo, "teams", []).length;

    this.#battleMode =
      len > 2 ? BattleCompoment.MODE.MULTI : BattleCompoment.MODE.SINGLE;
  }

  render() {
    this.#build();
  }

  reRender() {
    this.#verifyUI(this.#parent);

    if (!_.isNil(this.#battleContainer) && 0 < this.#battleContainer.length) {
      this.#parent.append(this.#battleContainer);
    } else {
      this.#build();
    }
  }

  // timer 셋팅
  setTime(timStr) {
    if (_.isNil(this.#timerEl) || 0 === this.#timerEl.length) {
      return;
    }

    this.#timerEl.text(timStr);
  }

  // title ////////////////////////////////////////////////////////////////////////////////
  setTitle(title) {
    if (_.isNil(this.#titleEl) || 0 === this.#titleEl.length) {
      return;
    }

    const strTitle = title ?? "";
    const selector = this.#titleEl.attr('id');
    $(`[id="${selector}"]`).text(strTitle);
  }

  addTitleClass(className) {
    if (_.isNil(this.#titleEl) || 0 === this.#titleEl.length) {
      return;
    }
    const selector = this.#titleEl.attr('id');
    $(`[id="${selector}"]`).addClass(className);
  }

  removeTitleClass(className) {
    if (_.isNil(this.#titleEl) || 0 === this.#titleEl.length) {
      return;
    }
    const selector = this.#titleEl.attr('id');
    $(`[id="${selector}"]`).removeClass(className);
  }

  setTitleCSS(cssname, cssvalue) {
    if (_.isNil(this.#titleEl) || 0 === this.#titleEl.length) {
      return;
    }
    const selector = this.#titleEl.attr('id');
    $(`[id="${selector}"]`).css(cssname, cssvalue);
  }

  // receive sponsorship
  receiveSponsor(memberId, sumAmount, sumContribution) {
    const team = this.#findTeamByMemberid(memberId);
    if (_.isNil(team)) {
      return;
    }

    const {
      el: { setScore, guagefill },

    } = team;
    if (_.isNil(setScore) || _.isNil(guagefill)) {
      return;
    }

    setScore(sumAmount, sumContribution);

    this.#renderGuage();
    this.#setDifferenceScore();
  }

  resetTeamSum() {
    this.#verifyBattleData();
    this.#verifyUI(this.#parent);

    const teams = _.get(this.#battleInfo, "teams", []);

    teams.forEach((team) => {
      const { teamId } = team;
      const teamInfo = this.#uniqueIdMap[teamId];
      if (!_.isNil(teamInfo)) {
        const {
          el: { setScore, guagefill },
        } = teamInfo;

        setScore(0, 0);
        this.#renderGuage();
      }
    })

    this.#setDifferenceScore();
  }

  setUesDifferenceScores(isShow) {
    this.#useDifferenceScores = isShow;
  }
  /////////////////////////////////////////////////////////////
  // private method
  /////////////////////////////////////////////////////////////
  #verifyUI(element) {
    if (_.isNil(element) || element.length !== 1) {
      throw new Error("element is not valid");
    }
  }

  #verifyBattleData() {
    if (_.isNil(this.#battleInfo)) {
      throw new Error("battle info is nil");
    }
  }

  #findTeamByMemberid(memberId) {
    this.#verifyBattleData();

    const teamInfo = this.#uniqueIdMap[memberId];
    return teamInfo;
  }

  #getTotalScore() {
    this.#verifyBattleData();

    const { teams } = this.#battleInfo;
    const total = (teams || []).reduce((total, team) => {
      const score = this.#isLexScoreType() ?
        _.get(team, ["options", "sumLex"], 0) :
        _.get(team, ["options", "sumRate"], 0);

      total = total + Math.max(0, Number(score));
      return total;
    }, 0);

    return total;
  }

  #getWinnerTeam() {
    this.#verifyBattleData();

    const { teams } = this.#battleInfo;
    const winner = [];
    teams.forEach((team) => {
      const propertyName = this.#isLexScoreType() ? "sumLex" : "sumRate";

      const score = Number(_.get(team, ["options", propertyName], 0));
      const winLex = Number(_.get(winner, [0, "options", propertyName], 0));

      if (_.isEmpty(winner) || winLex === score) {
        winner.push(team);
      } else if (winLex < score) {
        winner.length = 0;
        winner.push(team);
      }
    });

    return winner;
  }

  #isLexScoreType() {
    return this.#scoreType === BattleCompoment.SCORE_TYPE.LEX;
  }

  #build() {
    this.#parent.empty();

    this.#battleContainer = $("<div>", { class: "battle-container" }).appendTo(
      this.#parent
    );

    // title
    this.#buildTitle().appendTo(this.#battleContainer);

    // timer(only show mode is multi)
    if (this.isMultiMode) {
      this.#buildTimerForMulti().appendTo(this.#battleContainer);
    }

    // vs container
    this.#buildVSArea().appendTo(this.#battleContainer);

    // member guage
    (this.#buildTeam() || []).forEach((e) => {
      e.appendTo(this.#vsAreaEl);
    });

    // timer
    if (this.isSingleMode) {
      this.#buildTimerForSingle().appendTo(this.#vsAreaEl);
    }

    // difference conatiner
    this.#buildTeamDifferenceScores().appendTo(this.#battleContainer);

    // 초기셋팅
    this.#renderGuage();
    this.#setDifferenceScore();
  }

  // 타이틀 설정
  #buildTitle(title = null) {
    const titleTxt = title ?? _.get(this.#battleInfo, "title", "");

    this.#titleEl = $("<div>", {
      id: "battle-title",
      class: "battle-title",
      text: titleTxt ?? "",
    });

    return this.#titleEl;
  }

  // 점수 차
  #buildTeamDifferenceScores(team) {
    this.#differenceScoresEl = $("<div>", { class: "differencescores-area" });
    $("<div>", { class: "differencescores d-flex w-100 justify-content-center" }, { text: '' }).appendTo(this.#differenceScoresEl);

    return this.#differenceScoresEl;
  }

  // guage bar 컨테이너
  #buildVSArea() {
    this.#vsAreaEl = $("<div>", { class: "vs-area" });

    return this.#vsAreaEl;
  }

  // team guage bar
  #buildTeam() {
    const teams = _.get(this.#battleInfo, "teams", []);
    if (0 === (teams || []).length) {
      return;
    }

    const _teams_ = [...teams];
    // 첫번째 사용자
    let team = _teams_.shift();
    this.#buildTeamGuageBar(team, "left").appendTo(this.#vsAreaEl);

    if (this.isSingleMode) {
      team = _teams_.shift();
      this.#buildTeamGuageBar(team, "right").appendTo(this.#vsAreaEl);
    } else {
      _teams_.forEach((member) => {
        this.#buildTeamVS().appendTo(this.#vsAreaEl);
        this.#buildTeamGuageBar(member, "left").appendTo(this.#vsAreaEl);
      });
    }
  }

  // multi mode -> VS text
  #buildTeamVS() {
    const parent = $("<div>", { class: "center center-multi" });
    const shield = $("<div>", { class: "shield shield-multi-vs" }).appendTo(
      parent
    );

    shield.append($("<div>", { class: "vs", text: BattleCompoment.VS_TXT }));

    return parent;
  }

  // guage bar
  #buildTeamGuageBar(team, postfix) {
    if (_.isNil(team)) {
      return;
    }
    const {
      teamId,
      teamName,
      members,
      options: {
        lex, rate,
        sumLex = 0,
        sumRate = 0,
        colors: { bg, name: nameColor, win: winnerColor, score: scoreColor },
      },
    } = team;

    /* const total = this.#getTotalScore();
    const scorePoint = this.#isLexScoreType() ? lex : rate; */

    //const percent = total === 0 ? 0 : (Number(scorePoint) / total) * 100;

    const bjNickname = teamName || (members || []).map((m) => m.nickname).join(", ");

    const parent = $("<div>", { class: `team team-${postfix}` });
    const guageBar = $("<div>", {
      class: `gauge-bar gauge-bar-${postfix}`,
    }).appendTo(parent);

    // score
    const score = $("<div>", { class: "score", text: 0 }).appendTo(guageBar);

    // guage bar
    const guagefill = $("<div>", {
      class: `gauge-fill-${postfix}`,
      name: `bar-${postfix}`,
    }).appendTo(guageBar);

    // bj name
    const nickname = $("<div>", { class: "names", text: bjNickname || "-" }).appendTo(
      parent
    );

    // make member map
    const mapData = {
      team,
      el: {
        score: score,
        setScore: (sumAmount, sumContribution) => {
          const sumLex = (Number(lex) + Number(sumAmount));
          const sumRate = (Number(rate) + Number(sumContribution));
          const scoreSum = this.#isLexScoreType() ? sumLex : sumRate;

          team.options.score = scoreSum;
          team.options.sumLex = sumLex;
          team.options.sumRate = sumRate;

          score.text(scoreSum.toLocaleString());
        },
        guagefill,
        nickname,
        setGuageFill(percent) {
          guagefill.css("width", percent + "%");
        },
        setBackground(color) {
          guagefill.css(
            "background",
            `linear-gradient(to bottom, ${color}, ${color})`
          );
        },
        setNameColor(color) {
          nickname.css("color", color);
        },
        setWinnerTeamColor(team, color) {
          if (teamId === team.teamId) {
            nickname.css("color", color);
          }
        },
        setScoreColor(color) {
          score.css("color", color);
        },
      },
    };

    // set score

    mapData.el.setScore(sumLex, sumRate);

    // set guage-fill
    //mapData.el.setGuageFill(percent);
    // 스타일적용
    //this.#setGuageStyle(mapData, team);

    // make map
    (members || []).forEach((m) => {
      this.#uniqueIdMap[m.memberId] = mapData;
      this.#uniqueIdMap[teamId] = mapData;
    });

    return parent;
  }

  #setDifferenceScore() {
    this.#verifyBattleData();
    // 점수차 표시하지 않음.
    if (!this.#useDifferenceScores) {
      return;
    }

    // componet 초기화
    if (!this.#differenceScoresEl || 0 === this.#differenceScoresEl.length) return;

    // 멀티 모드일경우 사용하지 않음.
    if (!this.isSingleMode) {
      return;
    }
    // single 모드일 경우에민 표시 함.

    const { teams } = this.#battleInfo;
    const first = this.#isLexScoreType() ?
      _.get(teams[0], ["options", "sumLex"], 0) :
      _.get(teams[0], ["options", "sumRate"], 0);

    const seconds = this.#isLexScoreType() ?
      _.get(teams[1], ["options", "sumLex"], 0) :
      _.get(teams[1], ["options", "sumRate"], 0);


    const differenceScore = Math.abs(first - seconds) ?? 0;
    this.#differenceScoresEl.find('.differencescores').text(differenceScore)
  }

  #renderGuage() {
    this.#verifyBattleData();

    const total = this.#getTotalScore();
    const { teams } = this.#battleInfo;

    (teams || []).forEach((team) => {
      const teamInfo = this.#uniqueIdMap[team.teamId];
      const {
        el: { setGuageFill },
        team: {
          options: { sumLex = 0, sumRate = 0 },
        },
      } = teamInfo;

      const score = this.#isLexScoreType() ? sumLex : sumRate;

      const percent = total === 0 ? 0 : (Math.max(0, score) / total) * 100;

      setGuageFill(percent);

      this.#setGuageStyle(teamInfo, team);
    });
  }

  #isSkipColor(color) {
    return color === BattleCompoment.DEFAULT_SKIP_COLOR;
  }

  #isTransparetColor(color, isARGB = true) {
    if (_.isEmpty(color) || _.isNil(color)) return true;

    const isTransparent = isARGB ? color.startsWith('#00') : color.endsWith('00');
    if (9 === color.length && isTransparent) {
      return true;
    }

    return false;
  }

  #chekcSkipColor(color) {
    return this.#isSkipColor(color) ? BattleCompoment.DEFAULT_COLOR : color;
  }

  #setGuageStyle(mapData, team) {
    if (_.isNil(team)) {
      return;
    }

    const {
      options: {
        colors: { bg, name: nameColor, win: winnerColor, score: scoreColor },
      },
    } = team;

    const winner = this.#getWinnerTeam();
    const winnerTeam = 1 === winner.length ? winner[0] : null;

    // bg 설정
    if (!_.isNil(bg) && !this.#isTransparetColor(bg)) {
      mapData.el.setBackground(this.#convertARGBToRGBA(bg));
    }
    // name color
    if (!_.isNil(nameColor)) {
      const ncolor = this.#chekcSkipColor(nameColor);
      mapData.el.setNameColor(this.#convertARGBToRGBA(ncolor));
    }
    //win team color
    if (!_.isNil(winnerTeam)) {
      mapData.el.setWinnerTeamColor(winnerTeam, this.#convertARGBToRGBA(winnerColor));
    }
    // score color
    if (!_.isNil(scoreColor)) {
      mapData.el.setScoreColor(this.#convertARGBToRGBA(scoreColor));
    }
  }

  #convertARGBToRGBA(argbHex) {
    if (9 === argbHex.length) {
      return `#${argbHex.slice(3)}${argbHex.slice(1, 3)}`;
    } else {
      return argbHex;
    }
  }

  // timer
  #buildTimerForSingle() {
    if (this.isMultiMode) return;

    const parent = $("<div>", { class: "center" });
    const shield = $("<div>", { class: "shield" }).appendTo(parent);

    this.#timerEl = $("<div>", {
      class: "timer",
      name: "time",
      text: "00:00:00",
    }).appendTo(shield);

    this.#vsEl = $("<div>", {
      class: "vs",
      text: BattleCompoment.VS_TXT,
    }).appendTo(shield);

    return parent;
  }

  // timer for multi
  #buildTimerForMulti() {
    if (this.isSingleMode) return;

    const parent = $("<div>", { class: "shield shield-multi" });

    this.#timerEl = $("<div>", {
      class: "timer",
      name: "timer",
      text: "00:00:00",
    }).appendTo(parent);

    return parent;
  }
}
