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

export default test;