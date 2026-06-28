import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

const RichTextEditor = ({ content, onChange, editable = true, placeholder = 'Share your interview experience...' }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,        // we use CodeBlockLowlight instead
        link: false,             // disable StarterKit's built‑in link if it exists (it doesn't)
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: { class: 'text-indigo-600 dark:text-indigo-400 underline' },
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Placeholder.configure({ placeholder }),
    ],
    content: content ? (typeof content === 'string' ? JSON.parse(content) : content) : null,
    editable,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange?.(JSON.stringify(json));
    },
  });

  // Insert a link
  const addLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href || '';
    const url = window.prompt('URL', previousUrl);
    if (url) {
      editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/30 backdrop-blur-sm overflow-hidden">
      {editable && (
        <div className="flex flex-wrap gap-1 bg-gray-900/90 dark:bg-gray-900/90 backdrop-blur-md text-white p-2 border-b border-gray-700">
          <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 hover:bg-gray-700 rounded ${editor.isActive('bold') ? 'bg-gray-700' : ''}`}><b>B</b></button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-1.5 hover:bg-gray-700 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-700' : ''}`}>H1</button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-1.5 hover:bg-gray-700 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-700' : ''}`}>H2</button>
          <span className="w-px bg-gray-600 mx-1" />
          <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 hover:bg-gray-700 rounded ${editor.isActive('bulletList') ? 'bg-gray-700' : ''}`}>•</button>
          <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-1.5 hover:bg-gray-700 rounded ${editor.isActive('orderedList') ? 'bg-gray-700' : ''}`}>1.</button>
          <span className="w-px bg-gray-600 mx-1" />
          <button type="button" onClick={addLink} className={`p-1.5 hover:bg-gray-700 rounded ${editor.isActive('link') ? 'bg-gray-700' : ''}`}>🔗</button>
          <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`p-1.5 hover:bg-gray-700 rounded ${editor.isActive('codeBlock') ? 'bg-gray-700' : ''}`}>{'<>'}</button>
        </div>
      )}
      <EditorContent editor={editor} className="prose dark:prose-invert max-w-none p-4 min-h-[200px]" />
    </div>
  );
};

export default RichTextEditor;