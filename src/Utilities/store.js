
import promiseMiddleware from 'redux-promise-middleware';
import { ReducerRegistry, applyReducerHash } from '@red-hat-insights/insights-frontend-components';
import { notifications, notificationsMiddleware } from '@red-hat-insights/insights-frontend-components/components/Notifications';

import reduxLogger from 'redux-logger';
import thunk from 'redux-thunk';
import mainModalReducer, { mainModalInitialState } from '../redux/reducers/mainModalReducer';
import orderReducer, { orderInitialState } from '../redux/reducers/orderReducer';
import platformReducer, { platformInitialState } from '../redux/reducers/platformReducer';
import portfolioReducer, { portfoliosInitialState } from '../redux/reducers/portfolioReducer';

const registry = new ReducerRegistry({}, [ thunk, promiseMiddleware(), notificationsMiddleware({
  errorTitleKey: [ 'message' ],
  errorDescriptionKey: [ 'errors', 'stack' ]
}), reduxLogger ]);

registry.register({
  mainModalReducer: applyReducerHash(mainModalReducer, mainModalInitialState),
  orderReducer: applyReducerHash(orderReducer, orderInitialState),
  platformReducer: applyReducerHash(platformReducer, platformInitialState),
  portfolioReducer: applyReducerHash(portfolioReducer, portfoliosInitialState),
  notifications
});

export default registry.getStore();
