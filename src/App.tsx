import React, { useState, useCallback } from 'react';
import { IPv6Parser } from './utils/ipv6Parser';
import { IPv6Address } from './types/ipv6';
import { AddressInput } from './components/AddressInput';
import { AddressDetails } from './components/AddressDetails';
import { SubnettingTool } from './components/SubnettingTool';
import { BatchProcessor } from './components/BatchProcessor';
import { Network, Calculator, List } from 'lucide-react';

function App() {
  const [currentAddress, setCurrentAddress] = useState<IPv6Address>(() => 
    IPv6Parser.parse('2001:db8::/32')
  );
  const [activeTab, setActiveTab] = useState<'calculator' | 'subnetting' | 'batch'>('calculator');

  const handleAddressChange = useCallback((input: string) => {
    const parsed = IPv6Parser.parse(input);
    setCurrentAddress(parsed);
  }, []);

  const tabs = [
    { id: 'calculator' as const, label: 'Calculator', icon: Calculator },
    { id: 'subnetting' as const, label: 'Subnetting', icon: Network },
    { id: 'batch' as const, label: 'Batch', icon: List }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 py-4 px-6">
        <div className="text-center">
          <a
            href="https://subnetting.online"
            className="text-2xl font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            subnetting.online
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Input Section */}
          <AddressInput
            onAddressChange={handleAddressChange}
            isValid={currentAddress.isValid}
            error={currentAddress.error}
          />

          {/* Tab Navigation */}
          <div className="border-b border-gray-700">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'calculator' && (
              <AddressDetails address={currentAddress} />
            )}
            
            {activeTab === 'subnetting' && (
              <SubnettingTool address={currentAddress} />
            )}
            
            {activeTab === 'batch' && (
              <BatchProcessor />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">IPv6 Calculator </h3>
              <p className="text-gray-400 text-sm">
                A comprehensive tool for IPv6 address analysis, subnetting, and network planning.
                Built for network engineers, students, and professionals.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Features</h3>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>• RFC-compliant IPv6 parsing</li>
                <li>• Advanced subnetting tools</li>
                <li>• Batch address processing</li>
                <li>• Binary visualization</li>
                <li>• Export capabilities</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Standards</h3>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>• RFC 4291 (Addressing Architecture)</li>
                <li>• RFC 5952 (Text Representation)</li>
                <li>• RFC 4193 (Unique Local)</li>
                <li>• RFC 4007 (Scoped Addresses)</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2025 IPv6 Calculator Pro. Built with modern web technologies.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;