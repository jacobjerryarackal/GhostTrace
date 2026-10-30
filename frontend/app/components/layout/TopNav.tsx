'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { StatusChip } from './StatusChip';

export function TopNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/investigate', label: 'Investigate' },
    { href: '/benchmark', label: 'Benchmark' },
    { href: '/method', label: 'Method' },
  ];

  return (
    <header
      className="sticky top-0 z-50 w-full border-b"
      style={{
        background: 'var(--paper)',
        borderColor: 'var(--hairline)',
      }}
    >
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4 sm:px-6">
        {/* Brand / Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-base font-semibold tracking-tight transition-transform active:scale-[0.98] shrink-0"
          style={{
            fontFamily: 'var(--font-display, inherit)',
            color: 'var(--ink)',
          }}
        >
          <span
            className="flex h-6 w-6 items-center justify-center rounded-[5px] border text-[11px] font-mono font-bold tracking-tight shadow-none transition-colors group-hover:border-[var(--ink)]"
            style={{
              borderColor: 'var(--hairline)',
              background: 'var(--surface-subtle)',
              color: 'var(--ink)',
            }}
          >
            GT
          </span>
          <span className="font-display tracking-tight text-[15px] font-bold">GhostTrace</span>
        </Link>

        {/* Desktop Nav Items + Status Chip */}
        <div className="hidden sm:flex items-center gap-5">
          <nav className="flex items-center gap-1 text-xs">
            {navLinks.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative px-3 py-1.5 rounded-[5px] transition-colors font-medium"
                  style={{
                    color: isActive ? 'var(--ink)' : 'var(--slate)',
                    background: isActive ? 'var(--surface-subtle)' : 'transparent',
                  }}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-3 right-3 h-[1.5px] rounded-full"
                      style={{ background: 'var(--ink)' }}
                    />
                  )}
                </Link>
              );
            })}
            <a
              href="https://github.com/jacobjerryarackal/GhostTrace/"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-[5px] transition-colors hover:text-[var(--ink)] text-[var(--slate)] font-medium"
            >
              GitHub ↗
            </a>
          </nav>

          <div className="h-4 w-[1px]" style={{ background: 'var(--hairline)' }} />

          <StatusChip />
        </div>

        {/* Mobile controls */}
        <div className="flex sm:hidden items-center gap-2">
          <StatusChip />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 rounded text-[var(--slate)] hover:text-[var(--ink)]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div
          className="sm:hidden border-b px-4 py-3 space-y-2 bg-[var(--paper)]"
          style={{ borderColor: 'var(--hairline)' }}
        >
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-sm transition-colors"
                style={{
                  color: isActive ? 'var(--ink)' : 'var(--slate)',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {item.label}
              </Link>
            );
          })}
          <a
            href="https://github.com/jacobjerryarackal/GhostTrace/"
            target="_blank"
            rel="noreferrer"
            className="block py-1.5 text-sm transition-colors text-[var(--slate)]"
          >
            GitHub
          </a>
        </div>
      )}
    </header>
  );
}
