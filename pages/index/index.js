/*CONSTANTS*/
import { WEB_VIEW_CTX_TARGET } from '/common/constants'
import * as gconfig from '/app.json'

const app = getApp()

Page({
  data: {
    isMiniappLoaded: false,
    WEB_VIEW_CTX_TARGET,
    url: gconfig.url,
  },
  onLoad() {
    this.webViewManager = app.webViewManager(WEB_VIEW_CTX_TARGET)
  },
  onMessage(e) {
    const hostAppPayload = { deepLinkParams: app.deeplinkParams }
    this.webViewManager.handleEvents(e, this, hostAppPayload)
  },
})
