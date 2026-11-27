import useChrome from '@redhat-cloud-services/frontend-components/useChrome';

export function useChromeLocale(): string {
  // Drop the cast when @redhat-cloud-services/types gains `language`.
  // A shared Chrome export is being discussed in https://issues.redhat.com/browse/RHCLOUD-49432.
  const chrome = useChrome() as { language?: string } | undefined;
  return chrome?.language ?? 'en';
}
