export {};
declare global {
  interface SimpleAction<T> {
    type: string;
    payload: T;
  }

  interface ActionWithNotification<T> {
    type: string;
    payload: T;
    meta: {
      notifications: {
        fulfilled: NotificationMeta;
        rejected: ((payload: any) => NotificationMeta) | NotificationMeta;
      };
    };
  }
}
