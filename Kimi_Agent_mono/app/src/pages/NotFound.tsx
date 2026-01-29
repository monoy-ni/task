import React from 'react';
import { Link } from 'react-router';

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">页面未找到</h2>
      <p className="text-gray-600 mb-8">抱歉，您访问的页面不存在</p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-3 hover:bg-gray-800 transition-colors text-sm tracking-wider"
      >
        返回首页
      </Link>
    </div>
  );
}
