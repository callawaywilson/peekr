var request = require('request')

module.exports = exports = function(options) {

  if (options.token == null) throw "token is required";
  if (options.project_id == null) throw "project_id is required";

  var cache = 'peekr_urls';
  var ttl = options.ttl || 360;

  function itemUrl(url) {
    return "https://cache-aws-us-east-1.iron.io/1" +
      "/projects/" + options.project_id + 
      "/caches/" + cache +
      "/items/" + escapeKey(url);
  }

  function escapeKey(key) {
    // todo when ironcache works with URI encoded use:
    // return encodeURIComponent(key)
    return key.replace(/[^A-Za-z0-9]+/g, "_");
  }

  this.put = function(url, value) {
    request({
      url: itemUrl(url),
      method: "PUT",
      headers: {
        "Authorization": "OAuth "+ options.token
      },
      json: {
        value: JSON.stringify(value),
        expires_in: ttl
      }
    }, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log("Cache PUT: [" + url + "]");
      } else if (!error && response.statusCode == 404) {
        console.log("Cache PUT Miss: [" + url + "]:" + JSON.stringify(body));
      } else {
        console.log("Cache PUT Error: " + error + ": " + JSON.stringify(body));
      }
    })
  }

  this.get = function(url, callback) {
    var start = new Date().getTime();
    request({
      uri: itemUrl(url),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "OAuth "+ options.token
      }
    }, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        var elapsed = new Date().getTime() - start;
        console.log("Cache Hit: [" + url + "] in " + elapsed + "ms");
        callback(JSON.parse(JSON.parse(body).value));
      } else if (!error && response.statusCode == 404) {
        console.log("Cache Miss: [" + url + "]");
        callback(null);
      } else {
        console.log("Cache GET Error: " + error);
        callback(null);
      }
    })
  }

}