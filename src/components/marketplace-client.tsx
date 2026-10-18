"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changePlan, purchaseItem } from "@/app/actions";
import { CheckIcon, LockIcon, SparklesIcon, StoreIcon, ZapIcon } from "@/components/icons";
import { EmptyState, useToast } from "@/components/ui";
import { PLAN_FEATURES } from "@/components/composer-options";
import { priceLabel } from "@/lib/format";
import type { CurrentUser, MarketItemDTO } from "@/lib/types";

const PLAN_ORDER = ["free", "plus", "pro"] as const;

export function MarketplaceClient({ viewer, items }: { viewer: CurrentUser; items: MarketItemDTO[] }) {
  const router = useRouter();
  const { push } = useToast();
  const [plan, setPlan] = useState(viewer.plan);
  const [owned, setOwned] = useState<number[]>(items.filter((item) => item.owned).map((item) => item.id));
  const [sales, setSales] = useState<Record<number, number>>(Object.fromEntries(items.map((item) => [item.id, item.sales])));
  const [category, setCategory] = useState("all");
  const [pending, startTransition] = useTransition();

  const categories = useMemo(() => ["all", ...new Set(items.map((item) => item.category))], [items]);
  const visible = category === "all" ? items : items.filter((item) => item.category === category);

  const choosePlan = (next: string) => {
    if (next === plan) return;
    const previous = plan;
    setPlan(next);
    startTransition(async () => {
      const result = await changePlan(next);
      if (!result.ok) {
        setPlan(previous);
        push(result.error ?? "Could not change plan", "error");
      } else {
        push(`You're on Muse ${next[0].toUpperCase()}${next.slice(1)}`);
        router.refresh();
      }
    });
  };

  const buy = (item: MarketItemDTO) => {
    if (owned.includes(item.id)) return;
    setOwned((current) => [...current, item.id]);
    setSales((current) => ({ ...current, [item.id]: (current[item.id] ?? 0) + 1 }));
    startTransition(async () => {
      const result = await purchaseItem(item.id);
      if (!result.ok) {
        setOwned((current) => current.filter((id) => id !== item.id));
        setSales((current) => ({ ...current, [item.id]: Math.max(0, (current[item.id] ?? 1) - 1) }));
        push(result.error ?? "Could not complete purchase", "error");
      } else {
        push(`“${item.title}” added to your library · +25 XP`);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-5">
      <section>
        <div className="mb-2 flex items-end justify-between">
          <div>
            <h2 className="font-display text-lg font-bold">Membership</h2>
            <p className="muted text-xs">Freemium, no dark patterns. Cancel anytime.</p>
          </div>
          <span className="chip chip-active capitalize">current: {plan}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {PLAN_ORDER.map((key) => {
            const info = PLAN_FEATURES[key];
            const active = plan === key;
            return (
              <div
                key={key}
                className="surface flex flex-col p-4"
                style={active ? { borderColor: "var(--accent)", boxShadow: "0 0 0 1px var(--accent)" } : undefined}
              >
                <div className="flex items-center justify-between">
                  <p className="font-display text-base font-bold capitalize">Muse {key}</p>
                  {active ? <span className="chip chip-active">active</span> : null}
                </div>
                <p className="font-display mt-1 text-2xl font-bold">
                  {info.price === 0 ? "$0" : priceLabel(info.price)}
                  <span className="muted text-xs font-medium">/mo</span>
                </p>
                <p className="muted mt-1 text-xs">{info.tagline}</p>
                <ul className="mt-2 flex-1 space-y-1">
                  {info.features.map((feature) => (
                    <li key={feature} className="muted flex items-start gap-1.5 text-[11px]">
                      <CheckIcon size={12} style={{ color: "var(--accent)", marginTop: 1 }} /> {feature}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => choosePlan(key)}
                  disabled={pending || active}
                  className={`btn btn-sm mt-3 w-full ${active ? "btn-secondary" : "btn-primary"}`}
                >
                  {active ? "Current plan" : key === "free" ? "Downgrade" : `Switch to ${key}`}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold">Creator marketplace</h2>
            <p className="muted text-xs">Presets, packs, templates and 1:1s from creators you already follow.</p>
          </div>
          <div className="hide-scrollbar flex gap-1.5 overflow-x-auto">
            {categories.map((option) => (
              <button key={option} type="button" onClick={() => setCategory(option)} className={`chip shrink-0 capitalize ${category === option ? "chip-active" : ""}`}>
                {option}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState emoji="🛍️" title="Nothing here yet" body="No items in this category — check the full marketplace." />
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((item) => {
              const isOwned = owned.includes(item.id);
              return (
                <div key={item.id} className="surface hover-lift overflow-hidden">
                  <div className="relative flex h-24 items-end p-3" style={{ backgroundImage: item.gradient }}>
                    <span className="absolute top-2 right-2 rounded-full bg-black/35 px-2 py-0.5 text-[9px] font-bold text-white uppercase">
                      {item.rating} ★
                    </span>
                    <span className="text-2xl">{item.emoji}</span>
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-semibold">{item.title}</p>
                    <p className="muted text-[11px]">{item.creator} · {item.category}</p>
                    <div className="mt-2 flex items-center justify-between gap-1">
                      <div>
                        <p className="text-sm font-bold">{priceLabel(item.price)}</p>
                        <p className="muted text-[10px]">{(sales[item.id] ?? item.sales).toLocaleString()} sales</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => buy(item)}
                        disabled={pending || isOwned}
                        className={`btn btn-sm ${isOwned ? "btn-secondary" : "btn-primary"}`}
                      >
                        {isOwned ? <><CheckIcon size={12} /> Owned</> : <><StoreIcon size={12} /> Get</>}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="surface flex flex-wrap items-center justify-between gap-3 p-4" style={{ backgroundImage: "linear-gradient(130deg, var(--accent-soft), transparent)" }}>
        <div>
          <p className="flex items-center gap-1.5 text-sm font-bold"><SparklesIcon size={15} /> Sell your own presets & templates</p>
          <p className="muted mt-1 text-xs">
            Creators keep 85% of every sale. Muse Pro adds analytics, bundles and a storefront on your profile.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip"><LockIcon size={12} /> Pro required</span>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => choosePlan("pro")} disabled={pending}>
            <ZapIcon size={13} /> Become a seller
          </button>
        </div>
      </section>
    </div>
  );
}
