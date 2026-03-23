import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import { api } from '../../api/client.js';
import type { ApiResponse } from '@forkverse/shared';

// ── Types ──────────────────────────────────────────────────

interface MentionUser {
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface PostEditorHandle {
  focus: () => void;
  getText: () => string;
  clear: () => void;
}

interface PostEditorProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onSubmit?: () => void;
}

// ── Mention suggestion ─────────────────────────────────────

function createMentionSuggestion() {
  return {
    items: async ({ query }: { query: string }) => {
      if (!query || query.length < 1) return [];
      try {
        const res = await api.get<ApiResponse<{ users: MentionUser[] }>>(
          `/posts/search?q=${encodeURIComponent(query)}&limit=6`
        );
        return res.data.users ?? [];
      } catch {
        return [];
      }
    },
    render: () => {
      let popup: HTMLDivElement | null = null;
      let selectedIndex = 0;
      let items: MentionUser[] = [];
      let commandFn: ((props: { id: string; label: string }) => void) | null = null;

      const renderList = () => {
        const el = popup;
        if (!el) return;
        el.innerHTML = '';
        if (items.length === 0) {
          el.style.display = 'none';
          return;
        }
        el.style.display = 'block';
        items.forEach((user, i) => {
          const btn = document.createElement('button');
          btn.className = `mention-item ${i === selectedIndex ? 'is-selected' : ''}`;
          btn.innerHTML = `
            <span class="mention-avatar">${
              user.avatarUrl
                ? `<img src="${user.avatarUrl}" alt="" />`
                : `<span class="mention-avatar-fallback">${user.username[0]?.toUpperCase() ?? '?'}</span>`
            }</span>
            <span class="mention-name">@${user.username}</span>
            ${user.displayName && user.displayName !== user.username ? `<span class="mention-display">${user.displayName}</span>` : ''}
          `;
          btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            commandFn?.({ id: user.username, label: user.username });
          });
          el.appendChild(btn);
        });
      };

      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onStart: (props: any) => {
          const p = props as { command: (p: { id: string; label: string }) => void; clientRect?: (() => DOMRect | null) | null };
          commandFn = p.command;
          popup = document.createElement('div');
          popup.className = 'mention-popup';
          document.body.appendChild(popup);

          const rect = p.clientRect?.();
          if (rect && popup) {
            popup.style.left = `${rect.left}px`;
            popup.style.top = `${rect.bottom + 4}px`;
          }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onUpdate: (props: any) => {
          const p = props as { items: MentionUser[]; clientRect?: (() => DOMRect | null) | null; command: (pr: { id: string; label: string }) => void };
          items = p.items;
          commandFn = p.command;
          selectedIndex = 0;

          const rect = p.clientRect?.();
          if (rect && popup) {
            popup.style.left = `${rect.left}px`;
            popup.style.top = `${rect.bottom + 4}px`;
          }
          renderList();
        },
        onKeyDown: (props: { event: KeyboardEvent }) => {
          if (items.length === 0) return false;
          if (props.event.key === 'ArrowDown') {
            selectedIndex = (selectedIndex + 1) % items.length;
            renderList();
            return true;
          }
          if (props.event.key === 'ArrowUp') {
            selectedIndex = (selectedIndex - 1 + items.length) % items.length;
            renderList();
            return true;
          }
          if (props.event.key === 'Enter' || props.event.key === 'Tab') {
            const user = items[selectedIndex];
            if (user) {
              commandFn?.({ id: user.username, label: user.username });
              return true;
            }
          }
          if (props.event.key === 'Escape') {
            popup?.remove();
            popup = null;
            return true;
          }
          return false;
        },
        onExit: () => {
          popup?.remove();
          popup = null;
        },
      };
    },
  };
}

// ── Editor Component ───────────────────────────────────────

const PostEditor = forwardRef<PostEditorHandle, PostEditorProps>(function PostEditor(
  { value, onChange, placeholder, disabled, onSubmit },
  ref,
) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable block-level formatting — keep it simple like a textarea
        heading: false,
        blockquote: false,
        codeBlock: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        horizontalRule: false,
        hardBreak: { keepMarks: true },
      }),
      Placeholder.configure({ placeholder: placeholder ?? '' }),
      Mention.configure({
        HTMLAttributes: { class: 'editor-mention' },
        suggestion: createMentionSuggestion(),
        renderText: ({ node }) => `@${node.attrs.label ?? node.attrs.id}`,
      }),
    ],
    content: value ? `<p>${value.replace(/\n/g, '<br>')}</p>` : '',
    editable: !disabled,
    editorProps: {
      attributes: {
        class: 'post-editor-content',
      },
      handleKeyDown: (_view, event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
          event.preventDefault();
          onSubmit?.();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      const text = ed.getText();
      onChange(text);
    },
  });

  useImperativeHandle(ref, () => ({
    focus: () => editor?.commands.focus(),
    getText: () => editor?.getText() ?? '',
    clear: () => editor?.commands.clearContent(),
  }), [editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  // Sync external value changes (e.g., clear after submit)
  const lastValue = useRef(value);
  useEffect(() => {
    if (!editor) return;
    if (value !== lastValue.current) {
      lastValue.current = value;
      if (value === '') {
        editor.commands.clearContent();
      }
    }
  }, [value, editor]);

  return <EditorContent editor={editor} />;
});

export default PostEditor;
