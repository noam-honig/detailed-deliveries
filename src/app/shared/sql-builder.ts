import { Column, Entity, FilterBase, FilterConsumerBridgeToSqlRequest, SortSegment, SQLCommand, SQLQueryResult } from 'radweb';

export class SqlBuilder {
    extractNumber(from: any): any {
        return this.build("NULLIF(regexp_replace(", from, ", '\\D','','g'), '')::numeric");
    }

    str(val: string): string {
        if (val == undefined)
            val = '';
        return '\'' + val.replace('\'', '\'\'') + '\'';
    }
    private dict = new Map<Column<any>, string>();


    private entites = new Map<Entity<any>, string>();



    addEntity(e: Entity<any>, alias?: string) {
        if (alias) {
            e.__iterateColumns().forEach(c => {
                this.dict.set(c, alias);
            });
            this.entites.set(e, alias);
        }
    }
    columnWithAlias(a: any, b: any) {
        return this.build(a, ' ', b);
    }
    build(...args: any[]): string {
        let result = '';
        args.forEach(e => {

            result += this.getItemSql(e);
        });
        return result;
    }

    getItemSql(e: any) {
        if (this.dict.has(e))
            return this.dict.get(e) + '.' + e.__getDbName();
        let v = e;
        if (e instanceof Entity)
            v = e.__getDbName();
        if (e instanceof Column)
            v = e.__getDbName();

        let f = e as FilterBase;
        if (f && f.__applyToConsumer) {

            let bridge = new FilterConsumerBridgeToSqlRequest(new myDummySQLCommand());
            f.__applyToConsumer(bridge);
            return bridge.where.substring(' where '.length);
        }
        if (e instanceof Array) {
            v = e.map(x => this.getItemSql(x)).join(', ');
        }
        return v;
    }
    eq<T>(a: Column<T>, b: T | Column<T>) {
        return this.build(a, ' = ', b);
    }
    eqAny(a: string, b: any) {
        return this.build(a, ' = ', b);
    }
    ne<T>(a: Column<T>, b: T | Column<T>) {
        return this.build(a, ' <> ', b);
    }
    notNull(col: Column<any>) {
        return this.build(col, ' is not null');
    }


    gt<T>(a: Column<T>, b: T | Column<T>) {
        return this.build(a, ' > ', b);
    }
    gtAny(a: Column<any>, b: any | any) {
        return this.build(a, ' > ', b);
    }
    and(...args: any[]): string {
        return args.map(x => this.getItemSql(x)).join(' and ');
    }
    or(...args: any[]): string {
        return "(" + args.map(x => this.getItemSql(x)).join(' or ') + ")";
    }
    private last = 1;
    getEntityAlias(e: Entity<any>) {
        let result = this.entites.get(e);
        if (result)
            return result;
        result = 'e' + this.last++;
        this.addEntity(e, result);
        return result;



    }
    columnSumInnerSelect(rootEntity: Entity<any>, col: Column<Number>, query: FromAndWhere) {
        return this.columnDbName(rootEntity, {
            select: () => [this.build("sum(", col, ")")],
            from: query.from,
            innerJoin: query.innerJoin,
            outerJoin: query.outerJoin,
            crossJoin: query.crossJoin,
            where: query.where
        });
    }
    columnCount(rootEntity: Entity<any>, query: FromAndWhere) {
        return this.columnDbName(rootEntity, {
            select: () => [this.build("count(*)")],
            from: query.from,
            innerJoin: query.innerJoin,
            outerJoin: query.outerJoin,
            crossJoin: query.crossJoin,
            where: query.where
        });
    }
    columnInnerSelect(rootEntity: Entity<any>, query: QueryBuilder) {
        this.addEntity(rootEntity, rootEntity.__getDbName());
        return '(' + this.query(query) + ' limit 1)';
    }
    countInnerSelect(query: FromAndWhere, mappedColumn: Column<number>) {
        return this.build("(", this.query({
            select: () => [this.build("count(*)")],
            from: query.from,
            innerJoin: query.innerJoin,
            outerJoin: query.outerJoin,
            crossJoin: query.crossJoin,
            where: query.where
        }), ") ", mappedColumn);
    }
    countDistinct(col: Column<any>, mappedColumn: Column<number>) {
        return this.build("count (distinct ", col, ") ", mappedColumn)
    }
    min(col: Column<any>, query: FromAndWhere, mappedColumn: Column<any>) {
        return this.build('(', this.query({
            select: () => [this.build("min(", col, ")")],
            from: query.from,
            innerJoin: query.innerJoin,
            outerJoin: query.outerJoin,
            crossJoin: query.crossJoin,
            where: query.where
        }), ") ", mappedColumn);
    }
    max(col: Column<any>, query: FromAndWhere, mappedColumn: Column<any>) {
        return this.build('(', this.query({
            select: () => [this.build("max(", col, ")")],
            from: query.from,
            innerJoin: query.innerJoin,
            outerJoin: query.outerJoin,
            crossJoin: query.crossJoin,
            where: query.where
        }), ") ", mappedColumn);
    }
    columnDbName(rootEntity: Entity<any>, query: QueryBuilder) {
        this.addEntity(rootEntity, rootEntity.__getDbName());
        return '(' + this.query(query) + ')';
    }
    entityDbName(query: QueryBuilder) {
        return '(' + this.query(query) + ') result';
    }
    entityDbNameUnion(query1: QueryBuilder, query2: QueryBuilder) {
        return this.union(query1, query2) + ' result';
    }
    union(query1: QueryBuilder, query2: QueryBuilder) {
        return '(' + this.query(query1) + ' union ' + this.query(query2) + ')';
    }

    in(col: Column<any>, ...values: any[]) {
        return this.build(col, ' in (', values, ')');
    }
    not(arg0: string): any {
        return this.build(' not (', arg0, ')');
    }
    delete(e: Entity<any>, ...where: string[]) {
        return this.build('delete from ', e, ' where ', this.and(...where));
    }
    update(e: Entity<any>, info: UpdateInfo) {
        let result = [];
        result.push('update ', e, ' ', this.getEntityAlias(e), ' set ');

        let from: string;
        if (info.from) {
            from = this.build(' from ', info.from, ' ', this.getEntityAlias(info.from));
        }
        result.push(info.set().map(a => this.build(this.build(a[0].__getDbName(), ' = ', a[1]))));
        if (from)
            result.push(from);

        if (info.where) {
            result.push(' where ')
            result.push(this.and(...info.where()));
        }
        return this.build(...result);
    }
    insert(info: InsertInfo) {
        let result = [];
        result.push('insert into ', info.into, ' ');

        result.push('(', info.set().map(a => a[0].__getDbName()), ') ');
        result.push(this.query({
            select: () => info.set().map(a => a[1]),
            from: info.from,
            where: info.where
        }));

        return this.build(...result);
    }
    query(query: QueryBuilder) {

        let from = [];
        from.push(' from ');
        from.push(query.from, ' ', this.getEntityAlias(query.from));
        if (query.crossJoin) {
            query.crossJoin().forEach(j => {
                from.push(' cross join ', j, ' ', this.getEntityAlias(j));
            });
        }
        if (query.innerJoin) {
            query.innerJoin().forEach(j => {
                let alias = this.getEntityAlias(j.to);
                from.push(' left join ', j.to, ' ', alias, ' on ', this.and(...j.on()));
            });
        }
        if (query.outerJoin) {
            query.outerJoin().forEach(j => {
                let alias = this.getEntityAlias(j.to);
                from.push(' left outer join ', j.to, ' ', alias, ' on ', this.and(...j.on()));
            });
        }
        let result = [];
        result.push('select ');
        result.push(query.select());
        result.push(...from);
        if (query.where) {
            result.push(' where ', this.and(...query.where()));
        }
        if (query.orderBy) {
            result.push(' order by ', query.orderBy.map(x => {
                var f = x as SortSegment;
                if (f && f.column) {
                    return this.build(f.column, ' ', f.descending ? 'desc' : '')
                }
                else return x;

            }));
        }
        return this.build(...result);



    }
    case(args: CaseWhenItemHelper[], else_: any) {
        if (args.length == 0)
            return else_;
        let result = [];
        result.push('case');
        args.forEach(x => {
            result.push(' when ');
            result.push(this.and(...x.when));
            result.push(' then ');
            result.push(x.then);
        });
        result.push(' else ');
        result.push(else_);
        result.push(' end');
        return this.build(...result);

    }

    innerSelect(builder: QueryBuilder, col: Column<any>) {
        return this.build('(', this.query(builder), ' limit 1) ', col);
    }
}
export interface QueryBuilder {
    select: () => any[];
    from: Entity<any>;
    crossJoin?: () => Entity<any>[];
    innerJoin?: () => JoinInfo[];
    outerJoin?: () => JoinInfo[];
    where?: () => any[];
    orderBy?: (Column<any> | SortSegment)[];
}
export interface FromAndWhere {
    from: Entity<any>;
    crossJoin?: () => Entity<any>[];
    innerJoin?: () => JoinInfo[];
    outerJoin?: () => JoinInfo[];
    where?: () => any[];
}
export interface UpdateInfo {
    set: () => [Column<any>, any][],
    where?: () => any[];
    from?: Entity<any>;
}
export interface InsertInfo {
    into: Entity<any>;
    set: () => [Column<any>, any][];
    from: Entity<any>;
    where?: () => any[];
}
export interface JoinInfo {
    to: Entity<any>;
    on: () => any[];
}

export interface CaseWhenItemHelper {
    when: any[];
    then: any;
}
class myDummySQLCommand implements SQLCommand {
    addParameterToCommandAndReturnParameterName(col: Column<any>, val: any): string {
      if (typeof (val) == "string") {
        return new SqlBuilder().str(val);
      }
      return val.toString();
    } query(sql: string): Promise<SQLQueryResult> {
      throw new Error("Method not implemented.");
    }
  
  
  }