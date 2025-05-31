import { useState } from "react";
import { useE5GetStatblock } from "../../../../api/e5/useE5Api.ts";
import { E5StatblockContextProvider, useE5StatblockContext } from "../../../../context/E5StatblockContext.tsx";
import { Loader } from "../../../general/Loader.tsx";
import styles from "./e5statblock.module.scss";
import { E5StatblockValues } from "./E5StatblockValues.tsx";
import { E5StatblockContent } from "./E5StatblockContent.tsx";
import Tippy from "@tippyjs/react";
import { JsonEditor } from "../../../JsonEditor.tsx";
import { getTtrpgProxyUrl } from "../../../../helper/helpers.ts";
import { useMetadataContext } from "../../../../context/MetadataContext.ts";
import { useShallow } from "zustand/react/shallow";
import { dupleJsonFile } from "../../../../helper/duplicateFunc.ts";
import OBR from "@owlbear-rodeo/sdk";

const E5StatBlock = () => {
    const { statblock } = useE5StatblockContext();
    const [showJsonEditor, setShowJsonEditor] = useState(false);
    const room = useMetadataContext(useShallow((state) => state.room));
    
    const tokenSlug = statblock?.slug;
    const proxyUrl = getTtrpgProxyUrl(room || undefined);

    const statblockQuery = useE5GetStatblock(tokenSlug);

    const handleDuplicate = async () => {
        if (!statblock) return;
        try {
            const proxyUrl = getTtrpgProxyUrl(room || undefined);
            if (!proxyUrl || proxyUrl === "https://nope") {
                console.log("Please configure your proxy URL in settings first.");
                return;
            }
            const now = new Date();
            const hash = `${statblock.name}_${now.getFullYear()}${(now.getMonth()+1)
                .toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours()
                .toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds()
                .toString().padStart(2, '0')}`;
            const safeHash = hash.replace(/[^a-zA-Z0-9_\-]/g, "_");
            const blob = new Blob([JSON.stringify(statblock, null, 2)], { type: "application/json" });
            const safeName = `${safeHash}`;
            const file = new File([blob], ``, { type: "application/json" });
            await dupleJsonFile(file, safeName, proxyUrl);
            console.log(`Duplication complete! ${safeName}`);
            OBR.notification.show(`Statblock "${safeName}" duplicated successfully!`)
        } catch (error: any) {
            console.log("Error: " + error.message);
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
                    >
                        ⚙️
                    </button>
                    <button className="edit-json-btn" onClick={handleDuplicate} title="Duplicate statblock JSON">
                        📋
                    </button>
                </div>
            </div>

            <E5StatblockContent />

            <JsonEditor
                isOpen={showJsonEditor}
                onClose={() => setShowJsonEditor(false)}
                slug={tokenSlug || ""}
                proxyUrl={proxyUrl || ""}
                onSave={(editedJson) => {
                    setShowJsonEditor(false);
                    statblockQuery.refetch();
                    OBR.notification.show("Statblock updated successfully!");
                    console.log("Statblock updated:", editedJson);
                }}
                title="Edit Statblock JSON"
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