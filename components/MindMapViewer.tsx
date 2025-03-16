'use client';

import { useEffect, useRef, useState } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import html2canvas from 'html2canvas';

interface MindMapViewerProps {
  markdown: string;
}

const transformer = new Transformer();

export default function MindMapViewer({ markdown }: MindMapViewerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!svgRef.current || !markdown) return;

    // 清除现有内容
    svgRef.current.innerHTML = '';

    // 转换markdown为思维导图数据
    const { root } = transformer.transform(markdown);

    // 创建思维导图
    Markmap.create(svgRef.current, undefined, root);
  }, [markdown]);

  const handleDownload = async () => {
    if (!containerRef.current || !svgRef.current) {
      console.error('容器或SVG元素未找到');
      return;
    }

    if (isDownloading) {
      console.log('正在处理下载，请稍候...');
      return;
    }

    try {
      setIsDownloading(true);
      console.log('开始导出思维导图...');
      
      const svgElement = svgRef.current;
      
      // 获取SVG的实际尺寸和视图框
      const svgRect = svgElement.getBoundingClientRect();
      const viewBox = svgElement.viewBox.baseVal || {
        width: svgRect.width,
        height: svgRect.height
      };
      
      // 计算最佳尺寸，保持宽高比
      const aspectRatio = viewBox.width / viewBox.height;
      const maxWidth = 3840; // 4K分辨率
      const maxHeight = 2160;
      
      let width = svgRect.width;
      let height = svgRect.height;
      
      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }
      
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
      
      // 克隆SVG元素并应用所有样式
      const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
      const styles = document.querySelectorAll('style');
      styles.forEach(style => {
        if (style.textContent?.includes('.markmap')) {
          const styleClone = style.cloneNode(true);
          svgClone.insertBefore(styleClone, svgClone.firstChild);
        }
      });

      // 设置SVG的尺寸和视口
      svgClone.setAttribute('width', width.toString());
      svgClone.setAttribute('height', height.toString());
      
      // 将SVG转换为Base64编码的数据URL
      const svgData = new XMLSerializer().serializeToString(svgClone);
      const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
      const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;

      // 创建Image对象并加载SVG
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('加载SVG图像失败'));
        img.src = dataUrl;
      });

      // 创建canvas，使用优化后的尺寸
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        throw new Error('无法获取canvas上下文');
      }

      // 设置canvas尺寸，使用优化后的尺寸和缩放
      const scale = 2; // 提高清晰度
      canvas.width = width * scale;
      canvas.height = height * scale;
      
      // 设置更好的图像平滑选项
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // 应用缩放并保持清晰度
      ctx.scale(scale, scale);

      // 绘制白色背景
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // 绘制SVG，确保填满画布并保持宽高比
      ctx.drawImage(img, 0, 0, width, height);

      // 使用toDataURL生成PNG数据，设置最高质量
      const pngDataUrl = canvas.toDataURL('image/png', 1.0);
      
      // 创建下载链接
      const link = document.createElement('a');
      link.download = 'mindmap.png';
      link.href = pngDataUrl;
      link.click();
      
      // 清理资源
      URL.revokeObjectURL(dataUrl);

      console.log('下载已触发');
    } catch (error) {
      console.error('导出思维导图失败:', error);
      if (error instanceof Error) {
        console.error('错误详情:', error.message);
        console.error('错误堆栈:', error.stack);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex-1 border rounded-lg overflow-hidden bg-white relative" ref={containerRef}>
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className={`absolute top-6 right-6 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200 text-sm font-medium flex items-center gap-2 ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {isDownloading ? '正在导出...' : '导出PNG'}
        </button>
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ minHeight: '300px' }}
        />
      </div>
      <div className="h-[200px] border rounded-lg p-4 overflow-auto bg-gray-50">
        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
          {markdown || '等待生成思维导图...'}
        </pre>
      </div>
    </div>
  );
}