"use client";

import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-bg overflow-x-hidden">
      {/* Background blobs */}
      <div className="paint-bg">
        <div className="paint-blob paint-blob-1" />
        <div className="paint-blob paint-blob-2" />
        <div className="paint-blob paint-blob-3" />
        <div className="paint-blob paint-blob-4" />
      </div>

      {/* Main Landing Page Container */}
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col px-6 py-8 md:px-12 md:py-16 min-h-screen justify-between">
        
        {/* Header */}
        <header className="flex justify-between items-center border-b border-border/40 pb-6">
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full bg-accent glow-accent" />
            <h1 className="font-heading text-4xl tracking-wider text-text">
              PAINTSTRIKE
            </h1>
          </div>
          <Link
            href="/lobby"
            className="btn-press border border-accent bg-transparent px-6 py-2.5 font-heading text-xl tracking-widest text-accent hover:bg-accent hover:text-bg rounded transition-all cursor-pointer uppercase font-bold"
          >
            ИГРАТЬ
          </Link>
        </header>

        {/* Hero Section */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-12 lg:my-16">
          {/* Left Column: Copy & Actions */}
          <div className="lg:col-span-6 flex flex-col items-start text-left animate-slide-in-right">
            <span className="font-mono text-[10px] md:text-xs text-accent uppercase tracking-[0.3em] bg-accent/10 px-3 py-1.5 rounded-full mb-6">
              МНОГОПОЛЬЗОВАТЕЛЬСКИЙ ШУТЕР В БРАУЗЕРЕ
            </span>
            <h2 className="font-heading text-6xl md:text-8xl text-text tracking-wide leading-none uppercase mb-6 logo-drip">
              PAINTSTRIKE
            </h2>
            <p className="font-mono text-xs md:text-sm text-muted tracking-wide mb-8 max-w-xl leading-relaxed">
              Динамичная пейнтбольная битва на Supabase Realtime! Один выстрел — одно попадание. Делись кодом комнаты с друзьями, делись на команды, покупай улучшения в магазине и защищай или взрывай Defender Box в реальном времени.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link
                href="/lobby"
                className="btn-press text-center bg-accent text-bg px-12 py-5 font-heading text-3xl tracking-[0.15em] rounded glow-play hover:brightness-110 uppercase leading-none font-bold"
              >
                ИГРАТЬ СЕЙЧАС
              </Link>
              <a
                href="#features"
                className="btn-press text-center border border-border bg-surface/50 hover:border-accent/40 px-8 py-5 font-heading text-xl tracking-widest text-text rounded transition-all uppercase leading-none flex items-center justify-center"
              >
                ОБ ИГРЕ
              </a>
            </div>
          </div>

          {/* Right Column: Visual Showcase Card */}
          <div className="lg:col-span-6 flex justify-center relative">
            <div className="relative w-full max-w-[500px] aspect-[4/3] rounded-xl overflow-hidden border border-border/80 bg-surface/30 p-2 shadow-2xl backdrop-blur-sm group hover:border-accent/40 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent z-10 opacity-70" />
              <div className="relative w-full h-full rounded-lg overflow-hidden">
                <Image
                  src="/paintstrike_hero.png"
                  alt="PaintStrike Arena illustration"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
              </div>
              <div className="absolute bottom-6 left-6 right-6 z-20">
                <span className="font-mono text-[10px] text-accent tracking-widest block uppercase mb-1">
                  Карта Арены
                </span>
                <span className="font-heading text-3xl text-text tracking-wide block uppercase">
                  Тактическое противостояние
                </span>
              </div>
            </div>
          </div>
        </main>

        {/* Features Section */}
        <section id="features" className="border-t border-border/30 pt-16 pb-8">
          <h3 className="font-heading text-4xl text-text tracking-widest uppercase mb-12 text-center">
            ОСОБЕННОСТИ ИГРЫ
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="border border-border bg-surface/40 p-6 rounded hover:border-accent2/40 transition-all group">
              <div className="w-12 h-12 rounded bg-accent2/10 flex items-center justify-center text-accent2 text-2xl font-bold mb-4 group-hover:scale-110 transition-transform">
                ⚔
              </div>
              <h4 className="font-heading text-2xl text-text tracking-wider uppercase mb-2">
                Режимы Команд
              </h4>
              <p className="font-mono text-xs text-muted leading-relaxed">
                Выбирайте сторону: Атакующие стремятся пробраться к базе и уничтожить Defender Box, Защитники обязаны защитить его любой ценой.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="border border-border bg-surface/40 p-6 rounded hover:border-accent3/40 transition-all group">
              <div className="w-12 h-12 rounded bg-accent3/10 flex items-center justify-center text-accent3 text-2xl font-bold mb-4 group-hover:scale-110 transition-transform">
                🔫
              </div>
              <h4 className="font-heading text-2xl text-text tracking-wider uppercase mb-2">
                Арсенал Оружия
              </h4>
              <p className="font-mono text-xs text-muted leading-relaxed">
                Стреляйте из Пейнтбольного Маркера или швыряйте Водяные Шарики с краской. Наносите урон мок-ботам и противникам для получения золота.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="border border-border bg-surface/40 p-6 rounded hover:border-accent/40 transition-all group">
              <div className="w-12 h-12 rounded bg-accent/10 flex items-center justify-center text-accent text-2xl font-bold mb-4 group-hover:scale-110 transition-transform">
                🛒
              </div>
              <h4 className="font-heading text-2xl text-text tracking-wider uppercase mb-2">
                Тактический Магазин
              </h4>
              <p className="font-mono text-xs text-muted leading-relaxed">
                Покупайте патроны, водяные шарики, ремонтную ленту для восстановления здоровья коробки или ускорение скорости перемещения во время раунда.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/20 pt-8 mt-12 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="font-mono text-[10px] text-muted tracking-wider uppercase">
            © 2026 PAINTSTRIKE. ВСЕ ПРАВА ЗАЩИЩЕНЫ.
          </p>
          <div className="flex gap-6 font-mono text-[10px] text-muted tracking-widest uppercase">
            <span>SUPABASE REALTIME</span>
            <span>THREE.JS / WEBGL</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
