import { useEffect, useState } from 'react';
import { Plus, Search, FileText, Image, Table, FileSpreadsheet, Tag, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import PageHeader from '@/components/PageHeader';
import { cn } from '@/lib/utils';
import type { ModalityType } from '@shared/types';

const modalityIcons: Record<ModalityType, any> = {
  text: FileText,
  image: Image,
  table: Table,
  pdf_summary: FileSpreadsheet,
};

export default function Templates() {
  const { templates, fetchTemplates, deleteTemplate } = useAppStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const allTags = Array.from(new Set(templates.flatMap((t) => t.tags)));

  const filtered = templates.filter((t) => {
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchTag = !filterTag || t.tags.includes(filterTag);
    return matchSearch && matchTag;
  });

  const handleDelete = async (id: string) => {
    await deleteTemplate(id);
    setConfirmDel(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prompt 模板管理"
        description="管理多模态Prompt模板，支持文本、图片、表格、PDF等多种模态嵌入"
        actions={
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => navigate('/templates/new')}
          >
            <Plus className="w-4 h-4" /> 新建模板
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="搜索模板名称或描述..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              !filterTag
                ? 'bg-brand-accentDim text-brand-accent border-brand-accent/30'
                : 'border-border text-text-secondary hover:border-border-hover'
            )}
            onClick={() => setFilterTag(null)}
          >
            全部
          </button>
          {allTags.slice(0, 6).map((tag) => (
            <button
              key={tag}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                filterTag === tag
                  ? 'bg-brand-accentDim text-brand-accent border-brand-accent/30'
                  : 'border-border text-text-secondary hover:border-border-hover'
              )}
              onClick={() => setFilterTag(tag === filterTag ? null : tag)}
            >
              <Tag className="w-3 h-3 inline mr-1" />
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((tpl) => {
          const modalities = Array.from(new Set(tpl.blocks.map((b) => b.type)));
          return (
            <div
              key={tpl.id}
              className="card card-hover cursor-pointer group"
              onClick={() => navigate(`/templates/${tpl.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-display font-semibold text-text-primary group-hover:text-brand-accent transition-colors">
                    {tpl.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="badge bg-brand-accentDim text-brand-accent">{tpl.version}</span>
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(tpl.updatedAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-brand-accent transition-all translate-x-0 group-hover:translate-x-1" />
              </div>

              <p className="text-sm text-text-secondary line-clamp-2 mb-4 min-h-[40px]">
                {tpl.description || '暂无描述'}
              </p>

              <div className="flex items-center gap-2 mb-4">
                {modalities.map((m) => {
                  const Icon = modalityIcons[m];
                  return (
                    <span
                      key={m}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-bg-tertiary/50 text-text-secondary text-xs"
                    >
                      <Icon className="w-3 h-3" />
                      {m === 'text' ? '文本' : m === 'image' ? '图片' : m === 'table' ? '表格' : 'PDF'}
                    </span>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex flex-wrap gap-1">
                  {tpl.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="badge bg-bg-tertiary/50 text-text-muted">
                      {tag}
                    </span>
                  ))}
                </div>
                {confirmDel === tpl.id ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleDelete(tpl.id)}
                      className="btn-danger !py-1 !px-2 !text-xs"
                    >
                      确认删除
                    </button>
                    <button onClick={() => setConfirmDel(null)} className="btn-ghost !py-1 !px-2 !text-xs">
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDel(tpl.id);
                    }}
                    className="text-xs text-text-muted hover:text-danger transition-colors"
                  >
                    删除
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-text-muted">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>暂无匹配的模板</p>
          </div>
        )}
      </div>
    </div>
  );
}
