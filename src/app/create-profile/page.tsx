'use client';

import { useState, useRef, useEffect } from "react";
import Link from "next/link"
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2 } from "lucide-react"
import { thanasByDistrict } from "@/lib/location-data";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const districts = Object.keys(thanasByDistrict);

const hobbiesList = [
  "Reading", "Writing", "Poetry", "History", "Science Fiction", 
  "Fantasy", "Philosophy", "Art", "Travel", "Cooking", 
  "Gardening", "Gaming", "Music", "Movies", "Sports"
];

export default function CreateProfilePage() {
  const { user, loading: authLoading } = useUser();
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedThana, setSelectedThana] = useState("");
  const [thanas, setThanas] = useState<string[]>([]);
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [profession, setProfession] = useState("");
  const [institution, setInstitution] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    setThanas(thanasByDistrict[district] || []);
    setSelectedThana("");
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 800000) {
        toast({
            variant: "destructive",
            title: "File too large",
            description: "Please select an image smaller than 800KB.",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setAvatarUrl(loadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) return;

    setIsSaving(true);
    try {
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        profession,
        level: "0.0",
        institution,
        district: selectedDistrict,
        thana: selectedThana,
        location: selectedThana && selectedDistrict ? `${selectedThana}, ${selectedDistrict}, Bangladesh` : "",
        hobbies: selectedHobbies,
        avatarUrl: avatarUrl || `https://picsum.photos/seed/${user.uid}/100/100`,
      });

      toast({ title: "Profile created successfully!" });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>;

  return (
    <main className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="items-center text-center">
          <div className="relative mb-4">
            <input type="file" accept="image/*" className="hidden" ref={avatarInputRef} onChange={handleAvatarChange} />
            <Avatar className="h-24 w-24 border-4 border-muted">
              <AvatarImage src={avatarUrl} alt="Profile picture" />
              <AvatarFallback className="text-muted-foreground">
                <Camera className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <Button size="icon" variant="outline" className="absolute bottom-0 right-0 h-8 w-8 rounded-full" onClick={() => avatarInputRef.current?.click()}>
              <Camera className="h-4 w-4" />
              <span className="sr-only">Upload Picture</span>
            </Button>
          </div>
          <CardTitle className="text-3xl font-headline">Create Your Profile</CardTitle>
          <CardDescription>Tell us a bit about yourself to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6" onSubmit={handleSaveProfile}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="profession">Profession</Label>
                <Select value={profession} onValueChange={setProfession}>
                  <SelectTrigger id="profession">
                    <SelectValue placeholder="Select your profession" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="job-holder">Job Holder</SelectItem>
                    <SelectItem value="jobless">Jobless</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="institution">Current or Last Educational Institution</Label>
                <Input id="institution" placeholder="e.g., University of Dhaka" value={institution} onChange={(e) => setInstitution(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="grid gap-2">
                <Label htmlFor="district">District</Label>
                <Select value={selectedDistrict} onValueChange={handleDistrictChange}>
                  <SelectTrigger id="district">
                    <SelectValue placeholder="Select your district" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map(district => (
                      <SelectItem key={district} value={district} className="capitalize">{district.charAt(0).toUpperCase() + district.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
               <div className="grid gap-2">
                <Label htmlFor="thana">Thana</Label>
                <Select disabled={!selectedDistrict} value={selectedThana} onValueChange={setSelectedThana}>
                    <SelectTrigger id="thana">
                        <SelectValue placeholder="Select your thana" />
                    </SelectTrigger>
                    <SelectContent>
                        {thanas.map(thana => (
                            <SelectItem key={thana} value={thana}>{thana}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Hobbies</Label>
               <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                        {selectedHobbies.length > 0 ? `${selectedHobbies.length} hobbies selected` : "Select your hobbies"}
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                        <ScrollArea className="h-60">
                            {hobbiesList.map((hobby) => (
                                <DropdownMenuCheckboxItem
                                    key={hobby}
                                    checked={selectedHobbies.includes(hobby)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setSelectedHobbies((prev) => [...prev, hobby]);
                                        } else {
                                            setSelectedHobbies((prev) => prev.filter((h) => h !== hobby));
                                        }
                                    }}
                                >
                                {hobby}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </ScrollArea>
                    </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex flex-wrap gap-1 mt-1">
                    {selectedHobbies.map(hobby => <Badge key={hobby} variant="secondary">{hobby}</Badge>)}
                </div>
              <p className="text-sm text-muted-foreground">
                This will help us recommend books you'll love.
              </p>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="outline" asChild><Link href="/dashboard">Skip</Link></Button>
                <Button type="submit" className="font-headline" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Profile
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
