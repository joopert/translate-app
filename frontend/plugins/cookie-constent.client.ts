import "vanilla-cookieconsent/dist/cookieconsent.css";
import * as CookieConsent from "vanilla-cookieconsent";
import type { CookieConsentConfig } from "vanilla-cookieconsent";

const config: CookieConsentConfig = {
  guiOptions: {
    consentModal: {
      layout: "box",
      position: "bottom right",
    },
    preferencesModal: {
      layout: "box",
    },
  },

  onFirstConsent: () => {
    console.log("onFirstAction fired");
  },

  onConsent: () => {
    console.log("onConsent fired ...");
  },

  onChange: () => {
    console.log("onChange fired ...");
  },

  categories: {
    necessary: {
      readOnly: true,
      enabled: true,
    },
    analytics: {
      enabled: true,
      autoClear: {
        cookies: [
          {
            name: /^(_ga|_gid)/,
          },
        ],
      },
    },
    ads: {},
  },

  language: {
    default: "en",

    translations: {
      en: {
        consentModal: {
          title: "Manage Your Cookie Preferences",
          description:
            "We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. Please select your preferences below to control how we use cookies on our website.",
          acceptAllBtn: "Accept",
          acceptNecessaryBtn: "Reject",
          showPreferencesBtn: "Manage preferences",
          footer: `
              <a href="/policies/privacy-policy">Privacy Policy</a>
              <a href="/policies/cookie-policy">Cookie Policy</a>
              <a href="/policies/terms-of-service">Terms of Service</a>
          `,
        },
        preferencesModal: {
          title: "Cookie preferences",
          acceptAllBtn: "Accept all",
          acceptNecessaryBtn: "Reject all",
          savePreferencesBtn: "Save preferences",
          sections: [
            {
              title: "Cookie usage",
              description:
                "We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. Please select your preferences below to control how we use cookies on our website.",
            },
            {
              title: "Strictly necessary cookies",
              description:
                "These cookies are essential for the website to function properly. They enable basic functions like page navigation, secure areas access, and remembering your preferences. The website cannot function properly without these cookies, and they cannot be disabled.",
              linkedCategory: "necessary",
            },
            {
              title: "Performance and analytics cookies",
              description:
                "These cookies collect information about how you use our website, such as which pages you visit most often and if you experience any errors. This data helps us improve our website's performance and user experience. All information these cookies collect is aggregated and anonymous.",
              linkedCategory: "analytics",
              cookieTable: {
                headers: {
                  name: "Cookie",
                  domain: "Domain",
                  desc: "Description",
                },
                body: [
                  {
                    name: "_ga",
                    domain: "yourdomain.com",
                    desc: "description ...",
                  },
                  {
                    name: "_gid",
                    domain: "yourdomain.com",
                    desc: "description ...",
                  },
                ],
              },
            },
            {
              title: "Advertisement and targeting cookies",
              description:
                "These cookies are used to deliver advertisements more relevant to you and your interests. They are also used to limit the number of times you see an advertisement as well as help measure the effectiveness of advertising campaigns. They remember that you have visited a website and this information may be shared with other organizations such as advertisers.",
              linkedCategory: "ads",
            },
            {
              title: "More information",
              description:
                'For any queries in relation to our policy on cookies and your choices, please <a class="cc__link" href="mailto:ruben@joober.com">contact me</a>.',
            },
          ],
        },
      },
    },
  },
};

export default defineNuxtPlugin(async () => {
  await CookieConsent.run(config);

  return {
    provide: {
      CC: CookieConsent,
    },
  };
});
