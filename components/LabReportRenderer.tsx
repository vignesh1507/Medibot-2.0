"use client";

import ReactMarkdown from "react-markdown";

const LAB_REPORT_MARKER = "[[LAB_REPORT]]";

export function isLabReportResponse(response: string): boolean {
  return typeof response === "string" && response.trimStart().startsWith(LAB_REPORT_MARKER);
}

export function wrapLabReport(markdown: string): string {
  return `${LAB_REPORT_MARKER}\n${markdown}`;
}

function stripMarker(response: string): string {
  return response.replace(LAB_REPORT_MARKER, "").trimStart();
}

/**
 * Lab reports are full of comparison operators in reference ranges: "<5.7%",
 * ">40", "<100 optimal", etc. react-markdown treats a bare "<" as the start of
 * an HTML/JSX tag and SILENTLY DROPS everything until it finds a matching ">".
 * That's what was cutting reports off mid-way (e.g. at "<5.7% Non...").
 *
 * Fix: escape every "<" / ">" that isn't part of a real markdown/html construct
 * into its HTML entity so it renders as literal text. We only touch angle
 * brackets that look like comparison operators (followed by a digit, space, or
 * end) — never real tags, of which the AI output has none anyway.
 */
function escapeComparisonOperators(md: string): string {
  return md
    // "<" followed by a digit, dot, space, or equals → literal less-than
    .replace(/<(?=[\s\d.=])/g, "&lt;")
    // ">" preceded by a space or digit, or at a word edge → literal greater-than
    .replace(/(?<=[\s\d=])>/g, "&gt;");
}

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  NORMAL: { label: "Normal", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  LOW: { label: "Low", color: "bg-amber-100 text-amber-800 border-amber-200" },
  BORDERLINE: { label: "Borderline", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  HIGH: { label: "High", color: "bg-orange-100 text-orange-800 border-orange-200" },
  CRITICAL: { label: "Critical", color: "bg-red-100 text-red-800 border-red-300" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status.toUpperCase()] ?? { label: status, color: "bg-gray-100 text-gray-800 border-gray-200" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${s.color} mr-2 align-middle`}>
      {s.label}
    </span>
  );
}

/**
 * Renders the AI's structured lab report markdown as a clean medical card.
 * Transforms `**[STATUS] Test Name**` into a colored badge + bold test name.
 */
export function LabReportRenderer({ response }: { response: string }) {
  const markdown = escapeComparisonOperators(stripMarker(response));

  return (
    <div className="lab-report-card rounded-xl border border-gray-200 bg-white p-4 sm:p-5 my-2 shadow-sm">
      <ReactMarkdown
        components={{
          h3: ({ children }) => (
            <h3 className="text-lg font-bold text-gray-900 mt-5 mb-2 first:mt-0 pb-1 border-b border-gray-100">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold text-gray-800 mt-4 mb-1">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="text-sm text-gray-700 leading-relaxed my-1.5">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-5 my-2 space-y-1.5 text-sm text-gray-700">
              {children}
            </ul>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          em: ({ children }) => <em className="text-gray-600 italic">{children}</em>,
          strong: ({ children }) => {
            // Detect "[STATUS] Test Name" pattern and turn it into a badge + name
            const text = Array.isArray(children)
              ? children.map((c) => (typeof c === "string" ? c : "")).join("")
              : typeof children === "string"
              ? children
              : "";
            const match = text.match(/^\[(NORMAL|LOW|BORDERLINE|HIGH|CRITICAL)\]\s+(.+)$/);
            if (match) {
              return (
                <span className="inline-block mt-3 first:mt-0">
                  <StatusBadge status={match[1]} />
                  <span className="font-bold text-gray-900">{match[2]}</span>
                </span>
              );
            }
            return <strong className="font-semibold text-gray-900">{children}</strong>;
          },
          hr: () => <hr className="my-4 border-gray-200" />,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
