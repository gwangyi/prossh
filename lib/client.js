"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.client = client;

var _ssh = require("ssh2");

var _events = _interopRequireDefault(require("events"));

var _process = require("./process");

var _forwardServer = require("./forward-server");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Client =
/*#__PURE__*/
function (_EventEmitter) {
  _inherits(Client, _EventEmitter);

  function Client(conn) {
    var _this;

    _classCallCheck(this, Client);

    _this = _possibleConstructorReturn(this, (Client.__proto__ || Object.getPrototypeOf(Client)).call(this));
    _this.$conn = conn;
    _this.$promise = Promise.resolve(null);
    _this.banner = '';
    _this.$forwardedIn = {};

    _this.$conn.on('tcp connection', function (detail, accept, reject) {
      var server = (_this.$forwardedIn[detail.destIP] || {})[detail.destPort];

      if (server) {
        var sock = accept();
        sock.localAddress = detail.destIP;
        sock.localPort = detail.destPort;
        sock.localFamily = (0, _forwardServer._getFamily)(detail.destIP);
        sock.remoteAddress = detail.srcIP;
        sock.remotePort = detail.srcPort;
        sock.remoteFamily = (0, _forwardServer._getFamily)(detail.srcIP);
        server.emit('connection', sock);
      } else reject();
    });

    return _this;
  }

  _createClass(Client, [{
    key: "_connectTo",
    value: function _connectTo(opt) {
      var host = opt.host;
      var port = opt.port || 22;
      var cfg = Object.assign({}, opt);
      delete cfg.host;
      delete cfg.port;
      return this.forwardOut({
        host: host,
        port: port
      }).then(function (stream) {
        return client(Object.assign(cfg, {
          sock: stream
        }));
      });
    }
  }, {
    key: "connectTo",
    value: function connectTo(opts) {
      if (!Array.isArray(opts)) {
        opts = [opts];
      }

      var conns = [];
      var opt = opts[0];
      var left = opts.slice(1);

      var cleanup = function cleanup(err) {
        for (var _i = 0; _i < conns.length; _i++) {
          var conn = conns[_i];
          conn.end();
        }

        throw err;
      };

      var promise = this._connectTo(opt).catch(cleanup);

      var _loop = function _loop(_opt) {
        promise = promise.then(function (conn) {
          conns.unshift(conn);
          return conn._connectTo(_opt);
        }, cleanup);
      };

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = left[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _opt = _step.value;

          _loop(_opt);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return promise;
    }
  }, {
    key: "_waitContinue",
    value: function _waitContinue(fn, args) {
      var _this2 = this;

      this.$promise = this.$promise.then(function (_) {
        var cont;
        var promise = new Promise(function (resolve, reject) {
          var argsWithCallback = Array.from(args);
          argsWithCallback.push(function (err, result) {
            if (err) reject(err);else resolve(result);
          });
          cont = fn.apply(_this2.$conn, argsWithCallback);
        });
        if (cont) return function () {
          return promise;
        };else {
          return new Promise(function (resolve) {
            _this2.$conn.once('continue', function () {
              return resolve(function () {
                return promise;
              });
            });
          });
        }
      }, function (err) {
        throw err;
      });
      return this.$promise.then(function (lazy) {
        return lazy();
      }, function (err) {
        throw err;
      });
    }
  }, {
    key: "exec",
    value: function exec(command) {
      var _this3 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var _Process = options.pty ? _process.PtyProcess : _process.Process;

      return this._waitContinue(this.$conn.exec, [command, options]).then(function (stream) {
        return new _Process(_this3.$conn, stream);
      }, function (err) {
        throw err;
      });
    }
  }, {
    key: "shell",
    value: function shell(window, options) {
      var _this4 = this;

      if (options === undefined) {
        options = window;
        window = undefined;
      }

      options = options || {};

      var _Process = options.pty || window ? _process.PtyProcess : _process.Process;

      return this._waitContinue(this.$conn.shell, [window, options]).then(function (stream) {
        return new _Process(_this4.$conn, stream);
      }, function (err) {
        throw err;
      });
    }
  }, {
    key: "forwardIn",
    value: function forwardIn() {
      var _this5 = this;

      var cfg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      if (_typeof(cfg) !== 'object') cfg = {
        port: cfg
      };
      var _cfg = cfg,
          host = _cfg.host,
          port = _cfg.port;
      host = host || 'localhost';
      return this._waitContinue(this.$conn.forwardIn, [host, port]).then(function (newPort) {
        var server = new _forwardServer.ForwardServer(host, newPort, _this5);
        if (!_this5.$forwardedIn[host]) _this5.$forwardedIn[host] = {};
        _this5.$forwardedIn[host][newPort] = server;
        return server;
      }, function (err) {
        throw err;
      });
    }
  }, {
    key: "unforwardIn",
    value: function unforwardIn() {
      var _this6 = this;

      var cfg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      if (_typeof(cfg) !== 'object') cfg = {
        port: cfg
      };
      var _cfg2 = cfg,
          host = _cfg2.host,
          port = _cfg2.port;
      host = host || 'localhost';
      return this._waitContinue(this.$conn.unforwardIn, [host, port]).then(function (_) {
        return ((_this6.$forwardedIn[host] || {})[port] || {
          emit: function emit() {
            return undefined;
          }
        }).emit('close');
      }, function (err) {
        throw err;
      });
    }
  }, {
    key: "forwardOut",
    value: function forwardOut() {
      var cfg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var srcHost = cfg.srcHost,
          srcPort = cfg.srcPort;
      var host = cfg.host || cfg.dstHost;
      var port = cfg.port || cfg.dstPort;
      srcHost = srcHost || 'localhost';
      srcPort = srcPort || 0;
      return this._waitContinue(this.$conn.forwardOut, [srcHost, srcPort, host, port]);
    }
  }, {
    key: "sftp",
    value: function sftp() {
      return this._waitContinue(this.$conn.sftp, []);
    }
  }, {
    key: "subsys",
    value: function subsys(subsystem) {
      return this._waitContinue(this.$conn.subsys, []);
    }
  }, {
    key: "end",
    value: function end() {
      if (this.$conn) {
        this.$conn.end();
      }
    }
  }]);

  return Client;
}(_events.default);

var connect = function connect(opt) {
  return new Promise(function (resolve, reject) {
    var conn = new _ssh.Client();
    var client = new Client(conn);
    conn.once('ready', function () {
      resolve(client);
    }).once('error', function (err) {
      reject(err);
    }).on('banner', function (message, language) {
      client.banner = message;
      client.emit('banner', message, language);
    }).connect(opt);
  });
};

function client(opts) {
  if (!Array.isArray(opts)) {
    opts = [opts];
  }

  var conn = null;
  var opt = opts[0];
  var left = opts.slice(1);

  if (left.length === 0) {
    return connect(opt);
  } else {
    return connect(opt).then(function (c) {
      conn = c;
      return conn.connectTo(left);
    }).catch(function (err) {
      conn.end();
      throw err;
    });
  }
}