import React, { useContext } from 'react';
import { AddGroupWizardContext } from './add-group-wizard-context';
import { GroupCreationSuccess } from '../components/GroupCreationSuccess';

interface AddGroupSuccessProps {
  onClose: () => void;
}

export const AddGroupSuccess = ({ onClose }: AddGroupSuccessProps) => {
  const { setHideForm, setWizardSuccess } = useContext(AddGroupWizardContext);

  const handleCreateAnother = () => {
    setHideForm(false);
    setWizardSuccess(false);
  };

  return <GroupCreationSuccess onClose={onClose} onCreateAnother={handleCreateAnother} />;
};
