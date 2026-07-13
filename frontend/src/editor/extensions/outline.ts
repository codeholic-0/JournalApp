import { StateField } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { EditorView } from "@codemirror/view";

export interface Heading {
    level: 1 | 2 | 3;
    text: string;
    pos: number;
}

export const headingStateField = StateField.define<Heading[]>({
    create: () => [],
    update(headings, tr) {
        if (!tr.docChanged) return headings;
        const newHeadings: Heading[] = [];
        const tree = syntaxTree(tr.state);
        tree.iterate({
            enter(node) {
                const name = node.type.name;
                if (
                    name === "ATXHeading1" ||
                    name === "ATXHeading2" ||
                    name === "ATXHeading3"
                ) {
                    const level =
                        name === "ATXHeading1"
                            ? 1
                            : name === "ATXHeading2"
                              ? 2
                              : 3;
                    const text = tr.state.sliceDoc(node.from, node.to);
                    const headingText = text.replace(/^#+\s*/, "").trim();
                    if (headingText) {
                        newHeadings.push({
                            level,
                            text: headingText,
                            pos: node.from,
                        });
                    }
                }
            },
        });
        return newHeadings;
    },
});

export function scrollToHeading(view: EditorView, pos: number) {
    view.dispatch({
        effects: EditorView.scrollIntoView(pos, { y: "start", yMargin: 20 }),
        selection: { anchor: pos },
    });
}
