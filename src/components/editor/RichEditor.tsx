"use client";

import { useCallback, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";
import {
  Bold,
  Code2,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";

const lowlight = createLowlight(common);

type Props = {
  initialContent: object;
  onChange: (payload: { html: string; json: object }) => void;
};

export function RichEditor({ initialContent, onChange }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const editor = useEditor({
    // ต้องปิด SSR render ไม่งั้น React เตือน hydration mismatch
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] }, // h1 สงวนไว้ให้หัวข้อบทความ
        codeBlock: false, // ใช้ CodeBlockLowlight แทน
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer" },
        },
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Image.configure({ HTMLAttributes: { loading: "lazy" } }),
      Placeholder.configure({
        placeholder: "เริ่มเขียนที่นี่… ลากรูปมาวางได้เลย",
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "prose-editor min-h-[420px] px-5 py-4 outline-none [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:text-text-muted [&_pre]:mb-3 [&_pre]:rounded-lg [&_pre]:bg-surface-2 [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:overflow-x-auto [&_img]:rounded-lg [&_a]:text-primary [&_a]:underline [&_hr]:my-6 [&_hr]:border-line",
      },
      handleDrop(_view, event) {
        const files = Array.from(event.dataTransfer?.files ?? []);
        const images = files.filter((f) => f.type.startsWith("image/"));
        if (images.length === 0) return false;
        event.preventDefault();
        void uploadFiles(images);
        return true;
      },
      handlePaste(_view, event) {
        const files = Array.from(event.clipboardData?.files ?? []);
        const images = files.filter((f) => f.type.startsWith("image/"));
        if (images.length === 0) return false;
        event.preventDefault();
        void uploadFiles(images);
        return true;
      },
    },
    onUpdate({ editor }) {
      onChange({ html: editor.getHTML(), json: editor.getJSON() });
    },
  });

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!editor) return;
      setUploading(true);
      setUploadError(null);

      for (const file of files) {
        const body = new FormData();
        body.append("file", file);

        const res = await fetch("/api/admin/media", { method: "POST", body });

        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          setUploadError(
            payload?.error?.message ?? `อัปโหลด ${file.name} ไม่สำเร็จ`,
          );
          continue;
        }

        const media = (await res.json()) as { url: string; altText?: string };
        editor
          .chain()
          .focus()
          .setImage({ src: media.url, alt: media.altText ?? "" })
          .run();
      }

      setUploading(false);
    },
    [editor],
  );

  const setLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("ใส่ลิงก์ (เว้นว่างเพื่อลบลิงก์)", previous ?? "");
    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="flex min-h-[480px] items-center justify-center rounded-xl border border-line bg-surface text-sm text-text-muted">
        <Loader2 className="mr-2 size-4 animate-spin" />
        กำลังเตรียมตัวเขียน…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <Toolbar
        editor={editor}
        onPickImage={() => fileInput.current?.click()}
        onSetLink={setLink}
        uploading={uploading}
      />

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) void uploadFiles(files);
          e.target.value = "";
        }}
      />

      {uploadError ? (
        <p
          role="alert"
          className="border-b border-line bg-red-500/10 px-5 py-2 text-sm text-red-300"
        >
          {uploadError}
        </p>
      ) : null}

      <EditorContent editor={editor} />
    </div>
  );
}

function Btn({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`rounded p-1.5 transition hover:bg-surface-2 ${
        active ? "bg-surface-2 text-primary" : "text-text-muted"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({
  editor,
  onPickImage,
  onSetLink,
  uploading,
}: {
  editor: Editor;
  onPickImage: () => void;
  onSetLink: () => void;
  uploading: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-line px-3 py-2">
      <Btn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        label="ตัวหนา"
      >
        <Bold className="size-4" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        label="ตัวเอียง"
      >
        <Italic className="size-4" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        label="ขีดฆ่า"
      >
        <Strikethrough className="size-4" />
      </Btn>

      <span className="mx-1 h-5 w-px bg-line" />

      <Btn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        label="หัวข้อใหญ่"
      >
        <Heading2 className="size-4" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        label="หัวข้อย่อย"
      >
        <Heading3 className="size-4" />
      </Btn>

      <span className="mx-1 h-5 w-px bg-line" />

      <Btn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        label="รายการแบบจุด"
      >
        <List className="size-4" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        label="รายการแบบตัวเลข"
      >
        <ListOrdered className="size-4" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        label="คำพูดอ้างอิง"
      >
        <Quote className="size-4" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive("codeBlock")}
        label="บล็อกโค้ด"
      >
        <Code2 className="size-4" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        label="เส้นคั่น"
      >
        <Minus className="size-4" />
      </Btn>

      <span className="mx-1 h-5 w-px bg-line" />

      <Btn onClick={onSetLink} active={editor.isActive("link")} label="ใส่ลิงก์">
        <Link2 className="size-4" />
      </Btn>
      <Btn onClick={onPickImage} label="แทรกรูป">
        {uploading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ImageIcon className="size-4" />
        )}
      </Btn>

      <span className="ml-auto flex gap-0.5">
        <Btn onClick={() => editor.chain().focus().undo().run()} label="ย้อนกลับ">
          <Undo2 className="size-4" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} label="ทำซ้ำ">
          <Redo2 className="size-4" />
        </Btn>
      </span>
    </div>
  );
}
