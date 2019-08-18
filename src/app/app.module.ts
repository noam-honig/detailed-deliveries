import { BrowserModule } from '@angular/platform-browser';
import { NgModule, Injectable } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RadWebModule } from 'radweb';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule } from '@angular/material';
import { UsersComponent } from './users/users.component';
import { UpdateInfoComponent } from './users/update-info/update-info.component';

import { SignInComponent } from './common/sign-in/sign-in.component';
import { DialogService } from './common/dialog';
import { YesNoQuestionComponent } from './common/yes-no-question/yes-no-question.component';
import { InputAreaComponent } from './common/input-area/input-area.component';
import { SelectPopupComponent } from './common/select-popup/select-popup.component';
import { ProductsComponent } from './products/products.component';
import { MyWeeklyFamilyDeliveriesComponent } from './my-weekly-family-deliveries/my-weekly-family-deliveries.component';
import { WeeklyFamilyDeliveryProductListComponent } from './weekly-family-delivery-product-list/weekly-family-delivery-product-list.component';
import { ProductQuantityInDeliveryComponent } from './product-quantity-in-delivery/product-quantity-in-delivery.component';
import { WeeklyPackerByFamilyComponent } from './weekly-packer-by-family/weekly-packer-by-family.component';
import { WeeklyPackerByProductComponent } from './weekly-packer-by-product/weekly-packer-by-product.component';
import { VolunteerGuard, PackerGuard, AdminGuard } from './users/roles';
import { MyWeeklyFamiliesComponent } from './my-weekly-families/my-weekly-families.component';


@Injectable()




@NgModule({
  declarations: [
    AppComponent,
    UsersComponent,
    UpdateInfoComponent,
    ProductsComponent,
    MyWeeklyFamilyDeliveriesComponent,
    ProductQuantityInDeliveryComponent,
    WeeklyFamilyDeliveryProductListComponent,
    YesNoQuestionComponent,
    
    SignInComponent,
    SelectPopupComponent,
    InputAreaComponent,
    WeeklyPackerByFamilyComponent,
    WeeklyPackerByProductComponent,
    MyWeeklyFamiliesComponent
  ],
  imports: [
    BrowserModule,
    
    FormsModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatIconModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    RadWebModule
  ],
  providers: [


    DialogService,

    VolunteerGuard,
    PackerGuard,
    AdminGuard,
    
  ],
  entryComponents: [YesNoQuestionComponent, SignInComponent, SelectPopupComponent,
    InputAreaComponent],
  bootstrap: [AppComponent]
})
export class AppModule { }


