"use client";

import { useEffect, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OutputTerminalProps {
  output: string;
  errors: string;
  isRunning: boolean;
}

// Dynamically import xterm to avoid SSR issues
let Terminal: any;
let FitAddon: any;
let WebLinksAddon: any;

if (typeof window !== "undefined") {
  import("@xterm/xterm").then((mod) => {
    Terminal = mod.Terminal;
  });
  import("xterm-addon-fit").then((mod) => {
    FitAddon = mod.FitAddon;
  });
  import("@xterm/addon-web-links").then((mod) => {
    WebLinksAddon = mod.WebLinksAddon;
  });
  import("@xterm/xterm/css/xterm.css");
}

export function OutputTerminal({ output, errors, isRunning }: OutputTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<any>(null);
  const fitAddon = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !terminalRef.current || terminal.current) return;

    // Wait for modules to load
    const initTerminal = async () => {
      if (!Terminal || !FitAddon || !WebLinksAddon) {
        setTimeout(initTerminal, 100);
        return;
      }

      terminal.current = new Terminal({
        theme: {
          background: "#0c0c0c",
          foreground: "#cccccc",
          cursor: "#ffffff",
          selectionBackground: "#264f78",
          black: "#0c0c0c",
          red: "#cd3131",
          green: "#0dbc79",
          yellow: "#e5e510",
          blue: "#2472c8",
          magenta: "#bc3fbc",
          cyan: "#11a8cd",
          white: "#e5e5e5",
        },
        fontSize: 14,
        fontFamily: "var(--font-geist-mono), monospace",
        cursorBlink: true,
        cursorStyle: "block",
        scrollback: 10000,
      });

      fitAddon.current = new FitAddon();
      terminal.current.loadAddon(fitAddon.current);
      terminal.current.loadAddon(new WebLinksAddon());

      terminal.current.open(terminalRef.current);
      fitAddon.current.fit();

      terminal.current.writeln("\x1b[1;32mC IDE Terminal\x1b[0m");
      terminal.current.writeln("Ready to compile and run C code.\r\n");
      setIsLoaded(true);
    };

    initTerminal();

    const handleResize = () => {
      fitAddon.current?.fit();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (terminal.current && output && isLoaded) {
      const lines = output.split("\n");
      lines.forEach((line) => {
        terminal.current?.writeln(line);
      });
    }
  }, [output, isLoaded]);

  const hasErrors = errors && errors.length > 0;

  return (
    <Tabs defaultValue="output" className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <TabsList className="bg-zinc-800">
          <TabsTrigger value="output" className="text-xs data-[state=active]:bg-zinc-700">
            Output {hasErrors && <span className="ml-1 text-red-400">●</span>}
          </TabsTrigger>
          <TabsTrigger value="terminal" className="text-xs data-[state=active]:bg-zinc-700">
            Terminal
          </TabsTrigger>
        </TabsList>
        {isRunning && (
          <span className="text-xs text-yellow-400 animate-pulse">
            Running...
          </span>
        )}
      </div>

      <TabsContent value="output" className="flex-1 m-0 data-[state=active]:flex flex-col">
        <ScrollArea className="flex-1 bg-zinc-950 p-4">
          <div className="font-mono text-sm">
            {output ? (
              <pre className="text-green-400 whitespace-pre-wrap">{output}</pre>
            ) : (
              <span className="text-zinc-500">No output yet. Run your code to see results.</span>
            )}
            {errors && (
              <pre className="text-red-400 whitespace-pre-wrap mt-2">{errors}</pre>
            )}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="terminal" className="flex-1 m-0 data-[state=active]:flex flex-col">
        <div 
          ref={terminalRef} 
          className="flex-1 p-2 terminal-container"
          style={{ background: "#0c0c0c" }}
        />
      </TabsContent>
    </Tabs>
  );
}
