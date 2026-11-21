import crypto from 'crypto';
import fs from 'fs';
import {
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME,
} from '../config/index.ts';

export interface CloudinaryTestResult {
  configured: boolean;
  connected: boolean;
  cloudName: string;
  error?: string;
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    CLOUDINARY_CLOUD_NAME.trim() &&
    CLOUDINARY_API_KEY.trim() &&
    CLOUDINARY_API_SECRET.trim()
  );
}

export async function testCloudinaryConnection(): Promise<CloudinaryTestResult> {
  const cleanCloudName = CLOUDINARY_CLOUD_NAME.trim();
  if (!cleanCloudName || !CLOUDINARY_API_KEY.trim() || !CLOUDINARY_API_SECRET.trim()) {
    return {
      configured: false,
      connected: false,
      cloudName: cleanCloudName,
      error: 'Cloudinary credentials missing in .env',
    };
  }

  try {
    const auth = Buffer.from(`${CLOUDINARY_API_KEY.trim()}:${CLOUDINARY_API_SECRET.trim()}`).toString('base64');
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cleanCloudName)}/resources/image?max_results=1`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } };

    if (res.ok) {
      return {
        configured: true,
        connected: true,
        cloudName: cleanCloudName,
      };
    }

    return {
      configured: true,
      connected: false,
      cloudName: cleanCloudName,
      error: data.error?.message || `Authentication failed (${res.status})`,
    };
  } catch (err) {
    return {
      configured: true,
      connected: false,
      cloudName: cleanCloudName,
      error: err instanceof Error ? err.message : 'Connection failed',
    };
  }
}

export async function uploadSingleFileToCloudinary(
  filePath: string,
  originalName: string
): Promise<string> {
  const cleanCloudName = CLOUDINARY_CLOUD_NAME.trim();
  const cleanKey = CLOUDINARY_API_KEY.trim();
  const cleanSecret = CLOUDINARY_API_SECRET.trim();

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'wonder-cars/gallery';

  // Signature calculation: params sorted alphabetically + secret
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${cleanSecret}`;
  const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer]);

  const formData = new FormData();
  formData.append('file', blob, originalName);
  formData.append('api_key', cleanKey);
  formData.append('timestamp', String(timestamp));
  formData.append('folder', folder);
  formData.append('signature', signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cleanCloudName)}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = (await res.json().catch(() => ({}))) as {
    secure_url?: string;
    url?: string;
    error?: { message?: string };
  };

  if (!res.ok || (!data.secure_url && !data.url)) {
    throw new Error(data.error?.message || `Cloudinary upload failed (${res.status})`);
  }

  return data.secure_url || data.url!;
}
