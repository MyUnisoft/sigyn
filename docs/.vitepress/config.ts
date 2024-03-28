import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Sigyn",
  description: "Grafana Loki Alerting Agent",
  themeConfig: {
    nav: [
      { text: 'Agent', link: '/agent/installation', activeMatch: '^/agent/' },
      { text: 'Config', link: '/config/index', activeMatch: '^/config/' },
      { 
        text: "Utils", 
        items: [
          { text: 'Logql', link: '/logql/installation', activeMatch: '^/logql/' },
          { text: 'Morphix', link: '/morphix/installation', activeMatch: '^/morphix/' },
          { text: 'Pattern', link: '/pattern/installation', activeMatch: '^/pattern/' },
        ]
      },
      {
        text: "Notifiers",
        items: [
          { text: 'Notifiers', link: '/notifiers/installation', activeMatch: '^/notifiers/' },
          { text: 'Discord', link: '/discord/installation', activeMatch: '^/discord/' },
          { text: 'Slack', link: '/slack/installation', activeMatch: '^/slack/' },
          { text: 'Teams', link: '/teams/installation', activeMatch: '^/teams/' },
        ]
      }
    ],
    search: {
      provider: 'local',
    },
    sidebar: {
      "/agent": [
        {
          text: "Agent",
          items: [
            {
              text: "Installation",
              link: "/agent/installation"
            },
            {
              text: "Getting Started",
              link: "/agent/getting-started"
            },
            {
              text: "API",
              link: "/agent/api"
            },
            {
              text: "Advanced tips",
              items: [
                { text: "Testing", link: "/agent/testing" }
              ]
            }
          ]
        }
      ],
      "/config": [
        {
          text: "Config",
          items: [
            {
              text: "Overview",
              link: "/config/",
            },
            {
              text: "Rules",
              link: "/config/rules"
            },
            {
              text: "Templates",
              link: "/config/templates"
            },
            {
              text: "Composite Rules",
              link: "/config/composite-rules"
            },
            {
              text: "Self Monitoring",
              link: "/config/self-monitoring"
            },
            {
              text: "Templates",
              link: "/config/templates"
            },
            {
              text: "Throttle",
              link: "/config/throttle"
            },
          ]
        },
        {
          text: "API",
          link: "/config/api"
        },
        {
          text: "Interfaces",
          link: "/config/interfaces"
        },
        {
          text: "Advanced",
          items: [
            {
              text: "JSON Schema",
              link: "/config/json-schema"
            }
          ]
        }
      ],
      "/logql": [
        {
          text: "Logql",
          items: [
            {
              text: "Installation",
              link: "/logql/installation"
            },
            {
              text: "Usage",
              link: "/logql/usage"
            },
            {
              text: "API",
              items: [
                {
                  text: "Logql",
                  link: "/logql/LogQL"
                },
                {
                  text: "Stream Selector",
                  link: "/logql/StreamSelector"
                },
                {
                  text: "Line Filters",
                  link: "/logql/LineFilters"
                },
                {
                  text: "Label Filters",
                  link: "/logql/LabelFilters"
                },
                {
                  text: "Parser Expression",
                  link: "/logql/ParserExpression"
                }
              ]
            }
          ]
        }
      ],
      "/morphix": [
        {
          text: "Installation",
          link: "/morphix/installation"
        },
        {
          text: "Usage",
          link: "/morphix/usage"
        },
        {
          text: "API",
          link: "/morphix/api"
        },
        {
          text: "Functions",
          link: "/morphix/functions"
        },
      ],
      "/pattern": [
        {
          text: "Installation",
          link: "/pattern/installation"
        },
        {
          text: "Usage",
          link: "/pattern/usage"
        },
        {
          text: "API",
          items: [
            {
              text: "Pattern",
              link: "/pattern/Pattern"
            },
            {
              text: "NoopPattern",
              link: "/pattern/NoopPattern"
            },
            {
              text: "Shape",
              link: "/pattern/shape"
            }
          ]
        },
      ],
      "/discord": [
        {
          text: "Installation",
          link: "/discord/installation"
        },
        {
          text: "Usage",
          link: "/discord/usage"
        }
      ],
      "/slack": [
        {
          text: "Installation",
          link: "/slack/installation"
        },
        {
          text: "Usage",
          link: "/slack/usage"
        }
      ],
      "/teams": [
        {
          text: "Installation",
          link: "/teams/installation"
        },
        {
          text: "Usage",
          link: "/teams/usage"
        }
      ],
      "/notifiers": [
        {
          text: "Installation",
          link: "/notifiers/installation"
        },
        {
          text: "Usage",
          link: "/notifiers/usage"
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/MyUnisoft/sigyn/' }
    ]
  },
  base: "/sigyn/",
  rewrites: {
    ":pkg/docs/(.*)": ":pkg/(.*)"
  },
  srcDir: '../src',
  // there is a false positive dead link in /logql/ParserExpression
  ignoreDeadLinks: true
})
