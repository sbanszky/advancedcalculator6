import { SubnetInfo, SubnetPlan } from '../types/ipv6';
import { IPv6Parser } from './ipv6Parser';

export class IPv6Subnetting {
  static calculateSubnets(prefix: string, targetPrefixLength: number, count?: number): SubnetPlan {
    const parsed = IPv6Parser.parse(prefix);
    
    if (!parsed.isValid) {
      throw new Error('Invalid IPv6 prefix');
    }
    
    if (targetPrefixLength <= parsed.prefixLength) {
      throw new Error('Target prefix length must be longer than current prefix');
    }
    
    if (targetPrefixLength > 128) {
      throw new Error('Target prefix length cannot exceed 128');
    }
    
    const subnetBits = targetPrefixLength - parsed.prefixLength;
    const totalPossibleSubnets = Math.pow(2, subnetBits);
    const subnetsToGenerate = count ? Math.min(count, totalPossibleSubnets) : totalPossibleSubnets;
    
    const subnets: SubnetInfo[] = [];
    const baseHextets = this.parseHextets(parsed.expanded);
    
    for (let i = 0; i < subnetsToGenerate; i++) {
      const subnetHextets = this.calculateSubnetAddress(baseHextets, parsed.prefixLength, targetPrefixLength, i);
      const network = this.hextetsToAddress(subnetHextets);
      const { first, last } = this.getSubnetRange(subnetHextets, targetPrefixLength);
      
      subnets.push({
        network: `${network}/${targetPrefixLength}`,
        firstAddress: first,
        lastAddress: last,
        broadcastAddress: last, // IPv6 doesn't have broadcast, using last address
        totalHosts: this.calculateHostCount(targetPrefixLength)
      });
    }
    
    return {
      originalPrefix: prefix,
      targetPrefixLength,
      subnets,
      totalSubnets: totalPossibleSubnets
    };
  }
  
  static summarizeRoutes(prefixes: string[]): string[] {
    // Simple route summarization
    const networks = prefixes
      .map(prefix => IPv6Parser.parse(prefix))
      .filter(parsed => parsed.isValid)
      .sort((a, b) => a.expanded.localeCompare(b.expanded));
    
    if (networks.length === 0) return [];
    
    const summarized: string[] = [];
    let currentBlock = networks[0];
    
    for (let i = 1; i < networks.length; i++) {
      const next = networks[i];
      
      // Try to find common prefix
      const commonPrefixLength = this.findCommonPrefixLength(
        currentBlock.expanded, 
        next.expanded
      );
      
      // If networks are adjacent and can be summarized
      if (commonPrefixLength >= Math.min(currentBlock.prefixLength, next.prefixLength) - 1) {
        // Merge networks
        const mergedPrefixLength = Math.min(commonPrefixLength, currentBlock.prefixLength - 1);
        const networkHextets = this.getNetworkHextets(currentBlock.expanded, mergedPrefixLength);
        
        currentBlock = {
          ...currentBlock,
          networkAddress: `${this.hextetsToAddress(networkHextets)}/${mergedPrefixLength}`,
          prefixLength: mergedPrefixLength
        };
      } else {
        summarized.push(currentBlock.networkAddress);
        currentBlock = next;
      }
    }
    
    summarized.push(currentBlock.networkAddress);
    return summarized;
  }
  
  private static parseHextets(expanded: string): number[] {
    return expanded.split(':').map(hex => parseInt(hex, 16));
  }
  
  private static calculateSubnetAddress(
    baseHextets: number[], 
    basePrefixLength: number, 
    targetPrefixLength: number, 
    subnetIndex: number
  ): number[] {
    const result = [...baseHextets];
    const subnetBits = targetPrefixLength - basePrefixLength;
    
    // Calculate which hextet to modify and how
    const totalBitsFromStart = basePrefixLength;
    const hextetIndex = Math.floor(totalBitsFromStart / 16);
    const bitsInHextet = totalBitsFromStart % 16;
    
    // Distribute subnet bits across hextets
    let remainingSubnetBits = subnetBits;
    let currentIndex = subnetIndex;
    let currentHextetIndex = hextetIndex;
    
    while (remainingSubnetBits > 0 && currentHextetIndex < 8) {
      const availableBitsInHextet = 16 - (currentHextetIndex === hextetIndex ? bitsInHextet : 0);
      const bitsToUse = Math.min(remainingSubnetBits, availableBitsInHextet);
      
      const shift = availableBitsInHextet - bitsToUse;
      const mask = ((1 << bitsToUse) - 1) << shift;
      const subnetPart = (currentIndex >> (remainingSubnetBits - bitsToUse)) & ((1 << bitsToUse) - 1);
      
      result[currentHextetIndex] = (result[currentHextetIndex] & ~mask) | (subnetPart << shift);
      
      remainingSubnetBits -= bitsToUse;
      currentHextetIndex++;
    }
    
    return result;
  }
  
  private static getSubnetRange(hextets: number[], prefixLength: number): { first: string, last: string } {
    const firstHextets = [...hextets];
    const lastHextets = [...hextets];
    
    // Zero out host bits for first address
    const hostBits = 128 - prefixLength;
    const fullHextets = Math.floor(prefixLength / 16);
    const remainingBits = prefixLength % 16;
    
    // Set host bits for last address
    for (let i = fullHextets; i < 8; i++) {
      if (i === fullHextets && remainingBits > 0) {
        const hostMask = (1 << (16 - remainingBits)) - 1;
        firstHextets[i] = firstHextets[i] & ~hostMask;
        lastHextets[i] = lastHextets[i] | hostMask;
      } else {
        firstHextets[i] = 0;
        lastHextets[i] = 0xffff;
      }
    }
    
    return {
      first: this.hextetsToAddress(firstHextets),
      last: this.hextetsToAddress(lastHextets)
    };
  }
  
  private static hextetsToAddress(hextets: number[]): string {
    return hextets.map(h => h.toString(16).padStart(4, '0')).join(':');
  }
  
  private static calculateHostCount(prefixLength: number): string {
    const hostBits = 128 - prefixLength;
    if (hostBits >= 64) {
      return `2^${hostBits}`;
    }
    return Math.pow(2, hostBits).toLocaleString();
  }
  
  private static findCommonPrefixLength(addr1: string, addr2: string): number {
    const hextets1 = this.parseHextets(addr1);
    const hextets2 = this.parseHextets(addr2);
    
    let commonBits = 0;
    
    for (let i = 0; i < 8; i++) {
      const xor = hextets1[i] ^ hextets2[i];
      if (xor === 0) {
        commonBits += 16;
      } else {
        // Count leading zeros in XOR result
        let temp = xor;
        let leadingZeros = 0;
        for (let bit = 15; bit >= 0; bit--) {
          if ((temp & (1 << bit)) === 0) {
            leadingZeros++;
          } else {
            break;
          }
        }
        commonBits += leadingZeros;
        break;
      }
    }
    
    return commonBits;
  }
  
  private static getNetworkHextets(expanded: string, prefixLength: number): number[] {
    const hextets = this.parseHextets(expanded);
    const result = [...hextets];
    
    const fullHextets = Math.floor(prefixLength / 16);
    const remainingBits = prefixLength % 16;
    
    for (let i = fullHextets; i < 8; i++) {
      if (i === fullHextets && remainingBits > 0) {
        const mask = (0xffff << (16 - remainingBits)) & 0xffff;
        result[i] = result[i] & mask;
      } else {
        result[i] = 0;
      }
    }
    
    return result;
  }
}