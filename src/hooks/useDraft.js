import { useEffect, useRef, useState, useCallback } from 'react';

const DRAFT_VERSION = 1;
const DEFAULT_INTERVAL_MS = 5000;
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const storageKey = (userId, formId) => `wms_draft_${userId}_${formId}`;

const readDraft = (key) => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || parsed.v !== DRAFT_VERSION) return null;
        return parsed;
    } catch {
        return null;
    }
};

const writeDraft = (key, data) => {
    try {
        localStorage.setItem(
            key,
            JSON.stringify({ v: DRAFT_VERSION, ts: Date.now(), data }),
        );
    } catch {

    }
};

const removeDraft = (key) => {
    try {
        localStorage.removeItem(key);
    } catch {

    }
};

export const useDraft = ({
    formId,
    userId,
    watch,
    reset,
    getValues,
    isEmpty,
    enabled = true,
    intervalMs = DEFAULT_INTERVAL_MS,
    ttlMs = DEFAULT_TTL_MS,
}) => {
    const key = userId && formId ? storageKey(userId, formId) : null;
    const [foundDraft, setFoundDraft] = useState(null);
    const decidedRef = useRef(false);
    const isEmptyRef = useRef(isEmpty);
    const getValuesRef = useRef(getValues);

    useEffect(() => { isEmptyRef.current = isEmpty; }, [isEmpty]);
    useEffect(() => { getValuesRef.current = getValues; }, [getValues]);

    useEffect(() => {
        if (!enabled || !key) return;
        const draft = readDraft(key);
        if (!draft) return;
        if (ttlMs && Date.now() - draft.ts > ttlMs) {
            removeDraft(key);
            return;
        }
        setFoundDraft({ ts: draft.ts, data: draft.data });
    }, [enabled, key, ttlMs]);

    const restore = useCallback(() => {
        if (foundDraft) reset(foundDraft.data);
        decidedRef.current = true;
        setFoundDraft(null);
    }, [foundDraft, reset]);

    const discard = useCallback(() => {
        if (key) removeDraft(key);
        decidedRef.current = true;
        setFoundDraft(null);
    }, [key]);

    const clear = useCallback(() => {
        if (key) removeDraft(key);
    }, [key]);

    useEffect(() => {
        if (!enabled || !key) return undefined;
        if (foundDraft && !decidedRef.current) return undefined;

        const persistIfDirty = () => {
            const values = getValuesRef.current();
            if (isEmptyRef.current && isEmptyRef.current(values)) {
                removeDraft(key);
                return;
            }
            writeDraft(key, values);
        };

        const intervalId = window.setInterval(persistIfDirty, intervalMs);
        const beforeUnload = () => persistIfDirty();
        window.addEventListener('beforeunload', beforeUnload);

        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener('beforeunload', beforeUnload);
        };
    }, [enabled, key, foundDraft, intervalMs]);

    useEffect(() => {
        if (!watch) return undefined;
        const sub = watch(() => {});
        return () => sub?.unsubscribe?.();
    }, [watch]);

    return {
        hasDraft: !!foundDraft,
        draftTimestamp: foundDraft?.ts || null,
        restore,
        discard,
        clear,
    };
};

export default useDraft;
