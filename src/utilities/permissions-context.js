import { createContext } from 'react';

const PermissionsContext = createContext({
  userAccessAdministrator: false,
  orgAdmin: false,
});

export default PermissionsContext;
