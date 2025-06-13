export interface IPv6Address {
  input: string;
  isValid: boolean;
  error?: string;
  expanded: string;
  compressed: string;
  binary: string;
  hex: string;
  integer: string;
  base64: string;
  networkAddress: string;
  prefixLength: number;
  firstAddress: string;
  lastAddress: string;
  totalHosts: string;
  totalSubnets: string;
  reverseDNS: string;
  addressType: AddressType;
  scope: AddressScope;
  isIPv4Mapped: boolean;
  isIPv4Compatible: boolean;
  isEUI64: boolean;
  isSLAACCompatible: boolean;
  rfcCompliance: RFCCompliance[];
}

export interface ParsedIPv6 {
  hextets: number[];
  prefixLength: number;
  isValid: boolean;
  error?: string;
}

export interface SubnetInfo {
  network: string;
  firstAddress: string;
  lastAddress: string;
  broadcastAddress: string;
  totalHosts: string;
}

export interface SubnetPlan {
  originalPrefix: string;
  targetPrefixLength: number;
  subnets: SubnetInfo[];
  totalSubnets: number;
}

export enum AddressType {
  GlobalUnicast = 'Global Unicast',
  LinkLocal = 'Link-Local',
  UniqueLocal = 'Unique Local (ULA)',
  Multicast = 'Multicast',
  Anycast = 'Anycast',
  Loopback = 'Loopback',
  Unspecified = 'Unspecified',
  IPv4Mapped = 'IPv4-Mapped',
  IPv4Compatible = 'IPv4-Compatible',
  Reserved = 'Reserved',
  Documentation = 'Documentation',
  Teredo = 'Teredo',
  SixToFour = '6to4'
}

export enum AddressScope {
  InterfaceLocal = 'Interface-Local',
  LinkLocal = 'Link-Local',
  AdminLocal = 'Admin-Local',
  SiteLocal = 'Site-Local',
  OrganizationLocal = 'Organization-Local',
  Global = 'Global'
}

export interface RFCCompliance {
  rfc: string;
  title: string;
  compliant: boolean;
  notes?: string;
}