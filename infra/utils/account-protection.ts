import * as fs from "fs";
import * as path from "path";

/**
 * Gets the account verification mapping from environment variable or aws-accounts.json file
 * @returns Record with stage to AWS account ID mapping
 */
function getAccountVerification(): Record<string, string> {
  const configPath = path.resolve(process.cwd(), "aws-accounts.json");
  if (!fs.existsSync(configPath)) {
    throw new Error(`
===============================================================
AWS account verification configuration not found. Please create an aws-accounts.json file in the project root:

# aws-accounts.json
{
  "test": "123456",
  "prod": "8766654"
}

Where the values correspond to your AWS account IDs for each environment.
===============================================================
`);
  }

  const fileContent = fs.readFileSync(configPath, "utf8");
  try {
    return JSON.parse(fileContent);
  } catch (error) {
    throw new Error(`Cannot parse ${configPath} as JSON: ${error}`);
  }
}

const accountVerification = getAccountVerification();

/**
 * Verifies that the current AWS account matches the expected account for the specified stage
 * @returns The validated deployment stage
 */
export function verifyAwsAccount(): string {
  const stage = process.env.CDK_DEPLOY_STAGE;

  if (!stage) {
    throw new Error(
      `CDK_DEPLOY_STAGE environment variable not set. Please set it to one of ${Object.keys(
        accountVerification
      ).join(", ")} (export CDK_DEPLOY_STAGE=XXX)`
    );
  }

  if (!(stage in accountVerification)) {
    throw new Error(
      `Invalid CDK_DEPLOY_STAGE value: ${stage}. Must be one of ${Object.keys(
        accountVerification
      ).join(", ")}. (export CDK_DEPLOY_STAGE=XXX)`
    );
  }

  const expectedAccount =
    accountVerification[stage as keyof typeof accountVerification];

  const currentAccount = process.env.CDK_DEFAULT_ACCOUNT;
  if (currentAccount !== expectedAccount) {
    throw new Error(
      `Account verification failed. Account we are using is ${currentAccount}, but is expected to be ${expectedAccount} for the ${stage} environment. You probably need to change the CDK_DEPLOY_STAGE environment (export CDK_DEPLOY_STAGE=${stage}) or login to the correct account.`
    );
  }

  return stage;
}
