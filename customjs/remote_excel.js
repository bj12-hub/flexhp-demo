// ag grid
const EXCELSIG_DEFAULT_PAGE_LIMIT = 20;

const MYTHEME = agGrid.themeQuartz.withParams({
  backgroundColor: "#1f2836",
  browserColorScheme: "dark",
  selectedRowBackgroundColor: "rgba(0, 255, 0, 0.1)",
  oddRowBackgroundColor: "#8881",
  chromeBackgroundColor: {
    ref: "foregroundColor",
    mix: 0.07,
    onto: "backgroundColor",
  },
  fontSize: 14,
  foregroundColor: "#FFF",
  headerFontSize: 14,
});

const DEFAULT_COL_DEF = {
  editable: false,
  flex: 1,
  minWidth: 100,
  filter: true,
  sortable: false,
};

// ag grid api
let gridApi;

class ExcelSig {
  // 시그 후원 데이터/상태
  static SIG_EVENT_WAIT = "wait";
  static SIG_EVENT_PLAY = "play";
  static SIG_EVENT_ENDED = "ended";
  static SIG_EVENT_ERROR = "error";

  static SIG_EVENT_CHNAGE_WAIT_STAUS = "SIG_EVENT_CHNAGE_WAIT_STAUS";

  // excel 상태
  static EVENT_START_EXCEL = "EVENT_START_EXCEL";
  static EVENT_END_EXCEL = "EVENT_END_EXCEL";
  static EVENT_EXCEL_SPONSOR = "EVENT_EXCEL_SPONSOR";

  // callback 상태
  static #EVENT_TYPE_BASIC = "EVENT_TYPE_BASIC";
  static #EVENT_TYPE_ONCE = "`EVENT_TYPE_ONCE`";

  // excelsig clas 상태
  static STATUS_INITIALIZE = "`STATUS_INITIALIZE`";
  static STATUS_IDLE = "`STATUS_IDLE`";
  static STATUS_DATA_LOADING = "`STATUS_DATA_LOADING`";

  // excel sig class 상태
  #status = ExcelSig.STATUS_INITIALIZE;

  // 엑셀 상태
  #excelStatus = -1;

  #isApproved = false;
  #excelId = null;
  #excelInfo = null;
  #sigMap = null;
  #currentSig = null;
  #latestSigId = null;

  #listener = {
    // 엑셀 상태
    [ExcelSig.EVENT_START_EXCEL]: {
      callbacks: [],
      type: ExcelSig.#EVENT_TYPE_BASIC,
    },
    [ExcelSig.EVENT_END_EXCEL]: {
      callbacks: [],
      type: ExcelSig.#EVENT_TYPE_BASIC,
    },
    [ExcelSig.EVENT_EXCEL_SPONSOR]: {
      callbacks: [],
      type: ExcelSig.#EVENT_TYPE_BASIC,
    },
    // status event listener
    [ExcelSig.STATUS_INITIALIZE]: {
      callbacks: [],
      type: ExcelSig.#EVENT_TYPE_BASIC,
    },
    [ExcelSig.STATUS_IDLE]: {
      callbacks: [],
      type: ExcelSig.#EVENT_TYPE_BASIC,
    },
    [ExcelSig.STATUS_DATA_LOADING]: {
      callbacks: [],
      type: ExcelSig.#EVENT_TYPE_BASIC,
    },
    // excel sig event
    [ExcelSig.SIG_EVENT_PLAY]: {
      callbacks: [],
      type: ExcelSig.#EVENT_TYPE_BASIC,
    },
    [ExcelSig.SIG_EVENT_ENDED]: {
      callbacks: [],
      type: ExcelSig.#EVENT_TYPE_BASIC,
    },
    [ExcelSig.SIG_EVENT_CHNAGE_WAIT_STAUS]: {
      callbacks: [],
      type: ExcelSig.#EVENT_TYPE_BASIC,
    },
  };

  constructor() {
    this.setInitializeState();
  }

  // properties /////////////////////////////////////////////////////////////////////////////////////////////////////////
  get isApproved() {
    return this.#isApproved;
  }

  get excelId() {
    return this.#excelId;
  }

  get status() {
    return this.#excelStatus;
  }

  get inProgress() {
    return EXCEL.STATUS.INPROGRESS === Number(this.#excelStatus);
  }

  get isEnd() {
    return EXCEL.STATUS.END === Number(this.#excelStatus);
  }

  get currentSigId() {
    const value = _.get(this.#currentSig, ["sponsorId"], null);
    return _.isNil(value) ? value : Number(value);
  }

  get latestSigId() {
    return this.#latestSigId;
  }

  // public method /////////////////////////////////////////////////////////////////////////////////////
  async initialize() {
    this.#isApproved = await this.isApprovedExcel();
    if (!this.#isApproved) {
      return;
    }
    // 현재 엑셀
    const { excelId } = await this.#callApiCurrenExcel();
    this.#excelId = excelId;

    // 엑셀 정보
    this.#excelInfo = await this.#callApiProjectDetail(this.#excelId);
    if (this.#excelInfo) {
      this.#excelStatus = this.#excelInfo.status;
    }

    this.#sigMap = await this.getSigInfo();

    // 후원 정보 excel sig
  }

  // 결재 상태 체크
  async isApprovedExcel() {
    try {
      // 사용자 승인 유무
      await this.#callApiCheckApprove();
      return true;
    } catch (e) {
      // console.error(e);
      return false;
    }
  }

  setCurrentSig(data) {
    this.#currentSig = data;

    if (!_.isNil(data)) {
      const value = _.get(data, ["sponsorId"], null);
      this.#latestSigId = _.isNil(value) ? value : Number(value);
    }
  }

  // 후원리스트
  async getSponsorList(page = 0, limit = EXCELSIG_DEFAULT_PAGE_LIMIT) {
    try {
      this.#verify();

      const sponsorList = await excelSig.#callApiSponsorList(this.#excelId);
      // 가장 첫번째 데이터
      const { list } = sponsorList || { list: [] };
      const currentSigId = excelSig.currentSigId;
      const latestSigId = excelSig.latestSigId;

      const results = list.map((val) => {
        const [sigImage] = excelSig.getSigImage(val.sponsorAmount);
        const userNickname =
          0 === val.sponsorMemberId ? "flex" : val.userNickname;
        const createdAt = moment(val.createdAt).format("YYYY-MM-DD HH:mm:ss");
        let status;
        //if (_.isNil(currentSigId) || val.id < currentSigId) {
        if (_.isNil(latestSigId) || val.id < latestSigId) {
          status = ExcelSig.SIG_EVENT_ENDED;
        } else if (val.id === currentSigId) {
          status = ExcelSig.SIG_EVENT_PLAY;
        } else {
          status = ExcelSig.SIG_EVENT_WAIT;
        }

        return {
          ...val,
          createdAt,
          status,
          sigImage,
          userNickname,
          orgUserNickName: val.userNickname,
        };
      });

      return results;
    } catch (e) {
      console.error(e.message);
      throw e;
    }
  }

  async getSigInfo() {
    try {
      this.#verify();

      const preset = await excelSig.#callApiPresetNotiList();

      // make sig map
      const result = (preset || []).reduce((acc, val) => {
        const data = JSON.parse(val.DATA);
        if (data) {
          const { title_bgm_objs } = data;
          if (title_bgm_objs && title_bgm_objs.length > 0) {
            title_bgm_objs.forEach((bgmobj) => {
              const {
                startlex,
                // endlex,
                imgData,
              } = bgmobj;
              const { url } = imgData || { url: "" };
              if ("" !== url) {
                Object.hasOwn(acc, startlex)
                  ? acc[startlex].push(url)
                  : (acc[startlex] = [url]);
              }
            });
          }
        }
        return acc;
      }, {});

      return result;
    } catch (e) {
      console.error(e.message);
      //throw e;
    }
  }
  // 엑셀 정보 변경
  changeProjectInfo(excelInfo) {
    this.#excelInfo = excelInfo;
    this.#excelId = this.#excelInfo.excelId;
    this.#excelStatus = this.#excelInfo.status;
  }

  // 엑셀 시작
  startExcel() {
    this.#excelStatus = EXCEL.STATUS.INPROGRESS;
    this.#excelInfo.status = this.#excelStatus;

    // fire event
    this.#fireEvent(ExcelSig.EVENT_START_EXCEL);
  }

  // 엑셀 종료
  endExcel() {
    this.#excelStatus = EXCEL.STATUS.END;
    this.#excelInfo.status = this.#excelStatus;
    // fire event
    this.#fireEvent(ExcelSig.EVENT_END_EXCEL);
  }

  sendSponsor(_data) {
    // data: {excelId, memberId, type: 343}
    this.#fireEvent(ExcelSig.EVENT_EXCEL_SPONSOR);
  }

  // 시그 시작과 종료
  sigEvent(sigData) {
    const { event, data } = sigData;

    switch (event) {
      case ExcelSig.SIG_EVENT_PLAY:
        this.#excelSigPlayHandler(data);
        break;
      case ExcelSig.SIG_EVENT_ENDED:
      case ExcelSig.SIG_EVENT_ERROR:
        this.#excelSigEndedHandler(data);
        break;
      default:
        console.log("Unsupported event", event);
    }
  }

  // 후원별 시그 아미지
  getSigImage(amount) {
    if (_.isNil(amount)) {
      return "";
    }
    const sigImage = _.get(this.#sigMap, amount);

    return _.isNil(sigImage) ? "" : sigImage;
  }

  // 상태: 데이터 로딩
  setDataLoadingState() {
    this.#status = ExcelSig.STATUS_DATA_LOADING;
    // 이벤트 리스너 호출
    this.#fireEvent(ExcelSig.STATUS_DATA_LOADING);
  }
  isDataLoadingState() {
    return this.#status === ExcelSig.STATUS_DATA_LOADING;
  }
  // 상태: idle 상태
  setIdleState() {
    this.#status = ExcelSig.STATUS_IDLE;
    this.#fireEvent(ExcelSig.STATUS_IDLE);
  }
  isIdleState() {
    return this.#status === ExcelSig.STATUS_IDLE;
  }
  // 초기화 상태
  setInitializeState() {
    this.#status = ExcelSig.STATUS_INITIALIZE;
    this.#fireEvent(ExcelSig.STATUS_INITIALIZE);
  }
  isInitializeState() {
    return this.#status === ExcelSig.STATUS_INITIALIZE;
  }

  // EVENT LISTENER /////////////////////////////////////////////////////////////////////////////////////
  // 이벤트 추가
  on(eventName, callback) {
    this.#verifyEventListner(eventName, callback);

    this.#listener[eventName].callbacks.push(callback);
  }

  // 이벤트 셋팅(기존 이벤트 모두 제거)
  set(eventName, callback) {
    this.#verifyEventListner(eventName, callback);

    this.removeAllEvents(eventName);
    this.#listener[eventName].callbacks.push(callback);
  }

  // 가장 최근 이벤트 한번만 호출(나머지 이벤트 무시, 호출 후 이벤트 listener초기화)
  once(eventName, callback) {
    this.#verifyEventListner(eventName, callback);

    this.#listener[eventName].callbacks.push(callback);
    this.#listener[eventName].type = ExcelSig.#EVENT_TYPE_ONCE;
  }

  // 특정 이벤트 삭제
  removeEvents(eventName, callback) {
    if (this.#listener[eventName]) {
      const len = this.#listener[eventName].callbacks.length;
      for (let i = len - 1; i >= 0; i--) {
        const regCallback = this.#listener[eventName].callbacks[i];
        if (regCallback === callback) {
          this.#listener[eventName].callbacks.splice(i, 1);
        }
      }
    }
  }

  // eventName으로 등록된 이벤트 모두 제거
  removeAllEvents(eventName) {
    if (this.#listener[eventName]) {
      this.#listener[eventName] = {
        callbacks: [],
        type: ExcelSig.#EVENT_TYPE_BASIC,
      };
    }
  }

  // 전체 이벤트 초기화
  clearAllEvents() {
    const keys = _.keys(this.#listener) || [];
    keys.forEach((key) => {
      this.#listener[key].callbacks = [];
      this.#listener[key].type = ExcelSig.#EVENT_TYPE_BASIC;
    });
  }

  removeEvent(eventName) {}

  async #fireEvent(eventName, data) {
    //verify event
    this.#verifyEvent(eventName);

    const eventCallbackType = this.#getEventCallbackType(eventName);
    let eventCallbacks = this.#getEventCallbacks(eventName);

    if (0 >= eventCallbacks.length) {
      return;
    }

    // callback type once일 경우 제일 최근에 추가된 것을 처리한다.
    if (ExcelSig.#EVENT_TYPE_ONCE === eventCallbackType) {
      eventCallbacks = [eventCallbacks.pop()];
      this.#setCallbackLength(eventName, 0);
    }

    for await (let callback of eventCallbacks) {
      data ? await callback(data) : await callback();
    }
  }

  #getEventCallbacks = (eventName) => {
    return this.#listener[eventName].callbacks || [];
  };

  #getEventCallbackType = (eventName) => {
    return this.#listener[eventName].type;
  };

  #setCallbackLength(eventName, length) {
    const len = Math.max(0, length);
    this.#listener[eventName].callbacks.length = len;
  }
  // private method /////////////////////////////////////////////////////////////////////////////////////
  #verify() {
    if (!this.isApproved) {
      throw new Error("This is an unauthorized user.");
    }

    if (!this.inProgress) {
      throw new Error("This is not Excel in progress.");
    }

    return true;
  }

  #verifyEvent(eventName) {
    if (!this.#listener[eventName]) {
      throw new Error(`${eventName} is not found`);
    }
  }

  #verifyEventListner(eventName, callback) {
    this.#verifyEvent(eventName);

    if ((!callback) instanceof Function) {
      throw new Error("callback is not a function.");
    }
  }

  // 후원 프리셋
  async #callApiPresetNotiList() {
    const url = `${g_url}/preset/getpresetlist?type=info`;

    const response = await axios.get(url);
    const json = response.data;

    if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
      throw new Error(json.message || "");
    }
    return json.resultMap.dataList || [];
  }

  // 승인상태 여부 체크
  async #callApiCheckApprove() {
    const url = `${g_url}/api/excel/project/checkApprove`;

    const response = await axios.get(url);
    const json = response.data;

    if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
      throw new Error(json.message || "");
    }
    return json.resultMap.data || [];
  }

  // 현재 엑셀 정보
  async #callApiCurrenExcel() {
    try {
      const url = `${g_url}/api/excel/settings/detail`;

      const response = await axios.get(url);
      const json = response.data;

      if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
        throw new Error(json.message || "");
      }

      return json.resultMap.data;
    } catch (e) {
      console.error(e);
    }
  }

  // excel project 정보
  async #callApiProjectDetail(excelId) {
    if (_.isNil(excelId)) {
      throw new Error("Invalid excelId.");
    }

    const url = `${g_url}/api/excel/project/detail?excelId=${excelId}`;

    const response = await axios.get(url);
    const json = response.data;

    if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
      throw new Error(json.message || "");
    }
    return json.resultMap.data;
  }

  // 후원리스트
  async #callApiSponsorList(
    excelId,
    page = 0,
    limit = EXCELSIG_DEFAULT_PAGE_LIMIT,
  ) {
    if (!this.#isApproved) {
      return console.warn("This is an unauthorized user.");
    }

    if (_.isNil(excelId)) {
      return console.error("Invalid excelId.");
    }

    const offset = (Math.max(page, 1) - 1) * limit;
    const url = `${g_url}/api/excel/sponsor/list?excelId=${excelId}&offset=${offset}&limit=${limit}`;

    const response = await axios.get(url);
    const json = response.data;

    if (json.returnCode !== 1 || json.resultMap.returnVal !== 1) {
      throw new Error(json.message || "");
    }

    return json.resultMap.data;
  }

  #excelSigPlayHandler(data) {
    const currentSig = { ...this.#currentSig };
    const currentSigId = _.get(currentSig, "sponsorId", null);

    const { sponsorId } = data;
    this.setCurrentSig(data);
    //this.#currentSig = data;

    // 동일한 sign 호출: skip
    if (currentSigId === sponsorId) {
      return;
    }

    // 종료되지 않았다면 기존 sig 종료
    if (!_.isNil(currentSigId)) {
      this.#fireEvent(ExcelSig.SIG_EVENT_ENDED, this.#currentSig);
    }

    // previousSigId 이후의 모든 아이디를  waite 상태로 변경
    if (_.isNil(currentSigId)) {
      this.#fireEvent(ExcelSig.SIG_EVENT_CHNAGE_WAIT_STAUS, { sponsorId });
    }

    if (this.isDataLoadingState()) {
      // 로딩완료 후 화면에 표시
      this.once(ExcelSig.STATUS_IDLE, () => {
        this.#fireEvent(ExcelSig.SIG_EVENT_PLAY, data);
      });
    } else {
      // 화면에 표시
      this.#fireEvent(ExcelSig.SIG_EVENT_PLAY, data);
    }
  }

  #excelSigEndedHandler(data) {
    //this.#currentSig = null;
    this.setCurrentSig(null);

    if (this.isDataLoadingState()) {
      // 로딩완료 후 화면에 표시
      this.once(ExcelSig.STATUS_IDLE, () => {
        this.#fireEvent(ExcelSig.SIG_EVENT_ENDED, data);
      });
    } else {
      // 화면에 표시
      this.#fireEvent(ExcelSig.SIG_EVENT_ENDED, data);
    }
  }
}

// END CLASS /////////////////////////////////////////////////////////////////////////////////////////////////////////

async function initExcelSig() {
  try {
    await excelSig.initialize();
    // event bind
    bindExcelSigEvent();
    // 엑셀 후원 리스트
    await getExcelSponsor();
    // 버튼활성화
    initDisabledUI(false);
  } catch (e) {
    initDisabledUI(true);
  }
}

// 방송종료
async function clearExcelSig() {
  gridApi.setGridOption("rowData", []);
  initDisabledUI(true);
}

function bindExcelSigEvent() {
  excelSig.clearAllEvents();

  excelSig.on(ExcelSig.EVENT_START_EXCEL, () => {
    // 엑셀 시작.
    initExcelSig();
  });

  excelSig.on(ExcelSig.EVENT_END_EXCEL, () => {
    // 엑셀 종료
    clearExcelSig();
  });

  excelSig.on(ExcelSig.EVENT_EXCEL_SPONSOR, () => {
    // 엑셀 후원
    addNewExcelSponsor();
  });

  // 후원 시그 play
  excelSig.on(ExcelSig.SIG_EVENT_PLAY, (data) => {
    displaySig(ExcelSig.SIG_EVENT_PLAY, data);
  });
  // 후원 시그 end
  excelSig.on(ExcelSig.SIG_EVENT_ENDED, (data) => {
    displaySig(ExcelSig.SIG_EVENT_ENDED, data);
  });
  // 후원 시그 wait상태로 변경
  excelSig.on(ExcelSig.SIG_EVENT_CHNAGE_WAIT_STAUS, (data) => {
    changeWaitSigState(data);
  });
}

function initDisabledUI(disabled) {
  $("#excelsponsor button").prop("disabled", disabled);
}

async function addNewExcelSponsor() {
  // 상태 변경
  excelSig.setDataLoadingState();

  const sponsorList = await excelSig.getSponsorList(
    0,
    EXCELSIG_DEFAULT_PAGE_LIMIT,
  );

  // 최근 20 개만 유지
  gridApi.setGridOption("rowData", sponsorList);

  // 상태 변경
  excelSig.setIdleState();
}

async function getExcelSponsor() {
  // 상태 변경
  excelSig.setDataLoadingState();

  const isApproveExcel = excelSig.isApproved;

  const target = $('a[data-tab-id="excelsponsor"]');
  if (!isApproveExcel) {
    return target.hide();
  }

  target.show();

  if (!isApproveExcel) {
    return console.log("엑셀 승인 사용자가 아닙니다.");
  }
  const sponsorList = await excelSig.getSponsorList();
  drawExcelSponsorList(sponsorList);

  // 상태 변경
  excelSig.setIdleState();
}

function drawExcelSponsorList(sponsorList) {
  $("#myGrid").empty();

  const columnDefs = [
    { field: "createdAt", headerName: "후원일자", minWidth: 180 },
    {
      field: "userNickname",
      headerName: "후원자 닉네임",
      valueFormatter: (p) => {
        const { sponsorMemberId, orgUserNickName } = p.data;
        return 0 === sponsorMemberId ? `${p.data.orgUserNickName}` : p.value;
      },
    },
    { field: "displayName", headerName: "호스트명" },
    {
      field: "sponsorAmount",
      headerName: "후원렉스",
      width: 100,
      valueFormatter: (p) => numberWithCommas(p.value),
    },
    {
      field: "sponsorScore",
      headerName: "후원점수",
      width: 100,
      valueFormatter: (p) => numberWithCommas(p.value),
    },
    {
      field: "sponsorContribution",
      headerName: "기여도",
      width: 100,
      valueFormatter: (p) => numberWithCommas(p.value),
    },
    {
      field: "sigImage",
      headerName: "시그",
      maxWidth: 100,
      cellRenderer: SigImageComponent,
    },
    {
      field: "status",
      headerName: "상태",
      width: 100,
      valueFormatter: SigStatusValueFormatter,
    },
  ];

  const gridOptions = {
    // theme 설정
    theme: MYTHEME,
    // 컬럼 기본 설정
    defaultColDef: DEFAULT_COL_DEF,
    // 컬럼 설정
    columnDefs,
    // row selection 설정
    rowSelection: {
      mode: "singleRow",
      checkboxes: true,
      enableClickSelection: true,
    },
    // 데이터 셋팅
    rowData: sponsorList,
    // row id
    getRowId: (params) => String(params.data.id),
    localeText: {
      noRowsToShow: "표시할 데이터가 없습니다.",
    },
    // row style
    getRowStyle: (params) => {
      const status = _.get(
        params,
        ["data", "status"],
        ExcelSig.SIG_EVENT_ENDED,
      );

      let opacity = 1;
      let play = false;
      switch (status) {
        case ExcelSig.SIG_EVENT_PLAY:
          play = true;
        case ExcelSig.SIG_EVENT_WAIT:
          opacity = 1;
          break;
        case ExcelSig.SIG_EVENT_ENDED:
          opacity = 0.4;
          break;
      }

      const rowStyle = play
        ? { color: "black", "background-color": "yellow", opacity }
        : { color: "white", "background-color": "", opacity };
      return rowStyle;
    },
  };

  // Your Javascript code to create the Data Grid
  const myGridElement = document.querySelector("#myGrid");
  gridApi = agGrid.createGrid(myGridElement, gridOptions);
}

// sig image
function SigImageComponent(params) {
  const { sigImage, sponsorMemberId } = params.data;
  const flexBadge = `<div class="badge badge-primary warning position-absolute" style="left: 7px;">flex</div>`;

  if (!_.isEmpty(sigImage)) {
    let html = `<img height="99%" src="${sigImage}"/>`;
    if (0 === Number(sponsorMemberId)) {
      html += flexBadge;
    }
    return html;
  }

  return "";
}
// 상태
function SigStatusValueFormatter(params) {
  const status = params.value;
  switch (status) {
    case ExcelSig.SIG_EVENT_WAIT:
      return `대기 (${status})`;
    case ExcelSig.SIG_EVENT_PLAY:
      return `진행 (${status})`;
    case ExcelSig.SIG_EVENT_ENDED:
    default:
      return `완료 (${status})`;
  }
}

// 새로운 데이터 추가
function addData(newRow) {
  gridApi.applyTransaction({ add: [newRow], addIndex: 0 });
}

// 시그 play 및 종료 표시
// event: ExcelSig.SIG_EVENT_PLAY, ExcelSig.SIG_EVENT_ENDED
function displaySig(event, data) {
  const { sponsorId } = data;
  const rowNode = gridApi.getRowNode(sponsorId);

  if (_.isNil(rowNode)) {
    return;
  }

  const rowData = rowNode.data;
  rowData.status = event;

  const targetRowData = [rowData];
  gridApi.applyTransaction({ update: targetRowData });

  if (ExcelSig.SIG_EVENT_ENDED === event) {
    // 남아있는 후원이 시그가 관리자 시그면 ended 처리한다.
    changeStatusToEndedForNotSig(sponsorId);
  }
}

// sponsor 아이디 이후 수신된 데이터는 모두 대기 상태로 변경
// page reload 후 play된 시그 이후 시그 모두 변경.
function changeWaitSigState(data) {
  const { sponsorId } = data;
  if (_.isNil(sponsorId)) {
    return;
  }

  const targetSponsorRowData = [];
  gridApi.forEachNode((rowNode) => {
    if (sponsorId < rowNode.id) {
      targetSponsorRowData.push({
        ...rowNode.data,
        status: ExcelSig.SIG_EVENT_WAIT,
      });
    }
  });

  gridApi.applyTransaction({ update: targetSponsorRowData });
}

// page reload
function reload() {
  addNewExcelSponsor();
}

function startSig() {
  const [rowNode] = gridApi.getSelectedNodes();
  if (_.isNil(rowNode)) {
    return;
  }
  const { id: selectedId } = rowNode;

  const targetSponsorRowData = [];
  gridApi.forEachNode((rowNode) => {
    let status;
    if (selectedId < rowNode.id) {
      status = ExcelSig.SIG_EVENT_WAIT;
    } else if (selectedId === rowNode.id) {
      status = ExcelSig.SIG_EVENT_PLAY;
    } else {
      status = ExcelSig.SIG_EVENT_ENDED;
    }

    targetSponsorRowData.push({ ...rowNode.data, status });
  });

  gridApi.applyTransaction({ update: targetSponsorRowData });

  excelSig.sigEvent({
    event: ExcelSig.SIG_EVENT_PLAY,
    data: { sponsorId: Number(selectedId) },
  });
}

function changeStatusToEndedForNotSig(sponsorId) {
  const targetSponsorRowData = [];
  let findItem = false;
  gridApi.forEachNode((rowNode) => {
    if (Number(sponsorId) === Number(rowNode.id)) {
      findItem = true;
    } else if (!findItem) {
      const { sponsorMemberId } = rowNode.data;
      if (0 === Number(sponsorMemberId)) {
        targetSponsorRowData.push({
          ...rowNode.data,
          status: ExcelSig.SIG_EVENT_ENDED,
        });
      } else {
        targetSponsorRowData.length = 0;
      }
    }
  });

  gridApi.applyTransaction({ update: targetSponsorRowData });
}

// 필터초기화
function clearFilters() {
  $(".btn-filter i").removeClass("text-info");
  gridApi.setFilterModel(null);
}

// 엑셀 후원만 보기
function setFilterOnlySponsor(target) {
  const targetObject = $(target);
  const isSetFilter = targetObject.data("filter");
  const filterModel = gridApi.getFilterModel();

  if (!isSetFilter) {
    filterModel["userNickname"] = { type: "notEqual", filter: "flex" };
    filterModel["sigImage"] = { type: "notBlank", filter: "flex" };

    targetObject.find("i").addClass("text-info");
  } else {
    delete filterModel["userNickname"];
    delete filterModel["sigImage"];

    targetObject.find("i").removeClass("text-info");
  }

  gridApi.setFilterModel(filterModel);

  targetObject.data("filter", !isSetFilter);
}

// 진행/대기 중인 후원만 보기
function setFilterOnlyNotEnded(target) {
  const targetObject = $(target);
  const isSetFilter = targetObject.data("filter");
  const filterModel = gridApi.getFilterModel();

  if (!isSetFilter) {
    filterModel["status"] = { type: "notEqual", filter: "ended" };

    targetObject.find("i").addClass("text-info");
  } else {
    delete filterModel["status"];

    targetObject.find("i").removeClass("text-info");
  }

  gridApi.setFilterModel(filterModel);

  targetObject.data("filter", !isSetFilter);
}

function setPause(event) {
  const pause = $(event.currentTarget);
  const status = pause.data("status");
  console.log(status);

  let _type;

  if ("" === status) {
    pause.data("status", "pause");
    pause.find("label").text("플레이");
    pause.find("i").removeClass("fa-pause").addClass("fa-play");
    pause.removeClass("btn-accent");

    // 일시정지
    _type = "111";
  } else {
    pause.data("status", "");
    pause.find("label").text("일시정지");
    pause.find("i").removeClass("fa-play").addClass("fa-pause");
    pause.addClass("btn-accent");
    // 해제
    _type = "110";
  }

  var param = {
    type: "info",
    data: {
      type: _type,
      msg: _type === "111" ? "음소거" : "해제",
    },
  };

  axios
    .post(g_url + "/preset/eventaction", param)
    .then(function (response) {
      let json = response.data;
      //console.log("🔥 ~ mute ~ json:", json);
      if (json.returnCode == 1) {
        if (json.resultMap.returnVal == 1) {
          //  console.log("서버로 성공적으로 보냄")
          //$(".spinner-border").css("display", "none");
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

const excelSig = new ExcelSig();
