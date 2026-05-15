"use client";

import { useState, useCallback } from "react";
import { FileExplorer } from "@/components/FileExplorer";
import { CodeEditor } from "@/components/CodeEditor";
import { OutputTerminal } from "@/components/OutputTerminal";
import { FileItem, initialFiles } from "@/lib/filesystem";
import { cCompiler, executeCCode } from "@/lib/compiler";
import { Button } from "@/components/ui/button";
import { Play, Square, Save, FileCode } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function CIDE() {
  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(initialFiles[0].id);
  const [output, setOutput] = useState("");
  const [errors, setErrors] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const selectedFile = files.find((f) => f.id === selectedFileId) || null;

  const handleSelectFile = useCallback((file: FileItem) => {
    setSelectedFileId(file.id);
  }, []);

  const handleAddFile = useCallback((file: FileItem) => {
    setFiles((prev) => [...prev, file]);
    setSelectedFileId(file.id);
  }, []);

  const handleDeleteFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    if (selectedFileId === fileId) {
      setSelectedFileId(null);
    }
  }, [selectedFileId]);

  const handleFileChange = useCallback((content: string) => {
    if (!selectedFileId) return;
    
    setFiles((prev) =>
      prev.map((f) =>
        f.id === selectedFileId ? { ...f, content } : f
      )
    );
  }, [selectedFileId]);

  const handleCompile = async () => {
    if (!selectedFile) return;

    setOutput("");
    setErrors("");
    setIsRunning(true);

    try {
      // Compile the code
      const compileResult = await cCompiler.compile(selectedFile.content, selectedFile.name);
      
      if (!compileResult.success) {
        setErrors(compileResult.error || "Compilation failed");
        setOutput("Compilation failed.");
        setIsRunning(false);
        return;
      }

      setOutput("Compilation successful.\n\nRunning program...\n");

      // Execute the code
      const runResult = await executeCCode(selectedFile.content);
      
      setOutput((prev) => prev + "\n" + runResult.stdout);
      if (runResult.stderr) {
        setErrors(runResult.stderr);
      }
    } catch (error) {
      setErrors(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setOutput((prev) => prev + "\n[Program stopped]");
  };

  return (
    <div className="h-screen flex flex-col bg-zinc-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-blue-400" />
            <span className="font-semibold text-zinc-100">C IDE</span>
          </div>
          <Separator orientation="vertical" className="h-6 bg-zinc-800" />
          <span className="text-xs text-zinc-500">
            WebAssembly C Compiler
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            onClick={() => {
              // Save functionality - in real app, this would persist to storage
              console.log("Saving files...");
            }}
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            Save
          </Button>

          {isRunning ? (
            <Button
              variant="destructive"
              size="sm"
              className="h-8 text-xs"
              onClick={handleStop}
            >
              <Square className="h-3.5 w-3.5 mr-1" />
              Stop
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="h-8 text-xs bg-green-600 hover:bg-green-700"
              onClick={handleCompile}
              disabled={!selectedFile}
            >
              <Play className="h-3.5 w-3.5 mr-1" />
              Run
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        <div className="w-64 flex-shrink-0">
          <FileExplorer
            files={files}
            selectedFile={selectedFileId}
            onSelectFile={handleSelectFile}
            onAddFile={handleAddFile}
            onDeleteFile={handleDeleteFile}
          />
        </div>

        {/* Editor and Terminal */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Code Editor */}
          <div className="flex-1 min-h-0">
            <CodeEditor
              file={selectedFile}
              onChange={handleFileChange}
            />
          </div>

          {/* Output Terminal */}
          <div className="h-48 border-t border-zinc-800">
            <OutputTerminal
              output={output}
              errors={errors}
              isRunning={isRunning}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between px-4 py-1.5 bg-zinc-900 border-t border-zinc-800 text-xs text-zinc-500">
        <div className="flex items-center gap-4">
          <span>Ready</span>
          {selectedFile && (
            <span>
              {selectedFile.name} | UTF-8
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>C Language Mode</span>
          <span>WebAssembly Runtime</span>
        </div>
      </footer>
    </div>
  );
}
