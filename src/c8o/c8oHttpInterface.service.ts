import {C8o} from "./c8o.service";
import {C8oHttpInterfaceCore} from "c8osdkjscore/src/c8o/c8oHttpInterfaceCore";
import {C8oResponseJsonListener, C8oResponseListener} from "c8osdkjscore/src/c8o/c8oResponse";
import {C8oProgress} from "c8osdkjscore/src/c8o/c8oProgress";
import {C8oHttpRequestException} from "c8osdkjscore/src/c8o/Exception/c8oHttpRequestException";
import {C8oExceptionMessage} from "c8osdkjscore/src/c8o/Exception/c8oExceptionMessage";


export class C8oHttpInterface extends C8oHttpInterfaceCore{
    constructor(c8o: C8o) {
        super(c8o);
    }

    /**
     * Check type of file given in parameters
     * 0 : No file to upload
     * 1 : FileList
     * 2 : url when running in cordova
     * @param {Object} parameters
     * @return {number}
     */
    checkFile(parameters: Object): number{
        for (let p in parameters) {
            if (parameters[p] instanceof Array) {
                for (let p1 in parameters[p]) {
                    //noinspection JSUnfilteredForInLoop
                    if(parameters[p][p1] instanceof FileList){
                        return 1;
                    }
                    else if(this.isCordova()){
                        if(parameters[p][p1] instanceof URL){
                            return 2;
                        }
                    }
                }
            }
            else {
                if(parameters[p] instanceof FileList){
                    return 1;
                }
                else if(this.isCordova()){
                    if(parameters[p]instanceof URL){
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
    transformRequest(parameters: Object): string {
        let str = [];
        for (let p in parameters) {
            if (parameters[p] instanceof Array) {
                for (let p1 in parameters[p]) {
                    //noinspection JSUnfilteredForInLoop
                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(parameters[p][p1]));
                }
            }
            else {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(parameters[p]));
            }
        }
        let query = str.join("&");
        // Add this to instruct Convertigo server to remove any name space in the jSON keys
        // to prevent keys like this:  'namespace:key'
        return (query + "&__removeNamespaces=true");
    }

    /**
     * Transform FormData parameters
     * @param {Object} parameters
     * @return {FormData}
     */
    transformRequestformdata(parameters: Object): FormData {
        let formdata : FormData=  new FormData();
        for (let p in parameters) {
            if (parameters[p] instanceof Array) {
                for (let p1 in parameters[p]) {
                    if(parameters[p][p1] instanceof FileList){
                        for (var i = 0; i < parameters[p][p1].length; i++) {
                            formdata.append(p, parameters[p][p1][i], parameters[p][p1][i].name);
                        }
                    }
                    else{
                        formdata.append(p, parameters[p][p1])
                    }
                }
            }
            else {
                if(parameters[p] instanceof FileList) {
                    for (var j = 0; j < parameters[p].length; j++) {
                        formdata.append(p, parameters[p][j], parameters[p][j].name);
                    }
                }
                else{
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
    transformRequestfileNative(parameters: Object): any{
        let file: Array<any> = new Array();
        let params: Object = new Object();
        for (let p in parameters) {
            if (parameters[p] instanceof Array) {
                for (let p1 in parameters[p]) {
                    if(parameters[p][p1] instanceof URL){
                        file.push([p1, parameters[p][p1]]);
                    }
                    else{
                        params[p1] = parameters[p][p1]["href"];
                    }
                }
            }
            else {
                if(parameters[p] instanceof URL) {
                    file.push([p, parameters[p]["href"]]);
                }
                else{
                    params[p] = parameters[p];
                }
            }
        }
        return [file, params];
    }

    /**
     * Check if we are in cordova environment
     * @return {boolean}
     */
    private isCordova():boolean{
        if(this._isCordova == null){
            if(window["cordova"]!= undefined){
                this._isCordova = true;
            }
            else{
                this._isCordova = false;
            }
        }
        return this._isCordova;
    }



    /**
     * Handle the request
     * @param {string} url
     * @param {Object} parameters
     * @param {C8oResponseListener} c8oResponseListener
     * @return {Promise<any>}
     */
    async handleRequest(url: string, parameters: Object, c8oResponseListener?: C8oResponseListener): Promise<any> {
        if (parameters["__sequence"] !== undefined) {
            if (parameters["__sequence"].indexOf("#") !== -1) {
                parameters["__sequence"] = parameters["__sequence"].substring(0, parameters["__sequence"].indexOf("#"));
            }
        }
        switch (this.checkFile(parameters)){
            case 0: {
                return this.httpPost(url, parameters);
            }
            case 1: {
                let form = this.transformRequestformdata(parameters);
                return this.uploadFileHttp(url,form,parameters,c8oResponseListener);
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
    uploadFilePluginNative(url: string, parameters: Object, c8oResponseListener: C8oResponseListener):Promise<any>{
        let progress: C8oProgress = new C8oProgress();
        progress.pull = false;
        let varNull: JSON = null;
        let data = this.transformRequestfileNative(parameters);
        let files = data[0];
        let options = new window["FileUploadOptions"]();
        options.fileKey = files[0][0];
        options.fileName = files[0][1].substr(files[0][1].lastIndexOf('/') + 1);
        options.params = data[1];
        let headersObject = {'Accept':'application/json', 'x-convertigo-sdk': this.c8o.sdkVersion};
        Object.assign(headersObject, this.c8o.headers);
        options.headers = headersObject;
        return new Promise((resolve,reject)=>{
            Promise.all([this.p1]).then(() => {
                var ft = new window["FileTransfer"]();
                ft.onprogress = (progressEvent) => {
                    if (progressEvent.lengthComputable) {
                        this.handleProgress(progressEvent, progress, parameters, c8oResponseListener, varNull);
                    }
                };
                ft.upload(files[0][1], encodeURI(url), ((resp => {
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
    httpPost(url: string, parameters: Object): Promise<any>{
        parameters = this.transformRequest(parameters);
        let headersObject = {"Content-Type": "application/x-www-form-urlencoded", "x-convertigo-sdk": this.c8o.sdkVersion};
        Object.assign(headersObject, this.c8o.headers);
        let headers = {headers: (headersObject)};
        if (this.firstCall) {
            this.p1 = new Promise((resolve, reject) => {
                this.firstCall = false;
                this.c8o.httpPublic.post(url, parameters, {
                    headers: headers,
                    withCredentials: true
                }).then(response =>
                    resolve(response.data)
                ).catch(error => {
                    resolve({"error" : (new C8oHttpRequestException(C8oExceptionMessage.runHttpRequest(), error))
                    });
                });
            });
            return this.p1;
        }
        else {
            return new Promise((resolve, reject) => {
                Promise.all([this.p1]).then(() => {
                    this.c8o.httpPublic.post(url, parameters, {
                        headers: headers,
                        withCredentials: true
                    }).then(response =>
                        resolve(response.data)
                    ).catch(error => {
                        resolve({"error" : (new C8oHttpRequestException(C8oExceptionMessage.runHttpRequest(), error))
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
    uploadFileHttp(url: string, form: FormData, parameters: Object, c8oResponseListener: C8oResponseListener): Promise<any>{
        let headersObject = {'Accept':'application/json', 'x-convertigo-sdk': this.c8o.sdkVersion};
        Object.assign(headersObject, this.c8o.headers);
        let headers = {headers: headersObject};
        let progress: C8oProgress = new C8oProgress();
        progress.pull = false;
        let varNull: JSON = null;


        if (this.firstCall) {
            this.p1 = new Promise((resolve) => {
                this.firstCall = false;

                this.c8o.httpPublic.post({url: url, data: form, withCredentials: true, headers: headers, onUploadProgress: function (event) {
                        this.handleProgress(event, progress, parameters, c8oResponseListener, varNull);
                    }}, {
                    headers: headers,
                    withCredentials: true
                }).then(response =>
                    resolve(response.data)
                ).catch(error => {
                    resolve({"error" : (new C8oHttpRequestException(C8oExceptionMessage.runHttpRequest(), error))
                    });
                });
            });
            return this.p1;
        }
        else {
            return new Promise((resolve, reject) => {
                Promise.all([this.p1]).then(() => {
                    this.c8o.httpPublic.post({url: url, data: form, withCredentials: true, headers: headers, onUploadProgress: function (event) {
                            this.handleProgress(event, progress, parameters, c8oResponseListener, varNull);
                        }}, {
                        headers: headers,
                        withCredentials: true
                    }).then(response =>
                        resolve(response.data)
                    ).catch(error => {
                        resolve({"error" : (new C8oHttpRequestException(C8oExceptionMessage.runHttpRequest(), error))
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
    handleProgress(event: any, progress: C8oProgress, parameters: any, c8oResponseListener: C8oResponseListener, varNull: JSON): void{
        progress.current = event.loaded;
        progress.total = event.total;
        if(event.loaded != event.total){
            progress.finished = false;
        }
        else{
            progress.finished = true;
        }
        parameters[C8o.ENGINE_PARAMETER_PROGRESS] = progress;
        (c8oResponseListener as C8oResponseJsonListener).onJsonResponse(varNull, parameters);

    }
}