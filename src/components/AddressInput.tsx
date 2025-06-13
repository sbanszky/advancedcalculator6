import React, { useState, useCallback } from 'react';
import { Calculator, Wifi, Globe, AlertCircle, CheckCircle, Copy, Download } from 'lucide-react';

interface AddressInputProps {
  onAddressChange: (address: string) => void;
  isValid: boolean;
  error?: string;
}

export const AddressInput: React.FC<AddressInputProps> = ({ onAddressChange, isValid, error }) => {
  const [input, setInput] = useState('2001:db8::/32');
  const [showExamples, setShowExamples] = useState(false);

  const examples = [
    { address: '2001:db8::/32', type: 'Documentation Prefix' },
    { address: 'fe80::1/64', type: 'Link-Local' },
    { address: 'fc00::/7', type: 'Unique Local' },
    { address: '::1', type: 'Loopback' },
    { address: '::ffff:192.168.1.1', type: 'IPv4-Mapped' },
    { address: '2001::/16', type: 'Global Unicast' },
    { address: 'ff02::1', type: 'Multicast' }
  ];

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    onAddressChange(value);
  }, [onAddressChange]);

  const handleExampleClick = (address: string) => {
    handleInputChange(address);
    setShowExamples(false);
  };

  const handleCopyResult = () => {
    navigator.clipboard.writeText(input);
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500 rounded-lg">
          <Calculator className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">IPv6 Calculator</h1>
          <p className="text-gray-400">network analysis tool</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="ipv6-input" className="block text-sm font-medium text-gray-300 mb-2">
            IPv6 Address or Prefix
          </label>
          <div className="relative">
            <input
              id="ipv6-input"
              type="text"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="e.g., 2001:db8::/32 or fe80::1"
              className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 text-white placeholder-gray-500 ${
                error 
                  ? 'border-red-500 bg-red-900/20 focus:border-red-400' 
                  : isValid 
                  ? 'border-green-500 bg-green-900/20 focus:border-green-400'
                  : 'border-gray-600 bg-gray-700 focus:border-blue-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {error ? (
                <AlertCircle className="w-5 h-5 text-red-400" />
              ) : isValid ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : null}
            </div>
          </div>
          {error && (
            <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowExamples(!showExamples)}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <Globe className="w-4 h-4" />
            Examples
          </button>
          <button
            onClick={handleCopyResult}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
        </div>

        {showExamples && (
          <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
            <h3 className="text-white font-medium mb-3">Example Addresses</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {examples.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(example.address)}
                  className="text-left p-3 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors duration-200 group"
                >
                  <div className="font-mono text-blue-300 text-sm group-hover:text-blue-200">
                    {example.address}
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    {example.type}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};