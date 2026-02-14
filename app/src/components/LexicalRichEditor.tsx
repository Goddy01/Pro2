import { useCallback, useEffect, useMemo, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { $generateHtmlFromNodes } from '@lexical/html';
import { $getRoot, $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical';
import { $generateNodesFromDOM } from '@lexical/html';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode, INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND } from '@lexical/list';
import { LinkNode, $toggleLink } from '@lexical/link';
import { $setBlocksType } from '@lexical/selection';
import { $createHeadingNode } from '@lexical/rich-text';
import { $createParagraphNode } from 'lexical';
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
  },
  link: 'text-lime underline',
};

const toolbarBtnClass =
  'p-2 rounded text-offwhite/70 hover:text-lime hover:bg-offwhite/10 border-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

function LexicalToolbar() {
  const [editor] = useLexicalComposerContext();

  const formatBold = useCallback(() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold'), [editor]);
  const formatItalic = useCallback(() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic'), [editor]);
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
  const insertBulletList = useCallback(() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined), [editor]);
  const insertNumberedList = useCallback(() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined), [editor]);
  const setLink = useCallback(() => {
    const url = window.prompt('URL', 'https://');
    if (url != null) editor.update(() => $toggleLink(url === '' ? null : url));
  }, [editor]);

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border border-b-0 border-offwhite/20 bg-offwhite/5 rounded-t">
      <button type="button" onClick={formatBold} className={toolbarBtnClass} title="Bold">
        <span className="font-bold">B</span>
      </button>
      <button type="button" onClick={formatItalic} className={toolbarBtnClass} title="Italic">
        <span className="italic">I</span>
      </button>
      <button type="button" onClick={formatH2} className={toolbarBtnClass} title="Heading 2">
        H2
      </button>
      <button type="button" onClick={formatH3} className={toolbarBtnClass} title="Heading 3">
        H3
      </button>
      <span className="w-px h-5 bg-offwhite/20" />
      <button type="button" onClick={insertBulletList} className={toolbarBtnClass} title="Bullet list">
        •
      </button>
      <button type="button" onClick={insertNumberedList} className={toolbarBtnClass} title="Numbered list">
        1.
      </button>
      <span className="w-px h-5 bg-offwhite/20" />
      <button type="button" onClick={setLink} className={toolbarBtnClass} title="Link">
        Link
      </button>
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

type LexicalRichEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
};

const initialNodes = [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode];

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
                className="min-h-[8rem] px-4 py-3 text-offwhite placeholder:text-offwhite/40 focus:outline-none prose prose-invert max-w-none [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_a]:text-lime [&_a]:underline"
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
        <OnChangePlugin ignoreSelectionChange onChange={handleChange} />
        <InitialHtmlPlugin initialHtml={value} />
        <ClearWhenEmptyPlugin value={value} />
      </LexicalComposer>
    </div>
  );
}
