import React from 'react';

interface ChatMarkdownRendererProps {
  content: string;
}

function renderInlineFormatting(text: string): React.ReactNode[] {
  // Split by inline code (`...`) and bold (**...**)
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return tokens.map((token, idx) => {
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-400 font-mono-numbers text-[0.85em]"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong key={idx} className="font-bold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{token}</React.Fragment>;
  });
}

function isTableSeparatorRow(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes('|')) return false;
  return /^\|?[\s:|-]+\|?$/.test(trimmed) && trimmed.includes('-');
}

function parseTableCells(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map(cell => cell.trim());
}

export const ChatMarkdownRenderer: React.FC<ChatMarkdownRendererProps> = ({ content }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      i++;
      continue;
    }

    // Markdown table block
    if (line.includes('|') && i + 1 < lines.length && isTableSeparatorRow(lines[i + 1])) {
      const headers = parseTableCells(line);
      i += 2; // Skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().includes('|') && !isTableSeparatorRow(lines[i])) {
        rows.push(parseTableCells(lines[i]));
        i++;
      }

      elements.push(
        <div key={`tbl-${i}`} className="my-3 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
          <table className="w-full text-xs text-start border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-300">
                {headers.map((h, hIdx) => (
                  <th key={hIdx} className="py-2.5 px-3 font-bold text-start whitespace-nowrap">
                    {renderInlineFormatting(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-mono-numbers">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-900/50 transition-colors">
                  {headers.map((_, cIdx) => (
                    <td key={cIdx} className="py-2 px-3 text-slate-200 align-top">
                      {renderInlineFormatting(row[cIdx] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={`h3-${i}`} className="text-sm font-bold text-emerald-400 mt-4 mb-1.5">
          {renderInlineFormatting(line.slice(4))}
        </h4>
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={`h2-${i}`} className="text-base font-extrabold text-white mt-4 mb-2 pb-1 border-b border-slate-800">
          {renderInlineFormatting(line.slice(3))}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={`h1-${i}`} className="text-lg font-black text-white mt-3 mb-2">
          {renderInlineFormatting(line.slice(2))}
        </h2>
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line)) {
      elements.push(<hr key={`hr-${i}`} className="my-3 border-slate-800" />);
      i++;
      continue;
    }

    // Unordered list block
    if (/^[-*•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*•]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-2 space-y-1.5 ps-4 list-disc marker:text-emerald-500">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm text-slate-200 leading-relaxed">
              {renderInlineFormatting(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list block
    if (/^\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="my-2 space-y-1.5 ps-5 list-decimal marker:text-emerald-400 marker:font-mono-numbers">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm text-slate-200 leading-relaxed">
              {renderInlineFormatting(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <div
          key={`bq-${i}`}
          className="my-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed"
        >
          {quoteLines.map((ql, idx) => (
            <p key={idx}>{renderInlineFormatting(ql)}</p>
          ))}
        </div>
      );
      continue;
    }

    // Default paragraph
    elements.push(
      <p key={`p-${i}`} className="text-sm text-slate-200 leading-relaxed my-1.5">
        {renderInlineFormatting(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-1">{elements}</div>;
};
