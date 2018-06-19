import axios, { AxiosAdapter, AxiosError, AxiosInstance, AxiosRequestConfig,
    AxiosResponse, Cancel, Canceler, CancelToken, CancelTokenSource} from "axios/index";
import {C8oCore, C8oException, C8oExceptionMessage, C8oFullSyncCbl, C8oLogger, C8oSettings} from "c8osdkjscore";
import {Observable} from "rxjs/Observable";
import {C8oHttpInterface} from "./c8oHttpInterface.service";

export class C8o extends C8oCore {

    constructor() {
        super();
        this._http = axios;
        this.data = null;
        this.c8oLogger = new C8oLogger(this, true);
    }

    public get sdkVersion(): string {
        return require("../../package.json").version;
    }
    public init(c8oSettings?: C8oSettings): Promise<any> {
        let nullableEndpoint = true;
        if (c8oSettings !== undefined) {
            if (c8oSettings.endpoint != null) {
                nullableEndpoint = false;
            }
        }
        if (nullableEndpoint) {
            this.promiseConstructor = new Promise((resolve) => {
                // if project is running into web browser served by convertigo
                // get the url from window.location
                if (window.location.href.indexOf("http") === 0 && window.location.href.indexOf("/DisplayObjects") !== -1) {
                    const n = window.location.href.indexOf("/DisplayObjects");
                    this.endpoint = window.location.href.substring(0, n);
                    resolve();
                } else {
                    let uri = "";
                    if (window.location.href.indexOf("file://") === 0) {
                        uri = (window.location.href.substring(0,
                            window.location.href.indexOf("/index.html"))) + "/env.json";
                    } else {
                        uri = window.location.origin + "/env.json";
                    }
                    this.httpPublic.get(uri)
                        .then((data) => {
                                this.data = data;
                                //noinspection TypeScriptUnresolvedVariable
                                const remoteBase = data["remoteBase"].toString();
                                const n = remoteBase.indexOf("/_private");
                                this.endpoint = remoteBase.substring(0, n);
                                this._automaticRemoveSplashsCreen = data["splashScreenRemoveMode"] !== "manual";
                                resolve();
                            }).catch((error) => {
                                alert("Missing env.json file");
                                let errMsg: string;
                                if (error instanceof Error) {
                                    errMsg = error.message;
                                } else {
                                    errMsg = `${error.status} - ${error.statusText || ""} ${error}`;
                                }
                                return Observable.throw(errMsg);
                            });
                }
            }).then(() => {
                this.extractendpoint();
            });
        } else {
            this.promiseConstructor = new Promise((resolve) => {
                this.endpoint = c8oSettings.endpoint;
                this.extractendpoint();
                resolve();
            });
        }

        this.promiseInit = Promise.all([this.promiseConstructor]).then(() => {
            return new Promise((resolve) => {
                this.copy(c8oSettings);

                this.httpInterface = new C8oHttpInterface(this);
                this.c8oLogger.affect_val(this, false);
                this.c8oLogger.logRemoteInit();

                document.addEventListener("offline", () => {
                    this.c8oLogger.info("Network offline");
                    this.c8oLogger.info("Setting remote logs to false");
                    this.logRemote = false;
                    if (this.logOnFail != null) {
                        this.logOnFail(new C8oException(C8oExceptionMessage.RemoteLogFail()), null);
                    }
                }, false);
                document.addEventListener("online", () => {
                    this.log.info("Network online");
                    if (this._initialLogRemote && !this.logRemote) {
                        this.logRemote = true;
                        this.log.info("Setting remote logs to true");
                    }
                }, false);

                this.c8oLogger.logMethodCall("C8o Constructor");
                this.c8oFullSync = new C8oFullSyncCbl(this);
                resolve();
            });
        });
        return this.promiseInit;
    }

    /**
     * This should be called OnPlatform Ready to remove splashscreen if necessary
     *
     */
    public finalizeInit(): Promise<any> {
        this.promiseFinInit = new Promise((resolve) => {
            Promise.all([this.promiseInit]).then(() => {
                /**
                 * Looking for splashScreen timeOut
                 */
                if (this._automaticRemoveSplashsCreen) {
                    if (navigator["splashscreen"] !== undefined) {
                        navigator["splashscreen"].hide();
                    }
                }
                /**
                 * Looking for cblite
                 */
                if (window["cblite"] !== undefined) {
                    window["cblite"].getURL((err, url) => {
                        if (err) {
                            resolve();
                        } else {
                            url = url.replace(new RegExp("/$"), "");
                            this.couchUrl = url;
                            resolve();
                        }
                    });
                } else {
                    resolve();
                }
            });
        });
        return this.promiseFinInit;
    }
}
