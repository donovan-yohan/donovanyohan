const links = [{
    href: "/#work",
    label: "Work"
  },
  {
    href: "/about",
    label: "About"
  }
].map(link => {
  link.key = `nav-link-${link.href}-${link.label}`;
  return link;
});

export default links;

export const socialLinks = [{
    href: "https://www.instagram.com/donovan.yohan/",
    label: "Instagram",
    icon: "/img/icons/instagram.svg"
  },
  {
    href: "https://www.linkedin.com/in/donovan-yohan/",
    label: "LinkedIn",
    icon: "/img/icons/linkedin.svg"
  },
  {
    href: "https://github.com/donovan-yohan",
    label: "Github",
    icon: "/img/icons/github.svg"
  },
  {
    href: "https://www.behance.net/donovanyohan",
    label: "Behance Graphic Design",
    icon: "/img/icons/behance.svg"
  },
  {
    href: "https://www.youtube.com/donovanyohan",
    label: "YouTube Motion Graphics",
    icon: "/img/icons/youtube.svg"
  }
].map(socialLink => {
  socialLink.key = `nav-link-${socialLink.href}-${socialLink.label}`;
  return socialLink;
});

export const projects = [{
    src: "img/photos/manulife.jpg",
    href: "/work/manulife",
    label: "Manulife Mobile",
    date: "UI/UX • Co-op • Fall 2019",
    content: "At Manulife, I worked as a Mobile UI/UX designer, and had the opportunity to bring user-centered design to a diverse team in a very large fin-tech corporation.",
    disabled: false
  },
  {
    src: "img/photos/donovanyohancom.jpg",
    href: "/work/donovanyohan",
    label: "donovanyohan.com",
    date: "Full Stack • Side Project • Fall 2019",
    content: "How do you design something that's never really finished? In my approach, I carefully designed the problem before creating my solution.",
    disabled: false
  },
  {
    src: "img/photos/webstore.jpg",
    href: "/work/webstore",
    label: "Webstore Project",
    date: "Full Stack • Side Project • Winter 2020",
    content: "A school project where I designed the UI and UX for a responsive webstore from the ground up through research. I also helped develop the React front-end.",
    disabled: true
  },
  {
    src: "img/photos/cooperators.jpg",
    href: "/work/cooperators",
    label: "The Co-operators Mobile",
    date: "Developer • Co-op • Winter 2019",
    content: "As a software engineer, I worked closely with the UX team to build reusable components and line-up the grid systems being used in Sketch with the layouts of our app.",
    disabled: true
  },
  {
    src: "img/photos/flowr.jpg",
    href: "/work/flowr",
    label: "flowr",
    date: "UI/UX Concept • Side Project • Spring 2019",
    content: "Part passion project, part I-had-to-do-this-because-my-GPA-would-suffer-if-I-didn't, flowr is a mobile time management tool that focuses on students, and their pain points with existing digital calendars.",
    disabled: true
  }
].map(project => {
  project.key = `nav-link-${project.href}-${project.label}`;
  return project;
});

export const hobbies = [{
    src: "img/photos/photography.jpg",
    href: "https://www.instagram.com/donovan.yohan/",
    label: "Photography",
    date: "2018 - Present",
    content: "I started photography to learn more about composition theory. Aside from being incredibly fun, photography has helped me become a more resourceful and creative designer.",
    disabled: false
  }, {
    src: "img/photos/origami.jpg",
    href: "",
    label: "Origami",
    date: "2010 - Present",
    content: "When teachers take away your toys in class, play with something they can't take away-- paper. What may have started as a joke is now one of my favourite hobbies and pass-times, and makes great gifts too!",
    disabled: false
  },
  {
    src: "img/photos/parkour.png",
    href: "",
    label: "Parkour & Gymnastics",
    date: "2010 - Present",
    content: "Staying in shape shouldn't have to be a chore, and it doesn't have to be, but it can be a job. I'm a parkour & tricking coach, but what even is 'parkour' and 'tricking,' and how do you even start?",
    disabled: true
  },
  {
    src: "img/photos/acting.png",
    href: "",
    label: "Acting & Theatre",
    date: "2006 - Present",
    content: "My parents told me that I never stopped talking when I was a kid, so they put me on a stage and made other people listen too. Over the years I discovered my love for public speaking and Shakespeare!",
    disabled: true
  },
  {
    src: "img/photos/dance.jpg",
    href: "",
    label: "Dance",
    date: "2018 - Present",
    content: "Since starting university, I've been challenging myself to step out of my comfort zone and explore the hobbies I've been intersted in but always too scared to try. For dance, I am so glad that I did.",
    disabled: true
  }
].map(hobby => {
  hobby.key = `nav-link-${hobby.href}-${hobby.label}`;
  return hobby;
});

export const MobileWidth = 1024;

export function debounce(fn, ms) {
  let timer;
  return _ => {
    clearTimeout(timer);
    timer = setTimeout(_ => {
      timer = null;
      fn.apply(this, arguments);
    }, ms);
  };
}