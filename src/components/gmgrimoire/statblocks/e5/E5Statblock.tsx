import { useState } from "react";
import { useE5GetStatblock } from "../../../../api/e5/useE5Api.ts";
import { E5StatblockContextProvider, useE5StatblockContext } from "../../../../context/E5StatblockContext.tsx";
import { Loader } from "../../../general/Loader.tsx";
import styles from "./e5statblock.module.scss";
import { E5StatblockValues } from "./E5StatblockValues.tsx";
import { E5StatblockContent } from "./E5StatblockContent.tsx";
import Tippy from "@tippyjs/react";
import { JsonEditor } from "../../../JsonEditor.tsx";
import { updateTokenSheet, getTtrpgProxyUrl } from "../../../../helper/helpers.ts";
import { uploadJsonFile } from "../../../../helper/uploadFunc.ts";
import { useMetadataContext } from "../../../../context/MetadataContext.ts";
import { useShallow } from "zustand/react/shallow";

const E5StatBlock = () => {
    const { statblock, itemId } = useE5StatblockContext();
    const [showJsonEditor, setShowJsonEditor] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const room = useMetadataContext(useShallow((state) => state.room));

    const handleSaveJson = async (editedJson: any) => {
        setIsSaving(true);
        
        try {
            if (!editedJson.slug) {
                throw new Error("Il JSON deve contenere un campo 'slug'");
            }

            if (itemId) {
                await updateTokenSheet(editedJson, itemId, "e5");
                console.log("✅ Local update");
            }

            const proxyUrl = getTtrpgProxyUrl(room || undefined);
            if (proxyUrl && proxyUrl !== "https://nope") {
                
                if (typeof editedJson.source === "string" && !editedJson.source.endsWith(" - NoTA")) {
                    editedJson.source = editedJson.source + " - NoTA";
                }

                const jsonBlob = new Blob([JSON.stringify(editedJson, null, 2)], {
                    type: "application/json"
                });
                
                const jsonFile = new File([jsonBlob], `${editedJson.slug}.json`, {
                    type: "application/json"
                });

                await uploadJsonFile(jsonFile, proxyUrl);
                console.log("✅ Re-upload al proxy completato");
            }

            alert("✅ Statblock aggiornato con successo!");
            
        } catch (error) {
            console.error("❌ Errore durante il salvataggio:", error);
            if (error instanceof Error) {
                alert(`❌ Errore: ${error.message}`);
            } else {
                alert("❌ Errore sconosciuto");
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={styles.statblock}>
            <div className={styles.title}>
                <div>
                    <Tippy content={`${statblock.size} ${statblock.type}, ${statblock.alignment}`}>
                        <h1 className={styles.name}>{statblock.name}</h1>
                    </Tippy>
                    <div className={styles.note}>
                        {statblock.size} {statblock.type}, {statblock.alignment}
                    </div>
                </div>

                <div className={styles.headerActions}>
                    <E5StatblockValues />
                    
                    <button 
                        className="edit-json-btn"
                        onClick={() => setShowJsonEditor(true)}
                        title="Edit statblock JSON"
                        disabled={isSaving}
                    >
                        {isSaving ? "💾" : "⚙️"}
                    </button>
                </div>
            </div>

            <E5StatblockContent />

            <JsonEditor
                isOpen={showJsonEditor}
                onClose={() => setShowJsonEditor(false)}
                jsonData={statblock}
                onSave={handleSaveJson}
                title={`Edit ${statblock.name} JSON`}
            />
        </div>
    );
};

export const E5StatBlockWrapper = ({ slug, itemId }: { slug: string; itemId: string }) => {
    const statblockQuery = useE5GetStatblock(slug);
    const statblock = statblockQuery.isSuccess && statblockQuery.data ? statblockQuery.data : null;

    return statblock ? (
        <E5StatblockContextProvider itemId={itemId} statblock={statblock}>
            <E5StatBlock />
        </E5StatblockContextProvider>
    ) : (
        <Loader />
    );
};