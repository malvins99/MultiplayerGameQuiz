export interface HairOption {
    id: number;
    name: string;
    idleKey: string;
    walkKey: string;
}

export const HAIR_OPTIONS: HairOption[] = [
    { id: 0, name: "Default (None)", idleKey: "base_idle", walkKey: "base_walk" },
    { id: 1, name: "Bowl Hair", idleKey: "bowlhair_idle", walkKey: "bowlhair_walk" },
    { id: 2, name: "Curly Hair", idleKey: "curlyhair_idle", walkKey: "curlyhair_walk" },
    { id: 3, name: "Long Hair", idleKey: "longhair_idle", walkKey: "longhair_walk" },
    { id: 4, name: "Mop Hair", idleKey: "mophair_idle", walkKey: "mophair_walk" },
    { id: 5, name: "Short Hair", idleKey: "shorthair_idle", walkKey: "shorthair_walk" },
    { id: 6, name: "Spikey Hair", idleKey: "spikeyhair_idle", walkKey: "spikeyhair_walk" },
];

export const getHairById = (id: number): HairOption => {
    return HAIR_OPTIONS.find(h => h.id === id) || HAIR_OPTIONS[0];
};
