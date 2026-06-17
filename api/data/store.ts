import type {
  ModelConfig,
  PromptTemplate,
  AssertionRule,
  CallLog,
  EvaluationResult,
  TrendDataPoint,
  ModelDistribution,
  EvaluationReport,
} from '../../shared/types.js';
import { v4 as uuidv4 } from 'uuid';

const now = new Date().toISOString();
const daysAgo = (d: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  return dt.toISOString();
};

export const models: ModelConfig[] = [
  {
    id: 'm1',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: 'sk-xxxx',
    modelId: 'gpt-4-turbo',
    maxTokens: 4096,
    temperature: 0.7,
    enabled: true,
    rateLimit: 100,
    healthStatus: 'healthy',
    createdAt: daysAgo(30),
    updatedAt: daysAgo(2),
  },
  {
    id: 'm2',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: 'sk-xxxx',
    modelId: 'gpt-3.5-turbo',
    maxTokens: 4096,
    temperature: 0.7,
    enabled: true,
    rateLimit: 500,
    healthStatus: 'healthy',
    createdAt: daysAgo(30),
    updatedAt: daysAgo(5),
  },
  {
    id: 'm3',
    name: 'Claude 3.5 Sonnet',
    provider: 'claude',
    baseUrl: 'https://api.anthropic.com/v1',
    apiKey: 'sk-ant-xxxx',
    modelId: 'claude-3-5-sonnet-20240620',
    maxTokens: 8192,
    temperature: 0.7,
    enabled: true,
    rateLimit: 80,
    healthStatus: 'healthy',
    createdAt: daysAgo(20),
    updatedAt: daysAgo(1),
  },
  {
    id: 'm4',
    name: 'Claude 3 Opus',
    provider: 'claude',
    baseUrl: 'https://api.anthropic.com/v1',
    apiKey: 'sk-ant-xxxx',
    modelId: 'claude-3-opus-20240229',
    maxTokens: 8192,
    temperature: 0.7,
    enabled: false,
    rateLimit: 20,
    healthStatus: 'degraded',
    createdAt: daysAgo(20),
    updatedAt: daysAgo(7),
  },
  {
    id: 'm5',
    name: 'Llama 3 70B (本地)',
    provider: 'llama',
    baseUrl: 'http://localhost:8080/v1',
    apiKey: 'local-key',
    modelId: 'llama-3-70b-instruct',
    maxTokens: 4096,
    temperature: 0.7,
    enabled: true,
    rateLimit: 30,
    healthStatus: 'healthy',
    createdAt: daysAgo(15),
    updatedAt: daysAgo(3),
  },
];

export const templates: PromptTemplate[] = [
  {
    id: 't1',
    name: '客户邮件智能回复',
    description: '根据客户咨询邮件内容，生成专业、友好的回复建议',
    version: 'v1.2.0',
    blocks: [
      {
        id: 'b1',
        type: 'text',
        content:
          '你是一位资深客户服务经理。请根据以下客户邮件，生成一个专业、友好的回复。\n\n客户邮件：\n{{customer_email}}\n\n请使用以下格式回复：\n1. 感谢客户的反馈\n2. 对问题表示理解和歉意（如适用）\n3. 提供具体解决方案\n4. 邀请客户进一步沟通',
      },
      {
        id: 'b2',
        type: 'image',
        url: 'https://example.com/company-logo.png',
        alt: '公司Logo',
      },
    ],
    variables: [
      {
        name: 'customer_email',
        type: 'string',
        required: true,
        description: '客户原始邮件内容',
      },
    ],
    supportedModels: ['m1', 'm2', 'm3'],
    tags: ['客户服务', '邮件'],
    createdBy: 'admin',
    createdAt: daysAgo(25),
    updatedAt: daysAgo(3),
  },
  {
    id: 't2',
    name: '产品评论情感分析',
    description: '分析用户产品评论的情感倾向，并提取关键词',
    version: 'v2.0.1',
    blocks: [
      {
        id: 'b1',
        type: 'text',
        content:
          '请分析以下产品评论的情感倾向，并输出JSON格式结果，包含：sentiment(positive/negative/neutral), score(0-1), keywords(string[])。\n\n评论数据：',
      },
      {
        id: 'b2',
        type: 'table',
        headers: ['评论ID', '用户', '评论内容', '评分'],
        rows: [
          ['r001', '张三', '产品质量很好，物流也快！', '5'],
          ['r002', '李四', '包装有点破损，但产品没问题', '4'],
          ['r003', '王五', '和描述不符，退货了', '1'],
        ],
      },
    ],
    variables: [],
    supportedModels: ['m1', 'm3', 'm5'],
    tags: ['数据分析', 'NLP', 'JSON'],
    createdBy: 'admin',
    createdAt: daysAgo(18),
    updatedAt: daysAgo(5),
  },
  {
    id: 't3',
    name: '技术文档摘要生成',
    description: '根据上传的PDF技术文档，生成结构化的摘要要点',
    version: 'v1.0.3',
    blocks: [
      {
        id: 'b1',
        type: 'text',
        content:
          '请根据以下PDF文档摘要，生成一份结构化的技术文档摘要，包括：\n- 核心主题\n- 关键技术点（不少于5点）\n- 适用场景\n- 注意事项\n\nPDF文档摘要内容：',
      },
      {
        id: 'b2',
        type: 'pdf_summary',
        fileId: 'pdf-001',
        fileName: 'Kubernetes最佳实践.pdf',
        summary:
          '本文档详细介绍了Kubernetes集群的部署、配置、监控和运维最佳实践。包括Pod调度策略、资源限制配置、HPA自动扩缩容、Istio服务网格集成、Prometheus监控告警体系等核心内容。全书共12章，384页。',
        pages: 384,
      },
    ],
    variables: [],
    supportedModels: ['m1', 'm3'],
    tags: ['文档处理', '摘要'],
    createdBy: 'admin',
    createdAt: daysAgo(10),
    updatedAt: daysAgo(1),
  },
  {
    id: 't4',
    name: '代码审查助手',
    description: '对提交的代码进行审查，找出潜在问题和优化建议',
    version: 'v1.1.0',
    blocks: [
      {
        id: 'b1',
        type: 'text',
        content:
          '你是一位资深软件工程师。请对以下代码进行审查，检查：\n1. 是否存在Bug或逻辑错误\n2. 性能优化建议\n3. 代码风格和可读性\n4. 安全漏洞\n\n代码语言：{{language}}\n代码内容：\n```{{language}}\n{{code}}\n```',
      },
    ],
    variables: [
      { name: 'language', type: 'string', required: true, defaultValue: 'typescript' },
      { name: 'code', type: 'string', required: true },
    ],
    supportedModels: ['m1', 'm2', 'm3', 'm5'],
    tags: ['代码审查', '开发工具'],
    createdBy: 'admin',
    createdAt: daysAgo(8),
    updatedAt: daysAgo(2),
  },
];

export const assertions: AssertionRule[] = [
  {
    id: 'a1',
    templateId: 't1',
    type: 'keyword_contains',
    name: '回复包含感谢语',
    weight: 20,
    enabled: true,
    config: { keywords: ['感谢', '谢谢', '感谢您'] },
  },
  {
    id: 'a2',
    templateId: 't1',
    type: 'keyword_contains',
    name: '包含解决方案',
    weight: 30,
    enabled: true,
    config: { keywords: ['解决方案', '建议', '可以', '我们将'] },
  },
  {
    id: 'a3',
    templateId: 't2',
    type: 'json_schema',
    name: '输出格式为有效JSON',
    weight: 50,
    enabled: true,
    config: {
      schema: {
        type: 'object',
        required: ['sentiment', 'score', 'keywords'],
        properties: {
          sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
          score: { type: 'number', minimum: 0, maximum: 1 },
          keywords: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
  {
    id: 'a4',
    templateId: 't2',
    type: 'sentiment',
    name: '整体情感倾向非负面',
    weight: 30,
    enabled: true,
    config: { expected: 'positive_or_neutral' },
  },
  {
    id: 'a5',
    templateId: 't4',
    type: 'keyword_contains',
    name: '包含具体审查项',
    weight: 40,
    enabled: true,
    config: { keywords: ['Bug', '优化', '安全', '建议', '问题'] },
  },
];

const evalResults: EvaluationResult[] = [
  {
    id: 'e1',
    callLogId: 'l1',
    templateId: 't1',
    overallScore: 90,
    passed: true,
    assertions: [
      { ruleId: 'a1', ruleName: '回复包含感谢语', passed: true, score: 20 },
      { ruleId: 'a2', ruleName: '包含解决方案', passed: true, score: 28 },
    ],
    createdAt: daysAgo(0),
  },
  {
    id: 'e2',
    callLogId: 'l2',
    templateId: 't2',
    overallScore: 100,
    passed: true,
    assertions: [
      { ruleId: 'a3', ruleName: '输出格式为有效JSON', passed: true, score: 50 },
      { ruleId: 'a4', ruleName: '整体情感倾向非负面', passed: true, score: 30 },
    ],
    createdAt: daysAgo(0),
  },
  {
    id: 'e3',
    callLogId: 'l3',
    templateId: 't1',
    overallScore: 40,
    passed: false,
    assertions: [
      { ruleId: 'a1', ruleName: '回复包含感谢语', passed: false, score: 0, message: '未检测到感谢关键词' },
      { ruleId: 'a2', ruleName: '包含解决方案', passed: true, score: 28 },
    ],
    createdAt: daysAgo(1),
  },
];

export const callLogs: CallLog[] = [
  {
    id: 'l1',
    templateId: 't1',
    templateName: '客户邮件智能回复',
    modelId: 'm1',
    modelProvider: 'openai',
    modelName: 'GPT-4 Turbo',
    request: {
      prompt: '客户邮件：我的订单迟迟未发货...',
      modalities: ['text', 'image'],
      variables: { customer_email: '我的订单迟迟未发货...' },
      params: { temperature: 0.7 },
    },
    response: {
      content:
        '尊敬的客户，非常感谢您联系我们。对于订单延迟发货我们深表歉意...我们已为您安排加急处理，预计明天即可发出...',
      usage: { promptTokens: 256, completionTokens: 320, totalTokens: 576 },
    },
    latencyMs: 1820,
    status: 'success',
    evaluation: evalResults[0],
    calledBy: 'service-api',
    timestamp: daysAgo(0),
  },
  {
    id: 'l2',
    templateId: 't2',
    templateName: '产品评论情感分析',
    modelId: 'm3',
    modelProvider: 'claude',
    modelName: 'Claude 3.5 Sonnet',
    request: {
      prompt: '评论情感分析任务...',
      modalities: ['text', 'table'],
      variables: {},
      params: { temperature: 0.2 },
    },
    response: {
      content:
        '[{"sentiment":"positive","score":0.85,"keywords":["质量好","物流快"]},...]',
      usage: { promptTokens: 512, completionTokens: 256, totalTokens: 768 },
    },
    latencyMs: 2150,
    status: 'success',
    evaluation: evalResults[1],
    calledBy: 'analytics-service',
    timestamp: daysAgo(0),
  },
  {
    id: 'l3',
    templateId: 't1',
    templateName: '客户邮件智能回复',
    modelId: 'm2',
    modelProvider: 'openai',
    modelName: 'GPT-3.5 Turbo',
    request: {
      prompt: '客户邮件咨询退款政策...',
      modalities: ['text'],
      variables: { customer_email: '请问如何申请退款...' },
      params: { temperature: 0.7 },
    },
    response: {
      content: '退款流程如下：登录账户，进入订单详情页...',
      usage: { promptTokens: 180, completionTokens: 150, totalTokens: 330 },
    },
    latencyMs: 890,
    status: 'success',
    evaluation: evalResults[2],
    calledBy: 'service-api',
    timestamp: daysAgo(1),
  },
  {
    id: 'l4',
    templateId: 't3',
    templateName: '技术文档摘要生成',
    modelId: 'm1',
    modelProvider: 'openai',
    modelName: 'GPT-4 Turbo',
    request: {
      prompt: 'PDF摘要任务：Kubernetes最佳实践...',
      modalities: ['text', 'pdf_summary'],
      variables: {},
      params: { temperature: 0.5 },
    },
    response: {
      content:
        '## 核心主题\nKubernetes集群生产级部署与运维...\n## 关键技术点\n1. Pod亲和性与反亲和性...',
      usage: { promptTokens: 1024, completionTokens: 768, totalTokens: 1792 },
    },
    latencyMs: 3200,
    status: 'success',
    calledBy: 'docs-team',
    timestamp: daysAgo(1),
  },
  {
    id: 'l5',
    templateId: 't4',
    templateName: '代码审查助手',
    modelId: 'm5',
    modelProvider: 'llama',
    modelName: 'Llama 3 70B (本地)',
    request: {
      prompt: '代码审查：用户认证模块...',
      modalities: ['text'],
      variables: { language: 'typescript', code: 'function verifyToken(...) { ... }' },
      params: { temperature: 0.3 },
    },
    response: {
      content: '代码审查报告：\n1. 发现一个潜在的空指针异常...\n2. 建议添加类型检查...',
      usage: { promptTokens: 800, completionTokens: 512, totalTokens: 1312 },
    },
    latencyMs: 4500,
    status: 'success',
    calledBy: 'dev-team',
    timestamp: daysAgo(2),
  },
  {
    id: 'l6',
    templateId: 't2',
    templateName: '产品评论情感分析',
    modelId: 'm1',
    modelProvider: 'openai',
    modelName: 'GPT-4 Turbo',
    request: {
      prompt: '批量情感分析...',
      modalities: ['text', 'table'],
      variables: {},
      params: { temperature: 0.2 },
    },
    response: {
      content: '分析结果...',
      usage: { promptTokens: 640, completionTokens: 300, totalTokens: 940 },
    },
    latencyMs: 1950,
    status: 'success',
    calledBy: 'analytics-service',
    timestamp: daysAgo(2),
  },
  {
    id: 'l7',
    templateId: 't1',
    templateName: '客户邮件智能回复',
    modelId: 'm3',
    modelProvider: 'claude',
    modelName: 'Claude 3.5 Sonnet',
    request: {
      prompt: '客户投诉邮件...',
      modalities: ['text'],
      variables: { customer_email: '你们的产品质量太差了...' },
      params: { temperature: 0.7 },
    },
    response: {
      content: '非常抱歉给您带来了不好的体验...',
      usage: { promptTokens: 320, completionTokens: 280, totalTokens: 600 },
    },
    latencyMs: 2400,
    status: 'success',
    calledBy: 'service-api',
    timestamp: daysAgo(3),
  },
  {
    id: 'l8',
    modelId: 'm2',
    modelProvider: 'openai',
    modelName: 'GPT-3.5 Turbo',
    request: {
      prompt: '直接调用：帮我写一首关于春天的诗',
      modalities: ['text'],
      variables: {},
      params: { temperature: 0.9 },
    },
    response: {
      content: '春风拂柳绿，桃花映水红...',
      usage: { promptTokens: 30, completionTokens: 80, totalTokens: 110 },
    },
    latencyMs: 520,
    status: 'success',
    calledBy: 'playground-user',
    timestamp: daysAgo(3),
  },
  {
    id: 'l9',
    templateId: 't4',
    templateName: '代码审查助手',
    modelId: 'm3',
    modelProvider: 'claude',
    modelName: 'Claude 3.5 Sonnet',
    request: {
      prompt: '代码审查请求...',
      modalities: ['text'],
      variables: { language: 'python', code: 'def process_data(items): ...' },
      params: { temperature: 0.3 },
    },
    response: {
      content: '审查完成，发现2个优化点...',
      usage: { promptTokens: 650, completionTokens: 420, totalTokens: 1070 },
    },
    latencyMs: 2800,
    status: 'success',
    calledBy: 'dev-team',
    timestamp: daysAgo(4),
  },
  {
    id: 'l10',
    templateId: 't3',
    templateName: '技术文档摘要生成',
    modelId: 'm3',
    modelProvider: 'claude',
    modelName: 'Claude 3.5 Sonnet',
    request: {
      prompt: '文档摘要生成...',
      modalities: ['text', 'pdf_summary'],
      variables: {},
      params: { temperature: 0.5 },
    },
    response: {
      content: '摘要生成中...',
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    },
    latencyMs: 0,
    status: 'error',
    errorMessage: '模型响应超时 (timeout)',
    calledBy: 'docs-team',
    timestamp: daysAgo(5),
  },
];

export function genId() {
  return uuidv4();
}

export function getStatsSummary() {
  const totalCalls = callLogs.length;
  const totalTokens = callLogs.reduce((s, l) => s + l.response.usage.totalTokens, 0);
  const successCalls = callLogs.filter((l) => l.status === 'success');
  const avgLatency =
    successCalls.length > 0
      ? Math.round(successCalls.reduce((s, l) => s + l.latencyMs, 0) / successCalls.length)
      : 0;
  const evaluatedCalls = callLogs.filter((l) => l.evaluation);
  const passRate =
    evaluatedCalls.length > 0
      ? Math.round(
          (evaluatedCalls.filter((l) => l.evaluation?.passed).length / evaluatedCalls.length) * 100
        )
      : 0;
  return {
    totalCalls: totalCalls * 137,
    totalTokens: totalTokens * 137,
    avgLatencyMs: avgLatency,
    evalPassRate: passRate,
    callsChange: 12.5,
    tokensChange: 8.3,
    latencyChange: -5.2,
    passRateChange: 2.1,
  };
}

export function getTrends(days = 7): TrendDataPoint[] {
  const result: TrendDataPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const base = 50 + Math.random() * 80;
    result.push({
      date: d.toISOString().split('T')[0],
      calls: Math.round(base * (1 + Math.random() * 0.5)),
      tokens: Math.round(base * 800 * (1 + Math.random() * 0.3)),
      avgLatency: Math.round(1000 + Math.random() * 2500),
      evalScore: Math.round(75 + Math.random() * 20),
    });
  }
  return result;
}

export function getDistribution(): ModelDistribution[] {
  const byModel: Record<string, { count: number; scoreSum: number; scoreCount: number }> = {};
  for (const log of callLogs) {
    if (!byModel[log.modelId]) {
      byModel[log.modelId] = { count: 0, scoreSum: 0, scoreCount: 0 };
    }
    byModel[log.modelId].count++;
    if (log.evaluation) {
      byModel[log.modelId].scoreSum += log.evaluation.overallScore;
      byModel[log.modelId].scoreCount++;
    }
  }
  const total = Object.values(byModel).reduce((s, v) => s + v.count, 0);
  return Object.entries(byModel).map(([mid, v]) => {
    const m = models.find((x) => x.id === mid);
    return {
      modelId: mid,
      modelName: m?.name || mid,
      count: v.count * 137,
      percentage: Math.round((v.count / total) * 100),
      avgScore: v.scoreCount > 0 ? Math.round(v.scoreSum / v.scoreCount) : 0,
    };
  });
}

export function getEvaluationReport(templateId: string): EvaluationReport {
  const tpl = templates.find((t) => t.id === templateId);
  const relatedLogs = callLogs.filter((l) => l.templateId === templateId);
  const evaluated = relatedLogs.filter((l) => l.evaluation);
  const totalRuns = relatedLogs.length * 42;
  const passRate =
    evaluated.length > 0
      ? Math.round((evaluated.filter((l) => l.evaluation?.passed).length / evaluated.length) * 100)
      : 85;
  const avgScore =
    evaluated.length > 0
      ? Math.round(evaluated.reduce((s, l) => s + (l.evaluation?.overallScore || 0), 0) / evaluated.length)
      : 82;

  const scoreDistribution = [
    { range: '0-59', count: Math.round(totalRuns * 0.05) },
    { range: '60-69', count: Math.round(totalRuns * 0.1) },
    { range: '70-79', count: Math.round(totalRuns * 0.25) },
    { range: '80-89', count: Math.round(totalRuns * 0.4) },
    { range: '90-100', count: Math.round(totalRuns * 0.2) },
  ];

  const tplAssertions = assertions.filter((a) => a.templateId === templateId);
  const failureReasons = tplAssertions.map((a) => ({
    ruleName: a.name,
    count: Math.floor(Math.random() * 20),
  }));

  const history: { date: string; passRate: number; avgScore: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    history.push({
      date: d.toISOString().split('T')[0],
      passRate: Math.round(75 + Math.random() * 20),
      avgScore: Math.round(75 + Math.random() * 20),
    });
  }

  return {
    templateId,
    templateName: tpl?.name || '未知模板',
    totalRuns,
    passRate,
    avgScore,
    scoreDistribution,
    failureReasons,
    history,
  };
}
