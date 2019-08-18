import { WeeklyFamilyId, WeeklyFamilies } from '../weekly-families/weekly-families';
import { ClosedListColumn, StringColumn, CompoundIdColumn, Column, ColumnOptions, IdColumn, NumberColumn } from 'radweb';
import { EntityClass, Context, ServerContext, Entity, IdEntity } from 'radweb';
import { BusyService } from 'radweb';


import { UserId } from '../users/users';
import { DateTimeColumn } from '../shared/types';
import { Roles } from '../users/roles';
import { SqlBuilder, QueryBuilder } from '../shared/sql-builder';

@EntityClass
export class WeeklyFamilyDeliveries extends IdEntity<WeeklyFamilyDeliveryId>
{

  constructor(private context: Context) {
    super(new WeeklyFamilyDeliveryId(), {
      name: 'WeeklyFamilyDeliveries',
      allowApiRead: c => c.isSignedIn(),
      allowApiCRUD: c => c.isSignedIn(),
      apiDataFilter: () => {
        if (this.context.isAllowed(Roles.admin))
          return undefined;
        return this.okToSeeIt.isEqualTo(1);
      },

      onSavingRow: async () => {
        if (this.isNew()) {
          this.status.value = WeeklyFamilyDeliveryStatus.Prepare;
          this.ordnial.value = +(await context.for(WeeklyFamilyDeliveries).count(wfd => wfd.familyId.isEqualTo(this.familyId.value))) + 1;
        }
      },

    });
    this.deliveredOn.dontShowTimeForOlderDates = true;
  }
  currentUserAllowedToUpdate() {

    if (this.context.isAllowed(Roles.admin) || this.context.user.id == this.assignedHelper.value)
      return true;

    return this.familyActualName.value;
  }

  changeStatus(s: WeeklyFamilyDeliveryStatus) {
    if (this.status.value == WeeklyFamilyDeliveryStatus.Delivered)
      this.deliveredOn.value = undefined;
    this.status.value = s;
    if (this.status.value == WeeklyFamilyDeliveryStatus.Delivered) {
      this.deliveredOn.value = new Date();
      this.deliveredBy.value = this.context.user.id;
    }
    this.save();
  }

  familyId = new WeeklyFamilyId();
  status = new WeeklyFamilyDeliveryStatusColumn();
  ordnial = new NumberColumn('סידורי');
  deliveredOn = new DateTimeColumn('תאריך מסירה');
  deliveredBy = new UserId(this.context, { caption: 'נמסר על ידי' });
  assignedHelper = new UserId(this.context, { caption: 'אחראית מסירה' });
  familyActualName = new StringColumn({
    caption: 'שם משפחה',
    dbReadOnly: true,
    dbName: () => {
      let f = this.context.for(WeeklyFamilies).create();
      var sql = new SqlBuilder();

      return sql.columnInnerSelect(this, {
        select: () => [f.name],
        from: f,
        where: () => {
          var filter = [sql.eq(f.id, this.familyId)];
          if (this.context.isAllowed(Roles.admin))
            return filter;
          if (this.context.isAllowed(Roles.volunteer)) {
            filter.push(sql.or(
              sql.eq(f.assignedHelper,sql.str( this.context.user.id)),
              sql.eq(this.assignedHelper, sql.str( this.context.user.id))
            ))
            return filter;
          }
          return [sql.eqAny('1', '0')];

        }
      })
    }
  });
  familyCodeName = new StringColumn({
    caption: 'שם קוד',
    dbReadOnly: true,
    dbName: () => {
      let f = this.context.for(WeeklyFamilies).create();
      var sql = new SqlBuilder();

      return sql.columnInnerSelect(this, {
        select: () => [f.codeName],
        from: f,
        where: () =>
          [sql.eq(f.id, this.familyId)]
      })
    }
  });
  packingComment = new StringColumn({
    caption: 'הערה לאריזה',
    dbReadOnly: true,
    dbName: () => {
      let f = this.context.for(WeeklyFamilies).create();
      var sql = new SqlBuilder();

      return sql.columnInnerSelect(this, {
        select: () => [f.packingComment],
        from: f,
        where: () =>
          [sql.eq(f.id, this.familyId)]
      })
    }
  });
  okToSeeIt = new NumberColumn({
    caption: 'ok to see',
    dbReadOnly: true,
    //   includeInApi:false,
    dbName: () => {
      let sql = new SqlBuilder();
      let conditions = [];
      if (this.context.isAllowed(Roles.volunteer))
        conditions.push({
          when: [sql.build(this.familyActualName, 'is not null')], then: '1'
        });
      if (this.context.isAllowed(Roles.packer)) {
        conditions.push({
          when: [this.status.isGreaterOrEqualTo(WeeklyFamilyDeliveryStatus.Pack).and(
            this.status.isLessOrEqualTo(WeeklyFamilyDeliveryStatus.Ready))], then: '1'
        })
      }
      let r = sql.case(
        conditions
        , '0');

      return r;
    }
  });

}


@EntityClass
export class WeeklyFamilyDeliveryProducts extends IdEntity<IdColumn>{

  constructor(private context: Context) {

    super(new IdColumn(), {
      name: 'WeeklyFamilyDeliveryProducts',
      allowApiRead: c => c.isSignedIn(),
      allowApiCRUD: c => c.isSignedIn()
    })
  }
  delivery = new WeeklyFamilyDeliveryId();
  product = new ProductId(this.context);
  requestQuanity = new NumberColumn({ caption: 'כמות מבוקשת', value: 0 });
  Quantity = new NumberColumn('כמות בפועל');
}


@EntityClass
export class WeeklyFamilyDeliveryProductStats extends Entity<string> {
  delivery = new WeeklyFamilyDeliveryId();
  product = new ProductId(this.context);
  productName = new StringColumn({ caption: 'שם' });
  productOrder = new NumberColumn({ caption: 'סדר', value: 50 });
  familyId = new WeeklyFamilyId();
  status = new WeeklyFamilyDeliveryStatusColumn();
  ordnial = new NumberColumn('סידורי');
  deliveredOn = new DateTimeColumn('תאריך מסירה');
  requestQuanity = new NumberColumn({ caption: 'כמות מבוקשת', value: 0 });
  Quantity = new NumberColumn('כמות בפועל');
  lastDeliveryOfProduct = new DateTimeColumn('תאריך מסירה קודם');
  lastDelveryQuantity = new NumberColumn('כמות בפעם הקודמת');

  constructor(private context: Context) {
    super({
      name: 'WeeklyFamilyDelivryProductStats',
      allowApiRead: c => c.isSignedIn(),
      dbName: () => {
        var deliveries = new WeeklyFamilyDeliveries(context);
        var innerSelectDeliveries = new WeeklyFamilyDeliveries(context);
        var products = new Products(context);
        var innerSelectDeliveryProducts = new WeeklyFamilyDeliveryProducts(context);
        var deliveryProducts = new WeeklyFamilyDeliveryProducts(context);
        var sql = new SqlBuilder();



        var getFromLastDelivery = (col: Column<any>) => {
          return {
            select: () => [col],
            from: innerSelectDeliveries,
            innerJoin: () => [{
              to: innerSelectDeliveryProducts,
              on: () => [
                sql.eq(innerSelectDeliveries.id,
                  innerSelectDeliveryProducts.delivery)
              ]
            }],
            where: () => [
              sql.eq(deliveries.familyId, innerSelectDeliveries.familyId),
              sql.gt(deliveries.ordnial, innerSelectDeliveries.ordnial),
              sql.eq(innerSelectDeliveryProducts.product, products.id),
              sql.gt(innerSelectDeliveryProducts.Quantity, 0),
              innerSelectDeliveries.status.isEqualTo(WeeklyFamilyDeliveryStatus.Delivered)
            ],
            orderBy: [{ column: innerSelectDeliveries.ordnial, descending: true }]
          } as QueryBuilder;

        };
        return sql.entityDbName({
          select: () => [
            sql.columnWithAlias(deliveries.id, this.delivery),
            deliveries.familyId,
            deliveries.status,
            deliveries.ordnial,
            deliveries.deliveredOn,
            sql.columnWithAlias(products.id, this.product),
            sql.columnWithAlias(products.name, this.productName),
            sql.columnWithAlias(products.order, this.productOrder),
            deliveryProducts.requestQuanity,
            deliveryProducts.Quantity,
            sql.innerSelect(getFromLastDelivery(innerSelectDeliveries.deliveredOn), this.lastDeliveryOfProduct),
            sql.innerSelect(getFromLastDelivery(innerSelectDeliveryProducts.Quantity), this.lastDelveryQuantity)
          ],
          from: deliveries,
          crossJoin: () => [products],
          outerJoin: () => [{
            to: deliveryProducts,
            on: () => [
              sql.eq(deliveries.id, deliveryProducts.delivery),
              sql.eq(products.id, deliveryProducts.product)]
          }]
        });

      },
      allowApiCRUD: false,

    });
    this.lastDeliveryOfProduct.dontShowTimeForOlderDates = true;
    this.initColumns(new CompoundIdColumn(this, this.delivery, this.product));

  }
  private saving = Promise.resolve();
  async saveQuantities(busy: BusyService) {

    this.saving = this.saving.then(async () => {
      await busy.donotWait(async () => {
        var r = await this.context.for(WeeklyFamilyDeliveryProducts).lookupAsync(dp => dp.product.isEqualTo(this.product).and(dp.delivery.isEqualTo(this.delivery)));
        if (r.isNew()) {
          if (!r.requestQuanity.value)
            r.requestQuanity.value = 0;
          r.delivery.value = this.delivery.value;
          r.product.value = this.product.value;
        }
        r.Quantity.value = this.Quantity.value;
        r.requestQuanity.value = this.requestQuanity.value;
        await r.save();
      });
    });
  }
}
@EntityClass
export class WeeklyDeliveryStats extends Entity<number>
{
  families = new NumberColumn();
  deliveries = new NumberColumn();
  products = new NumberColumn();
  constructor(context: Context) {
    super({
      name: "WeeklyDeliveryStats",
      allowApiRead: c => c.isSignedIn(),
      dbName: () => {
        let f = new WeeklyFamilies(context);
        let d = new WeeklyFamilyDeliveries(context);
        let p = new WeeklyFamilyDeliveryProducts(context);
        let sql = new SqlBuilder();
        return sql.entityDbName({
          select: () => [
            sql.countDistinct(f.id, this.families),
            sql.countDistinct(d.id, this.deliveries),
            sql.build('sum (', p.Quantity, ') ', this.products)
          ],
          from: p,
          innerJoin: () => [
            { to: d, on: () => [sql.eq(d.id, p.delivery)] },
            { to: f, on: () => [sql.eq(d.familyId, f.id)] }
          ],
          where: () => [
            d.status.isEqualTo(WeeklyFamilyDeliveryStatus.Delivered)
          ]

        });
      }
    })
    this.initColumns(this.deliveries);
  }
}



export class WeeklyFamilyDeliveryId extends IdColumn {

}





export class WeeklyFamilyDeliveryStatus {

  static Prepare = new WeeklyFamilyDeliveryStatus(10, "הכנה", "אנא בחרי את המוצרים לסל ובסיום לחצי על \"סל מוכן לאריזה\"");
  static Pack = new WeeklyFamilyDeliveryStatus(20, "אריזה", "אנא סמן אילו מוצרים נארזו ובסיום לחץ על \"מוכן לאיסוף\"");
  static Ready = new WeeklyFamilyDeliveryStatus(30, "מוכן לאיסוף");
  static OnRoute = new WeeklyFamilyDeliveryStatus(40, "נאסף");
  static Delivered = new WeeklyFamilyDeliveryStatus(50, "נמסר");
  next: StatusButtonInfo;
  prev: StatusButtonInfo;
  constructor(public id: number, private name: string, public helpText?: string) {

  }
  toString() {
    return this.name;
  }

}
WeeklyFamilyDeliveryStatus.Prepare.next = {
  name: 'סל מוכן לאריזה',
  status: WeeklyFamilyDeliveryStatus.Pack,
  disabled: h => !h.hasRequestItems()
};
WeeklyFamilyDeliveryStatus.Pack.prev = {
  name: 'החזר סל להכנה',
  status: WeeklyFamilyDeliveryStatus.Prepare
};
WeeklyFamilyDeliveryStatus.Pack.next = {
  name: 'מוכן לאיסוף',
  status: WeeklyFamilyDeliveryStatus.Ready
};
WeeklyFamilyDeliveryStatus.Ready.prev = {
  name: 'החזר לאריזה',
  status: WeeklyFamilyDeliveryStatus.Pack
};
WeeklyFamilyDeliveryStatus.Ready.next = {
  name: 'נאסף',
  status: WeeklyFamilyDeliveryStatus.OnRoute
};
WeeklyFamilyDeliveryStatus.OnRoute.prev = {
  name: 'החזר למוכן לאיסוף',
  status: WeeklyFamilyDeliveryStatus.Ready
};
WeeklyFamilyDeliveryStatus.OnRoute.next = {
  name: 'נמסר',
  status: WeeklyFamilyDeliveryStatus.Delivered
};
WeeklyFamilyDeliveryStatus.Delivered.prev = {
  name: 'החזר לנאסף',
  status: WeeklyFamilyDeliveryStatus.OnRoute
};



export interface StatusButtonInfo {
  status: WeeklyFamilyDeliveryStatus,
  name: string,
  disabled?: (h: StatusButtonEnabledHelper) => boolean

}
export interface StatusButtonEnabledHelper {
  hasRequestItems: () => boolean;
}

export class WeeklyFamilyDeliveryStatusColumn extends ClosedListColumn<WeeklyFamilyDeliveryStatus>{
  constructor(settings?: ColumnOptions<WeeklyFamilyDeliveryStatus>) {
    super(WeeklyFamilyDeliveryStatus, settings ? settings : { caption: 'סטטוס שילוח' });
  }

}


export class ProductId extends IdColumn {
  constructor(private context: Context) {
    super()
  }
  getName() {
    return this.context.for(Products).lookup(this).name.value;
  }
}
@EntityClass
export class Products extends IdEntity<ProductId>{
  name = new StringColumn({ caption: 'שם' });
  order = new NumberColumn({ caption: 'סדר', value: 50, dbName: 'ord2' });

  constructor(private context: Context) {
    super(new ProductId(context), {
      name: 'products',
      allowApiCRUD: [Roles.admin, Roles.volunteer],
      allowApiRead: c => c.isSignedIn(),

    });
  }

  quantityToPack = new NumberColumn({
    dbReadOnly: true,
    caption: 'כמות לאריזה',
    dbName: () => {
      let sql = new SqlBuilder();
      let wfdp = new WeeklyFamilyDeliveryProducts(new ServerContext());
      let wfd = new WeeklyFamilyDeliveries(new ServerContext());
      return sql.columnSumInnerSelect(this, wfdp.requestQuanity, {
        from: wfdp,
        innerJoin: () => [{
          to: wfd,
          on: () => [sql.eq(wfdp.delivery, wfd.id)]
        }],
        where: () => [
          wfd.status.isEqualTo(WeeklyFamilyDeliveryStatus.Pack),
          sql.eq(wfdp.product, this.id)]
      });
    },
    allowApiUpdate: false
  });
}
