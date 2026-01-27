'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Book, ChevronDown, ChevronRight, FileText, ArrowUp, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { fetchManual } from '@/lib/api';

interface Section {
  title: string;
  level: number;
  content: string;
  subsections: Section[];
}

function parseManual(content: string): Section[] {
  const lines = content.split('\n');
  const sections: Section[] = [];
  let currentContent: string[] = [];
  let stack: { section: Section; level: number }[] = [];

  for (const line of lines) {
    const h1Match = line.match(/^# (.+)$/);
    const h2Match = line.match(/^## (.+)$/);
    const h3Match = line.match(/^### (.+)$/);
    const h4Match = line.match(/^#### (.+)$/);

    if (h1Match || h2Match || h3Match || h4Match) {
      // Save content to previous section
      if (stack.length > 0) {
        stack[stack.length - 1].section.content = currentContent.join('\n').trim();
      }
      currentContent = [];

      const match = h1Match || h2Match || h3Match || h4Match;
      const level = h1Match ? 1 : h2Match ? 2 : h3Match ? 3 : 4;
      const newSection: Section = {
        title: match![1],
        level,
        content: '',
        subsections: [],
      };

      // Pop stack until we find a parent with lower level
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack.length === 0) {
        sections.push(newSection);
      } else {
        stack[stack.length - 1].section.subsections.push(newSection);
      }

      stack.push({ section: newSection, level });
    } else {
      currentContent.push(line);
    }
  }

  // Save remaining content
  if (stack.length > 0) {
    stack[stack.length - 1].section.content = currentContent.join('\n').trim();
  }

  return sections;
}

function highlightText(text: string, query: string): JSX.Element {
  if (!query.trim()) return <>{text}</>;

  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function countMatches(text: string, query: string): number {
  if (!query.trim()) return 0;
  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function sectionHasMatch(section: Section, query: string): boolean {
  if (!query) return true;
  const lowerQuery = query.toLowerCase();
  if (section.title.toLowerCase().includes(lowerQuery)) return true;
  if (section.content.toLowerCase().includes(lowerQuery)) return true;
  return section.subsections.some(s => sectionHasMatch(s, query));
}

function SectionCard({ section, query, depth = 0 }: { section: Section; query: string; depth?: number }) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const hasMatch = sectionHasMatch(section, query);

  useEffect(() => {
    if (query && hasMatch) setIsExpanded(true);
  }, [query, hasMatch]);

  if (query && !hasMatch) return null;

  const titleMatch = query && section.title.toLowerCase().includes(query.toLowerCase());

  return (
    <div className={clsx("border-l-2", depth === 0 ? "border-leaf-500" : "border-gray-200", depth > 0 && "ml-4")}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={clsx(
          "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50",
          titleMatch && "bg-yellow-50"
        )}
      >
        {section.subsections.length > 0 || section.content ? (
          isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <div className="w-4" />
        )}
        <span className={clsx(
          depth === 0 ? "font-semibold text-gray-900" : "font-medium text-gray-700",
          depth >= 2 && "text-sm"
        )}>
          {highlightText(section.title, query)}
        </span>
      </button>

      {isExpanded && (
        <div className="pl-6">
          {section.content && (
            <div className="prose prose-sm max-w-none py-2 px-3 text-gray-600">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {highlightText(section.content, query)}
              </pre>
            </div>
          )}
          {section.subsections.map((sub, i) => (
            <SectionCard key={i} section={sub} query={query} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ManualPage() {
  const [query, setQuery] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { data: manualData, isLoading, error } = useQuery({
    queryKey: ['manual'],
    queryFn: fetchManual,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const sections = useMemo(() => {
    if (!manualData?.content) return [];
    return parseManual(manualData.content);
  }, [manualData?.content]);

  const matchCount = useMemo(() => {
    if (!query.trim() || !manualData?.content) return 0;
    return countMatches(manualData.content, query);
  }, [query, manualData?.content]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-leaf-500 mx-auto mb-3" />
          <p className="text-gray-500">Loading manual...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">Failed to load manual</p>
          <p className="text-red-500 text-sm mt-1">Make sure the backend is running</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-leaf-500 rounded-xl flex items-center justify-center">
          <Book className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Manual</h1>
          <p className="text-sm text-gray-500">Search and browse the MoodLeaf documentation</p>
        </div>
      </div>

      {/* Search */}
      <div className="sticky top-0 z-10 bg-gray-50 py-3 -mx-6 px-6 mb-6 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search manual... (e.g., 'transcript', 'API key', 'brain studio', 'goals')"
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-leaf-500 focus:border-transparent"
          />
          {query && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="text-xs text-gray-500">{matchCount} matches</span>
              <button
                onClick={() => setQuery('')}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      {!query && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Quick Start', search: 'Quick Start' },
            { label: 'API Keys', search: 'API Key' },
            { label: 'Brain Studio', search: 'Brain Studio' },
            { label: 'Goals Tab', search: 'Goals Tab' },
            { label: 'Dashboard', search: 'Dashboard' },
            { label: 'Training Gaps', search: 'Training Gaps' },
            { label: 'Troubleshooting', search: 'Troubleshooting' },
            { label: 'Export', search: 'Export' },
          ].map((item) => (
            <button
              key={item.search}
              onClick={() => setQuery(item.search)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm text-gray-700"
            >
              <FileText className="w-4 h-4 text-gray-400" />
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {sections.map((section, i) => (
          <SectionCard key={i} section={section} query={query} />
        ))}
      </div>

      {/* No Results */}
      {query && matchCount === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">No results found for "{query}"</p>
          <p className="text-sm text-gray-400 mt-1">Try different keywords or browse sections above</p>
        </div>
      )}

      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 w-10 h-10 bg-leaf-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-leaf-600"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
