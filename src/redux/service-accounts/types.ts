export interface ServiceAccountPayloadItem {
  id: string;
  clientId: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: number;
}

export interface ServiceAccount {
  uuid: string;
  clientId: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: number;
  assignedToSelectedGroup: boolean;
}

export interface ServiceAccountsPayload {
  data: (ServiceAccount & { clientId: string })[];
  status: string;
}
