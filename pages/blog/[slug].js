import React from "react";
import { motion } from "framer-motion";
import ArticleHero from "../../components/articlehero";
import Article from "../../components/article";
import Main from "../../layouts/main";
import { blogPosts, getBlogPost } from "../../global/blog";

const BlogPost = ({ post }) => {
  if (!post) return null;

  return (
    <Main
      breadcrumbs={[
        { label: "Blog", href: "/blog" },
        { label: post.title, href: `/blog/${post.slug}` },
      ]}
    >
      <div className="pageRoot">
        <div className="pageContent">
          <motion.div
            className="heroWrap"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArticleHero
              title={post.title}
              image={post.image}
              bgColor="var(--background)"
              cover
              content={post.subtitle}
              info={[
                { key: `${post.slug}-date`, label: post.date, isLink: false },
                { key: `${post.slug}-back`, label: "Back to Blog", href: "/blog", isLink: true },
              ]}
            />
          </motion.div>

          {post.sections.map((section, index) => (
            <motion.div
              className="animatedArticle"
              key={`${post.slug}-${section.heading}-${index}`}
              whileHover={{ x: 4 }}
              transition={{ duration: 0.35, ease: [0.51, 0.07, 0.09, 0.95] }}
            >
              <Article>
                {index > 0 && <h2 id={section.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")} className="anchor"></h2>}
                <h2>
                  <span className="highlightStatic">{section.heading}</span>
                </h2>
                {section.paragraphs.map((paragraph) => (
                  <p className="body" key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="body tableOfContents">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </Article>
            </motion.div>
          ))}

          <div className="blogNav">
            <a href="/blog" className="highlight">Back to all articles</a>
          </div>
        </div>

        <style jsx>{`
          .blogNav {
            align-self: flex-start;
            margin-top: 64px;
            width: 100%;
          }

          .heroWrap,
          .animatedArticle {
            width: 100%;
          }
        `}</style>
      </div>
    </Main>
  );
};

export const getStaticPaths = () => ({
  paths: blogPosts.map((post) => ({ params: { slug: post.slug } })),
  fallback: false,
});

export const getStaticProps = ({ params }) => ({
  props: {
    post: getBlogPost(params.slug),
  },
});

export default BlogPost;
