import { useState, useEffect } from "react";
import OBR from "@owlbear-rodeo/sdk";
import { metadataKey } from "../helper/variables.ts";
import { ProxySetup } from "./ProxySetup.tsx";
import { GMGrimoire } from "./gmgrimoire/GMGrimoire.tsx";

const SETUP_COMPLETE_KEY = "gmgrimoire-proxy-setup-complete";

export const AppWrapper = () => {
    const [showSetup, setShowSetup] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkProxySetup = async () => {
            try {
                // Prima controlla localStorage per evitare flash
                const setupComplete = localStorage.getItem(SETUP_COMPLETE_KEY);
                
                // Aspetta che OBR sia pronto
                if (OBR.isReady) {
                    const metadata = await OBR.room.getMetadata();
                    const roomData = metadata[metadataKey];
                    
                    // Se setup già completato in questa room (controlla metadata)
                    const hasProxyConfig = roomData && typeof roomData === "object" && roomData !== null && ('ttrpgProxyUrl' in roomData);
                    
                    if (hasProxyConfig) {
                        // Marca come completato nel localStorage per le prossime volte
                        localStorage.setItem(SETUP_COMPLETE_KEY, "true");
                        setShowSetup(false);
                    } else if (setupComplete === "true") {
                        // Setup già fatto in precedenza ma metadata non ancora caricato
                        setShowSetup(false);
                    } else {
                        // Prima volta, mostra setup
                        setShowSetup(true);
                    }
                }
            } catch (error) {
                console.error("Error checking proxy setup:", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkProxySetup();
    }, []);

    const handleSetupComplete = () => {
        localStorage.setItem(SETUP_COMPLETE_KEY, "true");
        setShowSetup(false);
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (showSetup) {
        return <ProxySetup onComplete={handleSetupComplete} />;
    }

    return <GMGrimoire />;
};