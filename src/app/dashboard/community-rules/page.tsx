'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, ShieldAlert, Heart, Users, MessageSquare, Scale, HelpCircle, ArrowLeft } from 'lucide-react';

export default function CommunityRulesPage() {
  const router = useRouter();

  const rules = [
    {
      icon: <BookOpen className="h-5 w-5 text-purple-600" />, 
      title: "Respect Diverse Reading Perspectives",
      desc: "Every bookworm has a unique taste in books and literature. Avoid insulting or mocking anyone's reading choices, text reviews, or quiz scores. Constructive discussions are always encouraged!"
    },
    {
      icon: <MessageSquare className="h-5 w-5 text-blue-600" />, 
      title: "No Spoilers and Exam Malpractice",
      desc: "Do not post huge plot spoilers without warning tags in public feeds or groups. Sharing exam answers or leaked content before the official evaluation is strictly prohibited."
    },
    {
      icon: <Users className="h-5 w-5 text-green-600" />, 
      title: "Fair Book Trade and Marketplace Honesty",
      desc: "When listing items in the Book Shop section or trading with other Patron members, provide accurate details about the book's print edition, condition, and prices."
    },
    {
      icon: <Heart className="h-5 w-5 text-red-600" />, 
      title: "Be Supportive to New Members",
      desc: "ILBooks thrives on community bonding. Help lower-level users build up their daily reading streaks, share resources generously, and welcome everyone warmly."
    },
    {
      icon: <Scale className="h-5 w-5 text-indigo-600" />, 
      title: "Maintain Civil Behavior & Language",
      desc: "Keep user chats and public comments polite and professional. Avoid heated arguments, personal attacks, and aggressive tones across the web app."
    },
    {
      icon: <ShieldAlert className="h-5 w-5 text-amber-600" />, 
      title: "Zero Tolerance for Bullying and Hate Speech",
      desc: "Cyber-bullying, harassment, spam links, or inappropriate profile setups will result in an immediate temporary suspension or user level downgrade by the Admin team."
    },
    {
      icon: <HelpCircle className="h-5 w-5 text-teal-600" />, 
      title: "Report Violations Safely",
      desc: "If you notice anyone disregarding community guidelines, please use the 'Complain' form from the navigation menu immediately rather than engaging in a public dispute."
    }
  ];

  return (
    <div className="w-full bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 text-black">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10 relative">
        
        {/* উপরের প্রফেশনাল ব্যাক বাটন */}
        <button 
          onClick={() => router.back()} 
          className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200/60 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        {/* Title / Heading Section */}
        <div className="text-center border-b border-gray-100 pb-6 mb-8 mt-6 md:mt-4">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
            📜 Community Rules
          </h1>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Welcome to the home of bibliophiles! Help us maintain ILBooks as a secure, friendly, and empowering environment for all book lovers.
          </p>
        </div>

        {/* Rules Layout Loop */}
        <div className="space-y-6">
          {rules.map((rule, idx) => (
            <div key={idx} className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-slate-50/20 hover:bg-slate-50/60 transition-all duration-200">
              <div className="flex-shrink-0 mt-0.5 bg-white p-2 rounded-lg shadow-sm border border-gray-100 h-10 w-10 flex items-center justify-center">
                {rule.icon}
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800 mb-1">
                  {idx + 1}. {rule.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {rule.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* নিচের সুন্দর ব্যাক বাটন এবং ফুটার */}
        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back to Dashboard</span>
          </button>
          
          <div className="text-xs text-slate-400 mt-2">
            Thank you for keeping ILBooks wonderful. Happy Reading, Bookworm! 📖
          </div>
        </div>

      </div>
    </div>
  );
}
