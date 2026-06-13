import type { LucideIcon } from "lucide-react";
import type { Timestamp } from 'firebase/firestore';

export type User = {
  id: string;
  name: string;
  avatarUrl: string;
  level: number;
  institution: string;
  location: string;
  hobbies: string[];
  isFollowing: boolean;
  isMutual: boolean;
  isAdmin?: boolean;
  district?: string;
  thana?: string;
};

export type Post = {
  id: string;
  author: User;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
};

export type Book = {
  id:string;
  title: string;
  author: string;
  price: number;
  coverUrl: string;
  pdfUrl?: string;
  level: string;
  category?: 'vocab_grammar' | 'popular';
};

export type OrderBook = {
    id: string;
    title: string;
    author: string;
    price: number;
    quantity: number;
}

export type Order = {
  id: string;
  userId: string;
  customerName: string;
  deliveryAddress: string;
  mobileNumber: string;
  books: OrderBook[];
  totalAmount: number;
  orderDate: Timestamp;
  status: 'Paid' | 'Shipped' | 'Delivered';
};

export type NavItem = {
  href: string;
  title: string;
  icon: LucideIcon;
  label?: string;
};

export type Answer = {
  text: string;
  isCorrect: boolean;
};

export type Question = {
  id: string;
  level: string;
  subject: 'Bengali' | 'English';
  questionText: string;
  answers: Answer[];
};

export type SyllabusTopic = {
  marks: number;
  topics: string[];
};

export type Syllabus = {
  level: string;
  subjects: {
    [subjectName: string]: SyllabusTopic;
  };
};

export type SubjectResult = {
  subject: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  status: 'Passed' | 'Failed';
};

export type ExamResult = {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl: string;
  level: string;
  totalMarks: number;
  totalObtainedMarks: number;
  totalPercentage: number;
  overallStatus: 'Passed' | 'Failed';
  subjects: SubjectResult[];
  examDate: string;
};

export type Transaction = {
  id: string;
  date: string;
  type: 'Exam Fee' | 'Book Shop' | 'Patronage';
  amount: number;
  userId: string;
  userName: string;
  status: 'Completed' | 'Pending' | 'Failed';
};

export type PrizeWinner = {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl: string;
  level: string;
  prize: string;
  status: 'Pending' | 'Awarded';
  dateAwarded?: string;
};

export type SignUpData = {
  name: string;
  total: number;
};

export type TopUser = {
  id: string;
  name: string;
  avatarUrl: string;
  level: number;
  progress: number;
};

export type TopPatron = {
  id: string;
  name: string;
  avatarUrl: string;
  totalDonation: number;
  donationCount: number;
};
