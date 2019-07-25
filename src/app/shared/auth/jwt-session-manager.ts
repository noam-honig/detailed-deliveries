import { Injectable } from "@angular/core";
import { Router, CanActivate, ActivatedRouteSnapshot } from "@angular/router";
import { MyRouterService } from '../my-router-service';
import { HomeComponent } from '../../home/home.component';
import { JwtHelperService } from '@auth0/angular-jwt';
import { myRouteData, dummyRoute } from '../../app-routing.module';
import { UserInfo } from './userInfo';
import { Context } from '../context';



const authToken = 'authorization';
@Injectable()
export class JwtSessionManager {



    constructor(
        private context: Context
    ) {



    }
    loadSessionFromCookie() {
        let c = document.cookie;
        let i = c.indexOf(authToken + '=');
        if (i >= 0) {
            c = c.substring(i + authToken.length + 2).trim();
            i = c.indexOf(';');
            if (i >= 0) {
                c = c.substring(0, i - 1);
            }
            this._setToken(c);

        }
    }

    async setToken(jwtToken: string, rememberOnDevice = false) {


        if (jwtToken) {
            this._setToken(jwtToken);
            let c = authToken + "=" + jwtToken;
            if (rememberOnDevice)
                c += '; expires = Thu, 01 Jan 2076 00:00:00 GMT';
            document.cookie = c;
            return true;
        }
        else this.signout();
        return false;
    }

    private currentToken: string;
    private _setToken(token: string) {
        this.currentToken = token;
        let user: UserInfo = undefined;
        if (this.currentToken) {
            {
                try { user = new JwtHelperService().decodeToken(token); }
                catch (err) { console.log(err); }
            }
        }
        this.context._setUser(user);
    }

    signout(): any {
        this._setToken('');
        document.cookie = authToken + '=; expires = Thu, 01 Jan 1970 00:00:00 GMT';
    }
}




@Injectable()
export class AuthorizedGuard implements CanActivate {
    constructor(private context: Context, private router: Router) {
    }
    canActivate(route: ActivatedRouteSnapshot) {
        let allowedRoles: string[];

        let data = route.routeConfig.data as myRouteData;
        if (data && data.allowedRoles)
            allowedRoles = data.allowedRoles;

        if (this.context.hasRole(...allowedRoles)) {
            return true;
        }
        if (!(route instanceof dummyRoute))
            this.router.navigate(['/']);
        return false;
    }
}
@Injectable()
export class NotLoggedInGuard implements CanActivate {
    constructor(private context: Context, private router: Router) {
    }
    canActivate(route: ActivatedRouteSnapshot) {
        let allowedRoles: string[];
        if (this.context.user)
            return false;
        return true;

    }
}
