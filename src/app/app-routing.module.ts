import { RadWebModule, SignedInGuard } from 'radweb';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';



import { UpdateInfoComponent } from './users/update-info/update-info.component';

import { UsersComponent } from './users/users.component';
import {  AdminGuard, VolunteerGuard, PackerGuard } from './users/roles';
import { ProductsComponent } from './products/products.component';
import { MyWeeklyFamilyDeliveriesComponent } from './my-weekly-family-deliveries/my-weekly-family-deliveries.component';
import { WeeklyPackerByFamilyComponent } from './weekly-packer-by-family/weekly-packer-by-family.component';
import { WeeklyPackerByProductComponent } from './weekly-packer-by-product/weekly-packer-by-product.component';
import { MyWeeklyFamiliesComponent } from './my-weekly-families/my-weekly-families.component';
import { SignInComponent } from './common/sign-in/sign-in.component';


const routes: Routes = [
  
  { path: 'my-weekly-families', component: MyWeeklyFamiliesComponent, data: { name: 'משפחות' }, canActivate: [VolunteerGuard] },
  { path: 'products', component: ProductsComponent, canActivate: [AdminGuard], data: { name: 'מוצרים' } },
  { path: 'User Accounts', component: UsersComponent, canActivate: [AdminGuard], data: { name: 'מתנדבות' } },
  { path: 'my-weekly-families-deliveries', component: MyWeeklyFamilyDeliveriesComponent, data: { name: 'סלים' }, canActivate: [VolunteerGuard] },
  { path: 'weekly-packer-by-family', component: WeeklyPackerByFamilyComponent, data: { name: 'אריזה לפי חבילות' }, canActivate: [PackerGuard] },
  { path: 'weekly-packer-by-product', component: WeeklyPackerByProductComponent, data: { name: 'אריזה לפי מוצרים' }, canActivate: [PackerGuard] },
  { path: 'Account Info', component: UpdateInfoComponent, canActivate: [SignedInGuard], data: { name: 'עדכון פרטים' } },
  { path: 'login', component: SignInComponent, data: { name: 'כניסה' } },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login', pathMatch: 'full' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes), RadWebModule],
  providers: [AdminGuard],
  exports: [RouterModule]
})
export class AppRoutingModule { }

SignedInGuard.componentToNavigateIfNotAllowed = SignInComponent;