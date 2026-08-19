export interface ThreadReply {
  id: string;
  author: string;
  authorAvatar: string;
  authorRole: string;
  content: string;
  postedAt: string;
  likes: number;
  isLiked: boolean;
  isOriginalPoster?: boolean;
  parentId: string | null;
  replies: ThreadReply[];
}

export interface ThreadDetail {
  id: string;
  title: string;
  category: string;
  categoryId: string;
  subcategory: string;
  author: string;
  authorAvatar: string;
  authorRole: string;
  authorBio: string;
  authorPosts: number;
  authorReputation: number;
  authorJoinDate: string;
  authorLocation: string;
  authorBadges: string[];
  content: string;
  postedAt: string;
  views: number;
  likes: number;
  isLiked: boolean;
  isPinned: boolean;
  isHot: boolean;
  isVerified: boolean;
  replies: ThreadReply[];
  slug?: string;
}

export const threadDetails: Record<string, ThreadDetail> = {
  "t1": {
    id: "t1",
    title: "What surprised you most about Alanya?",
    category: "Travel & Vacation",
    categoryId: "travel-vacation",
    subcategory: "First Time Visiting Alanya",
    author: "Sarah_Wanders",
    authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20young%20woman%20with%20warm%20smile%20natural%20light%20clean%20background%20travel%20blogger%20style%20editorial%20photography&width=200&height=200&seq=avatar-sarah&orientation=squarish",
    authorRole: "Top Contributor",
    authorBio: "Full-time traveler, part-time storyteller. 42 countries and counting. Currently calling Alanya home for the winter.",
    authorPosts: 847,
    authorReputation: 9200,
    authorJoinDate: "March 2024",
    authorLocation: "Alanya, Türkiye",
    authorBadges: ["Top Contributor", "Travel Guide", "Content Creator"],
    content: "I have been traveling for 10 years and nothing prepared me for the kindness of locals here in Alanya.\n\nI arrived three weeks ago expecting beautiful beaches and good weather. What I didn't expect was the genuine warmth from complete strangers. Within my first 48 hours, a shopkeeper invited me for çay, a grandmother on the bus insisted on sharing her homemade börek, and my Airbnb host's son spent an entire afternoon showing me around the neighborhood.\n\nThe other huge surprise was how international this place is. I've met people from at least 15 different countries just hanging out at the beach cafés. There's this incredible mix of Turkish locals, Russian families, German retirees, Scandinavian digital nomads, and British expats.\n\nWhat really blew my mind though was the quality of life for the price. Coming from London, I'm spending maybe 40% of what I used to spend — and eating better, living steps from the sea, and feeling genuinely happier.\n\nWhat surprised YOU most? I'd love to hear other perspectives!",
    postedAt: "2 hours ago",
    views: 3847,
    likes: 89,
    isLiked: false,
    isPinned: true,
    isHot: true,
    isVerified: false,
    replies: [
      {
        id: "r1",
        author: "BudgetExplorer",
        authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20middle%20aged%20woman%20friendly%20smile%20natural%20light%20clean%20background%20budget%20traveler%20style%20editorial%20photography&width=100&height=100&seq=avatar-budget&orientation=squarish",
        authorRole: "Verified Local",
        content: "The food prices absolutely floored me. I'm eating restaurant-quality meals for what I used to pay for a sad sandwich in the UK. And the produce markets? Don't even get me started. 2 lira for a kilo of tomatoes that actually taste like tomatoes should taste.",
        postedAt: "1 hour ago",
        likes: 34,
        isLiked: false,
        parentId: null,
        replies: [
          {
            id: "r1a",
            author: "Sarah_Wanders",
            authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20young%20woman%20with%20warm%20smile%20natural%20light%20clean%20background%20travel%20blogger%20style%20editorial%20photography&width=100&height=100&seq=avatar-sarah&orientation=squarish",
            authorRole: "Top Contributor",
            content: "Right?! The farmer's market on Fridays is my happy place. I got a week's worth of fresh produce for under 100 TL and the vendor threw in free herbs because I was a foreigner trying to speak Turkish 😄",
            postedAt: "45 minutes ago",
            likes: 12,
            isLiked: false,
            isOriginalPoster: true,
            parentId: "r1",
            replies: []
          },
          {
            id: "r1b",
            author: "FoodieNomad",
            authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20young%20man%20with%20beard%20casual%20style%20warm%20light%20clean%20background%20travel%20enthusiast%20editorial%20photography&width=100&height=100&seq=avatar-foodie&orientation=squarish",
            authorRole: "Food Expert",
            content: "Which market is this? I've been going to the Tuesday one in Mahmutlar but I've heard the Friday one near the center is bigger.",
            postedAt: "30 minutes ago",
            likes: 5,
            isLiked: false,
            parentId: "r1",
            replies: [
              {
                id: "r1b1",
                author: "AlanyaLocal_Eats",
                authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20Turkish%20woman%20chef%20style%20warm%20light%20clean%20background%20food%20enthusiast%20editorial%20photography&width=100&height=100&seq=avatar-chef&orientation=squarish",
                authorRole: "Local Expert",
                content: "The Friday pazar near the center (close to the Atatürk statue) is THE one. Much bigger selection and better prices than Mahmutlar. Go early — by 1pm the best stuff is gone!",
                postedAt: "20 minutes ago",
                likes: 8,
                isLiked: false,
                parentId: "r1b",
                replies: []
              }
            ]
          }
        ]
      },
      {
        id: "r2",
        author: "DigitalNomad_Life",
        authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20young%20man%20with%20glasses%20creative%20look%20warm%20light%20clean%20background%20remote%20worker%20style%20editorial%20photography&width=100&height=100&seq=avatar-nomad&orientation=squarish",
        authorRole: "Community Leader",
        content: "Great post Sarah! I've been here 8 months now and I'm STILL discovering new things that surprise me. The biggest one for me was the expat community — I thought I'd be one of maybe 10 remote workers here, but there are literally hundreds of us. The coworking spaces are buzzing, there are WhatsApp groups for everything, and I've made better friends here in 8 months than I did in 3 years back home.\n\nAlso — cats. Nobody warned me about the cats. They own this city and I'm here for it 🐱",
        postedAt: "55 minutes ago",
        likes: 28,
        isLiked: false,
        parentId: null,
        replies: [
          {
            id: "r2a",
            author: "TechNomad",
            authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20tech%20savvy%20man%20with%20laptop%20warm%20light%20clean%20background%20IT%20professional%20editorial%20photography&width=100&height=100&seq=avatar-tech&orientation=squarish",
            authorRole: "Tech Expert",
            content: "Which coworking spaces do you recommend? I've been working from cafés but the wifi is hit or miss. Need something more reliable for video calls.",
            postedAt: "40 minutes ago",
            likes: 3,
            isLiked: false,
            parentId: "r2",
            replies: [
              {
                id: "r2a1",
                author: "DigitalNomad_Life",
                authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20young%20man%20with%20glasses%20creative%20look%20warm%20light%20clean%20background%20remote%20worker%20style%20editorial%20photography&width=100&height=100&seq=avatar-nomad&orientation=squarish",
                authorRole: "Community Leader",
                content: "Coworking Alanya near the harbor is probably the best — fiber internet, proper call booths, and a great community vibe. There's also NomadSpace in Oba which is smaller but cheaper. Both do day passes if you want to try before committing!",
                postedAt: "25 minutes ago",
                likes: 6,
                isLiked: false,
                parentId: "r2a",
                replies: []
              }
            ]
          }
        ]
      },
      {
        id: "r3",
        author: "ExpatInAlanya",
        authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20man%20in%20his%20thirties%20confident%20look%20warm%20light%20clean%20background%20professional%20style%20editorial%20photography&width=100&height=100&seq=avatar-expat&orientation=squarish",
        authorRole: "Verified Local",
        content: "What surprised me was how easy the bureaucracy actually was. Everyone online made it sound like a nightmare to get residency, open a bank account, etc. Maybe I got lucky but the whole process was surprisingly smooth. The key is having a Turkish friend help translate — that made all the difference.",
        postedAt: "50 minutes ago",
        likes: 22,
        isLiked: false,
        parentId: null,
        replies: []
      },
      {
        id: "r4",
        author: "BeachLover123",
        authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20young%20woman%20sun%20kissed%20look%20warm%20light%20clean%20background%20beach%20enthusiast%20style%20editorial%20photography&width=100&height=100&seq=avatar-beach&orientation=squarish",
        authorRole: "Rising Star",
        content: "The clean water surprised me the most! I was honestly expecting meh given how touristy some areas are. But Cleopatra Beach has some of the clearest water I've seen in the Mediterranean. And if you go even 15 minutes east towards Dim River, there are these tiny coves with absolutely zero crowds and crystal clear turquoise water. Paradise.",
        postedAt: "35 minutes ago",
        likes: 18,
        isLiked: false,
        parentId: null,
        replies: []
      },
      {
        id: "r5",
        author: "TurkishLocal_",
        authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20Turkish%20young%20woman%20warm%20friendly%20smile%20clean%20background%20cultural%20ambassador%20style%20editorial%20photography&width=100&height=100&seq=avatar-turkish&orientation=squarish",
        authorRole: "Cultural Ambassador",
        content: "As a local, reading these comments makes me so happy! We genuinely love sharing our culture and it warms my heart that visitors feel it. One thing I'd add — don't be shy about accepting dinner invitations. If a local invites you to their home, say YES. That's where the real magic happens. My mom still talks about the German couple we hosted for dinner three years ago 😊",
        postedAt: "25 minutes ago",
        likes: 31,
        isLiked: false,
        parentId: null,
        replies: []
      }
    ]
  },
  "tv1": {
    id: "tv1",
    title: "What surprised you most about Alanya?",
    category: "Travel & Vacation",
    categoryId: "travel-vacation",
    subcategory: "First Time Visiting Alanya",
    author: "Sarah_Wanders",
    authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20young%20woman%20with%20warm%20smile%20natural%20light%20clean%20background%20travel%20blogger%20style%20editorial%20photography&width=200&height=200&seq=avatar-sarah&orientation=squarish",
    authorRole: "Top Contributor",
    authorBio: "Full-time traveler, part-time storyteller. 42 countries and counting. Currently calling Alanya home for the winter.",
    authorPosts: 847,
    authorReputation: 9200,
    authorJoinDate: "March 2024",
    authorLocation: "Alanya, Türkiye",
    authorBadges: ["Top Contributor", "Travel Guide", "Content Creator"],
    content: "I have been traveling for 10 years and nothing prepared me for the kindness of locals here in Alanya.\n\nI arrived three weeks ago expecting beautiful beaches and good weather. What I didn't expect was the genuine warmth from complete strangers. Within my first 48 hours, a shopkeeper invited me for çay, a grandmother on the bus insisted on sharing her homemade börek, and my Airbnb host's son spent an entire afternoon showing me around the neighborhood.\n\nThe other huge surprise was how international this place is. I've met people from at least 15 different countries just hanging out at the beach cafés. There's this incredible mix of Turkish locals, Russian families, German retirees, Scandinavian digital nomads, and British expats.\n\nWhat really blew my mind though was the quality of life for the price. Coming from London, I'm spending maybe 40% of what I used to spend — and eating better, living steps from the sea, and feeling genuinely happier.\n\nWhat surprised YOU most? I'd love to hear other perspectives!",
    postedAt: "2 hours ago",
    views: 3847,
    likes: 89,
    isLiked: false,
    isPinned: true,
    isHot: true,
    isVerified: false,
    replies: [
      {
        id: "r1",
        author: "BudgetExplorer",
        authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20middle%20aged%20woman%20friendly%20smile%20natural%20light%20clean%20background%20budget%20traveler%20style%20editorial%20photography&width=100&height=100&seq=avatar-budget&orientation=squarish",
        authorRole: "Verified Local",
        content: "The food prices absolutely floored me. I'm eating restaurant-quality meals for what I used to pay for a sad sandwich in the UK. And the produce markets? Don't even get me started. 2 lira for a kilo of tomatoes that actually taste like tomatoes should taste.",
        postedAt: "1 hour ago",
        likes: 34,
        isLiked: false,
        parentId: null,
        replies: []
      },
      {
        id: "r2",
        author: "DigitalNomad_Life",
        authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20young%20man%20with%20glasses%20creative%20look%20warm%20light%20clean%20background%20remote%20worker%20style%20editorial%20photography&width=100&height=100&seq=avatar-nomad&orientation=squarish",
        authorRole: "Community Leader",
        content: "Great post Sarah! I've been here 8 months now and I'm STILL discovering new things that surprise me. The biggest one for me was the expat community — I thought I'd be one of maybe 10 remote workers here, but there are literally hundreds of us.",
        postedAt: "55 minutes ago",
        likes: 28,
        isLiked: false,
        parentId: null,
        replies: []
      }
    ]
  },
  "tv4": {
    id: "tv4",
    title: "Antalya vs Alanya - which should you choose?",
    category: "Travel & Vacation",
    categoryId: "travel-vacation",
    subcategory: "Antalya vs Alanya",
    author: "CoastExplorer",
    authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20middle%20aged%20man%20with%20explorer%20hat%20warm%20smile%20clean%20background%20adventure%20style%20editorial%20photography&width=200&height=200&seq=avatar-explorer&orientation=squarish",
    authorRole: "Top Contributor",
    authorBio: "Coastal living enthusiast. I've traveled the entire Turkish Riviera and help people find their perfect Mediterranean spot.",
    authorPosts: 623,
    authorReputation: 7800,
    authorJoinDate: "January 2024",
    authorLocation: "Antalya, Türkiye",
    authorBadges: ["Top Contributor", "Travel Guide", "Verified Local"],
    content: "I just spent two weeks in each city and here is my honest, unfiltered comparison.\n\n**Antalya:**\n- Much bigger city, feels like a proper urban center\n- More diverse restaurant and nightlife scene\n- Better connected with international flights\n- The old town (Kaleiçi) is absolutely gorgeous\n- More cultural attractions and museums\n- BUT: more expensive, more traffic, less intimate beach vibe\n\n**Alanya:**\n- Smaller, more walkable, feels safer at night\n- Better beaches within the city (Cleopatra is right there)\n- Significantly cheaper for accommodation and dining\n- More laid-back, community-oriented feel\n- Better for long-term stays and digital nomads\n- BUT: fewer international flight connections, less variety in upscale dining\n\n**My personal take:** If you're visiting for 3-7 days, Antalya gives you more to do. If you're staying longer or want a beach-focused trip, Alanya wins hands down.\n\nWhat do others think who have experience with both cities?",
    postedAt: "3 days ago",
    views: 8723,
    likes: 201,
    isLiked: false,
    isPinned: false,
    isHot: true,
    isVerified: true,
    replies: [
      {
        id: "r10",
        author: "AlanyaGuide",
        authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20middle%20aged%20man%20knowledgeable%20look%20warm%20light%20clean%20background%20local%20guide%20style%20editorial%20photography&width=100&height=100&seq=avatar-guide&orientation=squarish",
        authorRole: "Verified Local",
        content: "As someone who's lived in both — this is spot on. I'd add that Alanya has better weather in winter (it's noticeably warmer due to the mountains blocking cold air), and the community feel is much stronger. In Antalya you can feel anonymous. In Alanya, you'll run into the same people at the market every week.",
        postedAt: "2 days ago",
        likes: 45,
        isLiked: false,
        parentId: null,
        replies: [
          {
            id: "r10a",
            author: "CoastExplorer",
            authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20middle%20aged%20man%20with%20explorer%20hat%20warm%20smile%20clean%20background%20adventure%20style%20editorial%20photography&width=100&height=100&seq=avatar-explorer&orientation=squarish",
            authorRole: "Top Contributor",
            content: "Great point about the weather, I forgot to mention that! The winter microclimate in Alanya is genuinely special. I was eating outside in January while my friends in Antalya were wearing jackets.",
            postedAt: "2 days ago",
            likes: 12,
            isLiked: false,
            isOriginalPoster: true,
            parentId: "r10",
            replies: []
          }
        ]
      },
      {
        id: "r11",
        author: "PropertyInvestor",
        authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20businessman%20in%20suit%20confident%20look%20warm%20light%20clean%20background%20investor%20style%20editorial%20photography&width=100&height=100&seq=avatar-investor&orientation=squarish",
        authorRole: "Real Estate Expert",
        content: "From an investment perspective — Alanya gives you way more for your money. I've bought in both cities and the ROI on Alanya properties has been consistently better, especially for short-term rentals. The price per square meter difference is still significant enough to matter.",
        postedAt: "2 days ago",
        likes: 32,
        isLiked: false,
        parentId: null,
        replies: []
      }
    ]
  },
  "en1": {
    id: "en1",
    title: "Can foreigners still get residence permits?",
    category: "Expats & Digital Nomads",
    categoryId: "expats-nomads",
    subcategory: "Residence Permits",
    author: "ExpatInAlanya",
    authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20man%20in%20his%20thirties%20confident%20look%20warm%20light%20clean%20background%20professional%20style%20editorial%20photography&width=200&height=200&seq=avatar-expat&orientation=squarish",
    authorRole: "Verified Local",
    authorBio: "British expat living in Alanya since 2022. Been through the full residency process and happy to help others navigate it.",
    authorPosts: 456,
    authorReputation: 6500,
    authorJoinDate: "April 2024",
    authorLocation: "Alanya, Türkiye",
    authorBadges: ["Verified Local", "Mentor", "Legal Expert"],
    content: "The rules changed again in January 2026, and I just went through the renewal process last week. Here's everything you need to know:\n\n**The short answer:** YES, foreigners can still get residence permits in Türkiye — but the requirements have tightened.\n\n**What changed in 2026:**\n1. Minimum rental contract now needs to be 12 months (used to be 6)\n2. Bank account must show stable monthly income of at least $500/month\n3. Health insurance is now mandatory and must cover the full permit period\n4. The application portal (e-ikamet) has been completely redesigned — it's actually better now\n\n**My experience:** I applied online on a Monday, got an appointment at the Göç İdaresi in Alanya for Thursday, and received approval in 3 weeks. Total cost was around 2,800 TL including the card fee, insurance, and notary translations.\n\n**Pro tip:** Go to the Göç İdaresi office 30 minutes before your appointment. They tend to process people on a first-come basis regardless of appointment time. Also — bring a Turkish-speaking friend. It makes everything 10x smoother.\n\nHappy to answer specific questions below!",
    postedAt: "8 hours ago",
    views: 4321,
    likes: 112,
    isLiked: false,
    isPinned: true,
    isHot: true,
    isVerified: false,
    replies: [
      {
        id: "r20",
        author: "LegalEagle_TR",
        authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20lawyer%20woman%20professional%20look%20warm%20light%20clean%20background%20legal%20advisor%20editorial%20photography&width=100&height=100&seq=avatar-legal&orientation=squarish",
        authorRole: "Legal Advisor",
        content: "Excellent breakdown! As a lawyer specializing in this area, I'd add two important points: 1) The $500/month income requirement is per applicant, so couples need to show $1,000 combined. 2) If you own property worth over $200,000, the income requirement is waived entirely. Property owners — use your Tapu!",
        postedAt: "6 hours ago",
        likes: 38,
        isLiked: false,
        parentId: null,
        replies: [
          {
            id: "r20a",
            author: "ExpatInAlanya",
            authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20man%20in%20his%20thirties%20confident%20look%20warm%20light%20clean%20background%20professional%20style%20editorial%20photography&width=100&height=100&seq=avatar-expat&orientation=squarish",
            authorRole: "Verified Local",
            content: "Great additions, thanks! I didn't know about the property value waiver — that's really useful info for homeowners.",
            postedAt: "5 hours ago",
            likes: 8,
            isLiked: false,
            isOriginalPoster: true,
            parentId: "r20",
            replies: []
          }
        ]
      },
      {
        id: "r21",
        author: "NewInTown_",
        authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20young%20woman%20newcomer%20style%20warm%20light%20clean%20background%20new%20resident%20editorial%20photography&width=100&height=100&seq=avatar-new&orientation=squarish",
        authorRole: "Rising Star",
        content: "This is SO helpful! I'm starting my application next month. Quick question — for the bank account proof, can it be a foreign bank account or does it have to be Turkish?",
        postedAt: "5 hours ago",
        likes: 5,
        isLiked: false,
        parentId: null,
        replies: [
          {
            id: "r21a",
            author: "LegalEagle_TR",
            authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20lawyer%20woman%20professional%20look%20warm%20light%20clean%20background%20legal%20advisor%20editorial%20photography&width=100&height=100&seq=avatar-legal&orientation=squarish",
            authorRole: "Legal Advisor",
            content: "It can be either! Just make sure the statements are translated and notarized if in another language. Turkish bank statements are simpler obviously, but foreign ones are accepted. I'd recommend opening a Turkish account if you haven't already — Ziraat and İş Bankası are the most expat-friendly.",
            postedAt: "4 hours ago",
            likes: 11,
            isLiked: false,
            parentId: "r21",
            replies: []
          }
        ]
      }
    ]
  },
  "fn1": {
    id: "fn1",
    title: "Best Turkish breakfast in Alanya?",
    category: "Food & Nightlife",
    categoryId: "food-nightlife",
    subcategory: "Breakfast Spots",
    author: "FoodieNomad",
    authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20young%20man%20with%20beard%20casual%20style%20warm%20light%20clean%20background%20travel%20enthusiast%20editorial%20photography&width=200&height=200&seq=avatar-foodie&orientation=squarish",
    authorRole: "Food Expert",
    authorBio: "Eating my way through the Turkish Riviera. Former chef, full-time food explorer. If it's on a plate, I want to try it.",
    authorPosts: 389,
    authorReputation: 5600,
    authorJoinDate: "May 2024",
    authorLocation: "Alanya, Türkiye",
    authorBadges: ["Food Expert", "Local Expert", "Content Creator"],
    content: "After trying 15 different places over the past 3 months, here's my definitive ranking:\n\n**1. Hayal Kahvaltı (Oba)** — The undisputed champion. Serpme kahvaltı with 20+ small plates, homemade jams that'll make you weep, and the menemen is genuinely life-changing. About 350 TL per person. Go on a weekday to avoid the queue.\n\n**2. Köşk Cafe (near the harbor)** — Best view while you eat. Their kaymak with honey and walnuts is ridiculously good. Slightly pricier at 400 TL but worth it for the experience.\n\n**3. Hanımeli Kahvaltı (Tosmur)** — The most authentic homestyle breakfast. Run by a family, everything made fresh that morning. The gözleme here is the best I've had anywhere. 250 TL for the full spread.\n\n**4. Cleopatra's Kitchen (city center)** — Great for tourists who want something a bit familiar. They do a fusion breakfast with both Turkish and Western options. 300 TL.\n\nHonorable mention: The Friday market food stalls. Not a sit-down breakfast, but grabbing fresh simit, olives, beyaz peynir, and tomatoes and eating by the sea is honestly unbeatable.\n\nWhere did I miss? What's your go-to spot?",
    postedAt: "4 hours ago",
    views: 2156,
    likes: 67,
    isLiked: false,
    isPinned: true,
    isHot: true,
    isVerified: false,
    replies: [
      {
        id: "r30",
        author: "AlanyaLocal_Eats",
        authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20Turkish%20woman%20chef%20style%20warm%20light%20clean%20background%20food%20enthusiast%20editorial%20photography&width=100&height=100&seq=avatar-chef&orientation=squarish",
        authorRole: "Local Expert",
        content: "Great list! You're missing Bahçe Kahvaltı in Kestel though — it's a hidden garden setting, all organic ingredients from their own farm, and the village eggs with sucuk are incredible. Also cheaper than any place you listed at 200 TL. Locals' secret spot!",
        postedAt: "3 hours ago",
        likes: 24,
        isLiked: false,
        parentId: null,
        replies: [
          {
            id: "r30a",
            author: "FoodieNomad",
            authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20young%20man%20with%20beard%20casual%20style%20warm%20light%20clean%20background%20travel%20enthusiast%20editorial%20photography&width=100&height=100&seq=avatar-foodie&orientation=squarish",
            authorRole: "Food Expert",
            content: "Adding to my list immediately! Can't believe I missed this one. Going this weekend for sure.",
            postedAt: "2 hours ago",
            likes: 6,
            isLiked: false,
            isOriginalPoster: true,
            parentId: "r30",
            replies: []
          }
        ]
      }
    ]
  },
  "bn1": {
    id: "bn1",
    title: "Best beach in Alanya? Honest tier list",
    category: "Beaches & Nature",
    categoryId: "beaches-nature",
    subcategory: "Cleopatra Beach",
    author: "BeachLover123",
    authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20young%20woman%20sun%20kissed%20look%20warm%20light%20clean%20background%20beach%20enthusiast%20style%20editorial%20photography&width=200&height=200&seq=avatar-beach&orientation=squarish",
    authorRole: "Rising Star",
    authorBio: "Beach connoisseur. I've visited 200+ beaches across 30 countries. Alanya has some of the best in the Med.",
    authorPosts: 234,
    authorReputation: 2340,
    authorJoinDate: "April 2026",
    authorLocation: "Alanya, Türkiye",
    authorBadges: ["Beach Guide", "Rising Star"],
    content: "Cleopatra is famous but crowded. Let me drop the real tier list:\n\n**S-Tier (World class):**\n- Dim River coves — crystal clear water, mountain backdrop, barely any people. Bring water shoes for the rocks\n- İncekum (15 min east) — powdery sand, shallow water perfect for kids\n\n**A-Tier (Excellent):**\n- Cleopatra West end — same iconic beach but fewer crowds than the center\n- Ulaş Beach — great facilities, calm water, perfect sunset spot\n\n**B-Tier (Good):**\n- Cleopatra Center — beautiful but packed in summer\n- Keykubat Beach — long stretch, good for walks, some rocky patches\n\n**C-Tier (Skip unless convenient):**\n- Damlataş Beach — right next to the cave but tiny and often crowded\n- Mahmutlar Beach — gets narrow in some sections, gravelly in spots",
    postedAt: "12 hours ago",
    views: 3890,
    likes: 98,
    isLiked: false,
    isPinned: false,
    isHot: true,
    isVerified: false,
    replies: [
      {
        id: "r40",
        author: "Ali Karadeniz",
        authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20Turkish%20man%20with%20beard%20sun%20kissed%20skin%20warm%20smile%20outdoor%20light%20scuba%20diver%20style%20editorial%20photography&width=100&height=100&seq=member-ali&orientation=squarish",
        authorRole: "Top Contributor",
        content: "As a dive instructor — you're spot on about the Dim River coves. I take groups there for shore dives and the underwater visibility is incredible. I'd add that the water at İncekum stays warmer longer because it's shallower, so it's great for swimming even in October.",
        postedAt: "10 hours ago",
        likes: 18,
        isLiked: false,
        parentId: null,
        replies: []
      }
    ]
  },
  "en2": {
    id: "en2",
    title: "Monthly cost of living in Alanya?",
    category: "Expats & Digital Nomads",
    categoryId: "expats-nomads",
    subcategory: "Cost of Living",
    author: "DigitalNomad_Life",
    authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20young%20man%20with%20glasses%20creative%20look%20warm%20light%20clean%20background%20remote%20worker%20style%20editorial%20photography&width=200&height=200&seq=avatar-nomad&orientation=squarish",
    authorRole: "Community Leader",
    authorBio: "Remote software engineer. Living in Alanya since 2025. Here to help the digital nomad community thrive.",
    authorPosts: 567,
    authorReputation: 8400,
    authorJoinDate: "February 2024",
    authorLocation: "Alanya, Türkiye",
    authorBadges: ["Community Leader", "Digital Nomad", "Tech Expert"],
    content: "I've been living here for 8 months and tracking every lira. Here's my honest monthly budget (prices in TL as of June 2026):\n\n**Housing:** 15,000 TL — modern 1+1 apartment in Oba, fully furnished, sea view balcony\n**Utilities:** 2,500 TL — electricity, water, internet (fiber, 100 Mbps), gas\n**Food:** 8,000 TL — mix of cooking (farmer's markets are cheap!) and eating out 3-4 times/week\n**Transportation:** 1,500 TL — mainly Dolmuş (minibus) and occasional taxi\n**Health Insurance:** 1,200 TL — private, comprehensive\n**Gym & Leisure:** 2,000 TL — gym membership, beach clubs, occasional tours\n**Misc:** 3,000 TL — phone plan, streaming, random expenses\n\n**Total: ~33,200 TL/month (~$1,000 USD)**\n\nThis is a comfortable lifestyle — eating out regularly, modern apartment, gym, some travel. You can definitely live on 25,000 TL if you're frugal, and 45,000+ if you want luxury.\n\nThe biggest savings vs Western Europe: rent is 60-70% cheaper, dining out is 50% cheaper, and fresh produce is almost laughably cheap.\n\nWhat's everyone else's experience?",
    postedAt: "14 hours ago",
    views: 4987,
    likes: 134,
    isLiked: false,
    isPinned: false,
    isHot: true,
    isVerified: false,
    replies: [
      {
        id: "r50",
        author: "FamilyTraveller",
        authorAvatar: "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20British%20woman%20warm%20motherly%20smile%20outdoor%20light%20clean%20background%20family%20travel%20style%20editorial%20photography&width=100&height=100&seq=member-emma&orientation=squarish",
        authorRole: "Family Expert",
        content: "For families — our costs are obviously higher. Family of 5 (3 kids) we're spending about 55,000-60,000 TL/month including a 3-bedroom villa and international school fees. Still dramatically cheaper than the UK!",
        postedAt: "12 hours ago",
        likes: 28,
        isLiked: false,
        parentId: null,
        replies: []
      }
    ]
  }
};