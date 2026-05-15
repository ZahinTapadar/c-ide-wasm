export interface FileItem {
  id: string;
  name: string;
  content: string;
  isDirectory: boolean;
  children?: FileItem[];
  parentId?: string | null;
}

export const initialFiles: FileItem[] = [
  {
    id: "main-c",
    name: "main.c",
    content: `#include <stdio.h>

int main() {
    printf("Hello, World from WebAssembly C!\\n");
    
    int a = 10;
    int b = 20;
    printf("Sum of %d and %d is %d\\n", a, b, a + b);
    
    for (int i = 1; i <= 5; i++) {
        printf("Count: %d\\n", i);
    }
    
    return 0;
}`,
    isDirectory: false,
    parentId: null,
  },
  {
    id: "fibonacci-c",
    name: "fibonacci.c",
    content: `#include <stdio.h>

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    int n = 10;
    printf("Fibonacci sequence up to %d terms:\\n", n);
    
    for (int i = 0; i < n; i++) {
        printf("%d ", fibonacci(i));
    }
    printf("\\n");
    
    return 0;
}`,
    isDirectory: false,
    parentId: null,
  },
];

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export function isCFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ext === "c" || ext === "h";
}
