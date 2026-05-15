"use client";

import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import type { Terminal as XTerm } from "@xterm/xterm";
import type { FitAddon as FitAddonType } from "xterm-addon-fit";

export interface TerminalHandle {
  writeInfo: (text: string) => void;
  writeStdout: (text: string) => void;
  writeStderr: (text: string) => void;
  writeError: (text: string) => void;
  clear: () => void;
  getStdinBuffer: () => string;
  resetStdinBuffer: () => void;
}

interface OutputTerminalProps {
  isRunning: boolean;
}

export const OutputTerminal = forwardRef<TerminalHandle, OutputTerminalProps>(
  function OutputTerminal({ isRunning }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const termRef = useRef<XTerm | null>(null);
    const fitRef = useRef<FitAddonType | null>(null);
    const stdinBuf = useRef<string>("");
    const currentLine = useRef<string>("");

    useImperativeHandle(ref, () => ({
      writeInfo: (text) => write(`\x1b[36m${text}\x1b[0m`),
      writeStdout: (text) => write(`\x1b[97m${text}\x1b[0m`),
      writeStderr: (text) => write(`\x1b[91m${text}\x1b[0m`),
      writeError: (text) => write(`\x1b[91m${text}\x1b[0m`),
      clear: () => termRef.current?.clear(),
      getStdinBuffer: () => stdinBuf.current,
      resetStdinBuffer: () => { stdinBuf.current = ""; },
    }));

    function write(text: string) {
      if (!termRef.current) return;
      termRef.current.write(text.replace(/\n/g, "\r\n"));
    }

    useEffect(() => {
      if (!containerRef.current || termRef.current) return;

      let disposed = false;

      (async () => {
        const [{ Terminal }, { FitAddon }, { WebLinksAddon }] = await Promise.all([
          import("@xterm/xterm"),
          import("xterm-addon-fit"),
          import("@xterm/addon-web-links"),
        ]);

        await import("@xterm/xterm/css/xterm.css");

        if (disposed || !containerRef.current) return;

        const term = new Terminal({
          cursorBlink: true,
          cursorStyle: "block",
          fontSize: 13,
          fontFamily: '"Geist Mono", "Fira Code", Menlo, monospace',
          scrollback: 20000,
          convertEol: true,
          theme: {
            background: "#0d0d0d",
            foreground: "#d4d4d4",
            cursor: "#d4d4d4",
            selectionBackground: "#264f78",
            black: "#0d0d0d",
            red: "#f44747",
            green: "#4ec9b0",
            yellow: "#dcdcaa",
            blue: "#569cd6",
            magenta: "#c678dd",
            cyan: "#56b6c2",
            white: "#d4d4d4",
            brightBlack: "#808080",
            brightRed: "#f44747",
            brightGreen: "#4ec9b0",
            brightYellow: "#dcdcaa",
            brightBlue: "#569cd6",
            brightMagenta: "#c678dd",
            brightCyan: "#56b6c2",
            brightWhite: "#ffffff",
          },
        });

        const fit = new FitAddon();
        term.loadAddon(fit);
        term.loadAddon(new WebLinksAddon());

        term.open(containerRef.current);
        fit.fit();
        term.focus();

        termRef.current = term;
        fitRef.current = fit;

        term.writeln("\x1b[1;36m╔══════════════════════════════════╗\x1b[0m");
        term.writeln("\x1b[1;36m║    C IDE  •  WebAssembly + Clang  ║\x1b[0m");
        term.writeln("\x1b[1;36m╚══════════════════════════════════╝\x1b[0m");
        term.writeln("\x1b[90mPress \x1b[97mRun\x1b[90m to compile and execute your C code.\x1b[0m");
        term.writeln("");

        term.onData((data) => {
          if (isRunning) return;
          const code = data.charCodeAt(0);
          if (data === "\r") {
            stdinBuf.current += currentLine.current + "\n";
            term.write("\r\n");
            currentLine.current = "";
          } else if (code === 127) {
            if (currentLine.current.length > 0) {
              currentLine.current = currentLine.current.slice(0, -1);
              term.write("\b \b");
            }
          } else if (code >= 32) {
            currentLine.current += data;
            term.write(data);
          }
        });

        const obs = new ResizeObserver(() => fit.fit());
        obs.observe(containerRef.current);

        const onResize = () => fit.fit();
        window.addEventListener("resize", onResize);

        return () => {
          obs.disconnect();
          window.removeEventListener("resize", onResize);
          term.dispose();
          termRef.current = null;
          fitRef.current = null;
        };
      })();

      return () => { disposed = true; };
    }, []);

    useEffect(() => {
      if (!isRunning) {
        termRef.current?.focus();
      }
    }, [isRunning]);

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-900 border-b border-zinc-800">
          <span className="text-xs font-medium text-zinc-400">Terminal</span>
          {isRunning && (
            <span className="text-xs text-yellow-400 animate-pulse flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse inline-block" />
              Running…
            </span>
          )}
        </div>
        <div
          ref={containerRef}
          className="flex-1 min-h-0"
          style={{ background: "#0d0d0d", padding: "6px 4px" }}
        />
      </div>
    );
  }
);
