export type ModelProvider = 'openai' | 'claude' | 'llama' | 'other';

export interface ModelConfig {
  id: string;
  name: string;
  provider: ModelProvider;
  baseUrl: string;
  apiKey: string;
  modelId: string;
  maxTokens: number;
  temperature: number;
  enabled: boolean;
  rateLimit: number;
  healthStatus?: 'healthy' | 'degraded' | 'unhealthy';
  createdAt: string;
  updatedAt: string;
}

export type ModalityType = 'text' | 'image' | 'table' | 'pdf_summary';

export type ModalityBlock =
  | { id: string; type: 'text'; content: string }
  | { id: string; type: 'image'; url: string; alt?: string }
  | { id: string; type: 'table'; headers: string[]; rows: string[][] }
  | { id: string; type: 'pdf_summary'; fileId: string; fileName: string; summary: string; pages?: number };

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'image_url' | 'table_data';
  required: boolean;
  defaultValue?: any;
  description?: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  blocks: ModalityBlock[];
  variables: TemplateVariable[];
  supportedModels: string[];
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVersion {
  id: string;
  templateId: string;
  version: string;
  blocks: ModalityBlock[];
  variables: TemplateVariable[];
  createdAt: string;
}

export type AssertionType =
  | 'keyword_contains'
  | 'keyword_excludes'
  | 'json_schema'
  | 'regex_match'
  | 'sentiment'
  | 'custom_script';

export interface AssertionRule {
  id: string;
  templateId: string;
  type: AssertionType;
  name: string;
  weight: number;
  enabled: boolean;
  config: Record<string, any>;
}

export interface AssertionDetail {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  score: number;
  message?: string;
}

export interface EvaluationResult {
  id: string;
  callLogId: string;
  templateId: string;
  overallScore: number;
  passed: boolean;
  assertions: AssertionDetail[];
  createdAt: string;
}

export interface CallLog {
  id: string;
  templateId?: string;
  templateName?: string;
  modelId: string;
  modelProvider: ModelProvider;
  modelName?: string;
  request: {
    prompt: string;
    modalities: ModalityType[];
    variables: Record<string, any>;
    params: Record<string, any>;
  };
  response: {
    content: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
  latencyMs: number;
  status: 'success' | 'error' | 'rate_limited';
  errorMessage?: string;
  evaluation?: EvaluationResult;
  calledBy: string;
  timestamp: string;
}

export interface StatsSummary {
  totalCalls: number;
  totalTokens: number;
  avgLatencyMs: number;
  evalPassRate: number;
  callsChange: number;
  tokensChange: number;
  latencyChange: number;
  passRateChange: number;
}

export interface TrendDataPoint {
  date: string;
  calls: number;
  tokens: number;
  avgLatency: number;
  evalScore: number;
}

export interface ModelDistribution {
  modelId: string;
  modelName: string;
  count: number;
  percentage: number;
  avgScore: number;
}

export interface EvaluationReport {
  templateId: string;
  templateName: string;
  totalRuns: number;
  passRate: number;
  avgScore: number;
  scoreDistribution: { range: string; count: number }[];
  failureReasons: { ruleName: string; count: number }[];
  history: { date: string; passRate: number; avgScore: number }[];
}

export interface GatewayChatRequest {
  templateId?: string;
  modelId: string;
  variables?: Record<string, any>;
  modalities?: ModalityBlock[];
  stream?: boolean;
  params?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
  runEvaluation?: boolean;
}

export interface GatewayChatResponse {
  id: string;
  modelId: string;
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  evaluation?: EvaluationResult;
}

export enum GatewayErrorCode {
  MODEL_NOT_FOUND = 'GATEWAY_MODEL_NOT_FOUND',
  MODEL_DISABLED = 'GATEWAY_MODEL_DISABLED',
  POOL_EXHAUSTED = 'GATEWAY_POOL_EXHAUSTED',
  POOL_QUEUE_TIMEOUT = 'GATEWAY_QUEUE_TIMEOUT',
  IMAGE_TOO_LARGE = 'GATEWAY_IMAGE_TOO_LARGE',
  IMAGE_FETCH_FAILED = 'GATEWAY_IMAGE_FETCH_FAILED',
  IMAGE_ENCODING_FAILED = 'GATEWAY_IMAGE_ENCODING_FAILED',
  PAYLOAD_TOO_LARGE = 'GATEWAY_PAYLOAD_TOO_LARGE',
  TEMPLATE_NOT_FOUND = 'GATEWAY_TEMPLATE_NOT_FOUND',
  INTERNAL_ERROR = 'GATEWAY_INTERNAL_ERROR',
}

export interface GatewayErrorResponse {
  success: false;
  code: GatewayErrorCode;
  message: string;
  detail?: string;
}

export interface ImageConstraints {
  MAX_IMAGE_SIZE_MB: number;
  MAX_TOTAL_PAYLOAD_MB: number;
  ALLOWED_IMAGE_TYPES: string[];
  ALLOWED_IMAGE_EXTENSIONS: string[];
}
