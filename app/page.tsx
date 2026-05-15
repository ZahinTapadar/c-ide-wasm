"use client";

import { useState, useCallback, useRef } from "react";
import { FileExplorer } from "@/components/FileExplorer";
import { CodeEditor } from "@/components/CodeEditor";
import { OutputTerminal, type TerminalHandle } from "@/components/OutputTerminal";
import { FileItem, initialFiles } from "@/lib/filesystem";
import { compileAndRun } from "@/lib/compiler";
import { Button } from "@/components/ui/button";
import { Play, Square, Trash2, Terminal, FileCode2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function CIDE() {
  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(initialFiles[0].id);
  const [isRunning, setIsRunning] = useState(false);
  const terminalRef = useRef<TerminalHandle>(null);

  const selectedFile = files.find((f) => f.id === selectedFileId) ?? null;

  const handleSelectFile = useCallback((file: FileItem) => {
    setSelectedFileId(file.id);
  }, []);

  const handleAddFile = useCallback((file: FileItem) => {
    setFiles((prev) => [...prev, file]);
    setSelectedFileId(file.id);
  }, []);

  const handleDeleteFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setSelectedFileId((prev) => (prev === fileId ? null : prev));
  }, []);

  const handleFileChange = useCallback((content: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === selectedFileId ? { ...f, content } : f))
    );
  }, [selectedFileId]);

  const handleRun = async () => {
    if (!selectedFile || isRunning) return;

    const term = terminalRef.current;
    if (!term) return;

    term.clear();
    setIsRunning(true);

    const stdin = term.getStdinBuffer() || undefined;
    term.resetStdinBuffer();

    try {
      await compileAndRun(
        selectedFile.content,
        (chunk) => {
          switch (chunk.kind) {
            case "info":   term.writeInfo(chunk.text); break;
            case "stdout": term.writeStdout(chunk.text); break;
            case "stderr": term.writeStderr(chunk.text); break;
            case "error":  term.writeError(chunk.text); break;
          }
        },
        stdin
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-zinc-950 overflow-hidden">
      {/* ── Top bar ───────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 h-11 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <FileCode2 className="h-4 w-4 text-sky-400" />
          <span className="text-sm font-semibold text-zinc-100 tracking-tight">C IDE</span>
          <Separator orientation="vertical" className="h-5 bg-zinc-700" />
          <span className="text-xs text-zinc-500">WebAssembly · Clang</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-zinc-400 hover:text-zinc-100 gap-1"
            onClick={() => terminalRef.current?.clear()}
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </Button>

          {isRunning ? (
            <Button
              size="sm"
              className="h-7 text-xs bg-red-700 hover:bg-red-800 text-white gap-1"
              onClick={() => setIsRunning(false)}
            >
              <Square className="h-3 w-3" />
              Stop
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              onClick={handleRun}
              disabled={!selectedFile}
            >
              <Play className="h-3 w-3" />
              Run
            </Button>
          )}
        </div>
      </header>

      {/* ── Main area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* File explorer */}
        <div className="w-56 flex-shrink-0 border-r border-zinc-800">
          <FileExplorer
            files={files}
            selectedFile={selectedFileId}
            onSelectFile={handleSelectFile}
            onAddFile={handleAddFile}
            onDeleteFile={handleDeleteFile}
          />
        </div>

        {/* Editor (left 55%) + Terminal (right 45%) */}
        <div className="flex-1 flex min-w-0 overflow-hidden">
          {/* Monaco editor */}
          <div className="flex-1 min-w-0 border-r border-zinc-800 flex flex-col">
            <CodeEditor file={selectedFile} onChange={handleFileChange} />
          </div>

          {/* Terminal — always visible, full height */}
          <div className="w-[45%] flex-shrink-0 flex flex-col">
            <OutputTerminal ref={terminalRef} isRunning={isRunning} />
          </div>
        </div>
      </div>

      {/* ── Status bar ────────────────────────────────────────────── */}
      <footer className="flex-shrink-0 flex items-center justify-between px-4 h-6 bg-zinc-900 border-t border-zinc-800 text-[11px] text-zinc-500">
        <div className="flex items-center gap-4">
          {selectedFile ? (
            <>
              <span className="text-zinc-400">{selectedFile.name}</span>
              <span>UTF-8</span>
            </>
          ) : (
            <span>No file selected</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Terminal className="h-3 w-3" />
          <span>Clang · WASI · wasm32</span>
        </div>
      </footer>
    </div>
  );
}
