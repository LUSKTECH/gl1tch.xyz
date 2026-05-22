import { site } from './site';

export type Channel = {
  slug: string;
  twitchChannel: string;
  label: string;
  twitchUrl: string;
};

export const channels: Channel[] = [
  {
    slug: 'toronto',
    twitchChannel: 'TorontoGl1tch',
    label: 'Toronto gl1tch',
    twitchUrl: site.social.twitch,
  },
  {
    slug: 'strain',
    twitchChannel: 'realstrain',
    label: 'I Strain I',
    twitchUrl: site.social.twitchStrain,
  },
];

export const iframeParents = ['gl1tch.xyz', 'www.gl1tch.xyz', 'glitch.ddev.site', 'localhost'];
