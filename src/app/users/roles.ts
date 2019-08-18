import { SignedInGuard } from 'radweb';
import { Injectable } from '@angular/core';



export class Roles {
    static admin = 'admin';
    static packer = 'packer';
    static volunteer = 'volunteer';
    
}


@Injectable()
export class AdminGuard extends SignedInGuard {

    isAllowed() {
        return Roles.admin;
    }
}
@Injectable()
export class PackerGuard extends SignedInGuard {

    isAllowed() {
        return Roles.packer;
    }
}
@Injectable()
export class VolunteerGuard extends SignedInGuard {

    isAllowed() {
        return Roles.volunteer;
    }
}