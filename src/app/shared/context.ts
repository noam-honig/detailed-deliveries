import { Entity, IDataSettings, GridSettings, Column, NumberColumn, DataList, EntityOptions, ColumnHashSet, DataApi } from "radweb";
import { EntitySourceFindOptions, FilterBase, FindOptionsPerEntity, DataProviderFactory, DataColumnSettings, DataApiRequest } from "radweb";
import { foreachSync } from "./utils";
import { Injectable } from "@angular/core";
import { DataApiSettings } from "radweb";
import { evilStatics } from './auth/evil-statics';


import { Roles, UserInfo } from './auth/userInfo';
import { ContextUserProvider } from './context-user-provider';
import { SiteArea } from 'radweb-server';



@Injectable()
export class Context {
    clearAllCache(): any {
        this.cache = {};
        this._lookupCache = new stamEntity();
    }
    isAdmin() {
        return this.hasRole(Roles.superAdmin);
    }
    isLoggedIn() {
        return !!this.user;
    }
    constructor() {

    }

    userProvider?: ContextUserProvider;
    protected _getInfo = () => undefined;//this.userProvider.getUser();
    protected _dataSource = evilStatics.dataSource;
    protected _onServer = false;
    get onServer(): boolean {
        return this._onServer;
    }

    get user(): UserInfo {
        return this._getInfo();
    }
    hasRole(...allowedRoles: string[]) {
        if (!this.user)
            return false;
        if (!allowedRoles)
            return true;
        if (!this.user.roles)
            return false;
        for (const role of allowedRoles) {
            if (this.user.roles.indexOf(role) >= 0)
                return true;
        }
        return false;
    }

    public create<lookupIdType, T extends Entity<lookupIdType>>(c: { new(...args: any[]): T; }) {
        let e = new c(this);
        e.setSource(this._dataSource);
        if (e instanceof ContextEntity) {
            e._setContext(this);
        }
        return e;
    }
    cache: any = {};
    public for<lookupIdType, T extends Entity<lookupIdType>>(c: { new(...args: any[]): T; }) {

        let classType = c as any;

        if (this.cache[classType.__key])
            return this.cache[classType.__key] as SpecificEntityHelper<lookupIdType, T>;
        return this.cache[classType.__key] = new SpecificEntityHelper<lookupIdType, T>(this.create(c), this._lookupCache);
    }

    private _lookupCache = new stamEntity();
}
export class ServerContext extends Context {
    constructor() {
        super();
        this._onServer = true;
        this._getInfo = () => undefined;

    }

    private req: DataApiRequest<UserInfo>;

    setReq(req: DataApiRequest<UserInfo>) {
        this.req = req;
        this._getInfo = () => req.authInfo ? req.authInfo : undefined;
    }
    setDataProvider(dataProvider: DataProviderFactory) {
        this._dataSource = dataProvider;
    }
    getOrigin() {
        return this.req.getHeader('origin')
    }
}

function buildEntityOptions(o: ContextEntityOptions | string): EntityOptions | string {
    if (typeof (o) == 'string')
        return o;
    return {
        name: o.name,
        caption: o.caption,
        dbName: o.dbName,
        onSavingRow: o.onSavingRow,
    }
}

export class ContextEntity<idType> extends Entity<idType>{
    _noContextErrorWithStack: Error;
    constructor(private contextEntityOptions?: ContextEntityOptions | string) {
        super(() => {
            if (!this.__context) {

                throw this._noContextErrorWithStack;
            }
            if (!this.entityType) {
                throw this._noContextErrorWithStack;
            }
            return this.__context.create(this.entityType);

        }, evilStatics.dataSource, buildEntityOptions(contextEntityOptions));
        this._noContextErrorWithStack = new Error('@EntityClass not used or context was not set for' + this.constructor.name);
    }
    private __context: Context;
    _setContext(context: Context) {
        this.__context = context;
    }
    private entityType: EntityType;
    _setFactoryClassAndDoInitColumns(entityType: EntityType) {
        this.entityType = entityType;
        this.initColumns((<any>this).id);

    }
    _getExcludedColumns(x: Entity<any>) {
        let r = x.__iterateColumns().filter(c => {
            let y = <hasMoreDataColumnSettings><any>c;
            if (y && y.__getMoreDataColumnSettings) {

                if (y.__getMoreDataColumnSettings() && y.__getMoreDataColumnSettings().excludeFromApi)
                    return true;
            }
            return false;
        });
        return r;
    }
    _getEntityApiSettings(r: Context): DataApiSettings<any> {


        let x = r.for(this.entityType).create() as ContextEntity<any>;
        if (typeof (x.contextEntityOptions) == "string") {
            return {}
        }
        else {
            let options = x.contextEntityOptions;
            if (options.allowApiCRUD) {
                options.allowApiDelete = true;
                options.allowApiInsert = true;
                options.allowApiUpdate = true;
            }
            return {
                allowRead: options.allowApiRead,
                allowUpdate: options.allowApiUpdate,
                allowDelete: options.allowApiDelete,
                allowInsert: options.allowApiInsert,
                excludeColumns: x =>
                    this._getExcludedColumns(x)
                ,
                readonlyColumns: x => {
                    let r = x.__iterateColumns().filter(c => c.readonly);

                    return r;
                },
                get: {
                    where: x => options.apiDataFilter ? options.apiDataFilter() : undefined
                }
            }
        }
    }
}
export interface hasMoreDataColumnSettings {
    __getMoreDataColumnSettings(): MoreDataColumnSettings<any, any>;
}
export interface MoreDataColumnSettings<type, colType> extends DataColumnSettings<type, colType> {
    excludeFromApi?: boolean;
}
export interface ContextEntityOptions {
    name: string;//required
    dbName?: string | (() => string);
    caption?: string;
    allowApiRead?: boolean;
    allowApiUpdate?: boolean;
    allowApiDelete?: boolean;
    allowApiInsert?: boolean;
    allowApiCRUD?: boolean;
    apiDataFilter?: () => FilterBase;

    onSavingRow?: () => Promise<any>;
}
class stamEntity extends Entity<number> {

    id = new NumberColumn();
    constructor() {
        super(() => new stamEntity(), evilStatics.dataSource, "stamEntity");
        this.initColumns();
    }
}
export class SpecificEntityHelper<lookupIdType, T extends Entity<lookupIdType>> {
    constructor(private entity: T, private _lookupCache: Entity<any>) {

    }
    lookupAsync(filter: Column<lookupIdType> | ((entityType: T) => FilterBase)): Promise<T> {
        return this._lookupCache.lookupAsync(this.entity, filter);
    }
    lookup(filter: Column<lookupIdType> | ((entityType: T) => FilterBase)): T {
        return this._lookupCache.lookup(this.entity, filter);
    }
    async count(where?: (entity: T) => FilterBase) {
        let dl = new DataList(this.entity);
        return await dl.count(where);
    }
    async foreach(where: (entity: T) => FilterBase, what?: (entity: T) => Promise<void>) {

        let options: EntitySourceFindOptions = {};
        if (where) {
            options.where = where(this.entity);
        }
        let items = await this.entity.source.find(options);
        return foreachSync(items, async item => await what(item));
    }
    async find(options?: FindOptionsPerEntity<T>) {
        let dl = new DataList(this.entity);
        return await dl.get(options);
    }
    async findFirst(where?: (entity: T) => FilterBase) {
        let r = await this.entity.source.find({ where: where ? where(this.entity) : undefined });
        if (r.length == 0)
            return undefined;
        return r[0];
    }
    toPojoArray(items: T[]) {
        let exc = new ColumnHashSet();
        if (this.entity instanceof ContextEntity)
            exc.add(...this.entity._getExcludedColumns(this.entity));

        return Promise.all(items.map(f => f.__toPojo(exc)));
    }
    create() {
        return this.entity.source.createNewItem();
    }
    gridSettings(settings?: IDataSettings<T>) {
        return new GridSettings(this.entity, settings);
    }
}
export interface EntityType {
    new(...args: any[]): Entity<any>;
}
 export const allEntities = [];
 export function registerEntitiesOnServer(area: SiteArea<UserInfo>){
    let errors = '';
    //add Api Entries
    allEntities.forEach(e => {
        let x = new ServerContext().for(e).create();
        if (x instanceof ContextEntity) {
            let j = x;
            area.add(r => {
                let c = new ServerContext();
                c.setReq(r);
                let y = j._getEntityApiSettings(c);
                if (y.allowRead === undefined)
                    errors += '\r\n' + j.__getName()
                return new DataApi(c.create(e), y);
            });
        }
    });
    if (errors.length > 0) {
        console.log('Security not set for:' + errors);
    }
 }

export function EntityClass(theEntityClass: EntityType) {

    var original = theEntityClass;

    // a utility function to generate instances of a class
    function construct(constructor, args) {
        var c: any = function () {
            return constructor.apply(this, args);
        }
        c.prototype = constructor.prototype;
        return new c();
    }
    let newEntityType: any;
    // the new constructor behaviour
    var f: any = function (...args) {

        let r = construct(original, args);
        if (r instanceof ContextEntity) {
            r._setFactoryClassAndDoInitColumns(newEntityType);

        }
        return r;
    }
    newEntityType = f;

    // copy prototype so intanceof operator still works
    f.prototype = original.prototype;
    // copy static methods
    for (let x in original) {
        f[x] = original[x];
    }
    allEntities.push(f);
    f.__key = original.name + allEntities.indexOf(f);
    // return new constructor (will override original)
    return f;
}

