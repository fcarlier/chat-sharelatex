(function() {
  var Settings, ChatController, metrics, logger, request;

  request = require('request');

  Settings = require('settings-sharelatex');

  logger = require('logger-sharelatex');
  metrics = require("../../infrastructure/Metrics");

  module.exports = ChatController = {
    proxyRequestToChatApi: function(req, res, next) {
      var getReq, url;
      req.headers["Host"] = Settings.apis.chat.host;
      logger.log("Chat login - 1");
      getReq = request({
        url: Settings.apis.chat.url,
        method: req.method,
        headers: req.headers,
        json: req.body
      });
      getReq.pipe(res);
      metrics.inc("chat.chat");
      logger.log("Chat login - 2");
      return getReq.on("error", function(error) {
        logger.error({
          err: error
        }, "Chat API error");
        return res.send(500);
      });
    }
  };

}).call(this);
