import {C8oHttpInterfaceCore} from "c8osdkjscore/src/c8o/c8oHttpInterfaceCore";
import {C8oProgress} from "c8osdkjscore/src/c8o/c8oProgress";
import {C8oResponseJsonListener, C8oResponseListener} from "c8osdkjscore/src/c8o/c8oResponse";
import {C8oExceptionMessage} from "c8osdkjscore/src/c8o/Exception/c8oExceptionMessage";
import {C8oHttpRequestException} from "c8osdkjscore/src/c8o/Exception/c8oHttpRequestException";
import {C8o} from "./c8o.service";

export class C8oHttpInterface extends C8oHttpInterfaceCore {
    constructor(c8o: C8o) {
        super(c8o);
    }

    /**
     * Check type of file given in parameters
     * 0 : No file to upload
     * 1 : FileList Or File
     * 2 : url when running in cordova
     * @param {Object} parameters
     * @return {number}
     */
    public checkFile(parameters: any): number {
        for (const p in parameters) {
            if (parameters[p] instanceof Array) {
                for (const p1 in parameters[p]) {
                    //noinspection JSUnfilteredForInLoop
                    if (parameters[p][p1] instanceof FileList) {
                        return 1;
                    } else if (parameters[p][p1] instanceof File) {
                        return 1;
                    } else if (this.isCordova()) {
                        if (parameters[p][p1] instanceof URL) {
                            return 2;
                        }
                    }
                }
            } else {
                if (parameters[p] instanceof FileList) {
                    return 1;
                } else if (parameters[p] instanceof File) {
                    return 1;
                } else if (this.isCordova()) {
                    if (parameters[p] instanceof URL) {
                        return 2;
                    }
                }
            }
        }
        return 0;
    }

    /**
     * Url encode parameters
     * @param {Object} parameters
     * @return {string}
     */
    public transformRequest(parameters: any): string {
        const str = [];
        for (const p in parameters) {
            if (parameters[p] instanceof Array) {
                for (const p1 in parameters[p]) {
                    if (parameters[p].hasOwnProperty(p1)) {
                        //noinspection JSUnfilteredForInLoop
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(parameters[p][p1]));
                    }
                }
            } else {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(parameters[p]));
            }
        }
        const query = str.join("&");
        // Add this to instruct Convertigo server to remove any name space in the jSON keys
        // to prevent keys like this:  'namespace:key'
        return (query + "&__removeNamespaces=true");
    }

    /**
     * Transform FormData parameters
     * @param {Object} parameters
     * @return {FormData}
     */
    public transformRequestformdata(parameters: any): FormData {
        const formdata: FormData = new FormData();
        for (const p in parameters) {
            if (parameters[p] instanceof Array) {
                for (const p1 in parameters[p]) {
                    if (parameters[p][p1] instanceof FileList) {
                        for (const i of parameters[p][p1]) {
                            formdata.append(p, parameters[p][p1][i], parameters[p][p1][i].name);
                        }
                    } else {
                        formdata.append(p, parameters[p][p1]);
                    }
                }
            } else {
                if (parameters[p] instanceof FileList) {
                    for (const j of parameters[p]) {
                        formdata.append(p, j, j["name"]);
                    }
                } else {
                    formdata.append(p, parameters[p]);
                }
            }
        }
        return formdata;
    }

    /**
     * Extract file from parameters and return and array containing a file and params
     * @param {Object} parameters
     * @return {any}
     */
    public transformRequestfileNative(parameters: any): any {
        const file: any[] = new Array();
        const params: any = new Object();
        for (const p in parameters) {
            if (parameters[p] instanceof Array) {
                for (const p1 in parameters[p]) {
                    if (parameters[p][p1] instanceof URL) {
                        file.push([p1, parameters[p][p1]]);
                    } else {
                        params[p1] = parameters[p][p1]["href"];
                    }
                }
            } else {
                if (parameters[p] instanceof URL) {
                    file.push([p, parameters[p]["href"]]);
                } else {
                    params[p] = parameters[p];
                }
            }
        }
        return [file, params];
    }

    /**
     * Handle the request
     * @param {string} url
     * @param {Object} parameters
     * @param {C8oResponseListener} c8oResponseListener
     * @return {Promise<any>}
     */
    public async handleRequest(url: string, parameters: any, c8oResponseListener?: C8oResponseListener): Promise<any> {
        if (parameters["__sequence"] !== undefined) {
            if (parameters["__sequence"].indexOf("#") !== -1) {
                parameters["__sequence"] = parameters["__sequence"].substring(0, parameters["__sequence"].indexOf("#"));
            }
        }
        switch (this.checkFile(parameters)) {
            case 0: {
                return this.httpPost(url, parameters);
            }
            case 1: {
                const form = this.transformRequestformdata(parameters);
                return this.uploadFileHttp(url, form, parameters, c8oResponseListener);
            }
            case 2: {
                return this.uploadFilePluginNative(url, parameters, c8oResponseListener);
            }
        }

    }

    /**
     * Upload file with native plugin
     * @param {string} url
     * @param {Object} parameters
     * @param {C8oResponseListener} c8oResponseListener
     * @return {Promise<any>}
     */
    public uploadFilePluginNative(url: string, parameters: any,
                                  c8oResponseListener: C8oResponseListener): Promise<any> {
        const progress: C8oProgress = new C8oProgress();
        progress.pull = false;
        const varNull: JSON = null;
        const data = this.transformRequestfileNative(parameters);
        const files = data[0];
        const options = new window["FileUploadOptions"]();
        options.fileKey = files[0][0];
        options.fileName = files[0][1].substr(files[0][1].lastIndexOf("/") + 1);
        options.params = data[1];
        const headersObject = {"Accept": "application/json", "x-convertigo-sdk": this.c8o.sdkVersion};
        Object.assign(headersObject, this.c8o.headers);
        options.headers = headersObject;
        return new Promise((resolve, reject) => {
            Promise.all([this.p1]).then(() => {
                const ft = new window["FileTransfer"]();
                ft.onprogress = (progressEvent) => {
                    if (progressEvent.lengthComputable) {
                        this.handleProgress(progressEvent, progress, parameters, c8oResponseListener, varNull);
                    }
                };
                ft.upload(files[0][1], encodeURI(url), (((resp) => {
                    resolve(resp);
                })), ((err) => {
                    reject(err);
                }), options);
            });
        });
    }

    /**
     * Make an http post
     * @param {string} url
     * @param {Object} parameters
     * @return {Promise<any>}
     */
    public httpPost(url: string, parameters: any): Promise<any> {
        parameters = this.transformRequest(parameters);
        const headersObject = {"Content-Type": "application/x-www-form-urlencoded",
            "x-convertigo-sdk": this.c8o.sdkVersion};
        Object.assign(headersObject, this.c8o.headers);
        const headers = {headers: (headersObject)};
        if (this.firstCall) {
            this.p1 = new Promise((resolve, reject) => {
                this.firstCall = false;
                this.c8o.httpPublic.post(url, parameters, {
                    headers,
                    withCredentials: true,
                }).then((response) =>
                    resolve(response.data),
                ).catch((error) => {
                    resolve({error : (new C8oHttpRequestException(C8oExceptionMessage.runHttpRequest(), error)),
                    });
                });
            });
            return this.p1;
        } else {
            return new Promise((resolve, reject) => {
                Promise.all([this.p1]).then(() => {
                    this.c8o.httpPublic.post(url, parameters, {
                        headers,
                        withCredentials: true,
                    }).then((response) =>
                        resolve(response.data),
                    ).catch((error) => {
                        resolve({error : (new C8oHttpRequestException(C8oExceptionMessage.runHttpRequest(), error)),
                        });
                    });

                }).catch((error) => {
                    reject(error);
                });
            });
        }
    }

    /**
     * Upload File using an Http client
     * @param {string} url
     * @param {FormData} form
     * @param {Object} parameters
     * @param {C8oResponseListener} c8oResponseListener
     * @return {Promise<any>}
     */
    /**
     * Upload File using an Http client
     * @param {string} url
     * @param {FormData} form
     * @param {Object} parameters
     * @param {C8oResponseListener} c8oResponseListener
     * @return {Promise<any>}
     */
    public uploadFileHttp(url: string, form: FormData, parameters: any,
        c8oResponseListener: C8oResponseListener): Promise<any> {
        const headersObject = {
            'Content-Type': 'multipart/form-data', "x-convertigo-sdk": this.c8o.sdkVersion, withCredentials: true
        };
        Object.assign(headersObject, this.c8o.headers);
        const progress: C8oProgress = new C8oProgress();
        progress.pull = false;
        const varNull: JSON = null;

        if (this.firstCall) {
            this.p1 = new Promise((resolve) => {
                this.firstCall = false;
                this.c8o.httpPublic(
                    {
                        method: 'post',
                        url: url,
                        data: form,
                        headers: headersObject
                    }
                ).then((response) =>
                    resolve(response.data),
                ).catch((error) => {
                    resolve({
                        error: (new C8oHttpRequestException(C8oExceptionMessage.runHttpRequest(), error)),
                    });
                });
            });
            return this.p1;
        } else {
            return new Promise((resolve) => {
                Promise.all([this.p1]).then(() => {
                    this.c8o.httpPublic(
                        {
                            method: 'post',
                            url: url,
                            data: form,
                            headers: headersObject
                        }
                    ).then((response) =>
                        resolve(response.data),
                    ).catch((error) => {
                        resolve({
                            error: (new C8oHttpRequestException(C8oExceptionMessage.runHttpRequest(), error)),
                        });
                    });
                });
            });
        }
    }

    /**
     * Handle progress
     * @param event
     * @param {C8oProgress} progress
     * @param parameters
     * @param {C8oResponseListener} c8oResponseListener
     * @param {JSON} varNull
     */
    public handleProgress(event: any, progress: C8oProgress, parameters: any,
                          c8oResponseListener: C8oResponseListener, varNull: JSON): void {
        progress.current = event.loaded;
        progress.total = event.total;
        progress.finished = event.loaded === event.total;
        parameters[C8o.ENGINE_PARAMETER_PROGRESS] = progress;
        (c8oResponseListener as C8oResponseJsonListener).onJsonResponse(varNull, parameters);

    }

    /**
     * Check if we are in cordova environment
     * @return {boolean}
     */
    private isCordova(): boolean {
        if (this._isCordova == null) {
            this._isCordova = window["cordova"] !== undefined;
        }
        return this._isCordova;
    }
}
