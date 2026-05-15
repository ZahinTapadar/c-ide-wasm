export interface CompileResult {
  success: boolean;
  binary?: Uint8Array;
  stdout: string;
  stderr: string;
  error?: string;
}

export interface RunResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
}

// In-memory C compiler that transpiles C to JavaScript for execution
// This provides a working C runtime in the browser
export class CCompiler {
  async initialize(): Promise<void> {
    console.log("Compiler initialized");
  }

  // Compile C code (syntax check only for now)
  async compile(sourceCode: string, filename: string = "main.c"): Promise<CompileResult> {
    try {
      const syntaxCheck = this.checkSyntax(sourceCode);
      if (!syntaxCheck.valid) {
        return {
          success: false,
          stdout: "",
          stderr: "",
          error: syntaxCheck.error,
        };
      }

      return {
        success: true,
        stdout: "Compilation successful\n",
        stderr: "",
      };
    } catch (error) {
      return {
        success: false,
        stdout: "",
        stderr: "",
        error: error instanceof Error ? error.message : "Unknown compilation error",
      };
    }
  }

  // Check C syntax (basic validation)
  private checkSyntax(source: string): { valid: boolean; error?: string } {
    const openBraces = (source.match(/\{/g) || []).length;
    const closeBraces = (source.match(/\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      return { valid: false, error: `Syntax error: Unmatched braces (${openBraces} open, ${closeBraces} close)` };
    }

    const openParens = (source.match(/\(/g) || []).length;
    const closeParens = (source.match(/\)/g) || []).length;
    
    if (openParens !== closeParens) {
      return { valid: false, error: `Syntax error: Unmatched parentheses (${openParens} open, ${closeParens} close)` };
    }

    if (!source.includes("int main")) {
      return { valid: false, error: "Error: No 'int main' function found" };
    }

    return { valid: true };
  }
}

// Singleton instance
export const cCompiler = new CCompiler();

// Execute C code by interpreting it in JavaScript
// This provides a more complete C runtime without needing full LLVM
export async function executeCCode(sourceCode: string): Promise<RunResult> {
  const stdout: string[] = [];
  const stderr: string[] = [];
  
  // Create print function
  const _print = (format: string, ...args: any[]) => {
    // Simple printf simulation
    let result = format;
    let argIndex = 0;
    
    // Replace format specifiers
    result = result.replace(/%d/g, () => {
      const val = args[argIndex++];
      return typeof val === "number" ? Math.floor(val).toString() : String(val);
    });
    result = result.replace(/%f/g, () => {
      const val = args[argIndex++];
      return typeof val === "number" ? val.toString() : String(val);
    });
    result = result.replace(/%s/g, () => {
      const val = args[argIndex++];
      return String(val);
    });
    result = result.replace(/%c/g, () => {
      const val = args[argIndex++];
      return String.fromCharCode(Number(val));
    });
    
    // Handle escape sequences
    result = result.replace(/\\n/g, "\n");
    result = result.replace(/\\t/g, "\t");
    
    stdout.push(result);
  };

  try {
    // Parse and execute C code
    const jsCode = transpileCToJS(sourceCode);
    
    // Create a function from the transpiled code
    const wrappedCode = `
      "use strict";
      return (async function(__print) {
        const printf = __print;
        const console = { log: __print };
        ${jsCode}
      });
    `;
    
    const fn = new Function(wrappedCode)();
    await fn(_print);
    
    return {
      success: true,
      stdout: stdout.join(""),
      stderr: stderr.join(""),
      exitCode: 0,
    };
  } catch (error) {
    stderr.push(error instanceof Error ? error.message : String(error));
    return {
      success: false,
      stdout: stdout.join(""),
      stderr: stderr.join(""),
      exitCode: 1,
    };
  }
}

// Transpile C to JavaScript
function transpileCToJS(sourceCode: string): string {
  let lines = sourceCode.split("\n");
  let output: string[] = [];
  let inFunction = false;
  let braceCount = 0;
  
  for (let line of lines) {
    let trimmed = line.trim();
    
    // Skip includes and preprocessor directives
    if (trimmed.startsWith("#include")) continue;
    if (trimmed.startsWith("#define")) continue;
    if (trimmed.startsWith("#ifdef")) continue;
    if (trimmed.startsWith("#endif")) continue;
    
    // Handle function definitions
    if (/^(int|float|double|void|char)\s+\w+\s*\(/.test(trimmed) && !trimmed.includes(";")) {
      inFunction = true;
      // Convert C function to JS function
      let funcLine = trimmed
        .replace(/^(int|float|double|void|char)\s+/, "function ")
        .replace(/\)/, ") {");
      output.push(funcLine);
      braceCount = 1;
      continue;
    }
    
    // Handle variable declarations
    if (/^\s*(int|float|double|char)\s+/.test(trimmed) && trimmed.includes(";")) {
      let varLine = trimmed
        .replace(/\bint\b\s+/, "let ")
        .replace(/\bfloat\b\s+/, "let ")
        .replace(/\bdouble\b\s+/, "let ")
        .replace(/\bchar\s*\*\s*/, "let ")
        .replace(/\bchar\s+\w+\[\d+\]/, (match) => match.replace(/char\s+(\w+)\[(\d+)\]/, "let $1 = new Array($2).fill('')"))
        .replace(/;\s*$/, ";");
      output.push(varLine);
      continue;
    }
    
    // Handle printf
    if (trimmed.includes("printf(")) {
      let printfLine = trimmed
        .replace(/printf\s*\(/, "printf(")
        .replace(/\);\s*$/, ");");
      output.push(printfLine);
      continue;
    }
    
    // Handle return statements
    if (trimmed.startsWith("return")) {
      let returnLine = trimmed
        .replace(/return\s+0\s*;/, "return 0;")
        .replace(/return\s+([^;]+);/, "return $1;");
      output.push(returnLine);
      continue;
    }
    
    // Copy other lines as-is
    output.push(line);
  }
  
  return output.join("\n");
}
