import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../hooks/useAuth";
import {
    useJournal,
    useCreateJournal,
    useUpdateJournal,
} from "../hooks/useJournals";

const schema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().optional(),
});

type JournalForm = z.infer<typeof schema>;

export default function JournalEditor() {
    const { id } = useParams();
    const isEdit = !!id;
    const { user } = useAuth();
    const navigate = useNavigate();
    const username = user?.username ?? "";

    const { data: existing } = useJournal(username, id ?? "");
    const createJournal = useCreateJournal();
    const updateJournal = useUpdateJournal();

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<JournalForm>({ resolver: zodResolver(schema) });

    useEffect(() => {
        if (existing)
            reset({ title: existing.title, content: existing.content });
    }, [existing, reset]);

    const onSubmit = async (data: JournalForm) => {
        try {
            if (isEdit && id) {
                await updateJournal.mutateAsync({ username, id, data });
            } else {
                await createJournal.mutateAsync({ username, data });
            }
            navigate(`/`);
        } catch {
            setError("root", { message: "Failed to save journal" });
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            <h1 className="text-2xl font-bold text-on-surface">
                {isEdit ? "Edit Journal" : "New Journal"}
            </h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <input
                        {...register("title")}
                        placeholder="Title"
                        className="w-full px-3 py-2 rounded-lg border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {errors.title && (
                        <p className="text-sm text-red-500 mt-1">
                            {errors.title.message}
                        </p>
                    )}
                </div>

                <div>
                    <textarea
                        {...register("content")}
                        placeholder="Write your journal entry..."
                        rows={12}
                        className="w-full px-3 py-2 rounded-lg border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                    />
                    {errors.content && (
                        <p className="text-sm text-red-500 mt-1">
                            {errors.content.message}
                        </p>
                    )}
                </div>

                {errors.root && (
                    <p className="text-sm text-red-500">
                        {errors.root.message}
                    </p>
                )}

                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
                    >
                        {isSubmitting
                            ? "Saving..."
                            : isEdit
                              ? "Update"
                              : "Create"}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-6 py-2 rounded-lg border border-outline text-on-surface hover:bg-surface-alt transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
