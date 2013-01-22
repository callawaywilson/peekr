var request = require('request')
  , url = require('url')
  , cheerio = require('cheerio')

module.exports = exports = function(options) {

  var defaults = {
    timeout: 5000
  }
  this.options = options;

  this.parse = function(callback) {
    request({
      uri: this.options.url,
      headers: this.options.headers
    }, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var doc = cheerio.load(body);
        callback(getOG(doc));
      } else {
        console.log(error);
        callback({error: 'Could not load URL'});
      }
    })
  }

  function getOG($) {
    var data = {}
      , ns = "og"
    $('meta').each(function (index, el) {
      var prop = $(this).attr("property"), key, value;
      if (prop && prop.substring(0, ns.length) === ns) {
        key = prop.substring(ns.length + 1);
        value = $(this).attr("content");
        data[key] = value;
      }
    });
    return getMissing($, data);
  }

  function getMissing($, data) {
    if (data.title == null) data.title = getTitle($);
    if (data.image == null) data.image = getImage($);
    if (data.description == null) data.description = getDescription($);
    return data;
  }

  function getTitle($) {
    return $("head title").text();
  }
  function getImage($) {
    var src = null;
    $('link').each(function() {
      if (elAttrEq($(this), 'rel', 'image_src')) src = $(this).attr('href');
      else if (elAttrEq($(this), 'rel', 'image')) src = $(this).attr('href');
      else if (elAttrEq($(this), 'rel', 'icon')) src = $(this).attr('href');
    });
    if (src == null) {
      $('meta').each(function() {
        if (elAttrEq($(this), 'itemprop', 'image')) src = $(this).attr('content');
        else if (elAttrEq($(this), 'name', 'image')) src = $(this).attr('content');
        else if (elAttrEq($(this), 'link', 'image')) src = $(this).attr('content');
      })
    }
    return src;
  }
  function getDescription($) {
    var desc = null;
    $('meta').each(function() {
      if (elAttrEq($(this), 'name', 'description')) desc = $(this).attr('content');
    })
    return desc;
  }

  function elAttrEq(el, attrName, attrValue) {
    return el.attr(attrName) &&
      el.attr(attrName).toLowerCase &&
      el.attr(attrName).toLowerCase() == attrValue.toLowerCase();
  }

}