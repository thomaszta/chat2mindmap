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
      },
    });

    return response.ok;
  } catch (error) {
    console.error('API Key validation error:', error);
    return false;
  }
}

export function createErrorResponse(message: string, status: number = 401) {
  return NextResponse.json(
    { error: message },
    { status }
  );
}