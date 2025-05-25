import { useState } from "react";
import OBR from "@owlbear-rodeo/sdk";
import { metadataKey } from "../helper/variables.ts";
import "./ProxySetup.css";

export const ProxySetup = ({ onComplete }: { onComplete: () => void }) => {
    const [proxyUrl, setProxyUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const metadata = await OBR.room.getMetadata();
            const roomData = metadata[metadataKey] || {};
            
            await OBR.room.setMetadata({
                [metadataKey]: {
                    ...roomData,
                    ttrpgProxyUrl: proxyUrl.trim() || ""
                }
            });
            
            onComplete();
        } catch (error) {
            console.error("Error saving proxy URL:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = async () => {
        setIsLoading(true);
        try {
            const metadata = await OBR.room.getMetadata();
            const roomData = metadata[metadataKey] || {};
            
            await OBR.room.setMetadata({
                [metadataKey]: {
                    ...roomData,
                    ttrpgProxyUrl: ""
                }
            });
            
            onComplete();
        } catch (error) {
            console.error("Error skipping proxy setup:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="proxy-setup-container">
            <div className="proxy-setup-card">
                <h2 className="proxy-setup-title">
                    ⚙️ GM's Grimoire Setup
                </h2>
                <p className="proxy-setup-description">
                    Configure your TTRPG proxy URL to enable statblock features. WARNING: The URL must not end with a trailing slash (/).
                </p>
                
                <form onSubmit={handleSubmit}>
                    <div className="proxy-input-group">
                        <label className="proxy-input-label">
                            TTRPG Proxy URL
                        </label>
                        <input
                            type="url"
                            value={proxyUrl}
                            onChange={(e) => setProxyUrl(e.target.value)}
                            placeholder="https://your-proxy-url.com"
                            className="proxy-input"
                            disabled={isLoading}
                        />
                        <small className="proxy-help-text">
                            Enter your proxy URL. You can change this later in settings.
                        </small>
                    </div>
                    
                    <div className="proxy-button-group">
                        <button 
                            type="submit" 
                            className="proxy-btn proxy-btn-primary"
                            disabled={isLoading}
                        >
                            {isLoading ? "Saving..." : "Continue"}
                        </button>
                        <button 
                            type="button" 
                            onClick={handleSkip}
                            className="proxy-btn proxy-btn-secondary"
                            disabled={isLoading}
                        >
                            Skip for now
                        </button>
                    </div>
                </form>
                
                <div className="proxy-info-box">
                    <p className="proxy-info-title">Why do I need this?</p>
                    <p className="proxy-info-text">
                        GM's Grimoire needs a proxy to fetch statblock data. Deploy your own, the default fallback is only a placeholder.
                    </p>
                </div>
            </div>
        </div>
    );
};