"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var radweb_1 = require("radweb");
var dialog_1 = require("../../select-popup/dialog");
var context_1 = require("../../shared/context");
var users_1 = require("../users");
var auth_service_1 = require("../../shared/auth/auth-service");
var UpdateInfoComponent = /** @class */ (function () {
    function UpdateInfoComponent(dialog, auth, context) {
        var _this = this;
        this.dialog = dialog;
        this.auth = auth;
        this.context = context;
        this.confirmPassword = new radweb_1.StringColumn({ caption: 'Confirm Password', inputType: 'password', value: users_1.Users.emptyPassword });
        this.helpers = this.context.for(users_1.Users).gridSettings({
            numOfColumnsInGrid: 0,
            allowUpdate: true,
            get: { where: function (h) { return h.id.isEqualTo(_this.auth.auth.info.helperId); } },
            columnSettings: function (h) { return [
                h.name,
                h.password,
                { column: _this.confirmPassword },
            ]; },
        });
    }
    UpdateInfoComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.helpers.getRecords().then(function () {
            if (!_this.helpers.currentRow.password.value)
                _this.confirmPassword.value = '';
        });
    };
    UpdateInfoComponent.prototype.register = function () {
        return __awaiter(this, void 0, void 0, function () {
            var passwordChanged, thePassword, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        passwordChanged = this.helpers.currentRow.password.value != this.helpers.currentRow.password.originalValue;
                        thePassword = this.helpers.currentRow.password.value;
                        if (!(this.helpers.currentRow.password.value != this.confirmPassword.value)) return [3 /*break*/, 1];
                        this.dialog.Error('Password doesn\'t match confirm password');
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.helpers.items[0].save()];
                    case 2:
                        _a.sent();
                        this.dialog.Info("Update saved - thanks");
                        this.confirmPassword.value = this.helpers.currentRow.password.value ? users_1.Users.emptyPassword : '';
                        if (passwordChanged) {
                            this.auth.signIn(this.helpers.currentRow.name.value, thePassword);
                        }
                        _a.label = 3;
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        err_1 = _a.sent();
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    UpdateInfoComponent = __decorate([
        core_1.Component({
            selector: 'app-update-info',
            templateUrl: './update-info.component.html',
            styleUrls: ['./update-info.component.scss']
        }),
        __metadata("design:paramtypes", [dialog_1.DialogService,
            auth_service_1.AuthService,
            context_1.Context])
    ], UpdateInfoComponent);
    return UpdateInfoComponent;
}());
exports.UpdateInfoComponent = UpdateInfoComponent;
//# sourceMappingURL=update-info.component.js.map