const links = [
  {
    href: "/#work",
    label: "Work",
    icon: "",
  },
  {
    href: "/about",
    label: "About",
    icon: "",
  },
].map((link) => {
  link.key = `nav-link-${link.href}-${link.label}`;
  return link;
});

export default links;

export const socialLinks = [
  {
    href: "https://www.instagram.com/donovan.yohan/",
    label: "Instagram",
    icon: "",
  },
  {
    href: "https://www.linkedin.com/in/donovan-yohan/",
    label: "LinkedIn",
    icon: "",
  },
  {
    href: "https://github.com/donovan-yohan",
    label: "Github",
    icon: "",
  },
  {
    href: "https://www.behance.net/donovanyohan",
    label: "Behance Graphic Design",
    icon: "",
  },
  {
    href: "https://www.youtube.com/donovanyohan",
    label: "YouTube Motion Graphics",
    icon: "",
  },
].map((socialLink) => {
  socialLink.key = `nav-link-${socialLink.href}-${socialLink.label}`;
  return socialLink;
});

export const projects = [
  {
    src: [
      "",
      "img/photos/cards/typeline/typeline10.png",
      "img/photos/cards/typeline/typeline20.png",
      "img/photos/cards/typeline/typeline30.png",
    ],
    href: "/work/typeline",
    label: "typeline Typing Test",
    date: "Full-stack • Side Project • Fall 2021",
    content:
      "A typing test designed and developed to encourage and reward consistency and flow in typing through animation and interaction design.",
    disabled: false,
    bgColor: "#1967FF",
  },
  {
    src: ["", "img/photos/liquidgradient.jpg"],
    href: "http://callcentreguys.com",
    label: "Three.js Liquid Gradient",
    date: "Front-end • Contract • Fall 2020",
    content:
      "I learned GLSL and Three.js to build a unique and eye-catching liquid gradient for the Call Centre Guys, focusing on performance and compatability across devices.",
    disabled: false,
    isExternal: true,
  },
  {
    src: [
      "",
      "img/photos/cards/manulife/manulife00.png",
      "img/photos/cards/manulife/manulife10.png",
    ],
    href: "/work/manulife",
    label: "Manulife Mobile",
    date: "UI/UX • Co-op • Fall 2019",
    content:
      "At Manulife, I worked as a Mobile UI/UX designer, and had the opportunity to bring user-centered design to a diverse team in a very large fin-tech corporation.",
    disabled: false,
    bgColor: "#00AB5B",
  },
  {
    src: [
      "img/photos/cards/donovanyohan/dy00.png",
      "img/photos/cards/donovanyohan/dy10.png",
      "img/photos/cards/donovanyohan/dy20.png",
    ],
    darksrc: [
      "img/photos/cards/donovanyohan/dydark00.png",
      "img/photos/cards/donovanyohan/dydark10.png",
      "img/photos/cards/donovanyohan/dydark20.png",
    ],
    href: "/work/donovanyohan",
    label: "donovanyohan.com",
    date: "Full Stack • Side Project • Fall 2019",
    content:
      "How do you design something that's never really finished? In my approach, I carefully designed the problem before creating my solution.",
    disabled: false,
  },
  {
    src: [
      "",
      "img/photos/cards/webstore/webstore00.png",
      "img/photos/cards/webstore/webstore10.png",
      "img/photos/cards/webstore/webstore20.png",
    ],
    href: "/work/webstore",
    label: "Webstore Project",
    date: "Full Stack • Side Project • Winter 2020",
    content:
      "A school project where I designed the UI and UX for a responsive webstore from the ground up through research. I also helped develop the React front-end.",
    disabled: true,
    bgColor: "#FFFFFF",
  },
  {
    src: [
      "",
      "img/photos/cards/cooperators/coop00.png",
      "img/photos/cards/cooperators/coop10.png",
    ],
    href: "/work/cooperators",
    label: "The Co-operators Mobile",
    date: "Developer • Co-op • Winter 2019",
    content:
      "As a software engineer, I worked closely with the UX team to build reusable components and line-up the grid systems being used in Sketch with the layouts of our app.",
    disabled: true,
    bgColor: "#FFFFFF",
  },
  {
    src: [
      "",
      "img/photos/cards/flowr/flowr00.png",
      "img/photos/cards/flowr/flowr10.png",
    ],
    href: "/work/flowr",
    label: "flowr",
    date: "UI/UX Concept • Side Project • Spring 2019",
    content:
      "Part passion project, part I-had-to-do-this-because-my-GPA-would-suffer-if-I-didn't, flowr is a mobile time management tool that focuses on students, and their pain points with existing digital calendars.",
    disabled: true,
    bgColor: "#63C3AC",
  },
  {
    src: [
      "img/photos/cards/graphicdesign/graphic00.png",
      "",
      "img/photos/cards/graphicdesign/graphic10.png",
    ],
    darksrc: [
      "img/photos/cards/graphicdesign/graphicdark00.png",
      "",
      "img/photos/cards/graphicdesign/graphicdark10.png",
    ],
    href: "/work/graphicdesign",
    label: "Freelance Graphic Design",
    date: "Various Mediums • 2014 - Present",
    content:
      "See some examples of various visual designs I've worked on for various companies, clients, clubs, and projects, including logo designs, promotional material, and presentations.",
    disabled: false,
  },
].map((project) => {
  project.key = `nav-link-${project.href}-${project.label}`;
  return project;
});

export const hobbies = [
  {
    src: ["img/photos/photography.jpg"],
    href: "https://www.instagram.com/donovan.yohan/",
    label: "Photography",
    date: "2018 - Present",
    content:
      "I started photography to learn more about composition theory. Aside from being incredibly fun, photography has helped me become a more resourceful and creative designer.",
    disabled: false,
    isExternal: true,
  },
  {
    src: ["img/photos/origami.jpg"],
    href: "/about/origami",
    label: "Origami",
    date: "2010 - Present",
    content:
      "When teachers take away your toys in class, play with something they can't take away-- paper. What may have started as a joke is now one of my favourite hobbies and pass-times, and makes great gifts too!",
    disabled: true,
  },
  {
    src: ["img/photos/parkour.png"],
    href: "",
    label: "Parkour & Gymnastics",
    date: "2010 - Present",
    content:
      "Staying in shape shouldn't have to be a chore, and it doesn't have to be, but it can be a job. I'm a parkour & tricking coach, but what even is 'parkour' and 'tricking,' and how do you even start?",
    disabled: true,
  },
  {
    src: ["img/photos/acting.png"],
    href: "",
    label: "Acting & Theatre",
    date: "2006 - Present",
    content:
      "My parents told me that I never stopped talking when I was a kid, so they put me on a stage and made other people listen too. Over the years I discovered my love for public speaking and Shakespeare!",
    disabled: true,
    bgColor: "#A6CE39",
  },
  {
    src: ["img/photos/dance.jpg"],
    href: "",
    label: "Dance",
    date: "2018 - Present",
    content:
      "Since starting university, I've been challenging myself to step out of my comfort zone and explore the hobbies I've been intersted in but always too scared to try. For dance, I am so glad that I did.",
    disabled: true,
  },
].map((hobby) => {
  hobby.key = `nav-link-${hobby.href}-${hobby.label}`;
  return hobby;
});

export const MobileWidth = 1024;

export function debounce(fn, ms) {
  let timer;
  return (_) => {
    clearTimeout(timer);
    timer = setTimeout((_) => {
      timer = null;
      fn.apply(this, arguments);
    }, ms);
  };
}
