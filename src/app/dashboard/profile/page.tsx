'use client';

import { useState, useRef, useEffect, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Camera, Save, X, Loader2 } from "lucide-react";
import type { User } from "@/lib/types";
import { thanasByDistrict } from "@/lib/location-data";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const districts = Object.keys(thanasByDistrict);
const hobbiesList = [
  "Reading", "Writing", "Poetry", "History", "Science Fiction", 
  "Fantasy", "Philosophy", "Art", "Travel", "Cooking", 
  "Gardening", "Gaming", "Music", "Movies", "Sports"
];

export default function ProfilePage() {
  const { user, loading: authLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const userRef = useMemo(() => (user && firestore ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: profile, loading: profileLoading } = useDoc<User>(userRef);

  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<User>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Initialize form state only when not editing or when profile first loads
  useEffect(() => {
    if (profile && !isEditing) {
      setEditedProfile(profile);
    }
  }, [profile, isEditing]);

  const selectedDistrict = (editedProfile as any).district || "";
  const thanas = thanasByDistrict[selectedDistrict] || [];

  const handleDistrictChange = (district: string) => {
    setEditedProfile(prev => ({ ...prev, district, thana: "" }));
  };

  const handleProfileChange = (field: keyof User, value: any) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Basic size check for Firestore base64 storage (limit 1MB)
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
        handleProfileChange('avatarUrl', loadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) return;

    setIsSaving(true);
    try {
      const docRef = doc(firestore, 'users', user.uid);
      const updateData = {
        name: editedProfile.name || "",
        institution: editedProfile.institution || "",
        district: editedProfile.district || "",
        thana: editedProfile.thana || "",
        location: editedProfile.thana && editedProfile.district 
            ? `${editedProfile.thana}, ${editedProfile.district}, Bangladesh` 
            : (editedProfile.location || ""),
        hobbies: editedProfile.hobbies || [],
        avatarUrl: editedProfile.avatarUrl || "",
      };

      await updateDoc(docRef, updateData);

      toast({ title: "Profile updated successfully!" });
      setIsEditing(false);
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

  const handleCancel = () => {
    if (profile) setEditedProfile(profile);
    setIsEditing(false);
  };

  if (authLoading || profileLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!profile) return null;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      <Card>
        <CardContent className="p-6">
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex flex-col md:flex-row items-start gap-6">
                 <div className="relative w-24 h-24 flex-shrink-0">
                    <input type="file" accept="image/*" className="hidden" ref={avatarInputRef} onChange={handleAvatarChange} />
                    <Avatar className="w-24 h-24 border-4 border-card">
                        <AvatarImage src={editedProfile.avatarUrl} />
                        <AvatarFallback>{editedProfile.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Button type="button" size="icon" variant="outline" className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full" onClick={() => avatarInputRef.current?.click()}>
                        <Camera className="h-4 w-4" />
                        <span className="sr-only">Upload Picture</span>
                    </Button>
                </div>
                <div className="grid gap-2 w-full">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={editedProfile.name || ""} onChange={(e) => handleProfileChange('name', e.target.value)} />
                </div>
              </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="institution">Institution</Label>
                        <Input id="institution" value={editedProfile.institution || ""} onChange={(e) => handleProfileChange('institution', e.target.value)} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="district">District</Label>
                        <Select onValueChange={handleDistrictChange} value={editedProfile.district || ""}>
                        <SelectTrigger id="district">
                            <SelectValue placeholder="Select your district" />
                        </SelectTrigger>
                        <SelectContent>
                            {districts.map(district => (
                            <SelectItem key={district} value={district} className="capitalize">{district}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="thana">Thana</Label>
                        <Select disabled={!editedProfile.district} value={editedProfile.thana || ""} onValueChange={(val) => handleProfileChange('thana', val)}>
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
                            {editedProfile.hobbies?.length ? `${editedProfile.hobbies.length} hobbies selected` : "Select your hobbies"}
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                            <ScrollArea className="h-60">
                                {hobbiesList.map((hobby) => (
                                    <DropdownMenuCheckboxItem
                                        key={hobby}
                                        checked={editedProfile.hobbies?.includes(hobby)}
                                        onCheckedChange={(checked) => {
                                            const currentHobbies = editedProfile.hobbies || [];
                                            const newHobbies = checked 
                                                ? [...currentHobbies, hobby]
                                                : currentHobbies.filter((h) => h !== hobby);
                                            handleProfileChange('hobbies', newHobbies);
                                        }}
                                    >
                                    {hobby}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </ScrollArea>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="flex flex-wrap gap-1 mt-1">
                        {editedProfile.hobbies?.map(hobby => <Badge key={hobby} variant="secondary">{hobby}</Badge>)}
                    </div>
                </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}><X className="mr-2 h-4 w-4" />Cancel</Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar className="w-24 h-24 border-4 border-card">
                <AvatarImage src={profile.avatarUrl} />
                <AvatarFallback>{profile.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-grow">
                <div className="flex items-baseline gap-4">
                  <h1 className="text-3xl font-bold font-headline">{profile.name}</h1>
                  <Badge className="text-sm">Level: {profile.level?.toFixed(1) || "0.0"}</Badge>
                </div>
                <p className="text-muted-foreground mt-1">{profile.institution}</p>
                <div className="flex items-center text-muted-foreground text-sm mt-2">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{profile.location || "Location not set"}</span>
                </div>
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Hobbies</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.hobbies?.map((hobby) => (
                      <Badge key={hobby} variant="secondary">{hobby}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
