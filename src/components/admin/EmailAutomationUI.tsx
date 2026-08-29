import React, { useState } from 'react';
import { Mail, Edit, Eye, RotateCcw, Save, X } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  trigger: string;
  subject: string;
  htmlBody: string;
  enabled: boolean;
  variables: string[];
}

interface EmailAutomationUIProps {
  templates: EmailTemplate[];
  onUpdateTemplate: (id: string, updates: Partial<EmailTemplate>) => Promise<void>;
  onRenderPreview: (templateId: string, variables: Record<string, any>) => Promise<{ subject: string; html: string }>;
}

export const EmailAutomationUI: React.FC<EmailAutomationUIProps> = ({
  templates,
  onUpdateTemplate,
  onRenderPreview,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [formData, setFormData] = useState<Partial<EmailTemplate>>({});

  const handleEditStart = (template: EmailTemplate) => {
    setEditingId(template.id);
    setFormData(template);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setFormData({});
  };

  const handleSave = async (id: string) => {
    if (editingId === id) {
      await onUpdateTemplate(id, formData);
      setEditingId(null);
      setFormData({});
    }
  };

  const handleShowPreview = async (templateId: string) => {
    setPreviewId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const mockVars = template.variables.reduce((acc, v) => {
        acc[v] = `Sample ${v}`;
        return acc;
      }, {} as Record<string, string>);
      
      const rendered = await onRenderPreview(templateId, mockVars);
      setPreview(rendered);
    }
  };

  return (
    <div className="space-y-4">
      {/* Templates Grid */}
      <div className="grid grid-cols-1 gap-4">
        {templates.map((template) => (
          <div key={template.id} className="bg-white border border-[#E0E0E0] rounded-xl overflow-hidden">
            {editingId === template.id ? (
              // Editing Mode
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#000000] uppercase tracking-wider">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:border-[#000000]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#000000] uppercase tracking-wider">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject || ''}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full p-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:border-[#000000]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#000000] uppercase tracking-wider">
                    Email Body HTML
                  </label>
                  <textarea
                    value={formData.htmlBody || ''}
                    onChange={(e) => setFormData({ ...formData, htmlBody: e.target.value })}
                    rows={8}
                    className="w-full p-3 border border-[#E0E0E0] rounded-lg text-xs font-mono focus:outline-none focus:border-[#000000]"
                    placeholder="Use {variableName} for dynamic content"
                  />
                  <p className="text-[10px] text-[#707070]">
                    Available variables: {template.variables.join(', ')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.enabled !== false}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  />
                  <label className="text-xs font-bold text-[#000000]">Enabled</label>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={handleEditCancel}
                    className="px-3 py-1.5 border border-[#E0E0E0] hover:bg-[#F5F5F5] text-[#000000] font-bold text-xs rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSave(template.id)}
                    className="px-3 py-1.5 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs rounded-lg transition flex items-center gap-1"
                  >
                    <Save className="w-3 h-3" />
                    Save
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-[#000000]">{template.name}</h3>
                    <p className="text-xs text-[#707070] mt-1">{template.trigger}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded ${template.enabled ? 'bg-[#F0F8F0] text-[#006600]' : 'bg-[#FFF5F5] text-[#CC0000]'}`}>
                    {template.enabled ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <div className="bg-[#FAFAFA] p-3 rounded-lg mb-3 max-h-40 overflow-y-auto">
                  <p className="text-[10px] font-mono text-[#333] whitespace-pre-wrap">
                    {template.subject}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleShowPreview(template.id)}
                    className="flex-1 px-3 py-1.5 border border-[#E0E0E0] hover:bg-[#F5F5F5] text-[#000000] font-bold text-xs rounded-lg transition flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Preview
                  </button>
                  <button
                    onClick={() => handleEditStart(template)}
                    className="flex-1 px-3 py-1.5 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewId && preview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#E0E0E0] p-4 flex items-center justify-between">
              <h2 className="font-bold text-[#000000]">Email Preview</h2>
              <button
                onClick={() => setPreviewId(null)}
                className="p-1 hover:bg-[#F5F5F5] rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <p className="text-xs text-[#707070] font-bold uppercase">Subject</p>
                <p className="text-sm font-bold text-[#000000] mt-1">{preview.subject}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-xs text-[#707070] font-bold uppercase mb-3">Body</p>
                <div
                  className="prose prose-sm max-w-none bg-[#F5F5F5] p-4 rounded-lg"
                  dangerouslySetInnerHTML={{ __html: preview.html }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
