import https from 'https';
import http from 'http';
import { GatewayError, GatewayErrorCode } from '../errors/GatewayError.js';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_PAYLOAD_BYTES = 20 * 1024 * 1024;
const MAX_BASE64_SIZE_BYTES = 6 * 1024 * 1024;
const IMAGE_FETCH_TIMEOUT_MS = 15000;

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);

const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']);

function isDataUrl(str: string): boolean {
  return str.startsWith('data:');
}

function isBaseUrl(str: string): boolean {
  return str.startsWith('http://') || str.startsWith('https://');
}

function getDataUrlSize(dataUrl: string): number {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) return 0;
  const base64Part = dataUrl.substring(commaIdx + 1);
  const padding = (base64Part.match(/=/g) || []).length;
  return Math.floor((base64Part.length * 3) / 4) - padding;
}

function getExtensionFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const ext = pathname.substring(pathname.lastIndexOf('.')).toLowerCase().split('?')[0];
    return ext;
  } catch {
    return '';
  }
}

export function validateImageDataUrl(dataUrl: string): { valid: boolean; sizeBytes: number; error?: GatewayError } {
  if (!isDataUrl(dataUrl)) {
    return { valid: false, sizeBytes: 0, error: new GatewayError(GatewayErrorCode.IMAGE_ENCODING_FAILED, '无效的Data URL格式') };
  }

  const mimeMatch = dataUrl.match(/^data:([^;]+);/);
  if (!mimeMatch || !ALLOWED_IMAGE_TYPES.has(mimeMatch[1])) {
    return {
      valid: false,
      sizeBytes: 0,
      error: new GatewayError(
        GatewayErrorCode.IMAGE_ENCODING_FAILED,
        `不支持的图片MIME类型: ${mimeMatch?.[1] || 'unknown'}，仅支持: ${Array.from(ALLOWED_IMAGE_TYPES).join(', ')}`
      ),
    };
  }

  const sizeBytes = getDataUrlSize(dataUrl);
  if (sizeBytes > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      sizeBytes,
      error: new GatewayError(
        GatewayErrorCode.IMAGE_TOO_LARGE,
        `图片大小${(sizeBytes / 1024 / 1024).toFixed(1)}MB超出限制，最大允许${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB`
      ),
    };
  }

  return { valid: true, sizeBytes };
}

export function validateImageUrl(url: string): { valid: boolean; error?: GatewayError } {
  if (!isBaseUrl(url)) {
    return { valid: false, error: new GatewayError(GatewayErrorCode.IMAGE_FETCH_FAILED, '无效的图片URL格式') };
  }

  const ext = getExtensionFromUrl(url);
  if (ext && !ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: new GatewayError(
        GatewayErrorCode.IMAGE_FETCH_FAILED,
        `不支持的图片格式: ${ext}，仅支持: ${Array.from(ALLOWED_IMAGE_EXTENSIONS).join(', ')}`
      ),
    };
  }

  return { valid: true };
}

export async function fetchAndValidateImage(url: string): Promise<{ base64: string; mimeType: string; sizeBytes: number }> {
  const urlValidation = validateImageUrl(url);
  if (!urlValidation.valid) throw urlValidation.error!;

  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, { timeout: IMAGE_FETCH_TIMEOUT_MS }, (res) => {
      if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
        reject(new GatewayError(GatewayErrorCode.IMAGE_FETCH_FAILED, `HTTP ${res.statusCode}`));
        return;
      }

      const contentType = res.headers['content-type'] || '';
      if (!ALLOWED_IMAGE_TYPES.has(contentType.split(';')[0])) {
        res.resume();
        reject(
          new GatewayError(
            GatewayErrorCode.IMAGE_FETCH_FAILED,
            `响应Content-Type不支持: ${contentType}`
          )
        );
        return;
      }

      const chunks: Buffer[] = [];
      let totalSize = 0;

      res.on('data', (chunk: Buffer) => {
        totalSize += chunk.length;
        if (totalSize > MAX_IMAGE_SIZE_BYTES) {
          res.destroy();
          reject(
            new GatewayError(
              GatewayErrorCode.IMAGE_TOO_LARGE,
              `远程图片大小超出${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB限制，当前已下载${(totalSize / 1024 / 1024).toFixed(1)}MB`
            )
          );
          return;
        }
        chunks.push(chunk);
      });

      res.on('end', () => {
        if (totalSize > MAX_IMAGE_SIZE_BYTES) {
          reject(new GatewayError(GatewayErrorCode.IMAGE_TOO_LARGE));
          return;
        }
        const buffer = Buffer.concat(chunks);
        const base64 = buffer.toString('base64');
        if (base64.length > MAX_BASE64_SIZE_BYTES) {
          reject(
            new GatewayError(
              GatewayErrorCode.IMAGE_TOO_LARGE,
              `Base64编码后大小${(base64.length / 1024 / 1024).toFixed(1)}MB超出限制`
            )
          );
          return;
        }
        resolve({
          base64,
          mimeType: contentType.split(';')[0],
          sizeBytes: totalSize,
        });
      });

      res.on('error', (err) => {
        reject(new GatewayError(GatewayErrorCode.IMAGE_FETCH_FAILED, err.message));
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new GatewayError(GatewayErrorCode.IMAGE_FETCH_FAILED, `下载超时(${IMAGE_FETCH_TIMEOUT_MS}ms)`));
    });

    req.on('error', (err) => {
      reject(new GatewayError(GatewayErrorCode.IMAGE_FETCH_FAILED, err.message));
    });
  });
}

export function validateRequestPayload(body: any): void {
  const bodyStr = JSON.stringify(body);
  if (bodyStr.length > MAX_TOTAL_PAYLOAD_BYTES) {
    throw new GatewayError(
      GatewayErrorCode.PAYLOAD_TOO_LARGE,
      `请求体大小${(bodyStr.length / 1024 / 1024).toFixed(1)}MB超出${MAX_TOTAL_PAYLOAD_BYTES / 1024 / 1024}MB限制`
    );
  }
}

export function validateImageBlocks(blocks: any[]): { valid: boolean; errors: GatewayError[] } {
  const errors: GatewayError[] = [];

  for (const block of blocks) {
    if (block.type === 'image') {
      if (block.url && isDataUrl(block.url)) {
        const result = validateImageDataUrl(block.url);
        if (!result.valid && result.error) {
          errors.push(result.error);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export const IMAGE_CONSTRAINTS = {
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGE_SIZE_MB: MAX_IMAGE_SIZE_BYTES / 1024 / 1024,
  MAX_TOTAL_PAYLOAD_BYTES,
  MAX_TOTAL_PAYLOAD_MB: MAX_TOTAL_PAYLOAD_BYTES / 1024 / 1024,
  ALLOWED_IMAGE_TYPES: Array.from(ALLOWED_IMAGE_TYPES),
  ALLOWED_IMAGE_EXTENSIONS: Array.from(ALLOWED_IMAGE_EXTENSIONS),
};
