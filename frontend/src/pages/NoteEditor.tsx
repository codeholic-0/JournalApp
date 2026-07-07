import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, FileText, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import { useAuth } from "../hooks/useAuth";
import { useNote, useCreateNote, useUpdateNote } from "../hooks/useNotes";
import { useMdEditor } from "../hooks/useMdEditor";
import type { NoteDraft, NoteType } from "../types/note";
import { useDebouncedCallback } from "../hooks/useDebouncedCallback";
import { useVaultStore } from "../store/vaultStore";

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
    const draftKey = `note-draft:${id || "new"}`;

    const { data: existing } = useNote(username, id ?? "");
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
    const [previewMd, setPreviewMd] = useState("");
    const dirtyRef = useRef(false);
    const lastSavedRef = useRef("");

    const [showPreview, setShowPreview] = useState(
        () => localStorage.getItem("md-preview") === "true",
    );

    const getDebouncedSaveRef = useRef<() => void>(() => {});
    const getDebouncedPreviewRef = useRef<(v: string) => void>(() => {});

    const { editorRef, getValue, setValue } = useMdEditor({
        onDocChange: (value) => {
            dirtyRef.current = true;
            getDebouncedSaveRef.current();
            getDebouncedPreviewRef.current(value);
        },
    });

    const debouncedSave = useDebouncedCallback(() => {
        const content = getValue();
        const title = getValues("title");
        if (content === lastSavedRef.current) return;

        const draft: NoteDraft = { title, content, savedAt: Date.now() };
        localStorage.setItem(draftKey, JSON.stringify(draft));
        lastSavedRef.current = content;
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus("idle"), 3000);
    }, 1500);

    const debouncedPreview = useDebouncedCallback((value: string) => {
        setPreviewMd(value);
    }, 250);

    useEffect(() => {
        getDebouncedSaveRef.current = debouncedSave;
        getDebouncedPreviewRef.current = debouncedPreview;
    });

    // Restore draft on mount
    useEffect(() => {
        const raw = localStorage.getItem(draftKey);
        if (!raw) return;
        try {
            const draft: NoteDraft = JSON.parse(raw);
            if (!isEdit || !existing) {
                reset({ title: draft.title });
                setValue(draft.content);
            }
        } catch {
            /* ignore */
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync when existing note loads (edit mode)
    useEffect(() => {
        if (isEdit && existing?.content) {
            lastSavedRef.current = existing.content;
            if (!dirtyRef.current) {
                setValue(existing.content);
                reset({ title: existing.title, noteType: existing.noteType });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [existing]);

    const togglePreview = () => {
        setShowPreview((p) => {
            const next = !p;
            localStorage.setItem("md-preview", String(next));
            return next;
        });
    };
    const currentWorkspaceId = useVaultStore((s) => s.currentWorkspaceId);
    const onSubmit = async (data: NoteForm) => {
        try {
            const payload = {
                title: data.title,
                content: getValue(),
                noteType: (data.noteType as NoteType) || "BASIC",
                workspaceId: currentWorkspaceId ?? undefined,
            };
            if (isEdit && id) {
                await updateNote.mutateAsync({ username, id, data: payload });
                toast.success("Note updated");
            } else {
                await createNote.mutateAsync({ username, data: payload });
                toast.success("Note created");
            }
            localStorage.removeItem(draftKey);
            navigate("/");
        } catch {
            toast.error("Failed to save note");
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-1.5 rounded-lg text-on-surface-muted hover:bg-hover hover:text-on-surface transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-semibold text-on-surface">
                        {isEdit ? "Edit Note" : "New Note"}
                    </h1>
                </div>
                <button
                    type="button"
                    onClick={togglePreview}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline text-sm text-on-surface-muted hover:text-on-surface hover:bg-hover transition-colors"
                >
                    {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                    {showPreview ? "Editor only" : "Rendered MD"}
                </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex items-center gap-3">
                    <FileText size={20} className="text-primary shrink-0" />
                    <input
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

                <div className="flex items-center gap-2">
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
                </div>

                <div className={showPreview ? "grid grid-cols-2 gap-4" : ""}>
                    <div
                        ref={editorRef}
                        className="min-h-100 border border-outline rounded-lg p-3 focus-within:ring-1 focus-within:ring-primary"
                    />
                    {showPreview && (
                        <div className="prose prose-sm max-w-none border border-outline rounded-lg p-3 overflow-auto min-h-100">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[
                                    rehypeSanitize,
                                    [
                                        rehypeHighlight,
                                        { detect: true, ignoreMissing: true },
                                    ],
                                ]}
                                components={{
                                    a: ({ ...props }) => (
                                        <a
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            {...props}
                                        />
                                    ),
                                }}
                            >
                                {previewMd}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 pt-2">
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
                            onClick={() => navigate(-1)}
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
