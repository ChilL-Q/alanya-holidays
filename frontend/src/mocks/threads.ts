
export const trendingThreads: CategoryThread[] = [
  {
    id: "t1",
    title: "What surprised you most about Alanya?",
    category: "Travel & Vacation",
    categoryId: "travel-vacation",
    author: "Sarah_Wanders",
    authorAvatar: "/images/placeholder-business.svg",
    replies: 142,
    views: 3847,
    likes: 89,
    postedAt: "2 hours ago",
    isHot: true,
    excerpt:
      "I have been traveling for 10 years and nothing prepared me for the kindness of locals here...",
  },
  {
    id: "t2",
    title: "Best Turkish breakfast in Alanya?",
    category: "Food & Nightlife",
    categoryId: "food-nightlife",
    author: "FoodieNomad",
    authorAvatar: "/images/placeholder-business.svg",
    replies: 89,
    views: 2156,
    likes: 67,
    postedAt: "4 hours ago",
    isHot: true,
    excerpt:
      "After trying 15 different places, here is my definitive ranking of the best breakfast spots...",
  },
  {
    id: "t3",
    title: "Is Alanya expensive in 2026?",
    category: "Travel & Vacation",
    categoryId: "travel-vacation",
    author: "BudgetExplorer",
    authorAvatar: "/images/placeholder-business.svg",
    replies: 234,
    views: 5621,
    likes: 156,
    postedAt: "6 hours ago",
    isHot: true,
    excerpt:
      "I just spent a month here and tracked every single expense. Here is the complete breakdown...",
  },
  {
    id: "t4",
    title: "Can foreigners still get residence permits?",
    category: "Expats & Digital Nomads",
    categoryId: "expats-nomads",
    author: "ExpatInAlanya",
    authorAvatar: "/images/placeholder-business.svg",
    replies: 178,
    views: 4321,
    likes: 112,
    postedAt: "8 hours ago",
    isHot: true,
    excerpt:
      "The rules changed again in January 2026. I went through the process last week and here is everything...",
  },
  {
    id: "t5",
    title: "Best beach in Alanya?",
    category: "Beaches & Nature",
    categoryId: "beaches-nature",
    author: "BeachLover123",
    authorAvatar: "/images/placeholder-business.svg",
    replies: 156,
    views: 3890,
    likes: 98,
    postedAt: "12 hours ago",
    isHot: false,
    excerpt:
      "Cleopatra is famous but crowded. Let me tell you about the hidden gems locals actually visit...",
  },
  {
    id: "t6",
    title: "Monthly cost of living in Alanya?",
    category: "Expats & Digital Nomads",
    categoryId: "expats-nomads",
    author: "DigitalNomad_Life",
    authorAvatar: "/images/placeholder-business.svg",
    replies: 201,
    views: 4987,
    likes: 134,
    postedAt: "14 hours ago",
    isHot: true,
    excerpt:
      "I have been living here for 8 months as a digital nomad. Here is my complete monthly budget...",
  },
  {
    id: "t7",
    title: "Top 10 things to do in Alanya",
    category: "Things to Do",
    categoryId: "things-to-do",
    author: "AlanyaGuide",
    authorAvatar: "/images/placeholder-business.svg",
    replies: 67,
    views: 1876,
    likes: 45,
    postedAt: "16 hours ago",
    isHot: false,
    excerpt:
      "After guiding tourists here for 15 years, these are the activities that always leave the biggest impression...",
  },
  {
    id: "t8",
    title: "Is Alanya still a good investment?",
    category: "Real Estate & Investment",
    categoryId: "real-estate",
    author: "PropertyInvestor",
    authorAvatar: "/images/placeholder-business.svg",
    replies: 123,
    views: 3210,
    likes: 78,
    postedAt: "18 hours ago",
    isHot: false,
    excerpt:
      "I have invested in 5 properties here over the last 7 years. Let me share the real numbers and trends...",
  },
];

export interface CategoryThread {
  id: string;
  title: string;
  category: string;
  categoryId: string;
  author: string;
  authorAvatar: string;
  replies: number;
  views: number;
  likes: number;
  postedAt: string;
  isHot: boolean;
  isPinned?: boolean;
  isVerified?: boolean;
  excerpt: string;
  subcategory?: string;
}