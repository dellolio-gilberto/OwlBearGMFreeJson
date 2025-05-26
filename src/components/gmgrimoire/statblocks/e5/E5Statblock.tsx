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

const E5StatBlock = () => {
    const { statblock } = useE5StatblockContext();
    const [showJsonEditor, setShowJsonEditor] = useState(false);
    const room = useMetadataContext(useShallow((state) => state.room));
    
    const tokenSlug = statblock?.slug;
    const proxyUrl = getTtrpgProxyUrl(room || undefined);

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
                </div>
            </div>

            <E5StatblockContent />

            <JsonEditor
                isOpen={showJsonEditor}
                onClose={() => setShowJsonEditor(false)}
                slug={tokenSlug || ""}
                proxyUrl={proxyUrl || ""}
                onSave={(editedJson) => {
                    // ✅ Callback opzionale per notifiche o refresh
                    console.log("JSON salvato:", editedJson);
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