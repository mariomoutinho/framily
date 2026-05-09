import { Card, CardContent } from '@/components/ui/card';

export interface RankingEntry {
  position: number;
  name: string;
  points: number;
}

interface RankingTableProps {
  entries: RankingEntry[];
}

export function RankingTable({ entries }: RankingTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        {entries.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Ainda sem ranking — comece concluindo tarefas!
          </div>
        ) : (
          <ul className="divide-y">
            {entries.map((entry) => (
              <li key={entry.position} className="flex items-center gap-3 px-4 py-3">
                <span className="w-6 text-center text-sm font-bold tabular-nums text-muted-foreground">
                  {entry.position}º
                </span>
                <span className="flex-1 text-sm">{entry.name}</span>
                <span className="text-sm font-semibold tabular-nums">{entry.points} pts</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
