class EventEmitter {
  // 기본 이벤트
  static #EVENT_INIT = "__EVENT_INIT__";
  // callback 상태
  static #EVENT_TYPE_BASIC = "EVENT_TYPE_BASIC";
  static #EVENT_TYPE_ONCE = "`EVENT_TYPE_ONCE`";

  // event listener
  #listeners = {};

  //////////////////////////////////////////////////////////////
  // public method
  //////////////////////////////////////////////////////////////
  on(eventName, callback) {
    this.#initAndVerifyEventListner(eventName, callback);

    this.#listeners[eventName].callbacks.push(callback);
  }

  // 이벤트 셋팅(기존 이벤트 모두 제거)
  set(eventName, callback) {
    this.#initAndVerifyEventListner(eventName, callback);

    this.removeAllListener(eventName);
    this.#listeners[eventName].callbacks.push(callback);
  }

  // 가장 최근 이벤트 한번만 호출(나머지 이벤트 무시, 호출 후 이벤트 listener초기화)
  once(eventName, callback) {
    this.#initAndVerifyEventListner(eventName, callback);

    this.#listeners[eventName].callbacks.push(callback);
    this.#listeners[eventName].type = EventEmitter.#EVENT_TYPE_ONCE;
  }

  off(eventName, callback) {
    this.removeListener(eventName, callback);
  }

  removeListener(eventName, callback) {
    const listener = this.#getEventListener(eventName);
    if (!this.hasEventListener(eventName, callback)) return;

    const len = listener.callbacks.length;
    for (let i = len - 1; i >= 0; i--) {
      const regCallback = listener.callbacks[i];
      if (regCallback === callback) {
        listener.callbacks.splice(i, 1);
      }
    }
  }

  removeAllListener(eventName) {
    const listener = this.#getEventListener(eventName);
    if (_.isNil(listener)) return;

    listener.callbacks.length = 0;
  }

  clearAllListner() {
    this.#listeners = {};
  }

  eventNames() {
    return _.keys(this.#listeners) || [];
  }

  listeners(eventName) {
    return _.chain(this.#listeners)
      .keys()
      .filter((en) => en === eventName)
      .map((el) => this.#listeners[el].callbacks);
  }

  listenerCount() {
    return (_.keys(this.#listeners) || []).length;
  }

  hasEventListener(eventName, callback) {
    const destCallback = this.#getEventListener(eventName);
    return callback === destCallback;
  }

  hasEvent(eventName) {
    const listener = this.#getEventListener(eventName);
    return !_.isNil(listener);
  }

  // emit
  async emit(eventName, data) {
    //verify event
    this.#verifyEvent(eventName);

    const listener = this.#getEventListener(eventName);

    const eventCallbackType = listener.type;
    let eventCallbacks = listener.callbacks;

    if (0 >= eventCallbacks.length) {
      return;
    }

    // callback type once일 경우 제일 최근에 추가된 것을 처리한다.
    if (EventEmitter.#EVENT_TYPE_ONCE === eventCallbackType) {
      eventCallbacks = [eventCallbacks.pop()];
      this.#setCallbackLength(eventName, 0);
    }

    for await (let callback of eventCallbacks) {
      data ? await callback(data) : await callback();
    }
  }

  //////////////////////////////////////////////////////////////
  //private method
  //////////////////////////////////////////////////////////////
  #getEventListener(eventName) {
    if (_.isEmpty(eventName)) {
      return null;
    }
    const listener = _.get(this.#listeners, eventName);
    return listener;
  }

  #verifyEvent(eventName) {
    if (!this.#listeners[eventName]) {
      throw new Error(`${eventName} is not found`);
    }
  }

  #verifyEventListner(eventName, callback) {
    this.#verifyEvent(eventName);

    if (!_.isFunction(callback)) {
      throw new Error("callback is not a function.");
    }
  }

  #initAndVerifyEventListner(eventName, callback) {
    if (!this.#listeners[eventName]) {
      this.#listeners[eventName] = {
        callbacks: [],
        type: EventEmitter.#EVENT_TYPE_BASIC,
      };
    }

    if (!_.isFunction(callback)) {
      throw new Error("callback is not a function.");
    }
  }

  #setCallbackLength(eventName, length) {
    //verify event
    this.#verifyEvent(eventName);

    const len = Math.max(0, length);
    this.#listeners[eventName].callbacks.length = len;
  }
}
