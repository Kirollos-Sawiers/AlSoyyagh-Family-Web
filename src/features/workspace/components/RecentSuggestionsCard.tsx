export interface SuggestionItem {
  id: string
  type: string // "Add" | "Edit"
  name: string
  requester: string
  status: string // "Approved" | "Pending" | "Rejected"
}

interface RecentSuggestionsCardProps {
  items?: SuggestionItem[]
}

export function RecentSuggestionsCard({ items = [] }: RecentSuggestionsCardProps) {
  return (
    <section className="bg-[#f5f0e8] rounded-2xl shadow-sm border border-[#e2d9c8] p-6 sm:p-8 transition-all">
      <h2
        className="text-xl sm:text-2xl font-bold mb-4 text-[#1c1a17]"
        style={{ fontFamily: "'Fraunces', Georgia, serif" }}
      >
        Recent suggestions
      </h2>

      {items.length === 0 ? (
        <p
          className="text-xs text-[#8a7f6e]"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          No suggestions yet.
        </p>
      ) : (
      <div className="divide-y divide-[#e6ded0]">
        {items.map((item) => (
          <div
            key={item.id}
            className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 first:pt-0 last:pb-0"
          >
            <div className="text-xs text-[#1c1a17]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <span className="font-semibold text-[#1c1a17]">
                {item.type} - {item.name}
              </span>{' '}
              <span className="text-[#8a7f6e]">by {item.requester}</span>
            </div>
            <div
              className={`text-xs font-medium italic shrink-0 ${
                item.status === 'Rejected'
                  ? 'text-[#a5493d]'
                  : item.status === 'Pending'
                    ? 'text-[#a07840]'
                    : 'text-[#7d8b6c]'
              }`}
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {item.status}
            </div>
          </div>
        ))}
      </div>
      )}
    </section>
  )
}
