import React, { useState, useMemo } from 'react';
import { IPv6Parser } from '../utils/ipv6Parser';
import { IPv6Address } from '../types/ipv6';
import { List, Upload, Download, Copy, CheckCircle, AlertCircle } from 'lucide-react';

export const BatchProcessor: React.FC = () => {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<IPv6Address[]>([]);
  const [showResults, setShowResults] = useState(false);

  const sampleData = `2001:db8::/32
fe80::1/64
fc00::/7
::1
::ffff:192.168.1.1
2001::/16
ff02::1`;

  const processedResults = useMemo(() => {
    if (!input.trim()) return [];
    
    const addresses = input
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => IPv6Parser.parse(line));
    
    return addresses;
  }, [input]);

  const handleProcess = () => {
    setResults(processedResults);
    setShowResults(true);
  };

  const handleLoadSample = () => {
    setInput(sampleData);
  };

  const handleExport = () => {
    if (results.length === 0) return;
    
    const data = results.map(result => ({
      input: result.input,
      isValid: result.isValid,
      addressType: result.addressType,
      scope: result.scope,
      expanded: result.expanded,
      compressed: result.compressed,
      networkAddress: result.networkAddress,
      error: result.error
    }));
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ipv6-batch-results.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyResults = () => {
    const text = results
      .map(result => `${result.input}: ${result.isValid ? result.addressType : result.error}`)
      .join('\n');
    
    navigator.clipboard.writeText(text);
  };

  const validCount = results.filter(r => r.isValid).length;
  const invalidCount = results.filter(r => !r.isValid).length;

  const addressTypeCounts = results
    .filter(r => r.isValid)
    .reduce((acc, result) => {
      acc[result.addressType] = (acc[result.addressType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <List className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-semibold text-white">Batch Processor</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            IPv6 Addresses (one per line)
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter IPv6 addresses, one per line..."
            rows={8}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 font-mono text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleLoadSample}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Load Sample
          </button>
          <button
            onClick={handleProcess}
            disabled={!input.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:opacity-50 text-white text-sm rounded-lg transition-colors duration-200"
          >
            Process Addresses
          </button>
        </div>

        {showResults && results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-400">{validCount} valid</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400">{invalidCount} invalid</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyResults}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                <button
                  onClick={handleExport}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>

            {Object.keys(addressTypeCounts).length > 0 && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-white font-medium mb-3">Address Type Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(addressTypeCounts).map(([type, count]) => (
                    <div key={type} className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{count}</div>
                      <div className="text-xs text-gray-400">{type}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-700 rounded-lg overflow-hidden">
              <div className="grid grid-cols-4 gap-4 px-4 py-3 bg-gray-600 text-sm font-medium text-gray-300">
                <div>Input</div>
                <div>Status</div>
                <div>Type</div>
                <div>Result</div>
              </div>
              
              <div className="divide-y divide-gray-600 max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <div key={index} className="grid grid-cols-4 gap-4 px-4 py-3 text-sm">
                    <div className="font-mono text-blue-300 truncate" title={result.input}>
                      {result.input}
                    </div>
                    <div className="flex items-center gap-2">
                      {result.isValid ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-green-400">Valid</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-400" />
                          <span className="text-red-400">Invalid</span>
                        </>
                      )}
                    </div>
                    <div className="text-gray-300">
                      {result.isValid ? result.addressType : 'Error'}
                    </div>
                    <div className="font-mono text-white truncate" title={result.isValid ? result.compressed : result.error}>
                      {result.isValid ? result.compressed : result.error}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};