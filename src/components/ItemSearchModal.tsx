import React, { useState, useEffect } from "react";
import "./ItemSearch.css";

interface Item {
    id: number;
    name: string;
    type?: string;
    rarity?: string;
    description?: string;
}

interface ItemSearchModalProps {
    proxyUrl: string;
    onClose: () => void;
    onSelectItem: (item: Item) => void;
}

export const ItemSearchModal: React.FC<ItemSearchModalProps> = ({
    proxyUrl,
    onClose,
    onSelectItem
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [items, setItems] = useState<Item[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ✅ Debounced search per evitare troppe richieste
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.trim()) {
                searchItems(searchQuery);
            } else {
                setItems([]);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const searchItems = async (query: string) => {
        setIsLoading(true);
        setError(null);
        
        try {
            const searchUrl = `${proxyUrl}/e5/item/search/?search_string=${encodeURIComponent(query)}&take=200&skip=0`;
            console.log("🔍 Searching items:", searchUrl);
            
            const response = await fetch(searchUrl);
            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }
            
            const data = await response.json();
            setItems(data || []);
            console.log("✅ Found items:", data?.length || 0);
            
        } catch (err) {
            setError(`Search failed: ${err instanceof Error ? err.message : String(err)}`);
            console.error("❌ Search error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectItem = (item: Item) => {
        onSelectItem(item);
        onClose();
    };

    return (
        <div className="item-search-overlay">
            <div className="item-search-modal">
                <div className="item-search-header">
                    <h3>🔍 Search Items</h3>
                    <button 
                        className="close-btn"
                        onClick={onClose}
                        aria-label="Close search"
                    >
                        ✕
                    </button>
                </div>
                
                <div className="item-search-content">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Search for items..."
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
                    
                    <div className="items-list">
                        {items.length === 0 && searchQuery && !isLoading && (
                            <div className="no-results">
                                No items found for "{searchQuery}"
                            </div>
                        )}
                        
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="item-row"
                                onClick={() => handleSelectItem(item)}
                            >
                                <div className="item-info">
                                    <div className="item-name">{item.name}</div>
                                    {item.type && (
                                        <div className="item-type">{item.type}</div>
                                    )}
                                    {item.rarity && (
                                        <div className="item-rarity">{item.rarity}</div>
                                    )}
                                </div>
                                <div className="item-id">ID: {item.id}</div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="item-search-footer">
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