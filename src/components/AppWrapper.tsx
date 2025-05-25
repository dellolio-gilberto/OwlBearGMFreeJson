import { useState, useEffect } from "react";
import OBR from "@owlbear-rodeo/sdk";
import { metadataKey } from "../helper/variables.ts";
import { ProxySetup } from "./ProxySetup.tsx";
import { GMGrimoire } from "./gmgrimoire/GMGrimoire.tsx";

export const AppWrapper = () => {
    const [showSetup, setShowSetup] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkProxySetup = async () => {
            try {
                const metadata = await OBR.room.getMetadata();
                const roomData = metadata[metadataKey];
                
                // Controlla che roomData sia un oggetto e contenga ttrpgProxyUrl
                if (roomData && typeof roomData === 'object' && roomData !== null && 'ttrpgProxyUrl' in roomData) {
                    setShowSetup(false);
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