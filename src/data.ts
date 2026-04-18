export interface Photo {
  id: string;
  url: string;
  date: Date;
  album: string;
  tags: string[]; // For vector search simulation
  ocrText?: string;
}

export const MOCK_PHOTOS: Photo[] = [
  {
    id: '1',
    url: 'https://picsum.photos/seed/nature1/800/1200',
    date: new Date(2026, 3, 15),
    album: 'Nature',
    tags: ['mountain', 'forest', 'landscape', 'outdoor'],
    ocrText: 'The view from the top of the mountain was breath-taking.'
  },
  {
    id: '2',
    url: 'https://picsum.photos/seed/city1/1200/800',
    date: new Date(2026, 3, 14),
    album: 'City',
    tags: ['city', 'street', 'night', 'urban'],
    ocrText: '24/7 convenience store in downtown Tokyo.'
  },
  {
    id: '3',
    url: 'https://picsum.photos/seed/food1/800/800',
    date: new Date(2026, 3, 14),
    album: 'Food',
    tags: ['food', 'sushi', 'delicious', 'lunch'],
    ocrText: '新鮮な魚 - Fresh Fish Market Special'
  },
  {
    id: '4',
    url: 'https://picsum.photos/seed/thai1/800/1000',
    date: new Date(2026, 3, 12),
    album: 'Travel',
    tags: ['thailand', 'temple', 'gold', 'culture'],
    ocrText: 'ยินดีต้อนรับสู่กรุงเทพมหานคร - Welcome to Bangkok'
  },
  {
    id: '5',
    url: 'https://picsum.photos/seed/china1/1000/700',
    date: new Date(2026, 3, 10),
    album: 'Travel',
    tags: ['china', 'great wall', 'history', 'landmark'],
    ocrText: '万里长城 - The Great Wall of China'
  },
  {
    id: '6',
    url: 'https://picsum.photos/seed/nature2/800/800',
    date: new Date(2026, 3, 10),
    album: 'Nature',
    tags: ['lake', 'blue', 'water', 'calm'],
    ocrText: 'Mirror lake at dawn.'
  },
  {
    id: '7',
    url: 'https://picsum.photos/seed/notes1/600/800',
    date: new Date(2026, 3, 5),
    album: 'Notes',
    tags: ['text', 'document', 'important', 'writing'],
    ocrText: 'Project Alpha Requirements: 1. Native performance 2. Material You 3. 100% Offline'
  },
  {
    id: '8',
    url: 'https://picsum.photos/seed/cat1/800/800',
    date: new Date(2026, 2, 28),
    album: 'Pets',
    tags: ['cat', 'animal', 'cute', 'indoor'],
    ocrText: 'Meow...'
  }
];
