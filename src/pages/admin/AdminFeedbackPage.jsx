import { useEffect, useState } from "react";
import {
  fetchAdminFeedback,
  fetchFeedbackTopics,
} from "../../services/adminApi";

const PAGE_SIZE = 20;

function FeedbackCard({ item }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = (item.Content || "").length > 220;

  return (
    <article className="bg-surface-container-lowest rounded-xl p-6 border border-surface-container-high">
      <header className="flex justify-between items-start gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-headline text-on-surface text-lg truncate">
            {item.FullName}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-outline mt-1">
            {item.FeedbackDate}
            {item.ReferralSource && (
              <>
                {" "}&middot; via {item.ReferralSource}
              </>
            )}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end shrink-0">
          <span className="px-2 py-0.5 text-[10px] font-label uppercase tracking-widest rounded-full bg-secondary-container text-on-secondary-container">
            {item.TopicName}
          </span>
          <span
            className={`px-2 py-0.5 text-[9px] font-label uppercase tracking-widest rounded-full ${
              item.HasTransaction
                ? "bg-secondary-container text-on-secondary-container"
                : "bg-surface-container-highest text-on-surface-variant"
            }`}
          >
            {item.HasTransaction ? "Customer" : "Visitor"}
          </span>
        </div>
      </header>
      <p
        className={`text-sm text-on-surface-variant font-light leading-relaxed italic ${
          !expanded && isLong ? "line-clamp-3" : ""
        }`}
      >
        &ldquo;{item.Content}&rdquo;
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-[10px] uppercase tracking-widest font-bold text-primary hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
      {(item.Email || item.Phone) && (
        <div className="mt-4 pt-4 border-t border-outline-variant/20 flex flex-wrap gap-4 text-xs text-on-surface-variant">
          {item.Email && (
            <a
              href={`mailto:${item.Email}`}
              className="flex items-center gap-1 hover:text-primary"
            >
              <span className="material-symbols-outlined text-sm">mail</span>
              {item.Email}
            </a>
          )}
          {item.Phone && (
            <a
              href={`tel:${item.Phone}`}
              className="flex items-center gap-1 hover:text-primary"
            >
              <span className="material-symbols-outlined text-sm">call</span>
              {item.Phone}
            </a>
          )}
        </div>
      )}
    </article>
  );
}

export default function AdminFeedbackPage() {
  const [topics, setTopics] = useState([]);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [topicId, setTopicId] = useState("");
  const [hasTransaction, setHasTransaction] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFeedbackTopics()
      .then((data) => setTopics(data))
      .catch(() => setTopics([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAdminFeedback({
      topicId,
      hasTransaction,
      page,
      pageSize: PAGE_SIZE,
    })
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setTotal(data.total);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [topicId, hasTransaction, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function selectTopic(id) {
    setTopicId(id);
    setPage(1);
  }

  return (
    <div className="p-8 custom-scrollbar">
      <div className="mb-6">
        <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">
          Curator&apos;s Inbox
        </h1>
        <p className="text-on-surface-variant font-light max-w-2xl mt-2">
          Whispers from visitors and patrons, gathered by topic.
        </p>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => selectTopic("")}
            className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold rounded-full transition-colors ${
              topicId === ""
                ? "bg-primary text-on-primary"
                : "bg-surface-container-highest text-on-surface-variant hover:text-primary"
            }`}
          >
            All
          </button>
          {topics.map((t) => (
            <button
              key={t.TopicId}
              type="button"
              onClick={() => selectTopic(String(t.TopicId))}
              className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold rounded-full transition-colors ${
                String(topicId) === String(t.TopicId)
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-highest text-on-surface-variant hover:text-primary"
              }`}
            >
              {t.TopicName}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <label
            htmlFor="has_transaction"
            className="font-label uppercase tracking-widest text-[10px] text-outline"
          >
            Sender
          </label>
          <select
            id="has_transaction"
            value={hasTransaction}
            onChange={(e) => {
              setHasTransaction(e.target.value);
              setPage(1);
            }}
            className="bg-transparent border-b border-outline-variant/40 py-1 text-sm focus:border-primary outline-none"
          >
            <option value="">Anyone</option>
            <option value="true">Customers</option>
            <option value="false">Visitors</option>
          </select>
        </div>
      </div>

      {error && !loading && (
        <div className="bg-error-container text-on-error-container px-5 py-4 rounded-sm text-sm font-label mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-container-lowest rounded-xl p-6 border border-surface-container-high animate-pulse h-36"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-16 text-center">
          <span className="material-symbols-outlined text-5xl text-outline mb-3 block">
            forum
          </span>
          <p className="font-headline italic text-lg text-on-surface mb-1">
            The inbox is silent for now
          </p>
          <p className="text-xs text-on-surface-variant">
            Try widening the filters above to surface older feedback.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((it) => (
            <FeedbackCard key={it.FeedbackId} item={it} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex justify-between items-center">
          <p className="text-xs text-on-surface-variant font-light">
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 text-xs tracking-widest uppercase font-bold text-on-surface-variant hover:text-on-surface border border-outline-variant/30 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <span className="text-xs text-on-surface-variant px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 text-xs tracking-widest uppercase font-bold text-on-surface-variant hover:text-on-surface border border-outline-variant/30 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
