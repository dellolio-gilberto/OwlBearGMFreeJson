import React, { useState, useEffect } from 'react';

interface JsonFormEditorProps {
    jsonData: any;
    onChange: (newData: any) => void;
    disabled?: boolean;
}

export const JsonFormEditor: React.FC<JsonFormEditorProps> = ({ 
    jsonData, 
    onChange, 
    disabled = false 
}) => {
    const [formData, setFormData] = useState(jsonData || {});
    const [originalStructure] = useState(jsonData || {});

    // Stato locale per input languages
    const [languagesInput, setLanguagesInput] = useState(
        Array.isArray(jsonData?.languages) ? jsonData.languages.join(', ') : (jsonData?.languages || '')
    );
    useEffect(() => {
        setLanguagesInput(
            Array.isArray(formData.languages) ? formData.languages.join(', ') : (formData.languages || '')
        );
    }, [formData.languages]);

    // Stato locale per input items/equipment
    const [itemsInput, setItemsInput] = useState(() => {
        if (typeof jsonData?.items === 'string') return jsonData.items;
        if (Array.isArray(jsonData?.items)) return jsonData.items.join(', ');
        if (jsonData?.equipment) {
            if (typeof jsonData.equipment === 'string') return jsonData.equipment;
            if (Array.isArray(jsonData.equipment)) return jsonData.equipment.join(', ');
        }
        return '';
    });
    useEffect(() => {
        if (typeof formData.items === 'string') setItemsInput(formData.items);
        else if (Array.isArray(formData.items)) setItemsInput(formData.items.join(', '));
        else if (formData.equipment) {
            if (typeof formData.equipment === 'string') setItemsInput(formData.equipment);
            else if (Array.isArray(formData.equipment)) setItemsInput(formData.equipment.join(', '));
        } else setItemsInput('');
    }, [formData.items, formData.equipment]);

    // Stato locale per input hit dice
    const [hitDiceInput, setHitDiceInput] = useState(() => {
        if (formData.hit_dice) return formData.hit_dice;
        if (formData.hp?.hit_dice) return formData.hp.hit_dice;
        if (formData.hit_die) return formData.hit_die;
        return '';
    });
    useEffect(() => {
        if (formData.hit_dice) setHitDiceInput(formData.hit_dice);
        else if (formData.hp?.hit_dice) setHitDiceInput(formData.hp.hit_dice);
        else if (formData.hit_die) setHitDiceInput(formData.hit_die);
        else setHitDiceInput('');
    }, [formData.hit_dice, formData.hp?.hit_dice, formData.hit_die]);

    // Stato locale per input speed
    const [speedInput, setSpeedInput] = useState(() => {
        if (typeof formData.speed === 'string') return formData.speed;
        if (formData.speed?.walk) return formData.speed.walk;
        return '1';
    });
    useEffect(() => {
        if (typeof formData.speed === 'string') setSpeedInput(formData.speed);
        else if (formData.speed?.walk) setSpeedInput(formData.speed.walk);
        else setSpeedInput('1');
    }, [formData.speed]);

    const updateField = (path: string, value: any) => {
        console.log('Updating field:', path, 'to:', value);

        const newData = JSON.parse(JSON.stringify(formData)); // Deep clone
        const keys = path.split('.');
        let current = newData;

        // Campi che devono essere stringa
        const stringFields = [
            'damage_vulnerabilities',
            'damage_resistances',
            'damage_immunities',
            'condition_immunities'
        ];
        // Campi che devono essere array
        const arrayFields = [
            'languages',
            'senses',
            'items',
            'equipment'
        ];

        // Gestione speciale per ability scores
        if (['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].includes(path)) {
            const stat = path;
            if (formData.stats && formData.stats[stat] !== undefined) {
                if (!newData.stats) newData.stats = {};
                newData.stats[stat] = parseInt(value) || 10;
            } else if (formData.ability_scores && formData.ability_scores[stat] !== undefined) {
                if (!newData.ability_scores) newData.ability_scores = {};
                newData.ability_scores[stat] = parseInt(value) || 10;
            } else if (formData[stat] !== undefined) {
                newData[stat] = parseInt(value) || 10;
            } else {
                if (!newData.stats) newData.stats = {};
                newData.stats[stat] = parseInt(value) || 10;
            }
        }
        // Gestione speciale per campi array
        else if (arrayFields.includes(path)) {
            if (Array.isArray(value)) {
                newData[path] = value;
            } else if (typeof value === 'string') {
                newData[path] = value
                    ? value.split(',').map((v: string) => v.trim()).filter((v: string) => v)
                    : [];
            } else {
                newData[path] = [];
            }
        }
        // Gestione speciale per campi stringa
        else if (stringFields.includes(path)) {
            if (Array.isArray(value)) {
                newData[path] = value.join(', ');
            } else if (typeof value === 'string') {
                newData[path] = value;
            } else {
                newData[path] = '';
            }
        }
        // Gestione normale per tutti gli altri campi
        else {
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    if (originalStructure[keys[i]]) {
                        current[keys[i]] = JSON.parse(JSON.stringify(originalStructure[keys[i]]));
                    } else {
                        current[keys[i]] = {};
                    }
                }
                current = current[keys[i]];
            }
            const finalKey = keys[keys.length - 1];
            current[finalKey] = value;
        }

        try {
            setFormData(newData);
            onChange(newData);
            console.log('Successfully updated field:', path, 'New data:', newData);
        } catch (error) {
            console.error('Error updating field:', path, error);
            return;
        }
    };

    // ✅ AGGIORNATO: Helper per ottenere i valori delle ability scores
    const getAbilityScore = (ability: string) => {
        // Prima controlla stats (come nel tuo JSON)
        if (formData.stats?.[ability] !== undefined) return formData.stats[ability];
        // Poi controlla ability_scores
        if (formData.ability_scores?.[ability] !== undefined) return formData.ability_scores[ability];
        // Infine controlla direttamente
        if (formData[ability] !== undefined) return formData[ability];
        
        return 10; // Default value
    };

    // // Helper per ottenere la velocità
    // const getSpeed = () => {
    //     if (typeof formData.speed === 'string') {
    //         return formData.speed;
    //     }
    //     if (formData.speed?.walk) return formData.speed.walk;
    //     return '';
    // };

    const renderBasicInfo = () => (
        <div className="form-section">
            <h3 className="form-section-title">📋 Basic Information</h3>
            <div className="form-grid">
                <div className="form-field">
                    <label className="form-label">Name</label>
                    <input
                        type="text"
                        className="form-input"
                        value={formData.name || ''}
                        onChange={(e) => updateField('name', e.target.value)}
                        disabled={disabled}
                    />
                </div>
                <div className="form-field">
                    <label className="form-label">Size</label>
                    <select
                        className="form-select"
                        value={formData.size || ''}
                        onChange={(e) => updateField('size', e.target.value)}
                        disabled={disabled}
                    >
                        <option value="">Select size</option>
                        <option value="Tiny">Tiny</option>
                        <option value="Small">Small</option>
                        <option value="Medium">Medium</option>
                        <option value="Large">Large</option>
                        <option value="Huge">Huge</option>
                        <option value="Gargantuan">Gargantuan</option>
                    </select>
                </div>
                <div className="form-field">
                    <label className="form-label">Type</label>
                    <input
                        type="text"
                        className="form-input"
                        value={formData.type || ''}
                        onChange={(e) => updateField('type', e.target.value)}
                        disabled={disabled}
                    />
                </div>
                <div className="form-field">
                    <label className="form-label">Alignment</label>
                    <input
                        type="text"
                        className="form-input"
                        value={formData.alignment || ''}
                        onChange={(e) => updateField('alignment', e.target.value)}
                        disabled={disabled}
                    />
                </div>
                <div className="form-field">
                    <label className="form-label">Challenge Rating</label>
                    <input
                        type="text"
                        className="form-input"
                        value={formData.challenge_rating || formData.cr || ''}
                        onChange={(e) => updateField('challenge_rating', e.target.value)}
                        disabled={disabled}
                        placeholder="e.g., 1/4, 1, 5"
                    />
                </div>
                <div className="form-field" style={{gridColumn: '1 / -1'}}>
                    <label className="form-label">About</label>
                    <textarea
                        className="form-textarea"
                        value={formData.about || ''}
                        onChange={(e) => updateField('about', e.target.value)}
                        disabled={disabled}
                        placeholder="Description or background information about the character/creature"
                        rows={3}
                        style={{width: '100%', resize: 'vertical'}}
                    />
                </div>
                <div className="form-field">
                    <label className="form-label">Languages</label>
                    <input
                        type="text"
                        className="form-input"
                        value={languagesInput}
                        onChange={(e) => setLanguagesInput(e.target.value)}
                        onBlur={() => {
                            const languagesArray = languagesInput
                                ? languagesInput.split(',').map((lang: string)  => lang.trim()).filter((lang: string) => lang)
                                : [];
                            updateField('languages', languagesArray);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.currentTarget.blur();
                            }
                        }}
                        disabled={disabled}
                        placeholder="e.g., Common, Draconic"
                    />
                    <small style={{color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.25rem'}}>
                        Separate multiple languages with commas
                    </small>
                </div>
            </div>
        </div>
    );

    const renderStats = () => (
        <div className="form-section">
            <h3 className="form-section-title">💪 Ability Scores</h3>
            <div className="stats-grid">
                {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map(stat => {
                    const value = getAbilityScore(stat);
                    return (
                        <div key={stat} className="stat-field">
                            <label className="form-label">{stat.charAt(0).toUpperCase() + stat.slice(1)}</label>
                            <input
                                type="number"
                                className="form-input stat-input"
                                value={value}
                                onChange={(e) => {
                                    const newValue = parseInt(e.target.value) || 10;
                                    updateField(stat, newValue);
                                    console.log(`Updated ${stat} to:`, newValue);
                                }}
                                disabled={disabled}
                                min={1}
                                max={30}
                            />
                            <span className="stat-modifier">
                                {value ? `(${Math.floor((value - 10) / 2) >= 0 ? '+' : ''}${Math.floor((value - 10) / 2)})` : '(+0)'}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    // TORNA FINO QUI

    const getHitPoints = () => {
        if (formData.hit_points) return formData.hit_points;
        if (formData.hp?.value) return formData.hp.value;
        if (formData.hp && typeof formData.hp === 'number') return formData.hp;
        return 1;
    };

    // // Helper per ottenere hit dice
    // const getHitDice = () => {
    //     if (formData.hit_dice) return formData.hit_dice;
    //     if (formData.hp?.hit_dice) return formData.hp.hit_dice;
    //     if (formData.hit_die) return formData.hit_die;
    //     return '1d8';
    // };

        const renderCombatStats = () => (
        <div className="form-section">
            <h3 className="form-section-title">⚔️ Combat Stats</h3>
            <div className="form-grid">
                <div className="form-field">
                    <label className="form-label">Hit Points</label>
                    <input
                        type="number"
                        className="form-input"
                        value={getHitPoints()}
                        onChange={(e) => {
                            const newValue = parseInt(e.target.value) || 1;
                            // ✅ CORREZIONE: Aggiorna il campo corretto basato sulla struttura esistente
                            if (formData.hp && typeof formData.hp === 'object') {
                                updateField('hp.value', newValue);
                            } else {
                                updateField('hit_points', newValue);
                            }
                            console.log('Updated HP to:', newValue);
                        }}
                        disabled={disabled}
                    />
                </div>
                <div className="form-field">
                    <label className="form-label">Hit Dice</label>
                    <input
                        type="text"
                        className="form-input"
                        value={hitDiceInput}
                        onChange={(e) => setHitDiceInput(e.target.value)}
                        onBlur={() => {
                            if (formData.hp && typeof formData.hp === 'object') {
                                updateField('hp.hit_dice', hitDiceInput);
                            } else {
                                updateField('hit_dice', hitDiceInput);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.currentTarget.blur();
                            }
                        }}
                        disabled={disabled}
                        placeholder="e.g., 2d8+2"
                    />
                </div>
                <div className="form-field">
                    <label className="form-label">Speed</label>
                    <input
                        type="text"
                        className="form-input"
                        value={speedInput}
                        onChange={(e) => setSpeedInput(e.target.value)}
                        onBlur={() => {
                            if (typeof formData.speed === 'object' && formData.speed !== null) {
                                updateField('speed.walk', speedInput);
                            } else {
                                updateField('speed', speedInput);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.currentTarget.blur();
                            }
                        }}
                        disabled={disabled}
                        placeholder="e.g., 30 ft./9 m"
                    />
                </div>
                <div className="form-field">
                    <label className="form-label">Proficiency Bonus</label>
                    <input
                        type="number"
                        className="form-input"
                        value={formData.proficiency_bonus || formData.prof_bonus || 2}
                        onChange={(e) => {
                            const newValue = parseInt(e.target.value) || 2;
                            updateField('proficiency_bonus', newValue);
                            console.log('Updated Proficiency Bonus to:', newValue);
                        }}
                        disabled={disabled}
                        min={2}
                        max={6}
                    />
                </div>
            </div>
        </div>
    );

    const renderImmunities = () => (
        <div className="form-section">
            <h3 className="form-section-title">🛡️ Resistances & Immunities</h3>
            <div className="form-grid">
                <div className="form-field">
                    <label className="form-label">Damage Vulnerabilities</label>
                    <input
                        type="text"
                        className="form-input"
                        value={Array.isArray(formData.damage_vulnerabilities) ? formData.damage_vulnerabilities.join(', ') : (formData.damage_vulnerabilities || '')}
                        onChange={(e) => updateField('damage_vulnerabilities', e.target.value)}
                        disabled={disabled}
                        placeholder="e.g., Fire, Lightning"
                    />
                </div>
                <div className="form-field">
                    <label className="form-label">Damage Resistances</label>
                    <input
                        type="text"
                        className="form-input"
                        value={Array.isArray(formData.damage_resistances) ? formData.damage_resistances.join(', ') : (formData.damage_resistances || '')}
                        onChange={(e) => updateField('damage_resistances', e.target.value)}
                        disabled={disabled}
                        placeholder="e.g., Fire, Cold"
                    />
                </div>
                <div className="form-field">
                    <label className="form-label">Damage Immunities</label>
                    <input
                        type="text"
                        className="form-input"
                        value={Array.isArray(formData.damage_immunities) ? formData.damage_immunities.join(', ') : (formData.damage_immunities || '')}
                        onChange={(e) => updateField('damage_immunities', e.target.value)}
                        disabled={disabled}
                        placeholder="e.g., Poison, Necrotic"
                    />
                </div>
                <div className="form-field">
                    <label className="form-label">Condition Immunities</label>
                    <input
                        type="text"
                        className="form-input"
                        value={Array.isArray(formData.condition_immunities) ? formData.condition_immunities.join(', ') : (formData.condition_immunities || '')}
                        onChange={(e) => updateField('condition_immunities', e.target.value)}
                        disabled={disabled}
                        placeholder="e.g., Charmed, Frightened"
                    />
                </div>
                <div className="form-field">
                    <label className="form-label">Senses</label>
                    <input
                        type="text"
                        className="form-input"
                        value={Array.isArray(formData.senses) ? formData.senses.join(', ') : (formData.senses || '')}
                        onChange={(e) => updateField('senses', e.target.value)}
                        disabled={disabled}
                        placeholder="e.g., Darkvision 60 ft., passive Perception 12"
                    />
                </div>
            </div>
        </div>
    );

    const renderEquipment = () => (
        <div className="form-section">
            <h3 className="form-section-title">🎒 Equipment & Items</h3>
            <div className="form-field">
                <label className="form-label">Items</label>
                <textarea
                    className="form-textarea"
                    value={itemsInput}
                    onChange={(e) => setItemsInput(e.target.value)}
                    onBlur={() => {
                        // Mantieni il formato originale se possibile
                        if (Array.isArray(formData.items)) {
                            updateField('items', itemsInput.split(',').map((item: string) => item.trim()).filter((item: string)  => item));
                        } else if (Array.isArray(formData.equipment)) {
                            updateField('equipment', itemsInput.split(',').map((item: string) => item.trim()).filter((item: string)  => item));
                        } else {
                            updateField('items', itemsInput);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            e.currentTarget.blur();
                        }
                    }}
                    disabled={disabled}
                    placeholder="Enter items separated by commas, e.g., Sword, Shield, Potion of Healing"
                    rows={4}
                />
                <small style={{color: '#9ca3af', fontSize: '0.75rem'}}>
                    Separate multiple items with commas. Format will be preserved based on original data structure.
                </small>
            </div>
        </div>
    );
    return (
        <div className="json-form-editor">
            {renderBasicInfo()}
            {renderStats()}
            {renderCombatStats()}
            {renderImmunities()}
            {renderEquipment()}
            
            <div className="form-section">
                <h3 className="form-section-title">🎯 Additional Features</h3>
                <p className="form-note">
                    For advanced editing (skills, actions, spells), switch to Raw mode or use the specialized buttons above.
                </p>
                <div className="form-debug">
                    <details>
                        <summary style={{color: '#9ca3af', cursor: 'pointer'}}>Debug: Show Raw Data</summary>
                        <pre style={{
                            background: 'rgba(0,0,0,0.3)', 
                            padding: '1rem', 
                            borderRadius: '4px', 
                            fontSize: '0.75rem',
                            overflow: 'auto',
                            maxHeight: '200px'
                        }}>
                            {JSON.stringify(formData, null, 2)}
                        </pre>
                    </details>
                </div>
            </div>
        </div>
    );
};