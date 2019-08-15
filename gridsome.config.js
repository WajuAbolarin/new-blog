class TailwindExtractor {
  static extract(content) {
    return content.match(/[A-Za-z0-9-_:\/]+/g) || [];
  }
}

module.exports = {
  siteName: "Waju - Strong opinions, weakly held",
  siteDescription:
    "Personal blog of Abolarin Olanrewaju Olabode, Software Engineer. I share my strong opinions on Javascript, Vue Js, I also share some of my thoughts, wishes and resources too. welcome.",
  siteUrl: "https://olanrewaju.com.ng",
  titleTemplate: `%s | Waju`,
  icon: "src/favicon.png",

  transformers: {
    remark: {
      externalLinksTarget: "_blank",
      externalLinksRel: ["nofollow", "noopener", "noreferrer"],
      plugins: [
        [
          "gridsome-plugin-remark-shiki",
          {
            theme: "min-dark"
          }
        ]
      ]
    }
  },

  plugins: [
    {
      use: "@gridsome/source-filesystem",
      options: {
        path: "content/posts/**/*.md",
        typeName: "Post",
        route: "/:slug",
        refs: {
          tags: {
            typeName: "Tag",
            route: "/tag/:id",
            create: true
          },
          author: {
            typeName: "Author",
            route: "/author/:id",
            create: true
          }
        }
      }
    },
    {
      use: "@gridsome/plugin-google-analytics",
      options: {
        id: "UA-145243170-1"
      }
    },
    {
      use: "@gridsome/plugin-sitemap",
      options: {
        cacheTime: 600000 // default
      }
    },
    {
      use: "gridsome-plugin-rss",
      options: {
        contentTypeName: "Post",
        feedOptions: {
          title: "Waju - Strong opinions, weakly held",
          feed_url: "https://olanrewaju.com.ng/feed.xml",
          site_url: "https://olanrewaju.com.ng"
        },
        feedItemOptions: node => ({
          title: node.title,
          description: node.description,
          url: "https://olanrewaju.com.ng/" + node.slug,
          author: node.author,
          date: node.date
        }),
        output: {
          dir: "./static",
          name: "feed.xml"
        }
      }
    }
  ],

  chainWebpack: config => {
    config.module
      .rule("css")
      .oneOf("normal")
      .use("postcss-loader")
      .tap(options => {
        options.plugins.unshift(
          ...[
            require("postcss-import"),
            require("postcss-nested"),
            require("tailwindcss")
          ]
        );

        if (process.env.NODE_ENV === "production") {
          options.plugins.push(
            ...[
              require("@fullhuman/postcss-purgecss")({
                content: ["src/assets/**/*.css", "src/**/*.vue", "src/**/*.js"],
                extractors: [
                  {
                    extractor: TailwindExtractor,
                    extensions: ["css", "vue", "js"]
                  }
                ],
                whitelistPatterns: [/shiki/]
              })
            ]
          );
        }

        return options;
      });
  }
};
