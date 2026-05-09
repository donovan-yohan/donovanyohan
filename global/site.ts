export const siteMetadata = {
  title: "Donovan Yohan - UI/UX Designer & Web Developer",
  description: "Hi, I'm Donovan Yohan! I'm a UI & UX designer and a full stack developer.",
  url: "https://donovanyohan.com",
  ogImagePath: "/ogimage.jpg",
  themeColor: "#FFFFFF",
};

export const getAbsoluteSiteUrl = (path = "") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteMetadata.url}${normalizedPath}`;
};
