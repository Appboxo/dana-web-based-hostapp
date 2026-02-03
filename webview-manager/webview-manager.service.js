/*ACTIONS*/
import { getAction } from './actions'

export default class WebViewManager {

  constructor(my, target) {
    this.my = my
    this.ctx = this.my.createWebViewContext(target)
  }

  handleEvents(e, webviewComponentThis, hostAppPayload) {
    if(!e || !e.detail) {
      this.my.alert({content: 'Unknown error (CODE: 111)'})
      return
    }
    const actionType = e.detail.actionType
    const payload = e.detail.payload
    getAction(this.my, this.ctx, webviewComponentThis)(actionType, payload, hostAppPayload)
  }
}
