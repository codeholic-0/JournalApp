import {
    type Completion,
    type CompletionSource,
    CompletionContext,
} from "@codemirror/autocomplete";

import { type EditorView } from "@codemirror/view";

interface SlashItem {
    label: string;
    detail: string;
    type: string;
    apply: string;
    cursorOffset?: number;
}

const items: SlashItem[] = [
    {
        label: "Heading 1",
        detail: "h1",
        type: "keyword",
        apply: "# ",
        cursorOffset: 2,
    },
    {
        label: "Heading 2",
        detail: "h2",
        type: "keyword",
        apply: "## ",
        cursorOffset: 3,
    },
    {
        label: "Heading 3",
        detail: "h3",
        type: "keyword",
        apply: "### ",
        cursorOffset: 4,
    },
    {
        label: "Bullet List",
        detail: "ul",
        type: "keyword",
        apply: "- ",
        cursorOffset: 2,
    },
    {
        label: "Numbered List",
        detail: "ol",
        type: "keyword",
        apply: "1. ",
        cursorOffset: 3,
    },
    {
        label: "Todo",
        detail: "task",
        type: "keyword",
        apply: "- [ ] ",
        cursorOffset: 6,
    },
    {
        label: "Quote",
        detail: "blockquote",
        type: "keyword",
        apply: "> ",
        cursorOffset: 2,
    },
    {
        label: "Divider",
        detail: "hr",
        type: "keyword",
        apply: "---\n\n",
        cursorOffset: 5,
    },
    {
        label: "Code Block",
        detail: "code",
        type: "keyword",
        apply: "```language\n\n```",
        cursorOffset: 14,
    },
    {
        label: "Callout",
        detail: "note",
        type: "keyword",
        apply: "> [!NOTE] ",
        cursorOffset: 10,
    },
];

function buildOptions(query: string) {
    return items
        .filter((item) => {
            const label = item.label.toLowerCase().replace(/\s/g, "");
            return label.startsWith(query) || item.detail.startsWith(query);
        })
        .map((item) => ({
            label: item.label,
            detail: item.detail,
            apply: (
                view: EditorView,
                _completion: Completion,
                from: number,
                to: number,
            ) => {
                view.dispatch({
                    changes: { from, to, insert: item.apply },
                    selection: {
                        anchor: from + (item.cursorOffset ?? item.apply.length),
                    },
                });
            },
        }));
}

export const slashMenu: CompletionSource = (context: CompletionContext) => {
    const match = context.matchBefore(/(?:^|\s)\/\w*$/);

    if (match && match.from < match.to) {
        const query = match.text.replace(/^.*\//, "").toLowerCase();
        return {
            from: match.from,
            to: match.to,
            options: buildOptions(query),
            filter: false,
        };
    }

    if (context.explicit) {
        return {
            from: context.pos,
            to: context.pos,
            options: buildOptions(""),
            filter: false,
        };
    }

    return null;
};
