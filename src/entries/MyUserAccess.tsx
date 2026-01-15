/**
 * Entry point for "My User Access" - simplified mode with only the / route.
 * Exposed via Module Federation as './MyUserAccess'.
 */
import React from 'react';
import AppEntry from '../AppEntry';

const MyUserAccess: React.FC = () => <AppEntry muaMode />;

export default MyUserAccess;
