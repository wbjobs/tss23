import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Activity, Cpu, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import type { ModelProvider } from '@shared/types';

const providerMeta: Record<ModelProvider, { label: string; color: string; icon: string }> = {
  openai: { label: 'OpenAI', color: 'bg-emerald-500', icon: '●' },
  claude: { label: 'Anthropic', color: 'bg-orange-500', icon: '●' },
  llama: { label: 'Meta Llama', color: 'bg-blue-500', icon: '●' },
  other: { label: '其他', color: 'bg-purple-500', icon: '●' },
};

export default function Models() {
  const { models, fetchModels, deleteModel, updateModel, checkModelHealth } = useAppStore();
  const navigate = useNavigate();
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleDelete = async (id: string) => {
    await deleteModel(id);
    setConfirmDel(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="模型管理"
        description="配置和管理接入网关的大语言模型服务"
        actions={
          <button className="btn-primary flex items-center gap-2" onClick={() => navigate('/models/new')}>
            <Plus className="w-4 h-4" /> 新增模型
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {models.map((model) => {
          const meta = providerMeta[model.provider];
          return (
            <div key={model.id} className="card card-hover">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', meta.color + '/20')}>
                    <Cpu className={cn('w-6 h-6', meta.color.replace('bg-', 'text-'))} />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-text-primary">{model.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn('w-2 h-2 rounded-full', meta.color)} />
                      <span className="text-xs text-text-muted">{meta.label}</span>
                      <span className="text-xs text-text-muted">·</span>
                      <code className="text-xs text-text-muted">{model.modelId}</code>
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={model.enabled}
                    onChange={async (e) => {
                      await updateModel(model.id, { enabled: e.target.checked });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-bg-tertiary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-accent"></div>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3 py-4 border-y border-border">
                <div>
                  <p className="text-xs text-text-muted mb-0.5">最大Tokens</p>
                  <p className="text-sm font-medium text-text-primary">{model.maxTokens.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-0.5">温度</p>
                  <p className="text-sm font-medium text-text-primary">{model.temperature}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-0.5">限流QPS</p>
                  <p className="text-sm font-medium text-text-primary">{model.rateLimit}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  {model.healthStatus && <StatusBadge status={model.healthStatus} />}
                  <button
                    onClick={() => checkModelHealth(model.id)}
                    className="btn-ghost !p-1.5 text-text-muted hover:text-brand-accent"
                    title="健康检查"
                  >
                    <Activity className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navigate(`/models/${model.id}/edit`)}
                    className="btn-ghost !p-2 text-text-secondary hover:text-brand-accent"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {confirmDel === model.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDelete(model.id)} className="btn-danger !py-1 !px-2 !text-xs">
                        确认
                      </button>
                      <button onClick={() => setConfirmDel(null)} className="btn-ghost !py-1 !px-2 !text-xs">
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDel(model.id)}
                      className="btn-ghost !p-2 text-text-secondary hover:text-danger"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
