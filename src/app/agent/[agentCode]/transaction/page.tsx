'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Agent Transaction Page
 *
 * This page provides a transaction creation interface for agents.
 * It loads the agent context and redirects to the main transaction page
 * with the agent ID stored in session storage.
 *
 * For a full implementation, you would import and render the NewTransactionPage
 * component here, but for now we'll redirect to keep the code simpler.
 */
export default function AgentTransactionPage({ params }: { params: Promise<{ agentCode: string }> }) {
  const resolvedParams = use(params);
  const { agentCode } = resolvedParams;
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAgentAndRedirect = async () => {
      try {
        // Fetch agent information
        const response = await fetch(`/api/agents?agentCode=${agentCode}`);
        if (response.ok) {
          const agents = await response.json();
          const agent = agents.find((a: any) => a.agentCode === agentCode);

          if (agent) {
            // Store agent info in session storage
            sessionStorage.setItem('agentId', agent.id);
            sessionStorage.setItem('agentCode', agent.agentCode);
            sessionStorage.setItem('agentName', agent.name);

            // Redirect to main transaction page
            // The transaction page will read agentId from sessionStorage
            router.push('/transactions/new?agent=true');
          } else {
            router.push(`/agent/${agentCode}`);
          }
        }
      } catch (error) {
        console.error('Error loading agent:', error);
        router.push(`/agent/${agentCode}`);
      } finally {
        setLoading(false);
      }
    };

    loadAgentAndRedirect();
  }, [agentCode, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transaction form...</p>
        </div>
      </div>
    );
  }

  return null;
}
