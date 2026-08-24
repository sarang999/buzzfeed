import type { Author, Location, Post, Comment } from '../types';

const AUTHORS: Author[] = [
  {
    id: 'u1',
    name: 'Priya Sharma',
    username: 'priya.wanders',
    avatarUrl: 'https://i.pravatar.cc/150?img=47',
    isVerified: true,
  },
  {
    id: 'u2',
    name: 'Marcus Chen',
    username: 'marcusonthego',
    avatarUrl: 'https://i.pravatar.cc/150?img=11',
    isVerified: false,
  },
  {
    id: 'u3',
    name: 'Sofia Reyes',
    username: 'sofia.explores',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
    isVerified: true,
  },
  {
    id: 'u4',
    name: 'Liam O\'Brien',
    username: 'liamabroad',
    avatarUrl: 'https://i.pravatar.cc/150?img=68',
    isVerified: false,
  },
  {
    id: 'u5',
    name: 'Aisha Patel',
    username: 'aisha.travels',
    avatarUrl: 'https://i.pravatar.cc/150?img=25',
    isVerified: true,
  },
  {
    id: 'u6',
    name: 'Kenji Tanaka',
    username: 'kenjiroams',
    avatarUrl: 'https://i.pravatar.cc/150?img=33',
    isVerified: false,
  },
  {
    id: 'u7',
    name: 'Emma Dupont',
    username: 'emmadupont',
    avatarUrl: 'https://i.pravatar.cc/150?img=9',
    isVerified: true,
  },
  {
    id: 'u8',
    name: 'Carlos Rivera',
    username: 'carlos.viajes',
    avatarUrl: 'https://i.pravatar.cc/150?img=56',
    isVerified: false,
  },
];

const LOCATIONS: Location[] = [
  { city: 'Kyoto', country: 'Japan', countryCode: 'JP' },
  { city: 'Santorini', country: 'Greece', countryCode: 'GR' },
  { city: 'Patagonia', country: 'Argentina', countryCode: 'AR' },
  { city: 'Marrakech', country: 'Morocco', countryCode: 'MA' },
  { city: 'Bali', country: 'Indonesia', countryCode: 'ID' },
  { city: 'Banff', country: 'Canada', countryCode: 'CA' },
  { city: 'Amalfi Coast', country: 'Italy', countryCode: 'IT' },
  { city: 'Chiang Mai', country: 'Thailand', countryCode: 'TH' },
  { city: 'Queenstown', country: 'New Zealand', countryCode: 'NZ' },
  { city: 'Cape Town', country: 'South Africa', countryCode: 'ZA' },
  { city: 'Reykjavik', country: 'Iceland', countryCode: 'IS' },
  { city: 'Dubrovnik', country: 'Croatia', countryCode: 'HR' },
  { city: 'Cusco', country: 'Peru', countryCode: 'PE' },
  { city: 'Luang Prabang', country: 'Laos', countryCode: 'LA' },
  { city: 'Valletta', country: 'Malta', countryCode: 'MT' },
];

const CAPTIONS = [
  'The kind of morning that makes you forget every deadline back home. 🌅',
  'Found this hidden alley after getting completely lost. Best thing that happened on this trip.',
  'Street food > Michelin stars. Every single time.',
  'Three weeks in and I still can\'t believe this is real life.',
  'Nobody told me the sunrise here would hit this hard.',
  'The light at 5pm is unlike anywhere I\'ve ever been.',
  'Rented a scooter, got slightly lost, found paradise. Would recommend.',
  'This view has been here for thousands of years. I\'ve been here for 20 minutes and I\'m changed.',
  'Ate the same dish four days in a row. Zero regrets.',
  'Talking to strangers is underrated. Met the most fascinating person at this café.',
  'First solo trip. Terrified. Best decision of my life.',
  'There\'s a reason people keep coming back here. I get it now.',
  'No filter. The colors here are genuinely like this.',
  'Day 12. Still not ready to go home.',
  'The journey here took 14 hours. Worth every minute.',
  'Stumbled onto a local festival. This is why I travel.',
  'Everything I thought I knew about slow travel — confirmed.',
  'Woke up at 4am for this. I\'d do it again tomorrow.',
  'The kindness of strangers on this trip has restored my faith in everything.',
  'Sometimes you just need to sit by the water and let the world slow down.',
];

// Unsplash travel photos with consistent IDs for reliable loading
const IMAGE_URLS = [
  'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
  'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&q=80',
  'https://images.unsplash.com/photo-1519055548599-6d4d129508c4?w=800&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
  'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80',
  'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800&q=80',
  'https://images.unsplash.com/photo-1519659528534-7fd733a832a0?w=800&q=80',
  'https://images.unsplash.com/photo-1502003148287-a82ef80a6abc?w=800&q=80',
  'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
  null, // text-only posts add variety
  null,
  null,
];

// Pre-generated blurhash strings (avoids runtime computation)
const BLURHASHES = [
  'LKO2?U%2Tw=w]~RBVZRi};RPxuwH',
  'LFC$yJt7_4Rj00WCWCof_Nof-;WB',
  'LaKUc}j[4nof_3j[M{ofoffQj[ay',
  'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
  'LBAdAqof00WB~qj[j[fQ00ay_3j[',
  'L5H2EC=PM+yV0g-mq.wG9c010J}I',
  'LfKUZzj[_4of_3j[t7WBoffQj[WB',
  'L9As~q1m0L00~q%LxaM{ofofaeof',
  'LGFF~ot700t7IVWBt7t7f+ayofj[',
  'LaRp8Jj[2ej[_3j[t7WBoffkj[WB',
  'LHCiSd4m0L00_4%LxaM{ofofM{of',
  'L6B[RkIU00M{~qxuRjRj00t7t7of',
  'LGF~Rs4m0M00_3%LxaM{ofofaeof',
  'LjL}T3WBRjoe_3WBt7WBj[ayofof',
  'LaRp8Jj[_2ej_3j[t7WBoffQj[WB',
];

const TAGS_POOL = [
  'travel', 'wanderlust', 'adventure', 'explore', 'photography',
  'nature', 'culture', 'food', 'architecture', 'solotravel',
  'backpacking', 'sunset', 'sunrise', 'landscape', 'streetphotography',
  'hikelife', 'beach', 'mountains', 'citylife', 'hidden gems',
];

// Deterministic pseudo-random using a seed (consistent across runs)
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.floor(seededRandom(seed) * arr.length)] as T;
}

function pickTags(seed: number, count: number): string[] {
  const tags: string[] = [];
  for (let i = 0; i < count; i++) {
    const tag = pick(TAGS_POOL, seed * (i + 1) * 7);
    if (tag && !tags.includes(tag)) tags.push(tag);
  }
  return tags;
}

// 7 days ago base, spread evenly over 30 days
function generateCreatedAt(index: number): string {
  const base = new Date('2026-08-25T12:00:00Z');
  base.setMinutes(base.getMinutes() - index * 73); // ~73 min apart
  return base.toISOString();
}

export const MOCK_AUTHORS: Author[] = AUTHORS;

export const MOCK_COMMENTS: Comment[] = [
  { id: 'c1', author: AUTHORS[1]!, text: 'This is stunning! Adding to my list 🙌', createdAt: '2026-08-25T10:00:00Z' },
  { id: 'c2', author: AUTHORS[3]!, text: 'Which month did you visit? I heard the crowds can be intense.', createdAt: '2026-08-25T10:15:00Z' },
  { id: 'c3', author: AUTHORS[5]!, text: 'That light is unreal', createdAt: '2026-08-25T10:30:00Z' },
  { id: 'c4', author: AUTHORS[0]!, text: 'Been here twice and it never gets old', createdAt: '2026-08-25T10:45:00Z' },
  { id: 'c5', author: AUTHORS[2]!, text: 'How was the food there? Worth the trip just for that?', createdAt: '2026-08-25T11:00:00Z' },
  { id: 'c6', author: AUTHORS[7]!, text: 'Solo traveling is the best decision I ever made too ❤️', createdAt: '2026-08-25T11:30:00Z' },
  { id: 'c7', author: AUTHORS[4]!, text: 'Camera settings? The bokeh here is perfect.', createdAt: '2026-08-25T12:00:00Z' },
  { id: 'c8', author: AUTHORS[6]!, text: 'Ok now I have to book flights', createdAt: '2026-08-25T12:20:00Z' },
];

// 50 seeded, deterministic travel posts — identical every run
export const MOCK_POSTS: Post[] = Array.from({ length: 50 }, (_, i) => {
  const seed = i + 1;
  const imageUrl = pick(IMAGE_URLS, seed * 3);
  const blurhashIndex = Math.floor(seededRandom(seed * 5) * BLURHASHES.length);

  return {
    id: `post-${String(i + 1).padStart(3, '0')}`,
    author: pick(AUTHORS, seed * 2) as Author,
    caption: pick(CAPTIONS, seed * 4) as string,
    imageUrl: imageUrl ?? null,
    blurhash: imageUrl ? (BLURHASHES[blurhashIndex] ?? null) : null,
    location: pick(LOCATIONS, seed * 6) as Location,
    likeCount: Math.floor(seededRandom(seed * 7) * 12000) + 50,
    saveCount: Math.floor(seededRandom(seed * 8) * 3000) + 10,
    commentCount: Math.floor(seededRandom(seed * 9) * 80) + 1,
    createdAt: generateCreatedAt(i),
    tags: pickTags(seed * 11, Math.floor(seededRandom(seed * 13) * 3) + 2),
  };
});
