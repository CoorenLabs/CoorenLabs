(() => {
  var e,
    t,
    n,
    r,
    u,
    i,
    o = {
      1219(e) {
        e.exports = (function () {
          "use strict";
          function e(e, t) {
            return (e((t = { exports: {} }), t.exports), t.exports);
          }
          var t,
            n,
            r,
            u,
            i,
            o,
            a,
            s,
            c,
            l,
            f,
            d,
            h,
            p,
            D = e(function (e) {
              var t = (e.exports =
                "u" > typeof window && window.Math == Math
                  ? window
                  : "u" > typeof self && self.Math == Math
                    ? self
                    : Function("return this")());
              "number" == typeof __g && (__g = t);
            }),
            v = e(function (e) {
              var t = (e.exports = { version: "2.6.5" });
              "number" == typeof __e && (__e = t);
            });
          v.version;
          var g = function (e) {
              return "object" == typeof e ? null !== e : "function" == typeof e;
            },
            m = function (e) {
              if (!g(e)) throw TypeError(e + " is not an object!");
              return e;
            },
            y = function (e) {
              try {
                return !!e();
              } catch (e) {
                return !0;
              }
            },
            A = !y(function () {
              return (
                7 !=
                Object.defineProperty({}, "a", {
                  get: function () {
                    return 7;
                  },
                }).a
              );
            }),
            F = D.document,
            C = g(F) && g(F.createElement),
            E =
              !A &&
              !y(function () {
                return (
                  7 !=
                  Object.defineProperty(C ? F.createElement("div") : {}, "a", {
                    get: function () {
                      return 7;
                    },
                  }).a
                );
              }),
            b = function (e, t) {
              var n, r;
              if (!g(e)) return e;
              if (
                (t && "function" == typeof (n = e.toString) && !g((r = n.call(e)))) ||
                ("function" == typeof (n = e.valueOf) && !g((r = n.call(e)))) ||
                (!t && "function" == typeof (n = e.toString) && !g((r = n.call(e))))
              )
                return r;
              throw TypeError("Can't convert object to primitive value");
            },
            w = Object.defineProperty,
            B = A
              ? Object.defineProperty
              : function (e, t, n) {
                  if ((m(e), (t = b(t, !0)), m(n), E))
                    try {
                      return w(e, t, n);
                    } catch (e) {}
                  if ("get" in n || "set" in n) throw TypeError("Accessors not supported!");
                  return ("value" in n && (e[t] = n.value), e);
                },
            k = A
              ? function (e, t, n) {
                  return B(e, t, { enumerable: !1, configurable: !0, writable: !0, value: n });
                }
              : function (e, t, n) {
                  return ((e[t] = n), e);
                },
            _ = {}.hasOwnProperty,
            j = function (e, t) {
              return _.call(e, t);
            },
            P = 0,
            O = Math.random(),
            S = e(function (e) {
              var t = "__core-js_shared__",
                n = D[t] || (D[t] = {});
              (e.exports = function (e, t) {
                return n[e] || (n[e] = void 0 !== t ? t : {});
              })("versions", []).push({
                version: v.version,
                mode: "global",
                copyright: "\xa9 2019 Denis Pushkarev (zloirock.ru)",
              });
            })("native-function-to-string", Function.toString),
            x = e(function (e) {
              var t = "Symbol(".concat("src", ")_", (++P + O).toString(36)),
                n = "toString",
                r = ("" + S).split(n);
              ((v.inspectSource = function (e) {
                return S.call(e);
              }),
                (e.exports = function (e, n, u, i) {
                  var o = "function" == typeof u;
                  (o && (j(u, "name") || k(u, "name", n)),
                    e[n] !== u &&
                      (o && (j(u, t) || k(u, t, e[n] ? "" + e[n] : r.join(String(n)))),
                      e === D
                        ? (e[n] = u)
                        : i
                          ? e[n]
                            ? (e[n] = u)
                            : k(e, n, u)
                          : (delete e[n], k(e, n, u))));
                })(Function.prototype, n, function () {
                  return ("function" == typeof this && this[t]) || S.call(this);
                }));
            }),
            T = function (e) {
              if ("function" != typeof e) throw TypeError(e + " is not a function!");
              return e;
            },
            I = function (e, t, n) {
              if ((T(e), void 0 === t)) return e;
              switch (n) {
                case 1:
                  return function (n) {
                    return e.call(t, n);
                  };
                case 2:
                  return function (n, r) {
                    return e.call(t, n, r);
                  };
                case 3:
                  return function (n, r, u) {
                    return e.call(t, n, r, u);
                  };
              }
              return function () {
                return e.apply(t, arguments);
              };
            },
            N = "prototype",
            L = function (e, t, n) {
              var r,
                u,
                i,
                o,
                a = e & L.F,
                s = e & L.G,
                c = e & L.S,
                l = e & L.P,
                f = e & L.B,
                d = s ? D : c ? D[t] || (D[t] = {}) : (D[t] || {})[N],
                h = s ? v : v[t] || (v[t] = {}),
                p = h[N] || (h[N] = {});
              for (r in (s && (n = t), n))
                ((i = ((u = !a && d && void 0 !== d[r]) ? d : n)[r]),
                  (o = f && u ? I(i, D) : l && "function" == typeof i ? I(Function.call, i) : i),
                  d && x(d, r, i, e & L.U),
                  h[r] != i && k(h, r, o),
                  l && p[r] != i && (p[r] = i));
            };
          ((D.core = v),
            (L.F = 1),
            (L.G = 2),
            (L.S = 4),
            (L.P = 8),
            (L.B = 16),
            (L.W = 32),
            (L.U = 64),
            (L.R = 128));
          var M = Math.ceil,
            R = Math.floor,
            V = function (e) {
              return isNaN((e *= 1)) ? 0 : (e > 0 ? R : M)(e);
            },
            U = function (e) {
              if (void 0 == e) throw TypeError("Can't call method on  " + e);
              return e;
            },
            z = function (e, t) {
              var n,
                r,
                u = String(U(e)),
                i = V(t),
                o = u.length;
              return i < 0 || i >= o
                ? void 0
                : (n = u.charCodeAt(i)) < 55296 ||
                    n > 56319 ||
                    i + 1 === o ||
                    (r = u.charCodeAt(i + 1)) < 56320 ||
                    r > 57343
                  ? n
                  : ((n - 55296) << 10) + (r - 56320) + 65536;
            };
          (L(L.P, "String", {
            codePointAt: function (e) {
              return z(this, e);
            },
          }),
            v.String.codePointAt);
          var H = Math.max,
            $ = Math.min,
            q = String.fromCharCode,
            Q = String.fromCodePoint;
          (L(L.S + L.F * (!!Q && 1 != Q.length), "String", {
            fromCodePoint: function (e) {
              for (var t, n, r = arguments, u = [], i = arguments.length, o = 0; i > o; ) {
                if (((t = V((t = n = +r[o++]))) < 0 ? H(t + 1114111, 0) : $(t, 1114111)) !== n)
                  throw RangeError(n + " is not a valid code point");
                u.push(n < 65536 ? q(n) : q(((n -= 65536) >> 10) + 55296, (n % 1024) + 56320));
              }
              return u.join("");
            },
          }),
            v.String.fromCodePoint);
          var Y = /[\u1680\u2000-\u200A\u202F\u205F\u3000]/,
            W =
              /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312E\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEA\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCA0-\uDCDF\uDCFF\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE83\uDE86-\uDE89\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]/,
            G =
              /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u08D4-\u08E1\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u09FC\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9-\u0AFF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D00-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D54-\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1CD0-\u1CD2\u1CD4-\u1CF9\u1D00-\u1DF9\u1DFB-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312E\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEA\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDCA-\uDDCC\uDDD0-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE3E\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC00-\uDC4A\uDC50-\uDC59\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDCA0-\uDCE9\uDCFF\uDE00-\uDE3E\uDE47\uDE50-\uDE83\uDE86-\uDE99\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC36\uDC38-\uDC40\uDC50-\uDC59\uDC72-\uDC8F\uDC92-\uDCA7\uDCA9-\uDCB6\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD47\uDD50-\uDD59]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6\uDD00-\uDD4A\uDD50-\uDD59]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/,
            K = function (e) {
              return (
                "string" == typeof e &&
                ((e >= "a" && e <= "z") ||
                  (e >= "A" && e <= "Z") ||
                  "$" === e ||
                  "_" === e ||
                  W.test(e))
              );
            },
            X = function (e) {
              return (
                "string" == typeof e &&
                ((e >= "a" && e <= "z") ||
                  (e >= "A" && e <= "Z") ||
                  (e >= "0" && e <= "9") ||
                  "$" === e ||
                  "_" === e ||
                  "â" === e ||
                  "â" === e ||
                  G.test(e))
              );
            },
            J = function (e) {
              return "string" == typeof e && /[0-9]/.test(e);
            },
            Z = function (e) {
              return "string" == typeof e && /[0-9A-Fa-f]/.test(e);
            };
          function ee() {
            if (t[u]) return String.fromCodePoint(t.codePointAt(u));
          }
          function et() {
            var e = ee();
            return (
              "\n" === e ? (i++, (o = 0)) : e ? (o += e.length) : o++,
              e && (u += e.length),
              e
            );
          }
          var en = {
            default: function () {
              var e;
              switch (p) {
                case "	":
                case "\v":
                case "\f":
                case " ":
                case "\xa0":
                case "\uFEFF":
                case "\n":
                case "\r":
                case "\u2028":
                case "\u2029":
                  et();
                  return;
                case "/":
                  (et(), (l = "comment"));
                  return;
                case void 0:
                  return (et(), er("eof"));
              }
              return "string" == typeof (e = p) && Y.test(e) ? void et() : en[n]();
            },
            comment: function () {
              switch (p) {
                case "*":
                  (et(), (l = "multiLineComment"));
                  return;
                case "/":
                  (et(), (l = "singleLineComment"));
                  return;
              }
              throw ec(et());
            },
            multiLineComment: function () {
              switch (p) {
                case "*":
                  (et(), (l = "multiLineCommentAsterisk"));
                  return;
                case void 0:
                  throw ec(et());
              }
              et();
            },
            multiLineCommentAsterisk: function () {
              switch (p) {
                case "*":
                  et();
                  return;
                case "/":
                  (et(), (l = "default"));
                  return;
                case void 0:
                  throw ec(et());
              }
              (et(), (l = "multiLineComment"));
            },
            singleLineComment: function () {
              switch (p) {
                case "\n":
                case "\r":
                case "\u2028":
                case "\u2029":
                  (et(), (l = "default"));
                  return;
                case void 0:
                  return (et(), er("eof"));
              }
              et();
            },
            value: function () {
              switch (p) {
                case "{":
                case "[":
                  return er("punctuator", et());
                case "n":
                  return (et(), eu("ull"), er("null", null));
                case "t":
                  return (et(), eu("rue"), er("boolean", !0));
                case "f":
                  return (et(), eu("alse"), er("boolean", !1));
                case "-":
                case "+":
                  ("-" === et() && (h = -1), (l = "sign"));
                  return;
                case ".":
                  ((f = et()), (l = "decimalPointLeading"));
                  return;
                case "0":
                  ((f = et()), (l = "zero"));
                  return;
                case "1":
                case "2":
                case "3":
                case "4":
                case "5":
                case "6":
                case "7":
                case "8":
                case "9":
                  ((f = et()), (l = "decimalInteger"));
                  return;
                case "I":
                  return (et(), eu("nfinity"), er("numeric", 1 / 0));
                case "N":
                  return (et(), eu("aN"), er("numeric", NaN));
                case '"':
                case "'":
                  ((d = '"' === et()), (f = ""), (l = "string"));
                  return;
              }
              throw ec(et());
            },
            identifierNameStartEscape: function () {
              if ("u" !== p) throw ec(et());
              et();
              var e = ei();
              switch (e) {
                case "$":
                case "_":
                  break;
                default:
                  if (!K(e)) throw ef();
              }
              ((f += e), (l = "identifierName"));
            },
            identifierName: function () {
              switch (p) {
                case "$":
                case "_":
                case "â":
                case "â":
                  f += et();
                  return;
                case "\\":
                  (et(), (l = "identifierNameEscape"));
                  return;
              }
              if (X(p)) {
                f += et();
                return;
              }
              return er("identifier", f);
            },
            identifierNameEscape: function () {
              if ("u" !== p) throw ec(et());
              et();
              var e = ei();
              switch (e) {
                case "$":
                case "_":
                case "â":
                case "â":
                  break;
                default:
                  if (!X(e)) throw ef();
              }
              ((f += e), (l = "identifierName"));
            },
            sign: function () {
              switch (p) {
                case ".":
                  ((f = et()), (l = "decimalPointLeading"));
                  return;
                case "0":
                  ((f = et()), (l = "zero"));
                  return;
                case "1":
                case "2":
                case "3":
                case "4":
                case "5":
                case "6":
                case "7":
                case "8":
                case "9":
                  ((f = et()), (l = "decimalInteger"));
                  return;
                case "I":
                  return (et(), eu("nfinity"), er("numeric", (1 / 0) * h));
                case "N":
                  return (et(), eu("aN"), er("numeric", NaN));
              }
              throw ec(et());
            },
            zero: function () {
              switch (p) {
                case ".":
                  ((f += et()), (l = "decimalPoint"));
                  return;
                case "e":
                case "E":
                  ((f += et()), (l = "decimalExponent"));
                  return;
                case "x":
                case "X":
                  ((f += et()), (l = "hexadecimal"));
                  return;
              }
              return er("numeric", 0 * h);
            },
            decimalInteger: function () {
              switch (p) {
                case ".":
                  ((f += et()), (l = "decimalPoint"));
                  return;
                case "e":
                case "E":
                  ((f += et()), (l = "decimalExponent"));
                  return;
              }
              if (J(p)) {
                f += et();
                return;
              }
              return er("numeric", h * Number(f));
            },
            decimalPointLeading: function () {
              if (J(p)) {
                ((f += et()), (l = "decimalFraction"));
                return;
              }
              throw ec(et());
            },
            decimalPoint: function () {
              switch (p) {
                case "e":
                case "E":
                  ((f += et()), (l = "decimalExponent"));
                  return;
              }
              if (J(p)) {
                ((f += et()), (l = "decimalFraction"));
                return;
              }
              return er("numeric", h * Number(f));
            },
            decimalFraction: function () {
              switch (p) {
                case "e":
                case "E":
                  ((f += et()), (l = "decimalExponent"));
                  return;
              }
              if (J(p)) {
                f += et();
                return;
              }
              return er("numeric", h * Number(f));
            },
            decimalExponent: function () {
              switch (p) {
                case "+":
                case "-":
                  ((f += et()), (l = "decimalExponentSign"));
                  return;
              }
              if (J(p)) {
                ((f += et()), (l = "decimalExponentInteger"));
                return;
              }
              throw ec(et());
            },
            decimalExponentSign: function () {
              if (J(p)) {
                ((f += et()), (l = "decimalExponentInteger"));
                return;
              }
              throw ec(et());
            },
            decimalExponentInteger: function () {
              if (J(p)) {
                f += et();
                return;
              }
              return er("numeric", h * Number(f));
            },
            hexadecimal: function () {
              if (Z(p)) {
                ((f += et()), (l = "hexadecimalInteger"));
                return;
              }
              throw ec(et());
            },
            hexadecimalInteger: function () {
              if (Z(p)) {
                f += et();
                return;
              }
              return er("numeric", h * Number(f));
            },
            string: function () {
              switch (p) {
                case "\\":
                  (et(),
                    (f += (function () {
                      switch (ee()) {
                        case "b":
                          return (et(), "\b");
                        case "f":
                          return (et(), "\f");
                        case "n":
                          return (et(), "\n");
                        case "r":
                          return (et(), "\r");
                        case "t":
                          return (et(), "	");
                        case "v":
                          return (et(), "\v");
                        case "0":
                          if ((et(), J(ee()))) throw ec(et());
                          return "\0";
                        case "x":
                          return (
                            et(),
                            (function () {
                              var e = "",
                                t = ee();
                              if (!Z(t) || ((e += et()), !Z((t = ee())))) throw ec(et());
                              return String.fromCodePoint(parseInt((e += et()), 16));
                            })()
                          );
                        case "u":
                          return (et(), ei());
                        case "\n":
                        case "\u2028":
                        case "\u2029":
                          return (et(), "");
                        case "\r":
                          return (et(), "\n" === ee() && et(), "");
                        case "1":
                        case "2":
                        case "3":
                        case "4":
                        case "5":
                        case "6":
                        case "7":
                        case "8":
                        case "9":
                        case void 0:
                          throw ec(et());
                      }
                      return et();
                    })()));
                  return;
                case '"':
                  if (d) return (et(), er("string", f));
                  f += et();
                  return;
                case "'":
                  if (!d) return (et(), er("string", f));
                  f += et();
                  return;
                case "\n":
                case "\r":
                case void 0:
                  throw ec(et());
                case "\u2028":
                case "\u2029":
                  console.warn(
                    "JSON5: '" + ed(p) + "' in strings is not valid ECMAScript; consider escaping",
                  );
              }
              f += et();
            },
            start: function () {
              switch (p) {
                case "{":
                case "[":
                  return er("punctuator", et());
              }
              l = "value";
            },
            beforePropertyName: function () {
              switch (p) {
                case "$":
                case "_":
                  ((f = et()), (l = "identifierName"));
                  return;
                case "\\":
                  (et(), (l = "identifierNameStartEscape"));
                  return;
                case "}":
                  return er("punctuator", et());
                case '"':
                case "'":
                  ((d = '"' === et()), (l = "string"));
                  return;
              }
              if (K(p)) {
                ((f += et()), (l = "identifierName"));
                return;
              }
              throw ec(et());
            },
            afterPropertyName: function () {
              if (":" === p) return er("punctuator", et());
              throw ec(et());
            },
            beforePropertyValue: function () {
              l = "value";
            },
            afterPropertyValue: function () {
              switch (p) {
                case ",":
                case "}":
                  return er("punctuator", et());
              }
              throw ec(et());
            },
            beforeArrayValue: function () {
              if ("]" === p) return er("punctuator", et());
              l = "value";
            },
            afterArrayValue: function () {
              switch (p) {
                case ",":
                case "]":
                  return er("punctuator", et());
              }
              throw ec(et());
            },
            end: function () {
              throw ec(et());
            },
          };
          function er(e, t) {
            return { type: e, value: t, line: i, column: o };
          }
          function eu(e) {
            for (var t = 0; t < e.length; t += 1) {
              var n = e[t];
              if (ee() !== n) throw ec(et());
              et();
            }
          }
          function ei() {
            for (var e = "", t = 4; t-- > 0; ) {
              if (!Z(ee())) throw ec(et());
              e += et();
            }
            return String.fromCodePoint(parseInt(e, 16));
          }
          var eo = {
            start: function () {
              if ("eof" === a.type) throw el();
              ea();
            },
            beforePropertyName: function () {
              switch (a.type) {
                case "identifier":
                case "string":
                  ((s = a.value), (n = "afterPropertyName"));
                  return;
                case "punctuator":
                  es();
                  return;
                case "eof":
                  throw el();
              }
            },
            afterPropertyName: function () {
              if ("eof" === a.type) throw el();
              n = "beforePropertyValue";
            },
            beforePropertyValue: function () {
              if ("eof" === a.type) throw el();
              ea();
            },
            beforeArrayValue: function () {
              if ("eof" === a.type) throw el();
              "punctuator" === a.type && "]" === a.value ? es() : ea();
            },
            afterPropertyValue: function () {
              if ("eof" === a.type) throw el();
              switch (a.value) {
                case ",":
                  n = "beforePropertyName";
                  return;
                case "}":
                  es();
              }
            },
            afterArrayValue: function () {
              if ("eof" === a.type) throw el();
              switch (a.value) {
                case ",":
                  n = "beforeArrayValue";
                  return;
                case "]":
                  es();
              }
            },
            end: function () {},
          };
          function ea() {
            var e;
            switch (a.type) {
              case "punctuator":
                switch (a.value) {
                  case "{":
                    e = {};
                    break;
                  case "[":
                    e = [];
                }
                break;
              case "null":
              case "boolean":
              case "numeric":
              case "string":
                e = a.value;
            }
            if (void 0 === c) c = e;
            else {
              var t = r[r.length - 1];
              Array.isArray(t)
                ? t.push(e)
                : Object.defineProperty(t, s, {
                    value: e,
                    writable: !0,
                    enumerable: !0,
                    configurable: !0,
                  });
            }
            if (null !== e && "object" == typeof e)
              (r.push(e), (n = Array.isArray(e) ? "beforeArrayValue" : "beforePropertyName"));
            else {
              var u = r[r.length - 1];
              n = null == u ? "end" : Array.isArray(u) ? "afterArrayValue" : "afterPropertyValue";
            }
          }
          function es() {
            r.pop();
            var e = r[r.length - 1];
            n = null == e ? "end" : Array.isArray(e) ? "afterArrayValue" : "afterPropertyValue";
          }
          function ec(e) {
            return void 0 === e
              ? eh("JSON5: invalid end of input at " + i + ":" + o)
              : eh("JSON5: invalid character '" + ed(e) + "' at " + i + ":" + o);
          }
          function el() {
            return eh("JSON5: invalid end of input at " + i + ":" + o);
          }
          function ef() {
            return ((o -= 5), eh("JSON5: invalid identifier character at " + i + ":" + o));
          }
          function ed(e) {
            var t = {
              "'": "\\'",
              '"': '\\"',
              "\\": "\\\\",
              "\b": "\\b",
              "\f": "\\f",
              "\n": "\\n",
              "\r": "\\r",
              "	": "\\t",
              "\v": "\\v",
              "\0": "\\0",
              "\u2028": "\\u2028",
              "\u2029": "\\u2029",
            };
            if (t[e]) return t[e];
            if (e < " ") {
              var n = e.charCodeAt(0).toString(16);
              return "\\x" + ("00" + n).substring(n.length);
            }
            return e;
          }
          function eh(e) {
            var t = SyntaxError(e);
            return ((t.lineNumber = i), (t.columnNumber = o), t);
          }
          return {
            parse: function (e, D) {
              ((t = String(e)),
                (n = "start"),
                (r = []),
                (u = 0),
                (i = 1),
                (o = 0),
                (a = void 0),
                (s = void 0),
                (c = void 0));
              do
                ((a = (function () {
                  for (l = "default", f = "", d = !1, h = 1; ; ) {
                    p = ee();
                    var e = en[l]();
                    if (e) return e;
                  }
                })()),
                  eo[n]());
              while ("eof" !== a.type);
              return "function" == typeof D
                ? (function e(t, n, r) {
                    var u = t[n];
                    if (null != u && "object" == typeof u)
                      if (Array.isArray(u))
                        for (var i = 0; i < u.length; i++) {
                          var o = String(i),
                            a = e(u, o, r);
                          void 0 === a
                            ? delete u[o]
                            : Object.defineProperty(u, o, {
                                value: a,
                                writable: !0,
                                enumerable: !0,
                                configurable: !0,
                              });
                        }
                      else
                        for (var s in u) {
                          var c = e(u, s, r);
                          void 0 === c
                            ? delete u[s]
                            : Object.defineProperty(u, s, {
                                value: c,
                                writable: !0,
                                enumerable: !0,
                                configurable: !0,
                              });
                        }
                    return r.call(t, n, u);
                  })({ "": c }, "", D)
                : c;
            },
            stringify: function (e, t, n) {
              var r,
                u,
                i,
                o = [],
                a = "",
                s = "";
              if (
                (null == t ||
                  "object" != typeof t ||
                  Array.isArray(t) ||
                  ((n = t.space), (i = t.quote), (t = t.replacer)),
                "function" == typeof t)
              )
                u = t;
              else if (Array.isArray(t)) {
                r = [];
                for (var c = 0, l = t; c < l.length; c += 1) {
                  var f = l[c],
                    d = void 0;
                  ("string" == typeof f
                    ? (d = f)
                    : ("number" == typeof f || f instanceof String || f instanceof Number) &&
                      (d = String(f)),
                    void 0 !== d && 0 > r.indexOf(d) && r.push(d));
                }
              }
              return (
                n instanceof Number ? (n = Number(n)) : n instanceof String && (n = String(n)),
                "number" == typeof n
                  ? n > 0 && ((n = Math.min(10, Math.floor(n))), (s = "          ".substr(0, n)))
                  : "string" == typeof n && (s = n.substr(0, 10)),
                (function e(t, n) {
                  var i = n[t];
                  switch (
                    (null != i &&
                      ("function" == typeof i.toJSON5
                        ? (i = i.toJSON5(t))
                        : "function" == typeof i.toJSON && (i = i.toJSON(t))),
                    u && (i = u.call(n, t, i)),
                    i instanceof Number
                      ? (i = Number(i))
                      : i instanceof String
                        ? (i = String(i))
                        : i instanceof Boolean && (i = i.valueOf()),
                    i)
                  ) {
                    case null:
                      return "null";
                    case !0:
                      return "true";
                    case !1:
                      return "false";
                  }
                  return "string" == typeof i
                    ? h(i, !1)
                    : "number" == typeof i
                      ? String(i)
                      : "object" == typeof i
                        ? Array.isArray(i)
                          ? (function (t) {
                              if (o.indexOf(t) >= 0)
                                throw TypeError("Converting circular structure to JSON5");
                              o.push(t);
                              var n,
                                r = a;
                              a += s;
                              for (var u = [], i = 0; i < t.length; i++) {
                                var c = e(String(i), t);
                                u.push(void 0 !== c ? c : "null");
                              }
                              if (0 === u.length) n = "[]";
                              else if ("" === s) n = "[" + u.join(",") + "]";
                              else {
                                var l = ",\n" + a,
                                  f = u.join(l);
                                n = "[\n" + a + f + ",\n" + r + "]";
                              }
                              return (o.pop(), (a = r), n);
                            })(i)
                          : (function (t) {
                              if (o.indexOf(t) >= 0)
                                throw TypeError("Converting circular structure to JSON5");
                              o.push(t);
                              var n,
                                u,
                                i = a;
                              a += s;
                              for (
                                var c = r || Object.keys(t), l = [], f = 0;
                                f < c.length;
                                f += 1
                              ) {
                                var d = c[f],
                                  p = e(d, t);
                                if (void 0 !== p) {
                                  var D =
                                    (function (e) {
                                      if (0 === e.length) return h(e, !0);
                                      var t = String.fromCodePoint(e.codePointAt(0));
                                      if (!K(t)) return h(e, !0);
                                      for (var n = t.length; n < e.length; n++)
                                        if (!X(String.fromCodePoint(e.codePointAt(n))))
                                          return h(e, !0);
                                      return e;
                                    })(d) + ":";
                                  ("" !== s && (D += " "), (D += p), l.push(D));
                                }
                              }
                              if (0 === l.length) n = "{}";
                              else if ("" === s) n = "{" + (u = l.join(",")) + "}";
                              else {
                                var v = ",\n" + a;
                                ((u = l.join(v)), (n = "{\n" + a + u + ",\n" + i + "}"));
                              }
                              return (o.pop(), (a = i), n);
                            })(i)
                        : void 0;
                })("", { "": e })
              );
              function h(e) {
                for (
                  var t = { "'": 0.1, '"': 0.2 },
                    n = {
                      "'": "\\'",
                      '"': '\\"',
                      "\\": "\\\\",
                      "\b": "\\b",
                      "\f": "\\f",
                      "\n": "\\n",
                      "\r": "\\r",
                      "	": "\\t",
                      "\v": "\\v",
                      "\0": "\\0",
                      "\u2028": "\\u2028",
                      "\u2029": "\\u2029",
                    },
                    r = "",
                    u = 0;
                  u < e.length;
                  u++
                ) {
                  var o = e[u];
                  switch (o) {
                    case "'":
                    case '"':
                      (t[o]++, (r += o));
                      continue;
                    case "\0":
                      if (J(e[u + 1])) {
                        r += "\\x00";
                        continue;
                      }
                  }
                  if (n[o]) {
                    r += n[o];
                    continue;
                  }
                  if (o < " ") {
                    var a = o.charCodeAt(0).toString(16);
                    r += "\\x" + ("00" + a).substring(a.length);
                    continue;
                  }
                  r += o;
                }
                var s =
                  i ||
                  Object.keys(t).reduce(function (e, n) {
                    return t[e] < t[n] ? e : n;
                  });
                return ((r = r.replace(RegExp(s, "g"), n[s])), s + r + s);
              }
            },
          };
        })();
      },
      8(e) {
        e.exports = (function () {
          "use strict";
          function e() {}
          function t(e) {
            if (!(this instanceof t)) throw TypeError("Promises must be constructed via new");
            if ("function" != typeof e) throw TypeError("not a function");
            ((this._state = 0),
              (this._handled = !1),
              (this._value = void 0),
              (this._deferreds = []),
              o(e, this));
          }
          function n(e, n) {
            for (; 3 === e._state; ) e = e._value;
            0 !== e._state
              ? ((e._handled = !0),
                t._immediateFn(function () {
                  var t,
                    i = 1 === e._state ? n.onFulfilled : n.onRejected;
                  if (null !== i) {
                    try {
                      t = i(e._value);
                    } catch (e) {
                      return void u(n.promise, e);
                    }
                    r(n.promise, t);
                  } else (1 === e._state ? r : u)(n.promise, e._value);
                }))
              : e._deferreds.push(n);
          }
          function r(e, n) {
            try {
              if (n === e) throw TypeError("A promise cannot be resolved with itself.");
              if (n && ("object" == typeof n || "function" == typeof n)) {
                var r = n.then;
                if (n instanceof t) return ((e._state = 3), (e._value = n), void i(e));
                if ("function" == typeof r)
                  return void o(function () {
                    r.apply(n, arguments);
                  }, e);
              }
              ((e._state = 1), (e._value = n), i(e));
            } catch (t) {
              u(e, t);
            }
          }
          function u(e, t) {
            ((e._state = 2), (e._value = t), i(e));
          }
          function i(e) {
            2 === e._state &&
              0 === e._deferreds.length &&
              t._immediateFn(function () {
                e._handled || t._unhandledRejectionFn(e._value);
              });
            for (var r = 0, u = e._deferreds.length; u > r; r++) n(e, e._deferreds[r]);
            e._deferreds = null;
          }
          function o(e, t) {
            var n = !1;
            try {
              e(
                function (e) {
                  n || ((n = !0), r(t, e));
                },
                function (e) {
                  n || ((n = !0), u(t, e));
                },
              );
            } catch (e) {
              if (n) return;
              ((n = !0), u(t, e));
            }
          }
          var a = setTimeout;
          return (
            (t.prototype.catch = function (e) {
              return this.then(null, e);
            }),
            (t.prototype.then = function (t, r) {
              var u = new this.constructor(e);
              return (
                n(
                  this,
                  new (function (e, t, n) {
                    ((this.onFulfilled = "function" == typeof e ? e : null),
                      (this.onRejected = "function" == typeof t ? t : null),
                      (this.promise = n));
                  })(t, r, u),
                ),
                u
              );
            }),
            (t.prototype.finally = function (e) {
              var t = this.constructor;
              return this.then(
                function (n) {
                  return t.resolve(e()).then(function () {
                    return n;
                  });
                },
                function (n) {
                  return t.resolve(e()).then(function () {
                    return t.reject(n);
                  });
                },
              );
            }),
            (t.all = function (e) {
              return new t(function (t, n) {
                if (!e || void 0 === e.length) throw TypeError("Promise.all accepts an array");
                var r = Array.prototype.slice.call(e);
                if (0 === r.length) return t([]);
                for (var u = r.length, i = 0; r.length > i; i++)
                  !(function e(i, o) {
                    try {
                      if (o && ("object" == typeof o || "function" == typeof o)) {
                        var a = o.then;
                        if ("function" == typeof a)
                          return void a.call(
                            o,
                            function (t) {
                              e(i, t);
                            },
                            n,
                          );
                      }
                      ((r[i] = o), 0 == --u && t(r));
                    } catch (e) {
                      n(e);
                    }
                  })(i, r[i]);
              });
            }),
            (t.resolve = function (e) {
              return e && "object" == typeof e && e.constructor === t
                ? e
                : new t(function (t) {
                    t(e);
                  });
            }),
            (t.reject = function (e) {
              return new t(function (t, n) {
                n(e);
              });
            }),
            (t.race = function (e) {
              return new t(function (t, n) {
                for (var r = 0, u = e.length; u > r; r++) e[r].then(t, n);
              });
            }),
            (t._immediateFn =
              ("function" == typeof setImmediate &&
                function (e) {
                  setImmediate(e);
                }) ||
              function (e) {
                a(e, 0);
              }),
            (t._unhandledRejectionFn = function (e) {
              void 0 !== console &&
                console &&
                console.warn("Possible Unhandled Promise Rejection:", e);
            }),
            t
          );
        })();
      },
      492(e) {
        var t,
          n,
          r,
          u = {},
          i = {},
          o =
            ((t = function () {
              return document.head || document.getElementsByTagName("head")[0];
            }),
            function () {
              return (void 0 === n && (n = t.apply(this, arguments)), n);
            });
        function a(e, t) {
          var n,
            r,
            u,
            a,
            s = i[e];
          s ||
            (s = i[e] =
              {
                element:
                  (((n = document.createElement("style")).type = "text/css"),
                  n.setAttribute("data-jwplayer-id", e),
                  o().appendChild(n),
                  n),
                counter: 0,
              });
          var l = s.counter++;
          return (
            (r = s.element),
            (u = function (e) {
              c(r, l, e);
            }),
            (a = function () {
              c(r, l, "");
            }),
            u(t.css),
            function (e) {
              e ? (e.css !== t.css || e.media !== t.media) && u((t = e).css) : a();
            }
          );
        }
        e.exports = {
          style: function (e, t) {
            !(function (e, t) {
              for (var n = 0; n < t.length; n++) {
                var r = t[n],
                  i = (u[e] || {})[r.id];
                if (i) {
                  for (var o = 0; o < i.parts.length; o++) i.parts[o](r.parts[o]);
                  for (; o < r.parts.length; o++) i.parts.push(a(e, r.parts[o]));
                } else {
                  for (var s = [], o = 0; o < r.parts.length; o++) s.push(a(e, r.parts[o]));
                  ((u[e] = u[e] || {}), (u[e][r.id] = { id: r.id, parts: s }));
                }
              }
            })(
              t,
              (function (e) {
                for (var t = [], n = {}, r = 0; r < e.length; r++) {
                  var u = e[r],
                    i = u[0],
                    o = { css: u[1], media: u[2] };
                  n[i] ? n[i].parts.push(o) : t.push((n[i] = { id: i, parts: [o] }));
                }
                return t;
              })(e),
            );
          },
          clear: function (e, t) {
            var n = u[e];
            if (n) {
              if (t) {
                var r = n[t];
                if (r) for (var i = 0; i < r.parts.length; i += 1) r.parts[i]();
                return;
              }
              for (var o = Object.keys(n), a = 0; a < o.length; a += 1)
                for (var s = n[o[a]], c = 0; c < s.parts.length; c += 1) s.parts[c]();
              delete u[e];
            }
          },
        };
        var s =
          ((r = []),
          function (e, t) {
            return ((r[e] = t), r.filter(Boolean).join("\n"));
          });
        function c(e, t, n) {
          if (e.styleSheet) e.styleSheet.cssText = s(t, n);
          else {
            var r = document.createTextNode(n),
              u = e.childNodes[t];
            u ? e.replaceChild(r, u) : e.appendChild(r);
          }
        }
      },
      9566(e) {
        e.exports =
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 29.3" class="jw-svg-icon jw-svg-icon-watermark" focusable="false"><path d="M37,16.68c0,2.4-.59,3.43-2.4,3.43a5.75,5.75,0,0,1-3.38-1.23v3.58a7.39,7.39,0,0,0,3.67,1c3.67,0,5.73-1.91,5.73-6.32V5.86H37Z"></path><polygon points="58.33 17.61 55.39 6.01 52.55 6.01 49.52 17.61 46.73 6.01 43.06 6.01 47.56 23.29 50.89 23.29 53.92 11.88 56.96 23.29 60.24 23.29 64.74 6.01 61.17 6.01 58.33 17.61"></polygon><path d="M73.84,6H67.47V23.29h2.2v-6.9h4.17c3.47,0,5.77-1.77,5.77-5.19S77.31,6,73.84,6Zm0,8.47H69.72V8h4.12c2.3,0,3.57,1.22,3.62,3.28C77.46,13.21,76.19,14.48,73.84,14.48Z"></path><path d="M99.2,6l-6,15.27H85V6H82.8V23.29H94.7l2-5.19h7.09l2,5.19H108L101.26,6ZM97.39,16.14l2.84-7.39L103,16.14Z"></path><polygon points="113.98 14.18 108.99 6.01 106.59 6.01 112.81 16.14 112.81 23.29 115.01 23.29 115.01 16.14 121.33 6.01 118.98 6.01 113.98 14.18"></polygon><polygon points="123.14 23.29 134.1 23.29 134.1 21.28 125.29 21.28 125.29 15.41 133.32 15.41 133.32 13.45 125.29 13.45 125.29 7.97 134.1 7.97 134.1 6.01 123.14 6.01 123.14 23.29"></polygon><path d="M144.86,15.85c2.74-.39,4.41-2,4.41-4.85,0-3.23-2.26-5-5.73-5h-6.32V23.29h2.22V16h3.08l4.94,7.29H150Zm-5.42-1.71V8h4.06c2.3,0,3.62,1.17,3.62,3.08s-1.32,3.09-3.62,3.09Z"></path><path d="M27.63.09a1,1,0,0,0-1.32.48c-.24.51-6.35,15.3-6.35,15.3-.2.46-.33.41-.33-.07,0,0,0-5.15,0-9.39,0-2.31-1.12-3.61-2.73-3.88A3.12,3.12,0,0,0,14.83,3a4.57,4.57,0,0,0-1.5,1.79c-.48.94-3.47,9.66-3.47,9.66-.16.46-.31.44-.31,0,0,0-.09-3.76-.18-4.64-.13-1.36-.44-3.59-2.2-3.7S4.77,8,4.36,9.24c-.29.84-1.65,5.35-1.65,5.35l-.2.46h0c-.06.24-.17.24-.24,0l-.11-.42Q2,14,1.74,13.31a1.71,1.71,0,0,0-.33-.66.83.83,0,0,0-.88-.22.82.82,0,0,0-.53.69,4.22,4.22,0,0,0,.07.79,29,29,0,0,0,1,4.6,1.31,1.31,0,0,0,1.8.66,3.43,3.43,0,0,0,1.24-1.81c.33-.81,2-5.48,2-5.48.18-.46.31-.44.29,0,0,0-.09,4.57-.09,6.64a13.11,13.11,0,0,0,.28,2.93,2.41,2.41,0,0,0,.82,1.27,2,2,0,0,0,1.41.4,2,2,0,0,0,.7-.24,3.15,3.15,0,0,0,.79-.71,12.52,12.52,0,0,0,1.26-2.11c.81-1.6,2.92-6.58,2.92-6.58.2-.46.33-.41.33.07,0,0-.26,8.36-.26,11.55a6.39,6.39,0,0,0,.44,2.33,2.8,2.8,0,0,0,1.45,1.61A2.57,2.57,0,0,0,18.79,29a3.76,3.76,0,0,0,1.28-1.32,15.12,15.12,0,0,0,1.07-2.31c.64-1.65,1.17-3.33,1.7-5s5-17.65,5.28-19a1.79,1.79,0,0,0,0-.46A1,1,0,0,0,27.63.09Z"></path></svg>';
      },
      9765(e, t, n) {
        "use strict";
        n.d(t, { A: () => r });
        let r = {
          advertising: {
            admessage: "This ad will end in xx",
            cuetext: "Advertisement",
            displayHeading: "Advertisement",
            loadingAd: "Loading ad",
            podmessage: "Ad __AD_POD_CURRENT__ of __AD_POD_LENGTH__.",
            skipmessage: "Skip ad in xx",
            skiptext: "Skip",
          },
          airplay: "AirPlay",
          audioTracks: "Audio Tracks",
          auto: "Auto",
          buffer: "Loading",
          cast: "Chromecast",
          cc: "Closed Captions",
          close: "Close",
          errors: {
            badConnection:
              "This video cannot be played because of a problem with your internet connection.",
            cantLoadPlayer: "Sorry, the video player failed to load.",
            cantPlayInBrowser: "The video cannot be played in this browser.",
            cantPlayVideo: "This video file cannot be played.",
            errorCode: "Error Code",
            liveStreamDown: "The live stream is either down or has ended.",
            protectedContent: "There was a problem providing access to protected content.",
            technicalError: "This video cannot be played because of a technical error.",
          },
          exitFullscreen: "Exit Fullscreen",
          fullscreen: "Fullscreen",
          hd: "Quality",
          liveBroadcast: "Live",
          logo: "Logo",
          mute: "Mute",
          next: "Next",
          nextUp: "Next Up",
          notLive: "Not Live",
          off: "Off",
          pause: "Pause",
          pipIcon: "Picture in Picture (PiP)",
          play: "Play",
          playback: "Play",
          playbackRates: "Playback Rates",
          player: "Video Player",
          poweredBy: "Powered by",
          prev: "Previous",
          related: { autoplaymessage: "Next up in xx", heading: "More Videos" },
          replay: "Replay",
          rewind: "Rewind 10 Seconds",
          settings: "Settings",
          sharing: {
            copied: "Copied",
            email: "Email",
            embed: "Embed",
            heading: "Share",
            link: "Link",
          },
          slider: "Seek",
          stop: "Stop",
          unmute: "Unmute",
          videoInfo: "About This Video",
          volume: "Volume",
          volumeSlider: "Volume",
          shortcuts: {
            playPause: "Play/Pause",
            volumeToggle: "Mute/Unmute",
            fullscreenToggle: "Fullscreen/Exit Fullscreen",
            seekPercent: "Seek %",
            keyboardShortcuts: "Keyboard Shortcuts",
            increaseVolume: "Increase Volume",
            decreaseVolume: "Decrease Volume",
            seekForward: "Seek Forward",
            seekBackward: "Seek Backward",
            spacebar: "SPACE",
            captionsToggle: "Captions On/Off",
            shortcutsToggle: "Shortcuts Open/Close",
          },
          captionsStyles: {
            subtitleSettings: "Subtitle Settings",
            color: "Font Color",
            fontOpacity: "Font Opacity",
            userFontScale: "Font Size",
            fontFamily: "Font Family",
            edgeStyle: "Character Edge",
            edgeColor: "Edge Color",
            backgroundColor: "Background Color",
            backgroundOpacity: "Background Opacity",
            windowColor: "Window Color",
            windowOpacity: "Window Opacity",
            white: "White",
            black: "Black",
            red: "Red",
            green: "Green",
            blue: "Blue",
            yellow: "Yellow",
            magenta: "Magenta",
            cyan: "Cyan",
            none: "None",
            raised: "Raised",
            depressed: "Depressed",
            uniform: "Uniform",
            dropShadow: "Drop Shadow",
          },
          disabled: "Disabled",
          enabled: "Enabled",
          reset: "Reset",
        };
      },
      6726(e, t, n) {
        "use strict";
        function r(e, t, n) {
          var r = [],
            u = {},
            i = function () {
              for (; r.length > 0; ) {
                var t = r.shift(),
                  n = t.command,
                  i = t.args;
                (u[n] || e[n]).apply(e, i);
              }
            };
          (t.forEach(function (t) {
            var o = e[t];
            ((u[t] = o),
              (e[t] = function () {
                for (var e = arguments.length, u = Array(e), a = 0; a < e; a++) u[a] = arguments[a];
                n() ? r.push({ command: t, args: u }) : (i(), o && o.apply(this, u));
              }));
          }),
            Object.defineProperty(this, "queue", {
              enumerable: !0,
              get: function () {
                return r;
              },
            }),
            (this.flush = i),
            (this.empty = function () {
              r.length = 0;
            }),
            (this.off = function () {
              t.forEach(function (t) {
                var n = u[t];
                n && ((e[t] = n), delete u[t]);
              });
            }),
            (this.destroy = function () {
              (this.off(), this.empty());
            }));
        }
        n.d(t, { A: () => r });
      },
      9220(e, t, n) {
        "use strict";
        n.d(t, { A: () => r });
        let r = { debug: !1 };
      },
      680(e, t, n) {
        "use strict";
        n.d(t, { r: () => r, t: () => u });
        var r = function (e) {
            return (e.slice && "px" === e.slice(-2) && (e = e.slice(0, -2)), e);
          },
          u = function (e, t) {
            if (-1 === t.toString().indexOf("%") || "string" != typeof e || !e) return 0;
            if (/^\d*\.?\d+%$/.test(e)) return e;
            var n = e.indexOf(":");
            if (-1 === n) return 0;
            var r = parseFloat(e.substr(0, n)),
              u = parseFloat(e.substr(n + 1));
            return r <= 0 || u <= 0 ? 0 : "".concat((u / r) * 100, "%");
          };
      },
      7725(e, t, n) {
        "use strict";
        n.d(t, { nh: () => P, ax: () => C, Ay: () => O });
        var r = n(680),
          u = n(5483),
          i = n(4794),
          o = n(9555),
          a = n(9055),
          s = n(9765),
          c = n(4933),
          l = n(2235),
          f = n(3787),
          d = n(7069),
          h = n(5293),
          p = "__CONTEXTUAL__",
          D = function (e, t) {
            var n = e.querySelector(t);
            if (n) return n.getAttribute("content");
          },
          v = function (e, t) {
            var n,
              r,
              u =
                null == e || null == (r = e.querySelector) || null == (n = r.call(e, "title"))
                  ? void 0
                  : n.textContent,
              i = encodeURIComponent(D(e, 'meta[property="og:title"]') || u || ""),
              o = D(e, 'meta[property="og:description"]') || D(e, 'meta[name="description"]');
            return (
              o && (i += "&page_description=".concat(encodeURIComponent(o))),
              t.replace(p, i)
            );
          },
          g = n(9566),
          m = n.n(g),
          y = n(6068),
          A = n(9621),
          F = {
            autoPause: { viewability: !1, pauseAds: !1 },
            autostart: !1,
            allowFullscreen: !0,
            bandwidthEstimate: null,
            bitrateSelection: null,
            castAvailable: !1,
            controls: !0,
            cues: [],
            defaultPlaybackRate: 1,
            displaydescription: !0,
            displaytitle: !0,
            displayPlaybackLabel: !1,
            enableAdLoadingUI: !0,
            allowPlaybackWhileHiddenAdLoading: !1,
            enableShortcuts: !0,
            floating: { mode: "never" },
            height: 360,
            intl: {},
            item: 0,
            language: "en",
            liveTimeout: null,
            localization: s.A,
            mute: !1,
            nextUpDisplay: !0,
            playbackRateControls: !1,
            playbackRates: [0.5, 1, 1.25, 1.5, 2],
            renderCaptionsNatively: !1,
            disableInManifestCaptions: !1,
            repeat: !1,
            showUIWhen: "onReady",
            stretching: "uniform",
            volume: 90,
            width: 640,
          },
          C = function (e) {
            return e < 5 ? 5 : e;
          },
          E = function (e) {
            Object.keys(e).forEach(function (t) {
              "id" !== t && (e[t] = (0, i.serialize)(e[t]));
            });
          },
          b = function (e) {
            var t = parseFloat(e);
            return (0, o.gf)(t) ? Math.max(t, 1) : F.bandwidthEstimate;
          },
          w = function (e) {
            return (
              "string" == typeof e && /^\/\/(?:content\.jwplatform|cdn\.jwplayer)\.com\//.test(e)
            );
          },
          B = function (e) {
            return "https:".concat(e);
          },
          k = function (e) {
            var t = (0, h.A)(e.edition),
              n = e.related,
              r = !t("discovery") || n !== Object(n),
              u = !n || "none" !== n.displayMode,
              i = n || {},
              o = void 0 === i.oncomplete ? "none" : i.oncomplete,
              a = i.autoplaytimer;
            !1 === o || e.repeat ? (o = "hide") : "none" === o && (a = 0);
            var s = ("autoplay" === o && a <= 0) || "none" === o;
            return Object.assign({}, n, {
              disableRelated: r,
              showButton: u,
              oncomplete: o,
              autoplaytimer: a,
              shouldAutoAdvance: s,
            });
          },
          _ = function (e) {
            var t = e.ab;
            return (
              t.clone && (t = t.clone()),
              Object.keys(t.tests).forEach(function (n) {
                t.tests[n].forEach(function (t) {
                  t.addConfig && t.addConfig(e, t.selection);
                });
              }),
              t
            );
          },
          j = function (e, t, n) {
            t && ((e[t.client || (0, A.Gv)(n)] = t), delete t.client);
          },
          P = function (e) {
            var t = Object.assign({}, e.plugins),
              n = (0, h.A)(e.edition);
            if (n("ads")) {
              var r = Object.assign({}, e.advertising),
                u = r.client;
              (u && ((t[(0, A.Gv)(u) || u] = r), delete r.client),
                r.bids && j(t, r.bids, "bidding"));
            }
            if (n("jwpsrv")) {
              var i = e.analytics;
              (i !== Object(i) && (i = {}), j(t, i, "jwpsrv"));
            }
            return (
              j(t, e.ga, "gapro"),
              j(t, e.interactive, "interactive"),
              j(t, e.keepWatching, "keepWatching"),
              t
            );
          };
        let O = function (e, t) {
          var i,
            h,
            D,
            g,
            A,
            j,
            O,
            S,
            x = {};
          t &&
            Object.hasOwn(t, "mute") &&
            ("boolean" == typeof t.mute && (x.mute = t.mute), delete t.mute);
          var T = Object.assign(
            {},
            x,
            null == (O = window) || null == (j = O.jwplayer) ? void 0 : j.defaults,
            t,
            e,
          );
          E(T);
          var I = T.forceLocalizationDefaults ? F.language : (0, c.Z0)(),
            N = (0, c.lz)(T.intl);
          T.localization = (0, c.mR)(s.A, (0, c.Pj)(T, N, I));
          var L = Object.assign({}, F, T);
          ("." === L.base && (L.base = (0, u.getScriptPath)("jwplayer.js")),
            (L.base = (L.base || (0, u.loadFrom)()).replace(/\/?$/, "/")),
            (n.p = L.base),
            (L.width = (0, r.r)(L.width)),
            (L.height = (0, r.r)(L.height)),
            (L.aspectratio = (0, r.t)(L.aspectratio, L.width)),
            "string" == typeof L.volume && (L.volume = parseFloat(L.volume)),
            (L.volume = (0, o.gf)(L.volume) ? Math.min(Math.max(0, L.volume), 100) : F.volume),
            (L.mute = !!L.mute),
            (L.language = I),
            (L.intl = N));
          var M = L.playlistIndex;
          (M && (L.item = M), (0, o.Et)(L.item) || (L.item = 0));
          var R = T.autoPause;
          R && (L.autoPause.viewability = !("viewability" in R) || !!R.viewability);
          var V = L.playbackRateControls;
          if (V) {
            var U = L.playbackRates;
            (Array.isArray(V) && (U = V),
              0 >
                (U = U.filter(function (e) {
                  return (0, o.Et)(e) && e >= 0.25 && e <= 4;
                }).map(function (e) {
                  return Math.round(100 * e) / 100;
                })).indexOf(1) && U.push(1),
              U.sort(),
              (L.playbackRateControls = !0),
              (L.playbackRates = U));
          }
          ((!L.playbackRateControls || 0 > L.playbackRates.indexOf(L.defaultPlaybackRate)) &&
            (L.defaultPlaybackRate = 1),
            (L.playbackRate = L.defaultPlaybackRate),
            L.aspectratio || delete L.aspectratio);
          var z = L.playlist;
          if (z) Array.isArray(z.playlist) && ((L.feedData = z), (L.playlist = z.playlist));
          else {
            var H = (0, o.Up)(L, [
              "title",
              "description",
              "type",
              "mediaid",
              "image",
              "images",
              "file",
              "sources",
              "tracks",
              "preload",
              "duration",
              "chapters",
            ]);
            L.playlist = [H];
          }
          ((L.qualityLabels = L.qualityLabels || L.hlslabels), delete L.duration);
          var $ = L.liveTimeout;
          null !== $ &&
            ((0, o.gf)($) ? 0 !== $ && ($ = Math.max(30, $)) : ($ = null), (L.liveTimeout = $));
          var q = parseFloat(L.bandwidthEstimate),
            Q = parseFloat(L.bitrateSelection);
          ((L.bandwidthEstimate = (0, o.gf)(q) ? q : b(L.defaultBandwidthEstimate)),
            (L.bitrateSelection = (0, o.gf)(Q) ? Q : F.bitrateSelection),
            (L.liveSyncDuration = C(L.liveSyncDuration)),
            (L.backgroundLoading = (0, o.Lm)(L.backgroundLoading)
              ? L.backgroundLoading
              : a.Features.backgroundLoading),
            (L.enableAdLoadingUI =
              ((i = L),
              !a.Features.enableAdLoadingUI ||
                (Object.hasOwn(T, "enableAdLoadingUI") ? !!T.enableAdLoadingUI : !i.dynamicAds))),
            !1 === L.enableAdLoadingUI &&
              ((L.backgroundLoading = !0),
              (L.allowPlaybackWhileHiddenAdLoading =
                null == (S = T.allowPlaybackWhileHiddenAdLoading) || S)));
          var Y = L.key || f.default.key,
            W = new d.Ay(Y),
            G = W.edition();
          if (
            ("free" === W.edition() &&
              (L = Object.assign(
                {
                  skin: { active: "#ff0046", timeslider: { progress: "none" } },
                  logo: { position: "control-bar", file: m() },
                },
                F,
                (0, o.Up)(L, [
                  "analytics",
                  "aspectratio",
                  "base",
                  "file",
                  "height",
                  "playlist",
                  "sources",
                  "timeSlider",
                  "width",
                ]),
              )),
            (L.key = Y),
            (L.edition = G),
            (L.error = W.error()),
            (L.generateSEOMetadata = L.generateSEOMetadata || !1),
            null != (A = L).enableVideoThumbnails || (A.enableVideoThumbnails = !0),
            "unlimited" === G)
          ) {
            var K = (0, u.getScriptPath)("jwplayer.js");
            if (!K) throw Error("Error setting up player: Could not locate jwplayer.js script tag");
            n.p = K;
          }
          if (
            ((L.related = k(L)),
            L.ab && (L.ab = _(L)),
            (L.plugins = P(L)),
            (h = L.playlist),
            (0, o.Kg)(h) &&
              h.indexOf(p) > -1 &&
              ((L.playlist = v(document, L.playlist)), (L.contextual = !0)),
            (0, l.isFileProtocol)())
          ) {
            var X = L.playlist,
              J = L.related;
            (w(X) && (L.playlist = B(X)), J && w(J.file) && (J.file = B(J.file)));
          }
          return (
            L.__abSendDomainToFeeds &&
              ((D = L.playlist), /\.jwplatform.com|\.jwplayer.com/.test(D)) &&
              (L.playlist =
                ((g = L.playlist),
                (g += ""
                  .concat(-1 !== g.indexOf("?") ? "&" : "?", "page_domain=")
                  .concat(encodeURIComponent((0, y.E)()))))),
            L
          );
        };
      },
      9083(e, t, n) {
        "use strict";
        n.d(t, { $5: () => o, Cb: () => s, Cp: () => c, Q5: () => a, cw: () => i });
        var r = n(8253),
          u = n(2194).A.logger.child("chunkLoader"),
          i = {},
          o = function () {
            return null;
          },
          a = function (e, t) {
            return function (n) {
              throw (u.error(n), new r.Mk(r.kM, e, t));
            };
          },
          s = function (e, t) {
            return function (n) {
              throw (u.warn(n), new r.Mk(null, e, t));
            };
          },
          c = function () {
            return n
              .e("905")
              .then(n.bind(n, 9641))
              .then(function (e) {
                return e.default;
              })
              .catch(a(r.YD + 101));
          };
      },
      4871(e, t, n) {
        "use strict";
        n.d(t, { Ay: () => ej, nZ: () => eB });
        var r = n(3750),
          u = n(6726),
          i = n(7725),
          o = n(9083),
          a = n(3827),
          s = n(1993),
          c = n(5471),
          l = n(9063),
          f = n(8888),
          d = n(1804),
          h = n(8253),
          p = n(9055),
          D = null,
          v = function () {
            var e = window.IntersectionObserverEntry;
            return (
              !e || !("IntersectionObserver" in window) || !("intersectionRatio" in e.prototype)
            );
          },
          g = function (e, t) {
            var n = e.get("playlist");
            if (Array.isArray(n) && n.length)
              for (
                var r = (0, c.dW)(e.get("item"), n.length), u = (0, c.IA)((0, s.A)(n[r]), e), i = 0;
                i < u.length;
                i++
              )
                for (var o = u[i], a = e.getProviders(), f = 0; f < l.M.length; f++) {
                  var d = l.M[f];
                  if (a.providerSupports(d, o)) return d.name === t;
                }
            return !1;
          },
          m = function () {
            var e = Promise.all([
              n.e("305").then(n.t.bind(n, 5127, 23)),
              n.e("305").then(n.bind(n, 9641)),
              n.e("305").then(n.bind(n, 7464)),
              n.e("305").then(n.bind(n, 1053)),
            ])
              .then(function (e) {
                var t = (0, a._)(e, 4),
                  n = (t[0], t[1]),
                  r = t[2],
                  u = t[3],
                  i = n.default;
                return ((d.Q.controls = r.default), (0, f.A)(u.default), i);
              })
              .catch((0, o.Q5)(h.YD + 105));
            return ((o.cw.html5 = e), e);
          },
          y = function () {
            var e = Promise.all([
              n.e("59").then(n.bind(n, 9641)),
              n.e("59").then(n.bind(n, 7464)),
              n.e("59").then(n.bind(n, 1053)),
            ])
              .then(function (e) {
                var t = (0, a._)(e, 3),
                  n = t[0],
                  r = t[1],
                  u = t[2],
                  i = n.default;
                return ((d.Q.controls = r.default), (0, f.A)(u.default), i);
              })
              .catch((0, o.Q5)(h.YD + 104));
            return ((o.cw.html5 = e), e);
          },
          A = function () {
            return (
              v()
                ? n
                    .e("666")
                    .then(n.t.bind(n, 5127, 23))
                    .catch((0, o.Q5)(h.YD + 120))
                : Promise.resolve()
            ).then(o.Cp);
          },
          F = function (e) {
            var t = e.get("controls"),
              r = v(),
              u = g(e, "html5");
            return p.OS.tizen
              ? A()
              : t && r && u
                ? m()
                : t && u
                  ? y()
                  : t && r
                    ? Promise.all([
                        n.e("663").then(n.t.bind(n, 5127, 23)),
                        n.e("663").then(n.bind(n, 9641)),
                        n.e("663").then(n.bind(n, 7464)),
                      ])
                        .then(function (e) {
                          var t = (0, a._)(e, 3),
                            n = (t[0], t[1]),
                            r = t[2],
                            u = n.default;
                          return ((d.Q.controls = r.default), u);
                        })
                        .catch((0, o.Q5)(h.YD + 103))
                    : t
                      ? Promise.all([
                          n.e("517").then(n.bind(n, 9641)),
                          n.e("517").then(n.bind(n, 7464)),
                        ])
                          .then(function (e) {
                            var t = (0, a._)(e, 2),
                              n = t[0],
                              r = t[1],
                              u = n.default;
                            return ((d.Q.controls = r.default), u);
                          })
                          .catch((0, o.Q5)(h.YD + 102))
                      : A();
          },
          C = function (e) {
            var t = (0, o.$5)();
            return t || (D || (D = F(e)), D);
          },
          E = n(1374),
          b = n(1893),
          w = n(1635),
          B = n(1860),
          k = n(1027),
          _ = n(1535),
          j = n(7230),
          P = n(4933),
          O = n(3277),
          S = n(1417),
          x = n(6966),
          T = n(7069),
          I = n(5445),
          N = n(9621),
          L = n(1642),
          M = ["people.com"],
          R = function () {
            var e =
              arguments.length > 0 && void 0 !== arguments[0]
                ? arguments[0]
                : window.location.hostname;
            return M.some(function (t) {
              return e === t || e.endsWith(".".concat(t));
            });
          },
          V = function (e) {
            var t,
              n = null == e || null == (t = e.attributes) ? void 0 : t.playlist;
            return Array.isArray(n)
              ? n.length > 0
                ? n[0]
                : null
              : n && (void 0 === n ? "undefined" : (0, L._)(n)) === "object"
                ? n
                : null;
          },
          U = function (e) {
            var t,
              n =
                arguments.length > 1 && void 0 !== arguments[1]
                  ? arguments[1]
                  : window.location.href;
            (null == e || null == (t = e.jwpseg) ? void 0 : t.length) &&
              Array.isArray(null == e ? void 0 : e.jwpseg) &&
              fetch("https://capi.connatix.com/tr/emi", {
                method: "POST",
                credentials: "include",
                body: JSON.stringify({
                  MediaId: e.mediaid || null,
                  MediaURL: e.file || null,
                  PageUrl: n,
                  MediaInsights: e.jwpseg,
                  UserAgent: window.navigator.userAgent || null,
                }),
              }).catch(function () {});
          },
          z = function (e, t) {
            var n,
              r,
              u,
              i = null == e || null == (n = e.attributes) ? void 0 : n.jwpsegReporter;
            if (!1 !== i && (!0 === i || R())) {
              var o = V(e);
              if (null == o || null == (r = o.jwpseg) ? void 0 : r.length) {
                var a = o ? (0, c.Xh)(e, o, {}) : null;
                (U(a), (u = a.file));
              }
              var s = function (e) {
                if (u) {
                  var t,
                    n = u;
                  if (((u = void 0), (null == e || null == (t = e.item) ? void 0 : t.file) === n))
                    return;
                }
                U(null == e ? void 0 : e.item);
              };
              (t.on("playlistItem", s),
                t.on("remove", function () {
                  t.off("playlistItem", s);
                }));
            }
          },
          H = function (e, t, n) {
            var r = e.attributes;
            ((r.playlist = (0, c.Ay)(t)), (r.feedData = n));
          },
          $ = function (e, t) {
            var n,
              r,
              u,
              i =
                null == (u = t.utils) || null == (r = u.logger) || null == (n = r.child)
                  ? void 0
                  : n.call(r, "loadIdentity");
            (0, j.uT)(t.utils, e.get("key"))
              .then(function (e) {
                if (
                  "u" > typeof window &&
                  window.document &&
                  window.document.querySelector('script[src*="connatix.com/identity.js"]')
                )
                  return void i.debug("Identity script already on page");
                if (e && "u" > typeof window && window.document) {
                  var t = window.document.createElement("script");
                  ((t.src = "//cd.connatix.com/identity.js"),
                    t.setAttribute("async", "1"),
                    t.setAttribute("type", "text/javascript"),
                    window.document.head.appendChild(t));
                }
              })
              .catch(function (e) {
                var t;
                null == i || null == (t = i.debug) || t.call(i, e);
              });
          },
          q = function (e, t) {
            var n = e.get("key"),
              r = e.get("advertising");
            return r && r.adscheduleid
              ? (0, j.fY)(t.utils, n).then(function () {
                  var t = (0, b._)(
                    { client: "jwx", adscheduleid: r.adscheduleid },
                    (null == r ? void 0 : r.adServer) ? { adServer: r.adServer } : {},
                  );
                  ((t.overrideAdConfigActive = !0), e.set("advertising", t));
                  var n = Object.keys(e.attributes.plugins || {}),
                    u = !0,
                    o = !1,
                    a = void 0;
                  try {
                    for (var s, c = n[Symbol.iterator](); !(u = (s = c.next()).done); u = !0) {
                      var l = s.value,
                        f = (0, N.dB)(l);
                      ("googima" === f ||
                        "vast" === f ||
                        "freewheel" === f ||
                        "cnx" === f ||
                        "jwx" === f) &&
                        delete e.attributes.plugins[l];
                    }
                  } catch (e) {
                    ((o = !0), (a = e));
                  } finally {
                    try {
                      u || null == c.return || c.return();
                    } finally {
                      if (o) throw a;
                    }
                  }
                  e.set("plugins", (0, i.nh)(e.attributes));
                })
              : Promise.resolve();
          },
          Q = function (e) {
            var t = e.get("playlist");
            return new Promise(function (n, r) {
              if ("string" != typeof t) {
                var u = e.get("feedData") || {};
                return (H(e, t, u), n());
              }
              var i = new k.A();
              (i.on(B.VU, function (t) {
                var r = t.playlist;
                (delete t.playlist, H(e, r, t), n());
              }),
                i.on(B.ff, function (t) {
                  (H(e, [], {}), r((0, h.ED)(t, h.pV)));
                }),
                i.load(t));
            });
          },
          Y = function (e) {
            return e.attributes._destroyed;
          },
          W = function (e) {
            for (var t = document.styleSheets, n = 0, r = t.length; n < r; n++)
              if (t[n].href === e) return !0;
            return !1;
          },
          G = function (e) {
            var t = e.get("skin") ? e.get("skin").url : void 0;
            return "string" != typeof t || W(t)
              ? Promise.resolve()
              : new _.Ay(t, !0).load().catch(function (e) {
                  return e;
                });
          },
          K = function (e) {
            var t = e.attributes,
              n = t.language,
              r = t.base,
              u = t.setupConfig,
              i = t.intl,
              o = (0, P.Pj)(u, i, n);
            return !(0, P.J3)(n) || (0, P.pP)(o)
              ? Promise.resolve()
              : new Promise(function (u) {
                  return (0, P.EA)(r, n)
                    .then(function (n) {
                      var r = n.response;
                      if (!Y(e)) {
                        if (!r) throw new h.Mk(null, h.tq);
                        ((t.localization = (0, P.mR)(r, o)), u());
                      }
                    })
                    .catch(function (e) {
                      u(e.code === h.tq ? e : (0, h.ED)(e, h.f_));
                    });
                });
          },
          X = function (e) {
            var t = e.get("advertising");
            return !!(null == t ? void 0 : t.outstream);
          },
          J = function (e) {
            var t = e.attributes,
              n = t.error;
            if (n && n.code === T.FE) {
              var r = t.pid,
                u = t.ph,
                i = new T.Ay(t.key);
              if (u > 0 && u < 4 && r && i.duration() > -7776e6)
                return new _.Ay("//content.jwplatform.com/libraries/".concat(r, ".js"))
                  .load()
                  .then(function () {
                    var e = window.jwplayer.defaults.key,
                      n = new T.Ay(e);
                    n.error() ||
                      n.token() !== i.token() ||
                      ((t.key = e), (t.edition = n.edition()), (t.error = n.error()));
                  })
                  .catch(function () {});
            }
            return Promise.resolve();
          },
          Z = function (e, t) {
            var n = [J(e)];
            return (X(e) || n.push(Promise.resolve()), Promise.all(n));
          },
          ee = function (e, t) {
            return n
              .e("738")
              .then(n.bind(n, 3923))
              .then(function (n) {
                return new n.default(t).setup(e);
              })
              .catch((0, o.Q5)(h.YD + 130))
              .then(function () {
                return G(e);
              });
          },
          et = function (e, t) {
            var n = function () {
              return (0, O.Ay)(e, t);
            };
            return (0, I.A)() ? ee(e, t).then(n).catch(n) : n();
          },
          en = n(7268),
          er = function (e) {
            if (!e || !e.length) return { core: null, warnings: [] };
            var t = e
              .reduce(function (e, t) {
                return e.concat(t);
              }, [])
              .filter(function (e) {
                return null == e ? void 0 : e.code;
              });
            return { core: e[0], warnings: t };
          };
        let eu = function (e) {
          var t;
          ((this.start = function (n) {
            var r,
              u,
              i = ((r = e),
              (0, E._)(function () {
                return (0, w.YH)(this, function (e) {
                  switch (e.label) {
                    case 0:
                      return [
                        4,
                        (0, E._)(function () {
                          return (0, w.YH)(this, function (e) {
                            switch (e.label) {
                              case 0:
                                try {
                                  $(r, n);
                                } catch (e) {}
                                e.label = 1;
                              case 1:
                                return (e.trys.push([1, 3, , 4]), [4, q(r, n)]);
                              case 2:
                              case 3:
                                return (e.sent(), [3, 4]);
                              case 4:
                                return [2];
                            }
                          });
                        })(),
                      ];
                    case 1:
                      return (e.sent(), z(r, n), [2]);
                  }
                });
              })()).then(function () {
                u = et(e, n);
                var t,
                  r,
                  i = (0, en.r)(e, n);
                return Promise.all([
                  C(e),
                  ((t = e),
                  new Promise(function (e) {
                    if (t.attributes.liveSyncDuration > 45) return e((0, h.ED)(Error(), h.d6));
                    var n =
                      Array.isArray(t.attributes.playlist) &&
                      t.attributes.playlist.map(function (e) {
                        return e.chapters;
                      });
                    return (null == n ? void 0 : n.length) ? (0, S.Zh)(n, e) : e();
                  })),
                  u,
                  i,
                  X((r = e))
                    ? Promise.resolve()
                    : Q(r)
                        .then(function () {
                          if (r.get("drm") || (0, x.Hj)(r.get("playlist")))
                            return (0, x.dy)(r.get("edition"));
                        })
                        .then(function () {
                          if (!Y(r)) {
                            var e = (0, c.Ru)(r.get("playlist"), r);
                            r.attributes.playlist = e;
                            try {
                              (0, c.F8)(e);
                            } catch (e) {
                              throw ((e.code += h.pV), e);
                            }
                            var t = r.getProviders(),
                              n = (0, c.dW)(r.get("item"), e.length),
                              u = t.choose(e[n].sources[0]),
                              i = u.provider,
                              a = u.name;
                            return "function" == typeof i
                              ? i
                              : o.cw.html5 && "html5" === a
                                ? o.cw.html5
                                : t.load(a).catch(function (e) {
                                    throw (0, h.ED)(e, h.WI);
                                  });
                          }
                        }),
                  Z(e, n),
                  G(e),
                  K(e),
                ]);
              }),
              a = new Promise(function (e, n) {
                t = setTimeout(function () {
                  n(new h.Mk(h.kM, h.$m));
                }, 6e4);
                var r = function () {
                  (clearTimeout(t), setTimeout(e, 6e4));
                };
                i.then(r).catch(r);
              });
            return Promise.race([i, a])
              .catch(function (e) {
                var t = function () {
                  throw e;
                };
                return u ? u.then(t).catch(t) : t("Setup Error");
              })
              .then(function (e) {
                return er(e);
              });
          }),
            (this.destroy = function () {
              (clearTimeout(t), e.set("_destroyed", !0), (e = null));
            }));
        };
        var ei = n(9813),
          eo = n(7203),
          ea = n(494),
          es = n(9407),
          ec = n(467),
          el = n(4794),
          ef = n(9220),
          ed = n(2194),
          eh = ed.A.logger.child("jwplayer/model/storage"),
          ep = { removeItem: function (e) {} };
        try {
          ep = window.localStorage || ep;
        } catch (e) {
          eh.debug(e);
        }
        var eD = (function () {
            function e(t, n) {
              ((0, ea._)(this, e),
                (0, ec._)(this, "namespace", void 0),
                (0, ec._)(this, "items", void 0),
                (this.namespace = t),
                (this.items = n));
            }
            return (
              (0, es._)(e, [
                {
                  key: "getAllItems",
                  value: function () {
                    var e = this;
                    return this.items.reduce(function (t, n) {
                      var r = ep["".concat(e.namespace, ".").concat(n)];
                      return (
                        r && (t[n] = "captions" !== n ? (0, el.serialize)(r) : JSON.parse(r)),
                        t
                      );
                    }, {});
                  },
                },
                {
                  key: "track",
                  value: function (e) {
                    var t = this;
                    this.items.forEach(function (n) {
                      e.on("change:".concat(n), function (e, r) {
                        try {
                          ("captions" === n && (r = JSON.stringify(r)),
                            (ep["".concat(t.namespace, ".").concat(n)] = r));
                        } catch (e) {
                          ef.A.debug && eh.error(e);
                        }
                      });
                    });
                  },
                },
                {
                  key: "clear",
                  value: function () {
                    var e = this;
                    this.items.forEach(function (t) {
                      ep.removeItem("".concat(e.namespace, ".").concat(t));
                    });
                  },
                },
              ]),
              e
            );
          })(),
          ev = n(8186),
          eg = n(7264),
          em = n(5001),
          ey = n(8999),
          eA = n(8092),
          eF = n(6721),
          eC = n(2885);
        (n(8089), n(6622));
        var eE = ed.A.logger.child("jwplayer/api/core-shim"),
          eb = function (e, t) {
            t &&
              t.code &&
              (t.sourceError && eE.error(t.sourceError), eE.error(h.Mk.logMessage(t.code)));
          },
          ew = function (e) {
            e && e.code && eE.warn(h.Mk.logMessage(e.code));
          },
          eB = function (e, t) {
            if (!document.body.contains(e.currentContainer)) {
              var n = document.getElementById(e.get("id"));
              n && (e.currentContainer = n);
            }
            (e.currentContainer.parentElement &&
              e.currentContainer.parentElement.replaceChild(t, e.currentContainer),
              (e.currentContainer = t));
          },
          ek = function (e, t, n) {
            Promise.resolve().then(function () {
              var r = (0, h.Oj)(h.Tm, h.oo, n),
                u = e._model || e.modelShim;
              ((r.message = r.message || u.get("localization").errors[r.key]), delete r.key);
              var i = u.get("contextual");
              if (!i) {
                var o = (0, ey.A)(e, r);
                (ey.A.cloneIcon && o.querySelector(".jw-icon").appendChild(ey.A.cloneIcon("error")),
                  eB(e, o));
              }
              (u.set("errorEvent", r), u.set("state", B.pF), e.trigger(B.Tc, r), i && t.remove());
            });
          },
          e_ = function (e) {
            ((this._events = {}),
              (this.modelShim = new ev.A()),
              (this.modelShim._qoeItem = new eo.A()),
              (this.mediaShim = {}),
              (this.setup = new eu(this.modelShim)),
              (this.currentContainer = this.originalContainer = e),
              (this.apiQueue = new u.A(
                this,
                [
                  "load",
                  "play",
                  "pause",
                  "seek",
                  "stop",
                  "playlistItem",
                  "playlistNext",
                  "playlistPrev",
                  "next",
                  "preload",
                  "setAllowFullscreen",
                  "setConfig",
                  "setCurrentAudioTrack",
                  "setCurrentCaptions",
                  "setCurrentQuality",
                  "setFullscreen",
                  "setPip",
                  "requestPip",
                  "addButton",
                  "removeButton",
                  "castToggle",
                  "requestCast",
                  "setMute",
                  "setVolume",
                  "setPlaybackRate",
                  "addCues",
                  "setCues",
                  "getCues",
                  "setPlaylistItem",
                  "stopCasting",
                  "getChapters",
                  "getCurrentChapter",
                  "setChapter",
                  "resize",
                  "setCaptions",
                  "setControls",
                ],
                function () {
                  return !0;
                },
              )));
          };
        Object.assign(e_.prototype, {
          on: em.Ay.on,
          once: em.Ay.once,
          off: em.Ay.off,
          trigger: em.Ay.trigger,
          init: function (e, t) {
            var n = this,
              u = this.modelShim,
              o = new eD("jwplayer", [
                "volume",
                "mute",
                "captionLabel",
                "captions",
                "bandwidthEstimate",
                "bitrateSelection",
                "qualityLabel",
                "enableShortcuts",
              ]),
              a = null == o ? void 0 : o.getAllItems();
            ((u.attributes = u.attributes || {}), Object.assign(this.mediaShim, eg.E_));
            var s = (0, i.Ay)(Object.assign({}, e), a);
            ((s.id = t.id),
              (s.setupConfig = e),
              Object.assign(u.attributes, s, eg.p5),
              (u.getProviders = function () {
                return new ei.A(s);
              }),
              (u.setProvider = function () {}));
            var c = (0, eA.A)();
            if (!u.get("backgroundLoading")) {
              var l = s.mediaElement,
                f = (0, r._)(l, HTMLVideoElement) ? l : c.getPrimedElement();
              c = (0, eF.A)(f, c);
            }
            var d = (this.primeUi = new eC.Ay((0, eC.vj)(this.originalContainer)).once(
              "gesture",
              function () {
                (c.prime(), n.preload(), d.destroy());
              },
            ));
            return (
              u.on("change:errorEvent", eb),
              this.setup
                .start(t)
                .then(function (e) {
                  var r = e.core;
                  if (!r) throw (0, h.ED)(null, h.Nm);
                  if (n.setup) {
                    (n.on(B.Nz, ew),
                      e.warnings.forEach(function (e) {
                        n.trigger(B.Nz, e);
                      }));
                    var i = n.modelShim.clone();
                    if (i.error) throw i.error;
                    var a = n.apiQueue.queue.slice(0);
                    (n.apiQueue.destroy(),
                      Object.assign(n, r.prototype),
                      n.playerSetup(i, t, n.originalContainer, n._events, a, c));
                    var s = n._model;
                    return (
                      u.off("change:errorEvent", eb),
                      s.on("change:errorEvent", eb),
                      o.track(s),
                      n.updatePlaylist(s.get("playlist"), s.get("feedData")).catch(function (e) {
                        var t = e.code === h.Jf ? h.mj : h.pV;
                        throw (0, h.ED)(e, t);
                      })
                    );
                  }
                })
                .then(function () {
                  n.setup && n.playerReady();
                })
                .catch(function (e) {
                  n.setup && ek(n, t, e);
                })
            );
          },
          playerDestroy: function () {
            (this.destroy && this.destroy(),
              this.apiQueue && this.apiQueue.destroy(),
              this.setup && this.setup.destroy(),
              this.primeUi && this.primeUi.destroy(),
              this.currentContainer !== this.originalContainer && eB(this, this.originalContainer),
              this.off(),
              (this._events =
                this._model =
                this.modelShim =
                this.apiQueue =
                this.primeUi =
                this.setup =
                  null));
          },
          getContainer: function () {
            return this.currentContainer;
          },
          get: function (e) {
            if (this.modelShim)
              return e in this.mediaShim ? this.mediaShim[e] : this.modelShim.get(e);
          },
          getItemQoe: function () {
            return this.modelShim._qoeItem;
          },
          getItemPromise: function () {
            return null;
          },
          setItemCallback: function (e) {
            this.modelShim && (this.modelShim.attributes.playlistItemCallback = e);
          },
          getConfig: function () {
            return Object.assign({}, this.modelShim.attributes, this.mediaShim);
          },
          getCurrentCaptions: function () {
            return this.get("captionsIndex");
          },
          getWidth: function () {
            return this.get("containerWidth");
          },
          getHeight: function () {
            return this.get("containerHeight");
          },
          getMute: function () {
            return this.get("mute");
          },
          getProvider: function () {
            return this.get("provider");
          },
          getState: function () {
            return this.get("state");
          },
          getAbsolutePosition: function () {
            return null;
          },
          getAudioTracks: function () {
            return null;
          },
          getCaptionsList: function () {
            return null;
          },
          getQualityLevels: function () {
            return null;
          },
          getVisualQuality: function () {
            return null;
          },
          getCurrentQuality: function () {
            return -1;
          },
          getCurrentAudioTrack: function () {
            return -1;
          },
          getSafeRegion: function () {
            return { x: 0, y: 0, width: 0, height: 0 };
          },
          isBeforeComplete: function () {
            return !1;
          },
          isBeforePlay: function () {
            return !1;
          },
          createInstream: function () {
            return null;
          },
          skipAd: function () {},
          getMediaElement: function () {},
          attachMedia: function () {},
          detachMedia: function () {},
          isReady: function () {
            var e;
            return (null == (e = this._model) ? void 0 : e.get("isReady")) || !1;
          },
        });
        let ej = e_;
      },
      8253(e, t, n) {
        "use strict";
        n.d(t, {
          $m: () => c,
          ED: () => I,
          Jf: () => y,
          Mk: () => x,
          Nm: () => l,
          O1: () => A,
          Oj: () => T,
          Tm: () => S,
          UP: () => B,
          Us: () => N,
          WI: () => v,
          YD: () => f,
          Zl: () => P,
          _I: () => E,
          bp: () => j,
          c5: () => p,
          d6: () => F,
          do: () => g,
          f_: () => b,
          hu: () => D,
          kM: () => _,
          lc: () => O,
          mH: () => C,
          mj: () => h,
          oo: () => s,
          pV: () => d,
          pX: () => k,
          rm: () => m,
          tq: () => w,
        });
        var r = n(494),
          u = n(9407),
          i = n(467),
          o = n(3750),
          a = n(9555),
          s = 1e5,
          c = 100001,
          l = 100002,
          f = 101e3,
          d = 102e3,
          h = 102700,
          p = 200001,
          D = 202e3,
          v = 104e3,
          g = 203e3,
          m = 203640,
          y = 203700,
          A = 204e3,
          F = 300100,
          C = 300200,
          E = 306e3,
          b = 308e3,
          w = 308640,
          B = "cantPlayVideo",
          k = "badConnection",
          _ = "cantLoadPlayer",
          j = "cantPlayInBrowser",
          P = "liveStreamDown",
          O = "protectedContent",
          S = "technicalError",
          x = (function () {
            function e(t, n, u) {
              ((0, r._)(this, e),
                (0, i._)(this, "message", void 0),
                (0, i._)(this, "key", void 0),
                (0, i._)(this, "code", void 0),
                (0, i._)(this, "sourceError", void 0),
                (this.code = (0, a.gf)(n) ? n : 0),
                (this.sourceError = u || null),
                t ? (this.key = t) : delete this.key);
            }
            return (
              (0, u._)(e, null, [
                {
                  key: "logMessage",
                  value: function (e) {
                    var t = e % 1e3,
                      n = Math.floor((e - t) / 1e3),
                      r = e.toString();
                    t >= 400 && t < 600 && (r = "".concat(n, "400-").concat(n, "599"));
                    var u = e > 299999 && e < 4e5;
                    return "JW Player "
                      .concat(u ? "Warning" : "Error", " ")
                      .concat(
                        e,
                        ". For more information see https://developer.jwplayer.com/jw-player/docs/developer-guide/api/errors-reference#",
                      )
                      .concat(r);
                  },
                },
              ]),
              e
            );
          })(),
          T = function (e, t, n) {
            return (0, o._)(n, x) && n.code ? n : new x(e, t, n);
          },
          I = function (e, t) {
            var n = T(S, t, e);
            return ((n.code = ((e && (0, o._)(e, x) && e.code) || 0) + t), n);
          },
          N = function (e) {
            var t = e.name,
              n = e.message;
            switch (t) {
              case "AbortError":
                if (/pause/.test(n)) return 303213;
                if (/load/.test(n)) return 303212;
                return 303210;
              case "NotAllowedError":
                return 303220;
              case "NotSupportedError":
                return 303230;
              default:
                return 303200;
            }
          };
      },
      9608(e, t, n) {
        "use strict";
        n.d(t, { A: () => r });
        let r = [];
      },
      7203(e, t, n) {
        "use strict";
        n.d(t, { A: () => l });
        var r = n(494),
          u = n(9407),
          i = n(467),
          o = n(3297),
          a = window.performance || { timing: {} },
          s = a.timing.navigationStart || (0, o.t)();
        "now" in a ||
          (a.now = function () {
            return (0, o.t)() - s;
          });
        var c = function () {
          return s + a.now();
        };
        let l = (function () {
          function e() {
            ((0, r._)(this, e),
              (0, i._)(this, "startTimes", void 0),
              (0, i._)(this, "sum", void 0),
              (0, i._)(this, "counts", void 0),
              (0, i._)(this, "ticks", void 0),
              (this.startTimes = {}),
              (this.sum = {}),
              (this.counts = {}),
              (this.ticks = {}));
          }
          return (
            (0, u._)(e, [
              {
                key: "start",
                value: function (e) {
                  ((this.startTimes[e] = c()), (this.counts[e] = this.counts[e] + 1 || 1));
                },
              },
              {
                key: "end",
                value: function (e) {
                  if (this.startTimes[e]) {
                    var t = c() - this.startTimes[e];
                    (delete this.startTimes[e], (this.sum[e] = this.sum[e] + t || t));
                  }
                },
              },
              {
                key: "dump",
                value: function () {
                  var e = Object.assign({}, this.sum);
                  for (var t in this.startTimes)
                    if (Object.hasOwn(this.startTimes, t)) {
                      var n = c() - this.startTimes[t];
                      e[t] = e[t] + n || n;
                    }
                  return {
                    counts: Object.assign({}, this.counts),
                    sums: e,
                    events: Object.assign({}, this.ticks),
                  };
                },
              },
              {
                key: "tick",
                value: function (e) {
                  this.ticks[e] = c();
                },
              },
              {
                key: "clear",
                value: function (e) {
                  delete this.ticks[e];
                },
              },
              {
                key: "between",
                value: function (e, t) {
                  return this.ticks[t] && this.ticks[e] ? this.ticks[t] - this.ticks[e] : null;
                },
              },
            ]),
            e
          );
        })();
      },
      1804(e, t, n) {
        "use strict";
        n.d(t, { Q: () => o, v: () => a });
        var r = n(9083),
          u = n(9055),
          i = null,
          o = {},
          a = function () {
            return (
              i ||
                (i = u.OS.tizenApp
                  ? n
                      .e("114")
                      .then(n.bind(n, 4965))
                      .then(function (e) {
                        var t = e.default;
                        return ((o.controls = t), t);
                      })
                      .catch(function () {
                        ((i = null), (0, r.Cb)(301133)());
                      })
                  : n
                      .e("300")
                      .then(n.bind(n, 7464))
                      .then(function (e) {
                        var t = e.default;
                        return ((o.controls = t), t);
                      })
                      .catch(function () {
                        ((i = null), (0, r.Cb)(301130)());
                      })),
              i
            );
          };
      },
      9055(e, t, n) {
        "use strict";
        (n.r(t), n.d(t, { Features: () => h, Browser: () => f, OS: () => d }));
        var r = n(2669),
          u = function (e, t) {
            if (e.chrome)
              n =
                -1 !== t.indexOf("Chrome")
                  ? t.substring(t.indexOf("Chrome") + 7)
                  : t.substring(t.indexOf("CriOS") + 6);
            else if (e.safari) n = t.substring(t.indexOf("Version") + 8);
            else if (e.firefox) n = t.substring(t.indexOf("Firefox") + 8);
            else if (e.edge) {
              var n,
                r,
                u,
                i,
                o = t.indexOf("Edge");
              (-1 === o ? (o = t.indexOf("Edg") + 4) : (o += 5), (n = t.substring(o)));
            } else
              e.ie &&
                (-1 !== t.indexOf("rv:")
                  ? (n = t.substring(t.indexOf("rv:") + 3))
                  : -1 !== t.indexOf("MSIE") && (n = t.substring(t.indexOf("MSIE") + 5)));
            return (
              n &&
                (-1 !== (i = n.indexOf(";")) && (n = n.substring(0, i)),
                -1 !== (i = n.indexOf(" ")) && (n = n.substring(0, i)),
                -1 !== (i = n.indexOf(")")) && (n = n.substring(0, i)),
                (r = parseInt(n, 10)),
                (u = parseInt(n.split(".")[1], 10))),
              { version: n, major: r, minor: u }
            );
          },
          i = function (e, t) {
            var n = e.exec(t);
            if (n && n.length > 1) return n[1];
          },
          o = function (e, t) {
            if (e.windows)
              switch ((n = i(/Windows(?: NT|)? ([._\d]+)/, t))) {
                case "6.1":
                  n = "7.0";
                  break;
                case "6.2":
                  n = "8.0";
                  break;
                case "6.3":
                  n = "8.1";
              }
            else
              e.android
                ? (n = i(/Android ([._\d]+)/, t))
                : e.iOS
                  ? (n = i(/OS ([._\d]+)/, t))
                  : e.mac
                    ? (n = i(/Mac OS X ([._\d]+)/, t))
                    : e.tizen && (n = i(/Tizen ([._\d]+)/, t));
            if (n) {
              var n,
                r,
                u = parseInt(n, 10),
                o = n.split(/[._]/);
              o && (r = parseInt(o[1], 10));
            }
            return { version: n, major: u, minor: r };
          },
          a = n(2194),
          s = navigator.userAgent,
          c = function () {},
          l = function () {
            var e = !1;
            try {
              var t = Object.defineProperty({}, "passive", {
                get: function () {
                  return (e = !0);
                },
              });
              (window.addEventListener("testPassive", c, t),
                window.removeEventListener("testPassive", c, t));
            } catch (e) {
              a.A.logger.child("jwplayer/environment/environment").debug(e);
            }
            return e;
          },
          f = {
            get androidNative() {
              return (0, r.P6)();
            },
            get chrome() {
              return (0, r.H8)();
            },
            get edge() {
              return (0, r.UP)();
            },
            get facebook() {
              return (0, r.rB)();
            },
            get firefox() {
              return (0, r.VS)();
            },
            get ie() {
              return (0, r.lT)();
            },
            get msie() {
              return (0, r.L4)();
            },
            get safari() {
              return (0, r.nr)();
            },
            get version() {
              return u(this, s);
            },
          },
          d = {
            get android() {
              return (0, r.m0)();
            },
            get iOS() {
              return (0, r.un)();
            },
            get mobile() {
              return (0, r.Fr)();
            },
            get mac() {
              return (0, r.T3)();
            },
            get iPad() {
              return (0, r.bh)();
            },
            get iPhone() {
              return (0, r.N1)();
            },
            get windows() {
              return s.indexOf("Windows") > -1;
            },
            get tizen() {
              return (0, r.ZN)();
            },
            get tizenApp() {
              return (0, r.u$)();
            },
            get version() {
              return o(this, s);
            },
          },
          h = {
            get flash() {
              return (0, r.jv)();
            },
            get flashVersion() {
              return (0, r.$w)();
            },
            get iframe() {
              return (0, r.d4)();
            },
            get passiveEvents() {
              return l();
            },
            get backgroundLoading() {
              return !(d.iOS || d.tizen);
            },
            get headless() {
              return !1;
            },
            get enableAdLoadingUI() {
              return !d.tizen;
            },
          };
      },
      1860(e, t, n) {
        "use strict";
        n.d(t, {
          Ap: () => G,
          BI: () => H,
          Bs: () => b,
          D3: () => S,
          Dy: () => _,
          F0: () => eF,
          F3: () => el,
          FF: () => w,
          Fm: () => m,
          Gd: () => K,
          LD: () => ei,
          LK: () => D,
          Lm: () => C,
          M: () => eE,
          Nq: () => M,
          Nz: () => F,
          O8: () => U,
          OY: () => eg,
          P1: () => et,
          PM: () => v,
          Po: () => y,
          Qf: () => d,
          Ql: () => k,
          RF: () => ev,
          Rt: () => p,
          Ry: () => h,
          SG: () => eb,
          SL: () => ey,
          Tc: () => $,
          UI: () => N,
          UX: () => z,
          Uw: () => es,
          VH: () => er,
          VM: () => Z,
          VU: () => ea,
          VW: () => em,
          Vn: () => ep,
          XC: () => eo,
          XL: () => ef,
          Y7: () => x,
          YS: () => Q,
          Zk: () => eD,
          _T: () => eA,
          e: () => V,
          a0: () => eu,
          b4: () => ee,
          ce: () => q,
          dv: () => j,
          f9: () => u,
          fN: () => Y,
          ff: () => A,
          gU: () => T,
          i2: () => g,
          il: () => l,
          j: () => f,
          jk: () => B,
          k9: () => ed,
          oF: () => i,
          p0: () => X,
          pF: () => s,
          r3: () => E,
          rB: () => eh,
          rS: () => L,
          rj: () => I,
          s7: () => O,
          uH: () => ec,
          uf: () => en,
          v8: () => a,
          vB: () => c,
          vh: () => o,
          wG: () => R,
          yE: () => P,
          z2: () => W,
          zH: () => eC,
          zM: () => r,
          zY: () => J,
        });
        var r = "buffering",
          u = "idle",
          i = "complete",
          o = "paused",
          a = "playing",
          s = "error",
          c = "loading",
          l = "stalled",
          f = "drag",
          d = "dragStart",
          h = "dragEnd",
          p = "click",
          D = "doubleClick",
          v = "over",
          g = "move",
          m = "enter",
          y = "out",
          A = s,
          F = "warning",
          C = "adClick",
          E = "mediaLoaded",
          b = "adPause",
          w = "adPlay",
          B = "adSkipped",
          k = "adTime",
          _ = "autostartNotAllowed",
          j = i,
          P = "ready",
          O = "seek",
          S = "beforePlay",
          x = "beforeComplete",
          T = "bufferFull",
          I = "absolutePositionReady",
          N = "displayClick",
          L = "playlistComplete",
          M = "cast",
          R = "mediaError",
          V = "firstFrame",
          U = "playAttempt",
          z = "playAttemptFailed",
          H = "seeked",
          $ = "setupError",
          q = "state",
          Q = "bufferChange",
          Y = "time",
          W = "ratechange",
          G = "mediaType",
          K = "volume",
          X = "mute",
          J = "metadataCueParsed",
          Z = "meta",
          ee = "levels",
          et = "levelsChanged",
          en = "visualQuality",
          er = "controls",
          eu = "fullscreen",
          ei = "resize",
          eo = "playlistItem",
          ea = "playlist",
          es = "audioTracks",
          ec = "audioTrackChanged",
          el = "subtitlesTracks",
          ef = "subtitlesTrackChanged",
          ed = "playbackRateChanged",
          eh = "logoClick",
          ep = "captionsList",
          eD = "captionsChanged",
          ev = "providerFirstFrame",
          eg = "userAction",
          em = "instreamClick",
          ey = "breakpoint",
          eA = "fullscreenchange",
          eF = "bandwidthEstimate",
          eC = "float",
          eE = "chapter",
          eb = "mediaCueChanged";
      },
      7264(e, t, n) {
        "use strict";
        n.d(t, { E_: () => u, VB: () => i, p5: () => r, uB: () => o });
        var r = {
            audioMode: !1,
            itemMeta: {},
            playbackRate: 1,
            playRejected: !1,
            state: n(1860).f9,
            itemReady: !1,
            controlsEnabled: !1,
          },
          u = { position: 0, duration: 0, buffer: 0, currentTime: 0 },
          i = 120,
          o = 25;
      },
      8186(e, t, n) {
        "use strict";
        n.d(t, { A: () => s });
        var r = n(4880),
          u = n(494),
          i = n(9407),
          o = n(467),
          a = n(884),
          s = (function (e) {
            function t() {
              var e;
              return (
                (0, u._)(this, t),
                (e = (0, r._)(this, t)),
                (0, o._)(e, "attributes", void 0),
                (e.attributes = Object.create(null)),
                e
              );
            }
            return (
              (0, a._)(t, e),
              (0, i._)(t, [
                {
                  key: "addAttributes",
                  value: function (e) {
                    var t = this;
                    Object.keys(e).forEach(function (n) {
                      t.add(n, e[n]);
                    });
                  },
                },
                {
                  key: "add",
                  value: function (e, t) {
                    var n = this;
                    (Object.defineProperty(this, e, {
                      get: function () {
                        return n.attributes[e];
                      },
                      set: function (t) {
                        n.set(e, t);
                      },
                      enumerable: !1,
                    }),
                      (this.attributes[e] = t));
                  },
                },
                {
                  key: "get",
                  value: function (e) {
                    return this.attributes[e];
                  },
                },
                {
                  key: "set",
                  value: function (e, t) {
                    if (this.attributes[e] !== t) {
                      var n = this.attributes[e];
                      ((this.attributes[e] = t), this.trigger("change:".concat(e), this, t, n));
                    }
                  },
                },
                {
                  key: "clone",
                  value: function () {
                    var e = {},
                      t = this.attributes;
                    if (t) for (var n in t) e[n] = t[n];
                    return e;
                  },
                },
                {
                  key: "change",
                  value: function (e, t, n) {
                    this.on("change:".concat(e), t, n);
                    var r = this.get(e);
                    return (t.call(n, this, r, r), this);
                  },
                },
              ]),
              t
            );
          })(n(5001).Ay);
      },
      2732(e, t, n) {
        "use strict";
        n.d(t, { P_: () => i, W_: () => a, fk: () => u, h1: () => o });
        var r = n(1659),
          u = function (e) {
            var t = "";
            return (e && (e.localName ? (t = e.localName) : e.baseName && (t = e.baseName)), t);
          },
          i = function (e) {
            var t = "";
            return (
              e &&
                (e.textContent
                  ? (t = (0, r.Bq)(e.textContent))
                  : e.text && (t = (0, r.Bq)(e.text))),
              t
            );
          },
          o = function (e, t) {
            return e.childNodes[t];
          },
          a = function (e) {
            return e.childNodes ? e.childNodes.length : 0;
          };
      },
      9630(e, t, n) {
        "use strict";
        n.d(t, { A: () => d });
        var r = n(2732),
          u = n(1659),
          i = function (e) {
            for (var t = [], n = 0; n < (0, r.W_)(e); n++) {
              var u = e.childNodes[n];
              "jwplayer" === u.prefix &&
                "mediatypes" === (0, r.fk)(u).toLowerCase() &&
                t.push((0, r.P_)(u));
            }
            return t;
          },
          o = function (e) {
            var t = {
              zh: "Chinese",
              nl: "Dutch",
              en: "English",
              fr: "French",
              de: "German",
              it: "Italian",
              ja: "Japanese",
              pt: "Portuguese",
              ru: "Russian",
              es: "Spanish",
            };
            return t[e] ? t[e] : e;
          },
          a = function (e, t) {
            for (var n = [], s = 0; s < (0, r.W_)(e); s++) {
              var c = e.childNodes[s];
              if ("media" === c.prefix) {
                if (!(0, r.fk)(c)) continue;
                switch ((0, r.fk)(c).toLowerCase()) {
                  case "content":
                    if (
                      ((0, u.IE)(c, "duration") &&
                        (t.duration = (0, u.YA)((0, u.IE)(c, "duration"))),
                      (0, u.IE)(c, "url"))
                    ) {
                      t.sources || (t.sources = []);
                      var l = {
                          file: (0, u.IE)(c, "url"),
                          type: (0, u.IE)(c, "type"),
                          width: (0, u.IE)(c, "width"),
                          label: (0, u.IE)(c, "label"),
                        },
                        f = i(c);
                      (f.length && (l.mediaTypes = f), t.sources.push(l));
                    }
                    (0, r.W_)(c) > 0 && (t = a(c, t));
                    break;
                  case "title":
                    t.title = (0, r.P_)(c);
                    break;
                  case "description":
                    t.description = (0, r.P_)(c);
                    break;
                  case "guid":
                    t.mediaid = (0, r.P_)(c);
                    break;
                  case "thumbnail":
                    t.image || (t.image = (0, u.IE)(c, "url"));
                    break;
                  case "group":
                    a(c, t);
                    break;
                  case "subtitle":
                    var d = { file: (0, u.IE)(c, "url"), kind: "captions" };
                    ((0, u.IE)(c, "lang").length > 0 && (d.label = o((0, u.IE)(c, "lang"))),
                      n.push(d));
                }
              }
            }
            t.tracks || (t.tracks = []);
            for (var h = 0; h < n.length; h++) t.tracks.push(n[h]);
            return t;
          },
          s = n(4794);
        let c = function (e, t) {
          for (
            var n = "default", i = "label", o = "file", a = [], c = [], l = 0;
            l < e.childNodes.length;
            l++
          ) {
            var f = e.childNodes[l];
            if ("jwplayer" === f.prefix) {
              var d = (0, r.fk)(f);
              "source" === d
                ? (delete t.sources,
                  a.push({
                    file: (0, u.IE)(f, o),
                    default: (0, u.IE)(f, n),
                    label: (0, u.IE)(f, i),
                    type: (0, u.IE)(f, "type"),
                  }))
                : "track" === d
                  ? (delete t.tracks,
                    c.push({
                      file: (0, u.IE)(f, o),
                      default: (0, u.IE)(f, n),
                      kind: (0, u.IE)(f, "kind"),
                      label: (0, u.IE)(f, i),
                    }))
                  : ((t[d] = (0, s.serialize)((0, r.P_)(f))),
                    "file" === d && t.sources && delete t.sources);
            }
            t[o] || (t[o] = t.link);
          }
          if (a.length) {
            t.sources = [];
            for (var h = 0; h < a.length; h++) {
              var p = a[h];
              p.file.length > 0 &&
                ((p[n] = "true" === a[h][n]), p.label || delete p.label, t.sources.push(p));
            }
          }
          if (c.length) {
            t.tracks = [];
            for (var D = 0; D < c.length; D++) {
              var v = c[D];
              v.file &&
                v.file.length > 0 &&
                ((v[n] = "true" === c[D][n]),
                (v.kind = c[D].kind.length ? c[D].kind : "captions"),
                v.label || delete v.label,
                t.tracks.push(v));
            }
          }
          return t;
        };
        var l = n(1993),
          f = function (e) {
            for (var t = {}, n = 0; n < e.childNodes.length; n++) {
              var i = e.childNodes[n],
                o = (0, r.fk)(i);
              if (o)
                switch (o.toLowerCase()) {
                  case "enclosure":
                    t.file = (0, u.IE)(i, "url");
                    break;
                  case "title":
                    t.title = (0, r.P_)(i);
                    break;
                  case "guid":
                    t.mediaid = (0, r.P_)(i);
                    break;
                  case "pubdate":
                    t.date = (0, r.P_)(i);
                    break;
                  case "description":
                    t.description = (0, r.P_)(i);
                    break;
                  case "link":
                    t.link = (0, r.P_)(i);
                    break;
                  case "category":
                    t.tags ? (t.tags += (0, r.P_)(i)) : (t.tags = (0, r.P_)(i));
                }
            }
            return new l.A(c(e, a(e, t)));
          };
        function d(e) {
          var t = [];
          t.feedData = {};
          for (var n = 0; n < (0, r.W_)(e); n++) {
            var u = (0, r.h1)(e, n);
            if ("channel" === (0, r.fk)(u).toLowerCase())
              for (var i = 0; i < (0, r.W_)(u); i++) {
                var o = (0, r.h1)(u, i),
                  a = (0, r.fk)(o).toLowerCase();
                "item" === a ? t.push(f(o)) : a && (t.feedData[a] = (0, r.P_)(o));
              }
          }
          return t;
        }
      },
      2972(e, t, n) {
        "use strict";
        n.d(t, { G: () => o, J: () => i });
        var r = n(494),
          u = n(9407),
          i = function e(t, n) {
            ((0, r._)(this, e), (this.defaultLanguage = t), (this.timestamps = n));
          },
          o = (function () {
            function e(t) {
              var n = this,
                u = t.title,
                i = void 0 === u ? {} : u,
                o = t.group,
                a = t.time,
                s = t.image;
              ((0, r._)(this, e),
                (this.title = {}),
                (this.time = a),
                (this.group = o),
                (this.image = s),
                Object.keys(i).forEach(function (e) {
                  var t = i[e];
                  n.addTitle(e, t);
                }));
            }
            return (
              (0, u._)(e, [
                {
                  key: "addTitle",
                  value: function (e, t) {
                    this.title[e] = t;
                  },
                },
              ]),
              e
            );
          })();
      },
      1993(e, t, n) {
        "use strict";
        n.d(t, { A: () => s });
        var r = n(3953),
          u = ["captions", "metadata", "thumbnails", "chapters"];
        let i = function (e) {
          if (e && e.file) {
            var t,
              n = Object.assign({}, { kind: "captions", default: !1 }, e);
            return (
              (t = n.kind),
              (n.kind = -1 !== u.indexOf(t) ? n.kind : "captions"),
              (n.default = !!n.default),
              n
            );
          }
        };
        var o = n(7264),
          a = Array.isArray;
        let s = function (e) {
          a((e = e || {}).tracks) || delete e.tracks;
          var t = Object.assign({}, { sources: [], tracks: [], minDvrWindow: o.VB }, e);
          (t.sources !== Object(t.sources) || a(t.sources) || (t.sources = [(0, r.A)(t.sources)]),
            (a(t.sources) && 0 !== t.sources.length) ||
              (e.levels ? (t.sources = e.levels) : (t.sources = [(0, r.A)(e)])));
          for (var n = 0; n < t.sources.length; n++) {
            var u = t.sources[n];
            if (u) {
              var s = u.default;
              (s ? (u.default = "true" === s.toString()) : (u.default = !1),
                t.sources[n].label || (t.sources[n].label = n.toString()),
                (t.sources[n] = (0, r.A)(t.sources[n])));
            }
          }
          return (
            (t.sources = t.sources.filter(Boolean)),
            a(t.tracks) || (t.tracks = []),
            a(t.captions) && ((t.tracks = t.tracks.concat(t.captions)), delete t.captions),
            (t.tracks = t.tracks.map(i).filter(Boolean)),
            t
          );
        };
      },
      1027(e, t, n) {
        "use strict";
        n.d(t, { A: () => l });
        var r = n(3750),
          u = n(1860),
          i = n(2732),
          o = n(9630),
          a = n(493),
          s = n(5001),
          c = n(8253);
        let l = function () {
          var e = Object.assign(this, s.Ay),
            t = function (t) {
              ((0, r._)(t, c.Mk) && !t.code && (t = new c.Mk(c.UP, 0)), e.trigger(u.ff, t));
            },
            n = function (n) {
              try {
                var r,
                  a = n.responseXML ? n.responseXML.childNodes : null,
                  s = null;
                if (a) {
                  for (var l = 0; l < a.length && ((s = a[l]), 8 === s.nodeType); l++);
                  if (
                    (s && "xml" === (0, i.fk)(s) && (s = s.nextSibling),
                    s && "rss" === (0, i.fk)(s))
                  ) {
                    var f = (0, o.A)(s);
                    r = Object.assign({ playlist: f }, f.feedData);
                  }
                }
                if (!r)
                  try {
                    var d = JSON.parse(n.responseText);
                    if (Array.isArray(d)) r = { playlist: d };
                    else if (Array.isArray(d.playlist)) r = d;
                    else throw Error("Playlist is not an array");
                  } catch (e) {
                    throw new c.Mk(c.UP, 621, e);
                  }
                e.trigger(u.VU, r);
              } catch (e) {
                t(e);
              }
            };
          ((this.load = function (e) {
            (0, a.R)(e, n, function (e, n, r, u) {
              t(u);
            });
          }),
            (this.destroy = function () {
              this.off();
            }));
        };
      },
      5471(e, t, n) {
        "use strict";
        n.d(t, { Ru: () => y, IA: () => C, Ay: () => E, Xh: () => m, F8: () => A, dW: () => F });
        var r = { none: !0, metadata: !0, auto: !0 },
          u = function (e, t) {
            return r[e] ? e : r[t] ? t : "metadata";
          },
          i = n(1993),
          o = n(3953),
          a = n(9813),
          s = n(8253),
          c = n(9055),
          l = function (e, t) {
            return void 0 === e ? t : e;
          },
          f = function (e, t, n) {
            n in t && (e[n] = t[n]);
          },
          d = function (e, t, n) {
            e.liveSyncDuration || f(e, t.liveSyncDuration ? t : n, "liveSyncDuration");
          },
          h = function (e, t) {
            var n = t.attributes,
              r = e.sources,
              i = e.allSources,
              a = e.preload,
              s = e.drm,
              c = l(e.withCredentials, n.withCredentials);
            return (i || r)
              .map(function (t) {
                if (t !== Object(t)) return null;
                (f(t, n, "androidhls"),
                  f(t, n, "hlsjsdefault"),
                  f(t, n, "safarihlsjs"),
                  d(t, e, n),
                  f(t, n, "_hlsjsProgressive"),
                  (t.preload = u(t.preload, a)));
                var r = t.drm || s || n.drm;
                r && (t.drm = r);
                var i = l(t.withCredentials, c);
                return (void 0 !== i && (t.withCredentials = i), (0, o.A)(t));
              })
              .filter(Boolean);
          },
          p = function (e) {
            return c.Browser.safari
              ? e.sort(function (e) {
                  return "hls" === e.type ? -1 : 0;
                })
              : e;
          },
          D = function (e, t) {
            for (var n = 0; n < e.length; n++) {
              var r = e[n],
                u = t.choose(r).providerToCheck;
              if (u) return { type: r.type, provider: u };
            }
            return null;
          },
          v = function (e, t) {
            (t && t.choose) || (t = new a.A());
            var n = D(e, t);
            if (!n) return [];
            var r = n.provider,
              u = n.type;
            return e.filter(function (e) {
              return e.type === u && t.providerSupports(r, e);
            });
          },
          g = function (e) {
            var t = e.sources[0].liveSyncDuration;
            return (t && (e.liveSyncDuration = e.dvrSeekLimit = t), e);
          },
          m = function (e, t, n) {
            var r = e.getProviders(),
              i = e.get("preload"),
              o = e.get("jwStart"),
              a = Object.assign({}, t);
            if (
              ((a.preload = u(t.preload, i)),
              (a.allSources = p(h(a, e))),
              (a.sources = v(a.allSources, r)),
              a.sources.length)
            )
              return (
                (a.file = a.sources[0].file),
                (a.feedData = n),
                o && -1 !== o && e.get("generateSEOMetadata") && (a.starttime = o),
                g(a)
              );
          },
          y = function (e, t, n) {
            var r = Object.assign({}, n);
            return (
              delete r.playlist,
              e
                .map(function (e) {
                  return m(t, e, r);
                })
                .filter(Boolean)
            );
          },
          A = function (e) {
            if (!Array.isArray(e) || 0 === e.length) throw new s.Mk(s.UP, 630);
          },
          F = function (e, t) {
            var n = (parseInt(e, 10) || 0) % t;
            return (n < 0 && (n += t), n);
          },
          C = function (e, t) {
            return v(p(h(e, t)), t.getProviders());
          };
        let E = function (e) {
          return (Array.isArray(e) ? e : [e]).map(i.A);
        };
      },
      3953(e, t, n) {
        "use strict";
        n.d(t, { A: () => i });
        var r = n(2235),
          u = n(1659);
        let i = function (e) {
          if (e && e.file) {
            var t = Object.assign({}, { default: !1, type: "" }, e);
            t.file = (0, u.Bq)("".concat(t.file));
            var n = /^[^/]+\/(?:x-)?([^/]+)$/,
              i = t.type;
            if (
              (n.test(i) && ((t.mimeType = i), (t.type = i.replace(n, "$1"))),
              (0, r.isYouTube)(t.file)
                ? (t.type = "youtube")
                : (0, r.isRtmp)(t.file)
                  ? (t.type = "rtmp")
                  : t.type || (t.type = (0, u.ck)(t.file)),
              t.type)
            ) {
              switch (t.type) {
                case "m3u8":
                case "vnd.apple.mpegurl":
                  t.type = "hls";
                  break;
                case "dash+xml":
                  t.type = "dash";
                  break;
                case "m4a":
                  t.type = "aac";
                  break;
                case "smil":
                  t.type = "rtmp";
              }
              return (
                Object.keys(t).forEach(function (e) {
                  "" === t[e] && delete t[e];
                }),
                t
              );
            }
          }
        };
      },
      1051(e, t, n) {
        "use strict";
        n.d(t, { A: () => f });
        var r = n(1535),
          u = n(4794),
          i = n(1659),
          o = n(8253),
          a = n(9621),
          s = function (e) {
            if ("string" == typeof e) {
              var t = (e = e.split("?")[0]).indexOf("://");
              if (t > 0) return 0;
              var n = e.indexOf("/"),
                r = (0, i.ck)(e);
              return t < 0 && n < 0 && (!r || !isNaN(r)) ? 2 : 1;
            }
          },
          c = function (e) {
            switch (s(e)) {
              case 0:
                return e;
              case 1:
                return (0, u.getAbsolutePath)(e, window.location.href);
            }
          },
          l = function (e) {
            ((this.url = e), (this.promise_ = null));
          };
        (Object.defineProperties(l.prototype, {
          promise: {
            get: function () {
              return this.load();
            },
            set: function () {},
          },
        }),
          Object.assign(l.prototype, {
            load: function () {
              var e = this,
                t = this.promise_;
              if (!t) {
                if (2 === s(this.url)) return Promise.resolve(this);
                var n = new r.Ay(c(this.url));
                ((this.loader = n),
                  (t = n.load().then(function () {
                    return e;
                  })),
                  (this.promise_ = t));
              }
              return t;
            },
            registerPlugin: function (e, t, n) {
              ((this.name = e), (this.target = t), (this.js = n));
            },
            getNewInstance: function (e, t, n) {
              var r = this.js;
              if ("function" != typeof r) throw new o.Mk(null, (0, a.rE)(this.url) + 100);
              var u = new r(e, t, n),
                i = { type: "pluginInitialized", name: this.name, config: t };
              return (
                (u.addToPlayer = function () {
                  var e = this,
                    t = arguments.length > 0 && void 0 !== arguments[0] && arguments[0],
                    r = this.getContainer().querySelector(".jw-overlays");
                  if (r)
                    return (
                      (n.left = r.style.left),
                      (n.top = r.style.top),
                      r.appendChild(n),
                      t
                        ? this.trigger("pluginInitialized", i)
                        : setTimeout(function () {
                            return e.trigger("pluginInitialized", i);
                          }, 0),
                      u
                    );
                }),
                (u.resizeHandler = function () {
                  var e = this.getContainer().querySelector(".jw-overlays");
                  e && u.resize(e.clientWidth, e.clientHeight);
                }),
                u
              );
            },
          }));
        let f = l;
      },
      9621(e, t, n) {
        "use strict";
        n.d(t, { Gv: () => o, dB: () => u, ot: () => a, rE: () => i });
        var r = n(8586);
        n(5483);
        var u = function (e) {
            var t = /\/((.(?!\/))+?)\.js/i.exec(e),
              n = (null == t ? void 0 : t[1]) || e;
            return n && "jwpsrv-dnt" === n ? "jwpsrv" : n && "jwx" === n ? "cnx" : n;
          },
          i = function (e) {
            var t = 305e3;
            if (!e) return t;
            switch (u(e)) {
              case "jwpsrv":
                t = 305001;
                break;
              case "googima":
                t = 305002;
                break;
              case "vast":
                t = 305003;
                break;
              case "freewheel":
                t = 305004;
                break;
              case "dai":
                t = 305005;
                break;
              case "gapro":
                t = 305006;
                break;
              case "bidding":
                t = 305007;
            }
            return t;
          },
          o = function (e) {
            var t = "";
            "https:" !== window.location.protocol &&
              "http:" !== window.location.protocol &&
              (t = "https:");
            var n = {
              bidding: "//ssl.p.jwpcdn.com/player/v/8.41.1/bidding.js",
              jwpsrv: "//ssl.p.jwpcdn.com/player/v/8.41.1/jwpsrv.js",
              dai: "//ssl.p.jwpcdn.com/player/v/8.41.1/dai.js",
              vast: "//ssl.p.jwpcdn.com/player/v/8.41.1/vast.js",
              googima: "//ssl.p.jwpcdn.com/player/v/8.41.1/googima.js",
              freewheel: "//ssl.p.jwpcdn.com/player/v/8.41.1/freewheel.js",
              gapro: "//ssl.p.jwpcdn.com/player/v/8.41.1/gapro.js",
              interactive: "//ssl.p.jwpcdn.com/player/v/8.41.1/interactive.js",
              keepWatching: "//ssl.p.jwpcdn.com/player/v/8.41.1/keepWatching.js",
              cnx: "//ssl.p.jwpcdn.com/player/v/8.41.1/cnx.js",
              jwx: "//ssl.p.jwpcdn.com/player/v/8.41.1/cnx.js",
            }[e];
            return n ? t + n : "";
          },
          a = function (e, t, n) {
            var u = e.name,
              i = Object.assign({}, t, (0, r.vA)(e.url)),
              o = document.createElement("div");
            ((o.id = "".concat(n.id, "_").concat(u)), (o.className = "jw-plugin jw-reset"));
            var a = e.getNewInstance(n, i, o);
            return (n.addPlugin(u, a), a);
          };
      },
      8092(e, t, n) {
        "use strict";
        n.d(t, { A: () => a, P: () => o });
        var r = n(4172),
          u = n(2194).A.logger.child("jwplayer/program/media-element-pool"),
          i = function (e) {
            e.src || e.load();
          },
          o = function (e) {
            var t = document.createElement("video");
            return (
              (t.className = "jw-video jw-reset"),
              t.setAttribute("tabindex", "-1"),
              t.setAttribute("disableRemotePlayback", ""),
              t.setAttribute("webkit-playsinline", ""),
              t.setAttribute("playsinline", ""),
              e &&
                Object.keys(e).forEach(function (n) {
                  t.setAttribute(n, e[n]);
                }),
              t
            );
          };
        function a() {
          for (var e = r.Iq, t = [], n = [], a = 0; a < e; a++) {
            var s = o();
            (t.push(s), n.push(s), i(s));
          }
          var c = n.shift(),
            l = n.shift(),
            f = !1;
          return {
            primed: function () {
              return f;
            },
            prime: function () {
              (t.forEach(i), (f = !0));
            },
            played: function () {
              f = !0;
            },
            getPrimedElement: function () {
              return n.shift() || null;
            },
            getAdElement: function () {
              return c;
            },
            getTestElement: function () {
              return l;
            },
            clean: function (e) {
              if (e.src) {
                e.removeAttribute("src");
                try {
                  e.load();
                } catch (e) {
                  u.debug(e);
                }
              }
            },
            recycle: function (e) {
              e &&
                !n.some(function (t) {
                  return t === e;
                }) &&
                (this.clean(e), n.push(e));
            },
            syncVolume: function (e) {
              var n = Math.min(Math.max(0, e / 100), 1);
              t.forEach(function (e) {
                e.volume = n;
              });
            },
            syncMute: function (e) {
              t.forEach(function (t) {
                t.muted = e;
              });
            },
          };
        }
      },
      4172(e, t, n) {
        "use strict";
        n.d(t, { Iq: () => r, rJ: () => i, wZ: () => u });
        var r = 4,
          u = 5,
          i = 1;
      },
      6721(e, t, n) {
        "use strict";
        function r(e, t) {
          return Object.assign({}, t, {
            prime: function () {
              e.src || e.load();
            },
            getPrimedElement: function () {
              return e;
            },
            clean: function () {
              t.clean(e);
            },
            recycle: function () {
              t.clean(e);
            },
          });
        }
        n.d(t, { A: () => r });
      },
      3967(e, t, n) {
        "use strict";
        n.d(t, { A: () => s });
        var r = n(1860),
          u = n(1525),
          i = function () {},
          o = function () {
            return !1;
          },
          a = { name: "default" };
        let s = {
          supports: o,
          play: i,
          pause: i,
          preload: i,
          load: i,
          stop: i,
          volume: i,
          mute: i,
          seek: i,
          resize: i,
          remove: i,
          destroy: i,
          setVisibility: i,
          setFullscreen: function (e) {
            return (0, u.uy)(this, e);
          },
          getFullscreen: o,
          supportsFullscreen: o,
          getContainer: i,
          setContainer: i,
          getName: function () {
            return a;
          },
          getQualityLevels: i,
          getCurrentQuality: i,
          setCurrentQuality: i,
          getAudioTracks: i,
          getCurrentAudioTrack: i,
          setCurrentAudioTrack: i,
          getSeekRange: function () {
            return { start: 0, end: this.getDuration() };
          },
          setPlaybackRate: i,
          getPlaybackRate: function () {
            return 1;
          },
          getBandwidthEstimate: function () {
            return null;
          },
          getLiveLatency: function () {
            return null;
          },
          attachMedia: i,
          detachMedia: i,
          init: i,
          setState: function (e) {
            ((this.state = e), this.trigger(r.ce, { newstate: e }));
          },
          sendMediaType: function (e) {
            var t = e[0],
              n = t.type,
              u = t.mimeType,
              i = "aac" === n || "mp3" === n || "mpeg" === n || (u && 0 === u.indexOf("audio/"));
            this.trigger(r.Ap, { mediaType: i ? "audio" : "video" });
          },
          getDuration: function () {
            return 0;
          },
          trigger: i,
        };
      },
      6966(e, t, n) {
        "use strict";
        n.d(t, { Hj: () => s, TT: () => l, dy: () => c, tG: () => f });
        var r,
          u = n(5293),
          i = [
            { configName: "clearkey", keyName: "org.w3.clearkey" },
            { configName: "widevine", keyName: "com.widevine.alpha" },
            { configName: "playready", keyName: "com.microsoft.playready" },
          ],
          o = [],
          a = {},
          s = function (e) {
            return e.some(function (e) {
              return (
                !!e.drm ||
                e.sources.some(function (e) {
                  return !!e.drm;
                })
              );
            });
          },
          c = function (e) {
            return (
              r ||
              (((navigator.requestMediaKeySystemAccess &&
                window.MediaKeySystemAccess.prototype.getConfiguration) ||
                window.MSMediaKeys) &&
              (0, u.A)(e)("drm")
                ? (i.forEach(function (e) {
                    var t,
                      n,
                      r = ((t = e.keyName),
                      (n = [
                        {
                          initDataTypes: ["cenc"],
                          videoCapabilities: [{ contentType: 'video/mp4;codecs="avc1.4d401e"' }],
                          audioCapabilities: [{ contentType: 'audio/mp4;codecs="mp4a.40.2"' }],
                        },
                      ]),
                      navigator.requestMediaKeySystemAccess
                        ? navigator.requestMediaKeySystemAccess(t, n)
                        : new Promise(function (e, n) {
                            var r;
                            try {
                              r = new window.MSMediaKeys(t);
                            } catch (e) {
                              n(e);
                              return;
                            }
                            e(r);
                          }))
                        .then(function () {
                          a[e.configName] = !0;
                        })
                        .catch(function () {
                          a[e.configName] = !1;
                        });
                    o.push(r);
                  }),
                  (r = Promise.all(o)))
                : Promise.resolve())
            );
          },
          l = function (e) {
            return a[e];
          },
          f = function (e) {
            if (r)
              return Object.keys(e).some(function (e) {
                return l(e);
              });
          };
      },
      132(e, t, n) {
        "use strict";
        n.d(t, { X: () => u });
        var r = n(9055),
          u = function (e) {
            return "hls" === e.type && r.OS.android
              ? !1 !== e.androidhls &&
                  !r.Browser.firefox &&
                  parseFloat(r.OS.version.version || "0") >= 4.4
              : null;
          };
      },
      4066(e, t, n) {
        "use strict";
        n.d(t, { m: () => r });
        var r = {};
      },
      8888(e, t, n) {
        "use strict";
        n.d(t, { A: () => a });
        var r = n(4066),
          u = n(9063),
          i = n(3967),
          o = n(9555);
        function a(e) {
          var t = e.getName().name;
          if (!r.m[t]) {
            if (!(0, o.I6)(u.M, (0, o.cK)({ name: t }))) {
              if (!(0, o.Tn)(e.supports))
                throw Error("Tried to register a provider with an invalid object");
              u.M.unshift({ name: t, supports: e.supports });
            }
            ((0, o.NT)(e.prototype, i.A), (r.m[t] = e));
          }
        }
        n(5001);
      },
      9063(e, t, n) {
        "use strict";
        n.d(t, { M: () => p, R: () => h });
        var r = n(132),
          u = n(2235),
          i = n(3078),
          o = n(9055),
          a = n(5293),
          s = n(6966),
          c = function (e) {
            ((null == e ? void 0 : e.length) && Array.isArray(e)) ||
              (e = ['video/mp4;codecs="avc1.4d400d,mp4a.40.2"']);
            var t = window.MediaSource;
            return (
              !!t &&
              !!t.isTypeSupported &&
              e.every(function (e) {
                return t.isTypeSupported(e);
              })
            );
          },
          l = function (e) {
            return (
              /hls|m3u8/.test(((null == e ? void 0 : e.type) || "").toLowerCase()) ||
              ((null == e ? void 0 : e.file) || "").toLowerCase().indexOf(".m3u8") > -1
            );
          },
          f = function (e) {
            return (
              /mpd|dash/.test(((null == e ? void 0 : e.type) || "").toLowerCase()) ||
              ((null == e ? void 0 : e.file) || "").toLowerCase().indexOf("mpd-time-csf") > -1
            );
          },
          d = {
            aac: "audio/mp4",
            mp4: "video/mp4",
            f4v: "video/mp4",
            m4v: "video/mp4",
            mov: "video/mp4",
            mp3: "audio/mpeg",
            mpeg: "audio/mpeg",
            ogv: "video/ogg",
            ogg: "video/ogg",
            oga: "video/ogg",
            vorbis: "video/ogg",
            webm: "video/webm",
            f4a: "video/aac",
            m3u8: "application/vnd.apple.mpegurl",
            m3u: "application/vnd.apple.mpegurl",
            hls: "application/vnd.apple.mpegurl",
          },
          h = function (e) {
            if (!i.A || !i.A.canPlayType || !1 === (0, r.X)(e)) return !1;
            var t = e.file,
              n = e.type;
            if ((0, u.isRtmp)(t, n)) return !1;
            var o = e.mimeType || d[n];
            if (!o) return !1;
            var a = e.mediaTypes;
            return (
              (null == a ? void 0 : a.length) && (o = [o].concat(a.slice()).join("; ")),
              !!i.A.canPlayType(o)
            );
          },
          p = [
            {
              name: "hlsjs",
              supports: function (e) {
                if (e.drm || !l(e)) return !1;
                var t,
                  n = !!(null === i.A || void 0 === i.A || null == (t = i.A.canPlayType)
                    ? void 0
                    : t.call(i.A, "application/vnd.apple.mpegURL")),
                  r = "boolean" == typeof (null == e ? void 0 : e.safarihlsjs) && e.safarihlsjs;
                return (
                  (!o.OS.iPad || !o.Browser.chrome) &&
                  (!n || !o.Browser.safari || !!r) &&
                  (!n || !o.OS.android || !1 === e.androidhls || !1 !== e.hlsjsdefault) &&
                  c(e.mediaTypes)
                );
              },
            },
            {
              name: "html5",
              supports: function (e, t) {
                var n = h(e);
                if (f(e)) return !1;
                if (n && e.drm && l(e)) {
                  var r = (0, a.A)(t)("drm");
                  if (r && e.drm.fairplay) {
                    var u,
                      i = window.WebKitMediaKeys;
                    return null == i || null == (u = i.isTypeSupported)
                      ? void 0
                      : u.call(i, "com.apple.fps.1_0", "video/mp4");
                  }
                  return r;
                }
                return n;
              },
            },
            {
              name: "shaka",
              supports: function (e) {
                return (!e.drm || !!(0, s.tG)(e.drm)) && c(e.mediaTypes) && (f(e) || l(e));
              },
            },
          ];
      },
      9813(e, t, n) {
        "use strict";
        n.d(t, { A: () => c });
        var r = n(9063),
          u = n(4066),
          i = n(8888),
          o = n(9083),
          a = {
            html5: function () {
              return n
                .e("547")
                .then(n.bind(n, 1053))
                .then(function (e) {
                  var t = e.default;
                  return ((0, i.A)(t), t);
                })
                .catch((0, o.Q5)(152));
            },
            shaka: function () {
              return n
                .e("605")
                .then(n.bind(n, 9613))
                .then(function (e) {
                  var t = e.default;
                  return ((0, i.A)(t), t);
                })
                .catch((0, o.Q5)(154));
            },
            hlsjs: function () {
              return n
                .e("217")
                .then(n.bind(n, 1284))
                .then(function (e) {
                  var t = e.default;
                  return ((0, i.A)(t), t);
                })
                .catch((0, o.Q5)(153));
            },
          },
          s = function (e) {
            this.config = e || {};
          };
        Object.assign(s.prototype, {
          load: function (e) {
            var t = a[e],
              n = function () {
                return Promise.reject(Error("Failed to load media"));
              };
            return t
              ? t().then(function () {
                  var t = u.m[e];
                  return t || n();
                })
              : n();
          },
          providerSupports: function (e, t) {
            return e.supports(t, this.config.edition);
          },
          choose: function (e) {
            if (e === Object(e))
              for (var t = r.M.length, n = 0; n < t; n++) {
                var i = r.M[n];
                if (this.providerSupports(i, e))
                  return {
                    priority: t - n - 1,
                    name: i.name,
                    type: e.type,
                    providerToCheck: i,
                    provider: u.m[i.name],
                  };
              }
            return {};
          },
        });
        let c = s;
      },
      1525(e, t, n) {
        "use strict";
        n.d(t, { Ul: () => f, k: () => a, l_: () => l, uy: () => s });
        var r,
          u,
          i = n(1860),
          o = !1,
          a = function () {
            return o;
          },
          s = function (e, t) {
            if ((t = !!t)) {
              try {
                var n = e.video.webkitEnterFullscreen || e.video.webkitEnterFullScreen;
                n && n.apply(e.video);
              } catch (e) {
                return !1;
              }
              return e.getFullscreen();
            }
            var r = e.video.webkitExitFullscreen || e.video.webkitExitFullScreen;
            return (r && r.apply(e.video), t);
          },
          c = function (e, t, n) {
            ((o = n), e.trigger(i._T, { target: t.target, jwstate: n }));
          },
          l = function (e, t) {
            ((r = function (t) {
              return c(e, t, !0);
            }),
              (u = function (t) {
                return c(e, t, !1);
              }),
              t.addEventListener("webkitbeginfullscreen", r),
              t.addEventListener("webkitendfullscreen", u));
          },
          f = function (e) {
            (e.removeEventListener("webkitbeginfullscreen", r),
              e.removeEventListener("webkitendfullscreen", u));
          };
      },
      7268(e, t, n) {
        "use strict";
        n.d(t, { r: () => g, o: () => v });
        var r = n(1374),
          u = n(1893),
          i = n(478),
          o = n(1635);
        let a = class e {
            static normalizeVersion(e, t) {
              return e
                .trim()
                .replace(/^v/i, "")
                .split(".")
                .map(parseFloat)
                .filter((e) => !Number.isNaN(e))
                .join(t);
            }
            static generateCacheKey(t, n) {
              let r = e.normalizeVersion(n, ".");
              return `${t}@@${r}`;
            }
            static makePromise() {
              let e,
                t,
                n = new Promise((n, r) => {
                  ((e = n), (t = r));
                });
              return ((n.resolve = e), (n.reject = t), n);
            }
          },
          s = class {
            get key() {
              return a.generateCacheKey(this.name, this.version);
            }
            constructor(e, t, n) {
              ((this.name = e),
                (this.version = t),
                (this.promise = n),
                (this.timeoutId = void 0),
                (this.scriptElement = null));
            }
          },
          c = "-1.-1.-1",
          l = (e) => /^v?(\d+)(\.\d+)?(\.\d+)?([-+][0-9a-zA-Z-.]*)?$/.test(e),
          f = class e {
            static getServiceLoader(t) {
              let { globalVal: n } = t || {},
                r = n || window;
              return (r.jwpServices || (r.jwpServices = new e(t)), r.jwpServices);
            }
            addOverrides(e) {
              if ((Array.isArray(e) || "object" != typeof e || (e = [e]), !Array.isArray(e)))
                throw Error("addOverrides only accepts an array of object or a single object");
              for (let { name: t, client: n } of e) {
                if (!t || !n)
                  throw Error(
                    `invalid entry was passed to addOverrides. Objects must have a name and a client (url/version). ${JSON.stringify({ name: t, client: n })}`,
                  );
                let e = n;
                (l(n) && (e = this._makeFetchUrl(t, n.replace(/^v/i, ""))),
                  this._overrides.set(t, e));
              }
            }
            delOverrides(e) {
              if ((Array.isArray(e) || "object" != typeof e || (e = [e]), !Array.isArray(e)))
                throw Error("delOverrides only accepts an array of object or a single object");
              for (let { name: t } of e) {
                if (!t)
                  throw Error("invalid entry was passed to delOverrides. Objects must have a name");
                this._overrides.delete(t);
              }
            }
            async getService(e, t) {
              this._overrides.has(e) && (t = c);
              let n = a.generateCacheKey(e, t);
              if (this._serviceCache.has(n)) return this._serviceCache.get(n);
              if (this._loadingEntries.has(e)) {
                let n = this._loadingEntries.get(e);
                if (n.version === t) return n.promise;
                if (this._pendingQueue.has(e)) {
                  let n = this._pendingQueue.get(e);
                  if (null == n ? void 0 : n.length) {
                    let e = n.find((e) => e.version === t);
                    if (e) return e.promise;
                  }
                }
                let r = a.makePromise(),
                  u = new s(e, t, r);
                return (this._makePending(u), r);
              }
              let r = a.makePromise(),
                u = new s(e, t, r);
              return (this._doLoad(u), r);
            }
            async registerService(e, t) {
              if (!e || !t) return;
              let { currentScript: n } = this._global.document,
                r = await t,
                u = this._overrides.has(e) ? c : r.version,
                i = a.generateCacheKey(e, u);
              if (!this._loadingEntries.has(e)) return this._registerNonLoadingService(e, t);
              let o = this._loadingEntries.get(e);
              if (!o) return;
              let s = o.promise,
                l = o.key;
              if (o.scriptElement !== n) return this._registerNonLoadingService(e, t);
              (this._loadingEntries.delete(e), clearTimeout(o.timeoutId));
              let f = this._serviceCache.get(i);
              if (f)
                return (
                  this._serviceCache.set(l, f),
                  this._maybeMovePendingToLoading(e),
                  s.resolve(f)
                );
              (this._serviceCache.set(l, r),
                l !== i && this._serviceCache.set(i, s),
                this._maybeResolveOtherPending(e, t, u),
                this._maybeMovePendingToLoading(e),
                s.resolve(t));
            }
            async _registerNonLoadingService(e, t) {
              let n = await t,
                r = this._overrides.has(e) ? c : n.version,
                u = a.generateCacheKey(e, r);
              this._serviceCache.has(u) ||
                (this._serviceCache.set(u, n), this._maybeResolveOtherPending(e, t, r));
            }
            _maybeResolveOtherPending(e, t, n) {
              let r = this._pendingQueue.get(e);
              if (!r) return;
              if (!r.length) return void this._pendingQueue.delete(e);
              let u = r.findIndex((e) => e.version === n);
              if (-1 === u) return;
              let i = r.splice(u, 1)[0];
              (r.length || this._pendingQueue.delete(e), i.promise.resolve(t));
            }
            _makePending(e) {
              let { name: t } = e,
                n = this._pendingQueue.get(t);
              n ? n.push(e) : this._pendingQueue.set(t, [e]);
            }
            _doLoad(e) {
              let { name: t } = e;
              (this._setTimeout(e), this._createScriptElement(e), this._loadingEntries.set(t, e));
            }
            _setTimeout(e) {
              let t = Error("script loading timeout error");
              e.timeoutId = setTimeout(this._scriptError(e), 2e4, t);
            }
            _createScriptElement(e) {
              let { name: t, version: n } = e,
                r = this._global.document.createElement("script");
              ((r.type = "text/javascript"),
                (r.src = this._makeFetchUrl(t, n)),
                (r.onerror = this._scriptError(e)),
                (r.async = !0),
                (e.scriptElement = r),
                this._global.document.head.appendChild(r));
            }
            _scriptError(e) {
              return (t) => {
                var n;
                let { name: r, promise: u } = e;
                (clearTimeout(e.timeoutId), e.scriptElement && (e.scriptElement.onerror = null));
                let i = (null == e || null == (n = e.scriptElement) ? void 0 : n.src)
                    ? ` at ${e.scriptElement.src}`
                    : "",
                  o = (null == t ? void 0 : t.message) ? ` with error: ${t.message}` : "";
                (this._loadingEntries.delete(r),
                  this._maybeMovePendingToLoading(r),
                  u.reject(Error(`Failed to load service ${r}${i}${o}`)));
              };
            }
            _makeFetchUrl(e, t) {
              let n = this._overrides.get(e);
              if (n) return n;
              let r = a.normalizeVersion(t, "/");
              return `${this._baseUrl}/${e}/v/${r}/index.js`;
            }
            _maybeMovePendingToLoading(e) {
              let t = this._pendingQueue.get(e);
              if (!(null == t ? void 0 : t.length)) return;
              let n = t.shift();
              n && this._doLoad(n);
            }
            constructor(e) {
              const { baseUrl: t, globalVal: n } = e || {};
              if (
                ((this._baseUrl = t || "https://ssl.p.jwpcdn.com/player/services"),
                (this._global = n || window),
                (this._overrides = new Map()),
                (this._pendingQueue = new Map()),
                (this._loadingEntries = new Map()),
                (this._serviceCache = new Map()),
                this._global.location)
              ) {
                const e = new URL(this._global.location.href).searchParams.getAll("jwpcslOverride");
                this.addOverrides(
                  e.reduce((e, t) => {
                    let n = t.indexOf(":");
                    if (-1 === n)
                      return (console.warn("Skipping unsupported jwpcslOverride value", t), e);
                    let r = t.slice(0, n),
                      u = t.slice(n + 1);
                    return (e.push({ name: r, client: u }), e);
                  }, []),
                );
              }
            }
          };
        var d = n(566),
          h = n(5456),
          p = { forcePreroll: !0 },
          D = {
            dynamicAds: function (e, t) {
              return [
                (0, h._)((0, u._)({}, t), {
                  experienceName: "player",
                  experience: e,
                  adRules: (0, u._)({}, p, t.rules),
                }),
              ];
            },
          },
          v = function (e, t, n, a) {
            return (0, r._)(function () {
              var r, s, c, l, d, h, p, v, g;
              return (0, o.YH)(this, function (o) {
                switch (o.label) {
                  case 0:
                    return (
                      (s = f.getServiceLoader()),
                      (c = n.name),
                      (l = n.version),
                      (d = n.cfgKey),
                      t.set("services.".concat(c), "loading"),
                      (h = (0, u._)({}, a || {})).client &&
                        (s.addOverrides({ name: c, client: h.client }), delete h.client),
                      [4, s.getService(c, l)]
                    );
                  case 1:
                    var m, y;
                    if (((p = o.sent()), t.attributes._destroyed)) return [2];
                    return (
                      (m = h),
                      (v = D[(y = d)] ? D[y](e, m) : [e, m]),
                      [4, (r = p).register.apply(r, ["player"].concat((0, i._)(v)))]
                    );
                  case 2:
                    if (((g = o.sent()), t.attributes._destroyed)) return [2];
                    return (t.set("services.".concat(c), g), [2]);
                }
              });
            })();
          },
          g = function (e, t) {
            return (0, r._)(function () {
              var n, r, u, i, a, s, c, l, f, h, p, D, g, m, y, A;
              return (0, o.YH)(this, function (o) {
                switch (o.label) {
                  case 0:
                    ((n = t.getConfig()), (r = []), (u = !0), (i = !1), (a = void 0));
                    try {
                      for (s = d.A[Symbol.iterator](); !(u = (c = s.next()).done); u = !0) {
                        if (!(l = c.value).name || !l.version || !l.cfgKey)
                          throw Error(
                            "SERVICE_DEFINITIONS is invalid. Each service must have name, version, and cfgKey",
                            JSON.stringify(l),
                          );
                        ((f = l.cfgKey),
                          Object.hasOwn(n, f) && !l.async && r.push(v(t, e, l, n[f])));
                      }
                    } catch (e) {
                      ((i = !0), (a = e));
                    } finally {
                      try {
                        u || null == s.return || s.return();
                      } finally {
                        if (i) throw a;
                      }
                    }
                    if (n.services) {
                      ((h = !0), (p = !1), (D = void 0));
                      try {
                        for (
                          g = n.services[Symbol.iterator]();
                          !(h = (m = g.next()).done);
                          h = !0
                        ) {
                          if (
                            !(y = m.value) ||
                            !y.name ||
                            !(null == y || null == (A = y.version) ? void 0 : A.toString().length)
                          )
                            throw Error(
                              "playerConfig.services must have a defined name and version",
                            );
                          r.push(v(t, e, y, y.cfg));
                        }
                      } catch (e) {
                        ((p = !0), (D = e));
                      } finally {
                        try {
                          h || null == g.return || g.return();
                        } finally {
                          if (p) throw D;
                        }
                      }
                    }
                    return [4, Promise.all(r)];
                  case 1:
                    return [2, o.sent()];
                }
              });
            })();
          };
      },
      566(e, t, n) {
        "use strict";
        n.d(t, { A: () => r });
        let r = [
          { name: "discovery-videos", cfgKey: "discoveryVideos", version: "0", async: !0 },
          { name: "dynamic-ad-scheduler", cfgKey: "dynamicAds", version: "0" },
        ];
      },
      2329(e, t, n) {
        "use strict";
        n.d(t, { A: () => r });
        let r = (function () {
          if ("u" > typeof document) {
            if ("hidden" in document)
              return function () {
                return !document.hidden;
              };
            if ("webkitHidden" in document)
              return function () {
                return !document.webkitHidden;
              };
          }
          return function () {
            return !0;
          };
        })();
      },
      493(e, t, n) {
        "use strict";
        n.d(t, { B: () => s, R: () => d });
        var r,
          u = n(4794),
          i = n(2235),
          o = n(8253),
          a = function () {},
          s = function (e) {
            ((e.onload = null),
              (e.onprogress = null),
              (e.onreadystatechange = null),
              (e.onerror = null),
              "abort" in e && e.abort());
          },
          c = function (e, t, n, r) {
            e.onerror(t, e.url, e.xhr, new o.Mk(t, n, r));
          },
          l = function (e, t, n) {
            var r = t.documentElement;
            return n.requireValidXML &&
              ("parsererror" === r.nodeName || r.getElementsByTagName("parsererror").length)
              ? void c(n, o.UP, 601)
              : (e.responseXML || (e = Object.assign({}, e, { responseXML: t })), n.oncomplete(e));
          },
          f = function (e, t) {
            if (!e.response || ("string" == typeof e.response && '"' !== e.responseText.substr(1)))
              try {
                e = Object.assign({}, e, { response: JSON.parse(e.responseText) });
              } catch (e) {
                c(t, o.UP, 611, e);
                return;
              }
            return t.oncomplete(e);
          },
          d = function (e, t, n, d) {
            e === Object(e) && (e = (d = e).url);
            var h,
              p,
              D = Object.assign(
                {
                  xhr: null,
                  url: e,
                  withCredentials: !1,
                  retryWithoutCredentials: !1,
                  timeout: 6e4,
                  timeoutId: -1,
                  oncomplete: t || a,
                  onerror: n || a,
                  mimeType: d && !d.responseType ? "text/xml" : "",
                  requireValidXML: !1,
                  responseType: (null == d ? void 0 : d.plainText) ? "text" : "",
                  useDomParser: !1,
                  requestFilter: null,
                },
                d,
              ),
              v = r("Error loading file", D);
            if (!("XMLHttpRequest" in window)) return void c(D, o.Tm, 2);
            if (
              ((h = D.xhr = D.xhr || new window.XMLHttpRequest()),
              "function" == typeof D.requestFilter)
            ) {
              try {
                p = D.requestFilter({ url: e, xhr: h });
              } catch (e) {
                return (v(e, 5), h);
              }
              p && "open" in p && "send" in p && (h = D.xhr = p);
            }
            ((h.onreadystatechange = function (e) {
              var t = e.currentTarget || D.xhr;
              if (4 === t.readyState) {
                var n = t.status;
                if (n >= 400) {
                  (clearTimeout(D.timeoutId), c(D, o.UP, n < 600 ? n : 6));
                  return;
                }
                if (n >= 200 && n <= 299)
                  return (
                    clearTimeout(D.timeoutId),
                    (function (e) {
                      var t = e.currentTarget || D.xhr;
                      if ((clearTimeout(D.timeoutId), D.responseType)) {
                        if ("json" === D.responseType) return f(t, D);
                      } else {
                        var n,
                          r = t.responseXML;
                        if (r)
                          try {
                            n = r.firstChild;
                          } catch (e) {}
                        if (
                          (r && n) ||
                          (D.useDomParser &&
                            t.responseText &&
                            !r &&
                            (null == (r = (0, u.parseXML)(t.responseText)) ? void 0 : r.firstChild))
                        )
                          return l(t, r, D);
                        if (D.requireValidXML) return void c(D, o.UP, 602);
                      }
                      D.oncomplete(t);
                    })(e)
                  );
                0 === n &&
                  (0, i.isFileProtocol)() &&
                  !/^[a-z][a-z0-9+.-]*:/.test(D.url) &&
                  (clearTimeout(D.timeoutId), c(D, o.UP, 7));
              }
            }),
              (h.onerror = v),
              "overrideMimeType" in h
                ? D.mimeType && h.overrideMimeType(D.mimeType)
                : (D.useDomParser = !0));
            try {
              ((e = e.replace(/#.*$/, "")), h.open("GET", e, !0));
            } catch (e) {
              return (v(e, 3), h);
            }
            if (D.responseType)
              try {
                h.responseType = D.responseType;
              } catch (e) {}
            D.timeout &&
              ((D.timeoutId = setTimeout(function () {
                (s(h), c(D, o.Tm, 1));
              }, D.timeout)),
              (h.onabort = function () {
                clearTimeout(D.timeoutId);
              }));
            try {
              (D.withCredentials && "withCredentials" in h && (h.withCredentials = !0), h.send());
            } catch (e) {
              v(e, 4);
            }
            return h;
          };
        r = function (e, t) {
          return function (e, n) {
            var r = e.currentTarget || t.xhr;
            if ((clearTimeout(t.timeoutId), t.retryWithoutCredentials && t.xhr.withCredentials)) {
              (s(r),
                d(
                  Object.assign({}, t, {
                    xhr: null,
                    withCredentials: !1,
                    retryWithoutCredentials: !1,
                  }),
                ));
              return;
            }
            (!n && r.status >= 400 && r.status < 600 && (n = r.status),
              c(t, n ? o.UP : o.Tm, n || 6, e));
          };
        };
      },
      5001(e, t, n) {
        "use strict";
        n.d(t, { AU: () => p, Ay: () => f, CD: () => v, Oo: () => h, hZ: () => D, on: () => d });
        var r = n(494),
          u = n(9407),
          i = n(467),
          o = n(1642),
          a = n(2194).A.logger.child("jwplayer/utils/backbone.events"),
          s = function (e, t, n, r) {
            for (var u = -1, i = e.length; ++u < i; ) {
              var o = e[u];
              if (r)
                try {
                  o.callback.apply(o.context || n, t);
                } catch (e) {
                  a.debug('Error in "'.concat(r, '" event handler:'), e);
                }
              else o.callback.apply(o.context || n, t);
            }
          },
          c = /\s+/,
          l = function (e, t, n, r) {
            if (!n) return !0;
            if ((void 0 === n ? "undefined" : (0, o._)(n)) === "object") {
              for (var u in n) Object.hasOwn(n, u) && e[t].apply(e, [u, n[u]].concat(r));
              return !1;
            }
            if (c.test(n)) {
              for (var i = n.split(c), a = 0, s = i.length; a < s; a++)
                e[t].apply(e, [i[a]].concat(r));
              return !1;
            }
            return !0;
          },
          f = (function () {
            function e() {
              ((0, r._)(this, e), (0, i._)(this, "_events", void 0));
            }
            return (
              (0, u._)(e, [
                {
                  key: "on",
                  value: function (e, t, n) {
                    if (!l(this, "on", e, [t, n]) || !t) return this;
                    var r = this._events || (this._events = {});
                    return ((r[e] || (r[e] = [])).push({ callback: t, context: n }), this);
                  },
                },
                {
                  key: "once",
                  value: function (e, t, n) {
                    if (!l(this, "once", e, [t, n]) || !t) return this;
                    var r = 0,
                      u = this,
                      i = function () {
                        r++ || (u.off(e, i), t.apply(this, arguments));
                      };
                    return ((i._callback = t), this.on(e, i, n));
                  },
                },
                {
                  key: "off",
                  value: function (e, t, n) {
                    if (!this._events || !l(this, "off", e, [t, n])) return this;
                    if (!e && !t && !n) return (delete this._events, this);
                    for (
                      var r = e ? [e] : Object.keys(this._events), u = 0, i = r.length;
                      u < i;
                      u++
                    ) {
                      e = r[u];
                      var o = this._events[e];
                      if (o) {
                        var a = (this._events[e] = []);
                        if (t || n)
                          for (var s = 0, c = o.length; s < c; s++) {
                            var f = o[s];
                            ((t && t !== f.callback && t !== f.callback._callback) ||
                              (n && n !== f.context)) &&
                              a.push(f);
                          }
                        a.length || delete this._events[e];
                      }
                    }
                    return this;
                  },
                },
                {
                  key: "trigger",
                  value: function (e) {
                    for (var t = arguments.length, n = Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
                      n[r - 1] = arguments[r];
                    if (!this._events || !l(this, "trigger", e, n)) return this;
                    var u = this._events[e],
                      i = this._events.all;
                    return (u && s(u, n, this), i && s(i, arguments, this), this);
                  },
                },
                {
                  key: "triggerSafe",
                  value: function (e) {
                    for (var t = arguments.length, n = Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
                      n[r - 1] = arguments[r];
                    if (!this._events || !l(this, "trigger", e, n)) return this;
                    var u = this._events[e],
                      i = this._events.all;
                    return (u && s(u, n, this, e), i && s(i, arguments, this, e), this);
                  },
                },
              ]),
              e
            );
          })();
        ((0, i._)(f, "on", void 0),
          (0, i._)(f, "once", void 0),
          (0, i._)(f, "off", void 0),
          (0, i._)(f, "trigger", void 0));
        var d = f.prototype.on,
          h = f.prototype.once,
          p = f.prototype.off,
          D = f.prototype.trigger,
          v = f.prototype.triggerSafe;
        ((f.on = d), (f.once = h), (f.off = p), (f.trigger = D));
      },
      4916(e, t, n) {
        "use strict";
        n.d(t, { l: () => r });
        var r = window.atob;
        window.btoa;
      },
      2669(e, t, n) {
        "use strict";
        n.d(t, {
          $w: () => E,
          Fr: () => A,
          H8: () => p,
          L4: () => f,
          N1: () => o,
          P6: () => y,
          T3: () => s,
          UP: () => l,
          VS: () => i,
          ZN: () => d,
          bh: () => a,
          d4: () => F,
          jv: () => C,
          lT: () => D,
          m0: () => m,
          nr: () => v,
          rB: () => c,
          u$: () => h,
          un: () => g,
        });
        var r = function (e) {
            return null !== navigator.userAgent.match(e);
          },
          u = function () {
            return "MacIntel" === navigator.platform && navigator.maxTouchPoints > 1;
          },
          i = function () {
            return r(/firefox\//i);
          },
          o = function () {
            return r(/iP(hone|od)/i);
          },
          a = function () {
            return r(/iPad/i) || u();
          },
          s = function () {
            return r(/Macintosh/i) && !u();
          },
          c = function () {
            return r(/FBAV/i);
          },
          l = function () {
            return r(/\sEdge?\/\d+/i);
          },
          f = function () {
            return r(/msie/i);
          },
          d = function () {
            return r(/SMART-TV/);
          },
          h = function () {
            return d() && !r(/SamsungBrowser/);
          },
          p = function () {
            return r(/\s(?:(?:Headless)?Chrome|CriOS)\//i) && !l() && !r(/UCBrowser/i);
          },
          D = function () {
            return !r(/\sEdg\/\d+/i) && (l() || r(/trident\/.+rv:\s*11/i) || f());
          },
          v = function () {
            return r(/safari/i) && !r(/(?:Chrome|CriOS|chromium|android|phantom)/i) && !d();
          },
          g = function () {
            return r(/iP(hone|ad|od)/i) || u();
          },
          m = function () {
            return "boolean" == typeof m.mock_ ? m.mock_ : r(/Android/i) && !r(/Windows Phone/i);
          },
          y = function () {
            return (!r(/chrome\/[123456789]/i) || !!r(/chrome\/18/i) || !!i()) && m();
          };
        m.mock_ = null;
        var A = function () {
            return g() || m() || r(/Windows Phone/i);
          },
          F = function () {
            if ("boolean" == typeof F.mock_) return F.mock_;
            try {
              return window.self !== window.top;
            } catch (e) {
              return !0;
            }
          };
        F.mock_ = null;
        var C = function () {
            return !1;
          },
          E = function () {
            return 0;
          };
      },
      1417(e, t, n) {
        "use strict";
        n.d(t, { Xu: () => s, Zh: () => f, fU: () => l, jw: () => c });
        var r = n(4933),
          u = n(2972),
          i = n(8253),
          o = function (e) {
            return function (t) {
              return 0 === t.indexOf(e);
            };
          },
          a = function (e) {
            for (
              var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "en",
                n = (0, r.Z0)(),
                u = Object.keys(e.title),
                i = u[0];
              !e.title[n];
            ) {
              var a = u.find(o(n));
              if (a) {
                n = a;
                break;
              }
              var s = n.lastIndexOf("-");
              if (s <= 0) {
                n = null;
                break;
              }
              n = n.slice(0, s);
            }
            return n ? n : u.indexOf(t) >= 0 ? t : i;
          },
          s = function (e, t) {
            var n = [];
            if (!e || !e.timestamps || !e.timestamps.length) return n;
            var r = e.timestamps.sort(function (e, t) {
              return e.begin - t.begin;
            });
            return (
              r.forEach(function (u, i) {
                var o = a(u, e.defaultLanguage),
                  s = u.title[o],
                  c = u.time,
                  l = u.image,
                  f = t;
                i + 1 < r.length && (f = r[i + 1].time);
                var d = { begin: c, end: f, text: s, cueType: "chapters" };
                (l && (d.image = l), n.push(d));
              }),
              n
            );
          },
          c = function (e, t) {
            var n = (0, r.Z0)(),
              i = e.reduce(function (e, t) {
                if (!t || !t.cueType || "chapters" === t.cueType) {
                  var r = new u.G({ time: t.begin, image: t.image });
                  (r.addTitle(n, t.text), e.push(r));
                }
                return e;
              }, []);
            return t ? ((t.timestamps = i), t) : new u.J(n, i);
          },
          l = function (e, t) {
            if ("number" != typeof e || e < 0 || !t || !t.length) return null;
            for (var n = null, r = 0; r < t.length; r++) {
              var u = t[r];
              u.time > e || ((!n || u.time > n.time) && (n = u));
            }
            return n;
          },
          f = function (e, t) {
            var n = !0;
            return (
              e.forEach(function (e) {
                if (e) {
                  if (!e.defaultLanguage || !e.timestamps) {
                    n = !1;
                    return;
                  }
                  e.timestamps.some(function (e) {
                    return !e.title || null === e.time || void 0 === e.time;
                  }) && (n = !1);
                }
              }),
              t(n ? null : (0, i.ED)(Error(), i.mH))
            );
          };
      },
      7316(e, t, n) {
        "use strict";
        n.d(t, { AH: () => l, iF: () => c, l6: () => g, pc: () => a, pd: () => f });
        var r = n(1642),
          u = n(1659),
          i = n(492),
          o = n.n(i),
          a = o().clear,
          s = function (e) {
            e = e.split("-");
            for (var t = 1; t < e.length; t++) e[t] = e[t].charAt(0).toUpperCase() + e[t].slice(1);
            return e.join("");
          },
          c = function (e, t) {
            if (null != e) {
              void 0 === e.length && (e = [e]);
              var n,
                r,
                i,
                o = {};
              for (i in t) {
                Object.hasOwn(t, i) &&
                  (o[i] =
                    ((n = i),
                    "" === (r = t[i]) || null == r
                      ? ""
                      : "string" == typeof r && isNaN(r)
                        ? /png|gif|jpe?g/i.test(r) && 0 > r.indexOf("url")
                          ? "url(".concat(r, ")")
                          : r
                        : 0 === r || "z-index" === n || "opacity" === n
                          ? "".concat(r)
                          : /color/i.test(n)
                            ? "#".concat((0, u.eV)(r.toString(16).replace(/^0x/i, ""), 6))
                            : "".concat(Math.ceil(r), "px")));
              }
              for (var a = 0; a < e.length; a++) {
                var c = e[a],
                  l = void 0;
                if (null != c)
                  for (i in o)
                    Object.hasOwn(o, i) && ((l = s(i)), c.style[l] !== o[i] && (c.style[l] = o[i]));
              }
            }
          },
          l = function (e, t, n, u) {
            n = n || "all-players";
            var i = "";
            if ((void 0 === t ? "undefined" : (0, r._)(t)) === "object") {
              var a = document.createElement("div");
              c(a, t);
              var s = a.style.cssText;
              (Object.hasOwn(t, "content") &&
                s &&
                (s = "".concat(s, ' content: "').concat(t.content, '";')),
                u && s && (s = s.replace(/;/g, " !important;")),
                (i = "{".concat(s, "}")));
            } else "string" == typeof t && (i = t);
            "" === i || "{}" === i ? o().clear(n, e) : o().style([[e, e + i]], n);
          },
          f = function (e, t) {
            c(e, { transform: t });
          },
          d = {
            A: { L: "F0F8FF", N: "FAEBD7", Q: { $: 2, _: "00FFFF", M: "7FFFD4" }, Z: "F0FFFF" },
            B: {
              E: "F5F5DC",
              I: "FFE4C4",
              L: { A: { C: "000000", N: "FFEBCD" }, U: { $: 1, _: "0000FF", V: "8A2BE2" } },
              R: "A52A2A",
              U: "DEB887",
            },
            C: {
              A: "5F9EA0",
              H: { A: "7FFF00", O: "D2691E" },
              O: { $: 1, A: "FF7F50", N: { F: "6495ED", S: "FFF8DC" } },
              R: "DC143C",
              Y: "00FFFF",
            },
            D: {
              A: {
                $: 2,
                B: "00008B",
                C: "008B8B",
                G: { O: "B8860B", R: { A: "A9A9A9", E: "006400" } },
                K: "BDB76B",
                M: "8B008B",
                O: { L: "556B2F", R: { A: "FF8C00", C: "9932CC" } },
                R: "8B0000",
                S: { A: "E9967A", E: "8FBC8B", L: { $: 3, B: "483D8B", G: "2F4F4F" } },
                T: "00CED1",
                V: "9400D3",
              },
              E: { $: 2, P: "FF1493", S: "00BFFF" },
              I: "696969",
              O: "1E90FF",
            },
            F: { I: "B22222", L: "FDF5E6", O: "228B22", U: "FF00FF" },
            G: {
              A: "DCDCDC",
              H: "F8F8FF",
              O: { $: 2, _: "FFD700", E: "DAA520" },
              R: { A: "808080", E: { $: 2, _: "008000", Y: "ADFF2F" } },
            },
            H: { $: 1, N: "F0FFF0", T: "FF69B4" },
            I: { N: { $: 2, A: "CD5C5C", G: "4B0082" }, V: "FFFFF0" },
            K: "F0E68C",
            L: {
              A: { V: { $: 5, _: "E6E6FA", B: "FFF0F5" }, W: "7CFC00" },
              E: "FFFACD",
              I: {
                G: {
                  $: 2,
                  B: "ADD8E6",
                  C: { O: "F08080", Y: "E0FFFF" },
                  G: { O: "FAFAD2", R: { A: "D3D3D3", E: "90EE90" } },
                  P: "FFB6C1",
                  S: { A: "FFA07A", E: "20B2AA", K: "87CEFA", L: "778899", T: "B0C4DE" },
                  Y: "FFFFE0",
                },
                M: { $: 1, _: "00FF00", G: "32CD32" },
                N: "FAF0E6",
              },
            },
            M: {
              A: { G: "FF00FF", R: "800000" },
              E: {
                $: 4,
                A: "66CDAA",
                B: "0000CD",
                O: "BA55D3",
                P: "9370DB",
                S: { E: "3CB371", L: "7B68EE", P: "00FA9A" },
                T: "48D1CC",
                V: "C71585",
              },
              I: { D: "191970", N: "F5FFFA", S: "FFE4E1" },
              O: "FFE4B5",
            },
            N: { $: 2, A: "FFDEAD", Y: "00008B" },
            O: {
              L: { D: "FDF5E6", I: { $: 2, _: "808000", D: "6B8E23" } },
              R: { A: { $: 3, _: "FFA500", R: "FF4500" }, C: "DA70D6" },
            },
            P: {
              A: {
                L: { $: 1, G: { O: "EEE8AA", R: "98FB98" }, T: "AFEEEE", V: "DB7093" },
                P: "FFEFD5",
              },
              E: { A: "FFDAB9", R: "CD853F" },
              I: "FFC0CB",
              L: "DDA0DD",
              O: "B0E0E6",
              U: "800080",
            },
            R: { E: { B: "663399", D: "FF0000" }, O: { S: "BC8F8F", Y: "4169E1" } },
            S: {
              A: { D: "8B4513", L: "FA8072", N: "F4A460" },
              E: { $: 1, G: "2E8B57", S: "FFF5EE" },
              I: { E: "A0522D", L: "C0C0C0" },
              K: "87CEEB",
              L: { $: 3, B: "6A5ACD", G: "708090" },
              N: "FFFAFA",
              P: "00FF7F",
              T: "4682B4",
            },
            T: { A: "D2B48C", E: "008080", H: "D8BFD8", O: "FF6347", U: "40E0D0" },
            V: "EE82EE",
            W: { $: 1, E: "F5DEB3", I: { $: 2, _: "FFFFFF", S: "F5F5F5" } },
            Y: { $: 5, _: "FFFF00", G: "9ACD32" },
          },
          h = function (e) {
            for (var t = 0, n = d; n && t < e.length && ((n = n[e[t]]), t++, n); ) {
              if ("string" == typeof n) return n;
              if ((n.$ && (t += n.$), t === e.length && n._)) return n._;
            }
            return null;
          },
          p = function (e) {
            return parseInt(e, 16);
          },
          D = function (e, t) {
            return ""
              .concat(e, "(")
              .concat(t[0], ", ")
              .concat(t[1], ", ")
              .concat(t[2], ", ")
              .concat(t[3], ")");
          },
          v = [
            {
              name: "extended hash-hex",
              test: /^#?[0-9a-f]{8}$/i,
              extract: /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i,
              map: p,
              alpha: !0,
            },
            {
              name: "standard hash-hex",
              test: /^#?[0-9a-f]{6}$/i,
              extract: /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i,
              map: p,
            },
            {
              name: "short hash-hex",
              test: /^#?[0-9a-f]{3}$/i,
              extract: /^#?([0-9a-f])([0-9a-f])([0-9a-f])/i,
              map: function (e) {
                return 17 * parseInt(e, 16);
              },
            },
          ],
          g = function (e, t) {
            var n,
              r = arguments.length > 2 && void 0 !== arguments[2] && arguments[2];
            e = "string" == typeof e ? e.trim() : "#000000";
            var u = "rgba",
              i = ["0", "0", "0", "1"],
              o = (t = "number" == typeof t ? t : 100) / 100;
            if (/^\w+\(/i.test(e))
              return (
                (u = /^(\w+)\(/i.exec(e)[1]),
                (i = /^\w+\(([^),]+),\s*([^,)]+),\s*([^,)]+),?\s*([^),]*)\)/i.exec(e).slice(1)),
                3 === u.length && (u += "a"),
                r && i[3].length ? (i[3] *= o) : (i[3] = o),
                D(u, i)
              );
            e = null != (n = h((e = e.toUpperCase().replace("GREY", "GRAY")))) ? n : e;
            for (var a = 0; a < v.length; a++) {
              var s = v[a];
              if (s.test.test(e)) {
                ((i = s.extract.exec(e).slice(1).map(s.map)),
                  r && s.alpha ? (i[3] = (i[3] / 255) * o) : (i[3] = o));
                break;
              }
            }
            return D(u, i);
          };
      },
      3297(e, t, n) {
        "use strict";
        n.d(t, { t: () => r });
        var r =
          Date.now ||
          function () {
            return new Date().getTime();
          };
      },
      5291(e, t, n) {
        "use strict";
        n.d(t, {
          Bq: () => w,
          CS: () => B,
          Cm: () => x,
          Fe: () => S,
          Ie: () => k,
          MY: () => c,
          O: () => _,
          QT: () => v,
          Qb: () => I,
          Ti: () => j,
          Vv: () => f,
          _3: () => P,
          _D: () => g,
          eF: () => O,
          i3: () => p,
          iQ: () => F,
          n: () => h,
          nB: () => a,
          n_: () => d,
          p1: () => b,
          pP: () => A,
          rL: () => E,
          vy: () => C,
        });
        var r = n(1659),
          u = n(9555),
          i = n(9055),
          o = n(2194),
          a = function (e, t) {
            return e.classList.contains(t);
          },
          s = function (e) {
            var t,
              n = document.createElement("div");
            return ((n.innerHTML = null == e || null == (t = e.trim) ? void 0 : t.call(e)), n);
          },
          c = function (e) {
            for (var t = e.querySelectorAll("script,object,iframe,meta"), n = t.length; n--; ) {
              var r = t[n];
              r.parentNode.removeChild(r);
            }
            return e;
          },
          l =
            /^((((https?):\/\/)|(mailto:))(%[0-9A-Fa-f]{2}|[-()_.!~*';/?:@&=+$,A-Za-z0-9])+)([).!';/?:,][[:blank:|:blank:]])?$/,
          f = function (e) {
            for (var t = e.attributes, n = t.length; n--; ) {
              var r = t[n].name,
                u = t[n].value;
              (/^\s*(javascript(:|&colon;))/.test(u) &&
                (e.removeAttribute(r),
                o.A.logger.warn("jwplayer/utils/dom: Invalid or unsafe URL")),
                /^on/.test(r) && e.removeAttribute(r));
            }
            return e;
          },
          d = function (e) {
            var t = s(e);
            c(t);
            for (var n = t.querySelectorAll("*"), r = n.length; r--; ) f(n[r]);
            return t;
          },
          h = function (e) {
            return d(e).firstChild;
          },
          p = function (e) {
            for (; e.firstChild; ) e.removeChild(e.firstChild);
          },
          D = function (e, t) {
            if (t)
              for (var n = d(t).childNodes, r = 0; r < n.length; r++)
                e.appendChild(n[r].cloneNode(!0));
          },
          v = function (e, t) {
            (p(e), D(e, t));
          },
          g = function (e) {
            return e + (e.toString().indexOf("%") > 0 ? "" : "px");
          },
          m = function (e) {
            return (0, u.Kg)(e.className) ? e.className.split(" ") : [];
          },
          y = function (e, t) {
            ((t = (0, r.Bq)(t)), e.className !== t && (e.className = t));
          },
          A = function (e) {
            return e.classList ? e.classList : m(e);
          },
          F = function (e, t) {
            var n = m(e);
            ((Array.isArray(t) ? t : t.split(" ")).forEach(function (e) {
              (0, u.gR)(n, e) || n.push(e);
            }),
              y(e, n.join(" ")));
          },
          C = function (e, t) {
            var n = m(e),
              r = Array.isArray(t) ? t : t.split(" ");
            y(e, (0, u.iv)(n, r).join(" "));
          },
          E = function (e, t, n) {
            var r = e.className || "";
            (t.test(r) ? (r = r.replace(t, n)) : n && (r += " ".concat(n)), y(e, r));
          },
          b = function (e, t, n) {
            var r = a(e, t);
            (n = (0, u.Lm)(n) ? n : !r) !== r && (n ? F(e, t) : C(e, t));
          },
          w = function (e, t, n) {
            e.setAttribute(t, n);
          },
          B = function (e) {
            var t = document.createElement("link");
            ((t.rel = "stylesheet"),
              (t.href = e),
              document.getElementsByTagName("head")[0].appendChild(t));
          },
          k = function (e) {
            e && p(e);
          },
          _ = function (e) {
            var t = { left: 0, right: 0, width: 0, height: 0, top: 0, bottom: 0 };
            if (!e || !document.body.contains(e)) return t;
            var n = e.getBoundingClientRect(),
              r = window.pageYOffset,
              u = window.pageXOffset;
            return (
              (n.width || n.height || n.left || n.top) &&
                ((t.left = n.left + u),
                (t.right = n.right + u),
                (t.top = n.top + r),
                (t.bottom = n.bottom + r),
                (t.width = n.right - n.left),
                (t.height = n.bottom - n.top)),
              t
            );
          },
          j = function (e, t) {
            e.insertBefore(t, e.firstChild);
          },
          P = function (e) {
            return e.nextElementSibling;
          },
          O = function (e) {
            return e.previousElementSibling;
          },
          S = function (e, t) {
            var n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {},
              r = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : document;
            if (l.test(e)) {
              var u = r.createElement("a");
              ((u.href = e),
                (u.target = t),
                (u = f(Object.assign(u, n))),
                i.Browser.firefox
                  ? u.dispatchEvent(
                      new MouseEvent("click", { bubbles: !0, cancelable: !0, view: window }),
                    )
                  : u.click());
            }
          },
          x = function () {
            var e = window.screen.orientation;
            return (
              (!!e && ("landscape-primary" === e.type || "landscape-secondary" === e.type)) ||
              90 === window.orientation ||
              -90 === window.orientation
            );
          },
          T = function (e) {
            var t = document.createElement("textarea");
            return ((t.innerHTML = e), t.value);
          },
          I = function (e) {
            return T(e)
              .replace(/&|<|>|"|''/gm, function (e) {
                return "&#".concat(e.charCodeAt(0), ";");
              })
              .replace(/&#60;(\/?)(b|strong|i|em|p|br|ul|ol|li|h.)&#62;/gim, "<$1$2>");
          };
      },
      5293(e, t, n) {
        "use strict";
        n.d(t, { A: () => d });
        var r = "free",
          u = "starter",
          i = "business",
          o = "premium",
          a = "enterprise",
          s = "developer",
          c = "platinum",
          l = "unlimited",
          f = "trial";
        function d(e) {
          var t = {
            setup: [r, u, i, o, a, s, "ads", l, f, c],
            drm: [a, s, "ads", l, f],
            ads: ["ads", l, f, c, a, s, i],
            jwpsrv: [r, u, i, o, a, s, "ads", f, c, "invalid"],
            discovery: ["ads", a, s, f, l],
          };
          return function (n) {
            return t[n] && t[n].indexOf(e) > -1;
          };
        }
      },
      2194(e, t, n) {
        "use strict";
        n.d(t, { A: () => y });
        var r = n(5483),
          u = n(2235),
          i = n(4794),
          o = n(1659),
          a = n(7203),
          s = n(9220),
          c = function (e, t) {
            ((this.name = e), (this.message = t.message || t.toString()), (this.error = t));
          },
          l = n(9555),
          f = n(2669),
          d = n(5291),
          h = n(7316),
          p = n(493),
          D = n(3915),
          v = "function" == typeof console.log ? console.log.bind(console) : function () {},
          g = n(8562),
          m = new (n(5637).A)("helpers");
        let y = Object.assign({}, i, u, r, {
          logger: m,
          addClass: d.iQ,
          hasClass: d.nB,
          removeClass: d.vy,
          replaceClass: d.rL,
          toggleClass: d.p1,
          classList: d.pP,
          styleDimension: d._D,
          createElement: d.n,
          emptyElement: d.i3,
          addStyleSheet: d.CS,
          bounds: d.O,
          openLink: d.Fe,
          replaceInnerHtml: d.QT,
          css: h.AH,
          clearCss: h.pc,
          style: h.iF,
          transform: h.pd,
          getRgba: h.l6,
          ajax: p.R,
          crossdomain: function (e) {
            var t = window.URL;
            try {
              var n = new t(e, location.origin);
              return (
                "".concat(location.protocol, "//").concat(location.host) !==
                "".concat(n.protocol, "//").concat(n.host)
              );
            } catch (e) {
              m.debug(e);
            }
            return !0;
          },
          tryCatch: function (e, t) {
            var n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : [];
            if (s.A.debug) return e.apply(t || this, n);
            try {
              return e.apply(t || this, n);
            } catch (t) {
              return new c(e.name, t);
            }
          },
          Error: c,
          Timer: a.A,
          log: v,
          genId: g.a,
          between: D.T,
          foreach: function (e, t) {
            for (var n in e) Object.hasOwn(e, n) && t(n, e[n]);
          },
          flashVersion: f.$w,
          isIframe: f.d4,
          indexOf: l.qh,
          trim: o.Bq,
          pad: o.eV,
          extension: o.ck,
          hms: o.jY,
          seconds: o.YA,
          prefix: o.Pl,
          suffix: o.ei,
          noop: function () {},
        });
      },
      2078(e, t, n) {
        "use strict";
        n.d(t, { c: () => r });
        var r = function (e) {
          return (
            !!(e = e || window.event) &&
            !!e &&
            /^(?:mouse|pointer|touch|gesture|click|key)/.test(e.type)
          );
        };
      },
      5637(e, t, n) {
        "use strict";
        n.d(t, { A: () => h });
        var r = n(494),
          u = n(9407),
          i = n(467),
          o = n(478),
          a = n(1642),
          s = n(1219),
          c = { debug: 0, info: 100, warn: 200, error: 400 },
          l = function (e) {
            if (null === e) return "null";
            var t = "";
            try {
              t += s.stringify(e, null, "  ");
            } catch (e) {
              t += "{error stringifying value}";
            }
            return t;
          },
          f = function (e) {
            switch (void 0 === e ? "undefined" : (0, a._)(e)) {
              case "object":
                return l(e);
              case "undefined":
                return "undefined";
              default:
                var t, n;
                return null != (t = null == (n = e.toString) ? void 0 : n.call(e))
                  ? t
                  : "{error stringifying value}";
            }
          },
          d = (function () {
            function e(t) {
              var n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : c;
              ((0, r._)(this, e),
                (0, i._)(this, "_namespace", void 0),
                (0, i._)(this, "_levels", void 0),
                (this._namespace = t),
                (this._levels = n));
            }
            return (
              (0, u._)(e, [
                {
                  key: "child",
                  value: function (t) {
                    return new e("".concat(this._namespace, "/").concat(t), this._levels);
                  },
                },
                {
                  key: "_log",
                  value: function (t, n) {
                    for (
                      var r, u = arguments.length, i = Array(u > 2 ? u - 2 : 0), a = 2;
                      a < u;
                      a++
                    )
                      i[a - 2] = arguments[a];
                    try {
                      (t >= e.LOG_LEVEL &&
                        (r = console)[n].apply(
                          r,
                          ["[".concat(this._namespace, "]:")].concat((0, o._)(i)),
                        ),
                        e.LOG_HISTORY.length >= e.MAX_LOG_HISTORY && e.LOG_HISTORY.shift(),
                        e.LOG_HISTORY.push([
                          new Date(),
                          n.toUpperCase(),
                          this._namespace,
                          i.map(f).join("\n"),
                        ]));
                    } catch (e) {
                      console.error(e);
                    }
                  },
                },
                {
                  key: "trace",
                  value: function () {
                    for (var e = arguments.length, t = Array(e), n = 0; n < e; n++)
                      t[n] = arguments[n];
                    this._log.apply(this, [this._levels.debug, "trace"].concat((0, o._)(t)));
                  },
                },
                {
                  key: "debug",
                  value: function () {
                    for (var e = arguments.length, t = Array(e), n = 0; n < e; n++)
                      t[n] = arguments[n];
                    this._log.apply(this, [this._levels.debug, "debug"].concat((0, o._)(t)));
                  },
                },
                {
                  key: "log",
                  value: function () {
                    for (var e = arguments.length, t = Array(e), n = 0; n < e; n++)
                      t[n] = arguments[n];
                    this._log.apply(this, [this._levels.info, "log"].concat((0, o._)(t)));
                  },
                },
                {
                  key: "info",
                  value: function () {
                    for (var e = arguments.length, t = Array(e), n = 0; n < e; n++)
                      t[n] = arguments[n];
                    this._log.apply(this, [this._levels.info, "info"].concat((0, o._)(t)));
                  },
                },
                {
                  key: "warn",
                  value: function () {
                    for (var e = arguments.length, t = Array(e), n = 0; n < e; n++)
                      t[n] = arguments[n];
                    this._log.apply(this, [this._levels.warn, "warn"].concat((0, o._)(t)));
                  },
                },
                {
                  key: "error",
                  value: function () {
                    for (var e = arguments.length, t = Array(e), n = 0; n < e; n++)
                      t[n] = arguments[n];
                    this._log.apply(this, [this._levels.error, "error"].concat((0, o._)(t)));
                  },
                },
                {
                  key: "history",
                  get: function () {
                    return (0, o._)(e.LOG_HISTORY);
                  },
                },
              ]),
              e
            );
          })();
        ((0, i._)(d, "LOG_LEVEL", 400),
          (0, i._)(d, "MAX_LOG_HISTORY", 200),
          (0, i._)(d, "LOG_HISTORY", []));
        let h = d;
      },
      4933(e, t, n) {
        "use strict";
        n.d(t, {
          EA: () => B,
          J3: () => F,
          Pj: () => b,
          Pv: () => A,
          QC: () => v,
          Z0: () => m,
          lz: () => p,
          mR: () => _,
          p9: () => D,
          pP: () => w,
        });
        var r = n(9555),
          u = n(2669),
          i = n(493),
          o = n(2235),
          a = n(9765),
          s = n(2194).A.logger,
          c = {},
          l = {
            aa: "Afar",
            ab: "Abkhazian",
            ae: "Avestan",
            af: "Afrikaans",
            ak: "Akan",
            am: "Amharic",
            ar: "Arabic",
            an: "Aragonese",
            as: "Assamese",
            av: "Avaric",
            ay: "Aymara",
            az: "Azerbaijani",
            ba: "Bashkir",
            be: "Belarusian",
            bg: "Bulgarian",
            bh: "Bihari languages",
            bi: "Bislama",
            bm: "Bambara",
            bn: "Bengali",
            bo: "Tibetan",
            br: "Breton",
            bs: "Bosnian",
            ca: "Catalan",
            ce: "Chechen",
            ch: "Chamorro",
            co: "Corsican",
            cr: "Cree",
            cs: "Czech",
            cu: "Church Slavic",
            cv: "Chuvash",
            cy: "Welsh",
            da: "Danish",
            de: "German",
            dv: "Divehi",
            dz: "Dzongkha",
            ee: "Ewe",
            el: "Greek",
            en: "English",
            eo: "Esperanto",
            es: "Spanish",
            et: "Estonian",
            eu: "Basque",
            fa: "Persian",
            ff: "Fulah",
            fi: "Finnish",
            fj: "Fijian",
            fo: "Faroese",
            fr: "French",
            fy: "Western Frisian",
            ga: "Irish",
            gd: "Gaelic",
            gl: "Galician",
            gn: "Guarani",
            gu: "Gujarati",
            gv: "Manx",
            ha: "Hausa",
            he: "Hebrew",
            hi: "Hindi",
            ho: "Hiri Motu",
            hr: "Croatian",
            ht: "Haitian",
            hu: "Hungarian",
            hy: "Armenian",
            hz: "Herero",
            ia: "Interlingua",
            id: "Indonesian",
            ie: "Interlingue",
            ig: "Igbo",
            ii: "Sichuan Yi",
            ik: "Inupiaq",
            io: "Ido",
            is: "Icelandic",
            it: "Italian",
            iu: "Inuktitut",
            ja: "Japanese",
            jv: "Javanese",
            ka: "Georgian",
            kg: "Kongo",
            ki: "Kikuyu",
            kj: "Kuanyama",
            kk: "Kazakh",
            kl: "Kalaallisut",
            km: "Central Khmer",
            kn: "Kannada",
            ko: "Korean",
            kr: "Kanuri",
            ks: "Kashmiri",
            ku: "Kurdish",
            kv: "Komi",
            kw: "Cornish",
            ky: "Kirghiz",
            la: "Latin",
            lb: "Luxembourgish",
            lg: "Ganda",
            li: "Limburgan",
            lo: "Lao",
            ln: "Lingala",
            lt: "Lithuanian",
            lu: "Luba-Katanga",
            lv: "Latvian",
            mg: "Malagasy",
            mh: "Marshallese",
            mi: "Maori",
            mk: "Macedonian",
            ml: "Malayalam",
            mn: "Mongolian",
            mr: "Marathi",
            ms: "Malay",
            mt: "Maltese",
            my: "Burmese",
            na: "Nauru",
            nb: "Bokm\xe5l",
            nd: "Ndebele",
            ne: "Nepali",
            ng: "Ndonga",
            nl: "Dutch",
            nn: "Norwegian Nynorsk",
            no: "Norwegian",
            nr: "Ndebele",
            nv: "Navajo",
            ny: "Chichewa",
            oc: "Occitan",
            oj: "Ojibwa",
            om: "Oromo",
            or: "Oriya",
            os: "Ossetian",
            pa: "Panjabi",
            pi: "Pali",
            pl: "Polish",
            pt: "Portuguese",
            ps: "Pushto",
            qu: "Quechua",
            rm: "Romansh",
            rn: "Rundi",
            ro: "Romanian",
            ru: "Russian",
            rw: "Kinyarwanda",
            sa: "Sanskrit",
            sc: "Sardinian",
            sd: "Sindhi",
            se: "Northern Sami",
            sg: "Sango",
            si: "Sinhala",
            sk: "Slovak",
            sl: "Slovenian",
            sm: "Samoan",
            sn: "Shona",
            so: "Somali",
            sq: "Albanian",
            sr: "Serbian",
            ss: "Swati",
            st: "Sotho",
            su: "Sundanese",
            sw: "Swahili",
            sv: "Swedish",
            ta: "Tamil",
            te: "Telugu",
            tg: "Tajik",
            th: "Thai",
            ti: "Tigrinya",
            tk: "Turkmen",
            tl: "Tagalog",
            tn: "Tswana",
            to: "Tonga",
            tr: "Turkish",
            ts: "Tsonga",
            tt: "Tatar",
            tw: "Twi",
            ty: "Tahitian",
            ug: "Uighur",
            uk: "Ukrainian",
            ur: "Urdu",
            uz: "Uzbek",
            ve: "Venda",
            vi: "Vietnamese",
            vo: "Volap\xfck",
            wa: "Walloon",
            wo: "Wolof",
            xh: "Xhosa",
            yi: "Yiddish",
            yo: "Yoruba",
            za: "Zhuang",
            zh: "Chinese",
            "zh-tw": "Traditional Chinese",
            zu: "Zulu",
          },
          f = (0, r.B8)(l),
          d = function (e) {
            return e.toLowerCase().replace("-", "_");
          },
          h = function (e) {
            if (l[(e = e.toLowerCase())]) return e;
            var t = d(e).lastIndexOf("_");
            return -1 === t ? e : h(e.substring(0, t));
          },
          p = function (e) {
            return e
              ? Object.keys(e).reduce(function (t, n) {
                  return ((t[d(n)] = e[n]), t);
                }, {})
              : {};
          },
          D = function (e) {
            if (e) return 3 === e.length ? e : l[h(e)] || e;
          },
          v = function (e) {
            return f[e] || "";
          },
          g = function (e) {
            var t = e.querySelector("html");
            return t ? t.getAttribute("lang") : null;
          },
          m = function () {
            if ("string" == typeof m.mock_) return m.mock_;
            var e = g(document);
            if (!e && (0, u.d4)())
              try {
                e = g(window.top.document);
              } catch (e) {
                s.child("jwplayer/utils/language").debug(e);
              }
            return e || navigator.language || "en";
          };
        m.mock_ = null;
        var y = [
            "ar",
            "da",
            "de",
            "el",
            "es",
            "fi",
            "fr",
            "he",
            "id",
            "it",
            "ja",
            "ko",
            "nb",
            "nl",
            "nn",
            "no",
            "oc",
            "pt",
            "ro",
            "ru",
            "sl",
            "sv",
            "th",
            "tr",
            "vi",
            "zh-tw",
            "zh",
          ],
          A = function (e) {
            return 8207 === e.charCodeAt(0) || /^[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(e);
          },
          F = function (e) {
            return "boolean" == typeof F.mock_ ? F.mock_ : y.indexOf(h(e)) >= 0;
          };
        F.mock_ = null;
        var C = function (e, t, n) {
            var r = e[n] || t[n];
            r && (e[n] = r);
          },
          E = function (e) {
            var t = e.advertising,
              n = e.related,
              r = e.sharing,
              u = e.abouttext,
              i = Object.assign({}, e.localization);
            (t &&
              ((i.advertising = i.advertising || {}),
              C(i.advertising, t, "admessage"),
              C(i.advertising, t, "cuetext"),
              C(i.advertising, t, "loadingAd"),
              C(i.advertising, t, "podmessage"),
              C(i.advertising, t, "skipmessage"),
              C(i.advertising, t, "skiptext")),
              "string" == typeof i.related
                ? (i.related = { heading: i.related })
                : (i.related = i.related || {}),
              n && C(i.related, n, "autoplaymessage"),
              r &&
                ((i.sharing = i.sharing || {}),
                C(i.sharing, r, "heading"),
                C(i.sharing, r, "copied")),
              u && C(i, e, "abouttext"));
            var o = i.close || i.nextUpClose;
            return (o && (i.close = o), i);
          },
          b = function (e, t, n) {
            return Object.assign({}, E(e), t[h(n)], t[d(n)]);
          },
          w = function (e) {
            return "boolean" == typeof w.mock_
              ? w.mock_
              : (0, o.isDeepKeyCompliant)(a.A, e, function (e, t) {
                  return "string" == typeof t[e];
                });
          };
        w.mock_ = null;
        var B = function (e, t) {
          if ("function" == typeof B.mock_) return B.mock_();
          var n = c[t];
          if (!n) {
            var r,
              u = ""
                .concat(e, "translations/")
                .concat(((r = h(t)), /^n[bn]$/.test(r) ? "no" : r), ".json");
            c[t] = n = new Promise(function (e, n) {
              (0, i.R)({
                url: u,
                oncomplete: e,
                onerror: function (e, r, u, i) {
                  ((c[t] = null), n(i));
                },
                responseType: "json",
              });
            });
          }
          return n;
        };
        B.mock_ = null;
        var k = function (e, t, n, r) {
            e[t] = Object.assign({}, a.A[t], n[t], r[t]);
          },
          _ = function (e, t) {
            var n = Object.assign({}, a.A, e, t);
            return (
              k(n, "errors", e, t),
              k(n, "related", e, t),
              k(n, "sharing", e, t),
              k(n, "advertising", e, t),
              k(n, "shortcuts", e, t),
              k(n, "captionsStyles", e, t),
              n
            );
          };
      },
      3915(e, t, n) {
        "use strict";
        n.d(t, { T: () => r });
        var r = function (e, t, n) {
          return Math.max(Math.min(e, n), t);
        };
      },
      4794(e, t, n) {
        "use strict";
        (n.r(t),
          n.d(t, {
            getAbsolutePath: () => o,
            isAbsolutePath: () => i,
            parseDimension: () => c,
            parseXML: () => a,
            serialize: () => s,
            timeFormat: () => l,
            timeFormatAria: () => f,
          }));
        var r = n(9555),
          u = n(8586),
          i = function (e) {
            return /^(?:(?:https?|file):)?\/\//.test(e);
          },
          o = function (e, t) {
            return (0, u.LH)(e, t);
          },
          a = function (e) {
            var t = null;
            try {
              (t = new window.DOMParser().parseFromString(e, "text/xml")).querySelector(
                "parsererror",
              ) && (t = null);
            } catch (e) {}
            return t;
          },
          s = function (e) {
            if (void 0 === e) return null;
            if ("string" == typeof e && e.length < 6) {
              var t = e.toLowerCase();
              if ("true" === t) return !0;
              if ("false" === t) return !1;
              if (!(0, r.yr)(Number(e)) && !(0, r.yr)(parseFloat(e))) return Number(e);
            }
            return e;
          },
          c = function (e) {
            return (0, r.gf)(e)
              ? e
              : "" === e
                ? 0
                : e.lastIndexOf("%") > -1
                  ? e
                  : parseInt(e.replace("px", ""), 10);
          },
          l = function (e, t) {
            if (
              ((0, r.yr)(e) && (e = parseInt(e.toString(), 10)),
              (0, r.yr)(e) || !isFinite(e) || (e <= 0 && !t))
            )
              return "00:00";
            var n = e < 0 ? "-" : "",
              u = Math.floor((e = Math.abs(e)) / 3600),
              i = Math.floor((e - 3600 * u) / 60),
              o = Math.floor(e % 60);
            return ""
              .concat(n + (u ? "".concat(u, ":") : "") + (i < 10 ? "0" : "") + i, ":")
              .concat(o < 10 ? "0" : "")
              .concat(o);
          },
          f = function (e) {
            if (
              ((0, r.yr)(e) && (e = parseInt(e.toString(), 10)),
              (0, r.yr)(e) || !isFinite(e) || e <= 0)
            )
              return "0 seconds";
            var t = Math.floor(e / 3600),
              n = Math.floor((e - 3600 * t) / 60),
              u = Math.floor(e % 60);
            return (
              (t ? t + (t >= 1 ? " hour".concat((t > 1 && "s") || "", ", ") : "") : "") +
              (n ? n + (n >= 1 ? " minute".concat((n > 1 && "s") || "", ", ") : "") : "") +
              u +
              (u >= 1 ? " second".concat((u > 1 && "s") || "") : "")
            );
          };
      },
      5483(e, t, n) {
        "use strict";
        (n.r(t),
          n.d(t, {
            getScriptPath: () => i,
            loadFrom: () => s,
            repo: () => o,
            versionCheck: () => a,
          }));
        var r = n(4403),
          u = n(2235);
        document.currentScript;
        var i = function (e) {
            for (var t = document.getElementsByTagName("script"), n = 0; n < t.length; n++) {
              var r = t[n].src;
              if (r) {
                var u = r.lastIndexOf("/".concat(e));
                if (u >= 0) return r.substr(0, u + 1);
              }
            }
            return "";
          },
          o = function () {
            var e = "//ssl.p.jwpcdn.com/player/v/8.41.1",
              t = e && (0, u.isFileProtocol)() ? "https:" : "";
            return "".concat(t).concat(e);
          },
          a = function (e) {
            var t = "0".concat(e).split(/\W/),
              n = r.r.split(/\W/),
              u = parseFloat(t[0]),
              i = parseFloat(n[0]);
            return !(u > i) && !(u === i && parseFloat("0".concat(t[1])) > parseFloat(n[1]));
          },
          s = function () {
            return o();
          };
      },
      8562(e, t, n) {
        "use strict";
        n.d(t, { I: () => u, a: () => o });
        var r = n(2194),
          u = 12,
          i = function () {
            try {
              var e = window.crypto || window.msCrypto;
              if (null == e ? void 0 : e.getRandomValues)
                return e.getRandomValues(new Uint32Array(1))[0].toString(36);
            } catch (e) {
              r.A.logger.debug("jwplayer/utils/random-id-generator: ", e);
            }
            return Math.random().toString(36).slice(2, 9);
          },
          o = function (e) {
            for (var t = ""; t.length < e; ) t += i();
            return t.slice(0, e);
          };
      },
      6147(e, t, n) {
        "use strict";
        n.d(t, { u: () => u, x: () => r });
        var r =
            window.requestAnimationFrame ||
            function (e) {
              return setTimeout(e, 17);
            },
          u = window.cancelAnimationFrame || clearTimeout;
      },
      1535(e, t, n) {
        "use strict";
        n.d(t, { Ay: () => c });
        var r = n(5001),
          u = n(1860),
          i = {},
          o = function (e) {
            var t = document.createElement("link");
            return ((t.type = "text/css"), (t.rel = "stylesheet"), (t.href = e), t);
          },
          a = function (e, t) {
            var n = document.createElement("script");
            return (
              (n.type = "text/javascript"),
              (n.charset = "utf-8"),
              (n.async = !0),
              (n.timeout = t || 45e3),
              (n.src = e),
              n
            );
          },
          s = function (e, t, n) {
            var r = this,
              s = 0,
              c = function (e) {
                ((s = 2), r.trigger(u.ff, e).off());
              },
              l = function (e) {
                ((s = 3), r.trigger(u.oF, e).off());
              };
            ((this.getStatus = function () {
              return s;
            }),
              (this.load = function () {
                var r = i[e];
                return (
                  0 !== s ||
                    (r && r.then(l).catch(c),
                    (s = 1),
                    (r = new Promise(function (r, u) {
                      var i,
                        s = (t ? o : a)(e, n),
                        f = function () {
                          ((s.onerror = s.onload = null), clearTimeout(i));
                        },
                        d = function (e) {
                          (f(), c(e), u(e));
                        };
                      ((i = setTimeout(function () {
                        d(Error("Network timeout ".concat(e)));
                      }, 45e3)),
                        (s.onerror = function () {
                          d(Error("Failed to load ".concat(e)));
                        }),
                        (s.onload = function (e) {
                          (f(), l(e), r(e));
                        }));
                      var h = document.getElementsByTagName("head")[0] || document.documentElement;
                      h.insertBefore(s, h.firstChild);
                    })),
                    (i[e] = r)),
                  r
                );
              }));
          };
        Object.assign(s.prototype, r.Ay);
        let c = s;
      },
      1659(e, t, n) {
        "use strict";
        n.d(t, {
          Bq: () => i,
          IE: () => a,
          K4: () => f,
          Pl: () => d,
          YA: () => l,
          ck: () => s,
          eV: () => o,
          ei: () => h,
          fp: () => p,
          jY: () => c,
        });
        var r = n(9555),
          u = window.parseFloat,
          i = function (e) {
            return e.replace(/^\s+|\s+$/g, "");
          },
          o = function (e, t, n) {
            for (e = "".concat(e), n = n || "0"; e.length < t; ) e = n + e;
            return e;
          },
          a = function (e, t) {
            for (var n = e.attributes, r = 0; r < n.length; r++)
              if (n[r].name && n[r].name.toLowerCase() === t.toLowerCase())
                return n[r].value.toString();
            return "";
          },
          s = function (e) {
            if (!e || "rtmp" === e.substr(0, 4)) return "";
            var t = /[(,]format=(m3u8|mpd)-/i.exec(e);
            if (t) return t[1];
            var n = e.replace(/^.+?\.(\w+)(?:[;].*)?(?:[?#].*)?$/, "$1");
            return n !== e
              ? n.toLowerCase()
              : (e = e.split("?")[0].split("#")[0]).lastIndexOf(".") > -1
                ? e.substr(e.lastIndexOf(".") + 1, e.length).toLowerCase()
                : "";
          },
          c = function (e) {
            return ""
              .concat(o(((e / 3600) | 0).toString(), 2), ":")
              .concat(o((((e / 60) | 0) % 60).toString(), 2), ":")
              .concat(o((e % 60).toFixed(3), 6));
          },
          l = function (e, t) {
            if (!e) return 0;
            if ((0, r.gf)(e)) return e;
            var n = e.replace(",", "."),
              i = n.slice(-1),
              o = n.split(":"),
              a = o.length,
              s = 0;
            if ("s" === i) s = u(n);
            else if ("m" === i) s = 60 * u(n);
            else if ("h" === i) s = 3600 * u(n);
            else if (a > 1) {
              var c = a - 1;
              (4 === a && (t && (s = u(o[c]) / t), (c -= 1)),
                (s += u(o[c])),
                (s += 60 * u(o[c - 1])),
                a >= 3 && (s += 3600 * u(o[c - 2])));
            } else s = u(n);
            return (0, r.gf)(s) ? s : 0;
          },
          f = function (e, t, n) {
            if ((0, r.Kg)(e) && "%" === e.slice(-1)) {
              var i = u(e);
              return t && (0, r.gf)(t) && (0, r.gf)(i) ? (t * i) / 100 : null;
            }
            return l(e, n);
          },
          d = function (e, t) {
            return e.map(function (e) {
              return t + e;
            });
          },
          h = function (e, t) {
            return e.map(function (e) {
              return e + t;
            });
          },
          p = function (e) {
            return !!e && (0, r.Kg)(e) && "%" === e.slice(-1);
          };
      },
      2885(e, t, n) {
        "use strict";
        n.d(t, { Ay: () => $, nO: () => x, vj: () => j });
        var r,
          u,
          i = n(4880),
          o = n(494),
          a = n(9407),
          s = n(464),
          c = n(3239),
          l = n(884),
          f = n(1642),
          d = n(9055),
          h = n(1860),
          p = n(5001),
          D = n(3297),
          v = n(5291),
          g = "ontouchstart" in window,
          m = "PointerEvent" in window && !d.OS.android,
          y = !m && !(g && d.OS.mobile),
          A = "window",
          F = "init",
          C = "select",
          E = "keydown",
          b = d.Features.passiveEvents,
          w = !!b && { passive: !0 },
          B = function (e, t, n) {
            var r,
              u = t.target,
              i = t.touches,
              o = t.changedTouches,
              a = t.pointerType;
            return (
              i || o
                ? ((r = (null == i ? void 0 : i.length) ? i[0] : o[0]), (a = a || "touch"))
                : ((r = t), (a = a || "mouse")),
              {
                type: e,
                pointerType: a,
                pageX: r.pageX,
                pageY: r.pageY,
                sourceEvent: t,
                currentTarget: n,
                target: u,
              }
            );
          },
          k = function (e, t, n) {
            var r = B(t, n, e.el);
            e.trigger(t, r);
          },
          _ = function (e, t, n) {
            var r = e.el,
              u = n.target;
            e.trigger(t, { type: t, sourceEvent: n, currentTarget: r, target: u });
          },
          j = function (e) {
            var t = e.ownerDocument || e;
            return t.defaultView || t.parentWindow || window;
          },
          P = function (e, t, n, r) {
            var u = arguments.length > 4 && void 0 !== arguments[4] ? arguments[4] : w,
              i = e.handlers[t],
              o = e.options[t];
            if ((i || ((i = e.handlers[t] = {}), (o = e.options[t] = {})), i[n]))
              throw Error("".concat(t, " ").concat(n, " already registered"));
            ((i[n] = r), (o[n] = u));
            var a = e.el,
              s = t === A ? j(a) : a;
            s && s.addEventListener(n, r, u);
          },
          O = function (e) {
            var t = e.el;
            null !== e.pointerId && (t.releasePointerCapture(e.pointerId), (e.pointerId = null));
          },
          S = function (e, t) {
            var n = e.el,
              r = e.handlers,
              u = e.options,
              i = t === A ? j(n) : n,
              o = r[t],
              a = u[t];
            o &&
              (Object.keys(o).forEach(function (e) {
                var t = a[e];
                "boolean" == typeof t
                  ? i.removeEventListener(e, o[e], t)
                  : i.removeEventListener(e, o[e]);
              }),
              (r[t] = null),
              (u[t] = null));
          },
          x = function (e) {
            return (
              (!!e.ctrlKey && "click" === e.type) ||
              ("which" in e ? 3 === e.which : "button" in e && 2 === e.button)
            );
          },
          T = function (e, t) {
            e.enableDoubleClick &&
              ((0, D.t)() - e.lastClick < 300
                ? (k(e, h.LK, t), (e.lastClick = 0))
                : (e.lastClick = (0, D.t)()));
          },
          I = function (e, t) {
            if ((u || (u = new $(document).on("interaction")), !e.handlers[F] && !e.handlers[C])) {
              var n = e.el;
              (P(e, t, "blur", function () {
                ((0, v.vy)(n, "jw-tab-focus"), (e.clicking = !1));
              }),
                P(e, t, "focus", function () {
                  u.event && u.event.type === E && (0, v.iQ)(n, "jw-tab-focus");
                }));
            }
          },
          N = function (e, t, n, r) {
            m
              ? P(e, t, "pointerdown", n, r)
              : (y && P(e, t, "mousedown", n, r), P(e, t, "touchstart", n, r));
          },
          L = function (e) {
            if (!e.handlers[C]) {
              var t = e.el;
              (I(e, C),
                N(e, C, function (n) {
                  var r = n.target;
                  x(n) ||
                    (e.directSelect && r !== t) ||
                    (n.isPrimary && "BUTTON" === r.tagName && r.focus(),
                    (e.lastStart = (0, D.t)()),
                    (e.clicking = !0));
                }),
                P(e, C, "click", function (n) {
                  if (!x(n) && (!e.directSelect || n.target === t)) {
                    if ((0, D.t)() - e.lastStart > 500 && !0 === e.clicking) {
                      e.clicking = !1;
                      return;
                    }
                    (T(e, n), k(e, h.Rt, n), (e.clicking = !1));
                  }
                }));
            }
          },
          M = function (e) {
            e.preventDefault && e.preventDefault();
          },
          R = function (e) {
            return 0 === e.type.indexOf("touch") ? (e.originalEvent || e).changedTouches[0] : e;
          },
          V = function (e) {
            if (!e.handlers[F]) {
              var t = e.el,
                n = e.passive,
                u = !!b && { passive: n },
                i = function (t) {
                  if (e.dragged) k(e, h.j, t);
                  else {
                    var r = R(t),
                      u = r.pageX,
                      i = r.pageY,
                      o = u - e.startX,
                      a = i - e.startY;
                    o * o + a * a > 36 && (k(e, h.Qf, t), (e.dragged = !0), k(e, h.j, t));
                  }
                  n || "touchmove" !== t.type || M(t);
                },
                o = function (t) {
                  (clearTimeout(r),
                    e.el && (O(e), S(e, A), e.dragged && ((e.dragged = !1), k(e, h.Ry, t))));
                };
              (I(e, F),
                N(
                  e,
                  F,
                  function (r) {
                    if (((0, v.vy)(t, "jw-tab-focus"), !x(r))) {
                      var a = r.target,
                        s = r.type;
                      if (!e.directSelect || a === t) {
                        var c = R(r),
                          l = c.pageX,
                          f = c.pageY;
                        if (
                          ((e.dragged = !1),
                          (e.startX = l),
                          (e.startY = f),
                          S(e, A),
                          "pointerdown" === s && r.isPrimary)
                        ) {
                          if (!n) {
                            var d = r.pointerId;
                            ((e.pointerId = d), t.setPointerCapture(d));
                          }
                          (P(e, A, "pointermove", i, u),
                            P(e, A, "pointercancel", o),
                            P(e, A, "pointerup", o));
                        } else
                          "mousedown" === s
                            ? (P(e, A, "mousemove", i, u), P(e, A, "mouseup", o))
                            : "touchstart" === s &&
                              (P(e, A, "touchmove", i, u),
                              P(e, A, "touchcancel", o),
                              P(e, A, "touchend", o));
                      }
                    }
                  },
                  u,
                ));
            }
          },
          U = {
            drag: function (e) {
              V(e);
            },
            dragStart: function (e) {
              V(e);
            },
            dragEnd: function (e) {
              V(e);
            },
            click: function (e) {
              L(e);
            },
            doubleClick: function (e) {
              ((e.enableDoubleClick = !0), L(e));
            },
            longPress: function (e) {
              var t = "longPress";
              if (d.OS.iOS) {
                var n = function () {
                  clearTimeout(r);
                };
                (P(e, t, "touchstart", function (u) {
                  (n(),
                    (r = setTimeout(function () {
                      k(e, t, u);
                    }, 500)));
                }),
                  P(e, t, "touchmove", n),
                  P(e, t, "touchcancel", n),
                  P(e, t, "touchend", n));
              } else
                e.el.oncontextmenu = function (n) {
                  return (k(e, t, n), !1);
                };
            },
            focus: function (e) {
              var t = "focus";
              P(e, t, t, function (n) {
                _(e, t, n);
              });
            },
            blur: function (e) {
              var t = "blur";
              P(e, t, t, function (n) {
                _(e, t, n);
              });
            },
            over: function (e) {
              (m || y) &&
                P(e, h.PM, m ? "pointerover" : "mouseover", function (t) {
                  "touch" !== t.pointerType && k(e, h.PM, t);
                });
            },
            out: function (e) {
              if (m) {
                var t = e.el;
                P(e, h.Po, "pointerout", function (n) {
                  if ("touch" !== n.pointerType && "clientX" in n) {
                    var r = document.elementFromPoint(n.clientX, n.clientY);
                    t.contains(r) || k(e, h.Po, n);
                  }
                });
              } else
                y &&
                  P(e, h.Po, "mouseout", function (t) {
                    k(e, h.Po, t);
                  });
            },
            move: function (e) {
              (m || y) &&
                P(e, h.i2, m ? "pointermove" : "mousemove", function (t) {
                  "touch" !== t.pointerType && k(e, h.i2, t);
                });
            },
            enter: function (e) {
              P(e, h.Fm, E, function (t) {
                ("Enter" === t.key || 13 === t.keyCode) && (t.stopPropagation(), _(e, h.Fm, t));
              });
            },
            keydown: function (e) {
              P(
                e,
                E,
                E,
                function (t) {
                  _(e, E, t);
                },
                !1,
              );
            },
            gesture: function (e) {
              var t = "gesture",
                n = function (n) {
                  return k(e, t, n);
                };
              (P(e, t, "click", n), P(e, t, E, n));
            },
            interaction: function (e) {
              var t = "interaction",
                n = function (t) {
                  e.event = t;
                };
              (P(e, t, "mousedown", n, !0), P(e, t, E, n, !0));
            },
            tap: function () {},
            doubleTap: function () {},
          },
          z = /\s+/,
          H = function (e) {
            return e && !(z.test(e) || (void 0 === e ? "undefined" : (0, f._)(e)) === "object");
          },
          $ = (function (e) {
            function t(e, n) {
              ((0, o._)(this, t), (r = (0, i._)(this, t)));
              var r,
                u = !(n = n || {}).preventScrolling;
              return (
                (r.directSelect = !!n.directSelect),
                (r.dragged = !1),
                (r.enableDoubleClick = !1),
                (r.el = e),
                (r.handlers = {}),
                (r.options = {}),
                (r.lastClick = 0),
                (r.lastStart = 0),
                (r.passive = u),
                (r.pointerId = null),
                (r.startX = 0),
                (r.startY = 0),
                (r.event = null),
                (r.clicking = !1),
                r
              );
            }
            return (
              (0, l._)(t, e),
              (0, a._)(t, [
                {
                  key: "on",
                  value: function (e, n, r) {
                    return (
                      H(e) && !this.handlers[e] && U[e](this),
                      (0, s._)((0, c._)(t.prototype), "on", this).call(this, e, n, r)
                    );
                  },
                },
                {
                  key: "off",
                  value: function (e, n, r) {
                    var u = this;
                    return (
                      H(e)
                        ? S(this, e)
                        : e ||
                          Object.keys(this.handlers).forEach(function (e) {
                            S(u, e);
                          }),
                      (0, s._)((0, c._)(t.prototype), "off", this).call(this, e, n, r)
                    );
                  },
                },
                {
                  key: "destroy",
                  value: function () {
                    this.el && (this.off(), m && O(this), (this.el = null));
                  },
                },
              ]),
              t
            );
          })(p.Ay);
      },
      9555(e, t, n) {
        "use strict";
        n.d(t, {
          $z: () => ee,
          Ay: () => eC,
          B8: () => ev,
          D_: () => U,
          Ej: () => Q,
          Et: () => x,
          Gv: () => B,
          I6: () => H,
          Kg: () => T,
          Lm: () => G,
          MI: () => W,
          MZ: () => X,
          NT: () => eg,
          TS: () => V,
          Tj: () => L,
          Tn: () => S,
          Up: () => ey,
          X$: () => em,
          XB: () => es,
          _M: () => ea,
          __: () => _,
          b0: () => K,
          bz: () => z,
          cK: () => eo,
          dY: () => eA,
          gR: () => ei,
          gf: () => eF,
          iv: () => ec,
          nF: () => eD,
          pb: () => $,
          qY: () => en,
          qh: () => eu,
          yr: () => N,
        });
        var r = n(3750),
          u = n(478),
          i = n(3297),
          o = {},
          a = Array.prototype,
          s = Object.prototype,
          c = Function.prototype,
          l = a.slice,
          f = a.concat,
          d = s.toString,
          h = s.hasOwnProperty,
          p = a.map,
          D = a.reduce,
          v = a.forEach,
          g = a.filter,
          m = a.every,
          y = a.some,
          A = a.indexOf,
          F = Array.isArray,
          C = Object.keys,
          E = c.bind,
          b = window.isFinite,
          w = function (e, t) {
            return h.call(e, t);
          },
          B = function (e) {
            return e === Object(e);
          },
          k = function (e) {
            if (!B(e)) return [];
            if (C) return C(e);
            var t = [];
            for (var n in e) w(e, n) && t.push(n);
            return t;
          },
          _ = function (e, t, n) {
            if (null == e) return e;
            if (v && e.forEach === v) e.forEach(t, n);
            else if (e.length === Number(e.length)) {
              for (r = 0, u = e.length; r < u; r++) if (t.call(n, e[r], r, e) === o) return;
            } else {
              var r,
                u,
                i = k(e);
              for (r = 0, u = i.length; r < u; r++) if (t.call(n, e[i[r]], i[r], e) === o) return;
            }
            return e;
          },
          j = [];
        _(["Function", "String", "Number", "Date", "RegExp"], function (e) {
          j[e] = function (t) {
            return d.call(t) == "[object ".concat(e, "]");
          };
        });
        var P = j.Date,
          O = j.RegExp,
          S = j.Function,
          x = j.Number,
          T = j.String,
          I =
            F ||
            function (e) {
              return "[object Array]" == d.call(e);
            },
          N = function (e) {
            return x(e) && e != Number(e);
          },
          L = function (e, t, n) {
            var r = [];
            return null == e
              ? r
              : p && e.map === p
                ? e.map(t, n)
                : (_(e, function (e, u, i) {
                    r.push(t.call(n, e, u, i));
                  }),
                  r);
          },
          M = function () {},
          R = function (e, t) {
            for (var n = arguments.length, u = Array(n > 2 ? n - 2 : 0), i = 2; i < n; i++)
              u[i - 2] = arguments[i];
            if (E && e.bind === E) return E.apply(e, [t].concat(u));
            if (!S(e)) throw TypeError();
            var o = function () {
              for (var n = arguments.length, i = Array(n), a = 0; a < n; a++) i[a] = arguments[a];
              if (!(0, r._)(this, o)) return e.apply(t, u.concat(i));
              M.prototype = e.prototype;
              var s = new M();
              M.prototype = null;
              var c = e.apply(s, u.concat(i));
              return Object(c) === c ? c : s;
            };
            return o;
          },
          V = function (e, t, n, r) {
            var u = arguments.length > 2;
            if ((null == e && (e = []), D && e.reduce === D))
              return (r && (t = R(t, r)), u ? e.reduce(t, n) : e.reduce(t));
            if (
              (_(e, function (e, i, o) {
                u ? (n = t.call(r, n, e, i, o)) : ((n = e), (u = !0));
              }),
              !u)
            )
              throw TypeError("Reduce of empty array with no initial value");
            return n;
          },
          U = function (e) {
            return e;
          },
          z = function (e, t, n) {
            t || (t = U);
            var r = !1;
            return null == e
              ? r
              : y && e.some === y
                ? e.some(t, n)
                : (_(e, function (e, u, i) {
                    if (r || (r = t.call(n, e, u, i))) return o;
                  }),
                  !!r);
          },
          H = function (e, t, n) {
            var r;
            return (
              z(e, function (e, u, i) {
                if (t.call(n, e, u, i)) return ((r = e), !0);
              }),
              r
            );
          },
          $ = function (e, t, n) {
            var r = [];
            return null == e
              ? r
              : g && e.filter === g
                ? e.filter(t, n)
                : (_(e, function (e, u, i) {
                    t.call(n, e, u, i) && r.push(e);
                  }),
                  r);
          },
          q = function (e, t, n) {
            t || (t = U);
            var r = !0;
            return null == e
              ? r
              : m && e.every === m
                ? e.every(t, n)
                : (_(e, function (e, u, i) {
                    if (!(r = r && t.call(n, e, u, i))) return o;
                  }),
                  !!r);
          },
          Q = function (e) {
            return null == e ? 0 : e.length === Number(e.length) ? e.length : k(e).length;
          },
          Y = function (e, t) {
            var n;
            return function () {
              for (var r = arguments.length, u = Array(r), i = 0; i < r; i++) u[i] = arguments[i];
              return (--e > 0 && (n = t.apply(this, u)), e <= 1 && (t = null), n);
            };
          };
        j.Function = function (e) {
          return "function" == typeof e;
        };
        var W = function (e) {
            return b(e) && !N(parseFloat(e));
          },
          G = function (e) {
            return !0 === e || !1 === e || "[object Boolean]" == d.call(e);
          },
          K = function (e) {
            return void 0 === e;
          },
          X = function (e) {
            return function (t) {
              return t[e];
            };
          },
          J = function (e) {
            return null == e ? U : S(e) ? e : X(e);
          },
          Z = function (e) {
            return function (t, n, r) {
              var u = {};
              return (
                (n = J(n)),
                _(t, function (i, o) {
                  e(u, n.call(r, i, o, t), i);
                }),
                u
              );
            };
          },
          ee = Z(function (e, t, n) {
            w(e, t) ? e[t].push(n) : (e[t] = [n]);
          }),
          et = Z(function (e, t, n) {
            e[t] = n;
          }),
          en = function (e, t, n, r) {
            for (var u = (n = J(n)).call(r, t), i = 0, o = e.length; i < o; ) {
              var a = (i + o) >>> 1;
              n.call(r, e[a]) < u ? (i = a + 1) : (o = a);
            }
            return i;
          },
          er = function (e) {
            for (var t = k(e), n = k.length, r = Array(n), u = 0; u < n; u++) r[u] = e[t[u]];
            return r;
          },
          eu = function (e, t, n) {
            if (null == e) return -1;
            var r = 0,
              u = e.length;
            if (n)
              if ("number" != typeof n) return ((r = en(e, t)), e[r] === t ? r : -1);
              else r = n < 0 ? Math.max(0, u + n) : n;
            if (A && e.indexOf === A) return e.indexOf(t, n);
            for (; r < u; r++) if (e[r] === t) return r;
            return -1;
          },
          ei = function (e, t) {
            return null != e && (e.length !== Number(e.length) && (e = er(e)), eu(e, t) >= 0);
          },
          eo = function (e) {
            return function (t) {
              if (t === e) return !0;
              for (var n in e) if (e[n] !== t[n]) return !1;
              return !0;
            };
          },
          ea = function (e, t) {
            return $(e, eo(t));
          },
          es = function (e, t) {
            return H(e, eo(t));
          },
          ec = function (e) {
            for (var t = arguments.length, n = Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
              n[r - 1] = arguments[r];
            var u = f.apply(a, n);
            return $(e, function (e) {
              return !ei(u, e);
            });
          },
          el = function (e) {
            for (var t = arguments.length, n = Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
              n[r - 1] = arguments[r];
            return function () {
              for (var t = arguments.length, r = Array(t), u = 0; u < t; u++) r[u] = arguments[u];
              for (var i = 0, o = n.slice(), a = 0, s = o.length; a < s; a++)
                w(o[a], "partial") && (o[a] = r[i++]);
              for (; i < arguments.length; ) o.push(r[i++]);
              return e.apply(this, o);
            };
          },
          ef = el(Y, 2),
          ed = function (e, t) {
            for (var n = arguments.length, r = Array(n > 2 ? n - 2 : 0), u = 2; u < n; u++)
              r[u - 2] = arguments[u];
            return setTimeout(function () {
              return e.apply(null, r);
            }, t);
          },
          eh = el(ed, { partial: el }, 1),
          ep = i.t,
          eD = function (e, t, n) {
            var r,
              u,
              i,
              o = null,
              a = 0;
            n || (n = {});
            var s = function () {
              ((a = !1 === n.leading ? 0 : ep()), (o = null), (i = e.apply(r, u)), (r = u = null));
            };
            return function () {
              for (var c = arguments.length, l = Array(c), f = 0; f < c; f++) l[f] = arguments[f];
              var d = ep();
              a || !1 !== n.leading || (a = d);
              var h = t - (d - a);
              return (
                (r = this),
                (u = l),
                h <= 0
                  ? (clearTimeout(o), (o = null), (a = d), (i = e.apply(r, u)), (r = u = null))
                  : o || !1 === n.trailing || (o = setTimeout(s, h)),
                i
              );
            };
          },
          ev = function (e) {
            for (var t = {}, n = k(e), r = 0, u = n.length; r < u; r++) t[e[n[r]]] = n[r];
            return t;
          },
          eg = function (e) {
            for (var t = arguments.length, n = Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
              n[r - 1] = arguments[r];
            return (
              _(n, function (t) {
                if (t) for (var n in t) void 0 === e[n] && (e[n] = t[n]);
              }),
              e
            );
          },
          em =
            Object.assign ||
            function (e) {
              for (var t = arguments.length, n = Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
                n[r - 1] = arguments[r];
              return (
                _(n, function (t) {
                  if (t) for (var n in t) Object.hasOwn(t, n) && (e[n] = t[n]);
                }),
                e
              );
            },
          ey = function (e) {
            for (var t, n = arguments.length, r = Array(n > 1 ? n - 1 : 0), i = 1; i < n; i++)
              r[i - 1] = arguments[i];
            var o = {};
            return (
              _((r = (t = []).concat.apply(t, (0, u._)(r))), function (t) {
                t in e && (o[t] = e[t]);
              }),
              o
            );
          },
          eA = function (e) {
            return function () {
              return e;
            };
          },
          eF = function (e) {
            return x(e) && !N(e);
          };
        let eC = {
          after: function (e, t) {
            return function () {
              for (var n = arguments.length, r = Array(n), u = 0; u < n; u++) r[u] = arguments[u];
              if (--e < 1) return t.apply(this, r);
            };
          },
          all: q,
          any: z,
          before: Y,
          bind: R,
          clone: function (e) {
            return B(e) ? (I(e) ? e.slice() : em({}, e)) : e;
          },
          collect: L,
          compact: function (e) {
            return $(e, U);
          },
          constant: eA,
          contains: ei,
          debounce: function (e) {
            var t,
              n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 100;
            return function () {
              for (var r = this, u = arguments.length, i = Array(u), o = 0; o < u; o++)
                i[o] = arguments[o];
              (clearTimeout(t),
                (t = setTimeout(function () {
                  e.apply(r, i);
                }, n)));
            };
          },
          defaults: eg,
          defer: eh,
          delay: ed,
          detect: H,
          difference: ec,
          each: _,
          every: q,
          extend: em,
          filter: $,
          find: H,
          findWhere: es,
          foldl: V,
          forEach: _,
          groupBy: ee,
          has: w,
          identity: U,
          include: ei,
          indexBy: et,
          indexOf: eu,
          inject: V,
          invert: ev,
          isArray: I,
          isBoolean: G,
          isDate: P,
          isFinite: W,
          isFunction: S,
          isNaN: N,
          isNull: function (e) {
            return null === e;
          },
          isNumber: x,
          isObject: B,
          isRegExp: O,
          isString: T,
          isUndefined: K,
          isValidNumber: eF,
          keys: k,
          last: function (e, t, n) {
            if (null != e)
              return null == t || n ? e[e.length - 1] : l.call(e, Math.max(e.length - t, 0));
          },
          map: L,
          matches: eo,
          max: function (e, t, n) {
            if (!t && I(e) && e[0] === Number(e[0]) && e.length < 65535) {
              var r;
              return (r = Math).max.apply(r, (0, u._)(e));
            }
            var i = -1 / 0,
              o = -1 / 0;
            return (
              _(e, function (e, r, u) {
                var a = t ? t.call(n, e, r, u) : e;
                a > o && ((i = e), (o = a));
              }),
              i
            );
          },
          memoize: function (e, t) {
            var n = {};
            return (
              t || (t = U),
              function () {
                for (var r = arguments.length, u = Array(r), i = 0; i < r; i++) u[i] = arguments[i];
                var o = t.apply(this, u);
                return w(n, o) ? n[o] : (n[o] = e.apply(this, u));
              }
            );
          },
          now: ep,
          omit: function (e) {
            for (var t = arguments.length, n = Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
              n[r - 1] = arguments[r];
            var u = {};
            for (var i in e) ei(n, i) || (u[i] = e[i]);
            return u;
          },
          once: ef,
          partial: el,
          pick: ey,
          pluck: function (e, t) {
            return L(e, X(t));
          },
          property: X,
          propertyOf: function (e) {
            return null == e
              ? function () {}
              : function (t) {
                  return e[t];
                };
          },
          reduce: V,
          reject: function (e, t, n) {
            return $(
              e,
              function (e, r, u) {
                return !t.call(n, e, r, u);
              },
              n,
            );
          },
          result: function (e, t) {
            if (null != e) {
              var n = e[t];
              return S(n) ? n.call(e) : n;
            }
          },
          select: $,
          size: Q,
          some: z,
          sortedIndex: en,
          throttle: eD,
          where: ea,
          without: function (e) {
            for (var t = arguments.length, n = Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
              n[r - 1] = arguments[r];
            return ec(e, n);
          },
        };
      },
      8586(e, t, n) {
        "use strict";
        n.d(t, { LH: () => l, SM: () => s, aE: () => o, jp: () => a, vA: () => i });
        var r = /^[^:/?#]+:?\/\/[^/?#]+/,
          u = function (e) {
            if (e) return new URL(e, window.location);
          },
          i = function (e) {
            if (!e) return {};
            var t = u(e),
              n = {},
              r = !0,
              i = !1,
              o = void 0;
            try {
              for (
                var a, s = t.searchParams.keys()[Symbol.iterator]();
                !(r = (a = s.next()).done);
                r = !0
              ) {
                var c = a.value;
                if (!n[c]) {
                  var l = t.searchParams.getAll(c);
                  n[c] = 1 === l.length ? l[0] : l;
                }
              }
            } catch (e) {
              ((i = !0), (o = e));
            } finally {
              try {
                r || null == s.return || s.return();
              } finally {
                if (i) throw o;
              }
            }
            return n;
          },
          o = function (e) {
            if (!e) return -1;
            var t = new URLSearchParams(e).get("jw_start") || -1;
            return isNaN(t) || t < -1 ? -1 : Number(t);
          },
          a = function (e) {
            var t =
              arguments.length > 1 && void 0 !== arguments[1]
                ? arguments[1]
                : "{seek_to_second_number}";
            if (e) {
              var n = new URL(e);
              n.searchParams.set("jw_start", "");
              var r = n.toString();
              return r.replace(/jw_start=?/i, "jw_start=".concat(t));
            }
          },
          s = function (e, t) {
            if (e) return new URLSearchParams(e).has(t);
          },
          c = function (e) {
            return !!e && null !== e.match(r);
          },
          l = function (e, t) {
            if ((t || (t = document.location.href), !e || !c(t))) return "";
            if (c(e)) return e;
            try {
              return new URL(e, t).toString();
            } catch (e) {
              return "";
            }
          };
      },
      2235(e, t, n) {
        "use strict";
        (n.r(t),
          n.d(t, {
            exists: () => a,
            isDeepKeyCompliant: () => h,
            isFileProtocol: () => c,
            isHTTPS: () => s,
            isRtmp: () => l,
            isYouTube: () => f,
            typeOf: () => d,
          }));
        var r,
          u,
          i = n(1642),
          o = (null == (u = window) || null == (r = u.location) ? void 0 : r.protocol) || "",
          a = function (e) {
            switch (void 0 === e ? "undefined" : (0, i._)(e)) {
              case "string":
                return e.length > 0;
              case "object":
                return null !== e;
              case "undefined":
                return !1;
              default:
                return !0;
            }
          },
          s = function () {
            return "https:" === o;
          },
          c = function () {
            return "file:" === o;
          },
          l = function (e, t) {
            return 0 === e.indexOf("rtmp:") || "rtmp" === t;
          },
          f = function (e, t) {
            return "youtube" === t || /^(http|\/\/).*(youtube\.com|youtu\.be)\/.+/.test(e);
          },
          d = function (e) {
            if (null === e) return "null";
            var t = void 0 === e ? "undefined" : (0, i._)(e);
            return "object" === t && Array.isArray(e) ? "array" : t;
          },
          h = function (e, t, n) {
            var r = Object.keys(e);
            return (
              Object.keys(t).length >= r.length &&
              r.every(function (r) {
                var u = e[r],
                  o = t[r];
                return u && (void 0 === u ? "undefined" : (0, i._)(u)) === "object"
                  ? !!o && (void 0 === o ? "undefined" : (0, i._)(o)) === "object" && h(u, o, n)
                  : n(r, e);
              })
            );
          };
      },
      3078(e, t, n) {
        "use strict";
        n.d(t, { A: () => r });
        let r = document.createElement("video");
      },
      4403(e, t, n) {
        "use strict";
        n.d(t, { r: () => r });
        var r =
          "8.41.1+commercial_v8-41-1x.37.@jwplayer/service-loader@2.0.2.ads-dai@mono.ads-freewheel@mono.ads-googima@mono.ads-vast@mono.hls.js@1.6.5.jwplayer@mono.jwplayer-ads-header-bidding@7.10.1.jwplayer-analytics@4.0.9.plugin-gapro@mono";
      },
      8999(e, t, n) {
        "use strict";
        n.d(t, { A: () => i });
        var r = n(5291),
          u = n(7316);
        function i(e, t) {
          var n,
            i,
            o,
            a,
            s = t.message,
            c = t.code,
            l =
              ((n = e.get("id")),
              (i = e.get("localization").errors.errorCode),
              (a = (o = c.toString())
                ? "(".concat(i, ": ").concat(o, ")").replace(/\s+/g, "&nbsp;")
                : ""),
              '<div id="'.concat(n, '" class="jw-error jw-reset">') +
                '<div class="jw-error-msg jw-info-overlay jw-reset"><style>' +
                '[id="'.concat(
                  n,
                  '"].jw-error{background:#000;overflow:hidden;position:relative}',
                ) +
                '[id="'.concat(
                  n,
                  '"] .jw-error-msg{top:50%;left:50%;position:absolute;transform:translate(-50%,-50%)}',
                ) +
                '[id="'.concat(
                  n,
                  '"] .jw-error-text{text-align:start;color:#FFF;font:14px/1.35 Arial,Helvetica,sans-serif}',
                ) +
                '</style><div class="jw-icon jw-reset"></div><div class="jw-info-container jw-reset">' +
                '<div class="jw-error-text jw-reset-text" dir="auto" data-nosnippet>'
                  .concat(s || "", '<span class="jw-break jw-reset"></span>')
                  .concat(a, "</div>") +
                "</div></div></div>"),
            f = e.get("width"),
            d = e.get("height"),
            h = (0, r.n)(l);
          return (
            (0, u.iF)(h, {
              width: f.toString().indexOf("%") > 0 ? f : "".concat(f, "px"),
              height: d.toString().indexOf("%") > 0 ? d : "".concat(d, "px"),
            }),
            h
          );
        }
      },
      6622(e, t, n) {
        "use strict";
        n.d(t, { A: () => f });
        var r = n(494),
          u = n(9407),
          i = n(6147),
          o = n(5291),
          a = n(7316),
          s = [],
          c = -1,
          l = function () {
            ((0, i.u)(c),
              (c = (0, i.x)(function () {
                (s.forEach(function (e) {
                  e.view.updateBounds();
                  var t = e.view.model.get("containerWidth");
                  ((e.resized = e.width !== t), (e.width = t));
                }),
                  s.forEach(function (e) {
                    e.contractElement.scrollLeft = 2 * e.width;
                  }),
                  s.forEach(function (e) {
                    ((0, a.iF)(e.expandChild, { width: e.width + 1 }),
                      e.resized && e.view.model.get("visibility") && e.view.updateStyles());
                  }),
                  s.forEach(function (e) {
                    e.expandElement.scrollLeft = e.width + 1;
                  }),
                  s.forEach(function (e) {
                    e.resized && e.view.checkResized();
                  }));
              })));
          },
          f = (function () {
            function e(t, n, u) {
              (0, r._)(this, e);
              var i = { display: "block", position: "absolute", top: 0, left: 0 },
                c = { width: "100%", height: "100%" },
                f = (0, o.n)(
                  '<div style="opacity:0;visibility:hidden;overflow:hidden;"><div><div style="height:1px;"></div></div><div class="jw-contract-trigger"></div></div>',
                ),
                d = f.firstChild,
                h = d.firstChild,
                p = d.nextSibling;
              ((0, a.iF)([d, p], Object.assign({ overflow: "auto" }, i, c)),
                (0, a.iF)(f, Object.assign({}, i, c)),
                (this.expandElement = d),
                (this.expandChild = h),
                (this.contractElement = p),
                (this.hiddenElement = f),
                (this.element = t),
                (this.view = n),
                (this.model = u),
                (this.width = 0),
                (this.resized = !1),
                t.firstChild ? t.insertBefore(f, t.firstChild) : t.appendChild(f),
                t.addEventListener("scroll", l, !0),
                s.push(this),
                l());
            }
            return (
              (0, u._)(e, [
                {
                  key: "destroy",
                  value: function () {
                    if (this.view) {
                      var e = s.indexOf(this);
                      (-1 !== e && s.splice(e, 1),
                        this.element.removeEventListener("scroll", l, !0),
                        this.element.removeChild(this.hiddenElement),
                        (this.view = this.model = null));
                    }
                  },
                },
              ]),
              e
            );
          })();
      },
      8089(e, t, n) {
        "use strict";
        n.d(t, { A: () => m });
        var r,
          u = n(2329),
          i = [],
          o = [],
          a = [],
          s = {},
          c = !1,
          l = !1,
          f = function (e, t) {
            for (var n = t.length; n--; ) {
              var r = t[n];
              if (e.target === r.getContainer()) {
                r.setIntersection(e);
                break;
              }
            }
          },
          d = function () {
            var e = window.IntersectionObserver;
            r ||
              (r = new e(
                function (e) {
                  if (null == e ? void 0 : e.length)
                    for (var t = e.length; t--; ) {
                      var n = e[t];
                      (f(n, i), f(n, o));
                    }
                },
                { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] },
              ));
          },
          h = function () {
            i.forEach(function (e) {
              e.model.set("activeTab", (0, u.A)());
            });
          },
          p = function (e, t) {
            var n = t.indexOf(e);
            -1 !== n && t.splice(n, 1);
          },
          D = function (e) {
            a.forEach(function (t) {
              t(e);
            });
          },
          v = function () {
            l ||
              ((l = !0),
              document.addEventListener("visibilitychange", h),
              document.addEventListener("webkitvisibilitychange", h));
          },
          g = function () {
            l &&
              !(i.length > 0) &&
              ((l = !1),
              document.removeEventListener("visibilitychange", h),
              document.removeEventListener("webkitvisibilitychange", h));
          };
        let m = {
          add: function (e) {
            (i.push(e), v());
          },
          remove: function (e) {
            (p(e, i), g(), window.removeEventListener("scroll", D));
          },
          addScrollHandler: function (e) {
            (c || ((c = !0), window.addEventListener("scroll", D)), a.push(e));
          },
          removeScrollHandler: function (e) {
            p(e, a);
          },
          addWidget: function (e) {
            o.push(e);
          },
          removeWidget: function (e) {
            p(e, o);
          },
          size: function () {
            return i.length;
          },
          observe: function (e) {
            (d(), s[e.id] || ((s[e.id] = !0), r.observe(e)));
          },
          unobserve: function (e) {
            r && s[e.id] && (delete s[e.id], r.unobserve(e));
          },
        };
      },
      7230(e, t, n) {
        "use strict";
        n.d(t, { fY: () => c, uT: () => s });
        var r = "__JWP____ePBPK____",
          u = {};
        window[r] ? (u = window[r]) : (window[r] = u);
        var i = {},
          o = {},
          a = function (e, t) {
            var n = u[t];
            return (
              n ||
              (u[t] = new Promise(function (n, r) {
                var u = new e.key(t);
                if ("unlimited" === u.edition()) return r();
                var i = ["//", "entitlements.jwplayer.com", "/", u.token(), ".json"];
                ("file:" === window.location.protocol && i.unshift("https:"),
                  e.ajax(
                    i.join(""),
                    function (e) {
                      var t = null == e ? void 0 : e.response;
                      t ? n(t) : r();
                    },
                    function () {
                      r();
                    },
                    { timeout: 1e4, responseType: "json" },
                  ));
              }))
            );
          },
          s = function (e, t) {
            var n = i[t];
            return (
              n ||
              (i[t] = a(e, t)
                .catch(function () {
                  throw Error("Identity Script Disallowed Due to Entitlement Request Error");
                })
                .then(function (e) {
                  if (!0 !== e.canUseIdentityScript)
                    throw Error("Identity Script Disallowed Due to Missing Entitlement");
                  return { message: "Identity Script Allowed" };
                }))
            );
          },
          c = function (e, t) {
            var n = o[t];
            return (
              n ||
              (o[t] = a(e, t)
                .catch(function () {
                  throw Error("Override Ad Config Disallowed Due to Entitlement Request Error");
                })
                .then(function (e) {
                  if (!0 !== e.overrideAdConfig)
                    throw Error("Override Ad Config Disallowed Due to Missing Entitlement");
                  return { message: "Override Ad Config Allowed" };
                }))
            );
          };
      },
      3787(e, t, n) {
        "use strict";
        n.d(t, { default: () => eA });
        var r,
          u,
          i,
          o,
          a,
          s,
          c,
          l,
          f,
          d,
          h = n(1893),
          p = n(5456),
          D = n(478),
          v = n(1642);
        ((r = function (e) {
          var t = e;
          try {
            for (; t.document !== t.parent.document; ) t = t.parent;
          } catch (e) {}
          return t;
        }),
          (u = function (e) {
            return atob(e);
          }),
          (i = function (e) {
            var t = e.message,
              n = e.payload,
              i = new XMLHttpRequest();
            (i.open("POST", u("aHR0cHM6Ly9wbC5jb25uYXRpeC5jb20="), !0),
              i.setRequestHeader("Content-Type", "application/json"));
            var o = navigator.userAgent,
              a = r(window).location.href,
              s = (a.includes("://") ? a.split("://")[1] : a).split("/")[0],
              c = u("anc="),
              l = (0, p._)((0, h._)({}, void 0 === n ? {} : n), { pageDomain: s, source: c });
            i.send(
              JSON.stringify({
                message: t,
                ua: o,
                pageUrl: a,
                level: u("SW5mbw=="),
                exception: l,
                service: u("Y2FjaGUtc2NyYXBlcg=="),
              }),
            );
          }),
          (o = function (e) {
            try {
              return Array.from(e.document.querySelectorAll("script")).some(function (e) {
                return e.src.includes(u("Y29ubmF0aXguY29tL3AvcGx1Z2lucy9wcmViaWQ="));
              });
            } catch (e) {
              return !1;
            }
          }),
          (a = function () {
            var e = [],
              t = r(window);
            e.push(t);
            var n = function (t, r) {
              if (!(r > 3)) {
                try {
                  s = Array.from(t.frames).filter(function (e) {
                    return !o(e);
                  });
                } catch (e) {
                  return;
                }
                var u = !0,
                  i = !1,
                  a = void 0;
                try {
                  for (var s, c, l = s[Symbol.iterator](); !(u = (c = l.next()).done); u = !0) {
                    var f = c.value;
                    (e.push(f), n(f, r + 1));
                  }
                } catch (e) {
                  ((i = !0), (a = e));
                } finally {
                  try {
                    u || null == l.return || l.return();
                  } finally {
                    if (i) throw a;
                  }
                }
              }
            };
            return (n(t, 1), e);
          }),
          (s = function (e) {
            var t = [];
            try {
              e._pbjsGlobals.forEach(function (n) {
                var r = e[n];
                r && (void 0 === r ? "undefined" : (0, v._)(r)) === "object" && t.push(r);
              });
            } catch (e) {}
            return t;
          }),
          (c = function (e) {
            if (!(Math.random() > 0.005)) {
              var t = (0, h._)({}, e.getConfig()).cache;
              (void 0 === t ? "undefined" : (0, v._)(t)) === "object" && null !== t
                ? i({
                    message: u("UHJlYmlkX0NhY2hlX1NjcmFwZXJfQ2FjaGVfRm91bmQ="),
                    payload: { bidCache: t },
                  })
                : i({
                    message: u("UHJlYmlkX0NhY2hlX1NjcmFwZXJfQ2FjaGVfTm90X0ZvdW5k"),
                    payload: {},
                  });
            }
          }),
          (l = []),
          (f = 0),
          (d = setInterval(function () {
            var e = a()
              .flatMap(function (e) {
                return s(e);
              })
              .filter(function (e) {
                return !l.includes(e);
              });
            (e.forEach(function (e) {
              return c(e);
            }),
              l.push.apply(l, (0, D._)(e)),
              ++f >= 20 && clearInterval(d));
          }, 1e3)));
        var g = n(8),
          m = n.n(g);
        window.Promise || (window.Promise = m());
        var y = n(5483),
          A = n(9608),
          F = n(9063),
          C = n(8888);
        let E = { availableProviders: F.M, registerProvider: C.A };
        var b = n(3277);
        E.registerPlugin = function (e, t, n) {
          "jwpsrv" !== e && (0, b.F3)(e, t, n);
        };
        var w = n(4403),
          B = n(9220),
          k = n(9055),
          _ = n(4871),
          j = n(1860),
          P = n(7203),
          O = n(5001),
          S = n(9621),
          x = [["vastxml", "adtag", "schedules"]],
          T = { googima: x, vast: x, cnx: x, jwx: x },
          I = function (e, t, n) {
            var r = (0, h._)({}, e),
              u = (0, h._)({}, t),
              i = Object.keys(u).filter(function (e) {
                return null === e;
              });
            return (
              i.forEach(function (e) {
                return delete r[e];
              }),
              i.forEach(function (e) {
                return delete u[e];
              }),
              n.forEach(function (e) {
                e.some(function (e) {
                  return u[e];
                }) &&
                  e.forEach(function (e) {
                    return delete r[e];
                  });
              }),
              (0, h._)({}, r, u)
            );
          },
          N = function (e, t) {
            var n = e.getPlugin(t),
              r = Object.keys(T);
            if (-1 === r.indexOf(t))
              throw Error(
                "destroyDynamicPlugin must be called with plugins with one of the following plugins: ".concat(
                  r.toString(),
                ),
              );
            if (n) {
              if ((n.resize && e.off("resize", n.resizeHandler), delete e.plugins[t], n.destroy))
                try {
                  n.destroy();
                } catch (t) {
                  e.utils.logger.debug("jwplayer/plugins/dynamic-plugins: ", t);
                }
              var u = n.div;
              ((null == u ? void 0 : u.parentElement) && u.parentElement.removeChild(u),
                e.trigger("pluginDestroyed", { type: "pluginDestroyed", name: t }));
            }
          },
          L = function (e, t) {
            if (t[e]) return t[e];
            var n = (0, S.Gv)(e);
            if (t[n]) return t[n];
            var r = (0, S.dB)(e);
            return t[r] ? t[r] : {};
          },
          M = function (e, t, n, r) {
            var u = (0, S.dB)(t),
              i = Object.keys(T),
              o = L(t, r);
            if (-1 === i.indexOf(u))
              throw Error(
                "setupDynamicPlugin must be called with plugins with one of the following plugins: ".concat(
                  i.toString(),
                ),
              );
            N(e, u);
            var a = I(o, n, T[u]);
            return (0, b.fL)(t, a, e);
          },
          R = n(2194),
          V = n(9555),
          U = n(5637),
          z = 0,
          H = function (e, t) {
            var n = new _.Ay(t);
            return (
              n.on(j.yE, function (t) {
                (e._qoe.tick("ready"), (t.setupTime = e._qoe.between("setup", "ready")));
              }),
              n.on("all", function (t, n) {
                e.trigger(t, n);
              }),
              n
            );
          },
          $ = function (e, t) {
            var n = e.plugins,
              r = Object.keys(n).map(function (e) {
                var t = n[e];
                return (delete n[e], t);
              }),
              u = e.utils.logger.child("jwplayer/api/api");
            (t.get("setupConfig") && e.trigger("remove"),
              e.off(),
              t.playerDestroy(),
              r.forEach(function (e) {
                if (e.reset)
                  try {
                    e.reset();
                  } catch (e) {
                    u.debug(e);
                  }
                else if (e.destroy)
                  try {
                    e.destroy();
                  } catch (e) {
                    u.debug(e);
                  }
              }),
              t.getContainer().removeAttribute("data-jwplayer-id"));
          },
          q = function (e) {
            for (var t = A.A.length; t--; )
              if (A.A[t].uniqueId === e.uniqueId) {
                A.A.splice(t, 1);
                break;
              }
          };
        function Q(e) {
          var t = ++z,
            n = e.id || "player-".concat(t),
            r = new P.A(),
            u = {},
            i = new U.A("JWPlayer[".concat(n, "]")),
            o = H(this, e);
          (r.tick("init"),
            e.setAttribute("data-jwplayer-id", n),
            Object.defineProperties(this, {
              id: {
                enumerable: !0,
                get: function () {
                  return n;
                },
              },
              uniqueId: {
                enumerable: !0,
                get: function () {
                  return t;
                },
              },
              plugins: {
                enumerable: !0,
                get: function () {
                  return u;
                },
              },
              _qoe: {
                enumerable: !0,
                get: function () {
                  return r;
                },
              },
              version: {
                enumerable: !0,
                get: function () {
                  return w.r;
                },
              },
              Events: {
                enumerable: !0,
                get: function () {
                  return O.Ay;
                },
              },
              utils: {
                enumerable: !0,
                get: function () {
                  return Object.assign({}, R.A, { logger: i });
                },
              },
              _: {
                enumerable: !0,
                get: function () {
                  return V.Ay;
                },
              },
            }),
            Object.assign(this, {
              _events: {},
              setup: function (t) {
                return (
                  r.clear("ready"),
                  r.tick("setup"),
                  o && $(this, o),
                  (o = H(this, e)).init(t, this),
                  this.on(t.events, null, this)
                );
              },
              remove: function () {
                return (
                  this.getPip() && this.setPip(!1),
                  q(this),
                  o && $(this, o),
                  Object.keys(u).forEach(function (e) {
                    delete u[e];
                  }),
                  this
                );
              },
              qoe: function () {
                var e = o.getItemQoe();
                return {
                  setupTime: this._qoe.between("setup", "ready"),
                  firstFrame: e.getFirstFrame ? e.getFirstFrame() : null,
                  player: this._qoe.dump(),
                  item: e.dump(),
                };
              },
              addCues: function (e) {
                return (Array.isArray(e) && o.addCues(e), this);
              },
              getAudioTracks: function () {
                return o.getAudioTracks();
              },
              getBuffer: function () {
                return o.get("buffer");
              },
              getCaptions: function () {
                return o.get("captions");
              },
              getCaptionsList: function () {
                return o.getCaptionsList();
              },
              getConfig: function () {
                return o.getConfig();
              },
              getContainer: function () {
                return o.getContainer();
              },
              getControls: function () {
                return o.get("controls");
              },
              getCues: function () {
                return o.getCues();
              },
              getCurrentAudioTrack: function () {
                return o.getCurrentAudioTrack();
              },
              getCurrentCaptions: function () {
                return o.getCurrentCaptions();
              },
              getCurrentQuality: function () {
                return o.getCurrentQuality();
              },
              getCurrentTime: function () {
                return o.get("currentTime");
              },
              getAbsolutePosition: function () {
                return o.getAbsolutePosition();
              },
              getDuration: function () {
                return o.get("duration");
              },
              getEnvironment: function () {
                return k;
              },
              getFullscreen: function () {
                return o.get("fullscreen");
              },
              getHeight: function () {
                return o.getHeight();
              },
              getItemMeta: function () {
                return o.get("itemMeta") || {};
              },
              getMute: function () {
                return o.getMute();
              },
              getContainerPercentViewable: function () {
                return o.get("intersectionRatio");
              },
              getPercentViewable: function () {
                return o.get("visibility");
              },
              getPip: function () {
                return o.get("pip");
              },
              getPlaybackRate: function () {
                return o.get("playbackRate");
              },
              getPlaylist: function () {
                return o.get("playlist");
              },
              getPlaylistIndex: function () {
                return o.get("item");
              },
              getPlaylistItem: function (e) {
                if (!R.A.exists(e)) return o.get("playlistItem");
                var t = this.getPlaylist();
                return t ? t[e] : null;
              },
              getPosition: function () {
                return o.get("position");
              },
              getProvider: function () {
                return o.getProvider();
              },
              getQualityLevels: function () {
                return o.getQualityLevels();
              },
              getSafeRegion: function () {
                var e = !(arguments.length > 0) || void 0 === arguments[0] || arguments[0];
                return o.getSafeRegion(e);
              },
              getState: function () {
                return o.getState();
              },
              getStretching: function () {
                return o.get("stretching");
              },
              getContainerViewable: function () {
                return o.get("containerViewable");
              },
              getViewable: function () {
                return o.get("viewable");
              },
              getVisualQuality: function () {
                return o.getVisualQuality();
              },
              getVolume: function () {
                return o.get("volume");
              },
              getWidth: function () {
                return o.getWidth();
              },
              isReady: function () {
                return o.isReady();
              },
              setCaptions: function (e) {
                return (o.setCaptions(e), this);
              },
              setConfig: function (e) {
                return (o.setConfig(e), this);
              },
              setControls: function (e) {
                return (o.setControls(e), this);
              },
              setCurrentAudioTrack: function (e) {
                o.setCurrentAudioTrack(e);
              },
              setCurrentCaptions: function (e) {
                o.setCurrentCaptions(e);
              },
              setCurrentQuality: function (e) {
                o.setCurrentQuality(e);
              },
              setFullscreen: function (e) {
                return (o.setFullscreen(e), this);
              },
              setAllowFullscreen: function (e) {
                return (o.setAllowFullscreen(e), this);
              },
              setMute: function (e) {
                return (o.setMute(e), this);
              },
              setPip: function (e) {
                return (o.setPip(e), this);
              },
              setPlaybackRate: function (e) {
                return (o.setPlaybackRate(e), this);
              },
              setPlaylistItem: function (e, t) {
                return (o.setPlaylistItem(e, t), this);
              },
              setCues: function (e) {
                return (Array.isArray(e) && o.setCues(e), this);
              },
              setVolume: function (e) {
                return (o.setVolume(e), this);
              },
              load: function (e, t) {
                return (o.load(e, t), this);
              },
              preload: function (e) {
                return (o.preload(e), this);
              },
              play: function (e) {
                return (o.play(e), this);
              },
              pause: function (e) {
                return (o.pause(e), this);
              },
              playToggle: function (e) {
                switch (this.getState()) {
                  case j.v8:
                  case j.zM:
                    return this.pause(e);
                  default:
                    return this.play(e);
                }
              },
              seek: function (e, t) {
                return (o.seek(e, t), this);
              },
              playlistItem: function (e, t) {
                return (o.playlistItem(e, t), this);
              },
              playlistNext: function (e) {
                return (o.playlistNext(e), this);
              },
              playlistPrev: function (e) {
                return (o.playlistPrev(e), this);
              },
              next: function (e) {
                return (o.next(e), this);
              },
              requestPip: function (e) {
                return (o.requestPip(e), this);
              },
              castToggle: function () {
                return (o.castToggle(), this);
              },
              stopCasting: function () {
                return (o.stopCasting(), this);
              },
              requestCast: function (e) {
                return (o.requestCast(e), this);
              },
              createInstream: function () {
                return o.createInstream();
              },
              stop: function () {
                return (o.stop(), this);
              },
              resize: function (e, t) {
                return (o.resize(e, t), this);
              },
              addButton: function (e, t, n, r, u) {
                return (o.addButton(e, t, n, r, u), this);
              },
              removeButton: function (e) {
                return (o.removeButton(e), this);
              },
              getMediaElement: function () {
                return o.getMediaElement();
              },
              attachMedia: function () {
                return (o.attachMedia(), this);
              },
              detachMedia: function () {
                return (o.detachMedia(), this);
              },
              isBeforeComplete: function () {
                return o.isBeforeComplete();
              },
              isBeforePlay: function () {
                return o.isBeforePlay();
              },
              setPlaylistItemCallback: function (e, t) {
                o.setItemCallback(e, t);
              },
              removePlaylistItemCallback: function () {
                o.setItemCallback(null);
              },
              getPlaylistItemPromise: function (e) {
                return o.getItemPromise(e);
              },
              getFloating: function () {
                return !!o.get("isFloating");
              },
              setFloating: function (e) {
                o.setConfig({ floating: { mode: e ? "always" : "never" } });
              },
              getChapters: function () {
                return o.getChapters();
              },
              getCurrentChapter: function () {
                return o.getCurrentChapter();
              },
              setChapter: function (e) {
                return o.setChapter(e);
              },
              setupDynamicPlugin: function (e, t) {
                return e ? M(this, e, t, o.get("plugins")) : Promise.resolve();
              },
              destroyDynamicPlugin: function (e) {
                if (e) return N(this, e);
              },
            }));
        }
        (Object.assign(Q.prototype, {
          on: function (e, t, n) {
            return O.on.call(this, e, t, n);
          },
          once: function (e, t, n) {
            return O.Oo.call(this, e, t, n);
          },
          off: function (e, t, n) {
            return O.AU.call(this, e, t, n);
          },
          trigger: function (e, t) {
            return (((t = V.Ay.isObject(t) ? Object.assign({}, t) : {}).type = e), B.A.debug)
              ? O.hZ.call(this, e, t)
              : O.CD.call(this, e, t);
          },
          getPlugin: function (e) {
            return this.plugins[e];
          },
          addPlugin: function (e, t) {
            ((this.plugins[e] = t),
              "function" == typeof t.addToPlayer &&
                (this.isReady()
                  ? t.addToPlayer.call(this, !0)
                  : this.on("ready", function () {
                      t.addToPlayer.call(this, !1);
                    })),
              t.resize && this.on("resize", t.resizeHandler));
          },
          registerPlugin: function (e, t, n) {
            (0, b.F3)(e, t, n);
          },
          getAdBlock: function () {
            return !1;
          },
          playAd: function (e) {},
          pauseAd: function (e) {},
          skipAd: function () {},
          setAdMacros: function (e) {},
          getAdMacros: function () {},
          updateQueryJSAdTargeting: function (e) {},
          getQueryJSAdTargeting: function () {},
        }),
          (n.p = (0, y.loadFrom)()));
        var Y = function (e) {
            for (var t = 0; t < A.A.length; t++) if (A.A[t].id === e) return A.A[t];
            return null;
          },
          W = function (e) {
            if (
              (e
                ? "string" == typeof e
                  ? (t = Y(e)) || (n = document.getElementById(e))
                  : "number" == typeof e
                    ? (t = A.A[e])
                    : e.nodeType && (t = Y((n = e).id || n.getAttribute("data-jwplayer-id")))
                : (t = A.A["0"]),
              t)
            )
              return t;
            if (n) {
              var t,
                n,
                r = new Q(n);
              return (A.A.push(r), r);
            }
            return { registerPlugin: b.F3 };
          },
          G = function (e) {
            Object.defineProperties(e, {
              api: {
                get: function () {
                  return E;
                },
                set: function () {},
              },
              version: {
                get: function () {
                  return w.r;
                },
                set: function () {},
              },
              debug: {
                get: function () {
                  return B.A.debug;
                },
                set: function (e) {
                  B.A.debug = !!e;
                },
              },
            });
          };
        G(W);
        var K = n(2885),
          X = n(7069),
          J = n(1535),
          Z = n(9616),
          ee = n(9630),
          et = n(3078),
          en = V.Ay.extend,
          er = {};
        ((er._ = V.Ay),
          (er.utils = Object.assign(R.A, {
            key: X.Ay,
            extend: en,
            scriptloader: J.Ay,
            rssparser: { parse: ee.A },
            tea: Z.Y,
            UI: K.Ay,
          })),
          (er.utils.css.style = er.utils.style),
          (er.vid = et.A));
        var eu = n(2078),
          ei = R.A.logger.child("api/api-public"),
          eo = /^(?:on(?:ce)?|off|trigger)$/,
          ea = function (e, t, n) {
            var r = e.getConfig()[n];
            return ((t[n] = r), r);
          },
          es = function (e) {
            ei.warn(
              "The API method jwplayer().".concat(
                e,
                "() is disabled in the free edition of JW Player.",
              ),
            );
          },
          ec = function (e, t) {
            switch (e) {
              case "setup":
                return !!t;
              case "getSafeRegion":
              case "pauseAd":
              case "setControls":
              case "setFullscreen":
              case "setMute":
                return !!t === t ? t : void 0;
              case "setPlaylistItem":
              case "getPlaylistItem":
                return (0 | t) === t ? t : void 0;
              case "setPlaybackRate":
              case "setVolume":
                return Number(t);
              case "setConfig":
                return Object.keys(Object(t)).join(",");
              case "on":
              case "once":
              case "off":
              case "trigger":
              case "getPlugin":
              case "addPlugin":
              case "registerPlugin":
                return "".concat(t);
            }
            return null;
          },
          el = function (e, t) {
            var n = {
              reason:
                "play" !== e && "seek" !== e && "pause" !== e && (0, eu.c)()
                  ? "interaction"
                  : "external",
            };
            switch (e) {
              case "play":
              case "pause":
              case "playToggle":
              case "playlistNext":
              case "playlistPrev":
              case "next":
                t[0] = n;
                break;
              case "seek":
              case "playlistItem":
                t[1] = n;
            }
          },
          ef = function (e, t, n) {
            try {
              var r = ec(t, n);
              e.trackExternalAPIUsage(t, r);
            } catch (e) {
              B.A.debug && ei.warn(e);
            }
          },
          ed = function (e, t) {
            if (t.length) {
              var n = e.getPlugin("jwpsrv");
              (null == n ? void 0 : n.trackExternalAPIUsage) &&
                (t.forEach(function (e) {
                  ef(n, e[0], e[1]);
                }),
                (t.length = 0));
            }
          },
          eh = function (e, t, n, r, u) {
            return function () {
              for (var i = arguments.length, o = Array(i), a = 0; a < i; a++) o[a] = arguments[a];
              var s = o[0],
                c = t._trackCallQueue || (t._trackCallQueue = []),
                l = eo.test(n),
                f = l && o[1] && o[1]._callback;
              if ("free" === (u.edition || ea(t, u, "edition"))) {
                if (
                  [
                    "addButton",
                    "addCues",
                    "detachMedia",
                    "load",
                    "next",
                    "pause",
                    "play",
                    "playlistItem",
                    "playlistNext",
                    "playlistPrev",
                    "playToggle",
                    "resize",
                    "seek",
                    "setCaptions",
                    "setConfig",
                    "setControls",
                    "setCues",
                    "setFullscreen",
                    "setMute",
                    "setPlaybackRate",
                    "setPlaylistItem",
                    "setVolume",
                    "stop",
                  ].indexOf(n) > -1
                )
                  return (es(n), e);
                if (
                  [
                    "createInstream",
                    "setCurrentAudioTrack",
                    "setCurrentCaptions",
                    "setCurrentQuality",
                  ].indexOf(n) > -1
                )
                  return (es(n), null);
              }
              if ((f || c.push([n, s]), l)) return (ed(t, c), t[n].apply(e, o));
              el(n, o);
              var d = t[n].apply(t, (0, D._)(o));
              return ("remove" === n
                ? t.off.call(e)
                : "setup" === n &&
                  (t.off.call(e),
                  t.off(s.events, null, t),
                  t.on.call(e, s.events, null, e),
                  t.on("all", function (n, i) {
                    if ("ready" === n) {
                      var o = Object.keys(t).filter(function (e) {
                          return "_" !== e[0] && -1 === r.indexOf(e) && "function" == typeof t[e];
                        }),
                        a = r.concat(o);
                      o.forEach(function (n) {
                        e[n] = eh(e, t, n, a, u);
                      });
                    }
                    (t.trigger.call(e, n, i), ed(t, c));
                  })),
              ed(t, c),
              d === t)
                ? e
                : d;
            };
          },
          ep = ["getMediaElement"],
          eD = function (e, t, n, r) {
            var u = Object.keys(n);
            u.forEach(function (i) {
              var o = n[i];
              -1 === ep.indexOf(i) &&
                ("function" == typeof o && "Events" !== i
                  ? (e[i] = eh(e, t, i, u, r))
                  : "_events" === i
                    ? (e._events = {})
                    : Object.defineProperty(e, i, {
                        enumerable: !0,
                        get: function () {
                          return n[i];
                        },
                      }));
            });
          },
          ev = function (e) {
            var t = {};
            (eD(this, e, e, t), eD(this, e, Q.prototype, t));
          },
          eg = window;
        Object.assign(W, er);
        var em = function (e) {
          var t = W(e);
          return t.uniqueId ? t._publicApi || (t._publicApi = new ev(t)) : t;
        };
        (Object.assign(em, er),
          G(em),
          "function" == typeof eg.define &&
            eg.define.amd &&
            eg.define([], function () {
              return em;
            }));
        var ey = em;
        eg.jwplayer && (ey = eg.jwplayer);
        let eA = ey;
      },
      3277(e, t, n) {
        "use strict";
        n.d(t, { fL: () => D, Ay: () => v, F3: () => p });
        var r = n(1374),
          u = n(1635),
          i = n(1642),
          o = n(8253),
          a = n(9621);
        let s = function () {
          this.load = function (e, t, n, r) {
            return n && (void 0 === n ? "undefined" : (0, i._)(n)) === "object"
              ? Promise.all(
                  Object.keys(n)
                    .filter(function (e) {
                      return e;
                    })
                    .map(function (u) {
                      var i = n[u];
                      return t
                        .setupPlugin(u)
                        .then(function (t) {
                          if (!r.attributes._destroyed) return (0, a.ot)(t, i, e);
                        })
                        .catch(function (e) {
                          return (t.removePlugin(u), e.code) ? e : new o.Mk(null, (0, a.rE)(u), e);
                        });
                    }),
                )
              : Promise.resolve();
          };
        };
        var c = n(494),
          l = n(9407),
          f = n(1051),
          d = {},
          h = new ((function () {
            function e() {
              (0, c._)(this, e);
            }
            return (
              (0, l._)(e, [
                {
                  key: "setupPlugin",
                  value: function (e) {
                    var t = this.getPlugin(e);
                    return t ? t.promise : this.addPlugin(e).load();
                  },
                },
                {
                  key: "addPlugin",
                  value: function (e) {
                    var t = (0, a.dB)(e),
                      n = d[t];
                    return (n || ((n = new f.A(e)), (d[t] = n)), n);
                  },
                },
                {
                  key: "getPlugin",
                  value: function (e) {
                    return d[(0, a.dB)(e)];
                  },
                },
                {
                  key: "removePlugin",
                  value: function (e) {
                    delete d[(0, a.dB)(e)];
                  },
                },
                {
                  key: "getPlugins",
                  value: function () {
                    return d;
                  },
                },
              ]),
              e
            );
          })())(),
          p = function (e, t, n) {
            var r = h.addPlugin(e);
            r.js || r.registerPlugin(e, t, n);
          },
          D = function (e, t, n) {
            return (0, r._)(function () {
              var r, i, o;
              return (0, u.YH)(this, function (u) {
                return ((r = (0, a.dB)(e)), (i = h.getPlugin(r)))
                  ? (n.utils.logger.warn(
                      "'jwplayer/plugins/model JW Plugin \""
                        .concat(r, '" already loaded from "')
                        .concat(i.url, '". Ignoring "')
                        .concat(e, '."'),
                    ),
                    [2, (0, a.ot)(i, t, n)])
                  : ((o = e),
                    r === e && (o = (0, a.Gv)(e) || e),
                    [
                      2,
                      h.setupPlugin(o).then(function (e) {
                        return (0, a.ot)(e, t, n);
                      }),
                    ]);
              });
            })();
          };
        function v(e, t) {
          var n = e.get("plugins");
          return (
            (window.jwplayerPluginJsonp = p),
            (e.pluginLoader = e.pluginLoader || new s()).load(t, h, n, e).then(function (t) {
              if (!e.attributes._destroyed) return (delete window.jwplayerPluginJsonp, t);
            })
          );
        }
      },
      5445(e, t, n) {
        "use strict";
        n.d(t, { A: () => u });
        var r = n(8586);
        function u() {
          var e, t;
          return (
            (e = window),
            (t = document.location.search),
            e.location !== e.parent.location && (0, r.SM)(t, "isAMP")
          );
        }
      },
      3849(e, t, n) {
        "use strict";
        n.d(t, { A: () => u });
        var r = function () {
          return r._iframe;
        };
        ((r.mock = function (e) {
          r._iframe = e;
        }),
          (r.unmock = function () {
            r._iframe = r._original;
          }),
          (r._iframe = window.top !== window.self),
          (r._original = r._iframe));
        let u = r;
      },
      7069(e, t, n) {
        "use strict";
        n.d(t, { Ay: () => d, FE: () => c });
        var r = n(494),
          u = n(9407),
          i = n(9616),
          o = n(5293),
          a = n(4916),
          s = n(8253),
          c = 100013,
          l = "invalid",
          f = function (e) {
            try {
              var t,
                n,
                r,
                u = (0, i.Y)(e || "", (0, a.l)("NDh2aU1Cb0NHRG5hcDFRZQ==")).split("/");
              if (
                ((t = u[0]),
                "pro" === t && (t = "premium"),
                (0, o.A)(t)("setup") || (t = l),
                u.length > 2)
              ) {
                n = u[1];
                var s = parseInt(u[2], 10);
                s > 0 && (r = new Date()).setTime(s);
              }
            } catch (e) {
              t = l;
            }
            return { edition: t, token: n, expiration: r };
          };
        let d = (function () {
          function e(t) {
            ((0, r._)(this, e),
              (this.keyData = f(t)),
              (this.edition = function () {
                return this.keyData.edition;
              }),
              (this.token = function () {
                return this.keyData.token;
              }),
              (this.analyticsId = function () {
                return this.keyData.token;
              }),
              (this.expiration = function () {
                return this.keyData.expiration;
              }),
              (this.duration = function () {
                return this.keyData.expiration
                  ? this.keyData.expiration.getTime() - new Date().getTime()
                  : 0;
              }),
              (this.error = function () {
                var e;
                return (
                  void 0 === t
                    ? (e = 100011)
                    : this.keyData.edition !== l && this.keyData.token
                      ? 0 > this.duration() && (e = c)
                      : (e = 100012),
                  e ? new s.Mk(s.kM, e) : null
                );
              }));
          }
          return (
            (0, u._)(e, null, [
              {
                key: "getAnalyticsId",
                value: function (e) {
                  if (e) return f(e).token;
                },
              },
            ]),
            e
          );
        })();
      },
      6068(e, t, n) {
        "use strict";
        n.d(t, { E: () => i });
        var r = n(3849),
          u = function (e) {
            var t = document.createElement("a");
            return ((t.href = e), t);
          },
          i = function () {
            var e = window.location.host;
            if ((0, r.A)()) {
              e = (document.referrer ? u(document.referrer) : {}).host;
              try {
                e = e || window.top.location.host;
              } catch (e) {}
            }
            return e;
          };
      },
      9616(e, t, n) {
        "use strict";
        n.d(t, { Y: () => a });
        var r = n(4916),
          u = function (e) {
            try {
              return decodeURIComponent(escape(e));
            } catch (t) {
              return e;
            }
          },
          i = function (e) {
            for (var t = Array(Math.ceil(e.length / 4)), n = 0; n < t.length; n++)
              t[n] =
                e.charCodeAt(4 * n) +
                (e.charCodeAt(4 * n + 1) << 8) +
                (e.charCodeAt(4 * n + 2) << 16) +
                (e.charCodeAt(4 * n + 3) << 24);
            return t;
          },
          o = function (e) {
            for (var t = Array(e.length), n = 0; n < e.length; n++)
              t[n] = String.fromCharCode(
                255 & e[n],
                (e[n] >>> 8) & 255,
                (e[n] >>> 16) & 255,
                (e[n] >>> 24) & 255,
              );
            return t.join("");
          },
          a = function (e, t) {
            if (((e = String(e)), (t = String(t)), 0 === e.length)) return "";
            for (
              var n,
                a,
                s = i((0, r.l)(e)),
                c = i(unescape(encodeURIComponent(t)).slice(0, 16)),
                l = s.length,
                f = s[l - 1],
                d = s[0],
                h = 0x9e3779b9 * Math.floor(6 + 52 / l);
              h;
            ) {
              a = (h >>> 2) & 3;
              for (var p = l - 1; p >= 0; p--)
                ((n =
                  ((((f = s[p > 0 ? p - 1 : l - 1]) >>> 5) ^ (d << 2)) + ((d >>> 3) ^ (f << 4))) ^
                  ((h ^ d) + (c[(3 & p) ^ a] ^ f))),
                  (d = s[p] -= n));
              h -= 0x9e3779b9;
            }
            return u(o(s).replace(/\0+$/, ""));
          };
      },
      7835(e, t, n) {
        "use strict";
        function r(e, t) {
          (null == t || t > e.length) && (t = e.length);
          for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
          return r;
        }
        n.d(t, { _: () => r });
      },
      6184(e, t, n) {
        "use strict";
        function r(e) {
          if (void 0 === e)
            throw ReferenceError("this hasn't been initialised - super() hasn't been called");
          return e;
        }
        n.d(t, { _: () => r });
      },
      1374(e, t, n) {
        "use strict";
        function r(e, t, n, r, u, i, o) {
          try {
            var a = e[i](o),
              s = a.value;
          } catch (e) {
            n(e);
            return;
          }
          a.done ? t(s) : Promise.resolve(s).then(r, u);
        }
        function u(e) {
          return function () {
            var t = this,
              n = arguments;
            return new Promise(function (u, i) {
              var o = e.apply(t, n);
              function a(e) {
                r(o, u, i, a, s, "next", e);
              }
              function s(e) {
                r(o, u, i, a, s, "throw", e);
              }
              a(void 0);
            });
          };
        }
        n.d(t, { _: () => u });
      },
      4880(e, t, n) {
        "use strict";
        n.d(t, { _: () => o });
        var r = n(3239),
          u = n(6732),
          i = n(9029);
        function o(e, t, n) {
          return (
            (t = (0, r._)(t)),
            (0, i._)(
              e,
              (0, u._)() ? Reflect.construct(t, n || [], (0, r._)(e).constructor) : t.apply(e, n),
            )
          );
        }
      },
      494(e, t, n) {
        "use strict";
        function r(e, t) {
          if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
        }
        n.d(t, { _: () => r });
      },
      9407(e, t, n) {
        "use strict";
        function r(e, t) {
          for (var n = 0; n < t.length; n++) {
            var r = t[n];
            ((r.enumerable = r.enumerable || !1),
              (r.configurable = !0),
              "value" in r && (r.writable = !0),
              Object.defineProperty(e, r.key, r));
          }
        }
        function u(e, t, n) {
          return (t && r(e.prototype, t), n && r(e, n), e);
        }
        n.d(t, { _: () => u });
      },
      467(e, t, n) {
        "use strict";
        function r(e, t, n) {
          return (
            t in e
              ? Object.defineProperty(e, t, {
                  value: n,
                  enumerable: !0,
                  configurable: !0,
                  writable: !0,
                })
              : (e[t] = n),
            e
          );
        }
        n.d(t, { _: () => r });
      },
      464(e, t, n) {
        "use strict";
        n.d(t, { _: () => u });
        var r = n(3239);
        function u(e, t, n) {
          return (u =
            "u" > typeof Reflect && Reflect.get
              ? Reflect.get
              : function (e, t, n) {
                  var u = (function (e, t) {
                    for (
                      ;
                      !Object.prototype.hasOwnProperty.call(e, t) && null !== (e = (0, r._)(e));
                    );
                    return e;
                  })(e, t);
                  if (u) {
                    var i = Object.getOwnPropertyDescriptor(u, t);
                    return i.get ? i.get.call(n || e) : i.value;
                  }
                })(e, t, n || e);
        }
      },
      3239(e, t, n) {
        "use strict";
        function r(e) {
          return (r = Object.setPrototypeOf
            ? Object.getPrototypeOf
            : function (e) {
                return e.__proto__ || Object.getPrototypeOf(e);
              })(e);
        }
        n.d(t, { _: () => r });
      },
      884(e, t, n) {
        "use strict";
        n.d(t, { _: () => u });
        var r = n(6467);
        function u(e, t) {
          if ("function" != typeof t && null !== t)
            throw TypeError("Super expression must either be null or a function");
          ((e.prototype = Object.create(t && t.prototype, {
            constructor: { value: e, writable: !0, configurable: !0 },
          })),
            t && (0, r._)(e, t));
        }
      },
      3750(e, t, n) {
        "use strict";
        function r(e, t) {
          return null != t && "u" > typeof Symbol && t[Symbol.hasInstance]
            ? !!t[Symbol.hasInstance](e)
            : e instanceof t;
        }
        n.d(t, { _: () => r });
      },
      6732(e, t, n) {
        "use strict";
        function r() {
          try {
            var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
          } catch (e) {}
          return (r = function () {
            return !!e;
          })();
        }
        n.d(t, { _: () => r });
      },
      1893(e, t, n) {
        "use strict";
        n.d(t, { _: () => u });
        var r = n(467);
        function u(e) {
          for (var t = 1; t < arguments.length; t++) {
            var n = null != arguments[t] ? arguments[t] : {},
              u = Object.keys(n);
            ("function" == typeof Object.getOwnPropertySymbols &&
              (u = u.concat(
                Object.getOwnPropertySymbols(n).filter(function (e) {
                  return Object.getOwnPropertyDescriptor(n, e).enumerable;
                }),
              )),
              u.forEach(function (t) {
                (0, r._)(e, t, n[t]);
              }));
          }
          return e;
        }
      },
      5456(e, t, n) {
        "use strict";
        function r(e, t) {
          return (
            (t = null != t ? t : {}),
            Object.getOwnPropertyDescriptors
              ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t))
              : (function (e, t) {
                  var n = Object.keys(e);
                  if (Object.getOwnPropertySymbols) {
                    var r = Object.getOwnPropertySymbols(e);
                    n.push.apply(n, r);
                  }
                  return n;
                })(Object(t)).forEach(function (n) {
                  Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(t, n));
                }),
            e
          );
        }
        n.d(t, { _: () => r });
      },
      9029(e, t, n) {
        "use strict";
        n.d(t, { _: () => i });
        var r = n(6184),
          u = n(1642);
        function i(e, t) {
          return t && ("object" === (0, u._)(t) || "function" == typeof t) ? t : (0, r._)(e);
        }
      },
      6467(e, t, n) {
        "use strict";
        function r(e, t) {
          return (r =
            Object.setPrototypeOf ||
            function (e, t) {
              return ((e.__proto__ = t), e);
            })(e, t);
        }
        n.d(t, { _: () => r });
      },
      3827(e, t, n) {
        "use strict";
        n.d(t, { _: () => u });
        var r = n(5134);
        function u(e, t) {
          return (
            (function (e) {
              if (Array.isArray(e)) return e;
            })(e) ||
            (function (e, t) {
              var n,
                r,
                u =
                  null == e ? null : ("u" > typeof Symbol && e[Symbol.iterator]) || e["@@iterator"];
              if (null != u) {
                var i = [],
                  o = !0,
                  a = !1;
                try {
                  for (
                    u = u.call(e);
                    !(o = (n = u.next()).done) && (i.push(n.value), !t || i.length !== t);
                    o = !0
                  );
                } catch (e) {
                  ((a = !0), (r = e));
                } finally {
                  try {
                    o || null == u.return || u.return();
                  } finally {
                    if (a) throw r;
                  }
                }
                return i;
              }
            })(e, t) ||
            (0, r._)(e, t) ||
            (function () {
              throw TypeError(
                "Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.",
              );
            })()
          );
        }
      },
      478(e, t, n) {
        "use strict";
        n.d(t, { _: () => i });
        var r = n(7835),
          u = n(5134);
        function i(e) {
          return (
            (function (e) {
              if (Array.isArray(e)) return (0, r._)(e);
            })(e) ||
            (function (e) {
              if (("u" > typeof Symbol && null != e[Symbol.iterator]) || null != e["@@iterator"])
                return Array.from(e);
            })(e) ||
            (0, u._)(e) ||
            (function () {
              throw TypeError(
                "Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.",
              );
            })()
          );
        }
      },
      1642(e, t, n) {
        "use strict";
        function r(e) {
          return e && "u" > typeof Symbol && e.constructor === Symbol ? "symbol" : typeof e;
        }
        n.d(t, { _: () => r });
      },
      5134(e, t, n) {
        "use strict";
        n.d(t, { _: () => u });
        var r = n(7835);
        function u(e, t) {
          if (e) {
            if ("string" == typeof e) return (0, r._)(e, t);
            var n = Object.prototype.toString.call(e).slice(8, -1);
            if (
              ("Object" === n && e.constructor && (n = e.constructor.name),
              "Map" === n || "Set" === n)
            )
              return Array.from(n);
            if ("Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
              return (0, r._)(e, t);
          }
        }
      },
      1635(e, t, n) {
        "use strict";
        n.d(t, { YH: () => r });
        function r(e, t) {
          var n,
            r,
            u,
            i = {
              label: 0,
              sent: function () {
                if (1 & u[0]) throw u[1];
                return u[1];
              },
              trys: [],
              ops: [],
            },
            o = Object.create(("function" == typeof Iterator ? Iterator : Object).prototype);
          return (
            (o.next = a(0)),
            (o.throw = a(1)),
            (o.return = a(2)),
            "function" == typeof Symbol &&
              (o[Symbol.iterator] = function () {
                return this;
              }),
            o
          );
          function a(a) {
            return function (s) {
              var c = [a, s];
              if (n) throw TypeError("Generator is already executing.");
              for (; o && ((o = 0), c[0] && (i = 0)), i; )
                try {
                  if (
                    ((n = 1),
                    r &&
                      (u =
                        2 & c[0]
                          ? r.return
                          : c[0]
                            ? r.throw || ((u = r.return) && u.call(r), 0)
                            : r.next) &&
                      !(u = u.call(r, c[1])).done)
                  )
                    return u;
                  switch (((r = 0), u && (c = [2 & c[0], u.value]), c[0])) {
                    case 0:
                    case 1:
                      u = c;
                      break;
                    case 4:
                      return (i.label++, { value: c[1], done: !1 });
                    case 5:
                      (i.label++, (r = c[1]), (c = [0]));
                      continue;
                    case 7:
                      ((c = i.ops.pop()), i.trys.pop());
                      continue;
                    default:
                      if (
                        !(u = (u = i.trys).length > 0 && u[u.length - 1]) &&
                        (6 === c[0] || 2 === c[0])
                      ) {
                        i = 0;
                        continue;
                      }
                      if (3 === c[0] && (!u || (c[1] > u[0] && c[1] < u[3]))) {
                        i.label = c[1];
                        break;
                      }
                      if (6 === c[0] && i.label < u[1]) {
                        ((i.label = u[1]), (u = c));
                        break;
                      }
                      if (u && i.label < u[2]) {
                        ((i.label = u[2]), i.ops.push(c));
                        break;
                      }
                      (u[2] && i.ops.pop(), i.trys.pop());
                      continue;
                  }
                  c = t.call(e, i);
                } catch (e) {
                  ((c = [6, e]), (r = 0));
                } finally {
                  n = u = 0;
                }
              if (5 & c[0]) throw c[1];
              return { value: c[0] ? c[1] : void 0, done: !0 };
            };
          }
        }
      },
    },
    a = {};
  function s(e) {
    var t = a[e];
    if (void 0 !== t) return t.exports;
    var n = (a[e] = { id: e, loaded: !1, exports: {} });
    return (o[e].call(n.exports, n, n.exports, s), (n.loaded = !0), n.exports);
  }
  ((s.m = o),
    (s.n = (e) => {
      var t = e && e.__esModule ? () => e.default : () => e;
      return (s.d(t, { a: t }), t);
    }),
    (t = Object.getPrototypeOf ? (e) => Object.getPrototypeOf(e) : (e) => e.__proto__),
    (s.t = function (n, r) {
      if (
        (1 & r && (n = this(n)),
        8 & r ||
          ("object" == typeof n &&
            n &&
            ((4 & r && n.__esModule) || (16 & r && "function" == typeof n.then))))
      )
        return n;
      var u = Object.create(null);
      s.r(u);
      var i = {};
      e = e || [null, t({}), t([]), t(t)];
      for (
        var o = 2 & r && n;
        ("object" == typeof o || "function" == typeof o) && !~e.indexOf(o);
        o = t(o)
      )
        Object.getOwnPropertyNames(o).forEach((e) => {
          i[e] = () => n[e];
        });
      return ((i.default = () => n), s.d(u, i), u);
    }),
    (s.d = (e, t) => {
      for (var n in t)
        s.o(t, n) && !s.o(e, n) && Object.defineProperty(e, n, { enumerable: !0, get: t[n] });
    }),
    (s.f = {}),
    (s.e = (e) => Promise.all(Object.keys(s.f).reduce((t, n) => (s.f[n](e, t), t), []))),
    (s.u = (e) =>
      "" +
      {
        114: "jwplayer.controls.tizen",
        157: "provider.airplay",
        217: "provider.hlsjs",
        300: "jwplayer.controls",
        305: "jwplayer.core.controls.polyfills.html5",
        430: "polyfills.webvtt",
        463: "vttparser",
        517: "jwplayer.core.controls",
        547: "provider.html5",
        588: "provider.cast",
        59: "jwplayer.core.controls.html5",
        605: "provider.shaka",
        663: "jwplayer.core.controls.polyfills",
        666: "polyfills.intersection-observer",
        738: "jwplayer.amp",
        761: "related",
        895: "jwplayer.stats",
        905: "jwplayer.core",
      }[e] +
      ".js"),
    (s.o = (e, t) => Object.prototype.hasOwnProperty.call(e, t)),
    (n = {}),
    (s.l = function (e, t, r, u) {
      if (n[e]) return void n[e].push(t);
      if (void 0 !== r)
        for (var i, o, a = document.getElementsByTagName("script"), c = 0; c < a.length; c++) {
          var l = a[c];
          if (l.getAttribute("src") == e || l.getAttribute("data-rspack") == "jwplayer:" + r) {
            i = l;
            break;
          }
        }
      (i ||
        ((o = !0),
        ((i = document.createElement("script")).timeout = 55),
        s.nc && i.setAttribute("nonce", s.nc),
        i.setAttribute("data-rspack", "jwplayer:" + r),
        (i.src = e)),
        (n[e] = [t]));
      var f = function (t, r) {
          ((i.onerror = i.onload = null), clearTimeout(d));
          var u = n[e];
          if (
            (delete n[e],
            i.parentNode && i.parentNode.removeChild(i),
            u &&
              u.forEach(function (e) {
                return e(r);
              }),
            t)
          )
            return t(r);
        },
        d = setTimeout(f.bind(null, void 0, { type: "timeout", target: i }), 55e3);
      ((i.onerror = f.bind(null, i.onerror)),
        (i.onload = f.bind(null, i.onload)),
        o && document.head.appendChild(i));
    }),
    (s.r = (e) => {
      ("u" > typeof Symbol &&
        Symbol.toStringTag &&
        Object.defineProperty(e, Symbol.toStringTag, { value: "Module" }),
        Object.defineProperty(e, "__esModule", { value: !0 }));
    }),
    (s.nmd = (e) => ((e.paths = []), e.children || (e.children = []), e)),
    (s.nc = void 0),
    (s.p = ""),
    (r = { 470: 0 }),
    (s.f.j = function (e, t) {
      var n = s.o(r, e) ? r[e] : void 0;
      if (0 !== n)
        if (n) t.push(n[2]);
        else {
          var u = new Promise((t, u) => (n = r[e] = [t, u]));
          t.push((n[2] = u));
          var i = s.p + s.u(e),
            o = Error();
          s.l(
            i,
            function (t) {
              if (s.o(r, e) && (0 !== (n = r[e]) && (r[e] = void 0), n)) {
                var u = t && ("load" === t.type ? "missing" : t.type),
                  i = t && t.target && t.target.src;
                ((o.message = "Loading chunk " + e + " failed.\n(" + u + ": " + i + ")"),
                  (o.name = "ChunkLoadError"),
                  (o.type = u),
                  (o.request = i),
                  n[1](o));
              }
            },
            "chunk-" + e,
            e,
          );
        }
    }),
    (u = (e, t) => {
      var n,
        u,
        i = t[0],
        o = t[1],
        a = t[2],
        c = 0;
      if (i.some((e) => 0 !== r[e])) {
        for (n in o) s.o(o, n) && (s.m[n] = o[n]);
        a && a(s);
      }
      for (e && e(t); c < i.length; c++) ((u = i[c]), s.o(r, u) && r[u] && r[u][0](), (r[u] = 0));
    }),
    (i = self.webpackChunkjwplayer = self.webpackChunkjwplayer || []).forEach(u.bind(null, 0)),
    (i.push = u.bind(null, i.push.bind(i))));
  var c = s(3787);
  window.jwplayer = c.default;
})();

var jwDefaults = {
  aspectratio: "16:9",
  autostart: true,
  cast: {},
  controls: true,
  displaydescription: true,
  displaytitle: true,
  height: 360,
  key: "4y3vuHPkbjVY4XFud2rkZy8kgjRP2ve1wb5ZhEs9OIUk9PbbvaWE7NKQ4bVrvJ7+",
  mute: false,
  ph: 1,
  pid: "KB5zFt7A",
  playbackRateControls: false,
  preload: "metadata",
  repeat: false,
  stretching: "uniform",
  width: "100%",
};
jwplayer.defaults = jwDefaults;
