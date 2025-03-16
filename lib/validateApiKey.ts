import { NextResponse } from 'next/server';

export async function validateApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey) return false;

  try {
    // 调用Deepseek API进行验证
    const response = await fetch('https://api.deepseek.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      },
      // 添加CORS相关配置
      mode: 'cors',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Key validation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      return false;
    }

    return true;
  } catch (error: unknown) {
    console.error('API Key validation error:', {
      name: error instanceof Error ? error.name : 'Unknown Error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}

export function createErrorResponse(message: string, status: number = 401) {
  return NextResponse.json(
    { error: message },
    { status }
  );
}