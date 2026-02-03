import {
  INCOMING_ACTIONS_TYPES,
  OUTGOING_ACTIONS_TYPES,
  AUTH_SCOPES,
} from "./constants";

function postMessageToWebView({ my, ctx }, actionType, payload, error) {
  const payloadWithType =
    payload && typeof payload === "object"
      ? { ...payload, actionType }
      : { actionType };
  ctx.postMessage({ actionType, payload: payloadWithType, error });
}

function onMiniappLoaded(
  context,
  payload,
  webviewComponentThis,
  hostAppPayload,
) {
  context.my.getSystemInfo({
    complete: (deviceInfo) => {
      const data = {
        deviceInfo,
      };

      if (hostAppPayload && hostAppPayload.deepLinkParams) {
        data["deepLinkParams"] = hostAppPayload.deepLinkParams;
      }

      postMessageToWebView(
        context,
        OUTGOING_ACTIONS_TYPES.MINIAPP_LOADED,
        data,
      );

      webviewComponentThis.setData({ isMiniappLoaded: true });
    },
  });
}

function getAndSendAuthCode(context, payload) {
  context.my.getAuthCode({
    scopes: [
      "MINI_PROGRAM,CASHIER,QUERY_BALANCE,DEFAULT_BASIC_PROFILE,MINI_DANA,PUBLIC_ID,KYC_INFO",
    ],
    success: (response) =>
      postMessageToWebView(context, OUTGOING_ACTIONS_TYPES.AUTH_CODE, response),
    fail: (error) =>
      postMessageToWebView(
        context,
        OUTGOING_ACTIONS_TYPES.AUTH_CODE,
        error,
        true,
      ),
  });
}

/**
 * SET_NAV_BAR: title, backgroundColor, image.
 * For custom nav bar (option 2): also send canGoBack (boolean) so host shows/hides back button.
 */
function setNavBar({ my, ctx }, payload, webviewComponentThis) {
  const params = { title: payload.title };
  if (!!payload.backgroundColor) {
    params.backgroundColor = payload.backgroundColor;
  }
  if (!!payload.image) {
    params.image = payload.image;
  }
  my.setNavigationBar(params);
  // Custom nav bar (option 2): sync title and back visibility from web canGoBack.
  if (webviewComponentThis && webviewComponentThis.setData) {
    const update = {};
    if (payload.title !== undefined) update.navTitle = payload.title || '';
    if (payload.canGoBack !== undefined) update.showBack = !!payload.canGoBack;
    if (Object.keys(update).length) webviewComponentThis.setData(update);
  }
}

/**
 * SET_BACK_BTN: Controls the NATIVE HOME button (top-right), NOT the back arrow (top-left).
 * Dana API: my.hideBackHome() - hides "return to Dana app" button in nav bar.
 * Payload: { hide: true } or { show: false } to hide. No API to show once hidden.
 * @see https://mini-program.dana.id/docs/miniprogram_dana/mpdev/api_ui_navigationbar_hidebackhome
 */
function setBackBtn({ my, ctx }, payload) {
  const context = { my, ctx };
  const shouldHide =
    (payload && payload.hide === true) || (payload && payload.show === false);
  if (shouldHide && my.canIUse && my.canIUse('hideBackHome')) {
    my.hideBackHome();
  }
  // Always respond - web bridge waits for this
  postMessageToWebView(context, OUTGOING_ACTIONS_TYPES.SET_BACK_BTN, { success: true });
}

function openMinappByID({ my }, payload) {
  my.navigateToMiniProgram({
    appId: payload.id,
    extraData: payload,
  });
}

/** Web calls this when at root and user tapped back - close miniapp. */
function navigateBack({ my }) {
  my.navigateBack();
}
function getSystemInfo(context, payload) {
  context.my.getSystemInfo({
    success: (response) => {
      postMessageToWebView(
        context,
        OUTGOING_ACTIONS_TYPES.GET_SYSTEM_INFO,
        response,
      );
    },
    fail: (error) => {
      postMessageToWebView(
        context,
        OUTGOING_ACTIONS_TYPES.GET_SYSTEM_INFO,
        error,
        true,
      );
    },
  });
}

function trade_pay(context, payload) {
  const { my, ctx } = context;
  if (
    !payload ||
    (!payload.tradeNO && !payload.paymentUrl && !payload.orderStr)
  ) {
    postMessageToWebView(
      context,
      OUTGOING_ACTIONS_TYPES.TRADE_PAY,
      { message: "missing tradeNO, paymentUrl or orderStr" },
      true,
    );
    return;
  }
  my.tradePay({
    tradeNO: payload.tradeNO,
    orderStr: payload.orderStr,
    paymentUrl: payload.paymentUrl,
    success: (res) => {
      postMessageToWebView(context, OUTGOING_ACTIONS_TYPES.TRADE_PAY, res);
    },
    fail: (res) => {
      postMessageToWebView(
        context,
        OUTGOING_ACTIONS_TYPES.TRADE_PAY,
        res,
        true,
      );
    },
  });
}

const ACTIONS_STRATEGY = {
  [INCOMING_ACTIONS_TYPES.TRADE_PAY]: trade_pay,
  [INCOMING_ACTIONS_TYPES.GET_SYSTEM_INFO]: getSystemInfo,
  [INCOMING_ACTIONS_TYPES.SET_NAV_BAR]: setNavBar,
  [INCOMING_ACTIONS_TYPES.SET_BACK_BTN]: setBackBtn,
  [INCOMING_ACTIONS_TYPES.AUTH_CODE]: getAndSendAuthCode,
  [INCOMING_ACTIONS_TYPES.MINIAPP_LOADED]: onMiniappLoaded,
  [INCOMING_ACTIONS_TYPES.OPEN_MINIAPP_BY_ID]: openMinappByID,
  [INCOMING_ACTIONS_TYPES.NAVIGATE_BACK]: navigateBack,
};

export function getAction(my, ctx, webviewComponentThis) {
  return function (actionType, payload, hostAppPayload) {
    const action = ACTIONS_STRATEGY[actionType];
    action &&
      action({ my, ctx }, payload, webviewComponentThis, hostAppPayload);
  };
}
