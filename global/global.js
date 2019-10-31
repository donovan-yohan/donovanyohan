const links = [{
        href: "",
        label: "Work"
    },
    {
        href: "",
        label: "Process"
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

export const MobileWidth = 1025;

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