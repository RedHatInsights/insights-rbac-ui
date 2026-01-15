import React from 'react';
import { BrowserRouter, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

// Router location spy (used by pagination URL sync stories)
export const RouterLocationSpy: React.FC = () => {
  const location = useLocation();
  return (
    <pre data-testid="router-location" style={{ display: 'none' }}>
      {location.pathname}
      {location.search}
    </pre>
  );
};

// Shared router decorator for Storybook stories.
//
// Parameters supported:
// - routerInitialEntries?: string[]
// - routerPath?: string (when set, wraps story in Routes/Route so use*Route() hooks are happy)
// - routerUseMemoryRouter?: boolean (forces MemoryRouter even without routerInitialEntries; useful for Storybook iframe safety)
// - routerDefaultInitialEntries?: string[] (only used when routerUseMemoryRouter=true and routerInitialEntries is undefined)
// - routerMinHeight?: string (default: '600px')
export const withRouter = (Story: any, context: any) => {
  const params = context?.parameters ?? {};
  const {
    routerInitialEntries,
    routerPath,
    routerUseMemoryRouter,
    routerDefaultInitialEntries,
    routerMinHeight,
  } = params as {
    routerInitialEntries?: string[];
    routerPath?: string;
    routerUseMemoryRouter?: boolean;
    routerDefaultInitialEntries?: string[];
    routerMinHeight?: string;
  };

  const minHeight = routerMinHeight ?? '600px';

  const initialEntries =
    routerInitialEntries ??
    (routerUseMemoryRouter
      ? routerDefaultInitialEntries ?? (routerPath ? [routerPath] : ['/'])
      : undefined);

  const storyEl = routerPath ? (
    <Routes>
      <Route path={routerPath} element={<Story />} />
    </Routes>
  ) : (
    <Story />
  );

  const body = (
    <div style={{ minHeight }}>
      <RouterLocationSpy />
      {storyEl}
    </div>
  );

  return initialEntries ? (
    <MemoryRouter initialEntries={initialEntries}>{body}</MemoryRouter>
  ) : (
    <BrowserRouter>{body}</BrowserRouter>
  );
};


