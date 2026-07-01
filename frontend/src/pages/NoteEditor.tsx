import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useNote, useCreateNote, useUpdateNote } from "../hooks/useNotes";

const schema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().optional(),
});

type NoteForm = z.infer<typeof schema>;

export default function NoteEditor() {
    const { id } = useParams();
    const isEdit = !!id;
    const { user } = useAuth();
    const navigate = useNavigate();
    const username = user?.username ?? "";

    const { data: existing } = useNote(username, id ?? "");
    const createNote = useCreateNote();
    const updateNote = useUpdateNote();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<NoteForm>({ resolver: zodResolver(schema) });

    useEffect(() => {
        if (existing)
            reset({ title: existing.title, content: existing.content });
    }, [existing, reset]);

    const onSubmit = async (data: NoteForm) => {
        try {
            const payload = {
                title: data.title,
                content: data.content || "",
                contentJson: data.content
                    ? {
                          type: "doc",
                          content: [
                              {
                                  type: "paragraph",
                                  content: [
                                      { type: "text", text: data.content },
                                  ],
                              },
                          ],
                      }
                    : null,
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

                <textarea
                    {...register("content")}
                    placeholder="Write your note entry..."
                    rows={1}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = "auto";
                        target.style.height = target.scrollHeight + "px";
                    }}
                    className="w-full bg-transparent text-on-surface placeholder:text-on-surface-muted border-none focus:outline-none resize-none leading-relaxed min-h-50"
                />
                {errors.content && (
                    <p className="text-xs text-red-400">
                        {errors.content.message}
                    </p>
                )}

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
