import {
    ASTNode,
    AttributeNode,
    BodyNode,
    ElementNode,
    HeadNode,
    InlineComponentNode,
    Node,
    OptionsNode,
    ScriptNode,
    SlotNode,
    SlotTemplateNode,
    StyleNode,
    TitleNode,
    WindowNode,
} from './nodes';
import { Doc, doc, FastPath, ParserOptions } from 'prettier';
import { formattableAttributes } from '../lib/elements';
import { PrintFn } from '.';
import { snippedTagContentAttribute } from '../lib/snipTagContent';

/**
 * Determines whether or not given node
 * is the root of the Svelte AST.
 */
export function isASTNode(n: any): n is ASTNode {
    return n && n.__isRoot;
}

export function isPreTagContent(path: FastPath): boolean {
    const stack = path.stack as Node[];

    return stack.some(
        (node) =>
            (node.type === 'Element' && node.name.toLowerCase() === 'pre') ||
            (node.type === 'Attribute' && !formattableAttributes.includes(node.name)),
    );
}

export function flatten<T>(arrays: T[][]): T[] {
    return ([] as T[]).concat.apply([], arrays);
}

export function findLastIndex<T>(isMatch: (item: T, idx: number) => boolean, items: T[]) {
    for (let i = items.length - 1; i >= 0; i--) {
        if (isMatch(items[i], i)) {
            return i;
        }
    }

    return -1;
}

export function replaceEndOfLineWith(text: string, replacement: Doc) {
    const parts: Doc[] = [];
    for (const part of text.split('\n')) {
        if (parts.length > 0) {
            parts.push(replacement);
        }
        if (part.endsWith('\r')) {
            parts.push(part.slice(0, -1));
        } else {
            parts.push(part);
        }
    }
    return parts;
}

export function groupConcat(contents: doc.builders.Doc[]): doc.builders.Doc {
    const { concat, group } = doc.builders;
    return group(concat(contents));
}

export function getAttributeLine(
    node:
        | ElementNode
        | InlineComponentNode
        | SlotNode
        | WindowNode
        | HeadNode
        | TitleNode
        | StyleNode
        | ScriptNode
        | BodyNode
        | OptionsNode
        | SlotTemplateNode,
    options: ParserOptions,
) {
    const { hardline, line } = doc.builders;
    const hasThisBinding =
        (node.type === 'InlineComponent' && !!node.expression) ||
        (node.type === 'Element' && !!node.tag);

    const attributes = (node.attributes as Array<AttributeNode>).filter(
        (attribute) => attribute.name !== snippedTagContentAttribute,
    );
    return options.singleAttributePerLine &&
        (attributes.length > 1 || (attributes.length && hasThisBinding))
        ? hardline
        : line;
}

export function printWithPrependedAttributeLine(
    node:
        | ElementNode
        | InlineComponentNode
        | SlotNode
        | WindowNode
        | HeadNode
        | TitleNode
        | StyleNode
        | ScriptNode
        | BodyNode
        | OptionsNode
        | SlotTemplateNode,
    options: ParserOptions,
    print: PrintFn,
): PrintFn {
    return (path) =>
        path.getNode().name !== snippedTagContentAttribute
            ? doc.builders.concat([getAttributeLine(node, options), path.call(print)])
            : '';
}
