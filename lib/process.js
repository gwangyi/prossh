"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PtyProcess = exports.Process = void 0;

var _stream = require("stream");

var _eventStream = _interopRequireDefault(require("event-stream"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Process =
/*#__PURE__*/
function () {
  function Process(client, stream) {
    _classCallCheck(this, Process);

    this.$client = client;
    this.$stream = stream;
    var stdout = [new _stream.PassThrough(), new _stream.PassThrough()];
    var stderr = [new _stream.PassThrough(), new _stream.PassThrough()];
    stdout.forEach(stream.stdout.pipe.bind(stream.stdout));
    stderr.forEach(stream.stderr.pipe.bind(stream.stderr));

    var commonOut = _eventStream.default.merge(stdout[1], stderr[1]);

    this.stream = _eventStream.default.duplex(stream.stdin, commonOut);
    this.stdout = stdout[0];
    this.stderr = stderr[0];
    this.stdin = stream.stdin;
    this.result = new Promise(function (resolve, reject) {
      stream.on('close', function (code, signalName, didCoreDump, description) {
        resolve({
          code: code,
          signalName: signalName,
          didCoreDump: didCoreDump,
          description: description
        });
      });
    });
    this.exitCode = this.result.then(function (_ref) {
      var code = _ref.code;
      return code;
    }, function (err) {
      throw err;
    });
    this.exitSignal = this.result.then(function (_ref2) {
      var signalName = _ref2.signalName;
      return signalName;
    }, function (err) {
      throw err;
    });
  }

  _createClass(Process, [{
    key: "signal",
    value: function signal(signalName) {
      var _this = this;

      return new Promise(function (resolve) {
        if (!_this.$stream.signal(signalName)) {
          _this.$client.on('continue', function () {
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
      var _this2 = this;

      return new Promise(function (resolve) {
        if (!_this2.$stream.setWindow(rows, cols, height, width)) {
          _this2.$client.on('continue', function () {
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