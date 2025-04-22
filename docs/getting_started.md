# Getting Started

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
