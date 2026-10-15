import React from 'react';

/**
 * Production-like header component for user journey tests
 * This mirrors the actual Red Hat Hybrid Cloud Console header structure
 */
export const ProductionHeader: React.FC = () => {
  return (
    <header className="pf-v6-c-masthead pf-m-display-stack-on-sm pf-m-display-inline-on-2xl chr-c-masthead">
      <div className="pf-v6-c-masthead__main">
        <span className="pf-v6-c-masthead__toggle">
          <button
            aria-expanded="true"
            id="nav-toggle"
            aria-label="Global navigation"
            className="pf-v6-c-button pf-m-plain"
            type="button"
            data-ouia-component-type="PF6/Button"
            data-ouia-safe="true"
            data-ouia-component-id="OUIA-Generated-Button-plain-1"
          >
            <span className="pf-v6-c-button__text">
              <svg className="pf-v6-svg" viewBox="0 0 448 512" fill="currentColor" aria-hidden="true" role="img" width="1em" height="1em">
                <path d="M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z" />
              </svg>
            </span>
          </button>
        </span>
        <div className="pf-v6-c-masthead__brand">
          <a className="pf-v6-c-masthead__logo pf-v6-u-pr-0 pf-v6-u-pl-sm" href="/">
            <img
              className="pf-v6-c-brand"
              src="https://console.redhat.com/apps/chrome/js/1556a00da48cc0cf.svg"
              alt="Red Hat Logo"
              style={{ height: '37px' }}
            />
          </a>
          <div style={{ display: 'contents' }}>
            <button
              className="pf-v6-c-menu-toggle pf-v6-u-pr-sm"
              type="button"
              aria-expanded="false"
              data-ouia-component-type="PF6/MenuToggle"
              data-ouia-safe="true"
              data-ouia-component-id="AllServices-DropdownToggle"
            >
              <span className="pf-v6-c-menu-toggle__text">
                <svg
                  className="pf-v6-svg pf-v6-u-mr-sm"
                  viewBox="0 0 512 512"
                  fill="currentColor"
                  aria-hidden="true"
                  role="img"
                  width="1em"
                  height="1em"
                >
                  <path d="M149.333 56v80c0 13.255-10.745 24-24 24H24c-13.255 0-24-10.745-24-24V56c0-13.255 10.745-24 24-24h101.333c13.255 0 24 10.745 24 24zm181.334 240v-80c0-13.255-10.745-24-24-24H205.333c-13.255 0-24 10.745-24 24v80c0 13.255 10.745 24 24 24h101.333c13.256 0 24.001-10.745 24.001-24zm32-240v80c0 13.255 10.745 24 24 24H488c13.255 0 24-10.745 24-24V56c0-13.255-10.745-24-24-24H386.667c-13.255 0-24 10.745-24 24zm-32 80V56c0-13.255-10.745-24-24-24H205.333c-13.255 0-24 10.745-24 24v80c0 13.255 10.745 24 24 24h101.333c13.256 0 24.001-10.745 24.001-24zm-205.334 56H24c-13.255 0-24 10.745-24 24v80c0 13.255 10.745 24 24 24h101.333c13.255 0 24-10.745 24-24v-80c0-13.255-10.745-24-24-24zM0 376v80c0 13.255 10.745 24 24 24h101.333c13.255 0 24-10.745 24-24v-80c0-13.255-10.745-24-24-24H24c-13.255 0-24 10.745-24 24zm386.667-56H488c13.255 0 24-10.745 24-24v-80c0-13.255-10.745-24-24-24H386.667c-13.255 0-24 10.745-24 24v80c0 13.255 10.745 24 24 24zm0 160H488c13.255 0 24-10.745 24-24v-80c0-13.255-10.745-24-24-24H386.667c-13.255 0-24 10.745-24 24v80c0 13.255 10.745 24 24 24zM181.333 376v80c0 13.255 10.745 24 24 24h101.333c13.255 0 24-10.745 24-24v-80c0-13.255-10.745-24-24-24H205.333c-13.255 0-24 10.745-24 24z" />
                </svg>
                Red Hat Hybrid Cloud Console
              </span>
              <span className="pf-v6-c-menu-toggle__controls">
                <span className="pf-v6-c-menu-toggle__toggle-icon">
                  <svg className="pf-v6-svg" viewBox="0 0 320 512" fill="currentColor" aria-hidden="true" role="img" width="1em" height="1em">
                    <path d="M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z" />
                  </svg>
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
      <div className="pf-v6-c-masthead__content pf-v6-u-mx-0">
        <div className="pf-v6-c-toolbar pf-m-full-height">
          <div className="pf-v6-c-toolbar__content">
            <div className="pf-v6-c-toolbar__content-section">
              <div className="pf-v6-c-toolbar__group pf-m-filter-group pf-m-gap-none pf-v6-u-flex-grow-1">
                <div className="pf-v6-c-toolbar__group pf-m-filter-group pf-v6-u-flex-grow-1 pf-v6-u-mr-sm pf-v6-u-ml-4xl-on-2xl">
                  <div className="pf-v6-c-search-input pf-v6-u-w-100 pf-v6-u-align-content-center">
                    <div style={{ display: 'contents' }}>
                      <div className="pf-v6-c-input-group">
                        <div className="pf-v6-c-input-group__item">
                          <div className="pf-v6-c-input-group__item pf-m-plain">
                            <button
                              aria-expanded="false"
                              aria-label="Expandable search input toggle"
                              className="pf-v6-c-button pf-m-plain"
                              type="button"
                            >
                              <span className="pf-v6-c-button__icon">
                                <svg
                                  className="pf-v6-svg"
                                  viewBox="0 0 512 512"
                                  fill="currentColor"
                                  aria-hidden="true"
                                  role="img"
                                  width="1em"
                                  height="1em"
                                >
                                  <path d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z" />
                                </svg>
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pf-v6-c-toolbar__group pf-m-gap-sm pf-v6-m-icon-button-group pf-v6-u-ml-auto pf-v6-u-mr-0">
                  <div className="pf-v6-c-toolbar__item pf-v6-u-mr-0">
                    <button aria-expanded="false" id="SettingsMenu" aria-label="Settings menu" className="pf-v6-c-button pf-m-control" type="button">
                      <span className="pf-v6-c-button__icon">
                        <svg className="pf-v6-svg" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true" role="img" width="1em" height="1em">
                          <path d="M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8.2-74.3-7.8-109.2 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L88.7 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L67.3 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8.2 74.3 7.8 109.2 0 5.5-1.2 9.4-6.1 9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z" />
                        </svg>
                      </span>
                    </button>
                  </div>
                  <div className="pf-v6-c-toolbar__item pf-v6-u-mr-0">
                    <button id="HelpPanelToggle" aria-label="Toggle help panel" className="pf-v6-c-button pf-m-control" type="button">
                      <span className="pf-v6-c-button__icon pf-m-start">
                        <svg className="pf-v6-svg" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true" role="img" width="1em" height="1em">
                          <path d="M504 256c0 136.997-111.043 248-248 248S8 392.997 8 256C8 119.083 119.043 8 256 8s248 111.083 248 248zM262.655 90c-54.497 0-89.255 22.957-116.549 63.758-3.536 5.286-2.353 12.415 2.715 16.258l34.699 26.31c5.205 3.947 12.621 3.008 16.665-2.122 17.864-22.658 30.113-35.797 57.303-35.797 20.429 0 45.698 13.148 45.698 32.958 0 14.976-12.363 22.667-32.534 33.976C247.128 238.528 216 254.941 216 296v4c0 6.627 5.373 12 12 12h56c6.627 0 12-5.373 12-12v-1.333c0-28.462 83.186-29.647 83.186-106.667 0-58.002-60.165-102-116.531-102zM256 338c-25.365 0-46 20.635-46 46 0 25.364 20.635 46 46 46s46-20.636 46-46c0-25.365-20.635-46-46-46z" />
                        </svg>
                      </span>
                      <span className="pf-v6-c-button__text">Help</span>
                    </button>
                  </div>
                  <div className="pf-v6-c-toolbar__item pf-v6-u-mr-0">
                    <button className="pf-v6-c-menu-toggle" type="button" aria-expanded="false">
                      <span className="pf-v6-c-menu-toggle__icon">
                        <img
                          src="https://console.redhat.com/apps/chrome/js/8f3e80eba644e3ec.svg"
                          alt="User Avatar"
                          className="pf-v6-c-avatar pf-m-sm"
                        />
                      </span>
                      <span className="pf-v6-c-menu-toggle__text">Insights QA</span>
                      <span className="pf-v6-c-menu-toggle__controls">
                        <span className="pf-v6-c-menu-toggle__toggle-icon">
                          <svg className="pf-v6-svg" viewBox="0 0 320 512" fill="currentColor" aria-hidden="true" role="img" width="1em" height="1em">
                            <path d="M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z" />
                          </svg>
                        </span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
