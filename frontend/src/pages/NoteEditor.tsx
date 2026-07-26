import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    ArrowLeft,
    FileText,
    Loader2,
    Maximize2,
    Minimize2,
    WrapText,
    Plus,
    List,
    Search,
} from "lucide-react";
import { toast } from "sonner";
import { get, set, del } from "idb-keyval";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "../hooks/useAuth";
import { useNote, useCreateNote, useUpdateNote } from "../hooks/useNotes";
import { useMdEditor } from "../hooks/useMdEditor";
import type { NoteDraft, NoteType } from "../types/note";
import { useDebouncedCallback } from "../hooks/useDebouncedCallback";
import { useVaultStore } from "../store/vaultStore";
import EditorOutline from "../components/EditorOutline";

const schema = z.object({
    title: z.string().min(1, "Title is required"),
    noteType: z.string().optional(),
});

type NoteForm = z.infer<typeof schema>;

export default function NoteEditor() {
    const { id } = useParams();
    const isEdit = !!id;
    const { user } = useAuth();
    const navigate = useNavigate();
    const username = user?.username ?? "";
    const DRAFT_KEY = isEdit ? `note-working:${id}` : "note-draft:__new__";

    const { data: existing } = useNote(
        username,
        id ?? "",
        isEdit ? { staleTime: Infinity } : undefined,
    );
    const createNote = useCreateNote();
    const updateNote = useUpdateNote();

    const {
        register,
        handleSubmit,
        reset,
        getValues,
        formState: { errors, isSubmitting },
    } = useForm<NoteForm>({ resolver: zodResolver(schema) });

    type AutoSaveStatus = "idle" | "saved" | "failed";
    const [autoSaveStatus, setAutoSaveStatus] =
        useState<AutoSaveStatus>("idle");
    const dirtyRef = useRef(false);
    const lastSavedRef = useRef("");
    const [wrapped, setWrapped] = useState(true);
    const [showOutline, setShowOutline] = useState(false);
    const editorMode = useVaultStore((s) => s.editorMode);
    const focusMode = useVaultStore((s) => s.focusMode);
    const setEditorMode = useVaultStore((s) => s.setEditorMode);
    const setFocusMode = useVaultStore((s) => s.setFocusMode);
    const [hasUnsaved, setHasUnsaved] = useState(false);
    const serverContentRef = useRef("");
    const getDebouncedSaveRef = useRef<() => void>(() => {});
    const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const {
        editorRef,
        getValue,
        setValue,
        ready,
        setWrap,
        stats,
        triggerCompletion,
        headings,
        scrollTo,
        openSearch,
    } = useMdEditor({
        onDocChange: () => {
            dirtyRef.current = true;
            getDebouncedSaveRef.current();
        },
    });

    const { call: debouncedSave } = useDebouncedCallback(() => {
        const content = getValue();
        const title = getValues("title");
        if (content === lastSavedRef.current) return;
        const draft: NoteDraft = { title, content, savedAt: Date.now() };
        set(DRAFT_KEY, draft).catch(() => {});
        lastSavedRef.current = content;
        setAutoSaveStatus("saved");
        setHasUnsaved(isEdit && content !== serverContentRef.current);
        if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
        statusTimeoutRef.current = setTimeout(
            () => setAutoSaveStatus("idle"),
            3000,
        );
    }, 1500);

    useEffect(() => {
        getDebouncedSaveRef.current = debouncedSave;
    });

    // Restore draft on mount (create mode only — edit mode always loads from server)
    useEffect(() => {
        if (isEdit) return;
        (async () => {
            try {
                const draft = await get<NoteDraft>("note-draft:__new__");
                if (draft) {
                    reset({ title: draft.title });
                    setValue(draft.content);
                }
            } catch {
                /* ignore corrupted data */
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync when editor is ready and existing note loads (edit mode)
    useEffect(() => {
        if (!isEdit || !existing || !ready) return;
        (async () => {
            const key = "note-working:" + id;
            try {
                const working = await get<NoteDraft>(key);
                const serverTime = new Date(existing.updatedAt).getTime();
                if (working && working.savedAt > serverTime) {
                    // Fresh working copy — load from it
                    reset({ title: working.title });
                    setValue(working.content);
                    serverContentRef.current = existing.content;
                } else {
                    // Stale or absent — write fresh server data as working copy
                    if (working) {
                        await del(key);
                    }
                    await set(key, {
                        title: existing.title,
                        content: existing.content,
                        savedAt: Date.now(),
                    });
                    setValue(existing.content);
                    reset({
                        title: existing.title,
                        noteType: existing.noteType,
                    });
                    serverContentRef.current = existing.content;
                }
                lastSavedRef.current = existing.content;
            } catch {
                // Fallback to server
                setValue(existing.content);
                reset({ title: existing.title, noteType: existing.noteType });
                serverContentRef.current = existing.content;
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [existing, ready, id, isEdit]);

    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (dirtyRef.current) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handler);
        return () => {
            window.removeEventListener("beforeunload", handler);
            if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
        };
    }, []);

    const currentWorkspaceId = useVaultStore((s) => s.currentWorkspaceId);
    const currentFolderId = useVaultStore((s) => s.currentFolderId);
    const onSubmit = useCallback(
        async (data: NoteForm) => {
            try {
                const payload = {
                    title: data.title,
                    content: getValue(),
                    noteType: (data.noteType as NoteType) || "BASIC",
                    workspaceId: currentWorkspaceId ?? undefined,
                    folderId: currentFolderId ?? undefined,
                };
                if (isEdit && id) {
                    await updateNote.mutateAsync({
                        username,
                        id,
                        data: payload,
                    });
                    toast.success("Note updated");
                } else {
                    await createNote.mutateAsync({ username, data: payload });
                    toast.success("Note created");
                }
                if (isEdit) {
                    await del("note-working:" + id);
                } else {
                    await del("note-draft:__new__");
                }
                dirtyRef.current = false;
                navigate("/");
            } catch {
                toast.error("Failed to save note");
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [isEdit, id, username, currentWorkspaceId, currentFolderId],
    );

    return (
        <div
            className={`max-w-5xl mx-auto space-y-6 animate-fadeIn ${focusMode ? "max-w-full mx-0" : ""}`}
        >
            <div
                className={`flex items-center justify-between ${focusMode ? "hidden" : ""}`}
            >
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                await del(DRAFT_KEY);
                            } catch {
                                /* ok */
                            }
                            navigate(-1);
                        }}
                        className="p-1.5 rounded-lg text-on-surface-muted hover:bg-hover hover:text-on-surface transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-semibold text-on-surface">
                        {isEdit ? "Edit Note" : "New Note"}
                    </h1>
                </div>
            </div>

            {focusMode && (
                <button
                    type="button"
                    onClick={() => setFocusMode(false)}
                    className="fixed top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-alt border border-outline text-sm text-on-surface-muted hover:text-on-surface hover:bg-hover transition-colors shadow-lg"
                    title="Exit focus mode"
                >
                    <Minimize2 size={16} />
                    <span className="hidden sm:inline">Exit focus</span>
                </button>
            )}
            {/* eslint-disable-next-line react-hooks/refs -- handleSubmit calls onSubmit only on form submission, not during render */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div
                    className={`flex items-center gap-3 ${focusMode ? "hidden" : ""}`}
                >
                    <FileText size={20} className="text-primary shrink-0" />
                    <label htmlFor="note-title" className="sr-only">
                        Title
                    </label>
                    <input
                        id="note-title"
                        {...register("title")}
                        placeholder="Title"
                        className="flex-1 text-xl font-semibold bg-transparent text-on-surface placeholder:text-on-surface-muted border-none focus:outline-none"
                    />
                </div>
                {errors.title && (
                    <p className="text-xs text-red-400 ml-9">
                        {errors.title.message}
                    </p>
                )}

                <div
                    className={`flex items-center gap-2 ${focusMode ? "hidden" : ""}`}
                >
                    <label className="text-xs text-on-surface-muted">
                        Type
                    </label>
                    <select
                        {...register("noteType")}
                        defaultValue="BASIC"
                        className="text-xs bg-surface-alt border border-outline rounded px-2 py-1 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        <option value="BASIC">Basic</option>
                        <option value="DAILY">Daily</option>
                        <option value="TASK">Task</option>
                        <option value="DATABASE">Database</option>
                        <option value="JOURNAL">Journal</option>
                        <option value="MEETING">Meeting</option>
                        <option value="PROJECT">Project</option>
                        <option value="WHITEBOARD">Whiteboard</option>
                    </select>
                    <div className="flex-1" />
                    <button
                        type="button"
                        onClick={() =>
                            setEditorMode(
                                editorMode === "read" ? "edit" : "read",
                            )
                        }
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs border border-outline transition-colors ${
                            editorMode === "read"
                                ? "bg-primary/10 text-primary border-primary/30"
                                : "text-on-surface-muted hover:text-on-surface hover:bg-hover"
                        }`}
                    >
                        <FileText size={14} />
                        {editorMode === "read" ? "Edit" : "Read"}
                    </button>
                    <button
                        type="button"
                        onClick={() => setFocusMode(!focusMode)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs border border-outline transition-colors ${
                            focusMode
                                ? "bg-primary/10 text-primary border-primary/30"
                                : "text-on-surface-muted hover:text-on-surface hover:bg-hover"
                        }`}
                        title="Focus mode"
                    >
                        {focusMode ? (
                            <Minimize2 size={14} />
                        ) : (
                            <Maximize2 size={14} />
                        )}
                    </button>
                </div>

                <div className="relative">
                    <div className={editorMode === "read" ? "" : "hidden"}>
                        <div className="min-h-100 prose prose-sm max-w-none p-3">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {getValue()}
                            </ReactMarkdown>
                        </div>
                    </div>
                    <div
                        ref={editorRef}
                        className={`${focusMode ? "min-h-[calc(100vh-2rem)]" : "min-h-100"} border border-outline rounded-lg p-3 focus-within:ring-1 focus-within:ring-primary ${editorMode === "edit" ? "" : "hidden"}`}
                    />
                    {showOutline && headings.length > 0 && (
                        <EditorOutline
                            headings={headings}
                            words={stats.words}
                            onHeadingClick={scrollTo}
                            onClose={() => setShowOutline(false)}
                        />
                    )}
                </div>
                <div
                    className={`flex items-center gap-2 ${focusMode ? "hidden" : ""}`}
                >
                    {!isEdit && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                            Draft
                        </span>
                    )}
                    {isEdit && hasUnsaved && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                            Unsaved
                        </span>
                    )}
                </div>

                <div className={`${focusMode ? "hidden" : ""}`}>
                    <div className="flex items-center gap-1 flex-wrap border border-outline rounded-lg px-3 py-1.5 text-xs text-on-surface-muted">
                        <button
                            type="button"
                            onClick={() => {
                                setWrapped(!wrapped);
                                setWrap(!wrapped);
                            }}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
                                wrapped
                                    ? "bg-primary/10 text-primary"
                                    : "hover:bg-hover"
                            }`}
                        >
                            <WrapText size={14} />
                            Wrap
                        </button>

                        <button
                            type="button"
                            onClick={triggerCompletion}
                            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-hover transition-colors"
                            title="Insert block (/)"
                        >
                            <Plus size={14} />
                        </button>

                        <button
                            type="button"
                            onClick={openSearch}
                            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-hover transition-colors"
                            title="Find (Ctrl+F)"
                        >
                            <Search size={14} />
                        </button>

                        {headings.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setShowOutline(!showOutline)}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
                                    showOutline
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-hover"
                                }`}
                                title="Outline"
                            >
                                <List size={14} />
                            </button>
                        )}

                        <span className="ml-auto hidden sm:flex items-center gap-3">
                            <span>{stats.words} words</span>
                            <span>{stats.chars} chars</span>
                        </span>
                    </div>
                    <div className="flex sm:hidden justify-end gap-3 px-3 py-1 text-xs text-on-surface-muted">
                        <span>{stats.words} words</span>
                        <span>{stats.chars} chars</span>
                    </div>
                </div>

                <div
                    className={`flex items-center gap-3 pt-2 ${focusMode ? "hidden" : ""}`}
                >
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors active:scale-[0.98]"
                        >
                            {isSubmitting && (
                                <Loader2 size={14} className="animate-spin" />
                            )}
                            {isSubmitting
                                ? "Saving..."
                                : isEdit
                                  ? "Update"
                                  : "Create"}
                        </button>
                        <button
                            type="button"
                            onClick={async () => {
                                try {
                                    await del(DRAFT_KEY);
                                } catch {
                                    /* ok */
                                }
                                navigate(-1);
                            }}
                            className="px-5 py-2 rounded-lg border border-outline text-sm text-on-surface-muted hover:bg-hover transition-colors"
                        >
                            Cancel
                        </button>
                        {isEdit && autoSaveStatus !== "idle" && (
                            <span
                                className={`text-xs ${
                                    autoSaveStatus === "saved"
                                        ? "text-green-500"
                                        : "text-red-400"
                                }`}
                            >
                                {autoSaveStatus === "saved" && "Saved ✓"}
                                {autoSaveStatus === "failed" && "Save failed"}
                            </span>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}
