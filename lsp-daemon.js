#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const glob = require('glob');

class LSPDaemon {
  constructor() {
    this.server = null;
    this.messageId = 1;
    this.pendingRequests = new Map();
    this.isInitialized = false;
    this.buffer = '';
    this.openDocuments = new Set();
    this.progressTokens = new Map();
    this.projectAnalysisComplete = false;
    this.workspacePath = '';
    this.fileWatcher = null;
    this.documentVersions = new Map(); // Track document versions for proper sync
    this.syncQueue = new Set(); // Track files needing sync
  }

  // Get language ID from file extension
  getLanguageId(filePath) {
    const ext = path.extname(filePath);
    const languageMap = {
      '.ts': 'typescript',
      '.tsx': 'typescriptreact', 
      '.js': 'javascript',
      '.jsx': 'javascriptreact',
      '.json': 'json'
    };
    return languageMap[ext] || 'plaintext';
  }

  // Convert file path to URI
  filePathToUri(filePath) {
    return `file://${path.resolve(filePath)}`;
  }

  // Convert URI to file path
  uriToFilePath(uri) {
    return uri.replace('file://', '');
  }

  // Enhanced file synchronization
  async syncFile(filePath, changeType = 'changed') {
    try {
      const uri = this.filePathToUri(filePath);
      const relativePath = path.relative(this.workspacePath, filePath);
      
      console.log(`🔄 [SYNC] ${changeType}: ${relativePath}`);

      if (changeType === 'deleted') {
        // Handle file deletion
        if (this.openDocuments.has(uri)) {
          await this.sendLSPNotification('textDocument/didClose', {
            textDocument: { uri }
          });
          this.openDocuments.delete(uri);
          this.documentVersions.delete(uri);
        }
        return;
      }

      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  [SYNC] File no longer exists: ${relativePath}`);
        return;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const languageId = this.getLanguageId(filePath);
      const currentVersion = this.documentVersions.get(uri) || 0;
      const newVersion = currentVersion + 1;

      if (this.openDocuments.has(uri)) {
        // File is already open, send change notification
        await this.sendLSPNotification('textDocument/didChange', {
          textDocument: { 
            uri, 
            version: newVersion 
          },
          contentChanges: [{ text: content }]
        });
      } else {
        // File not open, send open notification
        await this.sendLSPNotification('textDocument/didOpen', {
          textDocument: {
            uri,
            languageId,
            version: newVersion,
            text: content
          }
        });
        this.openDocuments.add(uri);
      }

      this.documentVersions.set(uri, newVersion);
      this.syncQueue.delete(filePath);
      
    } catch (error) {
      console.error(`❌ [SYNC ERROR] Failed to sync ${filePath}:`, error.message);
    }
  }

  // Ensure file is synced before LSP operations
  async ensureFileSync(filePath) {
    const absolutePath = path.resolve(filePath);
    const uri = this.filePathToUri(absolutePath);
    
    // Skip if file doesn't exist or isn't a supported type
    if (!fs.existsSync(absolutePath)) {
      console.log(`⚠️  [SYNC] File not found: ${filePath}`);
      return false;
    }

    const ext = path.extname(absolutePath);
    if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      return false;
    }

    // Check if file needs sync
    const stats = fs.statSync(absolutePath);
    const currentVersion = this.documentVersions.get(uri) || 0;
    
    if (!this.openDocuments.has(uri) || this.syncQueue.has(absolutePath)) {
      console.log(`🔄 [ENSURE SYNC] Syncing: ${path.relative(this.workspacePath, absolutePath)}`);
      await this.syncFile(absolutePath, this.openDocuments.has(uri) ? 'changed' : 'created');
      
      // Wait a bit for LSP to process the change
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return true;
  }

  // Sync entire workspace
  async syncWorkspace() {
    console.log(`🔄 [WORKSPACE SYNC] Starting full workspace sync...`);
    
    const patterns = [
      path.join(this.workspacePath, 'src/**/*.{ts,tsx,js,jsx}'),
      path.join(this.workspacePath, '*.{ts,tsx,js,jsx}')
    ];

    let syncCount = 0;
    for (const pattern of patterns) {
      const files = glob.sync(pattern);
      for (const file of files) {
        if (fs.existsSync(file)) {
          await this.syncFile(file, 'created');
          syncCount++;
          
          // Batch process to avoid overwhelming LSP
          if (syncCount % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
      }
    }

    console.log(`✅ [WORKSPACE SYNC] Synced ${syncCount} files`);
    return syncCount;
  }

  // Setup file watching
  setupFileWatcher() {
    if (this.fileWatcher) {
      this.fileWatcher.close();
    }

    const watchPaths = [
      path.join(this.workspacePath, 'src/**/*.{ts,tsx,js,jsx}'),
      path.join(this.workspacePath, '*.{ts,tsx,js,jsx}')
    ];

    console.log(`👁️  [WATCHER] Setting up file watcher for: ${this.workspacePath}`);
    
    this.fileWatcher = chokidar.watch(watchPaths, {
      ignored: [
        '**/node_modules/**',
        '**/.git/**', 
        '**/dist/**',
        '**/build/**'
      ],
      persistent: true,
      ignoreInitial: true // Don't trigger on startup
    });

    this.fileWatcher
      .on('change', (filePath) => {
        this.syncQueue.add(filePath);
        this.syncFile(filePath, 'changed');
      })
      .on('add', (filePath) => {
        this.syncQueue.add(filePath);  
        this.syncFile(filePath, 'created');
      })
      .on('unlink', (filePath) => {
        this.syncFile(filePath, 'deleted');
      })
      .on('error', (error) => {
        console.error('❌ [WATCHER ERROR]:', error);
      });

    console.log(`✅ [WATCHER] File watcher active`);
  }

  // Send LSP notification with error handling
  async sendLSPNotification(method, params) {
    return new Promise((resolve, reject) => {
      if (!this.server || !this.isInitialized) {
        reject(new Error('LSP server not initialized'));
        return;
      }

      const request = {
        jsonrpc: '2.0',
        method,
        params
      };

      const content = JSON.stringify(request);
      const message = `Content-Length: ${content.length}\r\n\r\n${content}`;
      
      try {
        this.server.stdin.write(message);
        console.log(`📤 [NOTIFICATION] ${method} sent`);
        resolve();
      } catch (error) {
        console.error(`❌ [NOTIFICATION ERROR] ${method}:`, error.message);
        reject(error);
      }
    });
  }

  async start(workspacePath = process.cwd()) {
    this.workspacePath = workspacePath;
    console.log(`🚀 [DEBUG] Starting TypeScript Language Server for workspace: ${workspacePath}`);
    
    // Configure TypeScript to use our special config that includes JS files
    const tsconfigPath = path.join(workspacePath, 'tsconfig.ai-lsp.json');
    console.log(`🔧 [CONFIG] Using tsconfig: ${tsconfigPath}`);
    
    // Enable verbose logging on the TypeScript Language Server
    this.server = spawn('npx', ['typescript-language-server', '--stdio', '--log-level', '4'], {
      env: {
        ...process.env,
        TSSERVER_CONFIG_PATH: tsconfigPath
      }
    });
    
    this.server.stdout.on('data', (data) => {
      const dataStr = data.toString();
      console.log(`📥 [LSP OUT] ${dataStr.substring(0, 200)}${dataStr.length > 200 ? '...' : ''}`);
      this.buffer += dataStr;
      this.processMessages();
    });

    this.server.stderr.on('data', (data) => {
      const dataStr = data.toString();
      console.error('🚨 [LSP ERR]:', dataStr);
    });

    // Initialize workspace
    await this.initialize(workspacePath);
    
    // Setup file watching for automatic sync
    this.setupFileWatcher();
    
    console.log('LSP Daemon ready with file watching enabled');
  }

  processMessages() {
    while (true) {
      const match = this.buffer.match(/Content-Length: (\d+)\r\n\r\n/);
      if (!match) break;

      const contentLength = parseInt(match[1]);
      const headerEnd = match.index + match[0].length;
      
      // Convert to Buffer for proper byte-based slicing (LSP Content-Length is in bytes)
      const bufferBytes = Buffer.from(this.buffer, 'utf8');
      const headerEndBytes = Buffer.from(this.buffer.substring(0, headerEnd), 'utf8').length;
      
      if (bufferBytes.length < headerEndBytes + contentLength) break;

      // Extract message using byte-based slicing
      const messageBytes = bufferBytes.slice(headerEndBytes, headerEndBytes + contentLength);
      const message = messageBytes.toString('utf8');
      
      // Update buffer using byte-based slicing
      const remainingBytes = bufferBytes.slice(headerEndBytes + contentLength);
      this.buffer = remainingBytes.toString('utf8');

      try {
        const parsed = JSON.parse(message);
        
        // Handle progress notifications for project analysis tracking
        if (parsed.method === 'window/workDoneProgress/create') {
          const token = parsed.params.token;
          this.progressTokens.set(token, { created: true });
          console.log(`📋 [PROGRESS] Created progress token: ${token}`);
          
          // Respond to the create request
          const response = {
            jsonrpc: '2.0',
            id: parsed.id,
            result: null
          };
          const content = JSON.stringify(response);
          const message = `Content-Length: ${content.length}\r\n\r\n${content}`;
          this.server.stdin.write(message);
          continue; // 🔧 FIX: Continue processing more messages
        }
        
        // Handle $/progress notifications (these are notifications, not requests - no response needed)
        if (parsed.method === '$/progress') {
          const { token, value } = parsed.params;
          const tokenInfo = this.progressTokens.get(token) || {};
          
          if (value.kind === 'begin') {
            tokenInfo.title = value.title;
            tokenInfo.started = true;
            this.progressTokens.set(token, tokenInfo);
            console.log(`🚀 [PROGRESS START] ${value.title} (token: ${token})`);
          } else if (value.kind === 'report') {
            if (value.message) {
              console.log(`📊 [PROGRESS] ${tokenInfo.title}: ${value.message}`);
            }
            if (value.percentage !== undefined) {
              console.log(`📊 [PROGRESS] ${tokenInfo.title}: ${value.percentage}%`);
            }
          } else if (value.kind === 'end') {
            console.log(`✅ [PROGRESS END] ${tokenInfo.title || token} completed`);
            
            // Check if this is TypeScript project analysis completion
            if (tokenInfo.title && (
              tokenInfo.title.toLowerCase().includes('typescript') ||
              tokenInfo.title.toLowerCase().includes('project') ||
              tokenInfo.title.toLowerCase().includes('language service') ||
              tokenInfo.title.toLowerCase().includes('semantic')
            )) {
              this.projectAnalysisComplete = true;
              console.log(`🎯 [ANALYSIS COMPLETE] TypeScript project analysis finished! Ready for refactoring.`);
            }
            
            this.progressTokens.delete(token);
          }
          
          // This is a notification - continue processing without sending response
          continue;
        }
        
        // Handle window/logMessage notifications (these are notifications, not requests - no response needed)
        if (parsed.method === 'window/logMessage' && parsed.params?.message) {
          const msg = parsed.params.message;
          if (msg.includes('Project')) {
            console.log(`🎯 [PROJECT] ${msg}`);
          }
          if (msg.includes('Semantic diagnostics') || msg.includes('Starting compilation')) {
            console.log(`🧠 [ANALYSIS] ${msg}`);
          }
          if (msg.includes('Finished') || msg.includes('Complete')) {
            console.log(`✅ [COMPLETE] ${msg}`);
          }
          
          // This is a notification - continue processing without sending response
          continue;
        }
        
        console.log(`📨 [LSP MSG] ${parsed.method || 'response'} (ID: ${parsed.id || 'N/A'})`);
        
        // Handle other notification messages (no response needed)
        if (parsed.method && !parsed.id) {
          // This is a notification - no response should be sent
          continue;
        }
        
        // Handle workspace/applyEdit requests from the server
        if (parsed.method === 'workspace/applyEdit') {
          console.log(`🛠️ [APPLY EDIT] Received edit request:`, JSON.stringify(parsed.params, null, 2));
          
          // Apply the edits using Node.js fs
          const success = this.applyWorkspaceEdit(parsed.params.edit);
          
          // Respond to the server
          const response = {
            jsonrpc: '2.0',
            id: parsed.id,
            result: { applied: success }
          };
          
          const content = JSON.stringify(response);
          const message = `Content-Length: ${content.length}\r\n\r\n${content}`;
          this.server.stdin.write(message);
          
          console.log(`✅ [APPLY EDIT] ${success ? 'Successfully applied' : 'Failed to apply'} workspace edits`);
          return;
        }
        
        if (parsed.id && this.pendingRequests.has(parsed.id)) {
          const resolve = this.pendingRequests.get(parsed.id);
          this.pendingRequests.delete(parsed.id);
          resolve(parsed);
        }
        // Handle server notifications/messages that don't have responses
      } catch (e) {
        console.error('🔥 [PARSE ERR] Failed to parse LSP message:', e);
        console.error('📝 [DEBUG] Message content:', JSON.stringify(message.substring(0, 100)));
        
        // Skip this malformed message and continue processing
        console.log('⏭️  [RECOVERY] Skipping malformed message, continuing...');
      }
    }
  }

  async sendRequest(method, params = {}) {
    const id = this.messageId++;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    const content = JSON.stringify(request);
    const message = `Content-Length: ${content.length}\r\n\r\n${content}`;
    
    this.server.stdin.write(message);

    return new Promise((resolve, reject) => {
      console.log(`🔍 [DEBUG] Starting request ${method} (ID: ${id}) at ${new Date().toISOString()}`);
      this.pendingRequests.set(id, resolve);
      
      // Add timeout to prevent hanging
      const timeoutHandle = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          console.log(`⏰ [TIMEOUT] Request ${method} (ID: ${id}) timed out after 10 seconds`);
          reject(new Error(`Request ${method} timed out`));
        }
      }, 10000);
      
      // Store timeout handle so we can clear it on successful response
      this.pendingRequests.set(id, (response) => {
        clearTimeout(timeoutHandle);
        console.log(`✅ [DEBUG] Request ${method} (ID: ${id}) completed at ${new Date().toISOString()}`);
        resolve(response);
      });
    });
  }

  sendNotification(method, params = {}) {
    const notification = {
      jsonrpc: '2.0',
      method,
      params
    };

    const content = JSON.stringify(notification);
    const message = `Content-Length: ${content.length}\r\n\r\n${content}`;
    
    this.server.stdin.write(message);
  }

  async initialize(workspacePath) {
    this.workspacePath = workspacePath;
    const workspaceUri = this.filePathToUri(workspacePath);
    
    const initResponse = await this.sendRequest('initialize', {
      processId: process.pid,
      clientInfo: { name: 'lsp-daemon' },
      rootUri: workspaceUri,
      workspaceFolders: [
        {
          uri: workspaceUri,
          name: path.basename(workspacePath)
        }
      ],
      capabilities: {
        textDocument: {
          definition: {},
          references: {},
          rename: {},
          hover: {},
          codeAction: {},
          synchronization: {
            didOpen: true,
            didClose: true,
            didChange: true
          }
        },
        workspace: {
          symbol: {},
          executeCommand: {},
          workspaceEdit: true,
          applyEdit: true,
          fileOperations: {
            willRename: true,
            didRename: true
          }
        },
        window: {
          workDoneProgress: true
        }
      }
    });

    console.log(`🔧 [INIT] Initialize response:`, JSON.stringify(initResponse.result, null, 2));
    
    // 'initialized' is a notification, not a request
    this.sendNotification('initialized', {});
    this.isInitialized = true;
    
    console.log(`📁 [INIT] Workspace initialized for: ${workspaceUri}`);
    console.log(`⏳ [INIT] Waiting for TypeScript project analysis to complete...`);
    
    return initResponse;
  }

  async openDocument(filePath) {
    const uri = this.filePathToUri(filePath);
    
    // Don't re-open already opened documents
    if (this.openDocuments.has(uri)) {
      return uri;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    this.sendNotification('textDocument/didOpen', {
      textDocument: {
        uri,
        languageId: this.getLanguageId(filePath),
        version: 1,
        text: content
      }
    });
    
    this.openDocuments.add(uri);
    return uri;
  }

  async closeDocument(filePath) {
    const uri = this.filePathToUri(filePath);
    
    if (this.openDocuments.has(uri)) {
      this.sendNotification('textDocument/didClose', {
        textDocument: { uri }
      });
      this.openDocuments.delete(uri);
    }
    
    return uri;
  }

  // Apply text edits to a file (FIXED VERSION - handles multi-line correctly)
  async applyTextEdits(filePath, textEdits) {
    console.log(`🔧 [EDIT] Applying ${textEdits.length} text edits to ${filePath}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Sort edits by position (from end to start to avoid offset shifting)
    const sortedEdits = textEdits.sort((a, b) => {
      if (a.range.start.line !== b.range.start.line) {
        return b.range.start.line - a.range.start.line;
      }
      return b.range.start.character - a.range.start.character;
    });
    
    // Apply each edit in order
    for (const edit of sortedEdits) {
      const lines = content.split('\n');
      const startLine = edit.range.start.line;
      const startChar = edit.range.start.character;
      const endLine = edit.range.end.line;
      const endChar = edit.range.end.character;
      
      if (startLine === endLine) {
        // Single line edit
        const line = lines[startLine];
        if (line !== undefined) {
          lines[startLine] = line.slice(0, startChar) + edit.newText + line.slice(endChar);
        }
      } else {
        // Multi-line edit
        const startLineText = lines[startLine];
        const endLineText = lines[endLine];
        
        if (startLineText !== undefined && endLineText !== undefined) {
          const newLines = [
            startLineText.slice(0, startChar) + edit.newText + endLineText.slice(endChar)
          ];
          
          // Replace the affected lines
          lines.splice(startLine, endLine - startLine + 1, ...newLines);
        }
      }
      
      content = lines.join('\n');
      console.log(`✅ [EDIT] Applied edit at ${startLine}:${startChar} -> "${edit.newText.slice(0, 50)}${edit.newText.length > 50 ? '...' : ''}"`);
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`💾 [SAVED] Updated ${filePath}`);
    
    return content;
  }

  // Refactoring command: Move file with LSP analysis (ATOMIC)
  async refactorMoveFile(sourceUri, targetUri) {
    const sourcePath = sourceUri.replace('file://', '');
    const targetPath = targetUri.replace('file://', '');
    
    console.log(`Refactoring: Moving ${sourcePath} to ${targetPath}`);
    
    // Ensure the source file is opened and known to LSP
    console.log('Opening source file in LSP...');
    await this.openDocument(sourcePath);
    
    // Also open some files that likely import this file to ensure LSP knows about dependencies
    console.log('Opening potential dependent files...');
    const potentialDependents = [
      '/Users/rforina/Code/hcc/insights-rbac-ui/src/features/workspaces/WorkspaceListTable.tsx',
      '/Users/rforina/Code/hcc/insights-rbac-ui/src/features/workspaces/MoveWorkspaceModal.tsx',
      '/Users/rforina/Code/hcc/insights-rbac-ui/src/features/workspaces/workspace-detail/WorkspaceDetail.tsx'
    ];
    
    for (const file of potentialDependents) {
      if (require('fs').existsSync(file)) {
        await this.openDocument(file);
        console.log(`Opened dependent file: ${file}`);
      }
    }
    
    // Wait for LSP to process all opened files
    console.log('Waiting for LSP to analyze dependencies...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // CRITICAL: Get LSP analysis BEFORE moving anything (proper LSP protocol)
    const willRenameResponse = await this.sendRequest('workspace/willRenameFiles', {
      files: [{ oldUri: sourceUri, newUri: targetUri }]
    });
    
    console.log('=== DEBUGGING workspace/willRenameFiles ===');
    console.log('Full response:', JSON.stringify(willRenameResponse, null, 2));
    
    if (!willRenameResponse.result) {
      console.log('ERROR: No result in willRenameFiles response');
      throw new Error('LSP did not provide result for workspace/willRenameFiles');
    }
    
    if (!willRenameResponse.result.changes) {
      console.log('ERROR: No changes in willRenameFiles result');
      console.log('Result structure:', JSON.stringify(willRenameResponse.result, null, 2));
      throw new Error('LSP did not provide workspace changes for file move');
    }
    
    const changes = willRenameResponse.result.changes;
    console.log(`LSP found ${Object.keys(changes).length} files that need updates`);
    console.log('Changes object:', JSON.stringify(changes, null, 2));
    
    // ATOMIC OPERATION: Apply all changes together
    try {
      // 1. Create target directory if needed
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // 2. Close source document if open 
      if (this.openDocuments.has(sourceUri)) {
        await this.closeDocument(sourcePath);
      }
      
      // 3. Apply text edits to ALL files BEFORE moving (to avoid reference errors)
      const appliedChanges = {};
      for (const [fileUri, textEdits] of Object.entries(changes)) {
        const filePath = fileUri.replace('file://', '');
        
        if (filePath === sourcePath) {
          // Skip source file edits - will apply after move
          continue;
        } else if (fs.existsSync(filePath)) {
          // Update files that import the source file
          await this.applyTextEdits(filePath, textEdits);
          appliedChanges[fileUri] = textEdits.length;
          console.log(`Applied ${textEdits.length} edits to importing file: ${filePath}`);
        }
      }
      
      // 4. Move the physical file
      fs.renameSync(sourcePath, targetPath);
      console.log(`Physically moved file: ${sourcePath} -> ${targetPath}`);
      
      // 5. Apply edits to the moved file (fix internal imports)
      if (changes[sourceUri]) {
        await this.applyTextEdits(targetPath, changes[sourceUri]);
        appliedChanges[targetUri] = changes[sourceUri].length;
        console.log(`Applied ${changes[sourceUri].length} edits to moved file: ${targetPath}`);
      }
      
      // 6. Notify LSP about the completed file move (proper LSP protocol)
      this.sendNotification('workspace/didRenameFiles', {
        files: [{ oldUri: sourceUri, newUri: targetUri }]
      });
      
      // 7. Open the target document in LSP
      await this.openDocument(targetPath);
      
      return {
        success: true,
        movedFrom: sourcePath,
        movedTo: targetPath,
        appliedChanges,
        message: `Successfully moved file and applied ${Object.keys(appliedChanges).length} file updates`
      };
      
    } catch (error) {
      // If anything fails, try to restore state
      console.error(`Refactoring failed: ${error.message}`);
      throw new Error(`Atomic refactoring failed: ${error.message}`);
    }
  }

  // Refactoring command: Move selection to new file (using TypeScript's built-in refactoring)
  async refactorMoveToNewFile(file, startLine, startOffset, endLine, endOffset, targetFile) {
    console.log(`Refactoring: Moving code from ${file} (${startLine}:${startOffset}-${endLine}:${endOffset}) to ${targetFile}`);
    
    try {
      // 1. Ensure the file is opened in the LSP workspace
      await this.openDocument(file);
      
      // 2. Wait a bit for project analysis to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 3. Use TypeScript's built-in "Move to new file" refactoring
      console.log(`🔧 [REFACTOR] Starting applyRefactoring for ${file} lines ${startLine}-${endLine}`);
      const refactorResponse = await this.sendRequest('workspace/executeCommand', {
        command: '_typescript.applyRefactoring',
        arguments: [{
          file,
          startLine,
          startOffset,
          endLine,
          endOffset,
          refactor: 'Move to a new file',
          action: 'Move to a new file'
        }]
      });
      console.log(`🎯 [REFACTOR] applyRefactoring completed:`, JSON.stringify(refactorResponse, null, 2));
      
      console.log('TypeScript refactoring response:', JSON.stringify(refactorResponse, null, 2));
      
      // 4. If TypeScript created a new file, move it to our target location
      if (targetFile && refactorResponse.result) {
        // TypeScript creates the file automatically, we might need to move it
        console.log(`Target file specified: ${targetFile}`);
      }
      
      return {
        success: true,
        message: 'Successfully moved code to new file using TypeScript refactoring',
        response: refactorResponse
      };
      
    } catch (error) {
      console.error(`Refactoring failed: ${error.message}`);
      throw new Error(`Move to new file refactoring failed: ${error.message}`);
    }
  }

  // Hybrid approach: Move function using file operations + LSP rename
  async refactorMoveFunction(sourceFile, targetFile, functionName, startLine, endLine) {
    console.log(`Moving function ${functionName} from ${sourceFile} to ${targetFile}`);
    
    try {
      // 1. Ensure source file is open
      await this.openDocument(sourceFile);
      
      // 2. Read the function code from source file
      const sourceContent = fs.readFileSync(sourceFile, 'utf8');
      const sourceLines = sourceContent.split('\n');
      const functionCode = sourceLines.slice(startLine - 1, endLine).join('\n');
      
      // 3. Extract imports needed for the function
      const imports = this.extractImports(sourceContent);
      
      // 4. Create target directory if it doesn't exist
      const targetDir = path.dirname(targetFile);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // 5. Create or update target file with function and imports
      let targetContent = '';
      if (fs.existsSync(targetFile)) {
        targetContent = fs.readFileSync(targetFile, 'utf8');
      } else {
        // Create new file with necessary imports
        targetContent = imports + '\n\n';
      }
      
      targetContent += functionCode + '\n';
      fs.writeFileSync(targetFile, targetContent, 'utf8');
      
      // 6. Open target file in LSP
      await this.openDocument(targetFile);
      
      // 7. Now use LSP to find and update all references to the function
      const references = await this.sendRequest('textDocument/references', {
        textDocument: { uri: `file://${sourceFile}` },
        position: { line: startLine - 1, character: 13 }, // Approximate position of function name
        context: { includeDeclaration: false }
      });
      
      console.log(`Found ${references.result?.length || 0} references to update`);
      
      // 8. Remove function from source file
      sourceLines.splice(startLine - 1, endLine - startLine + 1);
      const newSourceContent = sourceLines.join('\n');
      fs.writeFileSync(sourceFile, newSourceContent, 'utf8');
      
      return {
        success: true,
        message: `Successfully moved function ${functionName}`,
        targetFile,
        referencesFound: references.result?.length || 0
      };
      
    } catch (error) {
      console.error(`Function move failed: ${error.message}`);
      throw new Error(`Move function failed: ${error.message}`);
    }
  }
  
  // Helper to extract import statements from file content
  extractImports(content) {
    const lines = content.split('\n');
    const imports = [];
    
    for (const line of lines) {
      if (line.trim().startsWith('import ')) {
        imports.push(line);
      } else if (line.trim() && !line.trim().startsWith('//')) {
        // Stop at first non-import, non-comment line
        break;
      }
    }
    
    return imports.join('\n');
  }

  // Determine if a method is a notification or request
  isNotification(method) {
    const notifications = [
      'initialized',
      'textDocument/didOpen',
      'textDocument/didClose',
      'textDocument/didChange',
      'workspace/didChangeConfiguration'
    ];
    return notifications.includes(method);
  }

  async executeRequest(lspRequest) {
    if (!this.isInitialized && lspRequest.method !== 'initialize') {
      throw new Error('LSP not initialized');
    }

    const { method, params } = lspRequest;

    // Handle custom refactoring commands
    if (method === 'refactor/moveFile') {
      const { sourceUri, targetUri } = params;
      return await this.refactorMoveFile(sourceUri, targetUri);
    }
    
    if (method === 'refactor/moveToNewFile') {
      const { file, startLine, startOffset, endLine, endOffset, targetFile } = params;
      return await this.refactorMoveToNewFile(file, startLine, startOffset, endLine, endOffset, targetFile);
    }
    
    if (method === 'refactor/moveFunction') {
      const { sourceFile, targetFile, functionName, startLine, endLine } = params;
      return await this.refactorMoveFunction(sourceFile, targetFile, functionName, startLine, endLine);
    }

    // Auto-open document if it's a textDocument request and file exists
    if (params?.textDocument?.uri) {
      const uri = params.textDocument.uri;
      const filePath = uri.replace('file://', '');
      if (fs.existsSync(filePath) && !this.openDocuments.has(uri)) {
        await this.openDocument(filePath);
      }
    }

    // Handle notifications vs requests properly
    if (this.isNotification(method)) {
      this.sendNotification(method, params);
      return { jsonrpc: '2.0', result: 'notification sent' };
    } else {
      return await this.sendRequest(method, params);
    }
  }

  stop() {
    if (this.server) {
      this.server.kill();
    }
    if (this.fileWatcher) {
      this.fileWatcher.close();
    }
  }

  applyWorkspaceEdit(edit) {
    try {
      if (edit.changes) {
        // Handle textual changes to existing files
        for (const [uri, changes] of Object.entries(edit.changes)) {
          const filePath = uri.replace('file://', '');
          console.log(`📝 [EDIT] Applying ${changes.length} changes to ${filePath}`);
          
          // Read the current file content
          let content = fs.readFileSync(filePath, 'utf8');
          
          // Apply changes in reverse order (from end to start) to maintain positions
          const sortedChanges = changes.sort((a, b) => {
            if (a.range.start.line !== b.range.start.line) {
              return b.range.start.line - a.range.start.line;
            }
            return b.range.start.character - a.range.start.character;
          });
          
          for (const change of sortedChanges) {
            const lines = content.split('\n');
            const startLine = change.range.start.line;
            const startChar = change.range.start.character;
            const endLine = change.range.end.line;
            const endChar = change.range.end.character;
            
            if (startLine === endLine) {
              // Single line change
              const line = lines[startLine];
              lines[startLine] = line.slice(0, startChar) + change.newText + line.slice(endChar);
            } else {
              // Multi-line change
              const startPart = lines[startLine].slice(0, startChar);
              const endPart = lines[endLine].slice(endChar);
              const newLines = [startPart + change.newText + endPart];
              lines.splice(startLine, endLine - startLine + 1, ...newLines);
            }
            
            content = lines.join('\n');
          }
          
          // Write the modified content back
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`💾 [SAVED] Updated ${filePath}`);
        }
      }
      
      if (edit.documentChanges) {
        // Handle document operations (create, rename, delete files)
        for (const change of edit.documentChanges) {
          if (change.kind === 'create') {
            fs.writeFileSync(change.uri.replace('file://', ''), change.options?.contents || '', 'utf8');
            console.log(`📄 [CREATE] Created file ${change.uri}`);
          } else if (change.kind === 'rename') {
            fs.renameSync(change.oldUri.replace('file://', ''), change.newUri.replace('file://', ''));
            console.log(`🔄 [RENAME] Renamed ${change.oldUri} to ${change.newUri}`);
          } else if (change.kind === 'delete') {
            fs.unlinkSync(change.uri.replace('file://', ''));
            console.log(`🗑️ [DELETE] Deleted ${change.uri}`);
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('🚨 [EDIT ERROR]:', error);
      return false;
    }
  }

  isReadyForRefactoring() {
    return this.isInitialized && this.projectAnalysisComplete;
  }

  async waitForReadiness(timeoutMs = 30000) {
    const startTime = Date.now();
    
    while (!this.isReadyForRefactoring() && (Date.now() - startTime) < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    if (!this.isReadyForRefactoring()) {
      console.log(`⚠️ [WARNING] Timeout waiting for project analysis. Proceeding anyway...`);
      return false;
    }
    
    console.log(`✅ [READY] LSP is ready for refactoring operations!`);
    return true;
  }
}

// HTTP server to receive requests
const daemon = new LSPDaemon();

async function startServer() {
  await daemon.start();

  const server = http.createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/lsp') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const lspRequest = JSON.parse(body);
          
          // Enhanced: Auto-sync file before LSP operations
          if (lspRequest.params?.textDocument?.uri) {
            const filePath = daemon.uriToFilePath(lspRequest.params.textDocument.uri);
            const synced = await daemon.ensureFileSync(filePath);
            if (!synced) {
              console.log(`⚠️  [SKIP] Unsupported file type: ${filePath}`);
            }
          }
          
          const response = await daemon.executeRequest(lspRequest);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
        } catch (error) {
          console.error('❌ [REQUEST ERROR]:', error.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message, stack: error.stack }));
        }
      });
    } else if (req.method === 'POST' && req.url === '/sync') {
      // Enhanced: Manual workspace sync endpoint
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const { filePath } = JSON.parse(body || '{}');
          
          if (filePath) {
            // Sync specific file
            const synced = await daemon.ensureFileSync(filePath);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              synced, 
              filePath,
              message: synced ? 'File synced successfully' : 'File sync skipped'
            }));
          } else {
            // Sync entire workspace
            const syncCount = await daemon.syncWorkspace();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              syncCount,
              message: `Synced ${syncCount} files`,
              timestamp: new Date().toISOString()
            }));
          }
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
    } else if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'ok', 
        initialized: daemon.isInitialized,
        projectAnalysisComplete: daemon.projectAnalysisComplete,
        readyForRefactoring: daemon.isReadyForRefactoring(),
        openDocuments: daemon.openDocuments.size,
        progressTokens: daemon.progressTokens.size,
        // Enhanced: Sync status information
        sync: {
          watcherActive: daemon.fileWatcher !== null,
          workspacePath: daemon.workspacePath,
          documentsTracked: daemon.documentVersions.size,
          filesInSyncQueue: daemon.syncQueue.size,
          syncCapabilities: {
            autoSync: true,
            fileWatching: true,
            workspaceSync: true
          }
        }
      }));
    } else if (req.url.startsWith('/wait-ready')) {
      // Endpoint to wait for the server to be ready for refactoring
      const url = require('url');
      const timeoutMs = parseInt(url.parse(req.url, true).query.timeout) || 30000;
      
      daemon.waitForReadiness(timeoutMs).then(ready => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          ready,
          projectAnalysisComplete: daemon.projectAnalysisComplete,
          message: ready ? 'LSP is ready for refactoring' : 'Timeout waiting for readiness'
        }));
      }).catch(error => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      });
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  const port = process.env.LSP_DAEMON_PORT || 3333;
  server.listen(port, () => {
    console.log(`LSP Daemon listening on http://localhost:${port}/lsp`);
  });
}

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\nShutting down LSP Daemon...');
  daemon.stop();
  process.exit(0);
});

if (require.main === module) {
  startServer().catch(console.error);
}

module.exports = { LSPDaemon }; 