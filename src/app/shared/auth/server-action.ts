import { Action } from "radweb";


import { evilStatics } from "./evil-statics";
import { DataApiRequest } from "radweb";
import 'reflect-metadata';

import { PostgresDataProvider } from "radweb-server-postgres";

import { ServerContext, Context } from '../context';
import { UserInfo } from './userInfo';


interface inArgs {
    args: any[];
}
interface result {
    data: any;
}


export class myServerAction extends Action<inArgs, result,UserInfo>
{
    constructor(name: string, private types: any[], private options: RunOnServerOptions, private originalMethod: (args: any[]) => any) {
        super( 'api/', name)
    }
    protected async execute(info: inArgs, req: DataApiRequest<UserInfo>): Promise<result> {
        let result = { data: {} };
        await (<PostgresDataProvider>evilStatics.dataSource).doInTransaction(async ds => {
            let context = new ServerContext();
            context.setReq(req);
            context.setDataProvider(ds);
            if (!this.options.allowed(context))
                throw 'not allowed';
            for (let i = 0; i < this.types.length; i++) {
                if (info.args.length < i) {
                    info.args.push(undefined);
                }
                if (this.types[i] == Context || this.types[i] == ServerContext) {

                    info.args[i] = context;
                }
            }

            try {
                result.data = await this.originalMethod(info.args);

            }

            catch (err) {
                console.log(err);
                throw err
            }
        });
        return result;
    }

}
export interface RunOnServerOptions {
    allowed: (context: Context) => boolean;
}
export const actionInfo = {
    allActions: [],
    runningOnServer: false
}
export function RunOnServer(options: RunOnServerOptions) {
    return (target, key: string, descriptor: any) => {

        var originalMethod = descriptor.value;
        var types = Reflect.getMetadata("design:paramtypes", target, key);


        let serverAction = new myServerAction(key, types, options, args => originalMethod.apply(undefined, args));



        descriptor.value = async function (...args: any[]) {
            if (!actionInfo.runningOnServer)
                return (await serverAction.run({ args })).data;
            else
                return (await originalMethod.apply(undefined, args));
        }
        actionInfo.allActions.push(descriptor.value);
        descriptor.value[serverActionField] = serverAction;


        return descriptor;
    }
}
export const serverActionField = Symbol('serverActionField');
