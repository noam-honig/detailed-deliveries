import { Component, OnInit } from '@angular/core';

import { JwtSessionManager, Context, RouteHelperService } from 'radweb';
import { ServerSignIn } from "../../users/server-sign-in";
import { DialogService } from '../dialog';
import { Roles } from '../../users/roles';
import { MyWeeklyFamiliesComponent } from '../../my-weekly-families/my-weekly-families.component';
import { WeeklyPackerByFamilyComponent } from '../../weekly-packer-by-family/weekly-packer-by-family.component';




@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})
export class SignInComponent implements OnInit {

  constructor(private dialog: DialogService,
    private authService: JwtSessionManager, private router: RouteHelperService, private context: Context) { }
  user: string;
  remember: boolean;
  password: string;
  ngOnInit() {
  }
  async signIn() {
    if (!this.user || !(await this.authService.setToken(await ServerSignIn.signIn(this.user, this.password), this.remember))) {
      this.dialog.YesNoQuestion("טלפון או סיסמה שגויה");
    }
    else {
      if (this.context.isAllowed(Roles.volunteer))
        this.router.navigateToComponent(MyWeeklyFamiliesComponent);
      else if (this.context.isAllowed(Roles.packer))
        this.router.navigateToComponent(WeeklyPackerByFamilyComponent);
    }
  }


}
