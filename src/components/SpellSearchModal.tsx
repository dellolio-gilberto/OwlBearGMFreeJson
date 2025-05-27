import React, { useState, useEffect } from "react";
//import "./SpellSearch.css"

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

interface SpellSearchModalProps {
    proxyUrl: string;
    onClose: () => void;
    onSelectSpell: (spell: Spell) => void;
}

export const SpellSearchModal: React.FC<SpellSearchModalProps> = ({
    proxyUrl,
    onClose,
    onSelectSpell
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [spells, setSpells] = useState<Spell[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ✅ Debounced search per evitare troppe richieste
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.trim()) {
                searchSpells(searchQuery);
            } else {
                setSpells([]);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const searchSpells = async (query: string) => {
        setIsLoading(true);
        setError(null);
        
        try {
            const searchUrl = `${proxyUrl}/e5/spell/search/?search_string=${encodeURIComponent(query)}&take=200&skip=0`;
            console.log("🔍 Searching spells:", searchUrl);
            
            const response = await fetch(searchUrl);
            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }
            
            const data = await response.json();
            
            setSpells(data || []);
            console.log("✅ Found spells:", data?.length || 0);
            
        } catch (err) {
            setError(`Search failed: ${err instanceof Error ? err.message : String(err)}`);
            console.error("❌ Search error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectSpell = (spell: Spell) => {
        onSelectSpell(spell);
        onClose();
    };

    const getSpellLevelText = (level?: number) => {
        if (level === 0) return "Cantrip";
        if (level === 1) return "1st level";
        if (level === 2) return "2nd level";
        if (level === 3) return "3rd level";
        return `${level}th level`;
    };

    return (
        <div className="spell-search-overlay">
            <div className="spell-search-modal">
                <div className="spell-search-header">
                    <h3>🪄 Search Spells</h3>
                    <button 
                        className="close-btn"
                        onClick={onClose}
                        aria-label="Close search"
                    >
                        ✕
                    </button>
                </div>
                
                <div className="spell-search-content">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Search for spells..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                            autoFocus
                        />
                        {isLoading && <div className="search-loading">⏳</div>}
                    </div>
                    
                    {error && (
                        <div className="search-error">
                            ⚠️ {error}
                        </div>
                    )}
                    
                    <div className="spells-list">
                        {spells.length === 0 && searchQuery && !isLoading && (
                            <div className="no-results">
                                No spells found for "{searchQuery}"
                            </div>
                        )}
                        
                        {spells.map((spell) => (
                            <div
                                key={spell.id}
                                className="spell-row"
                                onClick={() => handleSelectSpell(spell)}
                            >
                                <div className="spell-info">
                                    <div className="spell-name">{spell.name}</div>
                                    <div className="spell-details">
                                        {spell.level !== undefined && (
                                            <span className="spell-level">
                                                {getSpellLevelText(spell.level)}
                                            </span>
                                        )}
                                        {/* ✅ Gestisci school come oggetto */}
                                        {spell.school?.name && (
                                            <span className="spell-school">{spell.school.name}</span>
                                        )}
                                        {/* ✅ Aggiungi le classi se disponibili */}
                                        {spell.classes && spell.classes.length > 0 && (
                                            <span className="spell-classes">
                                                {spell.classes.map(c => c.name).join(', ')}
                                            </span>
                                        )}
                                    </div>
                                    {/* ✅ Aggiungi altre info utili */}
                                    <div className="spell-extra-info">
                                        {spell.range && (
                                            <span className="spell-range">Range: {spell.range}</span>
                                        )}
                                        {spell.casting_time && (
                                            <span className="spell-casting-time">Cast: {spell.casting_time}</span>
                                        )}
                                        {spell.duration && (
                                            <span className="spell-duration">Duration: {spell.duration}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="spell-id">ID: {spell.id}</div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="spell-search-footer">
                    <button 
                        className="cancel-btn"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};