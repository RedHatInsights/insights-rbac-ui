/*global module*/

const SECTION = 'settings';
const APP_ID = 'rbac';
const routes = {};

routes[`/beta/${SECTION}/${APP_ID}`] = { host: 'http://localhost:8002' };
routes[`/${SECTION}/${APP_ID}`] = { host: 'http://localhost:8002' };
routes[`/beta/apps/${APP_ID}`] = { host: 'http://localhost:8002' };
routes[`/apps/${APP_ID}`] = { host: 'http://localhost:8002' };

module.exports = { routes };