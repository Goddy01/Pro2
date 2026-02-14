import { useCallback, useEffect, useMemo, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { HorizontalRuleNode, INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { $generateHtmlFromNodes } from '@lexical/html';
import { $getRoot, $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical';
import { $generateNodesFromDOM } from '@lexical/html';
import { HeadingNode, QuoteNode, $createQuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode, INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, INSERT_CHECK_LIST_COMMAND, registerCheckList } from '@lexical/list';
import { LinkNode, $toggleLink } from '@lexical/link';
import { TableNode, TableCellNode, TableRowNode, INSERT_TABLE_COMMAND } from '@lexical/table';
import { CodeNode, CodeHighlightNode, $createCodeNode } from '@lexical/code';
import { $setBlocksType } from '@lexical/selection';
import { $createHeadingNode } from '@lexical/rich-text';
import { $createParagraphNode, $insertNodes } from 'lexical';
import type { EditorState } from 'lexical';

const theme = {
  paragraph: 'mb-2',
  heading: {
    h1: 'text-2xl font-bold mb-2',
    h2: 'text-xl font-bold mb-2',
    h3: 'text-lg font-semibold mb-2',
  },
  list: {
    ul: 'list-disc pl-6 mb-2',
    ol: 'list-decimal pl-6 mb-2',
  },
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    code: 'bg-offwhite/10 px-1 rounded font-mono text-sm',
  },
  link: 'text-lime underline',
  quote: 'border-l-4 border-lime pl-4 italic text-offwhite/80',
};

const toolbarBtnClass =
  'p-2 rounded text-offwhite/70 hover:text-lime hover:bg-offwhite/10 border-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

function LexicalToolbar() {
  const [editor] = useLexicalComposerContext();

  const formatBold = useCallback(() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold'), [editor]);
  const formatItalic = useCallback(() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic'), [editor]);
  const formatUnderline = useCallback(() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline'), [editor]);
  const formatStrike = useCallback(() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough'), [editor]);
  const formatCode = useCallback(() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code'), [editor]);
  const formatH1 = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) $setBlocksType(selection, () => $createHeadingNode('h1'));
    });
  }, [editor]);
  const formatH2 = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) $setBlocksType(selection, () => $createHeadingNode('h2'));
    });
  }, [editor]);
  const formatH3 = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) $setBlocksType(selection, () => $createHeadingNode('h3'));
    });
  }, [editor]);
  const formatBlockquote = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) $setBlocksType(selection, () => $createQuoteNode());
    });
  }, [editor]);
  const insertBulletList = useCallback(() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined), [editor]);
  const insertNumberedList = useCallback(() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined), [editor]);
  const insertHorizontalRule = useCallback(() => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined), [editor]);
  const insertTable = useCallback(() => editor.dispatchCommand(INSERT_TABLE_COMMAND, { rows: '3', columns: '3', includeHeaders: true }), [editor]);
  const insertCheckList = useCallback(() => editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined), [editor]);
  const insertCodeBlock = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) $insertNodes([$createCodeNode()]);
    });
  }, [editor]);
  const setLink = useCallback(() => {
    const url = window.prompt('URL', 'https://');
    if (url != null) editor.update(() => $toggleLink(url === '' ? null : url));
  }, [editor]);

  return (
    <div className="flex flex-col gap-1 p-2 border border-b-0 border-offwhite/20 bg-offwhite/5 rounded-t">
      {/* Row 1: Text format */}
      <div className="flex flex-wrap items-center gap-1">
      <button type="button" onClick={formatBold} className={toolbarBtnClass} title="Bold">
        <span className="font-bold">B</span>
      </button>
      <button type="button" onClick={formatItalic} className={toolbarBtnClass} title="Italic">
        <span className="italic">I</span>
      </button>
      <button type="button" onClick={formatUnderline} className={toolbarBtnClass} title="Underline">
        <span className="underline">U</span>
      </button>
      <button type="button" onClick={formatStrike} className={toolbarBtnClass} title="Strikethrough">
        <span className="line-through">S</span>
      </button>
      <button type="button" onClick={formatCode} className={toolbarBtnClass} title="Inline code">
        &lt;/&gt;
      </button>
      <span className="w-px h-5 bg-offwhite/20" />
      {/* Headings */}
      <button type="button" onClick={formatH1} className={toolbarBtnClass} title="Heading 1">
        H1
      </button>
      <button type="button" onClick={formatH2} className={toolbarBtnClass} title="Heading 2">
        H2
      </button>
      <button type="button" onClick={formatH3} className={toolbarBtnClass} title="Heading 3">
        H3
      </button>
      <span className="w-px h-5 bg-offwhite/20" />
      {/* Lists */}
      <button type="button" onClick={insertBulletList} className={toolbarBtnClass} title="Bullet list">
        •
      </button>
      <button type="button" onClick={insertNumberedList} className={toolbarBtnClass} title="Numbered list">
        1.
      </button>
      <button type="button" onClick={insertCheckList} className={toolbarBtnClass} title="Check list">
        ☑
      </button>
      </div>
      {/* Row 2: Block elements, table, code, link */}
      <div className="flex flex-wrap items-center gap-1">
      <span className="w-px h-5 bg-offwhite/20" />
      <button type="button" onClick={formatBlockquote} className={toolbarBtnClass} title="Blockquote">
        “
      </button>
      <button type="button" onClick={insertCodeBlock} className={toolbarBtnClass} title="Code block">
        {'{ }'}
      </button>
      <button type="button" onClick={insertHorizontalRule} className={toolbarBtnClass} title="Horizontal rule">
        —
      </button>
      <span className="w-px h-5 bg-offwhite/20" />
      <button type="button" onClick={insertTable} className={toolbarBtnClass} title="Insert table">
        ⊞
      </button>
      <span className="w-px h-5 bg-offwhite/20" />
      <button type="button" onClick={setLink} className={toolbarBtnClass} title="Link">
        Link
      </button>
      </div>
    </div>
  );
}

function InitialHtmlPlugin({ initialHtml }: { initialHtml: string }) {
  const [editor] = useLexicalComposerContext();
  const doneRef = useRef(false);

  useEffect(() => {
    if (doneRef.current || !initialHtml || !initialHtml.trim()) return;
    doneRef.current = true;
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const parser = new DOMParser();
      const dom = parser.parseFromString(initialHtml, 'text/html');
      const nodes = $generateNodesFromDOM(editor, dom);
      nodes.forEach((node) => root.append(node));
    });
  }, [editor, initialHtml]);

  return null;
}

function ClearWhenEmptyPlugin({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (value !== '') return;
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      root.append($createParagraphNode());
    });
  }, [editor, value]);

  return null;
}

function CheckListPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return registerCheckList(editor);
  }, [editor]);
  return null;
}

type LexicalRichEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
};

const initialNodes = [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, HorizontalRuleNode, TableNode, TableCellNode, TableRowNode, CodeNode, CodeHighlightNode];

export default function LexicalRichEditor({
  value,
  onChange,
  placeholder = 'Write your article...',
  className = '',
  minHeight = '12rem',
}: LexicalRichEditorProps) {
  const initialHtmlRef = useRef(value);
  initialHtmlRef.current = value;

  const initialConfig = useMemo(
    () => ({
      namespace: 'LexicalArticleEditor',
      theme,
      nodes: initialNodes,
      onError: (err: Error) => console.error('Lexical:', err),
    }),
    []
  );

  const handleChange = useCallback(
    (editorState: EditorState, editor: import('lexical').LexicalEditor) => {
      editorState.read(() => {
        const html = $generateHtmlFromNodes(editor, null);
        onChange(html);
      });
    },
    [onChange]
  );

  return (
    <div className={`rounded border border-offwhite/20 overflow-hidden ${className}`} style={{ minHeight }}>
      <LexicalComposer initialConfig={initialConfig}>
        <LexicalToolbar />
        <div className="bg-offwhite/5 border border-offwhite/20 border-t-0 relative" style={{ minHeight }}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="min-h-[8rem] px-4 py-3 text-offwhite placeholder:text-offwhite/40 focus:outline-none prose prose-invert max-w-none [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_a]:text-lime [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-lime [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-offwhite/80 [&_code]:bg-offwhite/10 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-offwhite/10 [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto [&_hr]:border [&_hr]:border-offwhite/20 [&_table]:border-collapse [&_td]:border [&_td]:border-offwhite/20 [&_th]:border [&_th]:border-offwhite/20 [&_input[type=checkbox]]:rounded"
                aria-placeholder={placeholder}
                placeholder={<div className="absolute top-4 left-4 text-offwhite/40 pointer-events-none">{placeholder}</div>}
              />
            }
            placeholder={
              <div className="absolute top-4 left-4 text-offwhite/40 pointer-events-none">{placeholder}</div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <HorizontalRulePlugin />
        <TablePlugin />
        <CheckListPlugin />
        <OnChangePlugin ignoreSelectionChange onChange={handleChange} />
        <InitialHtmlPlugin initialHtml={value} />
        <ClearWhenEmptyPlugin value={value} />
      </LexicalComposer>
    </div>
  );
}
