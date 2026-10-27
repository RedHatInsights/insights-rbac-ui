/** CIAM-12578: the SAT login username is derived from its stable client ID. */
export function getServiceAccountIdentifier(clientId: string, serviceAccountType: string | undefined, satEnabled: boolean): string {
  return satEnabled && serviceAccountType === 'service_access_token' ? `|service-account-${clientId}` : clientId;
}
