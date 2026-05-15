"use client";

import { useState } from "react";
import { FileItem, generateId, isCFile } from "@/lib/filesystem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileCode,
  Folder,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  FileText,
} from "lucide-react";

interface FileExplorerProps {
  files: FileItem[];
  selectedFile: string | null;
  onSelectFile: (file: FileItem) => void;
  onAddFile: (file: FileItem) => void;
  onDeleteFile: (fileId: string) => void;
}

export function FileExplorer({
  files,
  selectedFile,
  onSelectFile,
  onAddFile,
  onDeleteFile,
}: FileExplorerProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      const newFile: FileItem = {
        id: generateId(),
        name: newFileName.endsWith(".c") ? newFileName : `${newFileName}.c`,
        content: `#include <stdio.h>\n\nint main() {\n    // Your code here\n    return 0;\n}`,
        isDirectory: false,
        parentId: null,
      };
      onAddFile(newFile);
      setNewFileName("");
      setIsCreating(false);
    }
  };

  const getFileIcon = (filename: string) => {
    if (isCFile(filename)) {
      return <FileCode className="h-4 w-4 text-blue-400" />;
    }
    return <FileText className="h-4 w-4 text-zinc-400" />;
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800">
      <div className="flex items-center justify-between p-3 border-b border-zinc-800">
        <span className="text-sm font-medium text-zinc-300">Explorer</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-zinc-400 hover:text-zinc-100"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isCreating && (
            <div className="flex items-center gap-2 px-2 py-1">
              <Input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="filename.c"
                className="h-7 text-xs bg-zinc-800 border-zinc-700"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFile();
                  if (e.key === "Escape") setIsCreating(false);
                }}
                autoFocus
              />
            </div>
          )}

          {files.map((file) => (
            <div key={file.id}>
              <div
                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer group ${
                  selectedFile === file.id
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                }`}
                onClick={() => onSelectFile(file)}
              >
                {file.isDirectory ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(file.id);
                    }}
                    className="text-zinc-500"
                  >
                    {expanded.has(file.id) ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </button>
                ) : (
                  <span className="w-3" />
                )}

                {file.isDirectory ? (
                  <Folder className="h-4 w-4 text-yellow-500" />
                ) : (
                  getFileIcon(file.name)
                )}

                <span className="text-sm flex-1 truncate">{file.name}</span>

                {!file.isDirectory && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(file.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {file.isDirectory &&
                expanded.has(file.id) &&
                file.children && (
                  <div className="ml-4 border-l border-zinc-800 pl-2">
                    {file.children.map((child) => (
                      <div
                        key={child.id}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer ${
                          selectedFile === child.id
                            ? "bg-zinc-800 text-zinc-100"
                            : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                        }`}
                        onClick={() => onSelectFile(child)}
                      >
                        <span className="w-3" />
                        {getFileIcon(child.name)}
                        <span className="text-sm flex-1 truncate">
                          {child.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
