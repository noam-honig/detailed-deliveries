
import * as express from 'express';
import * as secure from 'express-force-https';
import * as compression from 'compression';
import { ExpressBridge, ActualSQLServerDataProvider } from 'radweb-server';
import { DataApi } from 'radweb';
import * as fs from 'fs';
import { myAuthInfo } from '../shared/auth/my-auth-info';
import { evilStatics } from '../shared/auth/evil-statics';
import { serverInit } from './serverInit';
import { ServerEvents } from './server-events';


import { serverActionField, myServerAction, actionInfo } from "../shared/auth/server-action";
import { SiteArea } from "radweb-server";

import '../app.module';
import { ContextEntity, ServerContext, allEntities } from "../shared/context";
import * as jwt from 'jsonwebtoken';
import * as passwordHash from 'password-hash';

serverInit().then(async () => {

 
    let app = express();
    if (!process.env.DISABLE_SERVER_EVENTS) {
        let serverEvents = new ServerEvents(app);
        
    }
    if (process.env.logSqls){
           ActualSQLServerDataProvider.LogToConsole = true;
    }

    app.use(compression());

    if (!process.env.DISABLE_HTTPS)
        app.use(secure);
    let port = process.env.PORT || 3000;

    let eb = new ExpressBridge<myAuthInfo>(app);

    let allUsersAlsoNotLoggedIn = eb.addArea('/api');

    evilStatics.auth.tokenSignKey = process.env.TOKEN_SIGN_KEY;

    var addAction = (area: SiteArea<myAuthInfo>, a: any) => {
        let x = <myServerAction>a[serverActionField];
        if (!x) {
            throw 'failed to set server action, did you forget the RunOnServerDecorator?';
        }
        area.addAction(x);
    };


    actionInfo.runningOnServer = true;
    evilStatics.auth.applyTo(eb, allUsersAlsoNotLoggedIn, {
        verify: (t, k) => jwt.verify(t, k),
        sign: (i, k) => jwt.sign(i, k),
        decode: t => jwt.decode(t)
    });
    evilStatics.passwordHelper = {
        generateHash: p => passwordHash.generate(p),
        verify: (p, h) => passwordHash.verify(p, h)
    }

    actionInfo.allActions.forEach(a => {
        addAction(allUsersAlsoNotLoggedIn, a);
    });
    let errors = '';
    //add Api Entries
    allEntities.forEach(e => {
        let x = new ServerContext().for(e).create();
        if (x instanceof ContextEntity) {
            let j = x;
            allUsersAlsoNotLoggedIn.add(r => {
                let c = new ServerContext();
                c.setReq(r);
                let y = j._getEntityApiSettings(c);
                if (y.allowRead === undefined)
                    errors += '\r\n' + j.__getName()
                return new DataApi(c.create(e), y);
            });
        }
    });
    if (errors.length > 0) {
        console.log('Security not set for:' + errors);
    }




    app.get('/cache.manifest', (req, res) => {
        let result =
            `CACHE MANIFEST
    CACHE:
    /
    /home
    `;
        fs.readdirSync('dist').forEach(x => {
            result += `/${x}
        `;

        });
        result += `
    FALLBACK:
    / /
    
    NETWORK:
    /dataApi/`

        res.send(result);
    });
    app.use('/assets/apple-touch-icon.png', async (req, res) => {

      
        try {
            res.send(fs.readFileSync('dist/assets/apple-touch-icon.png'));
        } catch (err) {
            res.statusCode = 404;
            res.send(err);
        }
    });
    app.use('/favicon.ico', async (req, res) => {
        res.contentType('ico');
        try {
            res.send(fs.readFileSync('dist/favicon.ico'));
        }
        catch (err) {
            res.statusCode = 404;
            res.send(err);
        }
    });
    async function sendIndex(res: express.Response) {
        const index = 'dist/index.html';

        if (fs.existsSync(index)) {
            

            res.send(fs.readFileSync(index).toString());
        }
        else {
            res.send('No Result' + fs.realpathSync(index));
        }
    }

    app.get('', (req, res) => {

        sendIndex(res);
    });
    app.get('/index.html', (req, res) => {

        sendIndex(res);
    });
    app.use(express.static('dist'));

    app.use('/*', async (req, res) => {
        if (req.method == 'OPTIONS')
            res.send('');
        else {
            await sendIndex(res);
        }
    });
    app.listen(port);
});