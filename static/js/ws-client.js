var WSClient = function () {
    this.sn2cbMap = {};

    this.address = "";
    this.ws = null;
    this.snSeed = 0;

    this.events = {};
    this.defaultTag = "defaultTag";

    this.openCallback = null;
}

$.extend(WSClient.prototype, {
    //===
    // 一个函数经过两次bind后是不相等的，即使bind的参数一样，
    // tag参数就是为了方便消除订阅一个bind后的linstener函数。
    on: function (event, tag, fn) {
        this.addEventListener(event, tag, fn);
    },

    addEventListener: function (event, tag, fn) {
        if (typeof tag === "function") {
            fn = tag;
            tag = this.defaultTag;
        }
        this.events[event] = this.events[event] || {};
        this.events[event][tag] = this.events[event][tag] || [];
        // 防止相同函数重复添加
        if (fn && this.events[event][tag].indexOf(fn) < 0) {
            this.events[event][tag].push(fn);
        }
        return this;
    },

    once(event, fn) {
        var self = this;

        function callback() {
            self.off(event, callback);
            fn.apply(this, arguments);
        }

        this.on(event, callback);
        return this;
    },

    off(event, tag, fn) {
        this.removeEventListener(event, tag, fn);
    },

    removeListener(event, tag, fn) {
        this.removeEventListener(event, tag, fn);
    },

    removeAllListeners() {
        this.removeEventListener();
    },

    removeEventListener(event, tag, fn) {
        if (event == null && tag == null && fn == null) {
            this.events = {};
            return this;
        }

        // remove all handlers of event
        if (event != null && tag == null && fn == null) {
            delete this.events[event];
            return this;
        }

        // specific event
        const tags = this.events[event];
        if (!tags) {
            return this;
        }

        // remove all handlers of tag
        if (typeof tag === "string" && fn == null) {
            delete tags[tag];
            return this;
        }

        // remove specific handlers
        if (typeof tag === "function") {
            fn = tag;
            tag = this.defaultTag;
        }

        for (let tagProperty in tags) {
            if (tagProperty === tag) {
                const fns = tags[tag];
                for (let i = 0; i < fns.length; ++i) {
                    if (fns[i] === fn) {
                        fns.splice(i, 1);
                        break;
                    }
                }
                break;
            }
        }
        return this;
    },

    emit(event, ...args) {
        let tags = this.events[event];
        if (tags) {
            for (let tag in tags) {
                const fns = tags[tag];
                fns.forEach(fn => {
                    fn.apply(this, args);
                });
            }
        }
        return this;
    },

    listeners(event) {
        const tags = this.events[event] || {};
        let handlers = [];
        for (let tag in tags) {
            handlers = handlers.concat(tags[tag]);
        }
        return handlers;
    },

    hasListeners(event) {
        return (this.listeners(event).length > 0);
    },

    //===

    connect(address) {
        this.address = address;
        this.ws = new WebSocket(address);
        this.ws.onopen = this.onOpen.bind(this);
        this.ws.onclose = this.onClose.bind(this);
        this.ws.onerror = this.onError.bind(this);
        this.ws.onmessage = this.onMessage.bind(this);
    },

    connectSocket(address, ws, callback) {
        this.address = address;
        this.ws = ws;
        this.ws.onopen = this.onOpen.bind(this);
        this.ws.onclose = this.onClose.bind(this);
        this.ws.onerror = this.onError.bind(this);
        this.ws.onmessage = this.onMessage.bind(this);
        this.openCallback = callback;
    },

    disconnect(code, reason) {
        console.log("active disconnect from " + this.address);
        this.sn2cbMap = {};
        this.ws.close(code, reason);
    },

    request(reqID, data, cb) {
        const pkg = {
            reqID: reqID,
            reqSN: this.genReqSN(),
            data: data
        };
        this.addRequestCB(pkg.reqSN, cb);
        this.ws.send(JSON.stringify(pkg));
        console.log("request reqID = " + reqID);
    },

    message(msgID, data) {
        const pkg = {
            msgID: msgID,
            data: data
        };
        this.ws.send(JSON.stringify(pkg));
    },

    onOpen(ev) {
        console.log("on open connected to " + this.address);
        this.emit("connected");
        this.on("ping-req", this.onPingReq.bind(this));

        if (this.openCallback) {
            this.openCallback();
        }
    },

    onPingReq(data, cb) {
        console.log("on ping pong");
        const response = {};
        cb(1, response);
    },

    onClose(ev) {
        console.log("disconnected from" + this.address + ", code = " + ev.code + ", reason = " + ev.reason);
        this.emit("disconnected", ev.code, ev.reason);
    },

    onError(ev) {
        console.log("error on connection of " + this.address);
    },

    onMessage(ev) {
        const pkg = JSON.parse(ev.data);
        if (pkg.reqID != undefined) {
            this.emit(pkg.reqID, pkg.data, this.genRequestCB(pkg));
        } else if (pkg.msgID != undefined) {
            this.emit(pkg.msgID, pkg.data);
        } else if (pkg.reqSN != undefined) {
            const cb = this.getRequestCB(pkg.reqSN);
            if (cb) {
                this.rmRequestCB(pkg.reqSN);
                cb(pkg.errCode, pkg.data);
            } else {
                console.log("can not find callback of request, id = " + pkg.reqID + ", sn = " + pkg.reqSN);
            }
        } else {
            console.log("unknown package: " + pkg);
        }
    },

    genRequestCB(pkg) {
        const self = this;
        const responseFunc = pkg.reqSN === undefined ? function () {} :
            function (errCode, responseData) {
                const response = {
                    reqSN: pkg.reqSN,
                    errCode: errCode,
                    data: responseData
                };
                self.ws.send(JSON.stringify(response));
            };
        return responseFunc;
    },

    addRequestCB(sn, cb) {
        if (this.sn2cbMap[sn] != undefined) {
            return;
        }
        this.sn2cbMap[sn] = cb;
    },

    getRequestCB(sn) {
        return this.sn2cbMap[sn];
    },

    rmRequestCB(sn) {
        if (sn === undefined) {
            this.sn2cbMap = {};
            return;
        }
        delete this.sn2cbMap[sn];
    },

    genReqSN() {
        return ++this.snSeed;
    },
});