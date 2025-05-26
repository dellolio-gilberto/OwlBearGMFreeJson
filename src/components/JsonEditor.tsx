import React, { useState, useEffect } from "react";

interface JsonEditorProps {
    isOpen: boolean;
    onClose: () => void;
    slug: string; // ✅ CAMBIATO: prendi lo slug dal token
    proxyUrl: string; // ✅ AGGIUNTO: il proxy URL
    onSave: (editedJson: any) => void;
    title?: string;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({
    isOpen,
    onClose,
    slug, // ✅ CAMBIATO: slug invece di jsonData
    proxyUrl, // ✅ AGGIUNTO: proxyUrl
    onSave,
    title = "Edit JSON"
}) => {
    const [jsonText, setJsonText] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isValid, setIsValid] = useState(true);
    const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('raw');
    const [isLoading, setIsLoading] = useState(false); // ✅ AGGIUNTO: loading state

    // ✅ CAMBIATO: Fetch JSON dall'endpoint invece di usare jsonData
    useEffect(() => {
        if (isOpen && slug && proxyUrl) {
            const fetchJsonFromEndpoint = async () => {
                setIsLoading(true);
                setError(null);
                
                try {
                    const response = await fetch(`${proxyUrl}/edit/statblock/${slug}`);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch: ${response.status}`);
                    }
                    const data = await response.json();
                    setJsonText(JSON.stringify(data, null, 2));
                    setIsValid(true);
                } catch (err) {
                    setError(`Failed to load JSON: ${err instanceof Error ? err.message : String(err)}`);
                    setJsonText("");
                    setIsValid(false);
                } finally {
                    setIsLoading(false);
                }
            };
            
            fetchJsonFromEndpoint();
        }
    }, [isOpen, slug, proxyUrl]);

    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setJsonText(value);
        
        try {
            JSON.parse(value);
            setError(null);
            setIsValid(true);
        } catch (err) {
            setError("Invalid JSON format");
            setIsValid(false);
        }
    };

    // ✅ CAMBIATO: Salva sul proxy con POST
    const handleSave = async () => {
        if (!isValid) {
            setError("Cannot save invalid JSON");
            return;
        }

        setIsLoading(true);
        try {
            const parsedJson = JSON.parse(jsonText);
            
            // ✅ POST sul proxy
            const response = await fetch(`${proxyUrl}/edit/statblock/${slug}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: jsonText
            });

            if (!response.ok) {
                throw new Error(`Save failed: ${response.status}`);
            }

            onSave(parsedJson); // Callback per aggiornare UI locale
            onClose();
        } catch (err) {
            setError(`Save failed: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormat = () => {
        try {
            const parsed = JSON.parse(jsonText);
            setJsonText(JSON.stringify(parsed, null, 2));
            setError(null);
            setIsValid(true);
        } catch (err) {
            setError("Cannot format invalid JSON");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="json-editor-overlay">
            <div className="json-editor-modal">
                <div className="json-editor-header">
                    <h2 className="json-editor-title">{title}</h2>
                    <div className="json-editor-controls">
                        <div className="view-toggle">
                            <button 
                                className={`toggle-btn ${viewMode === 'formatted' ? 'active' : ''}`}
                                onClick={() => setViewMode('formatted')}
                                disabled={!isValid || isLoading}
                            >
                                👁️ Preview
                            </button>
                            <button 
                                className={`toggle-btn ${viewMode === 'raw' ? 'active' : ''}`}
                                onClick={() => setViewMode('raw')}
                                disabled={isLoading}
                            >
                                ✏️ Edit
                            </button>
                        </div>
                        <button 
                            className="json-editor-close"
                            onClick={onClose}
                            aria-label="Close editor"
                            disabled={isLoading}
                        >
                            ✕
                        </button>
                    </div>
                </div>
                
                <div className="json-editor-toolbar">
                    <div className="toolbar-left">
                        <button 
                            className="json-editor-btn json-editor-btn-secondary"
                            onClick={handleFormat}
                            disabled={!isValid || isLoading}
                            title="Format and prettify JSON"
                        >
                            🎨 Format
                        </button>
                        <span className="json-status">
                            {isLoading ? (
                                <span className="status-loading">⏳ Loading...</span>
                            ) : isValid ? (
                                <span className="status-valid">✅ Valid JSON</span>
                            ) : (
                                <span className="status-invalid">❌ Invalid JSON</span>
                            )}
                        </span>
                    </div>
                    {error && (
                        <span className="json-editor-error">
                            ⚠️ {error}
                        </span>
                    )}
                </div>

                <div className="json-editor-content">
                    {isLoading ? (
                        <div className="json-loading">
                            <div className="loading-spinner">⏳ Loading JSON from server...</div>
                        </div>
                    ) : viewMode === 'formatted' && isValid ? (
                        <div className="json-viewer">
                            <JsonTreeView data={JSON.parse(jsonText)} />
                        </div>
                    ) : (
                        <div className="json-raw-editor">
                            <textarea
                                className={`json-editor-textarea ${!isValid ? 'json-editor-textarea-error' : ''}`}
                                value={jsonText}
                                onChange={handleJsonChange}
                                placeholder="Loading JSON from server..."
                                spellCheck={false}
                                disabled={isLoading}
                            />
                        </div>
                    )}
                </div>

                <div className="json-editor-footer">
                    <div className="footer-info">
                        <span className="char-count">
                            {jsonText.length} characters
                        </span>
                        {viewMode === 'formatted' && (
                            <span className="view-hint">
                                💡 Switch to Edit mode to modify
                            </span>
                        )}
                    </div>
                    <div className="footer-buttons">
                        <button 
                            className="json-editor-btn json-editor-btn-secondary"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button 
                            className="json-editor-btn json-editor-btn-primary"
                            onClick={handleSave}
                            disabled={!isValid || isLoading}
                        >
                            {isLoading ? "⏳ Saving..." : "💾 Save Changes"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ✅ JsonTreeView rimane IDENTICO al file originale
const JsonTreeView: React.FC<{ data: any; level?: number }> = ({ data, level = 0 }) => {
    const [collapsed, setCollapsed] = useState<{[key: string]: boolean}>({});
    
    const toggleCollapse = (key: string) => {
        setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const renderValue = (key: string, value: any, index: number) => {
        const isCollapsed = collapsed[`${level}-${key}`];
        
        if (typeof value === 'object' && value !== null) {
            const isArray = Array.isArray(value);
            const isEmpty = isArray ? value.length === 0 : Object.keys(value).length === 0;
            
            return (
                <div key={index} className="json-tree-item">
                    <div 
                        className="json-tree-key expandable"
                        onClick={() => toggleCollapse(`${level}-${key}`)}
                    >
                        <span className="collapse-icon">
                            {isEmpty ? '📄' : (isCollapsed ? '▶️' : '🔽')}
                        </span>
                        <span className="key-name">"{key}"</span>
                        <span className="key-colon">:</span>
                        <span className="value-preview">
                            {isArray ? `Array(${value.length})` : 'Object'}
                        </span>
                    </div>
                    {!isCollapsed && !isEmpty && (
                        <div className="json-tree-children">
                            <JsonTreeView data={value} level={level + 1} />
                        </div>
                    )}
                </div>
            );
        }
        
        return (
            <div key={index} className="json-tree-item">
                <span className="json-tree-key">"{key}"</span>
                <span className="key-colon">:</span>
                <span className={`json-value json-${typeof value}`}>
                    {typeof value === 'string' ? `"${value}"` : String(value)}
                </span>
            </div>
        );
    };

    if (Array.isArray(data)) {
        return (
            <div className="json-tree">
                {data.map((item, index) => renderValue(String(index), item, index))}
            </div>
        );
    }

    return (
        <div className="json-tree">
            {Object.entries(data).map(([key, value], index) => 
                renderValue(key, value, index)
            )}
        </div>
    );
};