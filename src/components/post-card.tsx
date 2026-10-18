"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addComment, deleteComment, deletePost, toggleReaction, updatePost } from "@/app/actions";
import {
  CheckIcon,
  CommentIcon,
  CopyIcon,
  HeartIcon,
  PencilIcon,
  PlayIcon,
  TrashIcon,
  XIcon,
} from "@/components/icons";
import { Avatar, GradientArt, useToast } from "@/components/ui";
import { compactNumber } from "@/lib/format";
import type { CurrentUser, PostDTO } from "@/lib/types";

type PendingComment = { id: number; body: string; createdLabel: string; isMine: boolean; author: PostDTO["author"] };

export function PostCard({ post, viewer, dense = false }: { post: PostDTO; viewer: CurrentUser; dense?: boolean }) {
  const router = useRouter();
  const { push } = useToast();
  const [pending, startTransition] = useTransition();
  const [likes, setLikes] = useState({ reacted: post.reacted, count: post.likeCount });
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [pendingComments, setPendingComments] = useState<PendingComment[]>([]);
  const [removedComments, setRemovedComments] = useState<number[]>([]);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(post.caption);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setLikes({ reacted: post.reacted, count: post.likeCount });
    setEditValue(post.caption);
  }, [post.id, post.reacted, post.likeCount, post.caption]);

  useEffect(() => {
    setPendingComments([]);
  }, [post.commentCount]);

  const like = () => {
    const optimistic = likes.reacted ? { reacted: false, count: Math.max(0, likes.count - 1) } : { reacted: true, count: likes.count + 1 };
    setLikes(optimistic);
    startTransition(async () => {
      const result = await toggleReaction(post.id);
      if (!result.ok) {
        setLikes({ reacted: post.reacted, count: post.likeCount });
        push(result.error ?? "Could not react right now", "error");
      } else {
        router.refresh();
      }
    });
  };

  const submitComment = (event: React.FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    const temp: PendingComment = {
      id: -Date.now(),
      body,
      createdLabel: "just now",
      isMine: true,
      author: { id: viewer.id, name: viewer.name, handle: viewer.handle, emoji: viewer.avatarEmoji, gradient: viewer.gradient },
    };
    setPendingComments((current) => [...current, temp]);
    setDraft("");
    startTransition(async () => {
      const result = await addComment(post.id, body);
      if (!result.ok) {
        setPendingComments((current) => current.filter((comment) => comment.id !== temp.id));
        push(result.error ?? "Could not post that comment", "error");
      } else {
        router.refresh();
      }
    });
  };

  const removeComment = (id: number) => {
    setRemovedComments((current) => [...current, id]);
    startTransition(async () => {
      const result = await deleteComment(id);
      if (!result.ok) {
        setRemovedComments((current) => current.filter((commentId) => commentId !== id));
        push(result.error ?? "Could not delete comment", "error");
      } else router.refresh();
    });
  };

  const saveEdit = () => {
    if (!editValue.trim()) {
      push("Caption cannot be empty", "error");
      return;
    }
    setEditing(false);
    startTransition(async () => {
      const result = await updatePost(post.id, { caption: editValue, tags: post.tags });
      if (!result.ok) push(result.error ?? "Could not save", "error");
      else {
        push("Post updated");
        router.refresh();
      }
    });
  };

  const removePost = () => {
    setConfirmDelete(false);
    startTransition(async () => {
      const result = await deletePost(post.id);
      if (!result.ok) push(result.error ?? "Could not delete", "error");
      else {
        push("Post deleted");
        router.refresh();
      }
    });
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(`${post.author.name} on muse: ${post.caption}`);
      push("Caption copied — send it to the group chat");
    } catch {
      push("Could not copy", "error");
    }
  };

  const visibleComments = [
    ...post.comments.filter((comment) => !removedComments.includes(comment.id)),
    ...pendingComments,
  ];

  return (
    <article className="surface hover-lift overflow-hidden" style={{ opacity: pending ? 0.92 : 1 }}>
      <div className="flex items-start gap-3 px-4 pt-4">
        <Avatar emoji={post.author.emoji} gradient={post.author.gradient} size={40} ring />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm font-bold">{post.author.name}</p>
            <span className="muted text-xs">@{post.author.handle}</span>
            <span className="muted text-[11px]">· {post.createdLabel}</span>
          </div>
          <p className="muted text-[11px] capitalize">{post.mediaKind} drop</p>
        </div>
        {post.isMine ? (
          <div className="relative">
            <button type="button" className="btn-icon h-8 w-8" onClick={() => setMenuOpen((open) => !open)} aria-label="Post options">
              <span className="text-sm leading-none">···</span>
            </button>
            {menuOpen ? (
              <>
                <button type="button" className="fixed inset-0 z-10 cursor-default" aria-label="Close" onClick={() => setMenuOpen(false)} />
                <div className="surface animate-pop absolute right-0 z-20 mt-1 w-40 p-1">
                  <button
                    type="button"
                    className="nav-link w-full text-left"
                    onClick={() => {
                      setEditing(true);
                      setMenuOpen(false);
                    }}
                  >
                    <PencilIcon size={14} /> Edit caption
                  </button>
                  <button type="button" className="nav-link w-full text-left" onClick={() => { setConfirmDelete(true); setMenuOpen(false); }}>
                    <TrashIcon size={14} /> Delete post
                  </button>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="px-4 pt-3">
        {editing ? (
          <div className="space-y-2">
            <textarea className="field" value={editValue} onChange={(event) => setEditValue(event.target.value)} rows={3} />
            <div className="flex gap-2">
              <button type="button" className="btn btn-primary btn-sm" onClick={saveEdit}>
                <CheckIcon size={13} /> Save
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setEditing(false);
                  setEditValue(post.caption);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-line">{post.caption}</p>
        )}
        {post.tags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span key={tag} className="tag" style={{ color: "var(--accent)" }}>
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {!dense ? (
        <div className="mt-3 px-3">
          <GradientArt
            gradient={post.gradient}
            emoji={post.emoji}
            imageUrl={post.mediaUrl}
            label={post.caption}
            className="aspect-[16/10] w-full rounded-2xl"
          >
            <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white uppercase backdrop-blur">
              {post.mediaKind === "audio" ? "🎵 audio" : post.mediaKind === "video" ? "▶ video" : post.mediaKind === "meme" ? "🫠 meme" : "✦ art"}
            </span>
            {post.mediaKind === "audio" || post.mediaKind === "video" ? (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition hover:scale-105">
                  <PlayIcon size={22} />
                </span>
              </span>
            ) : null}
            <span className="absolute right-3 bottom-3 text-3xl drop-shadow-lg">{post.emoji}</span>
          </GradientArt>
        </div>
      ) : null}

      <div className="flex items-center gap-1 px-3 py-3">
        <button
          type="button"
          onClick={like}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition hover:brightness-110"
          style={{ color: likes.reacted ? "#fb7185" : "var(--muted)", background: likes.reacted ? "rgba(244,63,94,0.12)" : "transparent" }}
          aria-pressed={likes.reacted}
        >
          <HeartIcon size={15} style={likes.reacted ? { fill: "#fb7185" } : undefined} />
          {compactNumber(likes.count)}
        </button>
        <button
          type="button"
          onClick={() => setCommentsOpen((open) => !open)}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition hover:brightness-110"
          style={{ color: commentsOpen ? "var(--accent)" : "var(--muted)" }}
        >
          <CommentIcon size={15} />
          {compactNumber(Math.max(0, post.commentCount - removedComments.length + pendingComments.length))}
        </button>
        <button type="button" onClick={share} className="muted flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold hover:brightness-110">
          <CopyIcon size={14} /> Share
        </button>
        {confirmDelete ? (
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-[11px] font-semibold" style={{ color: "#fb7185" }}>Delete?</span>
            <button type="button" className="btn btn-danger btn-sm" onClick={removePost}>Yes</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(false)}>
              <XIcon size={13} />
            </button>
          </div>
        ) : (
          <span className="muted ml-auto hidden text-[11px] sm:inline">{post.reacted ? "you + others reacted" : "be the first to react"}</span>
        )}
      </div>

      {commentsOpen ? (
        <div className="space-y-2 border-t px-4 py-3" style={{ borderColor: "var(--border)" }}>
          {visibleComments.length === 0 ? (
            <p className="muted text-xs">No comments yet — say something real.</p>
          ) : (
            visibleComments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-2">
                <Avatar emoji={comment.author.emoji} gradient={comment.author.gradient} size={26} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs">
                    <span className="font-semibold">{comment.author.name}</span>{" "}
                    <span className="muted text-[10px]">· {comment.createdLabel}</span>
                  </p>
                  <p className="muted text-xs leading-relaxed">{comment.body}</p>
                </div>
                {comment.isMine ? (
                  <button
                    type="button"
                    className="btn-icon h-6 w-6"
                    onClick={() => removeComment(comment.id)}
                    aria-label="Delete comment"
                  >
                    <TrashIcon size={11} />
                  </button>
                ) : null}
              </div>
            ))
          )}
          <form onSubmit={submitComment} className="flex items-center gap-2 pt-1">
            <Avatar emoji={viewer.avatarEmoji} gradient={viewer.gradient} size={26} />
            <input
              className="field py-1.5 text-xs"
              placeholder="Add a comment that mentions a timestamp…"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={!draft.trim()}>
              Send
            </button>
          </form>
        </div>
      ) : null}
    </article>
  );
}
