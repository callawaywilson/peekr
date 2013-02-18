var sax = require("sax")

module.exports = exports = function(options) {

  this.parse = function(stream, options, callback) {

    var ogData = {}
    var title = null, isTitle = false
    var description = null
    var images = [] //src, size

    var saxStream = sax.createStream(false, options)

    saxStream.onopentag = function (node) {
      // opened a tag.  node has "name" and "attributes"
      if (isOGMeta(node)) setOGData(node, ogData);
      if (node.name == 'TITLE') isTitle = true;
      if (ogData['image'] == null && (node.name == 'LINK' || node.name == 'META')) {
        var img = getImage(node)
        if (img) images.push(img);
      }
      if (node.name == 'META' && node.attributes['NAME'] &&
          node.attributes['NAME'].toLowerCase() == 'description') 
        description = node.attributes['CONTENT']
    }
    saxStream.onclosetag = function (name) {
      if (name == 'TITLE') isTitle = false;
    }
    saxStream.ontext = function (t) {
      if (isTitle) title = t
    }
    saxStream.onerror = function (e) {
      console.error("Parser error", e)
      this._parser.error = null
      this._parser.resume()
    }
    saxStream.end = function () {
      if (stream.response && stream.response.statusCode == 200) {
        if (!ogData.title && title) ogData.title = title;
        if (!ogData.image && images.length > 0) ogData.image = bestImage(images);
        if (!ogData.description && description) ogData.description = description;
        if (!ogData.url) ogData.url = stream.response.request.href;
        if (ogData.error) delete ogData.error;  // Remove any error attribute
        callback(ogData)
      } else {
        callback({
          error: 'Could not load URL',
          statusCode: stream.response.statusCode,
          url: (stream ? stream.href : null)
        })
      }
    }

    stream.on('error', function (err) {
      callback({
        error: 'Could not connect',
        url: (stream ? stream.href : null)
      })
    })

    stream.pipe(saxStream)
  }

  function isOGMeta(node) {
    return node.name == 'META' && 
      node.attributes['PROPERTY'] &&
      node.attributes['PROPERTY'].indexOf('og:') == 0
  }

  function setOGData(node, data) {
    var name = node.attributes['PROPERTY']
    data[name.substring(3).toLowerCase()] = node.attributes['CONTENT']
  }

  function bestImage(images) {
    var best = null;
    var bestSize = -1;
    for (var i = 0; i < images.length; i++) {
      if (images[i].size > bestSize) best = images[i].src
    }
    return best;
  }

  function getImage(node) {
    var src = null, size = 0
    if (node.name == 'LINK') {
      var rel = node.attributes['REL'] 
      if (rel == 'image_src' || rel == 'image' || rel.indexOf('apple-touch-icon') > -1) 
        src = node.attributes['HREF']
    } else if (node.name == 'META') {
      if ('image' == node.attributes['ITEMPROP'] ||
          'image' == node.attributes['NAME'] ||
          'image' == node.attributes['LINK'])
        src = node.attributes['CONTENT']
    }
    if (src) {
      size = getSize(node);
      return {src: src, size: size}
    }
  }

  function getSize(node) {
    var t = node.attributes['SIZE'] || node.attributes['SIZES'] || "0";
    var matches = t.match(/[\d]+/);
    if (matches.length > 0) {
      return parseInt(matches[0], 10);
    }
  }


}