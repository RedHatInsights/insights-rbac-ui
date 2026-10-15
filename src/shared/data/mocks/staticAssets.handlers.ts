import { HttpResponse, http } from 'msw';

/** Handlers for static asset requests (e.g. technology icons) used in stories. */
export function staticAssetsHandlers() {
  return [
    http.get('*/apps/frontend-assets/technology-icons/insights.svg', () =>
      HttpResponse.text('<svg></svg>', { headers: { 'Content-Type': 'image/svg+xml' } }),
    ),
    http.get('*/apps/frontend-assets/technology-icons/openshift.svg', () =>
      HttpResponse.text('<svg></svg>', { headers: { 'Content-Type': 'image/svg+xml' } }),
    ),
  ];
}
