"use client";

import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { FileItem } from "@/lib/filesystem";

interface CodeEditorProps {
  file: FileItem | null;
  onChange: (content: string) => void;
}

export function CodeEditor({ file, onChange }: CodeEditorProps) {
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (editorRef.current && file) {
      // Update editor content when file changes
      const model = editorRef.current.getModel();
      if (model && model.getValue() !== file.content) {
        model.setValue(file.content);
      }
    }
  }, [file]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      fontFamily: '"Geist Mono", "Fira Code", ui-monospace, Menlo, monospace',
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      padding: { top: 16 },
      lineNumbers: "on",
      renderLineHighlight: "all",
      theme: "vs-dark",
    });
  };

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center bg-zinc-950 text-zinc-500">
        <div className="text-center">
          <p className="text-lg mb-2">No file selected</p>
          <p className="text-sm">Select or create a file from the explorer</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      <div className="flex items-center px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <span className="text-sm text-zinc-300">{file.name}</span>
        {file.content !== file.content && (
          <span className="ml-2 text-zinc-500">●</span>
        )}
      </div>
      <div className="flex-1 relative min-h-0">
        <div className="absolute inset-0">
        <Editor
          height="100%"
          language="c"
          value={file.content}
          onChange={handleChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            selectOnLineNumbers: true,
            matchBrackets: "always",
            autoIndent: "full",
            tabSize: 4,
            insertSpaces: true,
            detectIndentation: true,
            trimAutoWhitespace: true,
            formatOnPaste: true,
            formatOnType: true,
          }}
          loading={
            <div className="flex items-center justify-center h-full text-zinc-500">
              Loading editor...
            </div>
          }
        />
        </div>
      </div>
    </div>
  );
}
