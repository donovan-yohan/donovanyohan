const links = [{
        href: "",
        label: "Work"
    },
    {
        href: "/about",
        label: "About"
    },
    {
        href: "",
        label: "Contact"
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
        href: "",
        label: "Manulife Mobile",
        date: "Fall 2019",
        content: "",
    },
    {
        href: "/work/flowr",
        label: "flowr",
        date: "Fall 2019",
        content: "",
    },
    {
        href: "",
        label: "donovanyohan.com",
        date: "Fall 2019",
        content: "",
    },
    {
        href: "",
        label: "Cooperators Mobile App",
        date: "Winter 2019",
        content: "",
    }
].map(project => {
    project.key = `nav-link-${project.href}-${project.label}`;
    return project;
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
};