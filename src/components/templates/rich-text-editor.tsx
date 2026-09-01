"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Undo,
  Redo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your email content...",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[300px] px-4 py-4",
      },
    },
  });

  if (!editor) return null;

  const items = [
    { label: "Bold", action: () => editor.chain().focus().toggleBold().run(), isActive: editor.isActive("bold"), icon: Bold },
    { label: "Italic", action: () => editor.chain().focus().toggleItalic().run(), isActive: editor.isActive("italic"), icon: Italic },
    { label: "Strike", action: () => editor.chain().focus().toggleStrike().run(), isActive: editor.isActive("strike"), icon: Strikethrough },
    { label: "Code", action: () => editor.chain().focus().toggleCode().run(), isActive: editor.isActive("code"), icon: Code },
    { label: "Heading 1", action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), isActive: editor.isActive("heading", { level: 1 }), icon: Heading1 },
    { label: "Heading 2", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: editor.isActive("heading", { level: 2 }), icon: Heading2 },
    { label: "Bullet list", action: () => editor.chain().focus().toggleBulletList().run(), isActive: editor.isActive("bulletList"), icon: List },
    { label: "Ordered list", action: () => editor.chain().focus().toggleOrderedList().run(), isActive: editor.isActive("orderedList"), icon: ListOrdered },
    { label: "Blockquote", action: () => editor.chain().focus().toggleBlockquote().run(), isActive: editor.isActive("blockquote"), icon: Quote },
  ];

  return (
    <div className="rounded-lg border bg-white">
      <div className="flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.label}
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0",
                item.isActive && "bg-muted text-foreground"
              )}
              onClick={item.action}
              title={item.label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}
        <div className="mx-1 h-5 w-px bg-border" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
