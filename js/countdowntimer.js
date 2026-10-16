// countdowntimer
class CountdownTimer {
  static STATUS = {
    START: 1,
    STOP: 2,
    TICK: 9,
  };

  static #TICK_EVENT = "TICK_EVENT";
  static #DEFAULT_TICK_TIME = 1000;

  #isStart = false;
  #timerId = null;
  // #timestamp = null;
  #seconds = -1;
  #emitter = new EventEmitter();

  /////////////////////////////////////
  // properties
  /////////////////////////////////////
  get isStart() {
    return this.#isStart;
  }

  /////////////////////////////////////
  // public method
  /////////////////////////////////////

  addCallback(callback) {
    this.#emitter.on(CountdownTimer.#TICK_EVENT, callback);
  }

  setCallback(callback) {
    this.#emitter.set(CountdownTimer.#TICK_EVENT, callback);
  }

  setTime(seconds = 0) {
    this.#seconds = seconds;
  }

  start() {
    const len = this.#emitter.listenerCount();
    if (0 === Math.max(0, len)) {
      this.#isStart = false;
      return;
    }

    this.#isStart = true;

    // start tick
    this.#tick();

    // timer tick
    this.#timerId = setInterval(() => {
      this.#tick();
    }, CountdownTimer.#DEFAULT_TICK_TIME);
  }

  stop() {
    console.log("stop timer");

    if (_.isNil(this.#timerId)) {
      return;
    }

    clearInterval(this.#timerId);

    this.#timerId = null;
    //this.#timestamp = null;
    this.#isStart = false;
    this.#emitter.removeAllListener(CountdownTimer.#TICK_EVENT);
  }

  toTimeString(lefttime, format) {
    const leftTime = Math.max(0, lefttime);
    const defaultFormat = 3600 <= lefttime ? 'HH:mm:ss' : 'mm:ss';
    let result = moment.utc(leftTime * 1000).format(format || defaultFormat);
    return result
  }

  get leftTimeString() {
    const timeData = this.#getLeftTime();
    const [result, isEndTime,] = timeData;

    return result;
  }

  get isEndTime() {
    const timeData = this.#getLeftTime();
    const [result, isEndTime] = timeData;

    return isEndTime;
  }

  /////////////////////////////////////
  // private method
  /////////////////////////////////////
  #tick() {
    const timeData = this.#getLeftTime();
    const [result, isEndTime] = timeData;

    if (isEndTime) {
      return this.stop();
    }

    this.#seconds--;
    this.#emitter.emit(CountdownTimer.#TICK_EVENT, timeData);
  }

  #getLeftTime() {
    const leftTime = Math.max(0, this.#seconds);
    //console.log(leftTime, this.#seconds);
    let isEndTime = leftTime > this.#seconds;
    let result = moment.utc(leftTime * 1000).format('HH:mm:ss');;

    return [result, isEndTime];
  }
}
