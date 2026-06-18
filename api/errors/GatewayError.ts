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

export const GatewayErrorMessages: Record<GatewayErrorCode, { message: string; httpStatus: number }> = {
  [GatewayErrorCode.MODEL_NOT_FOUND]: {
    message: '指定的模型不存在，请检查modelId参数',
    httpStatus: 404,
  },
  [GatewayErrorCode.MODEL_DISABLED]: {
    message: '该模型已被禁用，请联系管理员启用或选择其他模型',
    httpStatus: 403,
  },
  [GatewayErrorCode.POOL_EXHAUSTED]: {
    message: '模型连接池已耗尽，请求已进入排队等待，请稍后重试',
    httpStatus: 503,
  },
  [GatewayErrorCode.POOL_QUEUE_TIMEOUT]: {
    message: '请求在队列中等待超时，模型当前负载过高，请稍后重试',
    httpStatus: 504,
  },
  [GatewayErrorCode.IMAGE_TOO_LARGE]: {
    message: '图片大小超出限制，单张图片不得超过5MB',
    httpStatus: 413,
  },
  [GatewayErrorCode.IMAGE_FETCH_FAILED]: {
    message: '图片下载失败，请检查URL是否可访问',
    httpStatus: 400,
  },
  [GatewayErrorCode.IMAGE_ENCODING_FAILED]: {
    message: '图片Base64编码失败，请确认图片格式有效',
    httpStatus: 400,
  },
  [GatewayErrorCode.PAYLOAD_TOO_LARGE]: {
    message: '请求体过大，总大小不得超过20MB',
    httpStatus: 413,
  },
  [GatewayErrorCode.TEMPLATE_NOT_FOUND]: {
    message: '指定的Prompt模板不存在',
    httpStatus: 404,
  },
  [GatewayErrorCode.INTERNAL_ERROR]: {
    message: '网关内部错误',
    httpStatus: 500,
  },
};

export class GatewayError extends Error {
  code: GatewayErrorCode;
  httpStatus: number;
  detail?: string;

  constructor(code: GatewayErrorCode, detail?: string) {
    const info = GatewayErrorMessages[code];
    super(info.message);
    this.code = code;
    this.httpStatus = info.httpStatus;
    this.detail = detail;
    this.name = 'GatewayError';
  }

  toJSON() {
    return {
      success: false,
      code: this.code,
      message: this.message,
      detail: this.detail,
    };
  }
}
