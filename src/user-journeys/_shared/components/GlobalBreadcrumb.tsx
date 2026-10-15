import React from 'react';

/**
 * Production-like global breadcrumb component for user journey tests
 * This mirrors the actual Red Hat Hybrid Cloud Console breadcrumb structure
 */
export const GlobalBreadcrumb: React.FC = () => {
  return (
    <div className="pf-v6-c-toolbar__group chr-c-breadcrumbs__group">
      <section className="pf-v6-c-page__main-breadcrumb chr-c-breadcrumbs pf-v6-u-p-0 pf-v6-u-w-100">
        <div className="pf-v6-u-display-flex pf-v6-u-justify-content-space-between pf-v6-u-pt-sm pf-v6-u-pb-0 pf-v6-u-pl-lg">
          <div className="pf-v6-u-flex-grow-1">
            <nav aria-label="Platform navigation" className="pf-v6-c-breadcrumb pf-v6-u-pt-sm">
              <ol className="pf-v6-c-breadcrumb__list" role="list">
                <li className="pf-v6-c-breadcrumb__item pf-v6-u-pb-sm">
                  <a
                    title="Identity &amp; Access Management"
                    aria-current="page"
                    className="pf-v6-c-breadcrumb__link chr-c-breadcrumbs__link active"
                    href="/iam"
                  >
                    Identity &amp; Access Management
                  </a>
                </li>
                <li className="pf-v6-c-breadcrumb__item pf-v6-u-pb-sm">
                  <span className="pf-v6-c-breadcrumb__item-divider">
                    <svg className="pf-v6-svg" viewBox="0 0 256 512" fill="currentColor" aria-hidden="true" role="img" width="1em" height="1em">
                      <path d="M224.3 273l-136 136c-9.4 9.4-24.6 9.4-33.9 0l-22.6-22.6c-9.4-9.4-9.4-24.6 0-33.9l96.4-96.4-96.4-96.4c-9.4-9.4-9.4-24.6 0-33.9L54.3 103c9.4-9.4 24.6-9.4 33.9 0l136 136c9.5 9.4 9.5 24.6.1 34z" />
                    </svg>
                  </span>
                  <a
                    title="My User Access"
                    aria-current="page"
                    className="pf-v6-c-breadcrumb__link pf-m-current chr-c-breadcrumbs__link active"
                    href="#"
                  >
                    Global Breadcrumb
                  </a>
                </li>
              </ol>
            </nav>
          </div>
          <div className="pf-m-align-self-flex-end">
            <div>
              <div style={{ display: 'contents' }}>
                <button
                  className="pf-v6-c-menu-toggle pf-m-plain pf-v6-u-pt-xs pf-v6-u-text-nowrap"
                  type="button"
                  aria-label="Toggle"
                  aria-expanded="false"
                >
                  <span className="pf-v6-c-menu-toggle__icon">
                    <span className="pf-v6-c-icon pf-m-inline chr-c-breadcrumbs__favorite">
                      <span className="pf-v6-c-icon__content">
                        <svg className="pf-v6-svg" viewBox="0 0 576 512" fill="currentColor" aria-hidden="true" role="img" width="1em" height="1em">
                          <path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z" />
                        </svg>
                      </span>
                    </span>
                    <svg
                      className="pf-v6-svg pf-v6-u-ml-sm"
                      viewBox="0 0 320 512"
                      fill="currentColor"
                      aria-hidden="true"
                      role="img"
                      width="1em"
                      height="1em"
                    >
                      <path d="M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
