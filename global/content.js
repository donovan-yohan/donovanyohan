const test = "";

export const HomeText = "Hi! I'm a UI & UX designer and a front end developer.";

export const flowrInfo = [{
        isLink: false,
        label: "Side project",
    },
    {
        isLink: false,
        label: "Collaborative",
    },
    {
        isLink: false,
        label: "January - October 2019",
    },
    {
        isLink: true,
        href: "",
        label: "View on Play Store",
    },
    {
        isLink: true,
        href: "",
        label: "View on GitHub",
    }
].map(project => {
    project.key = `work-link-${project.isLink}-${project.label}`;
    return project;
});

export default test;