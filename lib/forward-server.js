"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ForwardServer = exports._getFamily = void 0;

var _events = _interopRequireDefault(require("events"));

var _net = _interopRequireDefault(require("net"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _getFamily = function _getFamily(addr) {
  var v = _net.default.isIP(addr);

  if (v === 0) return 'IPv4';else return 'IPv' + v;
};

exports._getFamily = _getFamily;

var ForwardServer =
/*#__PURE__*/
function (_EventEmitter) {
  _inherits(ForwardServer, _EventEmitter);

  function ForwardServer(host, port, client) {
    var _this;

    _classCallCheck(this, ForwardServer);

    _this = _possibleConstructorReturn(this, (ForwardServer.__proto__ || Object.getPrototypeOf(ForwardServer)).call(this));
    _this.$info = {
      host: host,
      port: port,
      client: client
    };
    return _this;
  }

  _createClass(ForwardServer, [{
    key: "address",
    value: function address() {
      var family = _getFamily(this.$info.host);

      return {
        address: this.$info.host,
        port: this.$info.port,
        family: family
      };
    }
  }, {
    key: "close",
    value: function close(callback) {
      if (callback) {
        this.on('close', callback);
      }

      return this.$info.client.unforwardIn(this.$info);
    }
  }]);

  return ForwardServer;
}(_events.default);

exports.ForwardServer = ForwardServer;