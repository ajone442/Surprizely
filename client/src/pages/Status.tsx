import { useEffect, useState } from 'react';

interface SystemStatus {
  auth: { status: string; message: string };
  database: { status: string; message: string };
  session: { status: string; message: string };
  email: { status: string; message: string };
}

export default function Status() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/status');
        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }
        const data = await response.json();
        setStatus(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch system status');
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">System Status</h1>
          <div className="animate-pulse flex justify-center">
            <div className="text-lg">Loading system status...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">System Status</h1>
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">System Status</h1>
        <div className="grid gap-6">
          {status && Object.entries(status).map(([key, value]) => (
            <div key={key} className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold capitalize">{key}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  value.status === 'up' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {value.status.toUpperCase()}
                </span>
              </div>
              <p className="mt-2 text-gray-600">{value.message}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-gray-500 text-center">
          Status updates automatically every 30 seconds
        </p>
      </div>
    </div>
  );
}
