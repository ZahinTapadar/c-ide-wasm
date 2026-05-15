# GitHub Setup Instructions

## Push to GitHub

Since the GitHub CLI requires authentication, run these commands manually:

```bash
# 1. Login to GitHub CLI (if not already done)
gh auth login

# 2. Create the repository and push
cd /Users/macbookair/Programming/CIDE/my-app
gh repo create c-ide-wasm --public --source=. --push

# Or manually create on github.com and push:
# git remote add origin https://github.com/YOUR_USERNAME/c-ide-wasm.git
# git push -u origin main
```

## Deployed Application

**Live URL:** https://my-app-beryl-gamma.vercel.app

## Features

- Monaco Editor with C language support
- File explorer (create, delete files)
- Compile and run C code in browser
- Terminal output with xterm.js
- WebAssembly-based execution environment

## Project Structure

- `app/page.tsx` - Main IDE interface
- `components/CodeEditor.tsx` - Monaco Editor integration
- `components/FileExplorer.tsx` - File management
- `components/OutputTerminal.tsx` - Terminal output
- `lib/compiler.ts` - C code compiler/executor
- `lib/filesystem.ts` - File management utilities
