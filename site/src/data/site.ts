export const site = {
  name: 'Toronto gl1tch',
  tagline: "Life's a g̶l̷1̶t̴c̷h̵",
  description:
    'Toronto gl1tch — a small crew of gamers and streamers. Tune in on Twitch, find us across platforms, or join the gang.',
  social: {
    twitch: 'https://twitch.tv/TorontoGl1tch',
    twitchStrain: 'https://twitch.tv/realstrain',
    youtube: 'https://www.youtube.com/channel/UCbtXGgD2LQM2r-gOOFaOwTg',
    youtubeStrain: 'https://www.youtube.com/channel/UCfqm97XLMEk-izJxJgYmmrw',
    twitter: 'https://twitter.com/TorontoGl1tch',
    facebook: 'https://facebook.com/TorontoGl1tch',
    discord: 'https://discord.gg/UJQKFDk',
  },
} as const;

export const nav = [
  { href: '/', label: 'Home' },
  { href: '/stream', label: 'Watch' },
  { href: '/team', label: 'Team' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
  { href: '/join', label: 'Join' },
] as const;

export type Member = {
  name: string;
  primary: 'XBL' | 'Steam' | 'PSN';
  psn?: string;
  steam?: { name: string; url: string };
  xbl?: { name: string; url: string };
};

export const team: Member[] = [
  {
    name: 'Cody',
    primary: 'XBL',
    psn: 'KuroDeathGod',
    steam: { name: 'lusky3', url: 'https://steamcommunity.com/profiles/76561197969560187/' },
    xbl: { name: 'I Strain I', url: 'https://account.xbox.com/en-ca/profile?gamertag=I%20Strain%20I' },
  },
  {
    name: 'Robert',
    primary: 'Steam',
    steam: { name: 'SuperFlu', url: 'https://steamcommunity.com/profiles/76561198022537308' },
    xbl: { name: 'Abokubuku', url: 'https://account.xbox.com/en-ca/profile?gamertag=Abokuboku' },
  },
  {
    name: 'Scott',
    primary: 'Steam',
    steam: { name: 'Kokain', url: 'https://steamcommunity.com/id/alekzvan' },
    xbl: { name: 'gesstopo666', url: 'https://account.xbox.com/en-ca/profile?gamertag=gesstopo666' },
  },
  {
    name: 'Steven',
    primary: 'XBL',
    steam: { name: 'ChOMmY GuNs', url: 'https://steamcommunity.com/profiles/76561198035392140' },
    xbl: { name: 'I TaZzY I', url: 'https://account.xbox.com/en-ca/profile?gamertag=I%20TaZzY%20I' },
  },
];
