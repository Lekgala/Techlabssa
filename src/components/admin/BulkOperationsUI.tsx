import React, { useState } from 'react';
import {
  CheckCircle,
  Mail,
  Download,
  RefreshCw,
  AlertTriangle,
  Copy,
} from 'lucide-react';

export interface BulkOperationState {
  selectedIds: string[];
  isLoading: boolean;
  result: {
    succeeded: number;
    failed: number;
    total: number;
    errors: Array<{ id: string; error: string }>;
  } | null;
}

interface BulkOperationsUIProps {
  items: any[];
  onBulkApprove: (ids: string[], sendEmails: boolean) => Promise<void>;
  onBulkExport: (ids: string[], format: 'csv' | 'json') => Promise<void>;
  onBulkEmail: (ids: string[], templateId: string) => Promise<void>;
  itemType: 'applications' | 'leads';
  templates?: any[];
}

export const BulkOperationsUI: React.FC<BulkOperationsUIProps> = ({
  items,
  onBulkApprove,
  onBulkExport,
  onBulkEmail,
  itemType,
  templates = []
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]?.id || '');
  const [sendEmails, setSendEmails] = useState(true);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(item => item.id));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setIsLoading(true);
    try {
      await onBulkApprove(selectedIds, sendEmails);
      setResult({ succeeded: selectedIds.length, failed: 0, total: selectedIds.length });
      setSelectedIds([]);
    } catch (err) {
      setResult({ succeeded: 0, failed: selectedIds.length, total: selectedIds.length });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkExport = async (format: 'csv' | 'json') => {
    if (selectedIds.length === 0) return;
    setIsLoading(true);
    try {
      await onBulkExport(selectedIds, format);
      setResult({ succeeded: selectedIds.length, failed: 0, total: selectedIds.length });
    } catch (err) {
      setResult({ succeeded: 0, failed: selectedIds.length, total: selectedIds.length });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkEmail = async () => {
    if (selectedIds.length === 0 || !selectedTemplate) return;
    setIsLoading(true);
    try {
      await onBulkEmail(selectedIds, selectedTemplate);
      setResult({ succeeded: selectedIds.length, failed: 0, total: selectedIds.length });
    } catch (err) {
      setResult({ succeeded: 0, failed: selectedIds.length, total: selectedIds.length });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Selection Summary */}
      <div className="bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-[#000000]">
            {selectedIds.length} of {items.length} selected
          </p>
          <p className="text-xs text-[#707070]">Select items to perform bulk operations</p>
        </div>
        <button
          onClick={toggleSelectAll}
          className="px-3 py-1.5 bg-[#000000] hover:bg-neutral-800 text-white text-xs font-bold rounded-lg transition"
        >
          {selectedIds.length === items.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {/* Results Message */}
      {result && (
        <div className={`p-4 rounded-xl border ${result.failed === 0 ? 'bg-[#F0F8F0] border-[#90EE90]' : 'bg-[#FFF5F5] border-[#FFB6B6]'}`}>
          <p className="text-sm font-bold text-[#000000]">
            {result.succeeded} succeeded, {result.failed} failed
          </p>
        </div>
      )}

      {/* Items List with Checkboxes */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.id}
            className={`p-3 border rounded-lg cursor-pointer transition ${
              selectedIds.includes(item.id)
                ? 'bg-[#F0F8F0] border-[#000000]'
                : 'bg-white border-[#E0E0E0] hover:border-[#A0A0A0]'
            }`}
            onClick={() => toggleSelect(item.id)}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedIds.includes(item.id)}
                onChange={() => {}}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#000000] text-sm">
                  {itemType === 'applications'
                    ? `${item.firstName} ${item.lastName}`
                    : item.name}
                </p>
                <p className="text-xs text-[#707070]">{item.email}</p>
                {itemType === 'applications' && (
                  <p className="text-xs text-[#A0A0A0] mt-1">
                    Status: <span className="font-bold">{item.status}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      {selectedIds.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-[#F5F5F5] rounded-xl border border-[#E0E0E0]">
          {itemType === 'applications' && (
            <button
              onClick={handleBulkApprove}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#000000] hover:bg-neutral-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition uppercase tracking-wide"
            >
              <CheckCircle className="w-4 h-4" />
              Approve All ({selectedIds.length})
            </button>
          )}

          <button
            onClick={() => handleBulkEmail()}
            disabled={isLoading || !selectedTemplate}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0066CC] hover:bg-[#0052A3] disabled:opacity-50 text-white font-bold text-xs rounded-lg transition uppercase tracking-wide"
          >
            <Mail className="w-4 h-4" />
            Send Email ({selectedIds.length})
          </button>

          <button
            onClick={() => handleBulkExport('csv')}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#006600] hover:bg-[#004D00] disabled:opacity-50 text-white font-bold text-xs rounded-lg transition uppercase tracking-wide"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          <button
            onClick={() => handleBulkExport('json')}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#666600] hover:bg-[#4D4D00] disabled:opacity-50 text-white font-bold text-xs rounded-lg transition uppercase tracking-wide"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        </div>
      )}

      {/* Email Template Selector */}
      {selectedIds.length > 0 && templates.length > 0 && (
        <div className="p-4 bg-white border border-[#E0E0E0] rounded-xl">
          <label className="block text-xs font-bold text-[#000000] uppercase tracking-wider mb-2">
            Select Email Template
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full p-2 border border-[#E0E0E0] rounded-lg text-sm text-[#000000] bg-white focus:outline-none focus:border-[#000000]"
          >
            <option value="">-- Choose template --</option>
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name} ({tpl.trigger})
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 mt-3 text-xs">
            <input
              type="checkbox"
              checked={sendEmails}
              onChange={(e) => setSendEmails(e.target.checked)}
            />
            <span className="text-[#000000]">Send emails immediately after approval</span>
          </label>
        </div>
      )}
    </div>
  );
};
