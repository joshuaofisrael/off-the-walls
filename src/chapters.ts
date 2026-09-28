import type { ChapterId } from './types';

export type ChapterDef = {
  id: ChapterId;
  index: string;
  title: string;
  blurb: string;
};

export const CHAPTERS: ChapterDef[] = [
  {
    id: 'morning',
    index: '01',
    title: 'Morning',
    blurb: 'Badge in. The fluorescents are already humming.',
  },
  {
    id: 'commute',
    index: '02',
    title: 'Commute Crush',
    blurb: 'Closing doors, platform walkways, and the polite shove of rush hour.',
  },
  {
    id: 'office',
    index: '03',
    title: 'Office Maze',
    blurb: 'Partitions, coffee on the floor, and an open plan that is not.',
  },
  {
    id: 'overtime',
    index: '04',
    title: 'Overtime Clock',
    blurb: 'Meeting paddles keep spinning. Your focus gets to leave anyway.',
  },
  {
    id: 'boss',
    index: '05',
    title: 'Boss Ping Gauntlet',
    blurb: 'ASAP, CC: everyone, and a performance review you can bounce around.',
  },
  {
    id: 'finale',
    index: '06',
    title: 'Last Train',
    blurb: 'Catch the train home. The amber capsule is on the platform.',
  },
];

export function chapterById(id: ChapterId): ChapterDef {
  const found = CHAPTERS.find((c) => c.id === id);
  if (!found) return CHAPTERS[0];
  return found;
}
