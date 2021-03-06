"use strict";

var util = {
    zIndex: 1,
    overlay: null,
    overlayContent: null,
    overlayContentStack: [],
    xhrCall: function (success, error, url, method, contentType, payload) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    if (success) {
                        success(xhr);
                    }
                } else {
                    if (error) {
                        error(xhr);
                    }
                }
            }
        };
        xhr.open(method, url);
        if (contentType) {
            xhr.setRequestHeader("Content-Type", contentType);
        }
        xhr.send(payload);
    },
    postParm: function (obj) {
        var property, retval = null;
        for (property in obj) {
            if (obj.hasOwnProperty(property)) {
                if (retval !== null) retval += "&";
                else retval = "";
                retval += property + "=" + encodeURIComponent(obj[property]);
            }
        }
        return retval;
    },
    makeMovable: function (obj, handle) {
        var initX, initY, mousePressX, mousePressY, isDrag = false;
        handle = handle || obj;

        var grab = function (e) {
            var rect = obj.getBoundingClientRect();
            obj.style.margin = "0";
            obj.style.position = "absolute";
            obj.style.top = rect.top + "px";
            obj.style.left = rect.left + "px";
            obj.style.width = (rect.right - rect.left) + "px";
            obj.style.height = (rect.bottom - rect.top) + "px";
            initX = rect.left;
            initY = rect.top;
            mousePressX = event.clientX;
            mousePressY = event.clientY;
            obj.style.zIndex = util.zIndex++;
            isDrag = true;
            window.addEventListener("mousemove", move, false);
            window.addEventListener("mouseup", drop, false);
        };

        function move(e) {
            if (isDrag) {
                obj.style.left = initX + e.clientX - mousePressX + "px";
                obj.style.top = initY + e.clientY - mousePressY + "px";
            }
        }

        function drop() {
            isDrag = false;
            window.removeEventListener("mousemove", move, false);
            window.removeEventListener("mouseup", drop, false);
        }

        handle.addEventListener("mousedown", grab, false);
    },
    pushOverlay: function (elm, title) {
        var stackLen = util.overlayContentStack.length;
    
        if (stackLen === 0) {
            util.overlay = document.createElement("div");
            util.overlay.className = "overlay";
            document.body.appendChild(util.overlay);
        } else {
            util.overlay.removeChild(util.overlayContentStack[stackLen - 1]);
        }
    
        util.overlayContent = document.createElement("div");
        util.overlayContent.className = "overlayContent";
        util.overlayContent.appendChild(elm);
        util.overlay.appendChild(util.overlayContent);

        if (title !== undefined) {
            var overlayContentTitle = document.createElement("div");
            overlayContentTitle.className = "overlayContentTitle";
            overlayContentTitle.appendChild(document.createTextNode(title));
            util.overlayContent.insertBefore(overlayContentTitle, elm);
            util.makeMovable(util.overlayContent, overlayContentTitle);
        }
        var rect = util.overlayContent.getBoundingClientRect();
        var marginTop = (window.innerHeight - (rect.bottom - rect.top)) / 2 + document.documentElement.scrollTop;
        if (marginTop < 0) marginTop = window.innerHeight;
        util.overlayContent.style.marginTop = marginTop.toString() + "px";

        util.overlayContentStack.push(util.overlayContent);
    },
    popOverlay: function () {   
        var stackLen = util.overlayContentStack.length;
        if (stackLen === 0) return;
        util.overlay.removeChild(util.overlayContentStack[stackLen - 1]);
        if (stackLen === 1) {
            document.body.removeChild(util.overlay);
            util.overlay = null;
            util.overlayContent = null;
        } else {
            util.overlay.appendChild(util.overlayContentStack[stackLen - 2]);
            util.overlayContent = util.overlayContentStack[stackLen - 2];
        }
        util.overlayContentStack.pop();
    },
    contextMenu: function (x, y, menu) {
        var fnRemove = function () {
            document.body.removeChild(menu);
            document.body.removeEventListener("click", fnRemove, true);
            document.body.removeEventListener("scroll", fnRemove, true);
            document.body.removeEventListener("contextmenu", fnRemove, true);
        };
        menu.className += " contextMenu";
        for (var i = 0; i < menu.childNodes.length; i++) {
            if (menu.childNodes[i].nodeType === 1) menu.childNodes[i].className += " contextMenuItem";
        }
        menu.style.top = y;
        menu.style.left = x;
    
        setTimeout(function () {
            document.body.appendChild(menu);
            document.body.addEventListener("click", fnRemove, true);
            document.body.addEventListener("scroll", fnRemove, true);
            document.body.addEventListener("contextmenu", fnRemove, true);
        }, 10);
    },
    scaleFont: function(elm) {
        elm.style.fontSize = null;
        if (elm.scrollWidth > elm.offsetWidth) {
            var fontSize = parseFloat(window.getComputedStyle(elm).getPropertyValue("font-size"));
            for (var i = 0; i < 20 && elm.scrollWidth > elm.offsetWidth; i++) {
                fontSize = fontSize * .95;
                elm.style.fontSize = (fontSize * .9).toString() + "px";
            }
        }
    },
    cookieSet: function(name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days*24*60*60*1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "").encodeURIComponent()  + expires + "; path=/";
    },
    cookieGet: function(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1,c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
        }
        return null;
    },
    cookieErase: function(name) {   
        document.cookie = name+'=; Max-Age=-99999999;';  
    }
};

Element.prototype.constructChild = function (nodeName) {
    var doc = this.ownerDocument,
        node = doc.createElement(nodeName),
        props = null,
        value = null,
        sibling = null;

    for (var i = 1; i < arguments.length; i++) {
        var arg = arguments[i];
        if (arg instanceof Element) sibling = arg;
        else if (typeof arg === "string") value = arg;
        else if (arg !== null && typeof arg === "object") props = arg;
    }

    if (props !== null) {
        for (var property in props) {
            if (props.hasOwnProperty(property)) node.setAttribute(property, props[property]);
        }
    }

    if (value !== null) node.appendChild(doc.createTextNode(value));
    this.insertBefore(node, sibling);
    return node;
};
