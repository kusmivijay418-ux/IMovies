import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  phone?: string;
  createdAt: string;
}

export interface Movie {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl: string;
  duration: number;
  releaseDate: string;
  genres: string[];
  languages: string[];
  censorRating: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';
  rating: number;
  votesCount: number;
  director: string;
  cast: { name: string; role: string; avatarUrl?: string }[];
  formats: ('2D' | '3D' | 'IMAX 3D' | '4DX' | 'Dolby Atmos')[];
  status: 'now_showing' | 'coming_soon';
  featured?: boolean;
  suggestedReason?: string;
  matchScore?: number;
}

export interface Theatre {
  id: string;
  name: string;
  city: string;
  address: string;
  screens: {
    id: string;
    name: string;
    format: 'IMAX 3D' | 'Dolby Atmos' | '4DX' | 'Standard';
    totalSeats: number;
    rows: number;
    cols: number;
  }[];
  amenities: string[];
}

export interface SeatStatus {
  row: string;
  number: number;
  tier: 'VIP' | 'Premium' | 'Standard';
  price: number;
  status: 'available' | 'booked' | 'locked';
  lockedUntil?: number;
  lockedByUserId?: string;
}

export interface Show {
  id: string;
  movieId: string;
  theatreId: string;
  screenId: string;
  screenName: string;
  screenFormat: 'IMAX 3D' | 'Dolby Atmos' | '4DX' | 'Standard';
  date: string;
  startTime: string;
  endTime: string;
  basePrices: {
    VIP: number;
    Premium: number;
    Standard: number;
  };
  seatLayout: SeatStatus[];
}

export interface ConcessionItem {
  id: string;
  name: string;
  category: 'Popcorn' | 'Beverages' | 'Combos' | 'Snacks';
  price: number;
  imageUrl: string;
  description: string;
}

export interface BookingConcession {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  showId: string;
  movieId: string;
  movieTitle: string;
  moviePoster: string;
  theatreId: string;
  theatreName: string;
  theatreAddress: string;
  screenName: string;
  screenFormat: string;
  showDate: string;
  showTime: string;
  seats: { row: string; number: number; tier: string; price: number }[];
  concessions: BookingConcession[];
  subtotal: number;
  convenienceFee: number;
  discountAmount: number;
  totalAmount: number;
  promoCode?: string;
  paymentMethod: 'card' | 'applepay' | 'googlepay' | 'upi';
  paymentId: string;
  status: 'confirmed' | 'cancelled';
  bookingDate: string;
  cancelledAt?: string;
  refundAmount?: number;
  qrCodeData: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'cancellation' | 'promo' | 'reminder';
  read: boolean;
  createdAt: string;
}

export interface DatabaseSchema {
  users: User[];
  movies: Movie[];
  theatres: Theatre[];
  shows: Show[];
  bookings: Booking[];
  concessions: ConcessionItem[];
  notifications: Notification[];
}

const DB_FILE_PATH = path.resolve(process.cwd(), 'data', 'imovies_db.json');

export function generateDefaultSeats(basePrices: { VIP: number; Premium: number; Standard: number }): SeatStatus[] {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const cols = 12;
  const seats: SeatStatus[] = [];

  for (const row of rows) {
    let tier: 'VIP' | 'Premium' | 'Standard' = 'Standard';
    let price = basePrices.Standard;

    if (row === 'A' || row === 'B') {
      tier = 'VIP';
      price = basePrices.VIP;
    } else if (row === 'C' || row === 'D' || row === 'E') {
      tier = 'Premium';
      price = basePrices.Premium;
    }

    for (let num = 1; num <= cols; num++) {
      const isRandomlyBooked = Math.random() < 0.14;
      seats.push({
        row,
        number: num,
        tier,
        price,
        status: isRandomlyBooked ? 'booked' : 'available',
      });
    }
  }

  return seats;
}

export const SEEDED_CONCESSIONS: ConcessionItem[] = [
  {
    id: 'c1',
    name: 'Mega Tub Caramel Popcorn',
    category: 'Popcorn',
    price: 9.5,
    imageUrl: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=400&q=80',
    description: 'Freshly popped jumbo warm popcorn drizzled with rich golden caramel glaze.',
  },
  {
    id: 'c2',
    name: 'Classic Buttered Popcorn (Large)',
    category: 'Popcorn',
    price: 8.0,
    imageUrl: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?auto=format&fit=crop&w=400&q=80',
    description: 'Hot cinema-style salted popcorn with real melted creamy butter.',
  },
  {
    id: 'c3',
    name: 'Cheesy Loaded Nachos',
    category: 'Snacks',
    price: 8.75,
    imageUrl: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=400&q=80',
    description: 'Crisp tortilla chips served with warm melted cheddar dip and spicy jalapeños.',
  },
  {
    id: 'c4',
    name: 'Ultimate Couple Combo',
    category: 'Combos',
    price: 18.5,
    imageUrl: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?auto=format&fit=crop&w=400&q=80',
    description: '2 Large Drinks, 1 Giant Popcorn Tub, and 1 Nachos platter with cheese dip.',
  },
  {
    id: 'c5',
    name: 'Fountain Soda (Large 32oz)',
    category: 'Beverages',
    price: 5.5,
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=80',
    description: 'Ice-cold Coca-Cola, Sprite, Diet Coke, or Fanta in a cinema cup.',
  },
  {
    id: 'c6',
    name: 'Artisan Hotdog & Crisp Fries',
    category: 'Snacks',
    price: 10.0,
    imageUrl: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&w=400&q=80',
    description: 'Grilled premium beef frank with sweet relish, mustard, and golden fries.',
  },
];

export const INITIAL_MOVIES: Movie[] = [
  {
    id: 'm1',
    title: 'Dune: Part Two',
    slug: 'dune-part-two',
    tagline: 'Long live the fighters.',
    synopsis: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/embed/Way9Dexny3w',
    duration: 166,
    releaseDate: '2024-03-01',
    genres: ['Sci-Fi', 'Adventure', 'Action'],
    languages: ['English', 'Spanish', 'French'],
    censorRating: 'PG-13',
    rating: 8.8,
    votesCount: 428000,
    director: 'Denis Villeneuve',
    cast: [
      { name: 'Timothée Chalamet', role: 'Paul Atreides' },
      { name: 'Zendaya', role: 'Chani' },
      { name: 'Rebecca Ferguson', role: 'Lady Jessica' },
      { name: 'Javier Bardem', role: 'Stilgar' },
      { name: 'Austin Butler', role: 'Feyd-Rautha Harkonnen' },
    ],
    formats: ['IMAX 3D', 'Dolby Atmos', '4DX', '2D'],
    status: 'now_showing',
    featured: true,
  },
  {
    id: 'm2',
    title: 'Interstellar: IMAX Special Edition',
    slug: 'interstellar-imax',
    tagline: 'Mankind was born on Earth. It was never meant to die here.',
    synopsis: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
    posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/embed/zSWdZVtXT7E',
    duration: 169,
    releaseDate: '2024-09-27',
    genres: ['Sci-Fi', 'Drama', 'Adventure'],
    languages: ['English', 'German'],
    censorRating: 'PG-13',
    rating: 8.7,
    votesCount: 1950000,
    director: 'Christopher Nolan',
    cast: [
      { name: 'Matthew McConaughey', role: 'Cooper' },
      { name: 'Anne Hathaway', role: 'Brand' },
      { name: 'Jessica Chastain', role: 'Murph' },
      { name: 'Michael Caine', role: 'Professor Brand' },
    ],
    formats: ['IMAX 3D', 'Dolby Atmos', '2D'],
    status: 'now_showing',
    featured: true,
  },
  {
    id: 'm3',
    title: 'Cyberpunk: Neon Horizon',
    slug: 'cyberpunk-neon-horizon',
    tagline: 'In a world of synthetic minds, the only real currency is memory.',
    synopsis: 'In Neo-Shinjuku 2088, an augmented detective is hired to investigate the theft of digital consciousness records from a megacorporation, uncovering a conspiracy that could collapse the firewall separating human perception from artificial intelligence.',
    posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/embed/8X2kIfS6fb8',
    duration: 142,
    releaseDate: '2024-08-15',
    genres: ['Sci-Fi', 'Action', 'Thriller'],
    languages: ['English', 'Japanese'],
    censorRating: 'R',
    rating: 8.4,
    votesCount: 145000,
    director: 'Kenji Sato',
    cast: [
      { name: 'Rina Takeda', role: 'Detective Maya' },
      { name: 'Karl Urban', role: 'Vance Cross' },
      { name: 'Hiroyuki Sanada', role: 'CEO Kuroda' },
    ],
    formats: ['IMAX 3D', '4DX', 'Dolby Atmos'],
    status: 'now_showing',
    featured: true,
  },
  {
    id: 'm4',
    title: 'Shadows of Olympus',
    slug: 'shadows-of-olympus',
    tagline: 'When gods bleed, mortals awaken.',
    synopsis: 'An ancient seal buried deep under the Aegean Sea fractures, releasing mythological Titans into the modern Mediterranean. A rogue archaeologist and a Greek navy lieutenant must race against time before Mount Olympus burns.',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: 135,
    releaseDate: '2024-10-10',
    genres: ['Action', 'Fantasy', 'Adventure'],
    languages: ['English', 'Greek', 'Spanish'],
    censorRating: 'PG-13',
    rating: 7.9,
    votesCount: 98000,
    director: 'Elena Thorne',
    cast: [
      { name: 'Alexander Skarsgård', role: 'Demetrios' },
      { name: 'Gemma Arterton', role: 'Dr. Helen Vane' },
      { name: 'Mads Mikkelsen', role: 'Kronos Vessel' },
    ],
    formats: ['3D', 'Dolby Atmos', '2D'],
    status: 'now_showing',
  },
  {
    id: 'm5',
    title: 'Lumina: Spirit of the Forest',
    slug: 'lumina-spirit-of-forest',
    tagline: 'Every leaf whispers a song. Only the brave can hear it.',
    synopsis: 'A mesmerizing animated journey of a young girl who discovers a hidden realm of enchanted glowing creatures safeguarding Earth’s ancient heartwood from industrialized destruction.',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/embed/L0MK7qz13bU',
    duration: 104,
    releaseDate: '2024-07-20',
    genres: ['Animation', 'Family', 'Fantasy'],
    languages: ['English', 'Spanish', 'French', 'Hindi'],
    censorRating: 'PG',
    rating: 8.9,
    votesCount: 162000,
    director: 'Sophie Laurent',
    cast: [
      { name: 'Anya Taylor-Joy', role: 'Voice of Lumina' },
      { name: 'Tom Holland', role: 'Voice of Pip' },
      { name: 'Cate Blanchett', role: 'The Ancient Mother' },
    ],
    formats: ['3D', '2D'],
    status: 'now_showing',
  },
  {
    id: 'm6',
    title: 'The Velocity Project',
    slug: 'the-velocity-project',
    tagline: 'Break the sound barrier. Rewrite the laws of physics.',
    synopsis: 'An elite experimental flight squadron is tasked with testing a zero-mass propulsion jet on the edge of the stratosphere, only to trigger an unforeseen geopolitical and atmospheric catastrophe.',
    posterUrl: 'https://images.unsplash.com/photo-1519074069444-1ba4ea16e6f4?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/embed/qSqVVswa420',
    duration: 128,
    releaseDate: '2024-11-20',
    genres: ['Action', 'Thriller'],
    languages: ['English'],
    censorRating: 'PG-13',
    rating: 8.2,
    votesCount: 65000,
    director: 'Marcus Sterling',
    cast: [
      { name: 'Michael B. Jordan', role: 'Captain Gage' },
      { name: 'Miles Teller', role: 'Lt. Miller' },
      { name: 'Florence Pugh', role: 'Dr. Katherine Bell' },
    ],
    formats: ['IMAX 3D', '4DX', 'Dolby Atmos'],
    status: 'coming_soon',
  },
  {
    id: 'm7',
    title: 'Echoes in the Dark',
    slug: 'echoes-in-the-dark',
    tagline: 'Some frequencies should never be answered.',
    synopsis: 'A radio telescope research station in Antarctica detects an anomalous rhythmic pulse emanating from deep underneath the ice sheet. As paranoia takes over, the crew realizes something is awakening.',
    posterUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/embed/1kVK06546hs',
    duration: 118,
    releaseDate: '2024-12-05',
    genres: ['Horror', 'Mystery', 'Sci-Fi'],
    languages: ['English'],
    censorRating: 'R',
    rating: 8.1,
    votesCount: 54000,
    director: 'Guillermo Vance',
    cast: [
      { name: 'Vera Farmiga', role: 'Dr. Sarah Scott' },
      { name: 'Willem Dafoe', role: 'Chief Engineer Lars' },
    ],
    formats: ['Dolby Atmos', '2D'],
    status: 'coming_soon',
  },
  {
    id: 'm8',
    title: 'Oppenheimer: 70mm Special',
    slug: 'oppenheimer-imax',
    tagline: 'The world changes forever.',
    synopsis: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II, presented in pristine IMAX laser format.',
    posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/embed/uYPbbksJxIg',
    duration: 180,
    releaseDate: '2024-04-12',
    genres: ['Drama', 'History', 'Thriller'],
    languages: ['English', 'German'],
    censorRating: 'R',
    rating: 8.9,
    votesCount: 780000,
    director: 'Christopher Nolan',
    cast: [
      { name: 'Cillian Murphy', role: 'J. Robert Oppenheimer' },
      { name: 'Emily Blunt', role: 'Kitty Oppenheimer' },
      { name: 'Robert Downey Jr.', role: 'Lewis Strauss' },
      { name: 'Matt Damon', role: 'Leslie Groves' },
    ],
    formats: ['IMAX 3D', 'Dolby Atmos', '2D'],
    status: 'now_showing',
    featured: true,
  },
  {
    id: 'm9',
    title: 'Gladiator II',
    slug: 'gladiator-2',
    tagline: 'What we do in life echoes in eternity.',
    synopsis: 'Years after witnessing the death of the revered hero Maximus at the hands of his uncle, Lucius must enter the Colosseum after his home is conquered by tyrannical emperors.',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/embed/4rgYUipGJNo',
    duration: 148,
    releaseDate: '2024-11-15',
    genres: ['Action', 'Drama', 'Adventure'],
    languages: ['English', 'Spanish'],
    censorRating: 'R',
    rating: 8.5,
    votesCount: 320000,
    director: 'Ridley Scott',
    cast: [
      { name: 'Paul Mescal', role: 'Lucius Verus' },
      { name: 'Pedro Pascal', role: 'Marcus Acacius' },
      { name: 'Denzel Washington', role: 'Macrinus' },
    ],
    formats: ['IMAX 3D', 'Dolby Atmos', '4DX', '2D'],
    status: 'now_showing',
    featured: true,
  },
  {
    id: 'm10',
    title: 'Spider-Man: Beyond the Multiverse',
    slug: 'spiderman-beyond-multiverse',
    tagline: 'Anyone can wear the mask. How you wear it is what matters.',
    synopsis: 'Miles Morales traverses the boundless dimensions of the multiverse to save those he loves from an omnipresent anomaly threatening all timelines.',
    posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/embed/cqGjhVJWtEg',
    duration: 140,
    releaseDate: '2024-06-02',
    genres: ['Animation', 'Action', 'Sci-Fi'],
    languages: ['English', 'Spanish'],
    censorRating: 'PG',
    rating: 9.0,
    votesCount: 560000,
    director: 'Joaquim Dos Santos',
    cast: [
      { name: 'Shameik Moore', role: 'Miles Morales' },
      { name: 'Hailee Steinfeld', role: 'Gwen Stacy' },
      { name: 'Oscar Isaac', role: 'Miguel O\'Hara' },
    ],
    formats: ['3D', 'Dolby Atmos', '2D'],
    status: 'now_showing',
    featured: true,
  },
  {
    id: 'm11',
    title: 'Deadpool & Wolverine',
    slug: 'deadpool-and-wolverine',
    tagline: 'Come together.',
    synopsis: 'Wade Wilson and Logan join forces in an irreverent and explosive cross-dimensional journey through the TVA to defend their timelines.',
    posterUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/embed/73_1biulkYk',
    duration: 128,
    releaseDate: '2024-07-26',
    genres: ['Action', 'Comedy', 'Sci-Fi'],
    languages: ['English', 'French'],
    censorRating: 'R',
    rating: 8.3,
    votesCount: 410000,
    director: 'Shawn Levy',
    cast: [
      { name: 'Ryan Reynolds', role: 'Wade Wilson / Deadpool' },
      { name: 'Hugh Jackman', role: 'Logan / Wolverine' },
      { name: 'Emma Corrin', role: 'Cassandra Nova' },
    ],
    formats: ['IMAX 3D', 'Dolby Atmos', '4DX', '2D'],
    status: 'now_showing',
  },
  {
    id: 'm12',
    title: 'Avatar: Fire and Ash',
    slug: 'avatar-fire-and-ash',
    tagline: 'Return to Pandora. Meet the Ash People.',
    synopsis: 'Jake Sully and Neytiri encounter a fierce new volcanic clan of Na\'vi, exploring previously uncharted territories of Pandora with unprecedented 3D visual spectacle.',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/embed/o5F8MOz_IDw',
    duration: 192,
    releaseDate: '2025-12-19',
    genres: ['Sci-Fi', 'Adventure', 'Fantasy'],
    languages: ['English', 'Spanish'],
    censorRating: 'PG-13',
    rating: 8.6,
    votesCount: 190000,
    director: 'James Cameron',
    cast: [
      { name: 'Sam Worthington', role: 'Jake Sully' },
      { name: 'Zoe Saldana', role: 'Neytiri' },
      { name: 'Sigourney Weaver', role: 'Kiri' },
    ],
    formats: ['IMAX 3D', 'Dolby Atmos', '4DX'],
    status: 'coming_soon',
  },
  {
    id: 'm13',
    title: 'The Batman: Part II',
    slug: 'the-batman-part-2',
    tagline: 'Unmask the corruption beneath Gotham.',
    synopsis: 'Bruce Wayne delves deeper into the submerged criminal underbelly of Gotham City, facing escalating threats from Arkham Asylum as winter freezes the city.',
    posterUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/embed/mqqft2x_Aa4',
    duration: 165,
    releaseDate: '2026-10-02',
    genres: ['Action', 'Crime', 'Drama'],
    languages: ['English'],
    censorRating: 'PG-13',
    rating: 8.5,
    votesCount: 220000,
    director: 'Matt Reeves',
    cast: [
      { name: 'Robert Pattinson', role: 'Bruce Wayne / Batman' },
      { name: 'Colin Farrell', role: 'Oz Cobb / Penguin' },
      { name: 'Andy Serkis', role: 'Alfred Pennyworth' },
    ],
    formats: ['IMAX 3D', 'Dolby Atmos', '2D'],
    status: 'coming_soon',
  },
  {
    id: 'm14',
    title: 'Everything Everywhere All At Once',
    slug: 'everything-everywhere',
    tagline: 'The universe is so much bigger than you realize.',
    synopsis: 'A middle-aged Chinese immigrant is swept up into an insane adventure in which she alone can save existence by exploring other universes and connecting with the lives she could have led.',
    posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/embed/wxN1T1uxQ2g',
    duration: 139,
    releaseDate: '2024-05-18',
    genres: ['Sci-Fi', 'Comedy', 'Adventure'],
    languages: ['English', 'Spanish'],
    censorRating: 'R',
    rating: 8.7,
    votesCount: 490000,
    director: 'Daniel Kwan, Daniel Scheinert',
    cast: [
      { name: 'Michelle Yeoh', role: 'Evelyn Wang' },
      { name: 'Ke Huy Quan', role: 'Waymond Wang' },
      { name: 'Stephanie Hsu', role: 'Joy Wang / Jobu Tupaki' },
      { name: 'Jamie Lee Curtis', role: 'Deirdre Beaubeirdre' },
    ],
    formats: ['Dolby Atmos', '2D'],
    status: 'now_showing',
  },
];

export const INITIAL_THEATRES: Theatre[] = [
  {
    id: 'th1',
    name: 'Downtown Grand IMAX Palace',
    city: 'New York',
    address: '450 West 42nd St, Times Square District',
    amenities: ['IMAX Laser Dual 4K', 'Dolby Atmos 64-Channel', 'Luxury Heated Recliners', 'Gourmet In-Seat Dining', 'Bar & Lounge'],
    screens: [
      { id: 'sc1', name: 'IMAX Auditorium 1', format: 'IMAX 3D', totalSeats: 96, rows: 8, cols: 12 },
      { id: 'sc2', name: 'Dolby Atmos Screen 2', format: 'Dolby Atmos', totalSeats: 96, rows: 8, cols: 12 },
    ],
  },
  {
    id: 'th2',
    name: 'Metroplex CineLuxe & 4DX',
    city: 'Los Angeles',
    address: '10200 Santa Monica Blvd, Century City',
    amenities: ['4DX Motion & Scent FX', 'Laser Projection', 'VIP Lounge', 'Full Bar', 'Validated Valet Parking'],
    screens: [
      { id: 'sc3', name: '4DX Experience Hall', format: '4DX', totalSeats: 96, rows: 8, cols: 12 },
      { id: 'sc4', name: 'Screen 2 Prime View', format: 'Standard', totalSeats: 96, rows: 8, cols: 12 },
    ],
  },
  {
    id: 'th3',
    name: 'Starlight CineDome Metropolis',
    city: 'Chicago',
    address: '600 N Michigan Ave, Magnificent Mile',
    amenities: ['Dolby Atmos Cinema', 'Full Recline Leather Chairs', 'Artisan Bakery', 'Craft Cocktails'],
    screens: [
      { id: 'sc5', name: 'Screen 1 Dolby Cinema', format: 'Dolby Atmos', totalSeats: 96, rows: 8, cols: 12 },
      { id: 'sc6', name: 'Screen 2 Classic', format: 'Standard', totalSeats: 96, rows: 8, cols: 12 },
    ],
  },
  {
    id: 'th4',
    name: 'Apex Horizon Cinema',
    city: 'San Francisco',
    address: '845 Market St, Westfield San Francisco',
    amenities: ['Giant Screen Laser', 'Dolby Sound', 'Recliners', 'Mobile Order Concessions'],
    screens: [
      { id: 'sc7', name: 'Apex Screen 1', format: 'IMAX 3D', totalSeats: 96, rows: 8, cols: 12 },
      { id: 'sc8', name: 'Apex Screen 2', format: 'Dolby Atmos', totalSeats: 96, rows: 8, cols: 12 },
    ],
  },
];

export function generateInitialShows(theatres: Theatre[], movies: Movie[]): Show[] {
  const shows: Show[] = [];
  const activeMovies = movies.filter(m => m.status === 'now_showing');
  const times = ['10:30 AM', '01:45 PM', '04:30 PM', '07:15 PM', '10:00 PM'];
  const today = new Date();

  for (let d = 0; d < 5; d++) {
    const showDateObj = new Date(today);
    showDateObj.setDate(today.getDate() + d);
    const dateStr = showDateObj.toISOString().split('T')[0];

    for (const theatre of theatres) {
      for (const screen of theatre.screens) {
        const movieIndex = (d + theatre.screens.indexOf(screen)) % activeMovies.length;
        const movie = activeMovies[movieIndex] || activeMovies[0];
        const selectedTimes = d % 2 === 0 ? [times[0], times[2], times[3], times[4]] : [times[1], times[2], times[3]];

        for (const time of selectedTimes) {
          const basePrices = screen.format === 'IMAX 3D'
            ? { VIP: 24, Premium: 19, Standard: 15 }
            : screen.format === '4DX'
            ? { VIP: 26, Premium: 21, Standard: 17 }
            : screen.format === 'Dolby Atmos'
            ? { VIP: 22, Premium: 17, Standard: 14 }
            : { VIP: 18, Premium: 14, Standard: 11 };

          shows.push({
            id: `show_${shows.length + 1}`,
            movieId: movie.id,
            theatreId: theatre.id,
            screenId: screen.id,
            screenName: screen.name,
            screenFormat: screen.format,
            date: dateStr,
            startTime: time,
            endTime: calculateEndTime(time, movie.duration),
            basePrices,
            seatLayout: generateDefaultSeats(basePrices),
          });
        }
      }
    }
  }

  return shows;
}

function calculateEndTime(startTimeStr: string, durationMinutes: number): string {
  try {
    const parts = startTimeStr.split(' ');
    const [hStr, mStr] = parts[0].split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const isPM = parts[1] === 'PM';
    if (isPM && h !== 12) h += 12;
    if (!isPM && h === 12) h = 0;

    const totalStartMins = h * 60 + m;
    const totalEndMins = (totalStartMins + durationMinutes + 15) % (24 * 60);

    let endH = Math.floor(totalEndMins / 60);
    const endM = totalEndMins % 60;
    const endPeriod = endH >= 12 ? 'PM' : 'AM';
    if (endH > 12) endH -= 12;
    if (endH === 0) endH = 12;

    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')} ${endPeriod}`;
  } catch {
    return '11:45 PM';
  }
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (parsed.users && parsed.movies && parsed.shows) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Initializing fresh database data:', err);
    }

    return this.initializeDefaultDatabase();
  }

  public initializeDefaultDatabase(): DatabaseSchema {
    const users: User[] = [
      {
        id: 'user_admin',
        name: 'Cinema Director (Admin)',
        email: 'admin@imovies.com',
        passwordHash: bcrypt.hashSync('admin123', 10),
        role: 'admin',
        phone: '+1 (555) 019-2831',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'user_demo',
        name: 'Alex Johnson',
        email: 'alex@example.com',
        passwordHash: bcrypt.hashSync('user123', 10),
        role: 'user',
        phone: '+1 (555) 839-4402',
        createdAt: new Date().toISOString(),
      },
    ];

    const movies = INITIAL_MOVIES;
    const theatres = INITIAL_THEATRES;
    const shows = generateInitialShows(theatres, movies);
    const concessions = SEEDED_CONCESSIONS;

    const firstShow = shows[0];
    const initialBooking: Booking = {
      id: 'IMV-84920',
      userId: 'user_demo',
      userName: 'Alex Johnson',
      userEmail: 'alex@example.com',
      showId: firstShow.id,
      movieId: firstShow.movieId,
      movieTitle: movies.find(m => m.id === firstShow.movieId)?.title || 'Dune: Part Two',
      moviePoster: movies.find(m => m.id === firstShow.movieId)?.posterUrl || '',
      theatreId: firstShow.theatreId,
      theatreName: theatres.find(t => t.id === firstShow.theatreId)?.name || 'Downtown Grand IMAX Palace',
      theatreAddress: theatres.find(t => t.id === firstShow.theatreId)?.address || '',
      screenName: firstShow.screenName,
      screenFormat: firstShow.screenFormat,
      showDate: firstShow.date,
      showTime: firstShow.startTime,
      seats: [
        { row: 'D', number: 6, tier: 'Premium', price: 19 },
        { row: 'D', number: 7, tier: 'Premium', price: 19 },
      ],
      concessions: [
        { id: 'c1', name: 'Mega Tub Caramel Popcorn', quantity: 1, price: 9.5 },
        { id: 'c5', name: 'Fountain Soda (Large 32oz)', quantity: 2, price: 5.5 },
      ],
      subtotal: 58.5,
      convenienceFee: 3.5,
      discountAmount: 5.0,
      totalAmount: 57.0,
      promoCode: 'IMOVIES10',
      paymentMethod: 'applepay',
      paymentId: 'PAY-TX-993817',
      status: 'confirmed',
      bookingDate: new Date(Date.now() - 86400000).toISOString(),
      qrCodeData: 'IMOVIES:TICKET:IMV-84920:DUNE2:D6-D7:CONFIRMED',
    };

    const notifications: Notification[] = [
      {
        id: 'notif_1',
        userId: 'user_demo',
        title: 'Booking Confirmed!',
        message: 'Your tickets for Dune: Part Two at Downtown Grand IMAX Palace are confirmed. Show starts soon!',
        type: 'booking',
        read: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'notif_2',
        userId: 'user_demo',
        title: 'Exclusive Offer: 20% Off',
        message: 'Use promo code CINEMA20 on any IMAX or Dolby Atmos screening this weekend.',
        type: 'promo',
        read: true,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
      },
    ];

    const initialData: DatabaseSchema = {
      users,
      movies,
      theatres,
      shows,
      bookings: [initialBooking],
      concessions,
      notifications,
    };

    this.saveData(initialData);
    return initialData;
  }

  public saveData(data?: DatabaseSchema) {
    if (data) {
      this.data = data;
    }
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  public getData(): DatabaseSchema {
    this.cleanExpiredLocks();
    return this.data;
  }

  public cleanExpiredLocks() {
    const now = Date.now();
    let modified = false;

    for (const show of this.data.shows) {
      for (const seat of show.seatLayout) {
        if (seat.status === 'locked' && seat.lockedUntil && seat.lockedUntil < now) {
          seat.status = 'available';
          delete seat.lockedUntil;
          delete seat.lockedByUserId;
          modified = true;
        }
      }
    }

    if (modified) {
      this.saveData();
    }
  }
}

export const db = new Database();
