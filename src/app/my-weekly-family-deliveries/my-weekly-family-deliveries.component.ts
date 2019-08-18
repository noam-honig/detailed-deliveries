import { Component, OnInit, Input } from '@angular/core';
import { WeeklyFamilyDeliveries, WeeklyFamilyDeliveryStatus } from '../weekly-families-deliveries/weekly-families-deliveries';
import { Context } from 'radweb';
import { WeeklyFamilyDeliveryList } from '../weekly-family-delivery-product-list/weekly-family-delivery-product-list.component';
import { BusyService } from 'radweb';
import { DialogService } from '../common/dialog';
import { Roles } from '../users/roles';


@Component({
  selector: 'app-my-weekly-family-deliveries',
  templateUrl: './my-weekly-family-deliveries.component.html',
  styleUrls: ['./my-weekly-family-deliveries.component.scss']
})
export class MyWeeklyFamilyDeliveriesComponent implements OnInit {

  constructor(public context: Context, public busy: BusyService, private dialog: DialogService) {

  }
  @Input() packing = false;

  async ngOnInit() {
    if (this.packing) {
      this.deliveriesByStatus = [
        { status: WeeklyFamilyDeliveryStatus.Pack, deliveries: [] },
        { status: WeeklyFamilyDeliveryStatus.Ready, deliveries: [] },
        { status: WeeklyFamilyDeliveryStatus.OnRoute, deliveries: [] },
        { status: WeeklyFamilyDeliveryStatus.Prepare, deliveries: [] },
        { status: WeeklyFamilyDeliveryStatus.Delivered, deliveries: [] }];
    }
    this.deliveries = await this.context.for(WeeklyFamilyDeliveries).find({
      limit: 1000,
      where: d => (this.packing
        ? d.status.isGreaterOrEqualTo(WeeklyFamilyDeliveryStatus.Pack).and(d.status.isLessOrEqualTo(WeeklyFamilyDeliveryStatus.Ready))
        : d.status.isDifferentFrom(WeeklyFamilyDeliveryStatus.Delivered))
    });
    this.refreshStatusList();
  }
  refreshStatusList() {
    this.deliveriesByStatus.forEach(d => d.deliveries = []);
    this.deliveries.forEach(d => {
      this.deliveriesByStatus.forEach(s => {
        if (s.status == d.status.value)
          s.deliveries.push(d);
      });
    });
  }
  deliveriesByStatus: DeliveriesByStatus[] = [
    { status: WeeklyFamilyDeliveryStatus.OnRoute, deliveries: [] },
    { status: WeeklyFamilyDeliveryStatus.Ready, deliveries: [] },
    { status: WeeklyFamilyDeliveryStatus.Pack, deliveries: [] },
    { status: WeeklyFamilyDeliveryStatus.Prepare, deliveries: [] },
    { status: WeeklyFamilyDeliveryStatus.Delivered, deliveries: [] }
  ];
  deliveryList = new WeeklyFamilyDeliveryList(this.context, this.busy, this.dialog, d => {
    this.deliveries.splice(this.deliveries.indexOf(d), 1);
    this.refreshStatusList();
  }, () => this.refreshStatusList());
  deliveries: WeeklyFamilyDeliveries[];
  onlyMyFamilies = true;


  showDelivery(d: WeeklyFamilyDeliveries) {
    if (this.packing == true)
      return true;
    if (this.onlyMyFamilies && d.assignedHelper.value != this.context.user.id)
      return false;
    return true;
  }
  allowOtherBaskets() {
    return this.context.isAllowed(Roles.admin) && !this.packing;
  }
  countDeliveries(deliveries: WeeklyFamilyDeliveries[]) {
    if (!deliveries)
      return 0;
    return deliveries.filter(d => this.showDelivery(d)).length;
  }

}
interface DeliveriesByStatus {
  status: WeeklyFamilyDeliveryStatus;
  deliveries: WeeklyFamilyDeliveries[];
}
