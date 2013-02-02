//Insert CSS
(function() {
  var head = document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.setAttribute("type", "text/css");
  var css = "<%= css.replace(/\s+/g, ' ') %>";
  if (style.styleSheet){
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
  head.appendChild(style);
})();

var Peekr = function() {

  var curID = 0;
  var els = {};
  var dataCache = {};
  var peekr = null;

  var callbackPrefix = "_peekr_callback_";

  //Dimensions:
  var width = 300;
  var height = 120;

  function fetch(id, href, callback) {
    var callbackName = callbackPrefix + id;
    window[callbackName] = callback;
    var script = document.createElement('script');
    script.src = "http://<%= host %>/data?callback=" + callbackName + 
      "&url=" + encodeURIComponent(href);
    document.body.appendChild(script);
  };

  function popover(targetEl, data, e) {
    if (peekr) document.getElementsByTagName('body')[0].removeChild(peekr);
    peekr = popoverEl(targetEl, data, e);
  };

  function removePopover() {
    if (peekr) {
      document.getElementsByTagName('body')[0].removeChild(peekr);
      peekr = null;
    }
  };

  function loading(el, data) {

  };

  function popoverEl(targetEl, data, e) {
    var html = "";
    if (data.image && data.title && data.description)
      html = popoverElFull(data);
    else if (data.image && data.title) 
      html = popoverElImageTitle(data);
    else if (data.title && data.description)
      html = popoverElTitleDesc(data);
    else if (data.title) 
      html = popoverElTitle(data);
    var div = position(html, targetEl, e);
    return div;
  }; 

  function popoverElFull(data) {
    var html = '<div id="_peekr_container" class="_peekr_container _peekr_container_full">';
    html += '<div class="_peekr_image_container">';
    html += '<div class="_peekr_image"';
    html += 'style="background-image: url(\''+image(data)+'\');"></div></div>';
    html += '<div class="_peekr_title">'+data.title+'</div>';
    html += '<div class="_peekr_url">'+data.url+'</div>';
    html += '<div class="_peekr_description">'+data.description+'</div>';
    return html;
  };

  function popoverElImageTitle(data) {
    var html = '<div id="_peekr_container" class="_peekr_container _peekr_container_image_title">';
    html += '<div class="_peekr_image_container">';
    html += '<div class="_peekr_image"';
    html += 'style="background-image: url(\''+image(data)+'\');"></div></div>';
    html += '<div class="_peekr_title">'+data.title+'</div>';
    html += '<div class="_peekr_url">'+data.url+'</div>';
    return html;
  };

  function popoverElTitle(data) {
    var html = '<div id="_peekr_container" class="_peekr_container _peekr_container_title">';
    html += '<div class="_peekr_title">'+data.title+'</div>';
    html += '<div class="_peekr_url">'+data.url+'</div>';
    return html;
  };

  function popoverElTitleDesc(data) {
    var html = '<div id="_peekr_container" class="_peekr_container _peekr_container_title_desc">';
    html += '<div class="_peekr_title">'+data.title+'</div>';
    html += '<div class="_peekr_url">'+data.url+'</div>';
    html += '<div class="_peekr_description">'+data.description+'</div>';
    return html;
  };

  function position(html, targetEl, e) {
    var div = createDiv('_peekr');
    div.style.visibility = "hidden";
    div.style.opacity = 0;
    div.innerHTML = html;
    document.getElementsByTagName('body')[0].appendChild(div);
    positionQuadrant(div, targetEl, e);
    div.style.visibility = "";
    div.style.opacity = 1;
    return div
  };

  //topLeft, topRight, bottomLeft, bottomRight
  function positionQuadrant(div, targetEl, e) {
    var quadrant = getQuadrant(div, targetEl, e);
    var offset = getOffset(targetEl);
    var x = e ? (e.clientX - 30) : offset.left
    if (quadrant == 'bottom_left') {
      div.style.left = x + "px";
      div.style.top = offset.top + 30 + "px";
      getPeekrContainer().className += " _peekr_arrow_bottom_left";
    } else if (quadrant == 'bottom_right') {
      div.style.left = x - div.clientWidth + 60 + "px";
      div.style.top = offset.top + 30 + "px";
      getPeekrContainer().className += " _peekr_arrow_bottom_right";
    } else if (quadrant == 'top_right') {
      div.style.left = x - div.clientWidth + 60 + "px";
      div.style.top = offset.top - 12 - div.clientHeight + "px";
      getPeekrContainer().className += " _peekr_arrow_top_right";
    } else {
      div.style.left = x + "px";
      div.style.top = offset.top - 12 - div.clientHeight + "px";
      getPeekrContainer().className += " _peekr_arrow_top_left";
    }
  };

  function getQuadrant(div, targetEl, e) {
    var offset = getOffset(targetEl);
    var scroll = getScroll();
    var x = e ? (e.clientX - 30) : offset.left
    var pos = "top_"
    if (offset.top - 12 - div.clientHeight - 10 - scroll.scrollTop < 0) {
      pos = 'bottom_';
    } 
    if (x + div.clientWidth - 10 > document.documentElement.clientWidth) {
      pos += "right";
    } else {
      pos += "left";
    }
    return pos;
  };

  function getPeekrContainer() {
    return document.getElementById("_peekr_container");
  }

  function createDiv(styleClass, html) {
    var el = document.createElement("div");
    el.setAttribute("class", styleClass);
    if (html) el.innerHTML = html;
    return el;
  };

  function image(data) {
    if (data.image && data.image.indexOf("//" == 0)) return "http:" + data.image;
    if (data.image && data.image.indexOf("http") == 0) return data.image;
    function hostname(data) {
      var a = document.createElement ('a');
      a.href = data.url;
      return a.protocol + "//" + a.hostname;
    }
    if (data.image) return hostname(data) + data.image;
  }

  function getOffset(obj) {
   var obj2 = obj;
   var curtop = 0;
   var curleft = 0;
   if (document.getElementById || document.all) {
    do  {
     curleft += obj.offsetLeft-obj.scrollLeft;
     curtop += obj.offsetTop-obj.scrollTop;
     obj = obj.offsetParent;
     obj2 = obj2.parentNode;
     while (obj2!=obj) {
      curleft -= obj2.scrollLeft;
      curtop -= obj2.scrollTop;
      obj2 = obj2.parentNode;
     }
    } while (obj.offsetParent)
   } else if (document.layers) {
    curtop += obj.y;
    curleft += obj.x;
   }
   return {top: curtop, left: curleft};
  }  
  function getScroll() {
    var scrollLeft = (window.pageXOffset !== undefined) ? 
      window.pageXOffset : (document.documentElement || 
        document.body.parentNode || document.body).scrollLeft;
    var scrollTop = (window.pageYOffset !== undefined) ?
      window.pageYOffset : (document.documentElement || 
        document.body.parentNode || document.body).scrollTop;
    return {scrollTop: scrollTop, scrollLeft: scrollLeft};
  }
  

  //Public Methods:

  var attach = function(el) {
    var isOver = false;
    var over = function(e) {
      isOver = true;
      setTimeout(function() {if (isOver) open(el, e)}, 200);
    }
    var out = function() {
      isOver = false;
      setTimeout(function() {if (!isOver) removePopover()}, 200);
    }
    el.addEventListener("mouseover", over, false);
    el.addEventListener("mouseout", out, false);
  };

  var open = function(el, e) {
    if (el.href == null) throw "Element must have href";
    var id = curID++;
    if (dataCache[el.href]) popover(el, dataCache[el.href], e);
    else {
      els[id] = el;
      fetch(id, el.href, function(data) {
        dataCache[el.href] = data;
        popover(els[id], data, e);
      });
    }
  };

  var data = function(url, callback) {
    var id = curID++;
    fetch(id, url, callback);
  }

  return {
    attach: attach,
    open: open,
    data: data
  };

}();

if (typeof jQuery != 'undefined') {  
  (function( $ ) {
    $.fn.attachPeekr = function() {
      return this.each(function() {
        if (!$(this).attr("href")) throw "Peekr requires an href";
        Peekr.attach(this);
      });
    };
    $.fn.urlMetaData = function(callback) {
      return this.each(function() {
        if (!$(this).attr("href")) throw "Peekr requires an href";
        Peekr.data($(this).attr("href"), callback);
      });
    };
  })( jQuery );
}