import { Modal } from "@owlbear-rodeo/sdk/lib/types/Modal";
import { Popover } from "@owlbear-rodeo/sdk";
import { Stats } from "../components/general/DiceRoller/DiceButtonWrapper.tsx";

export const ID = "com.bitperfect-software.hp-tracker";
export const metadataKey = `${ID}/metadata`;
export const itemMetadataKey = `${ID}/data`;
export const infoMetadataKey = `${ID}/text`;

export const modalId = `${ID}/modal`;
export const diceTrayModalId = `${ID}/diceTrayModal`;
export const statblockPopoverId = `${ID}/statblock-popover`;
export const rollLogPopoverId = `${ID}/dice-log`;
export const shortRestPopoverId = `${ID}/short-rest`;
export const rollMessageChannel = `${ID}.roll-event`;

export const prettySordidID = "com.pretty-initiative";

export const version = "3.3.4";

export const changelogModal: Modal = {
    id: modalId,
    url: "/OwlBearGMFreeJson/modal.html?content=changelog",
};

export const helpModal: Modal = {
    id: modalId,
    url: "/OwlBearGMFreeJson/modal.html?content=help",
};

export const settingsModal: Modal = {
    id: modalId,
    url: "/OwlBearGMFreeJson/modal.html?content=settings",
};

export const diceModal: Modal = {
    id: modalId,
    url: "/OwlBearGMFreeJson/modal.html?content=dddice",
};

export const diceTrayModal: Modal = {
    id: diceTrayModalId,
    url: "/OwlBearGMFreeJson/modal.html?content=dicetray",
    fullScreen: true,
    hidePaper: true,
    hideBackdrop: true,
    disablePointerEvents: true,
};

export const rollLogPopover: Popover = {
    id: rollLogPopoverId,
    url: "/OwlBearGMFreeJson/rolllog.html",
    width: 350,
    height: 200,
    anchorOrigin: { horizontal: "RIGHT", vertical: "BOTTOM" },
    transformOrigin: { vertical: "BOTTOM", horizontal: "RIGHT" },
    marginThreshold: 10,
    disableClickAway: true,
    hidePaper: true,
};

export const statblockPopover: Popover = {
    id: statblockPopoverId,
    url: "/OwlBearGMFreeJson/statblock.html",
    width: 500,
    height: 600,
    transformOrigin: { vertical: "TOP", horizontal: "RIGHT" },
    marginThreshold: 10,
    anchorReference: "POSITION",
    disableClickAway: true,
};

export const defaultStats: Stats = {
    strength: 0,
    dexterity: 0,
    constitution: 0,
    intelligence: 0,
    wisdom: 0,
    charisma: 0,
};

export const quickReferenceModal: Modal = {
    id: "quickreference.modal",
    url: "https://dnd.milobedzki.pl/",
    height: 800,
    width: 1200,
};

export const mapAzgaar: Modal = {
    id: "mapAzgaar.modal",
    url: "https://azgaar.github.io/Fantasy-Map-Generator/",
    height: 800,
    width: 1200,
};

export const AlmanacTable: Modal = {
    id: "Almanac.modal",
    url: "https://tabletop-almanac.com",
    height: 800,
    width: 1200,
};