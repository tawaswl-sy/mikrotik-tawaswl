export interface HotspotUser {
  '.id': string; // RouterOS internal ID like "*1A"
  name: string;
  password?: string;
  profile?: string;
  comment?: string;
  disabled?: boolean | 'true' | 'false';
  uptime?: string;
  'bytes-in'?: string | number;
  'bytes-out'?: string | number;
  'packets-in'?: string | number;
  'packets-out'?: string | number;
  'limit-bytes-total'?: string | number;
  'limit-uptime'?: string;
  'mac-address'?: string;
  'routes'?: string;
  [key: string]: unknown;
}

export interface NewHotspotUser {
  name: string;
  password: string;
  profile?: string;
  comment?: string;
  disabled?: boolean | 'true' | 'false';
  'limit-bytes-total'?: string | number;
  'limit-uptime'?: string;
  'mac-address'?: string;
  server?: string;
}

export interface UpdateHotspotUser {
  name?: string;
  password?: string;
  profile?: string;
  comment?: string;
  disabled?: boolean | 'true' | 'false';
  'limit-bytes-total'?: string | number;
  'limit-uptime'?: string;
  'mac-address'?: string;
}

export interface HotspotActiveSession {
  '.id': string;
  server?: string;
  user: string;
  address: string;
  'mac-address'?: string;
  uptime?: string;
  'bytes-in'?: string | number;
  'bytes-out'?: string | number;
  'session-time-left'?: string;
  idle?: string;
  [key: string]: unknown;
}

export interface BulkCreateHotspotResult {
  success: boolean;
  totalRequested: number;
  successCount: number;
  failedCount: number;
  createdUsers: string[];
  errors: Array<{ name: string; error: string }>;
}

export interface HotspotProfile {
  '.id': string;
  name: string;
  'rate-limit'?: string;
  'shared-users'?: string | number;
  'session-timeout'?: string;
  'keepalive-timeout'?: string;
  'status-autorefresh'?: string;
  'transparent-proxy'?: boolean | 'true' | 'false';
  'open-status-page'?: string;
  [key: string]: unknown;
}

export interface NewHotspotProfile {
  name: string;
  'rate-limit'?: string;
  'shared-users'?: string | number;
  'session-timeout'?: string;
  'keepalive-timeout'?: string;
  'status-autorefresh'?: string;
  [key: string]: unknown;
}

export type CharacterSetType = 'numeric' | 'alphanumeric' | 'uppercase' | 'easy-read';
export type AccountModeType = 'user_pass' | 'user_equals_pass' | 'pin_only';

export interface BatchVoucherCard {
  id: string;
  username: string;
  password: string;
  profile: string;
  limitUptime?: string;
  limitBytesTotal?: number;
  price?: string;
  reseller?: string;
  comment?: string;
  mikrotikId?: string;
  status: 'unused' | 'active' | 'expired';
  createdAt: string;
}

export interface HotspotBatch {
  id: string;
  name: string;
  routerId: string;
  profile: string;
  quantity: number;
  price: string;
  reseller: string;
  prefix: string;
  codeLength: number;
  characterSet: CharacterSetType;
  accountMode: AccountModeType;
  timeLimit?: string;
  dataLimitMB?: number;
  syncedToRouter: boolean;
  createdAt: string;
  cards: BatchVoucherCard[];
}

export interface GenerateBatchInput {
  name?: string;
  routerId?: string;
  profile: string;
  quantity: number;
  price?: string;
  reseller?: string;
  prefix?: string;
  codeLength?: number;
  characterSet?: CharacterSetType;
  accountMode?: AccountModeType;
  timeLimit?: string;
  dataLimitMB?: number;
  syncToRouter?: boolean;
}
