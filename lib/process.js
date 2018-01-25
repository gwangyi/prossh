"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PtyProcess = exports.Process = void 0;

var _stream = require("stream");

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Stream =
/*#__PURE__*/
function (_Duplex) {
  _inherits(Stream, _Duplex);

  function Stream(stdin) {
    var _this;

    var opt = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Stream);

    _this = _possibleConstructorReturn(this, (Stream.__proto__ || Object.getPrototypeOf(Stream)).call(this, opt));
    _this.$stdin = stdin;
    return _this;
  }

  _createClass(Stream, [{
    key: "_write",
    value: function _write(chunk, encoding, callback) {
      this.$stdin.write(chunk, encoding, callback);
    }
  }, {
    key: "_read",
    value: function _read(size) {}
  }]);

  return Stream;
}(_stream.Duplex);

var DummyReadable =
/*#__PURE__*/
function (_Readable) {
  _inherits(DummyReadable, _Readable);

  function DummyReadable() {
    _classCallCheck(this, DummyReadable);

    return _possibleConstructorReturn(this, (DummyReadable.__proto__ || Object.getPrototypeOf(DummyReadable)).apply(this, arguments));
  }

  _createClass(DummyReadable, [{
    key: "_read",
    value: function _read(size) {}
  }]);

  return DummyReadable;
}(_stream.Readable);

var Process =
/*#__PURE__*/
function () {
  function Process(client, stream) {
    _classCallCheck(this, Process);

    this.$client = client;
    this.$stream = stream;
    this.stream = new Stream(stream.stdin);
    var stdout = [new DummyReadable(), this.stream];
    var stderr = [new DummyReadable(), this.stream];
    stream.stdout.on('data', function (data) {
      return stdout.map(function (strm) {
        return strm.push(data);
      });
    });
    stream.stderr.on('data', function (data) {
      return stderr.map(function (strm) {
        return strm.push(data);
      });
    });
    this.stdout = stream.stdout;
    this.stderr = stream.stderr;
    this.stdin = stream.stdin;
    this.exitCode = new Promise(function (resolve, reject) {
      stream.on('close', function (code, signalName, didCoreDump, description) {
        if (code !== null) {
          resolve(code);
        } else {
          reject(new Error("".concat(description, " ").concat(signalName) + (didCoreDump ? ' (core dumped)' : '')));
        }
      });
    });
  }

  _createClass(Process, [{
    key: "signal",
    value: function signal(signalName) {
      var _this2 = this;

      return new Promise(function (resolve) {
        if (!_this2.$stream.signal(signalName)) {
          _this2.$client.on('continue', function () {
            return resolve();
          });
        } else {
          resolve();
        }
      });
    }
  }]);

  return Process;
}();

exports.Process = Process;

var PtyProcess =
/*#__PURE__*/
function (_Process) {
  _inherits(PtyProcess, _Process);

  function PtyProcess() {
    _classCallCheck(this, PtyProcess);

    return _possibleConstructorReturn(this, (PtyProcess.__proto__ || Object.getPrototypeOf(PtyProcess)).apply(this, arguments));
  }

  _createClass(PtyProcess, [{
    key: "setWindow",
    value: function setWindow(rows, cols, height, width) {
      var _this3 = this;

      return new Promise(function (resolve) {
        if (!_this3.$stream.setWindow(rows, cols, height, width)) {
          _this3.$client.on('continue', function () {
            return resolve();
          });
        } else {
          resolve();
        }
      });
    }
  }]);

  return PtyProcess;
}(Process);

exports.PtyProcess = PtyProcess;