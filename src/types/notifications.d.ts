export {};
declare global {
  type Variant = 'success' | 'warning' | 'danger';

  interface NotificationMeta {
    variant: Variant;
    title: string;
    dismissDelay?: number;
    dismissable?: boolean;
    description?: string;
  }
}
