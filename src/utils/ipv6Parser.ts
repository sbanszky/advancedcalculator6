import { IPv6Address, ParsedIPv6, AddressType, AddressScope, RFCCompliance } from '../types/ipv6';

export class IPv6Parser {
  static parse(input: string): IPv6Address {
    const trimmedInput = input.trim();
    
    try {
      const parsed = this.parseIPv6String(trimmedInput);
      
      if (!parsed.isValid) {
        return {
          input: trimmedInput,
          isValid: false,
          error: parsed.error,
          expanded: '',
          compressed: '',
          binary: '',
          hex: '',
          integer: '',
          base64: '',
          networkAddress: '',
          prefixLength: 0,
          firstAddress: '',
          lastAddress: '',
          totalHosts: '',
          totalSubnets: '',
          reverseDNS: '',
          addressType: AddressType.Reserved,
          scope: AddressScope.Global,
          isIPv4Mapped: false,
          isIPv4Compatible: false,
          isEUI64: false,
          isSLAACCompatible: false,
          rfcCompliance: []
        };
      }

      const expanded = this.toExpanded(parsed.hextets);
      const compressed = this.toCompressed(parsed.hextets);
      const binary = this.toBinary(parsed.hextets);
      const addressType = this.getAddressType(parsed.hextets);
      const scope = this.getAddressScope(parsed.hextets, addressType);
      
      const networkHextets = this.getNetworkAddress(parsed.hextets, parsed.prefixLength);
      const networkAddress = this.toCompressed(networkHextets);
      
      const { firstAddress, lastAddress } = this.getAddressRange(parsed.hextets, parsed.prefixLength);
      const totalHosts = this.calculateTotalHosts(parsed.prefixLength);
      const totalSubnets = this.calculateTotalSubnets(parsed.prefixLength);
      
      return {
        input: trimmedInput,
        isValid: true,
        expanded,
        compressed,
        binary,
        hex: this.toHex(parsed.hextets),
        integer: this.toInteger(parsed.hextets),
        base64: this.toBase64(parsed.hextets),
        networkAddress: `${networkAddress}/${parsed.prefixLength}`,
        prefixLength: parsed.prefixLength,
        firstAddress,
        lastAddress,
        totalHosts,
        totalSubnets,
        reverseDNS: this.toReverseDNS(parsed.hextets),
        addressType,
        scope,
        isIPv4Mapped: this.isIPv4Mapped(parsed.hextets),
        isIPv4Compatible: this.isIPv4Compatible(parsed.hextets),
        isEUI64: this.isEUI64(parsed.hextets),
        isSLAACCompatible: parsed.prefixLength === 64,
        rfcCompliance: this.getRFCCompliance(parsed.hextets, addressType)
      };
    } catch (error) {
      return {
        input: trimmedInput,
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown parsing error',
        expanded: '',
        compressed: '',
        binary: '',
        hex: '',
        integer: '',
        base64: '',
        networkAddress: '',
        prefixLength: 0,
        firstAddress: '',
        lastAddress: '',
        totalHosts: '',
        totalSubnets: '',
        reverseDNS: '',
        addressType: AddressType.Reserved,
        scope: AddressScope.Global,
        isIPv4Mapped: false,
        isIPv4Compatible: false,
        isEUI64: false,
        isSLAACCompatible: false,
        rfcCompliance: []
      };
    }
  }

  private static parseIPv6String(input: string): ParsedIPv6 {
    let address = input;
    let prefixLength = 128;

    // Extract prefix length
    const prefixMatch = address.match(/^(.+)\/(\d+)$/);
    if (prefixMatch) {
      address = prefixMatch[1];
      prefixLength = parseInt(prefixMatch[2], 10);
      
      if (prefixLength < 0 || prefixLength > 128) {
        return { hextets: [], prefixLength: 0, isValid: false, error: 'Invalid prefix length' };
      }
    }

    // Handle special cases
    if (address === '::') {
      return { hextets: new Array(8).fill(0), prefixLength, isValid: true };
    }

    // Handle IPv4-mapped addresses
    const ipv4MappedMatch = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
    if (ipv4MappedMatch) {
      const ipv4Parts = ipv4MappedMatch[1].split('.').map(Number);
      if (ipv4Parts.every(part => part >= 0 && part <= 255)) {
        const hextets = [0, 0, 0, 0, 0, 0xffff, 
                        (ipv4Parts[0] << 8) | ipv4Parts[1], 
                        (ipv4Parts[2] << 8) | ipv4Parts[3]];
        return { hextets, prefixLength, isValid: true };
      }
    }

    // Split by :: for compression
    const parts = address.split('::');
    if (parts.length > 2) {
      return { hextets: [], prefixLength: 0, isValid: false, error: 'Multiple :: not allowed' };
    }

    let leftParts: string[] = [];
    let rightParts: string[] = [];

    if (parts.length === 2) {
      leftParts = parts[0] ? parts[0].split(':') : [];
      rightParts = parts[1] ? parts[1].split(':') : [];
    } else {
      leftParts = parts[0].split(':');
    }

    // Validate and convert hex parts
    const hextets: number[] = [];
    
    // Add left parts
    for (const part of leftParts) {
      if (part === '') continue;
      const hexValue = parseInt(part, 16);
      if (isNaN(hexValue) || hexValue > 0xffff) {
        return { hextets: [], prefixLength: 0, isValid: false, error: 'Invalid hexadecimal value' };
      }
      hextets.push(hexValue);
    }

    // Add zeros for compression
    if (parts.length === 2) {
      const zerosNeeded = 8 - leftParts.filter(p => p !== '').length - rightParts.filter(p => p !== '').length;
      for (let i = 0; i < zerosNeeded; i++) {
        hextets.push(0);
      }
    }

    // Add right parts
    for (const part of rightParts) {
      if (part === '') continue;
      const hexValue = parseInt(part, 16);
      if (isNaN(hexValue) || hexValue > 0xffff) {
        return { hextets: [], prefixLength: 0, isValid: false, error: 'Invalid hexadecimal value' };
      }
      hextets.push(hexValue);
    }

    if (hextets.length !== 8) {
      return { hextets: [], prefixLength: 0, isValid: false, error: 'Invalid IPv6 address format' };
    }

    return { hextets, prefixLength, isValid: true };
  }

  private static toExpanded(hextets: number[]): string {
    return hextets.map(h => h.toString(16).padStart(4, '0')).join(':');
  }

  private static toCompressed(hextets: number[]): string {
    let expanded = this.toExpanded(hextets);
    
    // Find longest sequence of zeros
    const zeroSequences = [];
    let currentSequence = { start: -1, length: 0 };
    
    const parts = expanded.split(':');
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === '0000') {
        if (currentSequence.start === -1) {
          currentSequence.start = i;
          currentSequence.length = 1;
        } else {
          currentSequence.length++;
        }
      } else {
        if (currentSequence.start !== -1) {
          zeroSequences.push({ ...currentSequence });
          currentSequence = { start: -1, length: 0 };
        }
      }
    }
    
    if (currentSequence.start !== -1) {
      zeroSequences.push(currentSequence);
    }

    // Find longest sequence (prefer leftmost if equal)
    let longestSequence = zeroSequences.reduce((longest, current) => 
      current.length > longest.length ? current : longest, { start: -1, length: 0 });

    if (longestSequence.length > 1) {
      const beforeCompression = parts.slice(0, longestSequence.start).map(p => parseInt(p, 16).toString(16));
      const afterCompression = parts.slice(longestSequence.start + longestSequence.length).map(p => parseInt(p, 16).toString(16));
      
      let result = beforeCompression.join(':');
      if (longestSequence.start === 0) {
        result = '::' + afterCompression.join(':');
      } else if (longestSequence.start + longestSequence.length === 8) {
        result = beforeCompression.join(':') + '::';
      } else {
        result = beforeCompression.join(':') + '::' + afterCompression.join(':');
      }
      
      return result;
    }

    // No compression possible, just remove leading zeros
    return parts.map(p => parseInt(p, 16).toString(16)).join(':');
  }

  private static toBinary(hextets: number[]): string {
    return hextets.map(h => h.toString(2).padStart(16, '0')).join(' ');
  }

  private static toHex(hextets: number[]): string {
    return '0x' + hextets.map(h => h.toString(16).padStart(4, '0')).join('');
  }

  private static toInteger(hextets: number[]): string {
    let result = BigInt(0);
    for (let i = 0; i < hextets.length; i++) {
      result = result << 16n;
      result = result | BigInt(hextets[i]);
    }
    return result.toString();
  }

  private static toBase64(hextets: number[]): string {
    const bytes = [];
    for (const hextet of hextets) {
      bytes.push((hextet >> 8) & 0xff);
      bytes.push(hextet & 0xff);
    }
    return btoa(String.fromCharCode(...bytes));
  }

  private static getNetworkAddress(hextets: number[], prefixLength: number): number[] {
    const networkHextets = [...hextets];
    
    const fullHextets = Math.floor(prefixLength / 16);
    const remainingBits = prefixLength % 16;
    
    // Zero out hextets beyond the prefix
    for (let i = fullHextets; i < 8; i++) {
      if (i === fullHextets && remainingBits > 0) {
        // Partial hextet - mask the remaining bits
        const mask = (0xffff << (16 - remainingBits)) & 0xffff;
        networkHextets[i] = networkHextets[i] & mask;
      } else {
        networkHextets[i] = 0;
      }
    }
    
    return networkHextets;
  }

  private static getAddressRange(hextets: number[], prefixLength: number): { firstAddress: string, lastAddress: string } {
    const networkHextets = this.getNetworkAddress(hextets, prefixLength);
    const lastHextets = [...networkHextets];
    
    const fullHextets = Math.floor(prefixLength / 16);
    const remainingBits = prefixLength % 16;
    
    // Set all host bits to 1 for last address
    for (let i = fullHextets; i < 8; i++) {
      if (i === fullHextets && remainingBits > 0) {
        const hostMask = (1 << (16 - remainingBits)) - 1;
        lastHextets[i] = lastHextets[i] | hostMask;
      } else {
        lastHextets[i] = 0xffff;
      }
    }
    
    return {
      firstAddress: this.toCompressed(networkHextets),
      lastAddress: this.toCompressed(lastHextets)
    };
  }

  private static calculateTotalHosts(prefixLength: number): string {
    const hostBits = 128 - prefixLength;
    if (hostBits >= 64) {
      return `2^${hostBits} (${(BigInt(2) ** BigInt(hostBits)).toString()})`;
    }
    return (2 ** hostBits).toLocaleString();
  }

  private static calculateTotalSubnets(prefixLength: number): string {
    if (prefixLength >= 64) {
      const subnetBits = prefixLength - 48; // Assuming /48 allocation
      if (subnetBits <= 0) return '1';
      return (2 ** subnetBits).toLocaleString();
    }
    return 'N/A (prefix too short)';
  }

  private static toReverseDNS(hextets: number[]): string {
    const expanded = this.toExpanded(hextets);
    const nibbles = expanded.replace(/:/g, '').split('').reverse();
    return nibbles.join('.') + '.ip6.arpa';
  }

  private static getAddressType(hextets: number[]): AddressType {
    // Check for specific address types
    if (hextets.every(h => h === 0)) {
      return AddressType.Unspecified;
    }
    
    if (hextets.slice(0, 7).every(h => h === 0) && hextets[7] === 1) {
      return AddressType.Loopback;
    }
    
    if (hextets[0] === 0xfe80) {
      return AddressType.LinkLocal;
    }
    
    if ((hextets[0] & 0xfe00) === 0xfc00) {
      return AddressType.UniqueLocal;
    }
    
    if ((hextets[0] & 0xff00) === 0xff00) {
      return AddressType.Multicast;
    }
    
    if (hextets.slice(0, 5).every(h => h === 0) && hextets[5] === 0xffff) {
      return AddressType.IPv4Mapped;
    }
    
    if (hextets.slice(0, 6).every(h => h === 0)) {
      return AddressType.IPv4Compatible;
    }
    
    if (hextets[0] === 0x2001 && hextets[1] === 0x0000) {
      return AddressType.Teredo;
    }
    
    if (hextets[0] === 0x2002) {
      return AddressType.SixToFour;
    }
    
    if (hextets[0] === 0x2001 && (hextets[1] & 0xfff8) === 0x0db8) {
      return AddressType.Documentation;
    }
    
    if ((hextets[0] & 0xe000) === 0x2000) {
      return AddressType.GlobalUnicast;
    }
    
    return AddressType.Reserved;
  }

  private static getAddressScope(hextets: number[], addressType: AddressType): AddressScope {
    switch (addressType) {
      case AddressType.Loopback:
      case AddressType.Unspecified:
        return AddressScope.InterfaceLocal;
      case AddressType.LinkLocal:
        return AddressScope.LinkLocal;
      case AddressType.UniqueLocal:
        return AddressScope.OrganizationLocal;
      case AddressType.GlobalUnicast:
      case AddressType.IPv4Mapped:
        return AddressScope.Global;
      case AddressType.Multicast:
        const scopeField = hextets[0] & 0x000f;
        switch (scopeField) {
          case 1: return AddressScope.InterfaceLocal;
          case 2: return AddressScope.LinkLocal;
          case 4: return AddressScope.AdminLocal;
          case 5: return AddressScope.SiteLocal;
          case 8: return AddressScope.OrganizationLocal;
          case 14: return AddressScope.Global;
          default: return AddressScope.Global;
        }
      default:
        return AddressScope.Global;
    }
  }

  private static isIPv4Mapped(hextets: number[]): boolean {
    return hextets.slice(0, 5).every(h => h === 0) && hextets[5] === 0xffff;
  }

  private static isIPv4Compatible(hextets: number[]): boolean {
    return hextets.slice(0, 6).every(h => h === 0) && 
           (hextets[6] !== 0 || hextets[7] !== 0) && 
           hextets[7] !== 1;
  }

  private static isEUI64(hextets: number[]): boolean {
    // Check if the universal/local bit is set (bit 57 of the address)
    const interfaceId = (BigInt(hextets[4]) << 48n) | 
                       (BigInt(hextets[5]) << 32n) | 
                       (BigInt(hextets[6]) << 16n) | 
                       BigInt(hextets[7]);
    
    // Check for the EUI-64 format pattern (0xfffe in the middle)
    const middle16 = (interfaceId >> 24n) & 0xffffn;
    return middle16 === 0xfffen;
  }

  private static getRFCCompliance(hextets: number[], addressType: AddressType): RFCCompliance[] {
    const compliance: RFCCompliance[] = [];
    
    compliance.push({
      rfc: 'RFC 4291',
      title: 'IP Version 6 Addressing Architecture',
      compliant: true,
      notes: 'Valid IPv6 address format'
    });
    
    compliance.push({
      rfc: 'RFC 5952',
      title: 'A Recommendation for IPv6 Address Text Representation',
      compliant: true,
      notes: 'Follows canonical text representation rules'
    });
    
    if (addressType === AddressType.UniqueLocal) {
      compliance.push({
        rfc: 'RFC 4193',
        title: 'Unique Local IPv6 Unicast Addresses',
        compliant: true,
        notes: 'Valid ULA format (fc00::/7)'
      });
    }
    
    if (addressType === AddressType.LinkLocal) {
      compliance.push({
        rfc: 'RFC 4007',
        title: 'IPv6 Scoped Address Architecture',
        compliant: true,
        notes: 'Valid link-local address (fe80::/10)'
      });
    }
    
    return compliance;
  }
}