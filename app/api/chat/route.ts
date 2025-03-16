import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ChatResponse {
  response: string;
  mindmap: string;
}

// 从对话内容中提取思维导图结构
function generateMindMap(conversation: string): string {
  // 尝试从对话内容中提取已有的思维导图结构
  const lines = conversation.split('\n');
  let mindmapContent = [];
  let isInMindmap = false;
  let hasValidStructure = false;
  
  for (const line of lines) {
    if (line.startsWith('#')) {
      isInMindmap = true;
      mindmapContent.push(line);
      // 检查是否包含"对话分析"标题
      if (line.trim() === '# 对话分析') {
        hasValidStructure = true;
      }
    } else if (isInMindmap && line.trim() !== '') {
      mindmapContent.push(line);
    } else if (isInMindmap && line.trim() === '') {
      // 只有当遇到空行且已经收集了足够的内容时才结束
      if (mindmapContent.length > 5) {
        break;
      }
      isInMindmap = false;
      mindmapContent = [];
    }
  }
  
  // 只有当找到有效的思维导图结构时才返回
  if (hasValidStructure && mindmapContent.length > 0) {
    return mindmapContent.join('\n');
  }

  // 如果没有找到思维导图结构，直接返回原始对话内容
  return conversation;
}

// 保存对话记录和思维导图
async function saveData(conversation: string, mindmap: string) {
  const timestamp = Date.now();
  const conversationPath = path.join(process.cwd(), 'data', 'conversations', `${timestamp}.txt`);
  const mindmapPath = path.join(process.cwd(), 'data', 'mindmaps', `${timestamp}.md`);

  // 确保目录存在
  fs.mkdirSync(path.join(process.cwd(), 'data', 'conversations'), { recursive: true });
  fs.mkdirSync(path.join(process.cwd(), 'data', 'mindmaps'), { recursive: true });

  // 保存文件
  await fs.promises.writeFile(conversationPath, conversation);
  await fs.promises.writeFile(mindmapPath, mindmap);

  return { conversationPath, mindmapPath };
}

import { validateApiKey, createErrorResponse } from '@/lib/validateApiKey';

export async function POST(request: NextRequest) {
  try {
    const { message, apiKey } = await request.json();

    // 验证API Key
    const isValidApiKey = await validateApiKey(apiKey);
    if (!isValidApiKey) {
      return createErrorResponse('无效的API Key，请提供有效的API Key');
    }

    // 调用Deepseek API获取回复
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { 
            role: 'system', 
            content: '你是一个专业的知识结构化助手，擅长将用户输入的内容或主题转化为清晰的思维导图结构。你的主要任务是：\n1. 深入分析用户输入的内容，提取核心主题和关键信息\n2. 根据主题特点，灵活组织一级标题结构，确保完整覆盖用户输入的信息\n3. 对用户未提及但与主题密切相关的内容进行适当补充\n4. 将信息组织成层次分明的结构，确保各层级之间逻辑关联清晰\n5. 使用简洁的语言表达每个节点的内容\n\n你的回复必须严格按照以下Markdown格式生成思维导图：\n\n# [核心主题]\n## [根据主题特点设置一级标题1]\n### [子主题1.1]\n#### [详细内容1.1.1]\n### [子主题1.2]\n## [根据主题特点设置一级标题2]\n### [子主题2.1]\n### [子主题2.2]\n\n注意事项：\n1. 一级标题结构要根据主题特点灵活设置，不要使用固定模板\n2. 确保完整保留用户输入的重要信息和知识点\n3. 适当补充用户未提及但相关的重要内容\n4. 每个节点使用简洁的短语或关键词\n5. 层级不超过4层\n6. 同级节点数量保持在2-5个\n7. 确保节点间的逻辑关系清晰\n8. 避免重复信息\n\n直接输出思维导图结构，无需其他额外的对话内容。' 
          },
          { role: 'user', content: message }
        ],
        temperature: 0.8,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      throw new Error('API调用失败');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // 生成思维导图
    const mindmap = generateMindMap(aiResponse);

    // 保存对话记录和思维导图
    await saveData(message + '\n' + aiResponse, mindmap);

    return NextResponse.json({
      response: aiResponse,
      mindmap: mindmap
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return createErrorResponse('处理请求时发生错误', 500);
  }
}