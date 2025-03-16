'use client';

import { useState, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  onResponse: (response: string, mindmap: string) => void;
}

export default function ChatInterface({ onResponse }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [apiKeyError, setApiKeyError] = useState('');
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    const savedApiKey = localStorage.getItem('deepseek_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      validateSavedApiKey(savedApiKey);
    } else {
      setApiKeyError('请提供有效的API Key以继续使用');
      setIsApiKeyVisible(true);
    }
  }, []);

  const validateSavedApiKey = async (key: string) => {
    setIsValidatingKey(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '', apiKey: key }),
      });

      if (!response.ok) {
        const data = await response.json();
        setApiKeyError(data.error || '无效的API Key');
        setIsApiKeyVisible(true);
      } else {
        setApiKeyError('');
      }
    } catch (error) {
      setApiKeyError('验证API Key时发生错误');
      setIsApiKeyVisible(true);
    } finally {
      setIsValidatingKey(false);
    }
  };

  const handleApiKeySave = async () => {
    if (!apiKey.trim()) {
      setApiKeyError('请输入API Key');
      return;
    }

    setIsValidatingKey(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '', apiKey }),
      });

      if (!response.ok) {
        const data = await response.json();
        setApiKeyError(data.error || '无效的API Key');
      } else {
        localStorage.setItem('deepseek_api_key', apiKey);
        setApiKeyError('');
        setIsApiKeyVisible(false);
      }
    } catch (error) {
      setApiKeyError('验证API Key时发生错误');
    } finally {
      setIsValidatingKey(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
      setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 100);
    }

    try {
      if (!apiKey) {
        throw new Error('请先设置API Key');
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, apiKey }),
      });

      if (!response.ok) throw new Error('请求失败');

      const data = await response.json();
      const assistantMessage: Message = { role: 'assistant', content: data.response };
      setMessages(prev => [...prev, assistantMessage]);
      
      // 更新思维导图和对话内容
      if (data.mindmap) {
        // 使用服务器生成的思维导图
        onResponse(data.response, data.mindmap);
      } else {
        // 如果没有思维导图数据，使用原始响应
        onResponse(data.response, data.response);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = { role: 'assistant', content: '抱歉，处理您的请求时发生错误。' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="absolute top-4 left-4 z-10">
        {isApiKeyVisible ? (
          <div className="flex flex-col gap-2 bg-white p-4 rounded-lg shadow-md border border-gray-200">
            <div className="flex gap-2 items-center">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="输入Deepseek API Key"
                className="p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1"
              />
              <button
                onClick={handleApiKeySave}
                disabled={isValidatingKey}
                className={`px-3 py-2 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${isValidatingKey ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {isValidatingKey ? '验证中...' : '保存'}
              </button>
            </div>
            {apiKeyError && (
              <div className="text-red-500 text-sm">{apiKeyError}</div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setIsApiKeyVisible(true)}
            className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            设置API Key
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 px-2 pb-4 mt-16" id="chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-4 rounded-2xl max-w-[80%] leading-relaxed text-[15px] mb-4 ${message.role === 'user' ? 'ml-auto bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-800'}`}
          >
            {message.content}
          </div>
        ))}
        {isThinking && (
          <div className="flex items-center gap-2 text-gray-600 p-4">
            <span>AI思考中</span>
            <span className="inline-flex">
              <span className="animate-[bounce_1s_ease-in-out_infinite]" style={{ animationDelay: '0s' }}>.</span>
              <span className="animate-[bounce_1s_ease-in-out_infinite]" style={{ animationDelay: '0.2s' }}>.</span>
              <span className="animate-[bounce_1s_ease-in-out_infinite]" style={{ animationDelay: '0.4s' }}>.</span>
            </span>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="sticky bottom-0 flex gap-3 bg-white p-4 border-t border-gray-100">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入您的问题..."
          className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder:text-gray-400 text-[15px]"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium text-[15px] shadow-sm"
        >
          发送
        </button>
      </form>
    </div>
  );
}