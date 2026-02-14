import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { TableKit } from '@tiptap/extension-table/kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { useCallback, useEffect } from 'react';

const toolbarBtnClass =
  'p-2 rounded text-offwhite/70 hover:text-lime hover:bg-offwhite/10 border-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

const TEXT_COLORS = [
  { name: 'Default', value: '' },
  { name: 'Lime', value: '#a3e635' },
  { name: 'Gray', value: '#9ca3af' },
  { name: 'Red', value: '#f87171' },
  { name: 'Blue', value: '#60a5fa' },
];

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl || 'https://');
    if (url == null) return;
    if (url === '') editor.chain().focus().extendMarkRange('link').unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const setImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Image URL', 'https://');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-col gap-1 p-2 border border-b-0 border-offwhite/20 bg-offwhite/5 rounded-t">
      {/* Row 1: Text format + blocks */}
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${toolbarBtnClass} ${editor.isActive('bold') ? 'text-lime bg-offwhite/10' : ''}`}
          title="Bold"
        >
          <span className="font-bold">B</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${toolbarBtnClass} ${editor.isActive('italic') ? 'text-lime bg-offwhite/10' : ''}`}
          title="Italic"
        >
          <span className="italic">I</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`${toolbarBtnClass} ${editor.isActive('underline') ? 'text-lime bg-offwhite/10' : ''}`}
          title="Underline"
        >
          <span className="underline">U</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`${toolbarBtnClass} ${editor.isActive('strike') ? 'text-lime bg-offwhite/10' : ''}`}
          title="Strikethrough"
        >
          <span className="line-through">S</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`${toolbarBtnClass} ${editor.isActive('code') ? 'text-lime bg-offwhite/10' : ''}`}
          title="Inline code"
        >
          &lt;/&gt;
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`${toolbarBtnClass} ${editor.isActive('highlight') ? 'text-lime bg-offwhite/10' : ''}`}
          title="Highlight"
        >
          🖍
        </button>
        <span className="w-px h-5 bg-offwhite/20" />
        {TEXT_COLORS.map(({ name, value }) => (
          <button
            key={name}
            type="button"
            onClick={() => (value ? editor.chain().focus().setColor(value).run() : editor.chain().focus().unsetColor().run())}
            className={toolbarBtnClass}
            title={`Text color: ${name}`}
            style={value ? { color: value } : undefined}
          >
            A
          </button>
        ))}
        <span className="w-px h-5 bg-offwhite/20" />
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`${toolbarBtnClass} ${editor.isActive({ textAlign: 'left' }) ? 'text-lime bg-offwhite/10' : ''}`}
          title="Align left"
        >
          ≡
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`${toolbarBtnClass} ${editor.isActive({ textAlign: 'center' }) ? 'text-lime bg-offwhite/10' : ''}`}
          title="Align center"
        >
          ≡
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`${toolbarBtnClass} ${editor.isActive({ textAlign: 'right' }) ? 'text-lime bg-offwhite/10' : ''}`}
          title="Align right"
        >
          ≡
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`${toolbarBtnClass} ${editor.isActive({ textAlign: 'justify' }) ? 'text-lime bg-offwhite/10' : ''}`}
          title="Justify"
        >
          ≡
        </button>
      </div>
      {/* Row 2: Headings, lists, blocks, table, image, link */}
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`${toolbarBtnClass} ${editor.isActive('heading', { level: 1 }) ? 'text-lime bg-offwhite/10' : ''}`}
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`${toolbarBtnClass} ${editor.isActive('heading', { level: 2 }) ? 'text-lime bg-offwhite/10' : ''}`}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`${toolbarBtnClass} ${editor.isActive('heading', { level: 3 }) ? 'text-lime bg-offwhite/10' : ''}`}
          title="Heading 3"
        >
          H3
        </button>
        <span className="w-px h-5 bg-offwhite/20" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${toolbarBtnClass} ${editor.isActive('bulletList') ? 'text-lime bg-offwhite/10' : ''}`}
          title="Bullet list"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${toolbarBtnClass} ${editor.isActive('orderedList') ? 'text-lime bg-offwhite/10' : ''}`}
          title="Numbered list"
        >
          1.
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`${toolbarBtnClass} ${editor.isActive('taskList') ? 'text-lime bg-offwhite/10' : ''}`}
          title="Task list"
        >
          ☑
        </button>
        <span className="w-px h-5 bg-offwhite/20" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`${toolbarBtnClass} ${editor.isActive('blockquote') ? 'text-lime bg-offwhite/10' : ''}`}
          title="Blockquote"
        >
          “
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`${toolbarBtnClass} ${editor.isActive('codeBlock') ? 'text-lime bg-offwhite/10' : ''}`}
          title="Code block"
        >
          {'{ }'}
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={toolbarBtnClass}
          title="Horizontal rule"
        >
          —
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHardBreak().run()}
          className={toolbarBtnClass}
          title="Line break (Shift+Enter)"
        >
          ↵
        </button>
        <span className="w-px h-5 bg-offwhite/20" />
        <button
          type="button"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          className={toolbarBtnClass}
          title="Insert table"
        >
          ⊞
        </button>
        <button type="button" onClick={setImage} className={toolbarBtnClass} title="Insert image">
          🖼
        </button>
        <span className="w-px h-5 bg-offwhite/20" />
        <button
          type="button"
          onClick={setLink}
          className={`${toolbarBtnClass} ${editor.isActive('link') ? 'text-lime bg-offwhite/10' : ''}`}
          title="Link"
        >
          Link
        </button>
      </div>
    </div>
  );
}

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
};

export default function RichTextEditor({ value, onChange, placeholder = 'Write your article...', className = '', minHeight = '32rem' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-lime underline' } }),
      Placeholder.configure({ placeholder }),
      TableKit,
      Image.configure({ HTMLAttributes: { class: 'max-w-full h-auto rounded' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: false }),
      TextStyle,
      Color,
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          'prose prose-invert max-w-none min-h-[28rem] px-4 py-4 text-offwhite placeholder:text-offwhite/40 focus:outline-none text-base [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-lime [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-offwhite/80 [&_code]:bg-offwhite/10 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-offwhite/10 [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto [&_hr]:border-offwhite/20 [&_mark]:bg-lime/30 [&_mark]:text-forest [&_.tiptap-table]:border-collapse [&_.tiptap-table_td]:border [&_.tiptap-table_td]:border-offwhite/20 [&_.tiptap-table_th]:border [&_.tiptap-table_th]:border-offwhite/20 [&_input[type=checkbox]]:rounded',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value === '' && editor.getHTML() !== '<p></p>') {
      editor.commands.setContent('');
      return;
    }
    const current = editor.getHTML();
    const empty = !current || current === '<p></p>' || current.trim() === '<p></p>';
    if (value && value.trim() !== '' && empty) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className={`rounded border border-offwhite/20 overflow-hidden ${className}`} style={{ minHeight }}>
      <Toolbar editor={editor} />
      <div className="bg-offwhite/5 border border-offwhite/20 border-t-0" style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
