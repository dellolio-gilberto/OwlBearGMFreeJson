import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { components } from "../schema";
import { makeApiRequest, getTtrpgProxyUrl } from "../../helper/helpers.ts";
import { useMetadataContext } from "../../context/MetadataContext.ts";
import { useShallow } from "zustand/react/shallow";

export type E5Statblock = components["schemas"]["E5StatblockOut"];
export type E5SpellSlot = components["schemas"]["SpellSlots-Output"];

const fetchE5Search = (
    search_string: string,
    take: number,
    skip: number,
    apiKey?: string,
    proxyUrl?: string
): Promise<Array<E5Statblock>> => {
    let headers = {};
    if (apiKey) {
        headers = {
            Authorization: `Bearer ${apiKey}`,
        };
    }
    return makeApiRequest("/e5/statblock/search/", headers, {
        search_string: search_string,
        take: take,
        skip: skip,
    }, "GET", proxyUrl).then((response) => response.data as Array<E5Statblock>);
};

const fetchStatblock = (slug: string, apiKey?: string, proxyUrl?: string): Promise<E5Statblock | null> => {
    let headers = {};
    if (apiKey) {
        headers = {
            Authorization: `Bearer ${apiKey}`,
        };
    }
    return makeApiRequest(`/e5/statblock/${slug}`, headers, {}, "GET", proxyUrl)
        .then((response) => {
            if (!response.data) {
                return null;
            } else {
                return response.data as E5Statblock;
            }
        });
};

export const useE5SearchStatblock = (search_string: string, take: number, skip: number) => {
    const room = useMetadataContext(useShallow((state) => state.room));
    const proxyUrl = getTtrpgProxyUrl(room || undefined);
    
    return useQuery<Array<E5Statblock>>({
        queryKey: ["search", search_string, take, skip, room?.tabletopAlmanacAPIKey, proxyUrl],
        queryFn: () => fetchE5Search(search_string, take, skip, room?.tabletopAlmanacAPIKey, proxyUrl),
        enabled: search_string !== "",
    });
};

export const useE5GetStatblock = (slug: string) => {
    const room = useMetadataContext(useShallow((state) => state.room));
    const proxyUrl = getTtrpgProxyUrl(room || undefined);
    
    return useQuery<E5Statblock | null>({
        queryKey: ["slug", slug, room?.tabletopAlmanacAPIKey, proxyUrl],
        queryFn: () => fetchStatblock(slug, room?.tabletopAlmanacAPIKey, proxyUrl),
        enabled: slug !== "",
    });
};

export const useE5GetStatblockMutation = () => {
    const queryClient = useQueryClient();
    const room = useMetadataContext(useShallow((state) => state.room));
    const proxyUrl = getTtrpgProxyUrl(room || undefined);
    
    return useMutation({
        mutationKey: [],
        mutationFn: ({ slug }: { slug: string }) => fetchStatblock(slug, room?.tabletopAlmanacAPIKey, proxyUrl),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["slug", variables.slug] });
            return data;
        },
    });
};