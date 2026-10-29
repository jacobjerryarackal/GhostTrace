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
          className="flex items-center gap-2 text-base font-semibold tracking-tight transition-colors shrink-0"
          style={{
            fontFamily: 'var(--font-display, inherit)',
            color: 'var(--ink)',
          }}
        >
          <span
            className="flex h-5 w-5 items-center justify-center rounded border text-xs font-bold"
            style={{
              borderColor: 'var(--ink)',
              background: 'var(--chalk)',
              color: 'var(--ink)',
            }}
          >
            GT
          </span>
          <span>GhostTrace</span>
        </Link>

        {/* Desktop Nav Items + Status Chip */}
        <div className="hidden sm:flex items-center gap-6">
          <nav className="flex items-center gap-5 text-sm">
            {navLinks.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition-colors pb-0.5"
                  style={{
                    color: isActive ? 'var(--ink)' : 'var(--slate)',
                    fontWeight: isActive ? 600 : 400,
                    borderBottom: isActive ? '1.5px solid var(--ink)' : '1.5px solid transparent',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
            <a
              href="https://github.com/JacobTheGreat1337/GhostTrace-AI"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:underline"
              style={{ color: 'var(--slate)' }}
            >
              GitHub
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
            href="https://github.com/JacobTheGreat1337/GhostTrace-AI"
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
