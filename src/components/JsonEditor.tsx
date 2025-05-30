import React, { useState, useEffect } from "react";
import { ItemSearchModal } from './ItemSearchModal';
import { SpellSearchModal } from './SpellSearchModal';
import { JsonFormEditor } from './FormEditor.tsx';

interface JsonEditorProps {
    isOpen: boolean;
    onClose: () => void;
    slug: string; // ✅ CAMBIATO: prendi lo slug dal token
    proxyUrl: string; // ✅ AGGIUNTO: il proxy URL
    onSave: (editedJson: any) => void;
    title?: string;
}

interface Item {
    id: number;
    name: string;
    // Altri campi dell'item che ti servono
}

interface EquipmentItem {
    item: number;
    equipped: boolean;
    proficient: boolean;
    embedded: boolean;
    loot: boolean;
    attuned: boolean;
    count: number;
}

// interface Spell {
//     id: string;
//     name: string;
//     level?: number;
//     school?: string;
//     description?: string;
// }

interface Spell {
    id: string;
    name: string;
    level?: number;
    school?: {
        name: string;
    };
    classes?: Array<{
        name: string;
    }>;
    description?: string;
    slug?: string;
    range?: string;
    duration?: string;
    casting_time?: string;
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
    const [isLoading, setIsLoading] = useState(false);
    const [showItemSearch, setShowItemSearch] = useState(false);
    const [showSpellSearch, setShowSpellSearch] = useState(false);
    const [viewMode, setViewMode] = useState<'formatted' | 'raw' | 'form'>('form');


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
        
        // ✅ Validazione migliorata
        if (value.trim() === '') {
            setError(null);
            setIsValid(false);
            return;
        }
        
        try {
            JSON.parse(value);
            setError(null);
            setIsValid(true);
        } catch (err) {
            setError("Invalid JSON format");
            setIsValid(false);
        }
    };

    // ✅ Migliorare la validazione del save
    const handleSave = async () => {
        if (!jsonText.trim()) {
            setError("Cannot save empty data");
            return;
        }
        
        if (!isValid) {
            setError("Cannot save invalid JSON");
            return;
        }

        setIsLoading(true);
        try {
            const parsedJson = JSON.parse(jsonText);
            
            const response = await fetch(`${proxyUrl}/edit/statblock/${slug}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(parsedJson, null, 2) // ✅ Assicurati che sia JSON valido
            });

            if (!response.ok) {
                throw new Error(`Save failed: ${response.status}`);
            }

            onSave(parsedJson);
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

    /// ...existing code...

    const hasEquipment = () => {
        try {
            if (!jsonText.trim()) return false;
            const data = JSON.parse(jsonText);
            return Array.isArray(data.equipment);
        } catch {
            return false;
        }
    };

    const hasSpells = () => {
        try {
            if (!jsonText.trim()) return false;
            const data = JSON.parse(jsonText);
            return Array.isArray(data.spells);
        } catch {
            return false;
        }
    };

    const addSpellToList = (spell: Spell) => {
        try {
            if (!jsonText.trim()) {
                setError("No JSON data available to modify");
                return;
            }
            
            const data = JSON.parse(jsonText);
            if (!Array.isArray(data.spells)) {
                data.spells = [];
            }

            // ✅ Controlla se lo spell non è già presente
            if (!data.spells.includes(spell.id)) {
                data.spells.push(spell.id);
                setJsonText(JSON.stringify(data, null, 2));
                console.log("✅ Spell aggiunto:", spell.name);
            } else {
                console.log("⚠️ Spell già presente:", spell.name);
            }
            
            setShowSpellSearch(false);
            
        } catch (error) {
            setError("Failed to add spell to list");
            console.error("❌ Errore aggiunta spell:", error);
        }
    };

    const addItemToEquipment = (item: Item) => {
        try {
            if (!jsonText.trim()) {
                setError("No JSON data available to modify");
                return;
            }
            
            const data = JSON.parse(jsonText);
            if (!Array.isArray(data.equipment)) {
                data.equipment = [];
            }

            const newEquipmentItem: EquipmentItem = {
                item: item.id,
                equipped: false,
                proficient: false,
                embedded: false,
                loot: false,
                attuned: false,
                count: 1
            };

            data.equipment.push(newEquipmentItem);
            setJsonText(JSON.stringify(data, null, 2));
            setShowItemSearch(false);
            
            console.log("✅ Item aggiunto:", item.name);
        } catch (error) {
            setError("Failed to add item to equipment");
            console.error("❌ Errore aggiunta item:", error);
        }
    };

// ...existing code...

    if (!isOpen) return null;

    return (
        <div className="json-editor-overlay">
            <div className="json-editor-modal">
                <div className="json-editor-header">
                    <h2 className="json-editor-title">{title}</h2>
                    <div className="json-editor-controls">
                        <div className="view-toggle">
                            <button 
                                className={`toggle-btn ${viewMode === 'form' ? 'active' : ''}`}
                                onClick={() => setViewMode('form')}
                                disabled={!isValid || isLoading}
                            >
                                📝 Form
                            </button>
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
                                ✏️ Raw
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

                        {hasEquipment() && (
                            <button 
                                className="json-editor-btn json-editor-btn-secondary"
                                onClick={() => setShowItemSearch(true)}
                                disabled={!isValid || isLoading}
                                title="Add item to equipment"
                            >
                                ➕ Add Item
                            </button>
                        )}

                        {hasSpells() && (
                            <button 
                                className="json-editor-btn json-editor-btn-secondary"
                                onClick={() => setShowSpellSearch(true)}
                                disabled={!isValid || isLoading}
                                title="Add spell to spell list"
                            >
                                🪄 Add Spell
                            </button>
                        )}

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

                {showItemSearch && (
                    <ItemSearchModal
                        proxyUrl={proxyUrl}
                        onClose={() => setShowItemSearch(false)}
                        onSelectItem={addItemToEquipment}
                    />
                )}

                {showSpellSearch && (
                    <SpellSearchModal
                        proxyUrl={proxyUrl}
                        onClose={() => setShowSpellSearch(false)}
                        onSelectSpell={addSpellToList}
                    />
                )}

                <div className="json-editor-content">
                    {isLoading ? (
                        <div className="json-loading">
                            <div className="loading-spinner">⏳ Loading JSON from server...</div>
                        </div>
                    ) : viewMode === 'form' && isValid && jsonText.trim() ? (
                        <JsonFormEditor 
                            jsonData={(() => {
                                try {
                                    return JSON.parse(jsonText);
                                } catch {
                                    return {};
                                }
                            })()}
                            onChange={(newData) => {
                                // ✅ CORREZIONE: Aggiorna il jsonText con i nuovi dati
                                const newJsonText = JSON.stringify(newData, null, 2);
                                setJsonText(newJsonText);
                                console.log('JsonEditor received update from FormEditor:', newData);
                                console.log('New JSON text:', newJsonText);
                                
                                // ✅ Verifica che sia ancora JSON valido
                                try {
                                    JSON.parse(newJsonText);
                                    setIsValid(true);
                                    setError(null);
                                } catch (err) {
                                    setError("Form generated invalid JSON");
                                    setIsValid(false);
                                }
                            }}
                            disabled={isLoading}
                        />
                    ) : viewMode === 'formatted' && isValid && jsonText.trim() ? (
                        <div className="json-viewer">
                            <JsonTreeView data={(() => {
                                try {
                                    return JSON.parse(jsonText);
                                } catch {
                                    return {};
                                }
                            })()} />
                        </div>
                    ) : jsonText.trim() ? (
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
                    ) : (
                        <div className="json-empty-state">
                            <div className="empty-state-content">
                                <div className="empty-state-icon">📄</div>
                                <h3>No Data Available</h3>
                                <p>The JSON data could not be loaded from the server.</p>
                                <button 
                                    className="json-editor-btn json-editor-btn-primary"
                                    onClick={() => {
                                        // Retry loading
                                        if (slug && proxyUrl) {
                                            setIsLoading(true);
                                            setError(null);
                                            
                                            fetch(`${proxyUrl}/edit/statblock/${slug}`)
                                                .then(response => {
                                                    if (!response.ok) {
                                                        throw new Error(`Failed to fetch: ${response.status}`);
                                                    }
                                                    return response.json();
                                                })
                                                .then(data => {
                                                    setJsonText(JSON.stringify(data, null, 2));
                                                    setIsValid(true);
                                                })
                                                .catch(err => {
                                                    setError(`Failed to load JSON: ${err instanceof Error ? err.message : String(err)}`);
                                                    setJsonText("");
                                                    setIsValid(false);
                                                })
                                                .finally(() => {
                                                    setIsLoading(false);
                                                });
                                        }
                                    }}
                                    disabled={isLoading}
                                >
                                    🔄 Retry Loading
                                </button>
                            </div>
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