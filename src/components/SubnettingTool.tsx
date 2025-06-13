import React, { useState, useMemo } from 'react';
import { IPv6Address, SubnetPlan } from '../types/ipv6';
import { IPv6Subnetting } from '../utils/subnetting';
import { Network, Split, ChevronDown, ChevronRight, Copy, Download } from 'lucide-react';

interface SubnettingToolProps {
  address: IPv6Address;
}

export const SubnettingTool: React.FC<SubnettingToolProps> = ({ address }) => {
  const [targetPrefix, setTargetPrefix] = useState(64);
  const [subnetCount, setSubnetCount] = useState(8);
  const [showAll, setShowAll] = useState(false);
  const [expandedSubnets, setExpandedSubnets] = useState<Set<number>>(new Set());

  const subnetPlan = useMemo(() => {
    if (!address.isValid || targetPrefix <= address.prefixLength) {
      return null;
    }

    try {
      return IPv6Subnetting.calculateSubnets(
        address.networkAddress, 
        targetPrefix, 
        showAll ? undefined : subnetCount
      );
    } catch (error) {
      return null;
    }
  }, [address, targetPrefix, subnetCount, showAll]);

  const toggleSubnetDetails = (index: number) => {
    const newExpanded = new Set(expandedSubnets);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSubnets(newExpanded);
  };

  const copySubnetPlan = () => {
    if (!subnetPlan) return;
    
    const text = subnetPlan.subnets
      .map(subnet => `${subnet.network} - ${subnet.firstAddress} to ${subnet.lastAddress}`)
      .join('\n');
    
    navigator.clipboard.writeText(text);
  };

  const exportSubnetPlan = () => {
    if (!subnetPlan) return;
    
    const data = {
      originalPrefix: subnetPlan.originalPrefix,
      targetPrefixLength: subnetPlan.targetPrefixLength,
      totalSubnets: subnetPlan.totalSubnets,
      subnets: subnetPlan.subnets
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ipv6-subnet-plan.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!address.isValid) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Network className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Subnetting Tool</h2>
        </div>
        <p className="text-gray-400">Enter a valid IPv6 address to use the subnetting tool.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <Network className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-semibold text-white">Subnetting Tool</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Target Prefix Length
          </label>
          <select
            value={targetPrefix}
            onChange={(e) => setTargetPrefix(parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-400"
          >
            {Array.from({ length: 128 - address.prefixLength }, (_, i) => (
              <option key={i} value={address.prefixLength + i + 1}>
                /{address.prefixLength + i + 1}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Number of Subnets
          </label>
          <select
            value={subnetCount}
            onChange={(e) => setSubnetCount(parseInt(e.target.value))}
            disabled={showAll}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-400 disabled:opacity-50"
          >
            <option value={4}>4</option>
            <option value={8}>8</option>
            <option value={16}>16</option>
            <option value={32}>32</option>
            <option value={64}>64</option>
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-300">Show all subnets</span>
          </label>
        </div>
      </div>

      {subnetPlan && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <p className="font-medium">
                Subnetting {subnetPlan.originalPrefix} into /{targetPrefix} subnets
              </p>
              <p className="text-sm text-gray-400">
                Total possible subnets: {subnetPlan.totalSubnets.toLocaleString()}
                {!showAll && ` (showing ${subnetPlan.subnets.length})`}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copySubnetPlan}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button
                onClick={exportSubnetPlan}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg overflow-hidden">
            <div className="grid grid-cols-4 gap-4 px-4 py-3 bg-gray-600 text-sm font-medium text-gray-300">
              <div>Network</div>
              <div>First Address</div>
              <div>Last Address</div>
              <div>Total Hosts</div>
            </div>
            
            <div className="divide-y divide-gray-600">
              {subnetPlan.subnets.map((subnet, index) => (
                <div key={index}>
                  <button
                    onClick={() => toggleSubnetDetails(index)}
                    className="w-full grid grid-cols-4 gap-4 px-4 py-3 text-sm text-left hover:bg-gray-600 transition-colors duration-200"
                  >
                    <div className="font-mono text-blue-300">{subnet.network}</div>
                    <div className="font-mono text-white">{subnet.firstAddress}</div>
                    <div className="font-mono text-white">{subnet.lastAddress}</div>
                    <div className="text-gray-300">{subnet.totalHosts}</div>
                  </button>
                  
                  {expandedSubnets.has(index) && (
                    <div className="px-4 pb-3 bg-gray-750">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Broadcast: </span>
                          <span className="font-mono text-white">{subnet.broadcastAddress}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Usage: </span>
                          <span className="text-gray-300">Network segment {index + 1}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {subnetPlan.subnets.length >= 100 && (
            <p className="text-sm text-gray-400 text-center">
              Large subnet plans may take a moment to render completely.
            </p>
          )}
        </div>
      )}

      {targetPrefix <= address.prefixLength && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-300 text-sm">
            Target prefix length must be longer than the current prefix length (/{address.prefixLength}).
          </p>
        </div>
      )}
    </div>
  );
};