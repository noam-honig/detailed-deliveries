import * as radweb from 'radweb';

// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.
const serverUrl= 'http://localhost:3000/';
export const environment = {
  production: false,
  serverUrl,
  dataSource: new radweb.LocalStorageDataProvider() as radweb.DataProviderFactory
  //dataSource : new radweb.RestDataProvider(serverUrl+ 'dataapi') as radweb.DataProviderFactory
   
};
