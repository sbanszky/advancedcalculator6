import React, { useState } from 'react';
import { IPv6Address } from '../types/ipv6';
import { 
  Network, 
  Info, 
  Hash, 
  Binary, 
  Globe, 
  Shield, 
  Copy,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';

interface AddressDetailsProps {
  address: IPv6Address;
}

interface ExpandableSection {
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  defaultExpanded?: boolean;
}

export const AddressDetails: React.FC<AddressDetailsProps> = ({ address }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['general', 'formats'])
  );
  const [showBinary, setShowBinary] = useState(false);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderBinaryAddress = () => {
    const binaryParts = address.binary.split(' ');
    const prefixHextets = Math.floor(address.prefixLength / 16);
    const remainingBits = address.prefixLength % 16;

    return (
      <div className="font-mono text-sm space-y-1">
        {binaryParts.map((part, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-gray-400 w-8">{index}:</span>
            <span className="flex">
              {part.split('').map((bit, bitIndex) => {
                let isPrefix = false;
                if (index < prefixHextets) {
                  isPrefix = true;
                } else if (index === prefixHextets && bitIndex < remainingBits) {
                  isPrefix = true;
                }
                
                return (
                  <span
                    key={bitIndex}
                    className={`${
                      isPrefix 
                        ? 'text-blue-300 bg-blue-900/30' 
                        : 'text-teal-300 bg-teal-900/30'
                    } px-0.5 ${bitIndex % 4 === 3 ? 'mr-1' : ''}`}
                  >
                    {bit}
                  </span>
                );
              })}
            </span>
            <span className="text-xs text-gray-500">
              {index < prefixHextets ? 'Network' : 
               index === prefixHextets && remainingBits > 0 ? 'Mixed' : 'Interface ID'}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const getAddressTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Global Unicast': 'text-green-400 bg-green-900/20',
      'Link-Local': 'text-yellow-400 bg-yellow-900/20',
      'Unique Local (ULA)': 'text-purple-400 bg-purple-900/20',
      'Multicast': 'text-orange-400 bg-orange-900/20',
      'Loopback': 'text-blue-400 bg-blue-900/20',
      'Reserved': 'text-red-400 bg-red-900/20',
      'IPv4-Mapped': 'text-cyan-400 bg-cyan-900/20'
    };
    return colors[type] || 'text-gray-400 bg-gray-900/20';
  };

  const sections: ExpandableSection[] = [
    {
      title: 'General Information',
      icon: <Info className="w-5 h-5" />,
      defaultExpanded: true,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Address Type</label>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getAddressTypeColor(address.addressType)}`}>
                {address.addressType}
              </span>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Scope</label>
              <div className="text-white">{address.scope}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Prefix Length</label>
              <div className="text-white">/{address.prefixLength}</div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Features</label>
              <div className="flex flex-wrap gap-2">
                {address.isIPv4Mapped && (
                  <span className="px-2 py-1 bg-cyan-900/30 text-cyan-300 text-xs rounded">IPv4-Mapped</span>
                )}
                {address.isIPv4Compatible && (
                  <span className="px-2 py-1 bg-cyan-900/30 text-cyan-300 text-xs rounded">IPv4-Compatible</span>
                )}
                {address.isEUI64 && (
                  <span className="px-2 py-1 bg-green-900/30 text-green-300 text-xs rounded">EUI-64</span>
                )}
                {address.isSLAACCompatible && (
                  <span className="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs rounded">SLAAC Ready</span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Total Hosts</label>
              <div className="text-white font-mono text-sm">{address.totalHosts}</div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Address Formats',
      icon: <Hash className="w-5 h-5" />,
      defaultExpanded: true,
      content: (
        <div className="space-y-4">
          {[
            { label: 'Expanded', value: address.expanded },
            { label: 'Compressed', value: address.compressed },
            { label: 'Network Address', value: address.networkAddress },
            { label: 'Hexadecimal', value: address.hex },
            { label: 'Integer', value: address.integer },
            { label: 'Base64', value: address.base64 }
          ].map((format, index) => (
            <div key={index} className="group">
              <label className="block text-xs font-medium text-gray-400 mb-1">{format.label}</label>
              <div className="flex items-center gap-2 p-3 bg-gray-700 rounded-lg">
                <code className="text-white flex-1 text-sm break-all">{format.value}</code>
                <button
                  onClick={() => copyToClipboard(format.value)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-600 rounded"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      title: 'Binary Representation',
      icon: <Binary className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">128-bit binary representation with prefix highlighting</p>
            <button
              onClick={() => setShowBinary(!showBinary)}
              className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 transition-colors duration-200"
            >
              {showBinary ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showBinary ? 'Hide' : 'Show'} Binary
            </button>
          </div>
          {showBinary && (
            <div className="bg-gray-700 rounded-lg p-4 overflow-x-auto">
              {renderBinaryAddress()}
              <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-900/30 border border-blue-300 rounded"></div>
                  <span>Network Prefix</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-teal-900/30 border border-teal-300 rounded"></div>
                  <span>Interface Identifier</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Network Information',
      icon: <Network className="w-5 h-5" />,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">First Address</label>
              <div className="p-3 bg-gray-700 rounded-lg">
                <code className="text-white text-sm">{address.firstAddress}</code>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Last Address</label>
              <div className="p-3 bg-gray-700 rounded-lg">
                <code className="text-white text-sm">{address.lastAddress}</code>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Reverse DNS</label>
              <div className="p-3 bg-gray-700 rounded-lg">
                <code className="text-white text-sm break-all">{address.reverseDNS}</code>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Available Subnets</label>
              <div className="text-white">{address.totalSubnets}</div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'RFC Compliance',
      icon: <Shield className="w-5 h-5" />,
      content: (
        <div className="space-y-3">
          {address.rfcCompliance.map((rfc, index) => (
            <div key={index} className="p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">{rfc.rfc}</div>
                  <div className="text-sm text-gray-400">{rfc.title}</div>
                </div>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  rfc.compliant 
                    ? 'bg-green-900/30 text-green-300' 
                    : 'bg-red-900/30 text-red-300'
                }`}>
                  {rfc.compliant ? 'Compliant' : 'Non-compliant'}
                </span>
              </div>
              {rfc.notes && (
                <p className="text-gray-400 text-sm mt-2">{rfc.notes}</p>
              )}
            </div>
          ))}
        </div>
      )
    }
  ];

  if (!address.isValid) {
    return null;
  }

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <div key={index} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <button
            onClick={() => toggleSection(section.title.toLowerCase().replace(/\s+/g, ''))}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-700 transition-colors duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="text-blue-400">
                {section.icon}
              </div>
              <h3 className="text-lg font-semibold text-white">{section.title}</h3>
            </div>
            {expandedSections.has(section.title.toLowerCase().replace(/\s+/g, '')) ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {expandedSections.has(section.title.toLowerCase().replace(/\s+/g, '')) && (
            <div className="px-6 pb-6">
              {section.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};