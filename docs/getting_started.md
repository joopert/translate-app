# Getting Started

## Create a new release

Go to Actions --> `Bump release` --> select correct type (`major`, `minor`, `patch`) --> wait 30s --> go to pull requests --> Select "rebase and merge". A new version is now created.

## Configure GitHub

The default strategy we use is GitFlow.
Even though we have a monorepo for backend, frontend and infra. We just use one version for all. If there is a bugfix needed while other stuff is merged to `dev`, we still update everything. Otherwise it shouldn't have been merged with `dev`.

Set the following settings on GitHub:

- set default branch = dev
- disable `Allow merge commits`
- disable `Allow rebase merging`

For the bump-release workflow to work you must explicitly allow GitHub Actions to create pull requests. This setting can be found in a repository's settings under Actions > General > Workflow permissions.

## autoupdate-pre-commit

You need to add a Personal Access Token called `PRECOMMIT_PR_TOKEN` to your repository secrets.

### Steps to create and add a PAT

1. Create a Personal Access Token:
   - Go to GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
   - Click "Generate new token"
   - Set appropriate permissions: at minimum, "Contents: write" and "Pull Requests: write"
   - Copy the generated token (you'll only see it once)
2. Add the token as a repository secret:
   - Go to your repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `PRECOMMIT_PR_TOKEN` (matching what we put in the workflow file)
   - Value: Paste your token
   - Click "Add secret"

# Infra

## API Gateway Integration with Cloud Map (Manual Steps Required)

**Background:**
When using AWS CDK to set up ECS services with Cloud Map for service discovery, the Cloud Map services created by ECS are not directly exposed as CDK constructs. As a result, API Gateway HTTP API cannot be fully integrated with these Cloud Map services via CDK alone. Some manual configuration is required in the AWS Console.

### Manual Integration Steps

1. **Access API Gateway Console**

   - Go to the AWS Console → API Gateway → APIs.
   - Select your API.

2. **Create Default Route for Frontend**

   - Click “Create” to add a new route.
   - Method: `ANY`
   - Route: `$default`
   - Select the `$default` route and click “Create and attach integration”.
   - **Integration type:** `Private resource`
   - **Integration details:**
     - Select “Manually”
     - Choose “Cloud Map”
     - Select the appropriate Namespace and the `frontend` Service.

3. **Create Route for Backend**

   - Create a new route:
     - Method: `ANY`
     - Route: `/api/{proxy+}`
   - Select the `/api/{proxy+}` route and click “Create and attach integration”.
   - **Integration type:** `Private resource`
   - **Integration details:**
     - Select “Manually”
     - Choose “Cloud Map”
     - Select the appropriate Namespace and the `backend` Service.

4. **VPC Link**
   - Ensure a VPC Link is configured for API Gateway to reach your ECS services.

### Important Notes

- **Manual Changes:**
  These integrations are not managed by CDK. Any manual changes made in the AWS Console will not be tracked by your infrastructure-as-code and may prevent a clean destroy operation.
- **Destroy Caveat:**
  If you manually add integrations in the console, a subsequent `cdk destroy` may fail to fully clean up resources. You may need to manually remove integrations before destroying the stack.

## Adding and Verifying a New Google Domain (User Alias Domain)

To add a new user alias domain in Google Workspace and verify it using AWS Route 53, follow these steps.

**Warning:**

- Do this in the shared account repo!

### 1. Start Domain Addition in Google Admin

- Go to [Google Admin domain management](https://admin.google.com/ac/domains/manage).
- Click **Add a domain**.
- Enter the desired domain name.
- When prompted, select **User alias domain** as the domain type.
- Proceed to **Add domain & start verification**.

### 2. Select Domain Host and Get Verification Record

- When asked to choose your domain host, select **Amazon Web Services**.
- Google will display a **TXT verification record** (the `GOOGLE_SITE_VERIFICATION` value).

### 3. Add the Verification Record in AWS

- In your codebase, add a new stack (or update an existing one) for the domain under `stacks/gmail/gmail.ts`.
- Set the following values in your stack:
  - `DOMAIN`: The domain you are adding.
  - `GOOGLE_SITE_VERIFICATION`: The TXT record provided by Google.
- Note: The verification string is not a secret and can safely be stored in version control.

### 4. Deploy to AWS

- Deploy the updated stack to the **shared AWS account** (where your DNS is managed).

### 5. Complete Verification in Google Admin

- Once the stack is deployed and the DNS record is live, return to the Google Admin verification page.
- At the bottom, select **Come back here and confirm once you have updated the code on your domain host**.
- Click **Confirm**.

### 6. Done!

Your new user alias domain should now be verified and ready for use in Google Workspace.
