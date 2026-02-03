import WebViewManager from './webview-manager/webview-manager.service'

App({

  webViewManager: target => new WebViewManager(my, target),

  deeplinkParams: undefined,

  onLaunch(options) {
    this.handleDeepLink(options)
  },

  handleDeepLink(options) {
    if(!options.query) return;

    const params = options.query

    if(!params.linkType || !params.handle) return;

    this.deeplinkParams = params
  },
  
})
