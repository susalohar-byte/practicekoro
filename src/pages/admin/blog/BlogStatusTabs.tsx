import { cn } from '@/lib/utils';
import type { AdminBlogState } from './useAdminBlog';

export interface BlogStatusTabsProps {
  blogState: AdminBlogState;
}

export function BlogStatusTabs({ blogState }: BlogStatusTabsProps) {
  const { activeTab, setActiveTab, setCurrentPage, stats } = blogState;
  return (
    <>
      {/* Status Tabs Matching Reference */}
      <div className="border-b border-slate-200 bg-white px-2 rounded-t-xl">
        <div className="flex items-center gap-8 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('all');
              setCurrentPage(1);
            }}
            className={cn(
              'py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            All Posts ({stats.total})
          </button>
          <button
            onClick={() => {
              setActiveTab('published');
              setCurrentPage(1);
            }}
            className={cn(
              'py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === 'published'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            Published ({stats.published})
          </button>
          <button
            onClick={() => {
              setActiveTab('draft');
              setCurrentPage(1);
            }}
            className={cn(
              'py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === 'draft'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            Drafts ({stats.drafts})
          </button>
          <button
            onClick={() => {
              setActiveTab('scheduled');
              setCurrentPage(1);
            }}
            className={cn(
              'py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === 'scheduled'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            Scheduled ({stats.scheduled})
          </button>
          <button
            onClick={() => {
              setActiveTab('archived');
              setCurrentPage(1);
            }}
            className={cn(
              'py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === 'archived'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            Archived ({stats.archived})
          </button>
        </div>
      </div>
    </>
  );
}
