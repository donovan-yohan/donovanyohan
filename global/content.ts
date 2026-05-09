export interface WorkInfo {
  isLink: boolean;
  label: string;
  href?: string;
  key: string;
}

export interface LogoSrc {
  light: string;
  dark?: string;
  poster?: string;
}

export interface Logo {
  label: string;
  src: LogoSrc;
  invertForDarkMode: boolean;
  width: number;
  isVideo?: boolean;
  key: string;
}

const _empty = "";
export const HomeAboutText = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse eu sapien at eros ultrices volutpat ut sed orci. Duis ut ex nunc. Ut ligula turpis, lobortis a augue in, dignissim semper lectus. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Proin facilisis tellus nunc, quis posuere metus interdum sit amet. Vivamus congue nulla vitae erat dignissim, quis ullamcorper dolor rhoncus.
`;
export const AboutText = `
I love my work, but there's a lot of other things I love to do too. I think everyone has that one thing that just comes naturally to them, but how do you know you've found it if you haven't tried everything at least once? And so, I always strive to try new things. More than once I've surprised myself and ended up keeping hobbies I never imagined I'd be so passionate and committed to. Here's a snapshot of what you'll catch me doing when I'm not wrestling with lines of CSS or pulling out my hair over the ninth iteration of a wireframe.
`;

export const AboutHero =
  "Hi! I love parkour, acting, dancing, photography, origami, and a lot more than just my work.";

export const flowrInfo: WorkInfo[] = [
  { isLink: false, label: "Full Stack Designer & Developer", key: "" },
  { isLink: false, label: "Side Project", key: "" },
  { isLink: false, label: "January 2019 - Present", key: "" },
  { isLink: true, href: "", label: "View on Play Store", key: "" },
  { isLink: true, href: "", label: "View on GitHub", key: "" },
].map((item) => ({ ...item, key: `work-link-${item.isLink}-${item.label}` }));

export const manulifeInfo: WorkInfo[] = [
  { isLink: false, label: "UI/UX Designer", key: "" },
  { isLink: false, label: "Co-op", key: "" },
  { isLink: false, label: "September - May 2020", key: "" },
  {
    isLink: true,
    href: "https://apps.apple.com/ca/app/manulife-mobile/id1214009312",
    label: "View on App Store",
    key: "",
  },
].map((item) => ({ ...item, key: `work-link-${item.isLink}-${item.label}` }));

export const donovanyohanInfo: WorkInfo[] = [
  { isLink: false, label: "Full Stack", key: "" },
  { isLink: false, label: "Side Project", key: "" },
  { isLink: false, label: "January 2020 - Present", key: "" },
  { isLink: true, href: "https://donovanyohan.com", label: "donovanyohan.com", key: "" },
  {
    isLink: true,
    href: "https://github.com/donovan-yohan/donovanyohan",
    label: "View on GitHub",
    key: "",
  },
].map((item) => ({ ...item, key: `work-link-${item.isLink}-${item.label}` }));

export const shopdonovanyohanInfo: WorkInfo[] = [
  { isLink: false, label: "Full Stack", key: "" },
  { isLink: false, label: "Side Project", key: "" },
  { isLink: false, label: "December 2019 - Present", key: "" },
  { isLink: true, href: "shop.donovanyohan.com", label: "shop.donovanyohan.com", key: "" },
  {
    isLink: true,
    href: "github.com/donovan-yohan/shopdonovanyohan",
    label: "View on GitHub",
    key: "",
  },
].map((item) => ({ ...item, key: `work-link-${item.isLink}-${item.label}` }));

export const cooperatorsInfo: WorkInfo[] = [
  { isLink: false, label: "Software Developer", key: "" },
  { isLink: false, label: "Co-op", key: "" },
  { isLink: false, label: "January - September 2019", key: "" },
  {
    isLink: true,
    href: "https://apps.apple.com/ca/app/the-co-operators/id1203319537",
    label: "View on App Store",
    key: "",
  },
].map((item) => ({ ...item, key: `work-link-${item.isLink}-${item.label}` }));

export const typelineInfo: WorkInfo[] = [
  { isLink: false, label: "Full Stack", key: "" },
  { isLink: false, label: "Side Project", key: "" },
  { isLink: false, label: "September 2021 - Present", key: "" },
  {
    isLink: true,
    href: "https://typeline.donovanyohan.com",
    label: "typeline.donovanyohan.com",
    key: "",
  },
  {
    isLink: true,
    href: "https://github.com/donovan-yohan/typeline",
    label: "View on GitHub",
    key: "",
  },
].map((item) => ({ ...item, key: `work-link-${item.isLink}-${item.label}` }));

export const logos: Logo[] = [
  {
    label: "typeline",
    src: { light: "typeline.png" },
    invertForDarkMode: false,
    width: 30,
    key: "",
  },
  { label: "ichigo", src: { light: "ichigo.png" }, invertForDarkMode: false, width: 30, key: "" },
  {
    label: "candywebkin invitational",
    src: { light: "cwianimated.webm", poster: "cwi.png" },
    invertForDarkMode: false,
    width: 30,
    isVideo: true,
    key: "",
  },
  {
    label: "Wavelengths",
    src: { light: "wavelengths3.png" },
    invertForDarkMode: true,
    width: 35,
    key: "",
  },
  {
    label: "Wavelengths",
    src: { light: "wavelengths1.png" },
    invertForDarkMode: true,
    width: 30,
    key: "",
  },
  {
    label: "Wavelengths",
    src: { light: "wavelengths2.png" },
    invertForDarkMode: true,
    width: 30,
    key: "",
  },
  {
    label: "DJ Labrie",
    src: { light: "djlabrie.png", dark: "djlabrie-dark.png" },
    invertForDarkMode: false,
    width: 60,
    key: "",
  },
  { label: "Labrie", src: { light: "labrie.png" }, invertForDarkMode: true, width: 35, key: "" },
  {
    label: "Shakespearience",
    src: { light: "shakespearience.png" },
    invertForDarkMode: false,
    width: 75,
    key: "",
  },
  {
    label: "Science Olympics",
    src: { light: "scienceolympics.png" },
    invertForDarkMode: true,
    width: 20,
    key: "",
  },
  {
    label: "Just Parched",
    src: { light: "justparched.png" },
    invertForDarkMode: true,
    width: 35,
    key: "",
  },
  {
    label: "Lucid Nexus",
    src: { light: "lucidnexus.png", dark: "lucidnexus-dark.png" },
    invertForDarkMode: false,
    width: 60,
    key: "",
  },
  {
    label: "Aces Abroad English",
    src: { light: "aceseng.png" },
    invertForDarkMode: false,
    width: 22,
    key: "",
  },
  {
    label: "Aces Abroad English Solid",
    src: { light: "acesengsolid.png" },
    invertForDarkMode: true,
    width: 22,
    key: "",
  },
  {
    label: "Aces Abroad Chinese",
    src: { light: "aces.png" },
    invertForDarkMode: false,
    width: 22,
    key: "",
  },
  {
    label: "Aces Abroad Chinese Solid",
    src: { light: "acessolid.png" },
    invertForDarkMode: true,
    width: 22,
    key: "",
  },
  {
    label: "Golden Hacks",
    src: { light: "goldenhacks.png", dark: "goldenhacks-dark.png" },
    invertForDarkMode: false,
    width: 35,
    key: "",
  },
  {
    label: "Golden Hacks Banner",
    src: { light: "goldenhacksbanner.png", dark: "goldenhacksbanner-dark.png" },
    invertForDarkMode: false,
    width: 60,
    key: "",
  },
].map((logo) => ({ ...logo, key: `logo-${logo.label}-${logo.src.light}` }));

export const promotions: Logo[] = [
  {
    label: "CWI Promo",
    src: { light: "cwipromo.png" },
    invertForDarkMode: false,
    width: 33,
    key: "",
  },
  {
    label: "CWI Animated Promo",
    src: { light: "cwianimatedpromo.webm" },
    invertForDarkMode: false,
    width: 33,
    isVideo: true,
    key: "",
  },
  {
    label: "Competitive Programming",
    src: { light: "competitiveprogramming.jpg" },
    invertForDarkMode: false,
    width: 55,
    key: "",
  },
  {
    label: "PHI Discord",
    src: { light: "phidiscord.png" },
    invertForDarkMode: false,
    width: 40,
    key: "",
  },
  {
    label: "Golden Speakers President",
    src: { light: "goldenspeakers.jpg" },
    invertForDarkMode: false,
    width: 50,
    key: "",
  },
  {
    label: "ACE Ping Pong Poster",
    src: { light: "ace.png" },
    invertForDarkMode: false,
    width: 45,
    key: "",
  },
].map((promotion) => ({
  ...promotion,
  key: `promotion-${promotion.label}-${promotion.src.light}`,
}));

export const apparel: Logo[] = [
  { label: "Balance", src: { light: "balance.png" }, invertForDarkMode: false, width: 50, key: "" },
  { label: "Panther", src: { light: "panther.png" }, invertForDarkMode: false, width: 50, key: "" },
  {
    label: "Panther Press",
    src: { light: "press.png" },
    invertForDarkMode: false,
    width: 50,
    key: "",
  },
  { label: "Improv", src: { light: "improv.png" }, invertForDarkMode: false, width: 50, key: "" },
].map((shirt) => ({ ...shirt, key: `shirt-${shirt.label}-${shirt.src.light}` }));

export const graphicInfo: WorkInfo[] = [
  { isLink: false, label: "Visual Designer", key: "" },
  { isLink: false, label: "Freelance", key: "" },
  { isLink: false, label: "2014 - Present", key: "" },
].map((item) => ({ ...item, key: `work-link-${item.isLink}-${item.label}` }));

export default _empty;
