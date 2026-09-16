export interface RouterCredentials {
  host: string;
  username: string;
  password: string;
  port?: number;
  ssl?: boolean;
  timeout?: number;
}

export interface RouterInfo {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  ssl: boolean;
  status: 'online' | 'offline' | 'unauthorized' | 'unknown';
  createdAt?: string;
  updatedAt?: string;
}

export interface SavedRouter {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  encryptedPassword: string;
  ssl: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewRouterInput {
  name: string;
  host: string;
  port?: number;
  username: string;
  password: string;
  ssl?: boolean;
}

export interface RouterosApiErrorDetail {
  error?: number;
  message?: string;
  detail?: string;
}
