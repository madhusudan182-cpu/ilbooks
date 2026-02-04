import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bell, UserPlus, Heart, Gift } from "lucide-react";

const notifications = [
    {
        icon: UserPlus,
        title: "New Follower",
        description: "Ben Carter started following you.",
        time: "5m ago",
    },
    {
        icon: Heart,
        title: "Post Activity",
        description: "Your post 'Just finished One Hundred Years of Solitude...' received 10 new likes.",
        time: "1h ago"
    },
    {
        icon: Gift,
        title: "New Books!",
        description: "New arrivals are in the Book Shop. Check them out!",
        time: "1d ago"
    },
    {
        icon: UserPlus,
        title: "New Follower",
        description: "Cathy Liu started following you.",
        time: "2d ago",
    }
]

export default function NoticeBoardPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-3xl font-headline">
            <Bell className="w-8 h-8 text-primary" />
            All Notifications
          </CardTitle>
          <CardDescription>
            Here is a list of your recent activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification, index) => (
                <div key={index} className="flex items-start gap-4 p-4 border-b last:border-b-0">
                  <div className="bg-muted p-2 rounded-full">
                     <notification.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">{notification.description}</p>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">{notification.time}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
                You have no new notifications.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
