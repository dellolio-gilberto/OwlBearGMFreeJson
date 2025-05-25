import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { components } from "../schema";
import { makeApiRequest, getTtrpgProxyUrl } from "../../helper/helpers.ts";
import { useMetadataContext } from "../../context/MetadataContext.ts";
import { useShallow } from "zustand/react/shallow";

export type PfStatblock = components["schemas"]["PFStatblockOut"];
export type PfSpell = components["schemas"]["SpellOut"];

const fetchPfSearch = (
    search_string: string,
    take: number,
    skip: number,
    api_key?: string,
    proxyUrl?: string
): Promise<Array<PfStatblock>> => {
    let headers = {};
    if (api_key) {
        headers = {
            Authorization: `Bearer ${api_key}`,
        };
    }
    return makeApiRequest("/pf/statblock/search/", headers, {
        name: search_string,
        take: take,
        skip: skip,
    }, "GET", proxyUrl).then((response) => response.data as Array<PfStatblock>);
};

const fetchPfStatblock = (slug: string, apiKey?: string, proxyUrl?: string): Promise<PfStatblock | null> => {
    let headers = {};
    if (apiKey) {
        headers = {
            Authorization: `Bearer ${apiKey}`,
        };
    }
    return makeApiRequest(`/pf/statblock/${slug}`, headers, {}, "GET", proxyUrl)
        .then((response) => {
            if (!response.data) {
                return null;
            } else {
                return response.data as PfStatblock;
            }
        });
};

const fetchPfSpell = (slug: string, apiKey?: string, proxyUrl?: string): Promise<PfSpell | null> => {
    let headers = {};
    if (apiKey) {
        headers = {
            Authorization: `Bearer ${apiKey}`,
        };
    }
    return makeApiRequest(`/pf/spell/${slug}`, headers, {}, "GET", proxyUrl)
        .then((response) => {
            if (!response.data) {
                return null;
            } else {
                return response.data as PfSpell;
            }
        });
};

export const usePfStatblockSearch = (search_string: string, take: number, skip: number) => {
    const room = useMetadataContext(useShallow((state) => state.room));
    const proxyUrl = getTtrpgProxyUrl(room || undefined);
    
    return useQuery<Array<PfStatblock>>({
        queryKey: [search_string, take, skip, "search", room?.tabletopAlmanacAPIKey, proxyUrl],
        queryFn: () => fetchPfSearch(search_string, take, skip, room?.tabletopAlmanacAPIKey, proxyUrl),
        enabled: search_string !== "",
    });
};

export const usePfGetStatblock = (slug: string) => {
    const room = useMetadataContext(useShallow((state) => state.room));
    const proxyUrl = getTtrpgProxyUrl(room || undefined);
    
    return useQuery<PfStatblock | null>({
        queryKey: [slug, "slug", room?.tabletopAlmanacAPIKey, proxyUrl],
        queryFn: () => fetchPfStatblock(slug, room?.tabletopAlmanacAPIKey, proxyUrl),
        enabled: slug !== "",
    });
};

export const usePfGetSpell = (slug: string) => {
    const room = useMetadataContext(useShallow((state) => state.room));
    const proxyUrl = getTtrpgProxyUrl(room || undefined);
    
    return useQuery<PfSpell | null>({
        queryKey: [slug, "slug", room?.tabletopAlmanacAPIKey, proxyUrl],
        queryFn: () => fetchPfSpell(slug, room?.tabletopAlmanacAPIKey, proxyUrl),
        enabled: slug !== "",
    });
};

export const usePFGetStatblockMutation = () => {
    const queryClient = useQueryClient();
    const room = useMetadataContext(useShallow((state) => state.room));
    const proxyUrl = getTtrpgProxyUrl(room || undefined);
    
    return useMutation({
        mutationKey: [],
        mutationFn: ({ slug, apiKey }: { slug: string; apiKey?: string }) => 
            fetchPfStatblock(slug, apiKey || room?.tabletopAlmanacAPIKey, proxyUrl),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["slug", variables.slug], refetchType: "all" });
            return data;
        },
    });
};