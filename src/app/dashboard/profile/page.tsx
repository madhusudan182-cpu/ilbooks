"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockUsers } from "@/lib/data";
import { MapPin, Bot, BookOpen, Loader2 } from "lucide-react";
import { getPersonalizedBookRecommendations, PersonalizedBookRecommendationsOutput } from "@/ai/flows/personalized-book-recommendations";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const user = mockUsers[0];
  const [recommendations, setRecommendations] = useState<PersonalizedBookRecommendationsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGetRecommendations = async () => {
    setIsLoading(true);
    setRecommendations(null);
    try {
      const result = await getPersonalizedBookRecommendations({
        readingLevel: `Level: ${user.level}`,
        interests: user.hobbies.join(', '),
        pastActivity: "Read 'One Hundred Years of Solitude', 'Dune'.",
      });
      setRecommendations(result);
    } catch (error) {
      console.error("Failed to get recommendations:", error);
      toast({
        title: "Error",
        description: "Could not fetch book recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      <Card>
        <CardContent className="p-6 flex flex-col md:flex-row items-start gap-6">
          <Avatar className="w-24 h-24 border-4 border-card">
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <div className="flex items-baseline gap-4">
              <h1 className="text-3xl font-bold font-headline">{user.name}</h1>
              <Badge className="text-sm">Level: {user.level}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">{user.institution}</p>
            <div className="flex items-center text-muted-foreground text-sm mt-2">
              <MapPin className="w-4 h-4 mr-2" />
              <span>{user.location}</span>
            </div>
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Hobbies</h3>
              <div className="flex flex-wrap gap-2">
                {user.hobbies.map((hobby) => (
                  <Badge key={hobby} variant="secondary">{hobby}</Badge>
                ))}
              </div>
            </div>
          </div>
          <Button>Edit Profile</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary"/>
            AI Book Recommendations
          </CardTitle>
          <CardDescription>
            Get personalized book recommendations based on your profile and reading history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!recommendations && !isLoading && (
            <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                <p className="mb-4 text-muted-foreground">Click the button to generate your reading list!</p>
                <Button onClick={handleGetRecommendations}>
                    <Bot className="mr-2 h-4 w-4" />
                    Get Recommendations
                </Button>
            </div>
          )}
           {isLoading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-4">Our AI is curating your list...</p>
            </div>
          )}
          {recommendations && (
             <div>
                <ul className="space-y-3 list-inside">
                {recommendations.bookRecommendations.map((book, index) => (
                    <li key={index} className="flex items-start">
                        <BookOpen className="w-5 h-5 mr-3 mt-1 text-accent flex-shrink-0" />
                        <span>{book}</span>
                    </li>
                ))}
                </ul>
                <Button onClick={handleGetRecommendations} variant="outline" className="mt-6">
                    <Bot className="mr-2 h-4 w-4" />
                    Regenerate
                </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
