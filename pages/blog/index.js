import React from "react";
import { motion } from "framer-motion";
import ArticleHero from "../../components/articlehero";
import Main from "../../layouts/main";
import { blogPosts, latestPost } from "../../global/blog";

const ease = [0.51, 0.07, 0.09, 0.95];

const Blog = () => {
  return (
    <Main breadcrumbs={[{ label: "Blog", href: "/blog" }]}>
      <div className="pageRoot">
        <div className="pageContent blogContent">
          <motion.div
            className="heroWrap"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArticleHero
              title="Blog"
              image={latestPost.image}
              bgColor="var(--background)"
              cover
              content={`“${latestPost.quote}”`}
              info={[
                { key: "latest-label", label: "Latest article", isLink: false },
                { key: "latest-date", label: latestPost.date, isLink: false },
                {
                  key: "latest-link",
                  label: `Read ${latestPost.title}`,
                  href: `/blog/${latestPost.slug}`,
                  isLink: true,
                },
              ]}
            />
          </motion.div>

          <section className="postList" aria-label="Blog articles">
            {blogPosts.map((post) => (
              <motion.article
                className="postCard"
                key={post.slug}
                whileHover={{ x: 8 }}
                transition={{ duration: 0.35, ease }}
              >
                <a href={`/blog/${post.slug}`}>
                  <motion.img
                    src={post.image}
                    alt=""
                    whileHover={{ scale: 1.025 }}
                    transition={{ duration: 0.45, ease }}
                  />
                  <div className="postCopy">
                    <span className="date">{post.date}</span>
                    <h2>{post.title}</h2>
                    <p className="body">{post.subtitle}</p>
                    <span className="highlight readLink">Read article</span>
                  </div>
                </a>
              </motion.article>
            ))}
          </section>
        </div>

        <style jsx>{`
          .blogContent {
            align-items: stretch;
          }

          .heroWrap {
            position: relative;
          }


          .postList {
            display: flex;
            flex-direction: column;
            gap: 32px;
            margin-top: 48px;
            width: 100%;
          }

          :global(.postCard) a {
            border-top: 1px solid var(--border);
            color: var(--main);
            display: grid;
            gap: 32px;
            grid-template-columns: minmax(220px, 36%) 1fr;
            padding-top: 32px;
            text-decoration: none;
          }

          :global(.postCard) img {
            background: var(--disabled);
            height: 220px;
            object-fit: cover;
            overflow: hidden;
            width: 100%;
          }

          .postCopy {
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          .date {
            color: var(--gray);
            font-family: "Roboto", sans-serif;
            font-size: 13px;
            font-weight: bold;
            letter-spacing: 0.1em;
            margin-bottom: 12px;
            text-transform: uppercase;
          }

          h2 {
            margin: 0 0 12px;
          }

          p {
            margin: 0 0 24px;
          }

          .readLink {
            width: fit-content;
          }

          @media only screen and (max-width: 767px) {
            .animationEcho {
              display: none;
            }

            :global(.postCard) a {
              display: flex;
              flex-direction: column;
              gap: 16px;
            }

            :global(.postCard) img {
              height: 180px;
            }
          }
        `}</style>
      </div>
    </Main>
  );
};

export default Blog;
