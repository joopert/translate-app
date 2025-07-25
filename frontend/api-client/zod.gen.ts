// This file is auto-generated by @hey-api/openapi-ts

import { z } from 'zod';

/**
 * AbTestingLabel
 */
export const zAbTestingLabel = z.object({
  type: z.literal('abTesting'),
  variants: z.array(z.string()),
});

/**
 * HardcodedLabel
 */
export const zHardcodedLabel = z.object({
  type: z.literal('hardcoded'),
  value: z.string(),
});

/**
 * ContextualLabel
 */
export const zContextualLabel = z.object({
  type: z.literal('contextual'),
  fallbackLabel: z.string(),
});

/**
 * ButtonPosition
 */
export const zButtonPosition = z.object({
  horizontal: z.enum(['left', 'center', 'right']),
  vertical: z.enum(['top', 'bottom']),
  offsetX: z.string(),
  offsetY: z.string(),
});

/**
 * ButtonConfig
 */
export const zButtonConfig = z.object({
  label: z.union([
    z
      .object({
        type: z.literal('hardcoded'),
      })
      .and(zHardcodedLabel),
    z
      .object({
        type: z.literal('contextual'),
      })
      .and(zContextualLabel),
    z
      .object({
        type: z.literal('abTesting'),
      })
      .and(zAbTestingLabel),
  ]),
  position: zButtonPosition,
});

/**
 * ButtonSettings
 * Button settings model for storing button configuration
 */
export const zButtonSettings = z.object({
  _id: z.union([z.string(), z.null()]).optional(),
  data: zButtonConfig,
  domain: z.union([z.string(), z.null()]).optional(),
});

/**
 * ChangePassword
 */
export const zChangePassword = z.object({
  old_password: z.string(),
  new_password: z.string(),
});

/**
 * FamiliarityLevel
 */
export const zFamiliarityLevel = z.enum(['beginner', 'intermediate', 'advanced']);

/**
 * LearningStyle
 */
export const zLearningStyle = z.enum(['no preference', 'visual', 'analogies']);

/**
 * Config
 */
export const zConfig = z.object({
  familiarity: z.union([zFamiliarityLevel, z.null()]).optional(),
  background: z.union([z.string(), z.null()]).optional(),
  context: z.union([z.string(), z.null()]).optional(),
  strict_adherence: z.union([z.boolean(), z.null()]).optional(),
  summary: z.union([z.boolean(), z.null()]).optional(),
  purpose: z.union([z.string(), z.null()]).optional(),
  learning_style: z.union([zLearningStyle, z.null()]).optional(),
});

/**
 * ChatRequest
 */
export const zChatRequest = z.object({
  conversation_id: z.string().uuid(),
  message_id: z.string().uuid(),
  message: z.string(),
  config: zConfig,
});

/**
 * FrontendMessage
 */
export const zFrontendMessage = z.object({
  id: z.string().uuid(),
  kind: z.enum(['request', 'response']),
  content: z.string(),
});

/**
 * ChatResponse
 */
export const zChatResponse = z.object({
  conversation_id: z.string().uuid(),
  message: zFrontendMessage,
});

/**
 * ConfirmForgotPassword
 */
export const zConfirmForgotPassword = z.object({
  email: z.string(),
  confirmation_code: z.string(),
  new_password: z.string(),
});

/**
 * ConfirmSignUp
 */
export const zConfirmSignUp = z.object({
  email: z.string(),
  confirmation_code: z.string(),
});

/**
 * CurrentUser
 */
export const zCurrentUser = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  email_is_verified: z.union([z.boolean(), z.null()]).optional(),
  groups: z.array(z.string()).optional().default([]),
  picture: z.union([z.string(), z.null()]).optional(),
  first_name: z.union([z.string(), z.null()]).optional(),
  last_name: z.union([z.string(), z.null()]).optional(),
  phone_number: z.union([z.string(), z.null()]).optional(),
  phone_number_is_verified: z.union([z.boolean(), z.null()]).optional(),
});

/**
 * DataSourcesConfig
 */
export const zDataSourcesConfig = z.object({
  page_content: z.boolean().optional().default(true),
  page_url: z.boolean().optional().default(true),
  page_title: z.boolean().optional().default(true),
  ai_general_knowledge: z.boolean().optional().default(true),
});

/**
 * DataSourcesSettings
 * Data sources settings model for storing data sources configuration
 */
export const zDataSourcesSettings = z.object({
  _id: z.union([z.string(), z.null()]).optional(),
  data: zDataSourcesConfig,
  domain: z.union([z.string(), z.null()]).optional(),
});

/**
 * ErrorLocation
 */
export const zErrorLocation = z.enum(['body', 'query', 'header', 'cookies', 'params']);

/**
 * ErrorLocationField
 */
export const zErrorLocationField = z.enum(['general']);

/**
 * Detail
 */
export const zDetail = z.object({
  loc: z.union([z.array(z.union([zErrorLocation, z.string()])), zErrorLocationField]),
  msg: z.string(),
  code: z.string(),
});

/**
 * ForgotPassword
 */
export const zForgotPassword = z.object({
  email: z.string(),
});

/**
 * ValidationError
 */
export const zValidationError = z.object({
  loc: z.array(z.union([z.string(), z.number().int()])),
  msg: z.string(),
  type: z.string(),
});

/**
 * HTTPValidationError
 */
export const zHttpValidationError = z.object({
  detail: z.array(zValidationError).optional(),
});

/**
 * Health
 */
export const zHealth = z.object({
  status: z.enum(['OK', 'ERROR']).optional(),
  timestamp: z.string(),
});

/**
 * OAuthUrl
 */
export const zOAuthUrl = z.object({
  url: z.string(),
});

/**
 * Plan
 * Plan model.
 */
export const zPlan = z.object({
  id: z.string(),
  name: z.string(),
  description: z.union([z.string(), z.null()]).optional(),
});

/**
 * Plans
 * Collection of plans.
 */
export const zPlans = z.object({
  items: z.array(zPlan),
});

/**
 * Profile
 */
export const zProfile = z.object({
  name: z.string(),
  config: zConfig,
  _id: z.union([z.string(), z.null()]).optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

/**
 * ProfileIn
 */
export const zProfileIn = z.object({
  name: z.string(),
  config: zConfig,
});

/**
 * ResendConfirmationCode
 */
export const zResendConfirmationCode = z.object({
  email: z.string(),
});

/**
 * ResponseFormat
 */
export const zResponseFormat = z.object({
  code: z.string(),
  msg: z.string(),
});

/**
 * SignIn
 */
export const zSignIn = z.object({
  username: z.string(),
  password: z.string(),
});

/**
 * SignUp
 */
export const zSignUp = z.object({
  email: z.string(),
  password: z.string(),
});

/**
 * Site
 * Site model for storing registered domains and their siteIds
 */
export const zSite = z.object({
  _id: z.union([z.string(), z.null()]).optional(),
  domain: z.string(),
  site_id: z.string(),
  owner_id: z.string(),
  active: z.boolean().optional().default(true),
});

/**
 * SiteCreate
 * Site creation model
 */
export const zSiteCreate = z.object({
  domain: z.string(),
  site_id: z.union([z.string(), z.null()]).optional(),
});

/**
 * WebsiteOverride
 */
export const zWebsiteOverride = z.object({
  domain: z.string(),
  profile_id: z.union([z.string(), z.null()]).optional(),
  config: zConfig,
  _id: z.union([z.string(), z.null()]).optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

/**
 * WebsiteOverrideCreate
 */
export const zWebsiteOverrideCreate = z.object({
  domain: z.string(),
  profile_id: z.union([z.string(), z.null()]).optional(),
  config: zConfig,
});

export const zAuthGetSignInGoogleOldData = z.object({
  body: z.never().optional(),
  path: z.never().optional(),
  query: z
    .object({
      redirect: z.union([z.string(), z.null()]).optional(),
    })
    .optional(),
});

/**
 * Successful Response
 */
export const zAuthGetSignInGoogleOldResponse = zOAuthUrl;

export const zAuthGetSignInGoogleData = z.object({
  body: z.never().optional(),
  path: z.never().optional(),
  query: z
    .object({
      redirect: z.union([z.string(), z.null()]).optional(),
    })
    .optional(),
});

/**
 * Response Auth Get Sign In Google
 * Successful Response
 */
export const zAuthGetSignInGoogleResponse = z.string();

export const zAuthViaGoogleAuthCallbackGoogleGetData = z.object({
  body: z.never().optional(),
  path: z.never().optional(),
  query: z.never().optional(),
});

export const zAuthCallbackAuthCallbackGetData = z.object({
  body: z.never().optional(),
  path: z.never().optional(),
  query: z.object({
    code: z.string(),
    state: z.string(),
  }),
});

export const zAuthPostSignUpData = z.object({
  body: zSignUp,
  path: z.never().optional(),
  query: z.never().optional(),
});

/**
 * Successful Response
 */
export const zAuthPostSignUpResponse = zResponseFormat;

export const zAuthPostConfirmSignUpData = z.object({
  body: zConfirmSignUp,
  path: z.never().optional(),
  query: z.never().optional(),
});

/**
 * Successful Response
 */
export const zAuthPostConfirmSignUpResponse = zResponseFormat;

export const zAuthPostResendConfirmationCodeData = z.object({
  body: zResendConfirmationCode,
  path: z.never().optional(),
  query: z.never().optional(),
});

/**
 * Successful Response
 */
export const zAuthPostResendConfirmationCodeResponse = zResponseFormat;

export const zAuthPostForgotPasswordData = z.object({
  body: zForgotPassword,
  path: z.never().optional(),
  query: z.never().optional(),
});

/**
 * Successful Response
 */
export const zAuthPostForgotPasswordResponse = zResponseFormat;

export const zAuthPostConfirmForgotPasswordData = z.object({
  body: zConfirmForgotPassword,
  path: z.never().optional(),
  query: z.never().optional(),
});

/**
 * Successful Response
 */
export const zAuthPostConfirmForgotPasswordResponse = zResponseFormat;

export const zAuthPostChangePasswordData = z.object({
  body: zChangePassword,
  path: z.never().optional(),
  query: z
    .object({
      id_token: z.union([z.string(), z.null()]).optional(),
    })
    .optional(),
});

/**
 * Successful Response
 */
export const zAuthPostChangePasswordResponse = zResponseFormat;

export const zAuthPostSetInitialPasswordData = z.object({
  body: z.never().optional(),
  path: z.never().optional(),
  query: z.object({
    username: z.string(),
    old_password: z.string(),
    new_password: z.string(),
  }),
});

export const zAuthGetMeData = z.object({
  body: z.never().optional(),
  path: z.never().optional(),
  query: z
    .object({
      id_token: z.union([z.string(), z.null()]).optional(),
    })
    .optional(),
});

/**
 * Successful Response
 */
export const zAuthGetMeResponse = zCurrentUser;

export const zAuthPostSignInData = z.object({
  body: zSignIn,
  path: z.never().optional(),
  query: z.never().optional(),
});

export const zAuthPostRefreshData = z.object({
  body: z.never().optional(),
  path: z.never().optional(),
  query: z.never().optional(),
});

export const zAuthPostLogoutSessionData = z.object({
  body: z.never().optional(),
  path: z.never().optional(),
  query: z.never().optional(),
});

export const zAuthPostLogoutAllDevicesData = z.object({
  body: z.never().optional(),
  path: z.never().optional(),
  query: z
    .object({
      id_token: z.union([z.string(), z.null()]).optional(),
    })
    .optional(),
});

export const zGetCurrentUserAuthMe2GetData = z.object({
  body: z.never().optional(),
  path: z.never().optional(),
  query: z.never().optional(),
});

export const zGetMeTokenAuthMeTokenGetData = z.object({
  body: z.never().optional(),
  path: z.never().optional(),
  query: z.never().optional(),
});

export const zHealthGetHealthData = z.object({
  body: z.never().optional(),
  path: z.never().optional(),
  query: z.never().optional(),
});

/**
 * Successful Response
 */
export const zHealthGetHealthResponse = zHealth;

export const zPolarWebhookPaymentsWebhookPostData = z.object({
  body: z.never().optional(),
  path: z.never().optional(),
  query: z.never().optional(),
});

/**
 * Response Polar Webhook Payments Webhook Post
 * Successful Response
 */
export const zPolarWebhookPaymentsWebhookPostResponse = z.object({});

export const zPaymentsGetPlansData = z.object({
  body: z.never().optional(),
  path: z.never().optional(),
  query: z.never().optional(),
});

/**
 * Successful Response
 */
export const zPaymentsGetPlansResponse = zPlans;

export const zPaymentsGetPlansRefreshData = z.object({
  body: z.never().optional(),
  path: z.never().optional(),
  query: z
    .object({
      force: z.boolean().optional().default(false),
    })
    .optional(),
});

/**
 * Successful Response
 */
export const zPaymentsGetPlansRefreshResponse = zPlans;

export const zPaymentsGetPlanData = z.object({
  body: z.never().optional(),
  path: z.object({
    plan_id: z.string(),
  }),
  query: z.never().optional(),
});

/**
 * Successful Response
 */
export const zPaymentsGetPlanResponse = zPlan;

export const zTranslateSitesGetSitesData = z.object({
  body: z.never().optional(),
  path: z.never().optional(),
  query: z
    .object({
      id_token: z.union([z.string(), z.null()]).optional(),
    })
    .optional(),
});

/**
 * Response Translate Sites Get Sites
 * Successful Response
 */
export const zTranslateSitesGetSitesResponse = z.array(zSite);

export const zTranslateSitesPostSitesData = z.object({
  body: zSiteCreate,
  path: z.never().optional(),
  query: z
    .object({
      id_token: z.union([z.string(), z.null()]).optional(),
    })
    .optional(),
});

/**
 * Successful Response
 */
export const zTranslateSitesPostSitesResponse = zSite;

export const zTranslateSitesDeleteSiteData = z.object({
  body: z.never().optional(),
  path: z.object({
    site_id: z.string(),
  }),
  query: z
    .object({
      id_token: z.union([z.string(), z.null()]).optional(),
    })
    .optional(),
});

/**
 * Successful Response
 */
export const zTranslateSitesDeleteSiteResponse = z.void();

export const zTranslateSitesGetSiteData = z.object({
  body: z.never().optional(),
  path: z.object({
    site_id: z.string(),
  }),
  query: z
    .object({
      id_token: z.union([z.string(), z.null()]).optional(),
    })
    .optional(),
});

/**
 * Successful Response
 */
export const zTranslateSitesGetSiteResponse = zSite;

export const zTranslateSitesPutSiteData = z.object({
  body: zSiteCreate,
  path: z.object({
    site_id: z.string(),
  }),
  query: z
    .object({
      id_token: z.union([z.string(), z.null()]).optional(),
    })
    .optional(),
});

/**
 * Successful Response
 */
export const zTranslateSitesPutSiteResponse = zSite;

export const zTranslateSitesPostToggleSiteData = z.object({
  body: z.never().optional(),
  path: z.object({
    site_id: z.string(),
  }),
  query: z
    .object({
      id_token: z.union([z.string(), z.null()]).optional(),
    })
    .optional(),
});

/**
 * Successful Response
 */
export const zTranslateSitesPostToggleSiteResponse = zSite;

export const zDummyTranslateDummyPostData = z.object({
  body: z.never().optional(),
  path: z.never().optional(),
  query: z.never().optional(),
});

/**
 * Successful Response
 */
export const zDummyTranslateDummyPostResponse = zDetail;

export const zConfigGetButtonData = z.object({
  body: z.never().optional(),
  path: z.object({
    domain: z.string(),
  }),
  query: z
    .object({
      id_token: z.union([z.string(), z.null()]).optional(),
    })
    .optional(),
});

/**
 * Successful Response
 */
export const zConfigGetButtonResponse = zButtonSettings;

export const zConfigPutButtonData = z.object({
  body: zButtonConfig,
  path: z.object({
    domain: z.string(),
  }),
  query: z
    .object({
      id_token: z.union([z.string(), z.null()]).optional(),
    })
    .optional(),
});

/**
 * Successful Response
 */
export const zConfigPutButtonResponse = zButtonSettings;

export const zConfigGetDataSourcesData = z.object({
  body: z.never().optional(),
  path: z.object({
    domain: z.string(),
  }),
  query: z
    .object({
      id_token: z.union([z.string(), z.null()]).optional(),
    })
    .optional(),
});

/**
 * Successful Response
 */
export const zConfigGetDataSourcesResponse = zDataSourcesSettings;

export const zConfigPutDataSourcesData = z.object({
  body: zDataSourcesConfig,
  path: z.object({
    domain: z.string(),
  }),
  query: z
    .object({
      id_token: z.union([z.string(), z.null()]).optional(),
    })
    .optional(),
});

/**
 * Successful Response
 */
export const zConfigPutDataSourcesResponse = zDataSourcesSettings;

export const zGetProfilesData = z.object({
  body: z.never().optional(),
  path: z.never().optional(),
  query: z
    .object({
      id_token: z.union([z.string(), z.null()]).optional(),
    })
    .optional(),
});

/**
 * Response Get Profiles
 * Successful Response
 */
export const zGetProfilesResponse = z.array(zProfile);

export const zPostProfileData = z.object({
  body: zProfileIn,
  path: z.never().optional(),
  query: z
    .object({
      id_token: z.union([z.string(), z.null()]).optional(),
    })
    .optional(),
});

/**
 * Successful Response
 */
export const zPostProfileResponse = zProfile;

export const zDeleteProfileData = z.object({
  body: z.never().optional(),
  path: z.object({
    name: z.string(),
  }),
  query: z
    .object({
      id_token: z.union([z.string(), z.null()]).optional(),
    })
    .optional(),
});

/**
 * Successful Response
 */
export const zDeleteProfileResponse = z.void();

export const zGetProfileData = z.object({
  body: z.never().optional(),
  path: z.object({
    name: z.string(),
  }),
  query: z
    .object({
      id_token: z.union([z.string(), z.null()]).optional(),
    })
    .optional(),
});

/**
 * Response Get Profile
 * Successful Response
 */
export const zGetProfileResponse = z.union([zProfile, z.null()]);

export const zPutProfileData = z.object({
  body: zProfileIn,
  path: z.object({
    name: z.string(),
  }),
  query: z
    .object({
      id_token: z.union([z.string(), z.null()]).optional(),
    })
    .optional(),
});

/**
 * Response Put Profile
 * Successful Response
 */
export const zPutProfileResponse = z.union([zProfile, z.null()]);

export const zGetWebsiteOverridesData = z.object({
  body: z.never().optional(),
  path: z.never().optional(),
  query: z.never().optional(),
});

/**
 * Response Get Website Overrides
 * Successful Response
 */
export const zGetWebsiteOverridesResponse = z.array(zWebsiteOverride);

export const zPostWebsiteOverrideData = z.object({
  body: zWebsiteOverrideCreate,
  path: z.never().optional(),
  query: z.never().optional(),
});

/**
 * Successful Response
 */
export const zPostWebsiteOverrideResponse = zWebsiteOverride;

export const zDeleteWebsiteOverrideData = z.object({
  body: z.never().optional(),
  path: z.object({
    domain: z.string(),
  }),
  query: z.never().optional(),
});

/**
 * Successful Response
 */
export const zDeleteWebsiteOverrideResponse = z.void();

export const zGetWebsiteOverrideData = z.object({
  body: z.never().optional(),
  path: z.object({
    domain: z.string(),
  }),
  query: z.never().optional(),
});

/**
 * Response Get Website Override
 * Successful Response
 */
export const zGetWebsiteOverrideResponse = z.union([zWebsiteOverride, z.null()]);

export const zPutWebsiteOverrideData = z.object({
  body: zWebsiteOverrideCreate,
  path: z.object({
    domain: z.string(),
  }),
  query: z.never().optional(),
});

/**
 * Response Put Website Override
 * Successful Response
 */
export const zPutWebsiteOverrideResponse = z.union([zWebsiteOverride, z.null()]);

export const zChatPostChatPublicData = z.object({
  body: zChatRequest,
  path: z.never().optional(),
  query: z.never().optional(),
});

/**
 * Successful Response
 */
export const zChatPostChatPublicResponse = zChatResponse;
