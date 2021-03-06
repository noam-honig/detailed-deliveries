import { Roles } from './roles';
import { JWTCookieAuthorizationHelper } from 'radweb-server';
import { RunOnServer } from 'radweb';
import { UserInfo, Context } from 'radweb';
import { Users } from './users';
export class ServerSignIn {
    static helper: JWTCookieAuthorizationHelper;
    @RunOnServer({ allowed: () => true })
    static async signIn(user: string, password: string, context?: Context) {
        let result: UserInfo;
        await context.for(Users).foreach(h => h.phone.isEqualTo(user), async (h) => {
            if (!h.realStoredPassword.value || Users.passwordHelper.verify(password, h.realStoredPassword.value)) {
                result = {
                    id: h.id.value,
                    roles: [],
                    name: h.name.value
                };
                if (h.admin.value) {
                    result.roles.push(Roles.admin, Roles.volunteer, Roles.packer);
                } else if (h.volunteer.value)
                    result.roles.push(Roles.volunteer);
                if (h.packer)
                    result.roles.push(Roles.packer);
            }
        });
        if (result) {
            return ServerSignIn.helper.createSecuredTokenBasedOn(<any>result);
        }
        return undefined;
    }
}
