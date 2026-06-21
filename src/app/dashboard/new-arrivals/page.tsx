import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift } from "lucide-react";

export default function NewArrivalsPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-3xl font-headline">
            <Gift className="w-8 h-8 text-primary" />
            New Arrivals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Check back soon for the latest books added to our collection!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
