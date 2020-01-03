"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_extra_1 = __importDefault(require("fs-extra"));
var readline_1 = __importDefault(require("readline"));
var path_1 = __importDefault(require("path"));
// @ts-ignore
var nzh_1 = __importDefault(require("nzh"));
var rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout,
});
function readLogFileData(file) {
    return __awaiter(this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs_extra_1.default.readFile(file)];
                case 1:
                    data = _a.sent();
                    return [2 /*return*/, data
                            .toString()
                            .split(path_1.default.basename(file).split(".")[0] || Date.now() + "")];
            }
        });
    });
}
function getFilesInDir(dir) {
    return __awaiter(this, void 0, void 0, function () {
        var d;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs_extra_1.default.readdir(dir)];
                case 1:
                    d = _a.sent();
                    return [2 /*return*/, d.map(function (one) { return path_1.default.join(dir, one); })];
            }
        });
    });
}
function combineLogFiles(files) {
    return __awaiter(this, void 0, void 0, function () {
        var fileStr;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("combine logs", files.map(function (file) { return path_1.default.basename(file); }));
                    return [4 /*yield*/, Promise.all(files.map(readLogFileData))];
                case 1:
                    fileStr = _a.sent();
                    return [2 /*return*/, fileStr.reduce(function (acc, b) {
                            return acc.concat(b);
                        })];
            }
        });
    });
}
function readAllLogsFile() {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = combineLogFiles;
                    return [4 /*yield*/, getFilesInDir("./logs")];
                case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent()])];
            }
        });
    });
}
function createIgnoreStrMatch(str) {
    return new RegExp(str, "i");
}
function allRegMatchStr(reg) {
    return function (str) {
        var testResult = !reg.some(function (oneReg) {
            return !oneReg.test(str);
        });
        // console.log("testing", str, testResult);
        return testResult;
    };
}
function searchKeywordsInData(data) {
    return function searchKeywords(props) {
        console.log("searching... ", props);
        var reg = props.map(createIgnoreStrMatch);
        console.log("use regexp:", reg);
        var result = data
            .filter(allRegMatchStr(reg))
            .map(function (one) { return one.trim(); })
            .filter(function (one) { return !!one; });
        // console.log("search result", result);
        return result;
    };
}
function handleSearchingWith(searchKeywords) {
    console.log("\n请输入关键字搜索, 回车确定:");
    rl.on("line", function (input) {
        var inputData = input.split(" ").filter(function (one) { return !!one; });
        var result = searchKeywords(inputData);
        fs_extra_1.default.writeFile("./output.log", "\u7ED3\u679C: " + nzh_1.default.cn.encodeS(result.length) + " \u6761\u65E5\u5FD7\n" + result.join("\n")).then(function () {
            console.log("\u7ED3\u679C: " + nzh_1.default.cn.encodeS(result.length) + " \u6761\u65E5\u5FD7");
        });
    });
}
function start() {
    return __awaiter(this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, readAllLogsFile()];
                case 1:
                    data = _a.sent();
                    console.log("文件解析完成");
                    handleSearchingWith(searchKeywordsInData(data));
                    return [2 /*return*/];
            }
        });
    });
}
start();
