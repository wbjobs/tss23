const DEFAULT_MAX_SIZE_MB = 5;
const DEFAULT_MAX_DIMENSION = 2048;
const DEFAULT_QUALITY = 0.8;

export interface CompressResult {
  dataUrl: string;
  originalSizeMB: number;
  compressedSizeMB: number;
  width: number;
  height: number;
  wasCompressed: boolean;
}

export function validateImageFile(file: File, maxSizeMB: number = DEFAULT_MAX_SIZE_MB): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `不支持的图片格式: ${file.type}，仅支持: ${allowedTypes.join(', ')}`,
    };
  }

  const sizeMB = file.size / 1024 / 1024;
  if (sizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `图片大小${sizeMB.toFixed(1)}MB超出限制，最大允许${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

export function validateImageDataUrl(dataUrl: string, maxSizeMB: number = DEFAULT_MAX_SIZE_MB): { valid: boolean; error?: string } {
  if (!dataUrl.startsWith('data:image/')) {
    return { valid: false, error: '仅支持data:image/*格式的Data URL' };
  }

  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) {
    return { valid: false, error: '无效的Data URL格式' };
  }

  const base64Part = dataUrl.substring(commaIdx + 1);
  const padding = (base64Part.match(/=/g) || []).length;
  const sizeBytes = Math.floor((base64Part.length * 3) / 4) - padding;
  const sizeMB = sizeBytes / 1024 / 1024;

  if (sizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `图片大小${sizeMB.toFixed(1)}MB超出限制，最大允许${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

export function compressImage(
  file: File,
  options: {
    maxSizeMB?: number;
    maxDimension?: number;
    quality?: number;
  } = {}
): Promise<CompressResult> {
  const {
    maxSizeMB = DEFAULT_MAX_SIZE_MB,
    maxDimension = DEFAULT_MAX_DIMENSION,
    quality = DEFAULT_QUALITY,
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const originalSizeMB = file.size / 1024 / 1024;
        let targetWidth = img.width;
        let targetHeight = img.height;

        if (targetWidth > maxDimension || targetHeight > maxDimension) {
          const ratio = Math.min(maxDimension / targetWidth, maxDimension / targetHeight);
          targetWidth = Math.round(targetWidth * ratio);
          targetHeight = Math.round(targetHeight * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建Canvas上下文'));
          return;
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        let currentQuality = quality;
        let dataUrl = canvas.toDataURL('image/jpeg', currentQuality);

        const getSizeMB = (d: string) => {
          const comma = d.indexOf(',');
          if (comma === -1) return 0;
          const b64 = d.substring(comma + 1);
          const pad = (b64.match(/=/g) || []).length;
          return (Math.floor((b64.length * 3) / 4) - pad) / 1024 / 1024;
        };

        let compressedSizeMB = getSizeMB(dataUrl);
        let attempts = 0;

        while (compressedSizeMB > maxSizeMB && currentQuality > 0.1 && attempts < 5) {
          currentQuality -= 0.15;
          dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
          compressedSizeMB = getSizeMB(dataUrl);
          attempts++;
        }

        if (compressedSizeMB > maxSizeMB) {
          if (targetWidth > 512) {
            const scale = Math.sqrt(maxSizeMB / compressedSizeMB);
            targetWidth = Math.round(targetWidth * scale);
            targetHeight = Math.round(targetHeight * scale);
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            dataUrl = canvas.toDataURL('image/jpeg', 0.6);
            compressedSizeMB = getSizeMB(dataUrl);
          }
        }

        if (compressedSizeMB > maxSizeMB) {
          reject(
            new Error(
              `图片压缩后仍有${compressedSizeMB.toFixed(1)}MB，超出${maxSizeMB}MB限制。请使用更小的图片。`
            )
          );
          return;
        }

        resolve({
          dataUrl,
          originalSizeMB,
          compressedSizeMB,
          width: targetWidth,
          height: targetHeight,
          wasCompressed: originalSizeMB > compressedSizeMB || img.width !== targetWidth,
        });
      };

      img.onerror = () => {
        reject(new Error('图片加载失败，请确认文件是有效的图片'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    reader.readAsDataURL(file);
  });
}

export function formatFileSize(mb: number): string {
  if (mb < 1) return `${Math.round(mb * 1024)}KB`;
  return `${mb.toFixed(1)}MB`;
}
