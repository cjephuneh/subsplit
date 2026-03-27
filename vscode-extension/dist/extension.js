"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const SECRET_KEY = 'subsplit_api_key';
function activate(context) {
    console.log('Subsplit AI extension is now active!');
    let chatDisposable = vscode.commands.registerCommand('subsplit.chat', async () => {
        const panel = vscode.window.createWebviewPanel('subsplitChat', 'Subsplit AI', vscode.ViewColumn.Two, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        // Check if API key exists
        let apiKey = await context.secrets.get(SECRET_KEY);
        panel.webview.html = getWebviewContent(!!apiKey);
        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'login':
                    vscode.env.openExternal(vscode.Uri.parse('http://subsplit.co/dashboard'));
                    const key = await vscode.window.showInputBox({
                        prompt: 'Paste your Subsplit API Key',
                        password: true,
                        ignoreFocusOut: true
                    });
                    if (key) {
                        await context.secrets.store(SECRET_KEY, key);
                        vscode.window.showInformationMessage('Subsplit Wallet Connected! 💎');
                        panel.webview.html = getWebviewContent(true);
                    }
                    return;
                case 'logout':
                    await context.secrets.delete(SECRET_KEY);
                    vscode.window.showInformationMessage('Subsplit Wallet Disconnected.');
                    panel.webview.html = getWebviewContent(false);
                    return;
                case 'chat':
                    // Context Awareness: Read the active file and selection
                    let fileContextStr = "";
                    const editor = vscode.window.activeTextEditor;
                    if (editor) {
                        const fileName = editor.document.fileName.split(/[\\/]/).pop() || "unknown file";
                        const selection = editor.selection;
                        if (!selection.isEmpty) {
                            const selectedLines = selection.end.line - selection.start.line + 1;
                            fileContextStr = "I see you have **" + selectedLines + " lines highlighted** in `" + fileName + "`!\n\n";
                        }
                        else {
                            fileContextStr = "I noticed you are currently viewing `" + fileName + "` in your editor.\n\n";
                        }
                    }
                    else {
                        fileContextStr = "You don't have any files actively open.\n\n";
                    }
                    // Create a highly realistic simulated streaming response
                    const templatePath = path.join(__dirname, '../src/response.md');
                    let templateMarkdown = "";
                    try {
                        templateMarkdown = fs.readFileSync(templatePath, 'utf8');
                    }
                    catch (e) {
                        templateMarkdown = "```javascript\nconsole.log('Template missing');\n```";
                    }
                    const replacementStr = 'reusable ' + (message.text || 'React') + ' component';
                    const responseMarkdown = fileContextStr + templateMarkdown.replace('reusable component', replacementStr);
                    panel.webview.postMessage({ command: 'assistant_start' });
                    let i = 0;
                    const chunkSize = 4; // characters per chunk
                    const interval = setInterval(() => {
                        if (i < responseMarkdown.length) {
                            const chunk = responseMarkdown.slice(i, i + chunkSize);
                            panel.webview.postMessage({ command: 'assistant_chunk', chunk });
                            i += chunkSize;
                        }
                        else {
                            clearInterval(interval);
                            panel.webview.postMessage({ command: 'assistant_end' });
                        }
                    }, 15);
                    return;
            }
        }, undefined, context.subscriptions);
    });
    let loginDisposable = vscode.commands.registerCommand('subsplit.login', async () => {
        const key = await vscode.window.showInputBox({
            prompt: 'Paste your Subsplit API Key',
            password: true,
            ignoreFocusOut: true
        });
        if (key) {
            await context.secrets.store(SECRET_KEY, key);
            vscode.window.showInformationMessage('Subsplit Wallet Connected! 💎');
        }
    });
    let logoutDisposable = vscode.commands.registerCommand('subsplit.logout', async () => {
        await context.secrets.delete(SECRET_KEY);
        vscode.window.showInformationMessage('Subsplit Wallet Disconnected.');
    });
    context.subscriptions.push(chatDisposable, loginDisposable, logoutDisposable);
}
function deactivate() { }
function getWebviewContent(isLoggedIn) {
    if (!isLoggedIn) {
        return [
            "<!DOCTYPE html>",
            "<html lang='en'>",
            "<head>",
            "    <meta charset='UTF-8'>",
            "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>",
            "    <title>Subsplit AI</title>",
            "    <style>",
            "        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }",
            "        .hero { max-width: 400px; display: flex; flex-direction: column; align-items: center; gap: 1rem; }",
            "        .logo { width: 64px; height: 64px; border-radius: 16px; background: var(--vscode-editor-foreground); color: var(--vscode-editor-background); display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold; margin-bottom: 1rem; }",
            "        h1 { font-size: 1.5rem; margin: 0; font-weight: 600; }",
            "        p { color: var(--vscode-descriptionForeground); margin: 0 0 1rem 0; line-height: 1.5; font-size: 0.95rem; }",
            "        button { padding: 12px 24px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; cursor: pointer; border-radius: 8px; font-weight: 600; font-size: 0.95rem; width: 100%; transition: opacity 0.2s; }",
            "        button:hover { opacity: 0.9; }",
            "    </style>",
            "</head>",
            "<body>",
            "    <div class='hero'>",
            "        <div class='logo'>💎</div>",
            "        <h1>Welcome to Subsplit Auto-Pilot</h1>",
            "        <p>Your drop-in AI coding assistant. Access GPT-4, Claude 3.5 Sonnet, and more from a single, unified wallet balance.</p>",
            "        <button onclick='login()'>Connect Wallet</button>",
            "    </div>",
            "    <script>",
            "        const vscode = acquireVsCodeApi();",
            "        function login() { vscode.postMessage({ command: 'login' }); }",
            "    </script>",
            "</body>",
            "</html>"
        ].join("\n");
    }
    return [
        "<!DOCTYPE html>",
        "<html lang='en'>",
        "<head>",
        "    <meta charset='UTF-8'>",
        "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>",
        "    <title>Subsplit AI</title>",
        "    <!-- Marked & Highlight.js for Claude-like code rendering -->",
        "    <script src='https://cdn.jsdelivr.net/npm/marked/marked.min.js'></script>",
        "    <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'>",
        "    <script src='https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js'></script>",
        "    <style>",
        "        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: var(--vscode-editor-background); display: flex; flex-direction: column; padding: 0; margin: 0; height: 100vh; }",
        "        .header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; border-bottom: 1px solid var(--vscode-panel-border); }",
        "        .header h2 { margin: 0; font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }",
        "        .logout-btn { background: transparent; color: var(--vscode-descriptionForeground); border: none; cursor: pointer; font-size: 0.85rem; padding: 0; }",
        "        .logout-btn:hover { color: var(--vscode-editor-foreground); }",
        "        .chat-container { flex: 1; overflow-y: auto; padding: 2rem; display: flex; flex-direction: column; gap: 2rem; }",
        "        .message-row { display: flex; gap: 1rem; max-width: 800px; margin: 0 auto; width: 100%; }",
        "        .avatar { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; font-weight: 600; }",
        "        .avatar.user { background: var(--vscode-editor-foreground); color: var(--vscode-editor-background); }",
        "        .avatar.assistant { background: transparent; border: 1px solid var(--vscode-panel-border); color: var(--vscode-editor-foreground); }",
        "        .message-content { flex: 1; color: var(--vscode-editor-foreground); line-height: 1.6; font-size: 0.95rem; }",
        "        .message-content p { margin-top: 0; margin-bottom: 1rem; }",
        "        .message-content p:last-child { margin-bottom: 0; }",
        "        .message-content pre { background-color: #0d1117 !important; border-radius: 8px; padding: 1.2rem; position: relative; border: 1px solid var(--vscode-panel-border); overflow-x: auto; margin: 1rem 0; }",
        "        .message-content code { font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace; font-size: 0.9em; }",
        "        .message-content p > code { background: var(--vscode-textCodeBlock-background); padding: 0.2rem 0.4rem; border-radius: 4px; }",
        "        .copy-btn { position: absolute; top: 0.5rem; right: 0.5rem; background: #21262d; border: 1px solid #30363d; color: #c9d1d9; border-radius: 6px; padding: 0.3rem 0.8rem; cursor: pointer; font-size: 0.75rem; opacity: 0; transition: opacity 0.2s, background 0.2s; font-weight: 500; }",
        "        .message-content pre:hover .copy-btn { opacity: 1; }",
        "        .copy-btn:hover { background: #30363d; }",
        "        .input-container { padding: 1.5rem 2rem; border-top: 1px solid var(--vscode-panel-border); background: var(--vscode-editor-background); display: flex; justify-content: center; }",
        "        .input-box { display: flex; flex-direction: column; max-width: 800px; width: 100%; border: 1px solid var(--vscode-input-border); border-radius: 12px; background: var(--vscode-input-background); box-shadow: 0 4px 12px -2px rgb(0 0 0 / 0.2); overflow: hidden; transition: border-color 0.2s; }",
        "        .input-box:focus-within { border-color: var(--vscode-focusBorder); }",
        "        .input-box textarea { width: 100%; border: none; background: transparent; padding: 1rem; color: var(--vscode-input-foreground); font-family: inherit; font-size: 0.95rem; resize: none; outline: none; box-sizing: border-box; min-height: 80px; }",
        "        .input-controls { display: flex; justify-content: space-between; padding: 0.5rem 1rem; background: var(--vscode-editorWidget-background); border-top: 1px solid var(--vscode-widget-border); align-items: center; }",
        "        .model-select { background: transparent; color: var(--vscode-descriptionForeground); border: none; font-size: 0.85rem; outline: none; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; font-weight: 500; }",
        "        .model-select select { background: transparent; border: none; color: inherit; outline: none; cursor: pointer; font-family: inherit; font-weight: 500; }",
        "        .send-btn { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 6px; padding: 0.4rem 1.2rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s; font-size: 0.85rem; }",
        "        .send-btn:hover { opacity: 0.9; }",
        "        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }",
        "    </style>",
        "</head>",
        "<body>",
        "    <div class='header'>",
        "        <h2>💎 Subsplit Auto-Pilot</h2>",
        "        <button class='logout-btn' onclick='logout()'>Disconnect Wallet</button>",
        "    </div>",
        "    <div class='chat-container' id='chat'>",
        "    </div>",
        "    <div class='input-container'>",
        "        <div class='input-box'>",
        "            <textarea id='prompt' placeholder='Ask a coding question...' onkeydown='if(event.key === \"Enter\" && !event.shiftKey) send(event)'></textarea>",
        "            <div class='input-controls'>",
        "                <div class='model-select'>",
        "                    Model:",
        "                    <select id='model'>",
        "                        <option value='claude-3-5-sonnet'>Claude 3.5 Sonnet</option>",
        "                        <option value='gpt-4o'>GPT-4o</option>",
        "                        <option value='grok'>Grok</option>",
        "                    </select>",
        "                </div>",
        "                <button class='send-btn' id='send-btn' onclick='send(event)'>Send</button>",
        "            </div>",
        "        </div>",
        "    </div>",
        "    <script>",
        "        const vscode = acquireVsCodeApi();",
        "        const chatBox = document.getElementById('chat');",
        "        const sendBtn = document.getElementById('send-btn');",
        "        let currentAssistantMessageDiv = null;",
        "        let currentAssistantMarkdown = '';",
        "        ",
        "        marked.setOptions({ breaks: true, gfm: true });",
        "",
        "        function logout() { vscode.postMessage({ command: 'logout' }); }",
        "",
        "        function scrollToBottom() { chatBox.scrollTop = chatBox.scrollHeight; }",
        "",
        "        function escapeHtml(unsafe) {",
        "            return unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');",
        "        }",
        "",
        "        window.addEventListener('message', event => {",
        "            const message = event.data;",
        "            switch (message.command) {",
        "                case 'assistant_start':",
        "                    sendBtn.disabled = true;",
        "                    currentAssistantMarkdown = '';",
        "                    const row = document.createElement('div');",
        "                    row.className = 'message-row';",
        "                    row.innerHTML = '<div class=\"avatar assistant\">💎</div><div class=\"message-content\" id=\"active-message\"></div>';",
        "                    chatBox.appendChild(row);",
        "                    currentAssistantMessageDiv = row.querySelector('#active-message');",
        "                    scrollToBottom();",
        "                    break;",
        "                case 'assistant_chunk':",
        "                    currentAssistantMarkdown += message.chunk;",
        "                    if(currentAssistantMessageDiv) {",
        "                        currentAssistantMessageDiv.innerHTML = marked.parse(currentAssistantMarkdown);",
        "                        currentAssistantMessageDiv.querySelectorAll('pre code').forEach((block) => {",
        "                            if (!block.classList.contains('hljs')) {",
        "                                hljs.highlightElement(block);",
        "                            }",
        "                        });",
        "                        injectCopyButtons(currentAssistantMessageDiv);",
        "                    }",
        "                    scrollToBottom();",
        "                    break;",
        "                case 'assistant_end':",
        "                    if (currentAssistantMessageDiv) {",
        "                        currentAssistantMessageDiv.removeAttribute('id');",
        "                    }",
        "                    currentAssistantMessageDiv = null;",
        "                    sendBtn.disabled = false;",
        "                    document.getElementById('prompt').focus();",
        "                    scrollToBottom();",
        "                    break;",
        "            }",
        "        });",
        "",
        "        function injectCopyButtons(container) {",
        "            const pres = container.querySelectorAll('pre');",
        "            pres.forEach(pre => {",
        "                if(pre.querySelector('.copy-btn')) return;",
        "                const btn = document.createElement('button');",
        "                btn.className = 'copy-btn';",
        "                btn.innerText = 'Copy';",
        "                btn.onclick = () => {",
        "                    const code = pre.querySelector('code').innerText;",
        "                    navigator.clipboard.writeText(code);",
        "                    btn.innerText = 'Copied!';",
        "                    setTimeout(() => { btn.innerText = 'Copy'; }, 2000);",
        "                };",
        "                pre.appendChild(btn);",
        "            });",
        "        }",
        "",
        "        function send(e) {",
        "            if (e) e.preventDefault();",
        "            const input = document.getElementById('prompt');",
        "            const model = document.getElementById('model').value;",
        "            const text = input.value.trim();",
        "            if(!text || sendBtn.disabled) return;",
        "            ",
        "            const row = document.createElement('div');",
        "            row.className = 'message-row';",
        "            row.innerHTML = '<div class=\"avatar user\">U</div><div class=\"message-content\"><p>' + escapeHtml(text) + '</p></div>';",
        "            chatBox.appendChild(row);",
        "            ",
        "            vscode.postMessage({ command: 'chat', text: text, model: model });",
        "            input.value = '';",
        "            scrollToBottom();",
        "        }",
        "        ",
        "        setTimeout(() => {",
        "            const row = document.createElement('div');",
        "            row.className = 'message-row';",
        "            row.innerHTML = '<div class=\"avatar assistant\">💎</div><div class=\"message-content\"><p>You are securely connected to your Subsplit Wallet! How can I help you build today?</p></div>';",
        "            chatBox.appendChild(row);",
        "        }, 100);",
        "    </script>",
        "</body>",
        "</html>"
    ].join("\n");
}
//# sourceMappingURL=extension.js.map