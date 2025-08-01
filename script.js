// NoteForge - Advanced Writing Application
// Version 1.0.0
// Credits: @itzpanth solutions & @tintools solutions

class NoteForgeApp {
    constructor() {
        this.documents = this.loadDocuments();
        this.currentDocument = null;
        this.editor = null;
        this.dropboxClient = null;
        this.settings = this.loadSettings();
        this.autoSaveInterval = null;
        
        this.init();
    }

    init() {
        this.initializeEditor();
        this.initializeEventListeners();
        this.applySettings();
        this.renderDocumentsList();
        this.initializeLucideIcons();
        this.setupAutoSave();
        
        // Show welcome screen if no documents
        if (this.documents.length === 0) {
            this.showWelcomeScreen();
        } else {
            this.loadDocument(this.documents[0].id);
        }
    }

    initializeLucideIcons() {
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    initializeEditor() {
        this.editor = new Quill('#editor', {
            theme: 'snow',
            placeholder: 'Start writing your thoughts...',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'font': [] }],
                    [{ 'align': [] }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    ['blockquote', 'code-block'],
                    ['link', 'image'],
                    ['clean']
                ]
            }
        });

        // Listen for text changes
        this.editor.on('text-change', () => {
            this.updateWordCount();
            if (this.currentDocument) {
                this.currentDocument.lastModified = new Date().toISOString();
                this.currentDocument.content = this.editor.getContents();
                this.currentDocument.text = this.editor.getText();
                
                if (this.settings.autoSave) {
                    this.markAsUnsaved();
                }
            }
        });
    }

    initializeEventListeners() {
        // Mobile menu
        document.getElementById('menuToggle').addEventListener('click', () => {
            this.toggleSidebar();
        });

        document.getElementById('sidebarClose').addEventListener('click', () => {
            this.closeSidebar();
        });

        // Document actions
        document.getElementById('newDocBtn').addEventListener('click', () => {
            this.createNewDocument();
        });

        document.getElementById('welcomeNewBtn').addEventListener('click', () => {
            this.createNewDocument();
        });

        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveDocument();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.showExportModal();
        });

        document.getElementById('deleteBtn').addEventListener('click', () => {
            this.deleteCurrentDocument();
        });

        // Sync
        document.getElementById('syncBtn').addEventListener('click', () => {
            this.syncWithDropbox();
        });

        document.getElementById('mobileSyncBtn').addEventListener('click', () => {
            this.syncWithDropbox();
        });

        // Modals
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showSettingsModal();
        });

        document.getElementById('aboutBtn').addEventListener('click', () => {
            this.showAboutModal();
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        // Overlay
        document.getElementById('overlay').addEventListener('click', () => {
            this.closeAllModals();
        });

        // Settings
        document.getElementById('themeSelect').addEventListener('change', (e) => {
            this.changeTheme(e.target.value);
        });

        document.getElementById('fontSelect').addEventListener('change', (e) => {
            this.changeFontFamily(e.target.value);
        });

        document.getElementById('fontSizeSlider').addEventListener('input', (e) => {
            this.changeFontSize(e.target.value);
        });

        document.getElementById('lineHeightSlider').addEventListener('input', (e) => {
            this.changeLineHeight(e.target.value);
        });

        document.getElementById('autoSave').addEventListener('change', (e) => {
            this.toggleAutoSave(e.target.checked);
        });

        document.getElementById('connectDropbox').addEventListener('click', () => {
            this.connectDropbox();
        });

        // Export options
        document.querySelectorAll('.export-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const format = e.currentTarget.dataset.format;
                this.exportDocument(format);
            });
        });

        // Document title
        document.getElementById('documentTitle').addEventListener('input', (e) => {
            if (this.currentDocument) {
                this.currentDocument.title = e.target.value || 'Untitled Document';
                this.renderDocumentsList();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveDocument();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.createNewDocument();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.showExportModal();
                        break;
                }
            }
        });

        // Responsive behavior
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    // Document Management
    createNewDocument() {
        const doc = {
            id: this.generateId(),
            title: 'Untitled Document',
            content: { ops: [] },
            text: '',
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            wordCount: 0,
            charCount: 0
        };

        this.documents.unshift(doc);
        this.saveDocuments();
        this.loadDocument(doc.id);
        this.showEditorScreen();
        this.renderDocumentsList();
        
        this.showToast('New document created', 'success');
    }

    loadDocument(id) {
        const doc = this.documents.find(d => d.id === id);
        if (!doc) return;

        this.currentDocument = doc;
        this.editor.setContents(doc.content);
        document.getElementById('documentTitle').value = doc.title;
        
        this.updateWordCount();
        this.updateLastSaved();
        this.renderDocumentsList();
    }

    saveDocument() {
        if (!this.currentDocument) return;

        this.currentDocument.content = this.editor.getContents();
        this.currentDocument.text = this.editor.getText();
        this.currentDocument.lastModified = new Date().toISOString();
        
        this.saveDocuments();
        this.updateLastSaved();
        
        this.showToast('Document saved', 'success');
    }

    deleteCurrentDocument() {
        if (!this.currentDocument) return;

        if (confirm('Are you sure you want to delete this document?')) {
            this.documents = this.documents.filter(d => d.id !== this.currentDocument.id);
            this.saveDocuments();
            
            if (this.documents.length > 0) {
                this.loadDocument(this.documents[0].id);
            } else {
                this.showWelcomeScreen();
            }
            
            this.renderDocumentsList();
            this.showToast('Document deleted', 'info');
        }
    }

    // UI Management
    showWelcomeScreen() {
        document.getElementById('welcomeScreen').style.display = 'flex';
        document.getElementById('editorScreen').style.display = 'none';
        this.currentDocument = null;
    }

    showEditorScreen() {
        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('editorScreen').style.display = 'flex';
    }

    renderDocumentsList() {
        const container = document.getElementById('documentsList');
        container.innerHTML = '';

        this.documents.forEach(doc => {
            const item = document.createElement('div');
            item.className = `document-item ${this.currentDocument?.id === doc.id ? 'active' : ''}`;
            item.innerHTML = `
                <i data-lucide="file-text"></i>
                <div class="document-info">
                    <div class="document-title">${doc.title}</div>
                    <div class="document-meta">${this.formatDate(doc.lastModified)} • ${doc.wordCount} words</div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.loadDocument(doc.id);
                this.showEditorScreen();
                if (window.innerWidth <= 768) {
                    this.closeSidebar();
                }
            });

            container.appendChild(item);
        });

        // Re-initialize icons
        this.initializeLucideIcons();
    }

    updateWordCount() {
        if (!this.editor) return;

        const text = this.editor.getText();
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        const wordCount = words.length;
        const charCount = text.length;

        document.getElementById('wordCount').textContent = `${wordCount} words`;
        document.getElementById('charCount').textContent = `${charCount} characters`;

        if (this.currentDocument) {
            this.currentDocument.wordCount = wordCount;
            this.currentDocument.charCount = charCount;
        }
    }

    updateLastSaved() {
        const now = new Date();
        document.getElementById('lastSaved').textContent = `Saved at ${now.toLocaleTimeString()}`;
    }

    markAsUnsaved() {
        document.getElementById('lastSaved').textContent = 'Unsaved changes';
    }

    // Modal Management
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        const overlay = document.getElementById('overlay');
        
        modal.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modal) {
        modal.classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
        document.body.style.overflow = '';
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        document.getElementById('overlay').classList.remove('active');
        document.body.style.overflow = '';
    }

    showSettingsModal() {
        // Update settings form with current values
        document.getElementById('themeSelect').value = this.settings.theme;
        document.getElementById('fontSelect').value = this.settings.fontFamily;
        document.getElementById('fontSizeSlider').value = this.settings.fontSize;
        document.getElementById('fontSizeValue').textContent = `${this.settings.fontSize}px`;
        document.getElementById('lineHeightSlider').value = this.settings.lineHeight;
        document.getElementById('lineHeightValue').textContent = this.settings.lineHeight;
        document.getElementById('autoSave').checked = this.settings.autoSave;
        document.getElementById('dropboxKey').value = this.settings.dropboxKey || '';
        
        this.updateDropboxStatus();
        this.showModal('settingsModal');
    }

    showAboutModal() {
        this.showModal('aboutModal');
    }

    showExportModal() {
        if (!this.currentDocument) {
            this.showToast('No document to export', 'error');
            return;
        }
        this.showModal('exportModal');
    }

    // Settings Management
    loadSettings() {
        const defaultSettings = {
            theme: 'light',
            fontFamily: 'inter',
            fontSize: 16,
            lineHeight: 1.6,
            autoSave: true,
            dropboxKey: null,
            dropboxConnected: false
        };

        const saved = localStorage.getItem('noteforge-settings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    }

    saveSettings() {
        localStorage.setItem('noteforge-settings', JSON.stringify(this.settings));
    }

    applySettings() {
        this.changeTheme(this.settings.theme);
        this.changeFontFamily(this.settings.fontFamily);
        this.changeFontSize(this.settings.fontSize);
        this.changeLineHeight(this.settings.lineHeight);
        this.toggleAutoSave(this.settings.autoSave);
        
        if (this.settings.dropboxKey) {
            this.initializeDropbox();
        }
    }

    changeTheme(theme) {
        this.settings.theme = theme;
        
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            theme = prefersDark ? 'dark' : 'light';
        }
        
        document.documentElement.setAttribute('data-theme', theme);
        this.saveSettings();
    }

    changeFontFamily(family) {
        this.settings.fontFamily = family;
        
        const fontMap = {
            inter: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            crimson: 'Crimson Pro, Georgia, serif',
            georgia: 'Georgia, Times, serif',
            system: '-apple-system, BlinkMacSystemFont, sans-serif'
        };

        document.documentElement.style.setProperty('--font-secondary', fontMap[family]);
        this.saveSettings();
    }

    changeFontSize(size) {
        this.settings.fontSize = parseInt(size);
        document.getElementById('fontSizeValue').textContent = `${size}px`;
        
        if (this.editor) {
            document.querySelector('.ql-editor').style.fontSize = `${size}px`;
        }
        
        this.saveSettings();
    }

    changeLineHeight(height) {
        this.settings.lineHeight = parseFloat(height);
        document.getElementById('lineHeightValue').textContent = height;
        
        if (this.editor) {
            document.querySelector('.ql-editor').style.lineHeight = height;
        }
        
        this.saveSettings();
    }

    toggleAutoSave(enabled) {
        this.settings.autoSave = enabled;
        this.saveSettings();
        
        if (enabled) {
            this.setupAutoSave();
        } else {
            this.clearAutoSave();
        }
    }

    setupAutoSave() {
        this.clearAutoSave();
        
        if (this.settings.autoSave) {
            this.autoSaveInterval = setInterval(() => {
                if (this.currentDocument && document.getElementById('lastSaved').textContent === 'Unsaved changes') {
                    this.saveDocument();
                }
            }, 30000); // 30 seconds
        }
    }

    clearAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    // Dropbox Integration
    connectDropbox() {
        const key = document.getElementById('dropboxKey').value.trim();
        if (!key) {
            this.showToast('Please enter your Dropbox App Key', 'error');
            return;
        }

        this.settings.dropboxKey = key;
        this.saveSettings();
        this.initializeDropbox();
    }

    initializeDropbox() {
        if (!this.settings.dropboxKey) return;

        try {
            this.dropboxClient = new Dropbox.Dropbox({
                clientId: this.settings.dropboxKey,
                fetch: fetch
            });

            this.authenticateDropbox();
        } catch (error) {
            console.error('Dropbox initialization failed:', error);
            this.showToast('Failed to initialize Dropbox', 'error');
        }
    }

    authenticateDropbox() {
        if (!this.dropboxClient) return;

        // Check if we have an access token
        const token = localStorage.getItem('dropbox-access-token');
        
        if (token) {
            this.dropboxClient.setAccessToken(token);
            this.settings.dropboxConnected = true;
            this.updateDropboxStatus();
            this.saveSettings();
        } else {
            // Redirect to Dropbox OAuth
            const authUrl = this.dropboxClient.getAuthenticationUrl(window.location.origin);
            window.location.href = authUrl;
        }
    }

    updateDropboxStatus() {
        const status = document.getElementById('dropboxStatus');
        if (this.settings.dropboxConnected) {
            status.textContent = 'Connected';
            status.style.color = '#10b981';
        } else {
            status.textContent = 'Not connected';
            status.style.color = '#ef4444';
        }
    }

    async syncWithDropbox() {
        if (!this.dropboxClient || !this.settings.dropboxConnected) {
            this.showToast('Dropbox not connected', 'error');
            return;
        }

        try {
            this.showToast('Syncing with Dropbox...', 'info');
            
            // Upload current documents
            const data = JSON.stringify(this.documents);
            await this.dropboxClient.filesUpload({
                path: '/noteforge-documents.json',
                contents: data,
                mode: 'overwrite',
                autorename: true
            });

            this.showToast('Sync completed successfully', 'success');
        } catch (error) {
            console.error('Dropbox sync failed:', error);
            this.showToast('Sync failed', 'error');
        }
    }

    // Export Functionality
    exportDocument(format) {
        if (!this.currentDocument) return;

        const title = this.currentDocument.title;
        const content = this.currentDocument.text;
        const htmlContent = this.editor.root.innerHTML;

        let data, mimeType, extension;

        switch (format) {
            case 'txt':
                data = content;
                mimeType = 'text/plain';
                extension = 'txt';
                break;
            case 'html':
                data = `<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
        h1, h2, h3 { color: #333; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    ${htmlContent}
</body>
</html>`;
                mimeType = 'text/html';
                extension = 'html';
                break;
            case 'md':
                data = this.convertToMarkdown(htmlContent);
                mimeType = 'text/markdown';
                extension = 'md';
                break;
            case 'json':
                data = JSON.stringify({
                    title: title,
                    content: this.currentDocument.content,
                    text: content,
                    createdAt: this.currentDocument.createdAt,
                    lastModified: this.currentDocument.lastModified,
                    wordCount: this.currentDocument.wordCount
                }, null, 2);
                mimeType = 'application/json';
                extension = 'json';
                break;
        }

        this.downloadFile(data, `${title}.${extension}`, mimeType);
        this.closeModal(document.getElementById('exportModal'));
        this.showToast(`Exported as ${format.toUpperCase()}`, 'success');
    }

    convertToMarkdown(html) {
        // Simple HTML to Markdown conversion
        return html
            .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
            .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
            .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
            .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
            .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
            .replace(/<u[^>]*>(.*?)<\/u>/gi, '_$1_')
            .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
            .replace(/<br[^>]*>/gi, '\n')
            .replace(/<[^>]*>/g, '')
            .replace(/\n\n+/g, '\n\n')
            .trim();
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Responsive Behavior
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('open');
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.remove('open');
    }

    handleResize() {
        if (window.innerWidth > 768) {
            this.closeSidebar();
        }
    }

    // Utility Functions
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return 'Today';
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return `${days} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // Data Persistence
    loadDocuments() {
        const saved = localStorage.getItem('noteforge-documents');
        return saved ? JSON.parse(saved) : [];
    }

    saveDocuments() {
        localStorage.setItem('noteforge-documents', JSON.stringify(this.documents));
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Handle Dropbox OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        // Store the access token (in a real app, you'd exchange the code for a token)
        localStorage.setItem('dropbox-access-token', code);
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Initialize the app
    window.noteForgeApp = new NoteForgeApp();
});

// Service Worker Registration (for PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Handle theme changes based on system preference
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (window.noteForgeApp && window.noteForgeApp.settings.theme === 'auto') {
        const theme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
    }
});

// Prevent data loss on page unload
window.addEventListener('beforeunload', (e) => {
    if (window.noteForgeApp && document.getElementById('lastSaved').textContent === 'Unsaved changes') {
        e.preventDefault();
        e.returnValue = '';
        return 'You have unsaved changes. Are you sure you want to leave?';
    }
});

// Global error handling
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    if (window.noteForgeApp) {
        window.noteForgeApp.showToast('An error occurred', 'error');
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NoteForgeApp;
}