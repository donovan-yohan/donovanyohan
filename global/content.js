const test = "";

export const AboutText="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam porta pharetra laoreet. Quisque ut vulputate sem, id aliquam turpis. Pellentesque a mauris quis velit aliquam placerat et ac nisi. Sed nec sollicitudin quam. Integer ac varius odio. Nam a urna justo. Vestibulum varius ullamcorper elit facilisis tincidunt."

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