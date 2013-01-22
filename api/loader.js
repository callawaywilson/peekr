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
  var data = {};
  var peekr = null;

  //Global Callback for JSONP data
  window._peekr_callback = function(id, href, ogData) {
    data[href] = ogData;
    popover(els[id], ogData);
  };

  function fetch(id, href) {
    var script = document.createElement('script');
    script.src = "http://localhost:8888/data?id="+id+"&url="+encodeURIComponent(href);
    document.body.appendChild(script);
  };

  function popover(targetEl, data) {
    console.log("Opening data on " + targetEl);
    console.log(data);
    if (peekr) document.getElementsByTagName('body')[0].removeChild(peekr);
    peekr = popoverHtml(targetEl, data);
    document.getElementsByTagName('body')[0].appendChild(peekr);
    position(peekr, targetEl);
  };

  function removePopover() {
    if (peekr) {
      document.getElementsByTagName('body')[0].removeChild(peekr);
      peekr = null;
    }
  };

  function loading(el, data) {

  };

  function popoverHtml(el, data) {
    var html = div('_peekr');
    var container = div('_peekr_container');
    html.appendChild(container);
    return html;
  }; 

  function position(el, targetEl) {
    var offset = getOffset(targetEl);
    el.style.left = offset.left + "px";
    el.style.top = offset.top + 20 + "px";
  };

  function div(styleClass, html) {
    var el = document.createElement("div");
    el.setAttribute("class", styleClass);
    if (html) el.innerHTML = html;
    return el;
  };

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

  //Public Methods:

  var attach = function(el) {
    var isOver = false;
    var over = function() {
      isOver = true;
      setTimeout(function() {if (isOver) open(el)}, 100);
    }
    var out = function() {
      isOver = false;
      removePopover();
    }
    el.addEventListener("mouseover", over, false);
    el.addEventListener("mouseout", out, false);
  };

  var open = function(el) {
    if (el.href == null) throw "Element must have href";
    var id = "_peekr_" + curID++;
    if (data[el.href]) popover(el, data[el.href]);
    else {
      els[id] = el;
      fetch(id, el.href);
    }
  };

  return {
    attach: attach,
    open: open
  };

}()