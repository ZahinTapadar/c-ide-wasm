export type OutputKind = "info" | "stdout" | "stderr" | "error";

export interface CompilerOutputChunk {
  kind: OutputKind;
  text: string;
}

export interface RunResult {
  success: boolean;
  exitCode: number;
}

/**
 * Compiles C source code using real Clang (via @wasmer/sdk) and runs the result.
 * All compilation and execution happens entirely in the browser via WebAssembly.
 *
 * Requires Cross-Origin Isolation headers (COOP + COEP) to be set so that
 * SharedArrayBuffer is available (needed by the Wasmer WASI runtime).
 */
export async function compileAndRun(
  sourceCode: string,
  onOutput: (chunk: CompilerOutputChunk) => void,
  stdin?: string
): Promise<RunResult> {
  if (typeof window === "undefined") {
    throw new Error("Compiler only runs in the browser.");
  }

  try {
    const { init, Wasmer, Directory } = await import("@wasmer/sdk");

    onOutput({ kind: "info", text: "Initializing WebAssembly runtime…\n" });
    await init({ registryUrl: "/api/wasmer-registry" });

    onOutput({ kind: "info", text: "Loading Clang from Wasmer registry…\n" });
    const clang = await Wasmer.fromRegistry("clang/clang");

    onOutput({ kind: "info", text: "Compiling…\n" });

    const project = new Directory();
    await project.writeFile("main.c", sourceCode);

    const compileInstance = await clang.entrypoint!.run({
      args: ["/project/main.c", "-o", "/project/main.wasm", "-O1"],
      mount: { "/project": project },
    });

    const compileResult = await compileInstance.wait();

    if (compileResult.stderr?.trim()) {
      onOutput({ kind: "stderr", text: compileResult.stderr });
    }
    if (compileResult.stdout?.trim()) {
      onOutput({ kind: "stdout", text: compileResult.stdout });
    }

    if (!compileResult.ok) {
      onOutput({
        kind: "error",
        text: `\nCompilation failed (exit code ${compileResult.code ?? 1}).\n`,
      });
      return { success: false, exitCode: compileResult.code ?? 1 };
    }

    onOutput({ kind: "info", text: "\nCompilation successful. Running…\n\n" });

    const wasmBinary = await project.readFile("main.wasm");
    const program = await Wasmer.fromFile(wasmBinary);

    const runInstance = await program.entrypoint!.run({
      ...(stdin != null ? { stdin } : {}),
    });

    const runResult = await runInstance.wait();

    if (runResult.stdout) {
      onOutput({ kind: "stdout", text: runResult.stdout });
    }
    if (runResult.stderr?.trim()) {
      onOutput({ kind: "stderr", text: runResult.stderr });
    }

    onOutput({
      kind: "info",
      text: `\n[Process exited with code ${runResult.code ?? 0}]\n`,
    });

    return { success: runResult.ok, exitCode: runResult.code ?? 0 };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    onOutput({ kind: "error", text: `\nError: ${msg}\n` });
    return { success: false, exitCode: 1 };
  }
}
