import type { User, Post, Book, ExamResult, Transaction, PrizeWinner, SignUpData, TopUser, TopPatron } from './types';

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Alia Rahman',
    avatarUrl: 'https://picsum.photos/seed/av1/100/100',
    level: 0.1,
    institution: 'University of Dhaka',
    location: 'Dhaka, Bangladesh',
    hobbies: ['Classic Literature', 'Poetry', 'History'],
    isFollowing: true,
    isMutual: true,
    isAdmin: true,
  },
  {
    id: 'user-2',
    name: 'Ben Carter',
    avatarUrl: 'https://picsum.photos/seed/av2/100/100',
    level: 1.5,
    institution: 'BRAC University',
    location: 'Chittagong, Bangladesh',
    hobbies: ['Science Fiction', 'Fantasy', 'Gaming'],
    isFollowing: true,
    isMutual: false,
  },
  {
    id: 'user-3',
    name: 'Cathy Liu',
    avatarUrl: 'https://picsum.photos/seed/av3/100/100',
    level: 3.0,
    institution: 'Independent Scholar',
    location: 'Sylhet, Bangladesh',
    hobbies: ['Philosophy', 'Art', 'Travel'],
    isFollowing: false,
    isMutual: false,
  },
    {
    id: 'user-4',
    name: 'David Hasan',
    avatarUrl: 'https://picsum.photos/seed/av4/100/100',
    level: 0.5,
    institution: 'Notre Dame College',
    location: 'Dhaka, Bangladesh',
    hobbies: ['Comics', 'Manga', 'Movies'],
    isFollowing: true,
    isMutual: true,
  },
  {
    id: 'user-5',
    name: 'Paban Alam',
    avatarUrl: 'https://picsum.photos/seed/av5/100/100',
    level: 0.0,
    institution: 'New Learner',
    location: 'Dhaka, Bangladesh',
    hobbies: ['Reading', 'Learning'],
    isFollowing: false,
    isMutual: false,
    isAdmin: false,
  },
];

export const mockPosts: Post[] = [
  {
    id: 'post-1',
    author: mockUsers[0],
    content: "Just finished 'One Hundred Years of Solitude' again. Every read reveals a new layer of magic. What a masterpiece! What are your thoughts on magical realism?",
    imageUrl: 'https://picsum.photos/seed/pi1/800/400',
    likes: 125,
    comments: 42,
    shares: 18,
    createdAt: '2h ago',
  },
  {
    id: 'post-2',
    author: mockUsers[1],
    content: "Excited to start the 'Dune' series! I've heard so much about it. Any tips for a first-time reader? No spoilers, please!",
    likes: 78,
    comments: 15,
    shares: 5,
    createdAt: 'Yesterday',
  },
  {
    id: 'post-3',
    author: mockUsers[2],
    content: 'Exploring the connection between Stoic philosophy and modern mindfulness. It is fascinating how ancient wisdom remains so relevant today.',
    imageUrl: 'https://picsum.photos/seed/pi2/800/400',
    likes: 210,
    comments: 65,
    shares: 33,
    createdAt: '3 days ago',
  },
];

// This mock data is no longer used for the main application logic.
// Book data is now fetched from and managed in Firestore.
// You can use the admin panel to add/edit books.
export const mockBooks: Book[] = [];

export const mockExamResults: ExamResult[] = [
  {
    id: 'result-1',
    userId: 'user-2',
    userName: 'Ben Carter',
    userAvatarUrl: 'https://picsum.photos/seed/av2/100/100',
    level: '1.5',
    totalMarks: 20,
    totalObtainedMarks: 15,
    totalPercentage: 75,
    overallStatus: 'Passed',
    subjects: [
      { subject: 'Bengali', totalMarks: 10, obtainedMarks: 8, percentage: 80, status: 'Passed' },
      { subject: 'English', totalMarks: 10, obtainedMarks: 7, percentage: 70, status: 'Passed' },
    ],
    examDate: '2024-07-22',
  },
  {
    id: 'result-2',
    userId: 'user-4',
    userName: 'David Hasan',
    userAvatarUrl: 'https://picsum.photos/seed/av4/100/100',
    level: '0.5',
    totalMarks: 30,
    totalObtainedMarks: 17,
    totalPercentage: 56.67,
    overallStatus: 'Failed',
    subjects: [
        { subject: 'Bengali', totalMarks: 15, obtainedMarks: 10, percentage: 66.67, status: 'Passed' },
        { subject: 'English', totalMarks: 15, obtainedMarks: 7, percentage: 46.67, status: 'Failed' },
    ],
    examDate: '2024-07-21',
  },
    {
    id: 'result-3',
    userId: 'user-3',
    userName: 'Cathy Liu',
    userAvatarUrl: 'https://picsum.photos/seed/av3/100/100',
    level: '3.0',
    totalMarks: 25,
    totalObtainedMarks: 22,
    totalPercentage: 88,
    overallStatus: 'Passed',
    subjects: [
        { subject: 'Bengali', totalMarks: 15, obtainedMarks: 13, percentage: 86.67, status: 'Passed' },
        { subject: 'English', totalMarks: 10, obtainedMarks: 9, percentage: 90, status: 'Passed' },
    ],
    examDate: '2024-07-19',
  },
  {
    id: 'result-4',
    userId: 'user-1',
    userName: 'Alia Rahman',
    userAvatarUrl: 'https://picsum.photos/seed/av1/100/100',
    level: '2.0',
    totalMarks: 20,
    totalObtainedMarks: 18,
    totalPercentage: 90,
    overallStatus: 'Passed',
    subjects: [
      { subject: 'Bengali', totalMarks: 10, obtainedMarks: 9, percentage: 90, status: 'Passed' },
      { subject: 'English', totalMarks: 10, obtainedMarks: 9, percentage: 90, status: 'Passed' },
    ],
    examDate: '2024-07-25',
  },
  {
    id: 'result-5',
    userId: 'user-1',
    userName: 'Alia Rahman',
    userAvatarUrl: 'https://picsum.photos/seed/av1/100/100',
    level: '1.9',
    totalMarks: 20,
    totalObtainedMarks: 11,
    totalPercentage: 55,
    overallStatus: 'Failed',
    subjects: [
      { subject: 'Bengali', totalMarks: 10, obtainedMarks: 6, percentage: 60, status: 'Passed' },
      { subject: 'English', totalMarks: 10, obtainedMarks: 5, percentage: 50, status: 'Failed' },
    ],
    examDate: '2024-07-20',
  },
  {
    id: 'result-6',
    userId: 'user-5',
    userName: 'Paban Alam',
    userAvatarUrl: 'https://picsum.photos/seed/av5/100/100',
    level: '0.0',
    totalMarks: 60,
    totalObtainedMarks: 45,
    totalPercentage: 75,
    overallStatus: 'Passed',
    subjects: [
      { subject: 'Bengali', totalMarks: 30, obtainedMarks: 20, percentage: 66.67, status: 'Passed' },
      { subject: 'English', totalMarks: 30, obtainedMarks: 25, percentage: 83.33, status: 'Passed' },
    ],
    examDate: '2024-07-28',
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: 'txn-1',
    date: '2024-07-22',
    type: 'Exam Fee',
    amount: 20,
    userId: 'user-2',
    userName: 'Ben Carter',
    status: 'Completed'
  },
  {
    id: 'txn-2',
    date: '2024-07-22',
    type: 'Book Shop',
    amount: 800,
    userId: 'user-3',
    userName: 'Cathy Liu',
    status: 'Completed'
  },
  {
    id: 'txn-3',
    date: '2024-07-21',
    type: 'Patronage',
    amount: 1000,
    userId: 'user-1',
    userName: 'Alia Rahman',
    status: 'Completed'
  },
  {
    id: 'txn-4',
    date: '2024-07-19',
    type: 'Exam Fee',
    amount: 20,
    userId: 'user-4',
    userName: 'David Hasan',
    status: 'Completed'
  },
];

export const mockPrizeWinners: PrizeWinner[] = [
  {
    id: 'prize-1',
    userId: 'user-3',
    userName: 'Cathy Liu',
    userAvatarUrl: 'https://picsum.photos/seed/av3/100/100',
    level: '3.0',
    prize: 'BDT 500 Book Coupon',
    status: 'Pending',
  },
  {
    id: 'prize-2',
    userId: 'user-1',
    userName: 'Alia Rahman',
    userAvatarUrl: 'https://picsum.photos/seed/av1/100/100',
    level: '2.1',
    prize: 'BDT 250 Book Coupon',
    status: 'Awarded',
    dateAwarded: '2024-07-23'
  },
];

export const mockSignUpData: Record<'day' | 'week' | 'month' | 'lifetime', SignUpData[]> = {
  day: [{ name: 'Today', total: 15 }],
  week: [
    { name: 'Mon', total: 5 },
    { name: 'Tue', total: 8 },
    { name: 'Wed', total: 12 },
    { name: 'Thu', total: 7 },
    { name: 'Fri', total: 15 },
    { name: 'Sat', total: 25 },
    { name: 'Sun', total: 20 },
  ],
  month: [
    { name: 'Week 1', total: 50 },
    { name: 'Week 2', total: 75 },
    { name: 'Week 3', total: 60 },
    { name: 'Week 4', total: 90 },
  ],
  lifetime: [
     { name: 'Jan', total: 120 },
     { name: 'Feb', total: 200 },
     { name: 'Mar', total: 150 },
     { name: 'Apr', total: 250 },
     { name: 'May', total: 300 },
     { name: 'Jun', total: 450 },
  ]
};

export const mockTopUsers: TopUser[] = [
    { id: 'user-3', name: 'Cathy Liu', avatarUrl: 'https://picsum.photos/seed/av3/100/100', level: 3.0, progress: 5 },
    { id: 'user-1', name: 'Alia Rahman', avatarUrl: 'https://picsum.photos/seed/av1/100/100', level: 2.1, progress: 3 },
    { id: 'user-2', name: 'Ben Carter', avatarUrl: 'https://picsum.photos/seed/av2/100/100', level: 1.5, progress: 2 },
    { id: 'user-4', name: 'David Hasan', avatarUrl: 'https://picsum.photos/seed/av4/100/100', level: 0.5, progress: 1 },
];

export const mockTopPatrons: TopPatron[] = [
    { id: 'user-1', name: 'Alia Rahman', avatarUrl: 'https://picsum.photos/seed/av1/100/100', totalDonation: 1000, donationCount: 1 },
    { id: 'user-2', name: 'Ben Carter', avatarUrl: 'https://picsum.photos/seed/av2/100/100', totalDonation: 500, donationCount: 3 },
];
