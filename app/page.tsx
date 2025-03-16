'use client';

import { useState } from 'react';
import Image from 'next/image';
import ChatInterface from '@/components/ChatInterface';
import MindMapViewer from '@/components/MindMapViewer';

export default function Home() {
  const [currentMindmap, setCurrentMindmap] = useState('');

  const handleChatResponse = (response: string, mindmap: string) => {
    setCurrentMindmap(mindmap);
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-100">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">AI对话生成思维导图V1</h1>
      <main className="container mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[calc(100vh-3rem)] bg-white rounded-xl shadow-lg overflow-hidden transition-shadow duration-300 hover:shadow-xl border border-gray-100">
          <ChatInterface onResponse={handleChatResponse} />
        </div>
        <div className="h-[calc(100vh-3rem)] bg-white rounded-xl shadow-lg p-6 transition-shadow duration-300 hover:shadow-xl border border-gray-100">
          <MindMapViewer markdown={currentMindmap} />
        </div>
      </main>
      <footer className="mt-6 flex gap-6 flex-wrap items-center justify-center text-gray-600">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
