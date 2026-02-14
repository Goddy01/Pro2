import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useEffect } from 'react';

const toolbarBtnClass =
  'p-2 rounded text-offwhite/70 hover:text-lime hover:bg-offwhite/10 border-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl || 'https://');
    if (url == null) return;
    if (url === '') editor.chain().focus().extendMarkRange('link').unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border border-b-0 border-offwhite/20 bg-offwhite/5 rounded-t">
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
  );
}

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
};

export default function RichTextEditor({ value, onChange, placeholder = 'Write your article...', className = '', minHeight = '12rem' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-lime underline' } }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          'prose prose-invert max-w-none min-h-[8rem] px-4 py-3 text-offwhite placeholder:text-offwhite/40 focus:outline-none [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value === '' && editor.getHTML() !== '<p></p>') {
      editor.commands.setContent('');
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
