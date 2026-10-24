import React, { useState } from 'react';
import type { BlogPost } from '@/types';
import { Download, X } from 'lucide-react';
import { toast } from './blogToast';

// ----------------------------------------------------
// IMPORT BLOG POSTS MODAL COMPONENT
// ----------------------------------------------------

export interface ImportPostsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (posts: Partial<BlogPost>[]) => Promise<void>;
}

export const ImportPostsModal: React.FC<ImportPostsModalProps> = ({ onClose, onImport }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const sampleJson = JSON.stringify(
    [
      {
        title: 'পশ্চিমবঙ্গ পুলিশের বিগত ৫ বছরের সাধারণ জ্ঞান',
        category: 'WBP Constable',
        author: 'Admin',
        status: 'published',
        isFeatured: true,
        excerpt: 'বিগত ৫ বছরের পরীক্ষায় আসা সেরা ৫০টি প্রশ্ন ও বিস্তারিত ব্যাখ্যা।',
        content:
          '<p>বিগত বছরের প্রশ্ন পর্যালোচনা করে দেখা গেছে এই টপিকগুলো থেকে সর্বাধিক প্রশ্ন আসে...</p>',
      },
    ],
    null,
    2
  );

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsImporting(true);
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        toast.error('JSON must be a non-empty array of blog posts');
        return;
      }
      await onImport(parsed);
    } catch {
      toast.error('Invalid JSON format');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Import Blog Posts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600">
          Paste JSON formatted posts below. You can use the sample format as a template.
        </p>

        <form onSubmit={handleImportSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700">JSON Data</label>
              <button
                type="button"
                onClick={() => setJsonInput(sampleJson)}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Load Sample
              </button>
            </div>
            <textarea
              rows={8}
              required
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="[{ 'title': '...', 'category': '...', 'content': '...' }]"
              className="w-full p-3 font-mono text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isImporting}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-50"
            >
              {isImporting ? 'Importing...' : 'Import Posts'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
