const test = "";
export const HomeAboutText = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse eu sapien at eros ultrices volutpat ut sed orci. Duis ut ex nunc. Ut ligula turpis, lobortis a augue in, dignissim semper lectus. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Proin facilisis tellus nunc, quis posuere metus interdum sit amet. Vivamus congue nulla vitae erat dignissim, quis ullamcorper dolor rhoncus. 
`;
export const AboutText = `
I love my work, but there’s a lot of other things I love to do too. I think everyone has that one thing that just comes naturally to them, but how do you know you’ve found it if you haven’t tried everything at least once? And so, I always strive to try new things. More than once I’ve surprised myself and ended up keeping hobbies I never imagined I’d be so passionate and committed to. Here’s a snapshot of what you’ll catch me doing when I’m not wrestling with lines of CSS or pulling out my hair over the ninth iteration of a wireframe.
`;

export const AboutHero =
  "Hi! I love parkour, acting, dancing, photography, origami, and a lot more than just my work.";

export const flowrInfo = [{
    isLink: false,
    label: "Full Stack Designer & Developer"
  },
  {
    isLink: false,
    label: "Side Project"
  },
  {
    isLink: false,
    label: "January 2019 - Present"
  },
  {
    isLink: true,
    href: "",
    label: "View on Play Store"
  },
  {
    isLink: true,
    href: "",
    label: "View on GitHub"
  }
].map(project => {
  project.key = `work-link-${project.isLink}-${project.label}`;
  return project;
});

export const manulifeInfo = [{
    isLink: false,
    label: "UI/UX Designer"
  },
  {
    isLink: false,
    label: "Co-op"
  },
  {
    isLink: false,
    label: "September - May 2020"
  },
  {
    isLink: true,
    href: "https://apps.apple.com/ca/app/manulife-mobile/id1214009312",
    label: "View on App Store"
  }
].map(project => {
  project.key = `work-link-${project.isLink}-${project.label}`;
  return project;
});

export const donovanyohanInfo = [{
    isLink: false,
    label: "Full Stack"
  },
  {
    isLink: false,
    label: "Side Project"
  },
  {
    isLink: false,
    label: "January 2020 - Present"
  },
  {
    isLink: true,
    href: "https://donovanyohan.com",
    label: "donovanyohan.com"
  },
  {
    isLink: true,
    href: "https://github.com/donovan-yohan/donovanyohan",
    label: "View on GitHub"
  }
].map(project => {
  project.key = `work-link-${project.isLink}-${project.label}`;
  return project;
});

export const shopdonovanyohanInfo = [{
    isLink: false,
    label: "Full Stack"
  },
  {
    isLink: false,
    label: "Side Project"
  },
  {
    isLink: false,
    label: "December 2019 - Present"
  },
  {
    isLink: true,
    href: "shop.donovanyohan.com",
    label: "shop.donovanyohan.com"
  },
  {
    isLink: true,
    href: "github.com/donovan-yohan/shopdonovanyohan",
    label: "View on GitHub"
  }
].map(project => {
  project.key = `work-link-${project.isLink}-${project.label}`;
  return project;
});

export const cooperatorsInfo = [{
    isLink: false,
    label: "Software Developer"
  },
  {
    isLink: false,
    label: "Co-op"
  },
  {
    isLink: false,
    label: "January - September 2019"
  },
  {
    isLink: true,
    href: "https://apps.apple.com/ca/app/the-co-operators/id1203319537",
    label: "View on App Store"
  }
].map(project => {
  project.key = `work-link-${project.isLink}-${project.label}`;
  return project;
});

export const logos = [{
    label: "DJ Labrie",
    src: {
      light: "djlabrie.png",
      dark: "djlabrie-dark.png"
    },
    invertForDarkMode: false,
    width: 60
  },
  {
    label: "Labrie",
    src: {
      light: "labrie.png",
    },
    invertForDarkMode: true,
    width: 35
  },
  {
    label: "Shakespearience",
    src: {
      light: "shakespearience.png",
    },
    invertForDarkMode: false,
    width: 75
  },
  {
    label: "Science Olympics",
    src: {
      light: "scienceolympics.png",
    },
    invertForDarkMode: true,
    width: 20
  },
  {
    label: "Just Parched",
    src: {
      light: "justparched.png",
    },
    invertForDarkMode: true,
    width: 35
  },
  {
    label: "Lucid Nexus",
    src: {
      light: "lucidnexus.png",
      dark: "lucidnexus-dark.png",
    },
    invertForDarkMode: false,
    width: 60
  },
  {
    label: "Aces Abroad English",
    src: {
      light: "aceseng.png",
    },
    invertForDarkMode: false,
    width: 22
  },
  {
    label: "Aces Abroad English Solid",
    src: {
      light: "acesengsolid.png",
    },
    invertForDarkMode: true,
    width: 22
  },
  {
    label: "Aces Abroad Chinese",
    src: {
      light: "aces.png",
    },
    invertForDarkMode: false,
    width: 22
  },
  {
    label: "Aces Abroad Chinese Solid",
    src: {
      light: "acessolid.png",
    },
    invertForDarkMode: true,
    width: 22
  },
  {
    label: "Golden Hacks",
    src: {
      light: "goldenhacks.png",
      dark: "goldenhacks-dark.png"
    },
    invertForDarkMode: false,
    width: 35
  },
  {
    label: "Golden Hacks Banner",
    src: {
      light: "goldenhacksbanner.png",
      dark: "goldenhacksbanner-dark.png"
    },
    invertForDarkMode: false,
    width: 60
  },
].map(logo => {
  logo.key = `logo-${logo.label}-${logo.src.light}`;
  return logo;
});

export const promotions = [{
  label: "Competitive Programming",
  src: {
    light: "competitiveprogramming.jpg",
  },
  invertForDarkMode: false,
  width: 55
},
{
  label: "PHI Discord",
  src: {
    light: "phidiscord.png",
  },
  invertForDarkMode: false,
  width: 40
},
{
  label: "Golden Speakers President",
  src: {
    light: "goldenspeakers.jpg",
  },
  invertForDarkMode: false,
  width: 50
},
{
  label: "ACE Ping Pong Poster",
  src: {
    light: "ace.png",
  },
  invertForDarkMode: false,
  width: 45
},
].map(promotion => {
promotion.key = `promotion-${promotion.label}-${promotion.src.light}`;
return promotion;
});

export const apparel = [{
  label: "Balance",
  src: {
    light: "balance.png",
  },
  invertForDarkMode: false,
  width: 50
},
{
  label: "Panther",
  src: {
    light: "panther.png",
  },
  invertForDarkMode: false,
  width: 50
},
{
  label: "Panther Press",
  src: {
    light: "press.png",
  },
  invertForDarkMode: false,
  width: 50
},
{
  label: "Improv",
  src: {
    light: "improv.png",
  },
  invertForDarkMode: false,
  width: 50
},
].map(shirt => {
shirt.key = `shirt-${shirt.label}-${shirt.src.light}`;
return shirt;
});

export const graphicInfo = [{
    isLink: false,
    label: "Visual Designer"
  },
  {
    isLink: false,
    label: "Freelance"
  },
  {
    isLink: false,
    label: "2014 - Present"
  }
].map(project => {
  project.key = `work-link-${project.isLink}-${project.label}`;
  return project;
});

export default test;