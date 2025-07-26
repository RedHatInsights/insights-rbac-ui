import { createContext } from 'react';

export interface PermissionsContextType {
  userAccessAdministrator: boolean;
  orgAdmin: boolean;
}

const PermissionsContext = createContext<PermissionsContextType>({
  userAccessAdministrator: false,
  orgAdmin: false,
});

export default PermissionsContext;
