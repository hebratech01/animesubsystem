"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock3,
  Play,
  Search,
  Sparkles,
  Tv,
  X,
} from "lucide-react";

type Title = {
  title_id: string;
  title_name: string;
  origin_type: "licensed" | "original" | null;
};

type Anime = {
  anime_id: string;
  title_id: string | null;
  status: "watching_pending" | "license_acquired" | "live" | null;
  license_acquired_date: string | null;
};

type Arc = {
  arc_id: string;
  title_id: string | null;
  arc_name: string;
  sequence_order: number | null;
};

type Episode = {
  episode_id: string;
  anime_id: string | null;
  arc_id: string | null;
  episode_number: number | null;
  release_date: string | null;
};

const statusLabel: Record<NonNullable<Anime["status"]>, string> = {
  watching_pending: "Watching pending",
  license_acquired: "License acquired",
  live: "Live",
};

export default function Home() {
  const supabase = useMemo(() => createClient(), []);
  const [titles, setTitles] = useState<Title[]>([]);
  const [anime, setAnime] = useState<Anime[]>([]);
  const [arcs, setArcs] = useState<Arc[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [query, setQuery] = useState("");
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [titleResult, animeResult, arcResult, episodeResult] =
        await Promise.all([
          supabase
            .from("titles")
            .select("title_id,title_name,origin_type")
            .order("title_name"),
          supabase
            .from("anime_titles")
            .select("anime_id,title_id,status,license_acquired_date"),
          supabase
            .from("arcs")
            .select("arc_id,title_id,arc_name,sequence_order")
            .order("sequence_order"),
          supabase
            .from("episodes")
            .select("episode_id,anime_id,arc_id,episode_number,release_date")
            .order("episode_number"),
        ]);

      const firstError =
        titleResult.error ||
        animeResult.error ||
        arcResult.error ||
        episodeResult.error;

      if (firstError) setError(firstError.message);
      setTitles(titleResult.data ?? []);
      setAnime(animeResult.data ?? []);
      setArcs(arcResult.data ?? []);
      setEpisodes(episodeResult.data ?? []);
      setLoading(false);
    }

    load();
  }, [supabase]);

  const visibleTitles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return titles;
    return titles.filter((title) =>
      title.title_name.toLowerCase().includes(q),
    );
  }, [query, titles]);

  const animeByTitle = useMemo(
    () => new Map(anime.map((item) => [item.title_id, item])),
    [anime],
  );

  const arcsByTitle = useMemo(() => {
    const map = new Map<string, Arc[]>();
    for (const arc of arcs) {
      if (!arc.title_id) continue;
      map.set(arc.title_id, [...(map.get(arc.title_id) ?? []), arc]);
    }
    return map;
  }, [arcs]);

  const episodeCountByAnime = useMemo(() => {
    const map = new Map<string, number>();
    for (const episode of episodes) {
      if (!episode.anime_id) continue;
      map.set(episode.anime_id, (map.get(episode.anime_id) ?? 0) + 1);
    }
    return map;
  }, [episodes]);

  const liveCount = anime.filter((item) => item.status === "live").length;
  const stats = [
    { label: "Titles", value: titles.length, icon: BookOpen },
    { label: "Anime", value: anime.length, icon: Tv },
    { label: "Arcs", value: arcs.length, icon: Sparkles },
    { label: "Episodes", value: episodes.length, icon: Play },
  ];

  return (
    <main className="min-h-screen bg-[#08090c] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#08090c]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-violet-500 text-lg font-black">
              H
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">
                Hebra
              </p>
              <h1 className="text-lg font-bold">Anime</h1>
            </div>
          </div>
          <div className="hidden items-center gap-6 text-sm text-white/60 md:flex">
            <a href="#catalog" className="hover:text-white">Catalog</a>
            <a href="#episodes" className="hover:text-white">Episodes</a>
            <a href="#about" className="hover:text-white">About</a>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 pb-10 pt-14 lg:grid-cols-[1.25fr_.75fr] lg:px-8 lg:pt-20">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-semibold text-violet-200">
            <Sparkles size={14} /> Anime subsystem
          </div>
          <h2 className="max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
            Discover the anime connected to your titles.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/55 sm:text-lg">
            A schema-driven catalog for titles, arcs, licensed anime releases,
            and episodes. Content appears automatically as the Anime database
            is populated.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#catalog" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-black">
              Browse catalog <ChevronRight size={16} />
            </a>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white/60">
              {liveCount} live · {episodes.length} episodes
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-violet-500/20 via-white/[0.04] to-cyan-400/10 p-6">
          <div className="grid grid-cols-2 gap-3">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <Icon size={18} className="text-violet-300" />
                <p className="mt-5 text-2xl font-black">{value}</p>
                <p className="text-xs text-white/45">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="catalog" className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-300">Catalog</p>
            <h3 className="mt-2 text-3xl font-black">Anime titles</h3>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search titles..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] py-3 pl-10 pr-4 text-sm outline-none placeholder:text-white/30 focus:border-violet-400/50"
            />
          </div>
        </div>

        {loading ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center text-white/45">
            Loading Anime catalog...
          </div>
        ) : error ? (
          <div className="mt-8 rounded-3xl border border-red-400/20 bg-red-400/10 p-6 text-sm text-red-200">
            Could not load the Anime catalog: {error}
          </div>
        ) : visibleTitles.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
            <Tv className="mx-auto text-white/30" size={30} />
            <p className="mt-4 font-semibold">
              {titles.length === 0 ? "No Anime titles have been added yet." : "No titles match your search."}
            </p>
            <p className="mt-2 text-sm text-white/40">
              The frontend is connected to the Anime schema and will populate from Supabase.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleTitles.map((title) => {
              const item = animeByTitle.get(title.title_id);
              const titleArcs = arcsByTitle.get(title.title_id) ?? [];
              const count = item ? episodeCountByAnime.get(item.anime_id) ?? 0 : 0;
              return (
                <button
                  key={title.title_id}
                  onClick={() => {
                    setSelectedTitle(title);
                    setSelectedAnime(item ?? null);
                  }}
                  className="group rounded-3xl border border-white/10 bg-white/[0.035] p-5 text-left transition hover:-translate-y-0.5 hover:border-violet-400/30 hover:bg-white/[0.055]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-violet-500/15 text-violet-300">
                      <Tv size={21} />
                    </div>
                    <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/45">
                      {title.origin_type ?? "title"}
                    </span>
                  </div>
                  <h4 className="mt-7 text-xl font-bold">{title.title_name}</h4>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/45">
                    <span>{titleArcs.length} arcs</span>
                    <span>•</span>
                    <span>{count} episodes</span>
                    {item?.status && (
                      <>
                        <span>•</span>
                        <span className="text-violet-300">{statusLabel[item.status]}</span>
                      </>
                    )}
                  </div>
                  <div className="mt-6 flex items-center justify-between text-xs font-semibold text-white/55 group-hover:text-white">
                    View details <ChevronRight size={15} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section id="episodes" className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Clock3 className="text-violet-300" size={20} />
            <div>
              <h3 className="font-bold">Episode pipeline</h3>
              <p className="text-sm text-white/40">Release data from the episodes table.</p>
            </div>
          </div>
          {episodes.length === 0 ? (
            <p className="mt-6 rounded-2xl bg-black/20 p-5 text-sm text-white/40">
              No episodes are currently stored. Add episode records in Supabase and they will appear here automatically.
            </p>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {episodes.slice(0, 8).map((episode) => (
                <div key={episode.episode_id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/40">Episode</p>
                  <p className="mt-1 text-lg font-bold">#{episode.episode_number ?? "—"}</p>
                  <p className="mt-3 flex items-center gap-1 text-xs text-white/45">
                    <CalendarDays size={13} />
                    {episode.release_date ?? "Release date pending"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Titles", "Core title records shared with arcs and Anime."],
            ["Anime", "Licensed/live Anime records attached to titles."],
            ["Arcs", "Ordered story arcs associated with each title."],
            ["Episodes", "Episode and release records linked to Anime and arcs."],
          ].map(([name, description]) => (
            <div key={name} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <p className="font-bold">{name}</p>
              <p className="mt-2 text-sm leading-6 text-white/40">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-10 text-center text-xs text-white/30">
        Hebra Anime · Powered by the Anime Supabase schema
      </footer>

      {selectedTitle && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-5 backdrop-blur-sm" onClick={() => setSelectedTitle(null)}>
          <div
            className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#111319] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">Anime title</p>
                <h3 className="mt-2 text-2xl font-black">{selectedTitle.title_name}</h3>
              </div>
              <button onClick={() => setSelectedTitle(null)} className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="mt-7 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/[0.04] p-4">
                <p className="text-xs text-white/35">Status</p>
                <p className="mt-2 font-semibold">{selectedAnime?.status ? statusLabel[selectedAnime.status] : "Not registered"}</p>
              </div>
              <div className="rounded-2xl bg-white/[0.04] p-4">
                <p className="text-xs text-white/35">Episodes</p>
                <p className="mt-2 font-semibold">{selectedAnime ? episodeCountByAnime.get(selectedAnime.anime_id) ?? 0 : 0}</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-white/[0.04] p-4">
              <p className="text-xs text-white/35">Arcs</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(arcsByTitle.get(selectedTitle.title_id) ?? []).map((arc) => (
                  <span key={arc.arc_id} className="rounded-full bg-violet-500/10 px-3 py-1.5 text-xs text-violet-200">
                    {arc.arc_name}
                  </span>
                ))}
                {(arcsByTitle.get(selectedTitle.title_id) ?? []).length === 0 && (
                  <span className="text-sm text-white/35">No arcs registered.</span>
                )}
              </div>
            </div>
            {selectedAnime?.license_acquired_date && (
              <p className="mt-4 text-xs text-white/35">
                License acquired: {selectedAnime.license_acquired_date}
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
