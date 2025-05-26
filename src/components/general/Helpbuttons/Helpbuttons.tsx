import OBR from "@owlbear-rodeo/sdk";
import {
    changelogModal,
    helpModal,
    settingsModal,
    statblockPopover,
    statblockPopoverId,
    quickReferenceModal,
} from "../../../helper/variables.ts";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { TabletopAlmanacSvg } from "../../svgs/TabletopAlmanacSvg.tsx";
import Tippy from "@tippyjs/react";
import { SettingsSvg } from "../../svgs/SettingsSvg.tsx";
import { StatblockSvg } from "../../svgs/StatblockSvg.tsx";
import { updateSceneMetadata } from "../../../helper/helpers.ts";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { uploadJsonFile } from "../../../helper/uploadFunc.ts";
import { getTtrpgProxyUrl } from "../../../helper/helpers.ts";

type HelpButtonsProps = {
    ignoredChanges?: boolean;
    setIgnoredChange?: (ignoredChanges: boolean) => void;
};

export const Helpbuttons = (props: HelpButtonsProps) => {
    const [room, scene] = useMetadataContext(useShallow((state) => [state.room, state.scene]));
    const playerContext = usePlayerContext();

    const playerStatblockPopoverOpen = useMemo(() => {
        return (
            scene?.statblockPopoverOpen &&
            OBR.player.id in scene.statblockPopoverOpen &&
            scene.statblockPopoverOpen[OBR.player.id]
        );
    }, [scene?.statblockPopoverOpen]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        try {
            const proxyUrl = getTtrpgProxyUrl(room || undefined);
            if (!proxyUrl || proxyUrl === "https://nope") {
                console.log("Please configure your proxy URL in settings first.");
                return;
            }
        
            if (file.type !== "application/json") {
                console.log("Devi caricare un file JSON valido!");
                return;
            }
        
            try {
                await uploadJsonFile(file, proxyUrl);
                console.log("Upload completato!");
            } catch (error: any) {
                console.log("Errore durante l'upload: " + error.message);
            }
        
            event.target.value = "";
        } catch (error) {
            console.error("Errore nel handleFileChange:", error);
        }
    };

    return (
        <div className={"help-buttons"}>
            <Tippy content={"Open Tabletop Almanac to create your own statblocks"}>
                <a
                    href={"https://tabletop-almanac.com"}
                    className={"tabletop-almanac-button top-button link"}
                    title={"Tabletop Almanac"}
                    target={"_blank"}
                >
                    <TabletopAlmanacSvg />
                </a>
            </Tippy>
            <input
                type="file"
                accept=".json"
                style={{ display: "none" }}
                id="file-upload"
                onChange={handleFileChange}
            />
            <Tippy content={"Upload JSON File"}>
            <label htmlFor="file-upload" className={"tabletop-almanac-button top-button link"}>
                <svg viewBox="-136 -210 800 800" fill="currentColor">
                    <path d="M411.448,100.9l-94.7-94.7c-4.2-4.2-9.4-6.2-14.6-6.2h-210.1c-11.4,0-20.8,9.4-20.8,20.8v330.8c0,11.4,9.4,20.8,20.8,20.8 h132.1v95.7c0,11.4,9.4,20.8,20.8,20.8s20.8-9.4,20.8-19.8v-96.6h132.1c11.4,0,19.8-9.4,19.8-19.8V115.5 C417.748,110.3,415.648,105.1,411.448,100.9z M324.048,70.4l39.3,38.9h-39.3V70.4z M378.148,331.9h-112.3v-82.8l17.7,16.3 c10,10,25,3.1,28.1-1c7.3-8.3,7.3-21.8-1-29.1l-52-47.9c-8.3-7.3-20.8-7.3-28.1,0l-52,47.9c-8.3,8.3-8.3,20.8-1,29.1 c8.3,8.3,20.8,8.3,29.1,1l17.7-16.3v82.8h-111.4V41.6h169.6v86.3c0,11.4,9.4,20.8,20.8,20.8h74.9v183.2H378.148z"/>
                </svg>
            </label>
            </Tippy>
            <Tippy content={playerStatblockPopoverOpen ? "Close Statblock Popover" : "Open Statblock Popover"}>
                <button
                    className={`statblock-button top-button ${playerStatblockPopoverOpen ? "open" : ""}`}
                    onClick={async () => {
                        const playerId = OBR.player.id;
                        if (playerStatblockPopoverOpen) {
                            const statblockPopoverOpen: { [key: string]: boolean } = scene?.statblockPopoverOpen
                                ? { ...scene.statblockPopoverOpen }
                                : {};
                            statblockPopoverOpen[playerId] = false;
                            await updateSceneMetadata(scene, { statblockPopoverOpen: statblockPopoverOpen });
                            await OBR.popover.close(statblockPopoverId);
                        } else {
                            // width needs to be big, to position statblock popover to the right
                            let width = 10000;
                            let height = 600;
                            try {
                                width = await OBR.viewport.getWidth();
                                height = await OBR.viewport.getHeight();
                            } catch {}

                            const statblockPopoverOpen: { [key: string]: boolean } = scene?.statblockPopoverOpen
                                ? { ...scene.statblockPopoverOpen }
                                : {};
                            statblockPopoverOpen[playerId] = true;
                            await updateSceneMetadata(scene, { statblockPopoverOpen: statblockPopoverOpen });

                            await OBR.popover.open({
                                ...statblockPopover,
                                width: Math.min(room?.statblockPopover?.width || 500, width),
                                height: Math.min(room?.statblockPopover?.height || 600, height),
                                anchorPosition: { top: 55, left: width - 70 },
                            });
                        }
                    }}
                    title={"Statblocks"}
                >
                    <StatblockSvg />
                </button>
            </Tippy>
            <Tippy content={"Quick Reference DnD 5e"}>
                <button
                    className={"external-page-button top-button"}
                    onClick={async () => {
                        let width = 1200;
                        let height = 800;
                        try {
                            width = await OBR.viewport.getWidth();
                            height = await OBR.viewport.getHeight();
                        } catch {}
                        await OBR.modal.open({
                            ...quickReferenceModal,
                            width: Math.min(1200, width * 0.9),
                            height: Math.min(800, height * 0.9),
                        });
                    }}
                    title={"Quick Reference"}
                >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                        <g id="SVGRepo_iconCarrier">
                          <path d="M12 6.90909C10.8999 5.50893 9.20406 4.10877 5.00119 4.00602C4.72513 3.99928 4.5 4.22351 4.5 4.49965C4.5 6.54813 4.5 14.3034 4.5 16.597C4.5 16.8731 4.72515 17.09 5.00114 17.099C9.20405 17.2364 10.8999 19.0998 12 20.5M12 6.90909C13.1001 5.50893 14.7959 4.10877 18.9988 4.00602C19.2749 3.99928 19.5 4.21847 19.5 4.49461C19.5 6.78447 19.5 14.3064 19.5 16.5963C19.5 16.8724 19.2749 17.09 18.9989 17.099C14.796 17.2364 13.1001 19.0998 12 20.5M12 6.90909L12 20.5" stroke="#000000" stroke-linejoin="round"></path>
                          <path d="M19.2353 6H21.5C21.7761 6 22 6.22386 22 6.5V19.539C22 19.9436 21.5233 20.2124 21.1535 20.0481C20.3584 19.6948 19.0315 19.2632 17.2941 19.2632C14.3529 19.2632 12 21 12 21C12 21 9.64706 19.2632 6.70588 19.2632C4.96845 19.2632 3.64156 19.6948 2.84647 20.0481C2.47668 20.2124 2 19.9436 2 19.539V6.5C2 6.22386 2.22386 6 2.5 6H4.76471" stroke="#000000" stroke-linejoin="round"></path>
                        </g>
                    </svg>
                 </button>
            </Tippy>
            {playerContext.role == "GM" ? (
                <Tippy content={"Open Settings"}>
                    <button
                        className={"settings-button top-button"}
                        onClick={async () => {
                            let width = 600;
                            let height = 900;
                            try {
                                width = await OBR.viewport.getWidth();
                                height = await OBR.viewport.getHeight();
                            } catch {}
                            await OBR.modal.open({
                                ...settingsModal,
                                width: Math.min(500, width * 0.9),
                                height: Math.min(800, height * 0.9),
                            });
                        }}
                        title={"Settings"}
                    >
                        <SettingsSvg />
                    </button>
                </Tippy>
            ) : null}
            {/* <a
                href={"https://www.patreon.com/TTRPGAPI"}
                className={"patreon-button top-button link"}
                target={"_blank"}
                title={"Patreon Link"}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 436 476">
                    <path
                        data-fill="1"
                        d="M436 143c-.084-60.778-47.57-110.591-103.285-128.565C263.528-7.884 172.279-4.649 106.214 26.424 26.142 64.089.988 146.596.051 228.883c-.77 67.653 6.004 245.841 106.83 247.11 74.917.948 86.072-95.279 120.737-141.623 24.662-32.972 56.417-42.285 95.507-51.929C390.309 265.865 436.097 213.011 436 143Z"
                    ></path>
                </svg>
            </a> */}
            {/* <a href={"https://discord.gg/EMg7pRQ5Fm"} className={"discord-button top-button link"} title={"discord"}>
                <svg viewBox="0 0 127.14 96.36">
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                </svg>
            </a> */}
            <button style={{ display: "none" }} // remove this style to show the button
                className={`change-log-button top-button ${props.ignoredChanges ? "ignored" : ""}`}
                onClick={async () => {
                    if (props.setIgnoredChange !== undefined && props.ignoredChanges !== undefined) {
                        props.setIgnoredChange(!props.ignoredChanges);
                    }
                    let width = 700;
                    let height = 900;
                    try {
                        width = await OBR.viewport.getWidth();
                        height = await OBR.viewport.getHeight();
                    } catch {}
                    await OBR.modal.open({
                        ...changelogModal,
                        width: Math.min(600, width * 0.9),
                        height: Math.min(800, height * 0.9),
                    });
                }}
                title={"Changelog"}
            >
                i
            </button>
            <button
                className={"help-button top-button"}
                onClick={async () => {
                    let width = 800;
                    let height = 900;
                    try {
                        width = await OBR.viewport.getWidth();
                        height = await OBR.viewport.getHeight();
                    } catch {}
                    await OBR.modal.open({
                        ...helpModal,
                        width: Math.min(700, width * 0.9),
                        height: Math.min(800, height * 0.9),
                    });
                }}
                title={"Help"}
            >
                ?
            </button>
        </div>
    );
};
