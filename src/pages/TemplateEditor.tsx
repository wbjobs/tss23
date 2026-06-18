import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Eye,
  Plus,
  FileText,
  Image,
  Table,
  FileSpreadsheet,
  Trash2,
  GripVertical,
  Tag,
  X,
  ChevronDown,
  History,
  Upload,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import PageHeader from '@/components/PageHeader';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import type { ModalityBlock, PromptTemplate, TemplateVariable, ModalityType } from '@shared/types';
import {
  validateImageFile,
  compressImage,
  validateImageDataUrl,
  formatFileSize,
  type CompressResult,
} from '@/utils/imageCompressor';

const TABS: { key: ModalityType | 'variables'; label: string; icon: any; color: string }[] = [
  { key: 'text', label: '文本', icon: FileText, color: 'text-brand-accent' },
  { key: 'image', label: '图片URL', icon: Image, color: 'text-warning' },
  { key: 'table', label: '表格数据', icon: Table, color: 'text-success' },
  { key: 'pdf_summary', label: 'PDF摘要', icon: FileSpreadsheet, color: 'text-purple-400' },
  { key: 'variables', label: '变量', icon: Tag, color: 'text-pink-400' },
];

const newBlock = (type: ModalityType): ModalityBlock => {
  const id = uuidv4();
  if (type === 'text') return { id, type, content: '' };
  if (type === 'image') return { id, type, url: '', alt: '' };
  if (type === 'table') return { id, type, headers: ['列1', '列2'], rows: [['值1', '值2']] };
  return { id, type, fileId: uuidv4(), fileName: '', summary: '', pages: undefined };
};

export default function TemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { templates, fetchTemplates, fetchTemplate, createTemplate, updateTemplate, models, fetchModels, renderTemplate, fetchImageConstraints } =
    useAppStore();

  const [form, setForm] = useState<Partial<PromptTemplate>>({
    name: '',
    description: '',
    version: 'v1.0.0',
    blocks: [newBlock('text')],
    variables: [],
    supportedModels: [],
    tags: [],
  });
  const [activeTab, setActiveTab] = useState<ModalityType | 'variables'>('text');
  const [tagInput, setTagInput] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewModel, setPreviewModel] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [previewVars, setPreviewVars] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, string>>({});
  const [imageInfos, setImageInfos] = useState<Record<string, { original: number; compressed: number; wasCompressed: boolean }>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetBlock, setUploadTargetBlock] = useState<string | null>(null);

  useEffect(() => {
    fetchModels();
    fetchImageConstraints();
    if (isEdit) {
      fetchTemplates().then(() => {
        const tpl = templates.find((t) => t.id === id);
        if (tpl) {
          setForm(tpl);
          setPreviewModel(tpl.supportedModels[0] || '');
        }
      });
    }
  }, [id, isEdit, fetchTemplates, fetchModels, fetchImageConstraints, templates]);

  const handleImageUpload = async (blockId: string, file: File) => {
    const maxMB = useAppStore.getState().imageConstraints?.MAX_IMAGE_SIZE_MB || 5;
    const validation = validateImageFile(file, maxMB);
    if (!validation.valid) {
      setImageErrors({ ...imageErrors, [blockId]: validation.error! });
      return;
    }

    setImageUploading(blockId);
    setImageErrors({ ...imageErrors, [blockId]: '' });

    try {
      const result: CompressResult = await compressImage(file, { maxSizeMB: maxMB });
      updateBlock(blockId, { url: result.dataUrl });
      setImageInfos({
        ...imageInfos,
        [blockId]: {
          original: result.originalSizeMB,
          compressed: result.compressedSizeMB,
          wasCompressed: result.wasCompressed,
        },
      });
      setImageErrors({ ...imageErrors, [blockId]: '' });
    } catch (err: any) {
      setImageErrors({ ...imageErrors, [blockId]: err.message || '图片处理失败' });
    } finally {
      setImageUploading(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadTargetBlock) {
      handleImageUpload(uploadTargetBlock, file);
    }
    setUploadTargetBlock(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileUpload = (blockId: string) => {
    setUploadTargetBlock(blockId);
    fileInputRef.current?.click();
  };

  const updateForm = <K extends keyof PromptTemplate>(key: K, value: PromptTemplate[K]) => {
    setForm({ ...form, [key]: value });
  };

  const addBlock = (type: ModalityType) => {
    updateForm('blocks', [...(form.blocks || []), newBlock(type)]);
    setActiveTab(type);
  };

  const updateBlock = (blockId: string, updates: Partial<ModalityBlock>) => {
    updateForm(
      'blocks',
      (form.blocks || []).map((b) => (b.id === blockId ? ({ ...b, ...updates } as ModalityBlock) : b))
    );
  };

  const removeBlock = (blockId: string) => {
    updateForm(
      'blocks',
      (form.blocks || []).filter((b) => b.id !== blockId)
    );
  };

  const addVariable = () => {
    updateForm('variables', [
      ...(form.variables || []),
      { name: `var_${(form.variables || []).length + 1}`, type: 'string', required: false } as TemplateVariable,
    ]);
  };

  const updateVariable = (idx: number, updates: Partial<TemplateVariable>) => {
    const vars = [...(form.variables || [])];
    vars[idx] = { ...vars[idx], ...updates };
    updateForm('variables', vars);
  };

  const removeVariable = (idx: number) => {
    updateForm(
      'variables',
      (form.variables || []).filter((_, i) => i !== idx)
    );
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !(form.tags || []).includes(t)) {
      updateForm('tags', [...(form.tags || []), t]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    updateForm(
      'tags',
      (form.tags || []).filter((t) => t !== tag)
    );
  };

  const toggleModel = (mid: string) => {
    const current = form.supportedModels || [];
    updateForm(
      'supportedModels',
      current.includes(mid) ? current.filter((x) => x !== mid) : [...current, mid]
    );
  };

  const runPreview = async () => {
    if (!isEdit || !previewModel) return;
    const rendered = await renderTemplate(id!, previewVars, previewModel);
    setPreviewContent(rendered);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isEdit) {
        await updateTemplate(id!, form);
      } else {
        const created = await createTemplate(form);
        navigate(`/templates/${created.id}`);
        return;
      }
    } finally {
      setSaving(false);
    }
  };

  const currentTabBlocks = (form.blocks || []).filter((b) => b.type === activeTab);

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? `编辑模板: ${form.name || '...'}` : '新建 Prompt 模板'}
        description="多模态内容编辑器 - 支持文本、图片URL、表格数据、PDF摘要等多种模态"
        actions={
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary flex items-center gap-2"
              onClick={() => navigate('/templates')}
            >
              <ArrowLeft className="w-4 h-4" /> 返回
            </button>
            {isEdit && (
              <button
                className="btn-secondary flex items-center gap-2"
                onClick={() => setPreviewOpen(!previewOpen)}
              >
                <Eye className="w-4 h-4" /> {previewOpen ? '关闭预览' : '预览渲染'}
              </button>
            )}
            <button className="btn-primary flex items-center gap-2" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4" /> {saving ? '保存中...' : '保存模板'}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <div className="card space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">模板名称</label>
                <input
                  className="input"
                  placeholder="输入模板名称..."
                  value={form.name || ''}
                  onChange={(e) => updateForm('name', e.target.value)}
                />
              </div>
              <div>
                <label className="label">版本号</label>
                <div className="relative">
                  <History className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    className="input pl-10 font-mono"
                    placeholder="v1.0.0"
                    value={form.version || ''}
                    onChange={(e) => updateForm('version', e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="label">模板描述</label>
              <textarea
                className="input min-h-[60px]"
                placeholder="简要描述这个模板的用途..."
                value={form.description || ''}
                onChange={(e) => updateForm('description', e.target.value)}
              />
            </div>
            <div>
              <label className="label">标签</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(form.tags || []).map((tag) => (
                  <span key={tag} className="badge bg-brand-accentDim text-brand-accent">
                    {tag}
                    <button className="ml-1.5 hover:text-white" onClick={() => removeTag(tag)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="输入标签后回车添加..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <button className="btn-secondary" onClick={addTag}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="flex items-center border-b border-border">
              {TABS.map((tab) => {
                const count = tab.key === 'variables' ? (form.variables || []).length : (form.blocks || []).filter((b) => b.type === tab.key).length;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors',
                      activeTab === tab.key
                        ? 'border-brand-accent text-brand-accent bg-brand-accentDim/30'
                        : 'border-transparent text-text-secondary hover:text-text-primary'
                    )}
                  >
                    <tab.icon className={cn('w-4 h-4', tab.color)} />
                    {tab.label}
                    {count > 0 && (
                      <span className="px-1.5 py-0.5 text-xs rounded bg-bg-tertiary text-text-muted">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-5 space-y-3 max-h-[500px] overflow-y-auto">
              {activeTab === 'variables' ? (
                <div className="space-y-3">
                  {(form.variables || []).map((v, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-bg-secondary/50">
                      <GripVertical className="w-5 h-5 text-text-muted mt-2 cursor-grab" />
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">变量名</label>
                          <input
                            className="input !py-1.5 text-sm"
                            placeholder="var_name"
                            value={v.name}
                            onChange={(e) => updateVariable(idx, { name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">类型</label>
                          <select
                            className="input !py-1.5 text-sm"
                            value={v.type}
                            onChange={(e) => updateVariable(idx, { type: e.target.value as any })}
                          >
                            <option value="string">字符串</option>
                            <option value="number">数字</option>
                            <option value="image_url">图片URL</option>
                            <option value="table_data">表格数据</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">默认值</label>
                          <input
                            className="input !py-1.5 text-sm"
                            placeholder="可选"
                            value={v.defaultValue || ''}
                            onChange={(e) => updateVariable(idx, { defaultValue: e.target.value })}
                          />
                        </div>
                        <div className="flex items-end">
                          <label className="inline-flex items-center gap-1.5 text-sm text-text-secondary">
                            <input
                              type="checkbox"
                              checked={v.required}
                              onChange={(e) => updateVariable(idx, { required: e.target.checked })}
                              className="rounded border-border bg-bg-secondary"
                            />
                            必填
                          </label>
                        </div>
                      </div>
                      <button
                        onClick={() => removeVariable(idx)}
                        className="text-text-muted hover:text-danger p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button className="btn-secondary w-full flex items-center justify-center gap-2" onClick={addVariable}>
                    <Plus className="w-4 h-4" /> 添加变量
                  </button>
                </div>
              ) : (
                <>
                  {currentTabBlocks.map((block) => (
                    <div
                      key={block.id}
                      className="p-4 rounded-xl border border-border bg-bg-secondary/30"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-text-muted cursor-grab" />
                          <span className="text-sm font-medium text-text-primary">
                            {activeTab === 'text'
                              ? '文本块'
                              : activeTab === 'image'
                                ? '图片块'
                                : activeTab === 'table'
                                  ? '表格数据块'
                                  : 'PDF摘要块'}
                          </span>
                        </div>
                        <button
                          className="text-text-muted hover:text-danger p-1"
                          onClick={() => removeBlock(block.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {block.type === 'text' && (
                        <textarea
                          className="input min-h-[140px] font-mono text-sm leading-relaxed"
                          placeholder={`在此输入文本内容，使用 {{变量名}} 插入变量...\n\n例如：\n你是一位{{role}}，请回答以下问题：\n{{question}}`}
                          value={block.content}
                          onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        />
                      )}

                      {block.type === 'image' && (
                        <div className="space-y-3">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            className="hidden"
                            onChange={handleFileInputChange}
                          />
                          <div>
                            <label className="text-xs text-text-muted mb-1 block">图片URL / 上传图片</label>
                            <div className="flex gap-2">
                              <input
                                className="input font-mono text-sm flex-1"
                                placeholder="https://example.com/image.png"
                                value={block.url && !block.url.startsWith('data:') ? block.url : ''}
                                onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                              />
                              <button
                                className={cn(
                                  'btn-secondary flex items-center gap-2 whitespace-nowrap',
                                  imageUploading === block.id && 'opacity-50 cursor-not-allowed'
                                )}
                                onClick={() => triggerFileUpload(block.id)}
                                disabled={imageUploading === block.id}
                              >
                                {imageUploading === block.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Upload className="w-4 h-4" />
                                )}
                                {imageUploading === block.id ? '压缩中...' : '上传图片'}
                              </button>
                            </div>
                            <p className="text-xs text-text-muted mt-1">
                              支持 JPG/PNG/GIF/WebP，最大 {useAppStore.getState().imageConstraints?.MAX_IMAGE_SIZE_MB || 5}MB
                              {block.url && !block.url.startsWith('data://') && ' · 远程URL图片将在服务端校验大小'}
                            </p>
                          </div>
                          {imageErrors[block.id] && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-danger/10 border border-danger/30">
                              <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                              <p className="text-sm text-danger">{imageErrors[block.id]}</p>
                            </div>
                          )}
                          {imageInfos[block.id] && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-success/10 border border-success/30">
                              <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                              <div className="text-sm">
                                <p className="text-success">
                                  图片已{imageInfos[block.id].wasCompressed ? '压缩' : '就绪'}
                                  {imageInfos[block.id].wasCompressed && (
                                    <>：{formatFileSize(imageInfos[block.id].original)} → {formatFileSize(imageInfos[block.id].compressed)}</>
                                  )}
                                </p>
                              </div>
                            </div>
                          )}
                          <div>
                            <label className="text-xs text-text-muted mb-1 block">Alt描述（可选）</label>
                            <input
                              className="input text-sm"
                              placeholder="图片描述"
                              value={block.alt || ''}
                              onChange={(e) => updateBlock(block.id, { alt: e.target.value })}
                            />
                          </div>
                          {block.url && (
                            <div className="mt-3 p-3 rounded-lg bg-bg-primary border border-border">
                              <img
                                src={block.url}
                                alt={block.alt}
                                className="max-h-40 rounded object-contain mx-auto"
                                onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {block.type === 'table' && (
                        <div className="space-y-3 overflow-x-auto">
                          <table className="w-full border-collapse min-w-[400px]">
                            <thead>
                              <tr>
                                {block.headers.map((h, i) => (
                                  <th key={i} className="border border-border p-2 bg-bg-tertiary/50">
                                    <input
                                      className="w-full bg-transparent text-sm text-text-primary outline-none"
                                      value={h}
                                      onChange={(e) => {
                                        const headers = [...block.headers];
                                        headers[i] = e.target.value;
                                        updateBlock(block.id, { headers });
                                      }}
                                    />
                                  </th>
                                ))}
                                <th className="w-10"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {block.rows.map((row, ri) => (
                                <tr key={ri}>
                                  {row.map((cell, ci) => (
                                    <td key={ci} className="border border-border p-2">
                                      <input
                                        className="w-full bg-transparent text-sm text-text-secondary outline-none"
                                        value={cell}
                                        onChange={(e) => {
                                          const rows = block.rows.map((r) => [...r]);
                                          rows[ri][ci] = e.target.value;
                                          updateBlock(block.id, { rows });
                                        }}
                                      />
                                    </td>
                                  ))}
                                  <td className="p-1">
                                    <button
                                      className="text-text-muted hover:text-danger p-1"
                                      onClick={() =>
                                        updateBlock(block.id, {
                                          rows: block.rows.filter((_, i) => i !== ri),
                                        })
                                      }
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="flex gap-2">
                            <button
                              className="btn-ghost text-xs"
                              onClick={() =>
                                updateBlock(block.id, {
                                  headers: [...block.headers, `列${block.headers.length + 1}`],
                                  rows: block.rows.map((r) => [...r, '']),
                                })
                              }
                            >
                              + 列
                            </button>
                            <button
                              className="btn-ghost text-xs"
                              onClick={() =>
                                updateBlock(block.id, {
                                  rows: [...block.rows, block.headers.map(() => '')],
                                })
                              }
                            >
                              + 行
                            </button>
                          </div>
                        </div>
                      )}

                      {block.type === 'pdf_summary' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-text-muted mb-1 block">文件名</label>
                              <input
                                className="input text-sm"
                                placeholder="document.pdf"
                                value={block.fileName}
                                onChange={(e) => updateBlock(block.id, { fileName: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-text-muted mb-1 block">页数（可选）</label>
                              <input
                                type="number"
                                className="input text-sm"
                                placeholder="128"
                                value={block.pages || ''}
                                onChange={(e) =>
                                  updateBlock(block.id, { pages: e.target.value ? Number(e.target.value) : undefined })
                                }
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-text-muted mb-1 block">PDF摘要内容</label>
                            <textarea
                              className="input min-h-[100px] text-sm"
                              placeholder="粘贴PDF的文本摘要内容..."
                              value={block.summary}
                              onChange={(e) => updateBlock(block.id, { summary: e.target.value })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    className="btn-secondary w-full flex items-center justify-center gap-2"
                    onClick={() => addBlock(activeTab as ModalityType)}
                  >
                    <Plus className="w-4 h-4" /> 添加{activeTab === 'text' ? '文本' : activeTab === 'image' ? '图片' : activeTab === 'table' ? '表格' : 'PDF摘要'}块
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="font-display font-semibold text-text-primary mb-3">支持的模型</h3>
            <p className="text-xs text-text-muted mb-3">选择此模板兼容的模型</p>
            <div className="space-y-2">
              {models.filter((m) => m.enabled).map((m) => (
                <label
                  key={m.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    (form.supportedModels || []).includes(m.id)
                      ? 'border-brand-accent bg-brand-accentDim/30'
                      : 'border-border hover:border-border-hover'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={(form.supportedModels || []).includes(m.id)}
                    onChange={() => toggleModel(m.id)}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center',
                      (form.supportedModels || []).includes(m.id)
                        ? 'bg-brand-accent border-brand-accent'
                        : 'border-text-muted'
                    )}
                  >
                    {(form.supportedModels || []).includes(m.id) && (
                      <svg className="w-3 h-3 text-bg-primary" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{m.name}</p>
                    <p className="text-xs text-text-muted capitalize">{m.provider}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {previewOpen && isEdit && (
            <div className="card">
              <h3 className="font-display font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-brand-accent" /> 渲染预览
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-text-muted mb-1 block">选择模型</label>
                  <div className="relative">
                    <select
                      className="input pr-10 appearance-none"
                      value={previewModel}
                      onChange={(e) => setPreviewModel(e.target.value)}
                    >
                      <option value="">请选择...</option>
                      {(form.supportedModels || []).map((mid) => {
                        const m = models.find((x) => x.id === mid);
                        return (
                          <option key={mid} value={mid}>
                            {m?.name || mid}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  </div>
                </div>
                {(form.variables || []).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-text-muted">变量值：</p>
                    {(form.variables || []).map((v) => (
                      <div key={v.name}>
                        <label className="text-xs text-text-secondary mb-0.5 block">
                          {v.name} {v.required && <span className="text-danger">*</span>}
                        </label>
                        <input
                          className="input !py-1.5 text-sm"
                          placeholder={v.defaultValue || `输入${v.name}`}
                          value={previewVars[v.name] || ''}
                          onChange={(e) => setPreviewVars({ ...previewVars, [v.name]: e.target.value })}
                        />
                      </div>
                    ))}
                  </div>
                )}
                <button className="btn-primary w-full text-sm" onClick={runPreview}>
                  生成预览
                </button>
                {previewContent && (
                  <div className="code-block text-xs whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {previewContent}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
