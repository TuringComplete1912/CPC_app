"use client";

import { useState, useRef } from "react";
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Image as ImageIcon } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "开始编写内容...",
  disabled = false
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText =
      value.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      value.substring(end);

    onChange(newText);

    // 恢复光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        end + prefix.length
      );
    }, 0);
  };

  const toolbarButtons = [
    {
      icon: Bold,
      label: "粗体",
      action: () => insertMarkdown("**", "**")
    },
    {
      icon: Italic,
      label: "斜体",
      action: () => insertMarkdown("*", "*")
    },
    {
      icon: List,
      label: "无序列表",
      action: () => insertMarkdown("\n- ")
    },
    {
      icon: ListOrdered,
      label: "有序列表",
      action: () => insertMarkdown("\n1. ")
    },
    {
      icon: LinkIcon,
      label: "链接",
      action: () => insertMarkdown("[", "](url)")
    }
  ];

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* 工具栏 */}
      {!disabled && (
        <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
          {toolbarButtons.map((btn, idx) => (
            <button
              key={idx}
              type="button"
              onClick={btn.action}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              title={btn.label}
            >
              <btn.icon className="w-4 h-4 text-gray-600" />
            </button>
          ))}
        </div>
      )}

      {/* 编辑区域 */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full min-h-[300px] p-4 focus:outline-none resize-none disabled:bg-gray-50 disabled:text-gray-600"
        style={{ fontFamily: "inherit" }}
      />

      {/* 字数统计 */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 text-right">
        {value.length} 字符
      </div>
    </div>
  );
}
