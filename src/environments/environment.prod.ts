import * as radweb from 'radweb';
const serverUrl= '/';

export const environment = {
  production: true,
  serverUrl,
  dataSource: new radweb.LocalStorageDataProvider() as radweb.DataProviderFactory
  //dataSource : new radweb.RestDataProvider(serverUrl+ 'dataapi') as radweb.DataProviderFactory
};
