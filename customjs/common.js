//공통함수
const CURRENCY_GOLD_NOTI_TXT = "골드{개수}";
const CURRENCY_LEX_NOTI_TXT = "플렉스{개수}";
const CURRENCY_BELL_NOTI_TXT = "벨{개수}";

/**
 * 재화변경 여부 체크
 * @param {String} text
 * @returns
 */
function needsCurrencyConversion(text) {
  return needsGoldCurrencyConversion(text) || needsBellCurrencyConversion(text);
}
/**
 * 골드 재화 변경 여부 체크
 * @param {String} text
 * @returns
 */
function needsGoldCurrencyConversion(text) {
  return -1 !== (text || "").indexOf(CURRENCY_GOLD_NOTI_TXT);
}
/**
 * 렉스 재화 변경 여부 체크
 * @param {String} text
 * @returns
 */
function needsLexCurrencyConversion(text) {
  return -1 !== (text || "").indexOf(CURRENCY_LEX_NOTI_TXT);
}

/**
 * 벨 재화 변경 여부 체크
 * @param {String} text
 * @returns
 */
function needsBellCurrencyConversion(text) {
  return -1 !== (text || "").indexOf(CURRENCY_BELL_NOTI_TXT);
}

/**
 * text의  재화를 벨로 변경한다.()
 * @param {String} text
 * @returns
 */
function replaceCurrencyInNotiText(text) {
  if (needsBellCurrencyConversion(text)) {
    return text.replace(CURRENCY_BELL_NOTI_TXT, CURRENCY_LEX_NOTI_TXT);
  } else if (needsGoldCurrencyConversion(text)) {
    return text.replace(CURRENCY_GOLD_NOTI_TXT, CURRENCY_LEX_NOTI_TXT);
  } else {
    return text;
  }
}

