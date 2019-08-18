
import { EntityClass, Context, EntityOptions, IdEntity, StringColumn, NumberColumn } from "radweb";

import { WeeklyFamilyDeliveries, WeeklyFamilyDeliveryStatusColumn, WeeklyFamilyDeliveryStatus } from "../weekly-families-deliveries/weekly-families-deliveries";
import { IdColumn } from "radweb";
import { UserId } from '../users/users';
import { DateTimeColumn } from '../shared/types';
import { Roles } from '../users/roles';
import { SqlBuilder } from '../shared/sql-builder';




@EntityClass
export class WeeklyFamilies extends IdEntity<WeeklyFamilyId>{

    constructor(protected context: Context, options?: EntityOptions) {
        super(new WeeklyFamilyId(), options ? options : {
            name: 'weeklyFamilies',
            allowApiCRUD: c => c.isAllowed(Roles.volunteer),
            allowApiRead: c => c.isSignedIn(),
            apiDataFilter: () => {
                if (context.isAllowed(Roles.admin))
                    return undefined;
                return this.assignedHelper.isEqualTo(this.context.user.id);
            }


        });
        this.lastDelivery.dontShowTimeForOlderDates = true;
    }
    name = new StringColumn({ caption: 'שם' });

    codeName = new StringColumn({ caption: 'שם קוד' });
    packingComment = new StringColumn('הערה לאריזה');
    assignedHelper = new UserId(this.context, { caption: 'אחראית' });
    lastDelivery = new DateTimeColumn(
        {
            caption: 'משלוח אחרון',
            dbReadOnly: true,
            dbName: () => {
                let wfd = new WeeklyFamilyDeliveries(this.context);
                let sql = new SqlBuilder();
                return sql.columnInnerSelect(this, {
                    select: () => [wfd.deliveredOn],
                    from: wfd,
                    where: () => [sql.eq(wfd.familyId, this.id), wfd.status.isEqualTo(WeeklyFamilyDeliveryStatus.Delivered)],
                    orderBy: [{ column: wfd.ordnial, descending: true }]
                });

            }
        });
    lastDeliveryStatus = new WeeklyFamilyDeliveryStatusColumn(
        {
            caption: 'סטטוס אחרון',
            dbReadOnly: true,
            dbName: () => {
                let wfd = new WeeklyFamilyDeliveries(this.context);
                let sql = new SqlBuilder();
                return sql.columnInnerSelect(this, {
                    select: () => [wfd.status],
                    from: wfd,
                    where: () => [sql.eq(wfd.familyId, this.id)],
                    orderBy: [{ column: wfd.ordnial, descending: true }]
                });

            }
        });
    deliveriesInPacking = new NumberColumn({
        caption: 'משלוחים באריזה',
        dbReadOnly: true,
        dbName: () => {
            let d = new WeeklyFamilyDeliveries(this.context);
            let sql = new SqlBuilder();
            return sql.columnCount(this, {
                from: d,
                where: () => [sql.eq(d.familyId, this.id), sql.in(d.status, WeeklyFamilyDeliveryStatus.Pack.id, WeeklyFamilyDeliveryStatus.Ready.id)]
            });
        }

    });


}





export class WeeklyFamilyId extends IdColumn {

}