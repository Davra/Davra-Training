export interface Organisation {
  UUID: string;
  name: string;
  description?: string;
  labels?: { [key: string]: string };
  parent?: string;
  ancestors?: string[];
  customAttributes?: any;
  tenantId?: string;
  _id?: string;
  createdTime?: number;
  modifiedTime?: number;
  owner?: string;
}

export interface Metric {
  _id?: string
  name: string
  description?: string
  label: string
  units?: string
  labels?: { [key: string]: string }
  semantics?: string
}

export interface UserResponse {
  totalRecords: number;
  records: any[];
}

export interface User {
  name: string;
  UUID?: string;
  roles: string[];
  labels?: object;
  organisations?: string[];
  customAttributes?: any;
  email: string;
}

export interface UserInvite {
  roles: string[];
  labels?: object;
  organisations?: string[];
  emailAddress: string;
  clientId?: string;
}