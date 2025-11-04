import { QRCodeSVG } from 'qrcode.react';

interface Agent {
  id: string;
  agentCode: string;
  name: string;
  location: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: string;
  isHeadOffice: boolean;
  notes: string | null;
  createdAt: string;
  _count?: {
    transactions: number;
    customers: number;
  };
}

interface AgentsTabProps {
  agents: Agent[];
  loadingAgents: boolean;
  newAgent: {
    name: string;
    location: string;
    phone: string;
    email: string;
    address: string;
    notes: string;
    isHeadOffice: boolean;
  };
  setNewAgent: (agent: any) => void;
  agentMessage: string;
  agentError: string;
  creatingAgent: boolean;
  handleCreateAgent: (e: React.FormEvent) => void;
  handleUpdateAgentStatus: (agentId: string, status: string) => void;
}

export default function AgentsTab({
  agents,
  loadingAgents,
  newAgent,
  setNewAgent,
  agentMessage,
  agentError,
  creatingAgent,
  handleCreateAgent,
  handleUpdateAgentStatus,
}: AgentsTabProps) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Agents & QR Codes</h2>
        <p className="text-sm text-gray-600 mb-6">
          Manage money transfer agents and their unique QR codes for customer registration.
        </p>
      </div>

      {/* Add New Agent */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Create New Agent</h3>
        <form onSubmit={handleCreateAgent} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agent Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newAgent.name}
                onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location (Village/Town)
              </label>
              <input
                type="text"
                value={newAgent.location}
                onChange={(e) => setNewAgent({ ...newAgent, location: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Apia, Samoa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={newAgent.phone}
                onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="+685 12345"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={newAgent.email}
                onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="agent@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <input
              type="text"
              value={newAgent.address}
              onChange={(e) => setNewAgent({ ...newAgent, address: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Full address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={newAgent.notes}
              onChange={(e) => setNewAgent({ ...newAgent, notes: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={2}
              placeholder="Additional information..."
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newAgent.isHeadOffice}
                onChange={(e) => setNewAgent({ ...newAgent, isHeadOffice: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Mark as Head Office</span>
            </label>
          </div>

          {agentMessage && (
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">{agentMessage}</p>
            </div>
          )}

          {agentError && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{agentError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={creatingAgent}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {creatingAgent ? 'Creating...' : 'Create Agent'}
          </button>
        </form>
      </div>

      {/* Agents List */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">All Agents</h3>
        {loadingAgents ? (
          <div className="text-center py-12 text-gray-600">Loading agents...</div>
        ) : agents.length === 0 ? (
          <div className="text-center py-12 text-gray-600">No agents found. Create your first agent above.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {agents.map((agent) => {
              const registerUrl = `${baseUrl}/register/${agent.agentCode}`;

              return (
                <div
                  key={agent.id}
                  className={`bg-white rounded-lg border-2 p-6 ${
                    agent.isHeadOffice ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
                  }`}
                >
                  {/* Agent Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-semibold text-gray-900">{agent.name}</h4>
                        {agent.isHeadOffice && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Head Office
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Code: {agent.agentCode}</p>
                      {agent.location && (
                        <p className="text-sm text-gray-600 mt-1">📍 {agent.location}</p>
                      )}
                    </div>
                    <select
                      value={agent.status}
                      onChange={(e) => handleUpdateAgentStatus(agent.id, e.target.value)}
                      className={`text-sm px-3 py-1 rounded-md border ${
                        agent.status === 'ACTIVE'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : agent.status === 'INACTIVE'
                          ? 'bg-gray-50 text-gray-700 border-gray-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="SUSPENDED">Suspended</option>
                    </select>
                  </div>

                  {/* Contact Information */}
                  {(agent.phone || agent.email) && (
                    <div className="mb-4 text-sm space-y-1">
                      {agent.phone && <p className="text-gray-600">📞 {agent.phone}</p>}
                      {agent.email && <p className="text-gray-600">✉️ {agent.email}</p>}
                    </div>
                  )}

                  {/* Statistics */}
                  {agent._count && (
                    <div className="flex gap-4 mb-4 text-sm">
                      <div className="bg-blue-50 px-3 py-2 rounded-md">
                        <p className="text-gray-600">Transactions</p>
                        <p className="text-lg font-semibold text-blue-700">{agent._count.transactions}</p>
                      </div>
                      <div className="bg-green-50 px-3 py-2 rounded-md">
                        <p className="text-gray-600">Customers</p>
                        <p className="text-lg font-semibold text-green-700">{agent._count.customers}</p>
                      </div>
                    </div>
                  )}

                  {/* QR Code */}
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">Registration QR Code:</p>
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                        <QRCodeSVG value={registerUrl} size={150} level="H" />
                      </div>
                      <div className="w-full">
                        <p className="text-xs text-gray-500 mb-1">Registration URL:</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={registerUrl}
                            readOnly
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md bg-gray-50"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(registerUrl);
                              alert('URL copied to clipboard!');
                            }}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const svg = document.querySelector(`#qr-${agent.id}`);
                          if (svg) {
                            const svgData = new XMLSerializer().serializeToString(svg as any);
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            const img = new Image();
                            img.onload = () => {
                              canvas.width = img.width;
                              canvas.height = img.height;
                              ctx?.drawImage(img, 0, 0);
                              const pngFile = canvas.toDataURL('image/png');
                              const downloadLink = document.createElement('a');
                              downloadLink.download = `QR-${agent.agentCode}.png`;
                              downloadLink.href = pngFile;
                              downloadLink.click();
                            };
                            img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                          }
                        }}
                        className="w-full px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Download QR Code
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  {agent.notes && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-gray-500 mb-1">Notes:</p>
                      <p className="text-sm text-gray-700">{agent.notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="rounded-md bg-blue-50 p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">📱 How It Works</h4>
        <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
          <li>Each agent gets a unique QR code linked to their agent code</li>
          <li>Customers scan the QR code with their phone to open the registration page</li>
          <li>Customers fill out their details and take a photo of their ID (camera only, no uploads)</li>
          <li>All registrations are automatically linked to the agent's QR code</li>
          <li>Track which agents are bringing in the most customers and transactions</li>
          <li>View agent performance in the dashboard charts</li>
        </ol>
      </div>
    </div>
  );
}
