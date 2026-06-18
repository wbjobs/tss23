import { Router } from 'express';
import { callLogs, genId, models, templates, assertions } from '../data/store.js';
import type {
  CallLog,
  EvaluationResult,
  AssertionDetail,
  GatewayChatRequest,
} from '../../shared/types.js';
import { ConnectionPoolManager } from '../services/ConnectionPoolManager.js';
import {
  validateRequestPayload,
  validateImageBlocks,
  IMAGE_CONSTRAINTS,
} from '../services/ImageValidator.js';
import {
  GatewayError,
  GatewayErrorCode,
} from '../errors/GatewayError.js';

const router = Router();
const poolManager = ConnectionPoolManager.getInstance();

router.get('/pool-stats', (_req, res) => {
  res.json(poolManager.getAllStats());
});

router.get('/constraints', (_req, res) => {
  res.json(IMAGE_CONSTRAINTS);
});

function runAssertions(templateId: string, content: string): EvaluationResult | undefined {
  const tplAssertions = assertions.filter((a) => a.templateId === templateId && a.enabled);
  if (tplAssertions.length === 0) return undefined;

  const details: AssertionDetail[] = [];
  let totalScore = 0;
  let maxScore = 0;

  for (const rule of tplAssertions) {
    maxScore += rule.weight;
    let passed = false;
    let message: string | undefined;
    let score = 0;

    if (rule.type === 'keyword_contains') {
      const keywords = rule.config.keywords || [];
      passed = keywords.some((kw: string) => content.includes(kw));
      score = passed ? rule.weight : 0;
      if (!passed) message = `未包含关键词: ${keywords.join(', ')}`;
    } else if (rule.type === 'keyword_excludes') {
      const keywords = rule.config.keywords || [];
      passed = !keywords.some((kw: string) => content.includes(kw));
      score = passed ? rule.weight : 0;
      if (!passed) message = '包含禁用关键词';
    } else if (rule.type === 'json_schema') {
      try {
        JSON.parse(content);
        passed = true;
        score = rule.weight;
      } catch {
        passed = false;
        message = '输出不是有效的JSON';
      }
    } else if (rule.type === 'regex_match') {
      try {
        const re = new RegExp(rule.config.pattern);
        passed = re.test(content);
        score = passed ? rule.weight : 0;
      } catch {
        passed = false;
      }
    } else if (rule.type === 'sentiment') {
      passed = true;
      score = rule.weight;
    } else {
      passed = true;
      score = rule.weight;
    }

    totalScore += score;
    details.push({
      ruleId: rule.id,
      ruleName: rule.name,
      passed,
      score,
      message,
    });
  }

  const overallScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 100;
  return {
    id: genId(),
    callLogId: '',
    templateId,
    overallScore,
    passed: overallScore >= (tplAssertions[0]?.config.passThreshold || 60),
    assertions: details,
    createdAt: new Date().toISOString(),
  };
}

router.post('/chat', async (req, res) => {
  try {
    const body = req.body as GatewayChatRequest;

    validateRequestPayload(body);

    const model = models.find((m) => m.id === body.modelId);
    if (!model) {
      throw new GatewayError(GatewayErrorCode.MODEL_NOT_FOUND, `modelId=${body.modelId}`);
    }
    if (!model.enabled) {
      throw new GatewayError(GatewayErrorCode.MODEL_DISABLED, `模型"${model.name}"已禁用`);
    }

    const tpl = body.templateId ? templates.find((t) => t.id === body.templateId) : undefined;
    if (body.templateId && !tpl) {
      throw new GatewayError(GatewayErrorCode.TEMPLATE_NOT_FOUND, `templateId=${body.templateId}`);
    }

    const allBlocks = body.modalities || tpl?.blocks || [];
    const imageValidation = validateImageBlocks(allBlocks);
    if (!imageValidation.valid) {
      throw imageValidation.errors[0];
    }

    const requestId = genId();
    let poolSlot;

    try {
      poolSlot = await poolManager.getPool(body.modelId).acquire(requestId);
    } catch (err: any) {
      if (err.message?.startsWith('QUEUE_TIMEOUT:')) {
        throw new GatewayError(
          GatewayErrorCode.POOL_QUEUE_TIMEOUT,
          `模型"${model.name}"连接池已满且排队超时，当前并发过高，请稍后重试`
        );
      }
      throw new GatewayError(
        GatewayErrorCode.POOL_EXHAUSTED,
        `模型"${model.name}"连接池获取失败: ${err.message}`
      );
    }

    const startTime = Date.now();

    const mockResponses = [
      '这是模型生成的回复内容。根据您的请求，我已完成相关处理，输出结果如下所示。结果包含了详细的分析和建议，供您参考。',
      '{"sentiment":"positive","score":0.87,"keywords":["满意","推荐","高效"]}',
      '已完成分析。发现以下要点：1) 整体表现优异；2) 关键指标达标；3) 建议持续优化。详细内容请查看报告。',
      '感谢您的反馈。我们非常重视您的意见，已经记录并将尽快处理。解决方案：已为您安排专属跟进，预计24小时内有结果。如有其他问题，请随时联系。',
    ];
    const content = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    const latency = 500 + Math.floor(Math.random() * 3000);
    const promptTokens = 100 + Math.floor(Math.random() * 900);
    const completionTokens = 50 + Math.floor(Math.random() * 700);

    setTimeout(() => {
      try {
        poolManager.getPool(body.modelId).release(poolSlot);

        const evaluation = body.runEvaluation && body.templateId ? runAssertions(body.templateId, content) : undefined;

        const log: CallLog = {
          id: requestId,
          templateId: body.templateId,
          templateName: tpl?.name,
          modelId: body.modelId,
          modelProvider: model.provider,
          modelName: model.name,
          request: {
            prompt: tpl?.blocks.map((b) => (b.type === 'text' ? b.content : `[${b.type}]`)).join('\n') || '',
            modalities: body.modalities?.map((m) => m.type) || (tpl?.blocks.map((b) => b.type) || []),
            variables: body.variables || {},
            params: body.params || {},
          },
          response: {
            content,
            usage: {
              promptTokens,
              completionTokens,
              totalTokens: promptTokens + completionTokens,
            },
          },
          latencyMs: Date.now() - startTime,
          status: 'success',
          evaluation,
          calledBy: 'api-user',
          timestamp: new Date().toISOString(),
        };
        callLogs.unshift(log);

        if (evaluation) {
          evaluation.callLogId = log.id;
        }

        res.json({
          id: log.id,
          modelId: body.modelId,
          content,
          usage: log.response.usage,
          latencyMs: log.latencyMs,
          evaluation,
        });
      } catch (innerErr: any) {
        poolManager.getPool(body.modelId).release(poolSlot);
        res.status(500).json(new GatewayError(GatewayErrorCode.INTERNAL_ERROR, innerErr.message).toJSON());
      }
    }, 200);
  } catch (err: any) {
    if (err instanceof GatewayError) {
      res.status(err.httpStatus).json(err.toJSON());
    } else {
      console.error('[Gateway] 未处理错误:', err);
      res.status(500).json(new GatewayError(GatewayErrorCode.INTERNAL_ERROR, err.message).toJSON());
    }
  }
});

export default router;
