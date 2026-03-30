export type Campaign = {
  id: string;
  brand: string;
  title: string;
  description: string;
  budget: string;
  cpm: string;
  creators: number;
  platforms: string[];
  category: string;
  progress: number;
  time: string;
  gradient: string;
};

export const campaigns: Campaign[] = [
  {
    id: "mrbeast-highlights",
    brand: "MrBeast",
    title: "Watch my latest video and share highlights",
    description:
      "Create engaging clips from MrBeast's newest content. Share your reactions, favorite moments, and unique commentary across your channels.",
    budget: "$50K/$100K",
    cpm: "$8.50",
    creators: 234,
    platforms: ["youtube"],
    category: "Entertainment",
    progress: 50,
    time: "2d",
    gradient: "from-red-900 via-orange-800 to-yellow-700",
  },
  {
    id: "spotify-podcasts",
    brand: "Spotify",
    title: "Create clips from top podcasts",
    description:
      "Clip the most compelling moments from trending podcasts on Spotify. Help listeners discover new shows with your curated highlights.",
    budget: "$12K/$25K",
    cpm: "$5.20",
    creators: 89,
    platforms: ["tiktok", "instagram"],
    category: "Music",
    progress: 48,
    time: "5h",
    gradient: "from-green-900 via-emerald-800 to-teal-700",
  },
  {
    id: "nike-workouts",
    brand: "Nike",
    title: "Share your best workout moments",
    description:
      "Showcase your training routine and athletic lifestyle with Nike gear. Inspire your audience with authentic fitness content.",
    budget: "$8K/$20K",
    cpm: "$12.00",
    creators: 156,
    platforms: ["tiktok", "instagram", "youtube"],
    category: "Sports",
    progress: 40,
    time: "1d",
    gradient: "from-orange-900 via-red-800 to-pink-700",
  },
  {
    id: "duolingo-language",
    brand: "Duolingo",
    title: "Make funny language learning content",
    description:
      "Create entertaining content about your language learning journey with Duolingo. Humor and authenticity are key.",
    budget: "$3K/$15K",
    cpm: "$6.80",
    creators: 67,
    platforms: ["tiktok"],
    category: "Education",
    progress: 20,
    time: "3d",
    gradient: "from-lime-900 via-green-800 to-emerald-700",
  },
  {
    id: "amazon-unboxing",
    brand: "Amazon",
    title: "Review and unbox trending products",
    description:
      "Unbox and review the latest trending products from Amazon. Share genuine opinions and help shoppers make informed decisions.",
    budget: "$22K/$40K",
    cpm: "$4.50",
    creators: 312,
    platforms: ["youtube", "tiktok"],
    category: "Product",
    progress: 55,
    time: "12h",
    gradient: "from-amber-900 via-yellow-800 to-orange-700",
  },
  {
    id: "redbull-extreme",
    brand: "Red Bull",
    title: "Capture extreme sports moments",
    description:
      "Document extreme sports and adrenaline-pumping activities. Red Bull wants raw, authentic content that pushes boundaries.",
    budget: "$15K/$30K",
    cpm: "$9.00",
    creators: 45,
    platforms: ["youtube", "instagram"],
    category: "Sports",
    progress: 50,
    time: "4d",
    gradient: "from-blue-900 via-indigo-800 to-cyan-700",
  },
  {
    id: "discord-communities",
    brand: "Discord",
    title: "Show off your server communities",
    description:
      "Highlight the best Discord communities and server features. Show why Discord is the place to hang out online.",
    budget: "$5K/$10K",
    cpm: "$3.20",
    creators: 178,
    platforms: ["youtube", "tiktok", "x"],
    category: "Technology",
    progress: 50,
    time: "6h",
    gradient: "from-indigo-900 via-purple-800 to-violet-700",
  },
  {
    id: "netflix-reactions",
    brand: "Netflix",
    title: "React to and discuss new releases",
    description:
      "Create reaction and discussion content around the newest Netflix shows and movies. Build hype and engage your community.",
    budget: "$18K/$35K",
    cpm: "$7.50",
    creators: 203,
    platforms: ["youtube", "tiktok", "instagram"],
    category: "Entertainment",
    progress: 51,
    time: "1d",
    gradient: "from-red-950 via-rose-900 to-red-800",
  },
];
