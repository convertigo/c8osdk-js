//noinspection TsLint
import {C8oLogLevel, C8oSettings} from "c8osdkjscore";
import {C8o} from "../src/c8o/c8o.service";
import { resolve } from "path";
export class Info {
    // if you wants to use a proxy you mast change remote host and port please change configuration in Root/config/karama.conf.js

    static get http() {
        return "http://";
    }
    static get host() {
        return "c8o-dev.convertigo.net";
        //return "localhost";
    }
    static get port() {
        return "80";
        //return "18080"
    }
    static get project_path() {
        return "/cems/projects/ClientSDKtesting";
        //return "/convertigo/projects/ClientSDKtesting";
    }
    static get endpoint() {
        return Info.http + Info.host + ":" + Info.port + Info.project_path;
    }
}

//noinspection TsLint
export class Stuff {
    static get C8o() {
        const c8oSettings: C8oSettings = new C8oSettings();
        c8oSettings
            .setEndPoint(Info.endpoint)
            .setLogRemote(true)
            .setLogLevelLocal(C8oLogLevel.DEBUG)
            .addHeader("x-convertigo-mb", "7.5.0-beta");
        return c8oSettings;
    }

    static get C8o_FS() {
        const c8oSettings: C8oSettings = new C8oSettings();
        c8oSettings
            .setDefaultDatabaseName("clientsdktesting")
            .setEndPoint(Info.endpoint)
            .setLogRemote(false)
            .setLogLevelLocal(C8oLogLevel.DEBUG)
            .addHeader("x-convertigo-mb", "7.5.0-beta");
        return c8oSettings;
    }

    static get C8o_FS_PULL() {
        const c8oSettings: C8oSettings = new C8oSettings();
        c8oSettings
            .setDefaultDatabaseName("qa_fs_pull")
            .setEndPoint(Info.endpoint)
            .setLogRemote(false)
            .setLogLevelLocal(C8oLogLevel.DEBUG)
            .addHeader("x-convertigo-mb", "7.5.0-beta");
        return c8oSettings;
    }
    static get C8o_FS_PUSH() {
        const c8oSettings: C8oSettings = new C8oSettings();
        c8oSettings
            .setDefaultDatabaseName("qa_fs_push")
            .setEndPoint(Info.endpoint)
            .setLogRemote(false)
            .setLogLevelLocal(C8oLogLevel.DEBUG)
            .addHeader("x-convertigo-mb", "7.5.0-beta");
        return c8oSettings;
    }

    static get C8o_LC() {
        const c8oSettings: C8oSettings = new C8oSettings();
        c8oSettings
            .setEndPoint(Info.endpoint)
            .setLogRemote(false)
            .setLogLevelLocal(C8oLogLevel.DEBUG)
            .addHeader("x-convertigo-mb", "7.5.0-beta");
        return c8oSettings;
    }
}

//noinspection TsLint
export class Functions {
    public static async CheckLogRemoteHelper(c8o: C8o, lv: any, msg: string) {

        c8o.callJson(".GetLogs").then(
            (response: any) => {
                const sLine = response["document"]["line"];
                expect(sLine != null).toBeTruthy();
                for (const lvl of lv) {
                    const line = JSON.parse(sLine);
                    expect(line[2]).toBe(lvl);
                    let newMsg = line[4];
                    newMsg = newMsg.substring(newMsg.indexOf("logID="));
                    expect(msg).toBe(newMsg);
                }
                return null;
            },
        );

    }
}

export class PlainObjectA {
    public name: string;
    public bObjects: any[];
    public bObject: PlainObjectB;
}

export class PlainObjectB {
    public name: string;
    public num: number;
    public enabled: boolean;
}
