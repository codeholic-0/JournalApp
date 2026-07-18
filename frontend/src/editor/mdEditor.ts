import { EditorState, Compartment } from "@codemirror/state";
import {
    EditorView,
    keymap,
    lineNumbers,
    highlightActiveLine,
    highlightSpecialChars,
    drawSelection,
    rectangularSelection,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { search, searchKeymap, openSearchPanel } from "@codemirror/search";
import {
    foldGutter,
    indentOnInput,
    syntaxHighlighting,
    HighlightStyle,
    bracketMatching,
    foldKeymap,
} from "@codemirror/language";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import {
    closeBrackets,
    closeBracketsKeymap,
    autocompletion,
    startCompletion,
} from "@codemirror/autocomplete";
import { languages } from "@codemirror/language-data";
import { tags } from "@lezer/highlight";
import { slashMenu } from "./extensions/slashMenu";
import { headingStateField, scrollToHeading, type Heading } from "./extensions/outline";

const mdHighlightStyle = HighlightStyle.define([
    { tag: tags.heading, class: "font-bold" },
    { tag: tags.heading1, class: "text-2xl font-bold" },
    { tag: tags.heading2, class: "text-xl font-bold" },
    { tag: tags.heading3, class: "text-lg font-bold" },
    { tag: tags.strong, class: "font-bold" },
    { tag: tags.emphasis, class: "italic" },
    { tag: tags.strikethrough, class: "line-through" },
    { tag: tags.link, class: "text-primary underline" },
    { tag: tags.url, class: "text-primary underline" },
    { tag: tags.list, class: "" },
    { tag: tags.quote, class: "italic border-l-2 pl-4 text-on-surface-muted" },
    {
        tag: tags.monospace,
        class: "font-mono text-sm bg-surface-alt px-1 rounded",
    },
    { tag: tags.comment, class: "text-on-surface-muted" },
    { tag: tags.processingInstruction, class: "text-on-surface-muted" },
    { tag: tags.atom, class: "text-on-surface-muted" },
]);

const highlightCompartment = new Compartment();
const wrapCompartment = new Compartment();

export interface EditorAPI {
    view: EditorView;
    getValue: () => string;
    setValue: (val: string) => void;
    setWrap: (enabled: boolean) => void;
    triggerCompletion: () => void;
    destroy: () => void;
    openSearch: () => void;
    scrollTo: (pos: number) => void;
}

export interface MountMDOpts {
    onDocChange?: (value: string) => void;
    onHeadingsChange?: (headings: Heading[]) => void;
}

export function mountMD(
    parent: Element,
    doc: string,
    opts?: MountMDOpts,
): EditorAPI {
    const updateListener = EditorView.updateListener.of((update) => {
        if (update.docChanged) {
            opts?.onDocChange?.(update.state.doc.toString());
            opts?.onHeadingsChange?.(update.state.field(headingStateField));
        }
    });

    const state = EditorState.create({
        doc,
        extensions: [
            lineNumbers(),
            highlightActiveLine(),
            highlightSpecialChars(),
            drawSelection(),
            rectangularSelection(),
            foldGutter(),
            bracketMatching(),
            closeBrackets(),
            autocompletion({ override: [slashMenu] }),
            headingStateField,
            indentOnInput(),
            history(),
            search({top: true}),
            highlightCompartment.of(syntaxHighlighting(mdHighlightStyle)),
            markdown({ base: markdownLanguage, codeLanguages: languages }),
            keymap.of([
                ...closeBracketsKeymap,
                ...defaultKeymap,
                ...historyKeymap,
                ...foldKeymap,
                ...searchKeymap,
            ]),
            updateListener,
            EditorView.theme({
                "&": { height: "100%" },
                ".cm-scroller": { fontFamily: "inherit" },
                ".cm-content": {
                    color: "var(--color-on-surface)",
                    caretColor: "var(--color-on-surface)",
                },
                ".cm-cursor, .cm-dropCursor": {
                    borderLeftColor: "var(--color-on-surface)",
                },
                "&.cm-focused .cm-selectionBackground, .cm-selectionBackground":
                    {
                        backgroundColor: "var(--color-hover) !important",
                    },
                ".cm-activeLine": {
                    backgroundColor: "var(--color-surface-alt)",
                },
                ".cm-gutters": {
                    backgroundColor: "var(--color-surface)",
                    borderRight: "1px solid var(--color-outline)",
                    color: "var(--color-on-surface-muted)",
                },
                ".cm-activeLineGutter": {
                    backgroundColor: "var(--color-surface-alt)",
                },
                ".cm-foldPlaceholder": {
                    backgroundColor: "var(--color-surface-alt)",
                    border: "1px solid var(--color-outline)",
                    color: "var(--color-on-surface-muted)",
                },
                ".cm-matchingBracket": {
                    backgroundColor: "var(--color-hover)",
                    outline: "1px solid var(--color-outline)",
                },
                ".cm-tooltip.cm-tooltip-autocomplete": {
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                    zIndex: "1000",
                    "& > ul": {
                        fontFamily: "inherit",
                        "& > li": {
                            color: "var(--fg)",
                            padding: "6px 12px",
                            "&:hover": {
                                backgroundColor: "var(--bg-hover)",
                            },
                        },
                        "& > li[aria-selected]": {
                            backgroundColor: "var(--accent-subtle)",
                            color: "var(--accent)",
                        },
                    },
                },
                ".cm-tooltip": {
                    zIndex: "1000",
                },
                ".cm-panel.cm-search": {
                    backgroundColor: "var(--bg-elevated)",
                    borderBottom: "1px solid var(--border)",
                    borderRadius: "0 0 8px 8px",
                    padding: "8px 12px",
                    fontFamily: "inherit",
                    color: "var(--fg)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap" as const,
                    "& input, & .cm-textfield": {
                        backgroundColor: "var(--bg)",
                        border: "1px solid var(--border)",
                        borderRadius: "6px",
                        padding: "6px 10px",
                        color: "var(--fg)",
                        fontFamily: "inherit",
                        fontSize: "13px",
                        outline: "none",
                        "&:focus": {
                            borderColor: "var(--accent)",
                        },
                    },
                    "& button, & .cm-button": {
                        background: "var(--bg-subtle)",
                        backgroundImage: "none",
                        border: "1px solid var(--border)",
                        borderRadius: "6px",
                        color: "var(--fg)",
                        cursor: "pointer",
                        fontSize: "12px",
                        padding: "4px 10px",
                        fontFamily: "inherit",
                        "&:hover": {
                            background: "var(--bg-hover)",
                            backgroundImage: "none",
                        },
                    },
                    "& label": {
                        color: "var(--fg-muted)",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        borderRadius: "6px",
                    },
                    "& input[type=checkbox]": {
                        accentColor: "var(--accent)",
                        borderRadius: "4px",
                    },
                    "& select": {
                        backgroundColor: "var(--bg)",
                        border: "1px solid var(--border)",
                        borderRadius: "6px",
                        color: "var(--fg)",
                        fontFamily: "inherit",
                        fontSize: "12px",
                        padding: "4px 6px",
                        outline: "none",
                    },
                },
            }),
            wrapCompartment.of(EditorView.lineWrapping),
        ],
    });

    const view = new EditorView({ state, parent });

    return {
        view,
        getValue: () => view.state.doc.toString(),
        setValue: (val: string) => {
            view.dispatch({
                changes: { from: 0, to: view.state.doc.length, insert: val },
            });
        },
        setWrap: (enabled: boolean) => {
            view.dispatch({
                effects: wrapCompartment.reconfigure(
                    enabled ? EditorView.lineWrapping : [],
                ),
            });
        },
        triggerCompletion: () => startCompletion(view),
        scrollTo: (pos: number) => scrollToHeading(view, pos),
        openSearch: () => openSearchPanel(view),
        destroy: () => view.destroy(),
    };
}
