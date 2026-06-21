import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LevelsPage() {
  const levelGroups: { [key: number]: string[] } = {};

  for (let i = 0; i <= 19; i++) {
    if (i === 1) continue; // Skip level 1.x as per user request
    if (!levelGroups[i]) {
      levelGroups[i] = [];
    }
    for (let j = 0; j <= 9; j++) {
      const level = `${i}.${j}`;
      levelGroups[i].push(level);
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold font-headline">Competition Levels</h1>
        <p className="text-muted-foreground mt-2">The path of your reading journey.</p>
      </div>

      <div className="space-y-6">
        {Object.keys(levelGroups).map(groupKey => {
            const groupNum = parseInt(groupKey, 10);
            return (
                 <Card key={groupNum}>
                    <CardHeader>
                        <CardTitle>Level: {groupNum}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        {levelGroups[groupNum].map(level => (
                            <Badge key={level} variant="secondary" className="text-base font-mono">{level}</Badge>
                        ))}
                    </CardContent>
                </Card>
            )
        })}
      </div>
    </div>
  );
}
