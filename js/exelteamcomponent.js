class ExcelTeamCompoment {
  static DEFAULT_COLOR = "#FFFFFF";
  static DEFAULT_SKIP_COLOR = "#00000000";
  static ANIMATE_CLASS_HEARTBEAT = "animated heartBeat";

  static SCORE_TYPE = { LEX: 'lex', RATE: 'rate' };

  // parent element
  #parent = null;
  #teamInfo = null;

  #sortType;

  #container = null;
  // title
  #titleEl = null;
  #excelAreaEl = null;
  #excelTableEl = null;
  #colors = {
    team: null,
    bj: null,
    lex: null,
    rate: null
  }
  #item = {
    fontSize: null,
    fontName: null,
    fontBold: null,
  }

  #uniqueIdMap = { member: {}, team: {} };

  #theme = '';

  constructor(parent, teamInfo = null) {
    if (_.isNil(parent)) {
      throw new Error("");
    }

    this.#parent = parent;
    this.setTeamInfo(teamInfo);
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

  /////////////////////////////////////////////////////////////
  // public method
  /////////////////////////////////////////////////////////////
  setScoreType(type) {
    if (!_.isEmpty(type)) {
      this.#sortType = type;
    }
  }

  setTeamInfo(teamInfo) {
    this.#teamInfo = teamInfo;
    if (!_.isNil(teamInfo)) {
      const sort = _.get(teamInfo, 'sort');
      this.setScoreType(sort)
    }
  }

  render() {
    this.#build();
  }

  reRender() {
    this.#verifyUI(this.#parent);

    if (!_.isNil(this.#container) && 0 < this.#container.length) {
      this.#parent.append(this.#container);
    } else {
      this.#build();
    }
  }

  applyStyle() {
    const { teams = [] } = this.#teamInfo;

    for (let team of teams) {
      const {
        teamId,
        options: {
          colors: { bg: bgColor, name: nameColor },
        },
      } = team;


      const mapData = this.#uniqueIdMap.team[teamId];
      if (_.isNil(mapData)) {
        return;
      }

      const {
        el: {
          setTeamHeaderColor,
          setNicknameColor
        }
      } = mapData;

      if (!this.#isTransparetColor(nameColor)) {
        setNicknameColor(this.#convertARGBToRGBA(nameColor));
      }

      if (!this.#isTransparetColor(bgColor)) {
        setTeamHeaderColor(this.#convertARGBToRGBA(bgColor));
      }
    }
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

  setTitleOutline(color, width) {
    const selector = this.#titleEl.attr('id');
    $(`[id="${selector}"]`).css('text-shadow', `${width}px ${width}px ${width}px ${color}`);
  }

  setTeamColor(color) {
    this.#colors.team = color;

    if (_.isNil(this.#colors.team)) {
      return;
    }

    $('.team-header').css('color', this.#colors.team);
  }

  setBjColor(color) {
    this.#colors.bj = color;

    if (_.isNil(this.#colors.bj)) {
      return;
    }

    $('.team-member-name').css('color', this.#colors.bj);
  }

  setLexColor(color) {
    this.#colors.lex = color;

    this.#colors.lex = color;
    if (_.isNil(this.#colors.lex)) {
      return;
    }

    $('.team-member-amount').css('color', this.#colors.lex);
  }

  setRateColor(color) {
    this.#colors.rate = color;

    this.#colors.rate = color;
    if (_.isNil(this.#colors.rate)) {
      return;
    }

    $('.team-member-rate').css('color', this.#colors.rate);
  }

  setItemFontSize(fontsize) {
    this.#item.fontSize = fontsize;

    const selector = this.#excelTableEl.attr('id');
    $(`[id="${selector}"]`).find('tbody td').css('font-size', `${this.#item.fontSize}px`);
  }

  setItemFontName(fontName) {
    this.#item.fontName = fontName;

    const selector = this.#excelTableEl.attr('id');
    $(`[id="${selector}"]`).find('tbody').addClass(this.#item.fontName);
  }

  setItemFontBold(fontBold) {
    this.#item.fontBold = fontBold;

    const selector = this.#excelTableEl.attr('id');
    if ('on' === this.#item.fontBold) {
      $(`[id="${selector}"]`).find('tbody').addClass("font-weight-bold");
    } else {
      $(`[id="${selector}"]`).find('tbody').removeClass("font-weight-bold");
    }
  }

  addItemClass(classname) {
    const selector = this.#excelTableEl.attr('id');
    $(`[id="${selector}"]`).find('tbody').addClass(classname);
  }

  removeItemClass(classname) {
    const selector = this.#excelTableEl.attr('id');
    $(`[id="${selector}"]`).find('tbody').removeClass(classname);
  }

  // receive sponsorship
  receiveSponsor(teamData) {
    const { teamId } = teamData;
    const mapData = this.#findTeamByTeamid(teamId);
    if (_.isNil(mapData)) {
      return;
    }

    const {
      el: { setTeam },
    } = mapData;

    if (_.isNil(setTeam)) {
      return;
    }

    setTeam(teamData);
  }

  resetTeamSum() {
    this.#verifyTeamData();
    this.#verifyUI(this.#parent);

    this.#renderExcel();
  }


  /////////////////////////////////////////////////////////////
  // private method
  /////////////////////////////////////////////////////////////
  #verifyUI(element) {
    if (_.isNil(element) || element.length !== 1) {
      throw new Error("element is not valid");
    }
  }

  #verifyTeamData() {
    if (_.isNil(this.#teamInfo)) {
      throw new Error("battle info is nil");
    }
  }

  #findTeamByTeamid(teamId) {
    this.#verifyTeamData();

    const teamInfo = this.#uniqueIdMap.team[teamId];
    return teamInfo;
  }

  #getTotalScoreBy(teamId) {
    this.#verifyTeamData();

    const { teams } = this.#teamInfo;
    const team = teams.filter((v) => v.teamId === teamId);

    if (_.isNil(team)) return 0;


    const score = this.#isLexScoreType() ?
      _.get(team, ["options", "sumLex"], 0) :
      _.get(team, ["options", "sumRate"], 0);

    const total = Math.max(0, Number(score));
    return total;
  }


  #isLexScoreType() {
    return this.#sortType === BattleCompoment.SCORE_TYPE.LEX;
  }

  #build() {
    this.#parent.empty();

    this.#container = $("<div>", { class: "team-container" }).appendTo(
      this.#parent
    );

    // title
    this.#buildTitle().appendTo(this.#container);

    // vs container
    this.#buildExcelArea().appendTo(this.#container);

    // team
    this.#buildTeam()
  }

  // 타이틀 설정
  #buildTitle(title = null) {
    const titleTxt = title ?? _.get(this.#teamInfo, "title", "");

    this.#titleEl = $("<div>", {
      id: "team-title",
      class: "team-title",
      text: titleTxt ?? "",
    });

    return this.#titleEl;
  }

  // guage bar 컨테이너
  #buildExcelArea() {
    this.#excelAreaEl = $("<div>", { class: "excel-team-area" });

    return this.#excelAreaEl;
  }

  // team guage bar
  #buildTeam() {
    const teams = _.get(this.#teamInfo, "teams", []);
    if (0 === (teams || []).length) {
      return;
    }
    const header = _.get(this.#teamInfo, "header");

    this.#excelTableEl = $("<table>", { class: this.#theme, id: 'excel-team-table' });
    this.#excelTableEl.appendTo(this.#excelAreaEl);

    // 팀 헤더
    const thead = this.#buildCreateHeader(header);
    thead.appendTo(this.#excelTableEl);

    const tbody = $("<tbody>");
    tbody.appendTo(this.#excelTableEl);
    if (!_.isNil(this.#item.fontName)) {
      tbody.addClass(this.#item.fontName);
      tbody.css('font-size', `${this.#item.fontSize}px`);

      if ('on' === this.#item.fontBold) {
        tbody.addClass("font-weight-bold");
      } else {
        tbody.removeClass("font-weight-bold");
      }
    }

    const _teams_ = [...teams];
    _teams_.forEach((team) => {
      this.#buildExcelTeam(team, tbody, header);
    });

    this.#sortTeamsAndMembers(this.#sortType);
  }

  #buildCreateHeader(header) {
    const { lex = '', rate = '', enableRate = true } = header

    const thead = $('<thead>');
    const tr = $("<tr>");
    tr.appendTo(thead);

    $('<th>', { class: 'team-th-ranking', text: "순위" }).appendTo(tr);
    $('<th>', { class: 'team-th-bj', text: "BJ" }).appendTo(tr);
    $('<th>', { class: 'team-th-lex', text: lex }).appendTo(tr);
    // 기여도 표시
    if (enableRate) {
      $('<th>', { class: 'team-th-rate', text: rate }).appendTo(tr);
    }

    return thead;
  }

  // excel
  #buildExcelTeam(team, tbody, header) {
    if (_.isNil(team)) {
      return;
    }
    let {
      teamId,
      name,
      totalSponsorScore,
      totalSponsorContribution,
      members,
      options: {
        lex = 0, rate = 0, skip = false,
        colors: { bg: bgColor, name: nameColor },
      },
    } = team;

    const { enableRate } = header;
    totalSponsorScore += Number(lex);
    totalSponsorContribution += Number(rate);

    //set tr
    const teamTr = $("<tr>", { class: "team-header", teamid: teamId, skip });
    teamTr.appendTo(tbody);
    const teamInfo = _.omit(team, members);
    teamTr.data("value", teamInfo);
    // team color(헤더 전체 font color)
    if (!_.isNil(this.#colors.team)) {
      teamTr.css('color', this.#colors.team);
    }
    // 팀 순위
    $('<td>', { text: '', class: "team-header-ranking" }).appendTo(teamTr);;

    // 팀 네임
    const teamEl = $('<td>', { text: name, class: "team-header-name" });
    teamEl.appendTo(teamTr);

    // 팀 lex
    $('<td>', {
      text: Number(totalSponsorScore).toLocaleString(),
      value: Number(totalSponsorScore),
      class: "team-header-amount team-header-score"
    }).appendTo(teamTr);
    // 팀 기여도
    if (enableRate) {
      $('<td>', {
        text: Number(totalSponsorContribution).toLocaleString(),
        value: Number(totalSponsorContribution),
        class: "team-header-rate team-header-score"
      }).appendTo(teamTr);
    }

    // member 추가
    for (let m of (members || [])) {
      const tr = $("<tr>", { class: "team-member", teamid: teamId, memberid: m.memberId });
      tr.appendTo(tbody);
      tr.data("value", m);

      // td
      const { id, memberId, nickname, sponsorScore, sponsorContribution, options } = m;
      // 순위
      $('<td>', { text: '', class: "team-member-ranking" }).appendTo(tr);
      // bj 네임
      const bjEl = $('<td>', { text: nickname, class: "team-member-name" });
      // bj color
      bjEl.appendTo(tr);
      if (!_.isNil(this.#colors.bj)) {
        bjEl.css('color', this.#colors.bj);
      }

      // 팀 lex
      const lexEl = $('<td>', {
        text: Number(sponsorScore).toLocaleString(),
        value: Number(sponsorScore),
        class: "team-member-amount team-member-score"
      });
      lexEl.appendTo(tr);
      //lex color
      if (!_.isNil(this.#colors.lex)) {
        lexEl.css('color', this.#colors.lex);
      }

      // 팀 기여도
      if (enableRate) {
        const rateEl = $('<td>', {
          text: Number(sponsorContribution).toLocaleString(),
          value: Number(sponsorContribution),
          class: "team-member-rate team-member-score"
        });
        rateEl.appendTo(tr);
        if (!_.isNil(this.#colors.rate)) {
          rateEl.css("color", this.#colors.rate);
        }
      }
    };


    // make member map
    const mapData = {
      team,
      el: {
        sortTeams: (sortType) => {
          this.#sortTeamsAndMembers(sortType);
        },
        setTeam: (team) => {
          const { teamId, members } = team;
          if (_.isNil(teamId)) {
            return
          };
          // 수신된 데이터 중 데이터가 변경된 팀 및 멤버를 검색
          const changedTeamAndMember = mapData.el.findChangedScore(team);
          // 데이터 업데이트
          mapData.team = team;
          mapData.el.setTeamScore(team);
          mapData.el.setTeamMemberScore(teamId, members);
          // 정렬
          this.#sortTeamsAndMembers(this.#sortType);
          // 효과
          mapData.el.startEffect(changedTeamAndMember);
        },
        startEffect: (changedTeamAndMember) => {
          const { isTeamScoreChaged, teamId, isMemberChanged, members } = changedTeamAndMember;
          // team effect
          if (isTeamScoreChaged) {
            const teamEl = $(`.team-header[teamid="${teamId}"] .team-header-score`);
            teamEl.addClass(ExcelTeamCompoment.ANIMATE_CLASS_HEARTBEAT);
            mapData.el.removeAniClass(teamEl, ExcelTeamCompoment.ANIMATE_CLASS_HEARTBEAT);
          }
          // member effect
          if (isMemberChanged) {
            const selector = members.map(id => `.team-member[teamid="${teamId}"][memberid="${id}"] .team-member-score`)
              .join(',');
            const memberEl = $(selector);
            memberEl.addClass(ExcelTeamCompoment.ANIMATE_CLASS_HEARTBEAT);
            mapData.el.removeAniClass(memberEl, ExcelTeamCompoment.ANIMATE_CLASS_HEARTBEAT);
          }
        },
        removeAniClass(el, className, immediately) {
          setTimeout(
            (obj, aniClass) => {
              obj.removeClass(aniClass);
            },
            immediately ? 0 : 1500,
            el,
            className
          );
        },
        findChangedScore: (team) => {
          const { teamId, totalSponsorScore = 0, totalSponsorContribution = 0, members } = team;
          const { team: prevTeam } = this.#uniqueIdMap.team[teamId];
          if (_.isNil(prevTeam)) {
            return null;
          }
          const isTeamScoreChaged = (Number(totalSponsorScore) !== Number(prevTeam.totalSponsorScore))
            || (Number(totalSponsorContribution) !== Number(prevTeam.totalSponsorContribution));

          const changedTeamAndMember = { isTeamScoreChaged, teamId, isMemberChanged: false, members: [] };
          (members || []).forEach(member => {
            const { memberId, sponsorScore, sponsorContribution } = member;

            const prvMembers = prevTeam.members;
            const [preMember] = prvMembers.filter(pm => pm.memberId === memberId) ?? [{ sponsorScore: 0, sponsorContribution: 0 }];

            const isMemberChanged = (Number(sponsorScore) !== Number(preMember.sponsorScore)) ||
              (Number(sponsorContribution) !== Number(preMember.sponsorContribution));
            if (isMemberChanged) {
              changedTeamAndMember.isMemberChanged = true;
              changedTeamAndMember.members.push(memberId);
            }
          });

          return changedTeamAndMember;
        },
        setTeamScore: (team) => {
          if (_.isNil(team)) {
            return;
          }
          // default value
          const { options: { lex = 0, rate = 0 } } = team;

          let { teamId, totalSponsorScore = 0, totalSponsorContribution = 0 } = team;
          // 기본점수 추가
          totalSponsorScore += Number(lex);
          totalSponsorContribution += Number(rate);

          // lex
          $(`.team-header[teamid="${teamId}"] .team-header-amount`).text(
            Number(totalSponsorScore).toLocaleString()
          );
          $(`.team-header[teamid="${teamId}"] .team-header-amount`).attr(
            'value',
            Number(totalSponsorScore)
          );
          // rate
          $(`.team-header[teamid="${teamId}"] .team-header-rate`).text(
            Number(totalSponsorContribution).toLocaleString()
          );
          $(`.team-header[teamid="${teamId}"] .team-header-rate`).attr(
            'value',
            Number(totalSponsorContribution)
          );
        },
        setTeamMemberScore: (teamId, members) => {
          if (_.isNil(teamId) || _.isNil(members) || 0 === members.length) {
            return;
          }

          (members || []).forEach((m => {
            const { sponsorScore = 0, sponsorContribution = 0, memberId } = m;
            // member amount
            $(`.team-member[teamid="${teamId}"][memberId="${memberId}"] .team-member-amount`).text(
              Number(sponsorScore).toLocaleString(),
            );
            $(`.team-member[teamid="${teamId}"][memberId="${memberId}"] .team-member-amount`).attr(
              'value',
              Number(sponsorScore),
            );
            // member rate
            $(`.team-member[teamid="${teamId}"][memberId="${memberId}"] .team-member-rate`).text(
              Number(sponsorContribution).toLocaleString(),
            );
            $(`.team-member[teamid="${teamId}"][memberId="${memberId}"] .team-member-rate`).attr(
              'value',
              Number(sponsorContribution),
            );
          }));

        },
        setTeamHeaderColor(color) {
          $(`.team-header[teamid="${teamId}"]`).css("background-color", color);
        },
        setMemberBackground(color) {
          $(`.team-member[teamid="${teamId}"]`).css('background-color', color);
        },
        setTeamNameColor(color) {
          teamEl.css("color", color);
        },
        setNicknameColor(color) {
          $(`.team-member[teamid="${teamId}"] .team-member-name`).css('color', color);
        },
        setAmountColor(color) {
          $(`.team-member[teamid="${teamId}"] .team-member-amount`).css('color', color);
        },
        setRateColor(color) {
          $(`.team-member[teamid="${teamId}"] .team-member-rate`).css('color', color);
        },
      },
    };

    // make map
    (members || []).forEach((m) => {
      this.#uniqueIdMap.member[m.memberId] = mapData;
      this.#uniqueIdMap.team[teamId] = mapData;
    });

    return teamTr;
  }

  #sortTeamsAndMembers(sortType) {
    const tbody = this.#excelTableEl.find('tbody');
    if (tbody.length === 0) return;

    const selector = sortType === 'lex' ?
      ".team-header-amount" :
      ".team-header-rate";

    const memberSelector = sortType === 'lex' ?
      ".team-member-amount" :
      ".team-member-rate";

    const teamChunks = [];

    tbody.find('.team-header').each(function () {
      const $header = $(this);
      const skip = $header.attr('skip') === 'true';
      const teamId = $header.attr('teamid');
      const teamScore = parseFloat($header.find(selector).attr('value')) || 0;

      // === 멤버 수집 및 정렬 ===
      const $members = tbody.find(`.team-member[teamid="${teamId}"]`);


      const sortedMemberEls = $members
        .get()
        .map(el => ({
          el,
          score: parseFloat($(el).find(memberSelector).attr('value')) || 0
        }))
        .sort((a, b) => b.score - a.score)
        .map(obj => obj.el); // DOM 요소 배열

      // === 현재 멤버 순서 비교 후 재배열 ===
      const currentOrder = $members.map((_, el) => $(el).attr('memberid')).get();
      const newOrder = sortedMemberEls.map(el => $(el).attr('memberid'));
      const isSameMemberOrder = currentOrder.join(',') === newOrder.join(',');

      const chunkElements = [$header.get(0), ...(isSameMemberOrder ? $members.get() : sortedMemberEls)];

      teamChunks.push({
        teamId,
        score: teamScore,
        skip,
        chunk: chunkElements
      });


    });

    // === 팀 정렬 ===
    const currentTeamOrder = tbody.find('.team-header').map((_, el) => $(el).attr('teamid')).get();
    //const sortedTeamChunks = [...teamChunks].sort((a, b) => b.score - a.score);
    const sortedTeamChunks = [...teamChunks].sort((a, b) => {
      // skip=false인 팀은 항상 먼저
      if (a.skip && !b.skip) return -1;
      if (!a.skip && b.skip) return 1;
      // 둘다 MC면 그대로
      if (a.skip && b.skip) return 1;

      // 둘 다 같으면 점수 내림차순
      return b.score - a.score;
    });
    const sortedTeamOrder = sortedTeamChunks.map(obj => obj.teamId);
    const isSameTeamOrder = currentTeamOrder.join(',') === sortedTeamOrder.join(',');

    // === 팀 순서 변경이 있을 경우에만 재삽입 ===
    if (!isSameTeamOrder) {
      tbody.empty();
      sortedTeamChunks.forEach(obj => tbody.append(obj.chunk));
      tbody.fadeIn(150);

    } else {
      // 팀 순서는 그대로 → 멤버 순서만 바뀐 경우만 처리
      sortedTeamChunks.forEach(obj => {
        const teamId = obj.teamId;
        const $header = tbody.find(`.team-header[teamid="${teamId}"]`);
        const $existingMembers = tbody.find(`.team-member[teamid="${teamId}"]`);
        const sortedMembers = obj.chunk.slice(1); // 첫 번째는 header니까 제외

        const existingOrder = $existingMembers.map((_, el) => $(el).attr('memberid')).get();
        const sortedOrder = sortedMembers.map(el => el.getAttribute('memberid'));

        if (existingOrder.join(',') !== sortedOrder.join(',')) {
          $existingMembers.remove();
          $header.after(sortedMembers);
        }
      });
    }
    // 팀별 순위 업데이트
    let raning = 0;
    sortedTeamChunks.forEach((obj, teamIndex) => {
      const $header = $(obj.chunk[0]); // 첫 번째 요소는 team-header
      const skip = $header.attr('skip') === 'true';
      // 팀 순위 표시 (예: "1위", "2위")
      const teamRankText = (skip) ? '-' : `${++raning}`;

      // 팀 이름 셀(td.team-header-name)에 추가
      $header.find('.team-header-ranking').text(teamRankText);

      // 멤버 순위 표시
      const $members = $(obj.chunk.slice(1)); // 멤버들만

      $members.each(function (memberIndex) {
        const $row = $(this);

        // 멤버 순위 텍스트 생성
        const memberRankText = (skip) ? '' : `${memberIndex + 1}`;

        // "기여도" 셀 오른쪽이나 별도 셀에 삽입
        $row.find('.team-member-ranking').text(memberRankText);
      });
    });
  }


  // 사용유무 체크 필요
  #renderExcel() {
    this.#verifyTeamData();

    const { teams } = this.#teamInfo;

    (teams || []).forEach((team) => {
      const teamInfo = this.#uniqueIdMap.team[team.teamId];
      const {
        el: { setTeam },
      } = teamInfo;

      setTeam(team);
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

  #convertARGBToRGBA(argbHex) {
    if (9 === argbHex.length) {
      return `#${argbHex.slice(3)}${argbHex.slice(1, 3)}`;
    } else {
      return argbHex;
    }
  }
}
