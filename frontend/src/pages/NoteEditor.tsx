import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { defaultMarkdownSerializer } from "prosemirror-markdown";
import { z } from "zod";
import {
    ArrowLeft,
    Bold,
    FileText,
    Heading1,
    Heading2,
    Heading3,
    Italic,
    List,
    ListOrdered,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useAuth } from "../hooks/useAuth";
import { useNote, useCreateNote, useUpdateNote } from "../hooks/useNotes";

const schema = z.object({
    title: z.string().min(1, "Title is required"),
});

type NoteForm = z.infer<typeof schema>;

function ToolbarButton({
    onClick,
    active,
    children,
}: {
    onClick: () => void;
    active: boolean;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`p-1.5 rounded transition-colors ${
                active
                    ? "bg-primary text-white"
                    : "text-on-surface-muted hover:bg-hover hover:text-on-surface"
            }`}
        >
            {children}
        </button>
    );
}

export default function NoteEditor() {
    const { id } = useParams();
    const isEdit = !!id;
    const { user } = useAuth();
    const navigate = useNavigate();
    const username = user?.username ?? "";

    const { data: existing } = useNote(username, id ?? "");
    const createNote = useCreateNote();
    const updateNote = useUpdateNote();

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder: "Write your note..." }),
        ],
        content:
            isEdit && existing?.contentJson
                ? existing.contentJson
                : { type: "doc", content: [{ type: "paragraph" }] },
    });

    useEffect(() => {
        if (isEdit && existing?.contentJson && editor) {
            const currentJson = editor.getJSON();
            const existingJson = existing.contentJson;
            if (JSON.stringify(currentJson) !== JSON.stringify(existingJson)) {
                editor.commands.setContent(existingJson);
            }
        }
    }, [existing, editor, isEdit]);

    useEffect(() => {
        return () => editor?.destroy();
    }, [editor]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<NoteForm>({ resolver: zodResolver(schema) });

    useEffect(() => {
        if (existing) reset({ title: existing.title });
    }, [existing, reset]);

    const onSubmit = async (data: NoteForm) => {
        if (!editor) return;
        try {
            const markdown = editor?.state.doc
                ? defaultMarkdownSerializer.serialize(editor.state.doc)
                : "";
            const payload = {
                title: data.title,
                content: markdown,
                contentJson: editor.getJSON(),
            };
            if (isEdit && id) {
                await updateNote.mutateAsync({ username, id, data: payload });
                toast.success("Note updated");
            } else {
                await createNote.mutateAsync({ username, data: payload });
                toast.success("Note created");
            }
            navigate("/");
        } catch {
            toast.error("Failed to save note");
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
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

                <div className="flex items-center gap-1 px-1 py-2 border-b border-outline">
                    <ToolbarButton
                        onClick={() =>
                            editor
                                ?.chain()
                                .focus()
                                .toggleHeading({ level: 1 })
                                .run()
                        }
                        active={
                            editor?.isActive("heading", { level: 1 }) ?? false
                        }
                    >
                        <Heading1 size={18} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() =>
                            editor
                                ?.chain()
                                .focus()
                                .toggleHeading({ level: 2 })
                                .run()
                        }
                        active={
                            editor?.isActive("heading", { level: 2 }) ?? false
                        }
                    >
                        <Heading2 size={18} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() =>
                            editor
                                ?.chain()
                                .focus()
                                .toggleHeading({ level: 3 })
                                .run()
                        }
                        active={
                            editor?.isActive("heading", { level: 3 }) ?? false
                        }
                    >
                        <Heading3 size={18} />
                    </ToolbarButton>
                    <span className="w-px h-5 bg-outline mx-1" />
                    <ToolbarButton
                        onClick={() =>
                            editor?.chain().focus().toggleBold().run()
                        }
                        active={editor?.isActive("bold") ?? false}
                    >
                        <Bold size={18} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() =>
                            editor?.chain().focus().toggleItalic().run()
                        }
                        active={editor?.isActive("italic") ?? false}
                    >
                        <Italic size={18} />
                    </ToolbarButton>
                    <span className="w-px h-5 bg-outline mx-1" />
                    <ToolbarButton
                        onClick={() =>
                            editor?.chain().focus().toggleBulletList().run()
                        }
                        active={editor?.isActive("bulletList") ?? false}
                    >
                        <List size={18} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() =>
                            editor?.chain().focus().toggleOrderedList().run()
                        }
                        active={editor?.isActive("orderedList") ?? false}
                    >
                        <ListOrdered size={18} />
                    </ToolbarButton>
                </div>

                <div className="min-h-50 prose prose-sm max-w-none">
                    <EditorContent editor={editor} />
                </div>

                <div className="flex gap-3 pt-2">
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
                </div>
            </form>
        </div>
    );
}
