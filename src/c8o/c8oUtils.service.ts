import axios, { AxiosAdapter, AxiosError, AxiosInstance, AxiosRequestConfig,
    AxiosResponse, Cancel, Canceler, CancelToken, CancelTokenSource} from "axios/index";
import {C8oUtilsCore} from "c8osdkjscore";

export class C8oUtils extends C8oUtilsCore {

    private http: any;
    public constructor() {
        super();
        this.http = axios;
    }

}
