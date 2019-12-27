const test = "";
export const HomeAboutText=`
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse eu sapien at eros ultrices volutpat ut sed orci. Duis ut ex nunc. Ut ligula turpis, lobortis a augue in, dignissim semper lectus. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Proin facilisis tellus nunc, quis posuere metus interdum sit amet. Vivamus congue nulla vitae erat dignissim, quis ullamcorper dolor rhoncus. 
`
export const AboutText=`
I love my work, but there’s a lot of other things I love to do too. I think everyone has that one thing that just comes naturally to them, but how do you know you’ve found it if you haven’t tried everything at least once? And so, I always strive to try new things. More than once I’ve surprised myself and ended up keeping hobbies I never imagined I’d be so passionate and committed to. Here’s a snapshot of what you’ll catch me doing when I’m not wrestling with lines of CSS or pulling out my hair over the ninth iteration of a wireframe.
`

export const AboutHero="Hi! I love parkour, acting, dancing, photography, origami, and a lot more than just my work."

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

export const manulifeInfo = [{
    isLink: false,
    label: "Co-op Term",
},
{
    isLink: false,
    label: "Collaborative",
},
{
    isLink: false,
    label: "September - December 2019",
},
{
    isLink: true,
    href: "https://apps.apple.com/ca/app/manulife-mobile/id1214009312",
    label: "View on App Store",
}

].map(project => {
project.key = `work-link-${project.isLink}-${project.label}`;
return project;
});
export default test;