import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, Eye, Download, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';

const DatabaseBrowser: React.FC = () => {
  const [databases, setDatabases] = useState<any[]>([]);
  const [selectedDb, setSelectedDb] = useState<string | null>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchDatabases();
  }, []);

  const fetchDatabases = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/admin/databases', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch databases');
      }

      const data = await response.json();
      setDatabases(data.databases || []);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch databases');
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async (dbName: string) => {
    try {
      setLoading(true);
      setError('');
      setSelectedDb(dbName);
      setSelectedTable(null);
      setTableData([]);

      const response = await fetch(`/api/admin/databases/${dbName}/tables`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tables');
      }

      const data = await response.json();
      setTables(data.tables || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tables');
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (dbName: string, tableName: string) => {
    try {
      setLoading(true);
      setError('');
      setSelectedTable(tableName);

      const response = await fetch(
        `/api/admin/databases/${dbName}/tables/${tableName}/data?limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch table data');
      }

      const data = await response.json();
      setTableData(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch table data');
    } finally {
      setLoading(false);
    }
  };

  const downloadAsJSON = () => {
    if (tableData.length === 0) return;

    const dataStr = JSON.stringify(tableData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `${selectedTable}_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const downloadAsCSV = () => {
    if (tableData.length === 0) return;

    const headers = Object.keys(tableData[0]);
    const csv = [
      headers.join(','),
      ...tableData.map(row =>
        headers
          .map(header => {
            const value = row[header];
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(',')
      )
    ].join('\n');

    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    const exportFileDefaultName = `${selectedTable}_${new Date().toISOString().split('T')[0]}.csv`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-indigo-600" />
            <h2 className="text-3xl font-bold">Database Browser</h2>
          </div>
          <button
            onClick={fetchDatabases}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            title="Refresh databases"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-gray-600">
          Browse all backend database tables and export data
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Database Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-gray-600 text-sm font-medium">Total Tables</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalTables}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-gray-600 text-sm font-medium">Total Records</p>
            <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.totalRecords?.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-gray-600 text-sm font-medium">Database Size</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.databaseSize}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-gray-600 text-sm font-medium">Backup Status</p>
            <p className="text-sm font-semibold text-gray-900 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Last backed up: {stats.lastBackup}
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Databases List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900">Databases</h3>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {loading && !selectedDb ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : databases.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No databases</div>
              ) : (
                databases.map((db, idx) => (
                  <button
                    key={idx}
                    onClick={() => fetchTables(db.name)}
                    className={`w-full text-left px-4 py-3 transition ${
                      selectedDb === db.name
                        ? 'bg-indigo-50 border-l-4 border-indigo-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-gray-900">🗄️ {db.name}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {db.tableCount} tables
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Tables List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900">
                {selectedDb ? `Tables in ${selectedDb}` : 'Select a Database'}
              </h3>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {!selectedDb ? (
                <div className="p-4 text-center text-gray-500">Select a database</div>
              ) : loading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : tables.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No tables</div>
              ) : (
                tables.map((table, idx) => (
                  <button
                    key={idx}
                    onClick={() => fetchTableData(selectedDb!, table.name)}
                    className={`w-full text-left px-4 py-3 transition ${
                      selectedTable === table.name
                        ? 'bg-indigo-50 border-l-4 border-indigo-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-gray-900">📊 {table.name}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {table.recordCount} rows
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Table Data */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">
                {selectedTable ? `Data from ${selectedTable}` : 'Select a Table'}
              </h3>
              {tableData.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={downloadAsJSON}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200"
                    title="Download as JSON"
                  >
                    JSON
                  </button>
                  <button
                    onClick={downloadAsCSV}
                    className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200"
                    title="Download as CSV"
                  >
                    CSV
                  </button>
                </div>
              )}
            </div>

            {tableData.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {selectedTable ? 'No data' : 'Select a table to view data'}
              </div>
            ) : (
              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      {Object.keys(tableData[0]).map((key) => (
                        <th
                          key={key}
                          className="px-4 py-2 text-left font-semibold text-gray-700 whitespace-nowrap"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row, idx) => (
                      <tr
                        key={idx}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      >
                        {Object.values(row).map((value: any, vidx) => (
                          <td
                            key={vidx}
                            className="px-4 py-2 text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis"
                            title={JSON.stringify(value)}
                          >
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-4 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
                  Showing {tableData.length} rows
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Database Schema Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>ℹ️ Database Info:</strong> This tool displays all backend PostgreSQL tables and their contents. 
          You can browse, view, and export data in JSON or CSV format. Perfect for data analysis and backups.
        </p>
      </div>
    </div>
  );
};

export default DatabaseBrowser;
