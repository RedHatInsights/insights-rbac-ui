import React, { useEffect } from 'react';
import { EventTypes, useDataViewEventsContext } from '@patternfly/react-data-view';
import { User } from '../../../../../redux/users/reducer';
import { UserDetailsGroupsView } from './UserDetailsGroupsView';
import { UserDetailsRolesView } from './UserDetailsRolesView';
import { UserDetailsDrawer as PresentationalUserDetailsDrawer } from '../../../../users/components/UserDetailsDrawer';

interface DetailDrawerProps {
  focusedUser?: User;
  setFocusedUser: (user: User | undefined) => void;
  children: React.ReactNode;
  ouiaId: string;
}

const UserDetailsDrawer: React.FunctionComponent<DetailDrawerProps> = ({ focusedUser, setFocusedUser, children, ouiaId }) => {
  const context = useDataViewEventsContext();

  useEffect(() => {
    const unsubscribe = context.subscribe(EventTypes.rowClick, (user: User | undefined) => {
      setFocusedUser(user);
    });

    return () => unsubscribe();
  }, [setFocusedUser]);

  // Render functions for the tabs
  const renderGroupsTab = (userId: string, ouiaId: string) => <UserDetailsGroupsView ouiaId={ouiaId} userId={userId} />;

  const renderRolesTab = (userId: string, ouiaId: string) => <UserDetailsRolesView userId={userId} ouiaId={ouiaId} />;

  return (
    <PresentationalUserDetailsDrawer
      focusedUser={focusedUser}
      onUserClick={setFocusedUser}
      onClose={() => setFocusedUser(undefined)}
      ouiaId={ouiaId}
      renderGroupsTab={renderGroupsTab}
      renderRolesTab={renderRolesTab}
    >
      {children}
    </PresentationalUserDetailsDrawer>
  );
};

// Component uses named export only
export { UserDetailsDrawer };
