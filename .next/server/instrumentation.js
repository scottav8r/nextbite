"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "instrumentation";
exports.ids = ["instrumentation"];
exports.modules = {

/***/ "(instrument)/./instrumentation.ts":
/*!****************************!*\
  !*** ./instrumentation.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   register: () => (/* binding */ register)\n/* harmony export */ });\n/**\n * Next.js 15 instrumentation hook.\n * Initializes Sentry for both Node.js (server) and Edge runtimes.\n * Ref: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation\n */ async function register() {\n    if (true) {\n        const { init } = await Promise.all(/*! import() */[__webpack_require__.e(\"vendor-chunks/@opentelemetry\"), __webpack_require__.e(\"vendor-chunks/next\"), __webpack_require__.e(\"vendor-chunks/@sentry\"), __webpack_require__.e(\"vendor-chunks/@prisma\"), __webpack_require__.e(\"vendor-chunks/semver\"), __webpack_require__.e(\"vendor-chunks/resolve\"), __webpack_require__.e(\"vendor-chunks/color-convert\"), __webpack_require__.e(\"vendor-chunks/chalk\"), __webpack_require__.e(\"vendor-chunks/is-core-module\"), __webpack_require__.e(\"vendor-chunks/forwarded-parse\"), __webpack_require__.e(\"vendor-chunks/color-name\"), __webpack_require__.e(\"vendor-chunks/ansi-styles\"), __webpack_require__.e(\"vendor-chunks/stacktrace-parser\"), __webpack_require__.e(\"vendor-chunks/shimmer\"), __webpack_require__.e(\"vendor-chunks/supports-color\"), __webpack_require__.e(\"vendor-chunks/function-bind\"), __webpack_require__.e(\"vendor-chunks/path-parse\"), __webpack_require__.e(\"vendor-chunks/@swc\"), __webpack_require__.e(\"vendor-chunks/has-flag\"), __webpack_require__.e(\"vendor-chunks/hasown\"), __webpack_require__.e(\"_instrument_node_modules_opentelemetry_instrumentation-http_node_modules_opentelemetry_instru-282e6c\")]).then(__webpack_require__.t.bind(__webpack_require__, /*! @sentry/nextjs */ \"(instrument)/./node_modules/@sentry/nextjs/build/cjs/index.server.js\", 23));\n        init({\n            dsn: \"\",\n            environment: \"development\",\n            tracesSampleRate:  false ? 0 : 1.0,\n            // Strip PII from error payloads\n            beforeSend (event) {\n                if (event.user) {\n                    delete event.user.email;\n                    delete event.user.username;\n                    delete event.user.ip_address;\n                }\n                return event;\n            }\n        });\n    }\n    if (false) {}\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGluc3RydW1lbnQpLy4vaW5zdHJ1bWVudGF0aW9uLnRzIiwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7OztDQUlDLEdBRU0sZUFBZUE7SUFDcEIsSUFBSUMsSUFBcUMsRUFBRTtRQUN6QyxNQUFNLEVBQUVHLElBQUksRUFBRSxHQUFHLE1BQU0sdXlDQUF3QjtRQUMvQ0EsS0FBSztZQUNIQyxLQUFLSixFQUFrQztZQUN2Q00sYUFYTjtZQVlNQyxrQkFBa0JQLE1BQXFDLEdBQUcsQ0FBRyxHQUFHO1lBQ2hFLGdDQUFnQztZQUNoQ1EsWUFBV0MsS0FBSztnQkFDZCxJQUFJQSxNQUFNQyxJQUFJLEVBQUU7b0JBQ2QsT0FBT0QsTUFBTUMsSUFBSSxDQUFDQyxLQUFLO29CQUN2QixPQUFPRixNQUFNQyxJQUFJLENBQUNFLFFBQVE7b0JBQzFCLE9BQU9ILE1BQU1DLElBQUksQ0FBQ0csVUFBVTtnQkFDOUI7Z0JBQ0EsT0FBT0o7WUFDVDtRQUNGO0lBQ0Y7SUFFQSxJQUFJVCxLQUFtQyxFQUFFLEVBZXhDO0FBQ0giLCJzb3VyY2VzIjpbIi9Vc2Vycy9TY290dC1QZXJzb25hbC9Eb2N1bWVudHMvS2lyby9uZXh0Yml0ZS9hcHAvaW5zdHJ1bWVudGF0aW9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogTmV4dC5qcyAxNSBpbnN0cnVtZW50YXRpb24gaG9vay5cbiAqIEluaXRpYWxpemVzIFNlbnRyeSBmb3IgYm90aCBOb2RlLmpzIChzZXJ2ZXIpIGFuZCBFZGdlIHJ1bnRpbWVzLlxuICogUmVmOiBodHRwczovL25leHRqcy5vcmcvZG9jcy9hcHAvYnVpbGRpbmcteW91ci1hcHBsaWNhdGlvbi9vcHRpbWl6aW5nL2luc3RydW1lbnRhdGlvblxuICovXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWdpc3RlcigpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5FWFRfUlVOVElNRSA9PT0gJ25vZGVqcycpIHtcbiAgICBjb25zdCB7IGluaXQgfSA9IGF3YWl0IGltcG9ydCgnQHNlbnRyeS9uZXh0anMnKVxuICAgIGluaXQoe1xuICAgICAgZHNuOiBwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19TRU5UUllfRFNOLFxuICAgICAgZW52aXJvbm1lbnQ6IHByb2Nlc3MuZW52Lk5PREVfRU5WLFxuICAgICAgdHJhY2VzU2FtcGxlUmF0ZTogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJyA/IDAuMSA6IDEuMCxcbiAgICAgIC8vIFN0cmlwIFBJSSBmcm9tIGVycm9yIHBheWxvYWRzXG4gICAgICBiZWZvcmVTZW5kKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC51c2VyKSB7XG4gICAgICAgICAgZGVsZXRlIGV2ZW50LnVzZXIuZW1haWxcbiAgICAgICAgICBkZWxldGUgZXZlbnQudXNlci51c2VybmFtZVxuICAgICAgICAgIGRlbGV0ZSBldmVudC51c2VyLmlwX2FkZHJlc3NcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZXZlbnRcbiAgICAgIH0sXG4gICAgfSlcbiAgfVxuXG4gIGlmIChwcm9jZXNzLmVudi5ORVhUX1JVTlRJTUUgPT09ICdlZGdlJykge1xuICAgIGNvbnN0IHsgaW5pdCB9ID0gYXdhaXQgaW1wb3J0KCdAc2VudHJ5L25leHRqcycpXG4gICAgaW5pdCh7XG4gICAgICBkc246IHByb2Nlc3MuZW52Lk5FWFRfUFVCTElDX1NFTlRSWV9EU04sXG4gICAgICBlbnZpcm9ubWVudDogcHJvY2Vzcy5lbnYuTk9ERV9FTlYsXG4gICAgICB0cmFjZXNTYW1wbGVSYXRlOiAwLjEsXG4gICAgICBiZWZvcmVTZW5kKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC51c2VyKSB7XG4gICAgICAgICAgZGVsZXRlIGV2ZW50LnVzZXIuZW1haWxcbiAgICAgICAgICBkZWxldGUgZXZlbnQudXNlci51c2VybmFtZVxuICAgICAgICAgIGRlbGV0ZSBldmVudC51c2VyLmlwX2FkZHJlc3NcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZXZlbnRcbiAgICAgIH0sXG4gICAgfSlcbiAgfVxufVxuIl0sIm5hbWVzIjpbInJlZ2lzdGVyIiwicHJvY2VzcyIsImVudiIsIk5FWFRfUlVOVElNRSIsImluaXQiLCJkc24iLCJORVhUX1BVQkxJQ19TRU5UUllfRFNOIiwiZW52aXJvbm1lbnQiLCJ0cmFjZXNTYW1wbGVSYXRlIiwiYmVmb3JlU2VuZCIsImV2ZW50IiwidXNlciIsImVtYWlsIiwidXNlcm5hbWUiLCJpcF9hZGRyZXNzIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(instrument)/./instrumentation.ts\n");

/***/ }),

/***/ "async_hooks":
/*!******************************!*\
  !*** external "async_hooks" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("async_hooks");

/***/ }),

/***/ "child_process":
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "diagnostics_channel":
/*!**************************************!*\
  !*** external "diagnostics_channel" ***!
  \**************************************/
/***/ ((module) => {

module.exports = require("diagnostics_channel");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("events");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

module.exports = require("fs");

/***/ }),

/***/ "import-in-the-middle":
/*!***************************************!*\
  !*** external "import-in-the-middle" ***!
  \***************************************/
/***/ ((module) => {

module.exports = require("import-in-the-middle");

/***/ }),

/***/ "module":
/*!*************************!*\
  !*** external "module" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("module");

/***/ }),

/***/ "node:child_process":
/*!*************************************!*\
  !*** external "node:child_process" ***!
  \*************************************/
/***/ ((module) => {

module.exports = require("node:child_process");

/***/ }),

/***/ "node:diagnostics_channel":
/*!*******************************************!*\
  !*** external "node:diagnostics_channel" ***!
  \*******************************************/
/***/ ((module) => {

module.exports = require("node:diagnostics_channel");

/***/ }),

/***/ "node:fs":
/*!**************************!*\
  !*** external "node:fs" ***!
  \**************************/
/***/ ((module) => {

module.exports = require("node:fs");

/***/ }),

/***/ "node:http":
/*!****************************!*\
  !*** external "node:http" ***!
  \****************************/
/***/ ((module) => {

module.exports = require("node:http");

/***/ }),

/***/ "node:https":
/*!*****************************!*\
  !*** external "node:https" ***!
  \*****************************/
/***/ ((module) => {

module.exports = require("node:https");

/***/ }),

/***/ "node:inspector":
/*!*********************************!*\
  !*** external "node:inspector" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("node:inspector");

/***/ }),

/***/ "node:net":
/*!***************************!*\
  !*** external "node:net" ***!
  \***************************/
/***/ ((module) => {

module.exports = require("node:net");

/***/ }),

/***/ "node:os":
/*!**************************!*\
  !*** external "node:os" ***!
  \**************************/
/***/ ((module) => {

module.exports = require("node:os");

/***/ }),

/***/ "node:path":
/*!****************************!*\
  !*** external "node:path" ***!
  \****************************/
/***/ ((module) => {

module.exports = require("node:path");

/***/ }),

/***/ "node:readline":
/*!********************************!*\
  !*** external "node:readline" ***!
  \********************************/
/***/ ((module) => {

module.exports = require("node:readline");

/***/ }),

/***/ "node:stream":
/*!******************************!*\
  !*** external "node:stream" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("node:stream");

/***/ }),

/***/ "node:tls":
/*!***************************!*\
  !*** external "node:tls" ***!
  \***************************/
/***/ ((module) => {

module.exports = require("node:tls");

/***/ }),

/***/ "node:util":
/*!****************************!*\
  !*** external "node:util" ***!
  \****************************/
/***/ ((module) => {

module.exports = require("node:util");

/***/ }),

/***/ "node:worker_threads":
/*!**************************************!*\
  !*** external "node:worker_threads" ***!
  \**************************************/
/***/ ((module) => {

module.exports = require("node:worker_threads");

/***/ }),

/***/ "node:zlib":
/*!****************************!*\
  !*** external "node:zlib" ***!
  \****************************/
/***/ ((module) => {

module.exports = require("node:zlib");

/***/ }),

/***/ "os":
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
/***/ ((module) => {

module.exports = require("os");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("path");

/***/ }),

/***/ "perf_hooks":
/*!*****************************!*\
  !*** external "perf_hooks" ***!
  \*****************************/
/***/ ((module) => {

module.exports = require("perf_hooks");

/***/ }),

/***/ "process":
/*!**************************!*\
  !*** external "process" ***!
  \**************************/
/***/ ((module) => {

module.exports = require("process");

/***/ }),

/***/ "require-in-the-middle":
/*!****************************************!*\
  !*** external "require-in-the-middle" ***!
  \****************************************/
/***/ ((module) => {

module.exports = require("require-in-the-middle");

/***/ }),

/***/ "tty":
/*!**********************!*\
  !*** external "tty" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("tty");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("util");

/***/ }),

/***/ "worker_threads":
/*!*********************************!*\
  !*** external "worker_threads" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("worker_threads");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("./webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("(instrument)/./instrumentation.ts"));
module.exports = __webpack_exports__;

})();