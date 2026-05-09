import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import BlogHero from "../../components/bloghero";
import Article from "../../components/article";
import Main from "../../layouts/main";
import { blogPosts, getBlogPost } from "../../global/blog";

const getSectionId = (heading) => heading.toLowerCase().replace(/[^a-z0-9]+/g, "-");

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
          <BlogHero
            eyebrow="Article"
            title={post.title}
            date={post.date}
            quote={`“${post.quote}”`}
            image={post.image}
            imageAlt={post.visualAlt}
            linkHref="/blog"
            linkLabel="Back to all articles"
          />

          {post.sections.map((section, index) => (
            <motion.div
              className="animatedArticle"
              key={`${post.slug}-${section.heading}-${index}`}
              whileHover={{ x: 4 }}
              transition={{ duration: 0.35, ease: [0.51, 0.07, 0.09, 0.95] }}
            >
              <Article>
                <h2 id={index > 0 ? getSectionId(section.heading) : undefined}>
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
            <Link href="/blog" className="highlight">Back to all articles</Link>
          </div>
        </div>

        <style jsx>{`
          .blogNav {
            align-self: flex-start;
            margin-top: 64px;
            width: 100%;
          }

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
