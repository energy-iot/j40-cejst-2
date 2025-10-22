# AWS S3 Preview Deployments Setup Plan

## Overview

Set up AWS S3 + CloudFront infrastructure for PR preview deployments while maintaining GitHub Pages for production deployments on the main branch.

**LESSONS LEARNED**: This plan incorporates all troubleshooting insights to ensure first-time success.

## Phase 1: AWS Infrastructure Setup (Manual)

### 1.1 Configure S3 Bucket for Static Hosting

- Navigate to S3 bucket `cejst-2-test` in `us-east-2`
- Enable static website hosting:
  - Properties tab → Static website hosting → Enable
  - Index document: `index.html`
  - Error document: `index.html` (for Gatsby SPA routing)
- Configure bucket policy for public read access:
  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "PublicReadGetObject",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::cejst-2-test/*"
      }
    ]
  }
  ```
- Disable "Block all public access" settings
- **CRITICAL**: Ensure no test files remain in the root of the bucket

### 1.2 Create CloudFront Distribution

- Create new CloudFront distribution:
  - Origin domain: `cejst-2-test.s3-website.us-east-2.amazonaws.com` (use S3 website endpoint, not REST endpoint)
  - **Origin path: MUST be empty** (critical - do not set to `/j40-cejst-2` or any path)
  - Viewer protocol policy: Redirect HTTP to HTTPS
  - Allowed HTTP methods: GET, HEAD, OPTIONS
  - Cache key and origin requests: CachingOptimized
  - Response headers policy: CORS-With-Preflight (essential for map tiles)
  - Default root object: `index.html`
- Note the CloudFront Distribution ID for later
- **Wait 10-15 minutes** for deployment to complete

### 1.3 Create IAM User and Policies

- Create IAM user: `github-actions-preview-deploy`
- Create custom policy `S3PreviewDeployPolicy`:

  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ],
        "Resource": ["arn:aws:s3:::cejst-2-test", "arn:aws:s3:::cejst-2-test/*"]
      }
    ]
  }
  ```

- Create custom policy `CloudFrontInvalidationPolicy`:

  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "cloudfront:CreateInvalidation",
          "cloudfront:GetInvalidation"
        ],
        "Resource": "arn:aws:cloudfront::*:distribution/E2MJXV2IJ96DWZ"
      }
    ]
  }
  ```

- Attach both policies to the IAM user
- Generate access keys and save securely

## Phase 2: GitHub Repository Configuration

### 2.1 Add GitHub Secrets

Navigate to repository Settings → Secrets and variables → Actions, add:

- `PREVIEW_AWS_ACCESS_KEY_ID`: IAM access key ID
- `PREVIEW_AWS_SECRET_ACCESS_KEY`: IAM secret access key
- `PREVIEW_S3_BUCKET`: `cejst-2-test`
- `PREVIEW_CLOUDFRONT_DISTRIBUTION_ID`: `E2MJXV2IJ96DWZ`

### 2.2 Add GitHub Variables (optional)

- `PREVIEW_AWS_REGION`: `us-east-2`

## Phase 3: Create Preview Deployment Workflow

### 3.1 Create new workflow file

Create `.github/workflows/deploy-preview.yml` with the following structure:

- Trigger: On pull_request events (opened, synchronize, reopened)
- Single job: `build-and-deploy` (combines build and deploy for efficiency)
- Jobs:

  1. **build-and-deploy**: Combined job that:
     - Builds Gatsby site with DATA_SOURCE=cdn and PATH_PREFIX=/pr-{DESTINATION_FOLDER}
     - Uploads to S3 at path `pr-{DESTINATION_FOLDER}/`
     - Invalidates CloudFront cache for that path
     - Posts preview URL as PR comment

Key workflow features:

- **DESTINATION_FOLDER format**: `{PR_NUMBER}-{FIRST_8_CHARS_OF_SHA}` (e.g., `123-a1b2c3d4`)
- **Unique deployment per commit**: Each commit gets its own preview URL
- **Environment variables**: Only `DATA_SOURCE=cdn` and `PATH_PREFIX` (SITE_URL not needed for previews)
- **AWS CLI v4**: Uses latest aws-actions/configure-aws-credentials@v4
- **Preview URL**: `https://d1ut1n0e9o10r.cloudfront.net/pr-{DESTINATION_FOLDER}/`
- **No artifacts needed**: Build and deploy in same job for simplicity

### 3.2 Create cleanup workflow

Create `.github/workflows/cleanup-preview.yml`:

- Trigger: On pull_request closed event
- Delete the PR-specific S3 path to save storage costs
- Invalidate CloudFront cache for deleted path

## Phase 4: Testing Strategy

### 4.1 Initial Testing (S3 only, no workflow)

1. Manually build Gatsby site locally: `cd client && npm run build`
2. Manually upload to S3: `aws s3 sync ./client/public s3://cejst-2-test/j40-cejst-2/ --region us-east-2 --delete`
3. **CRITICAL**: Ensure no files exist in S3 root: `aws s3 ls s3://cejst-2-test/ --region us-east-2`
4. Test via CloudFront URL: `https://d1ut1n0e9o10r.cloudfront.net/j40-cejst-2/`
5. **Expected**: Site loads in ~4 seconds, map tiles work, no CORS errors

### 4.2 Workflow Testing

1. Create test branch and open PR
2. Verify workflow runs successfully
3. Check that files appear in S3 at correct path
4. Verify preview URL works and site functions correctly
5. Test cleanup workflow by closing PR

### 4.3 Integration Testing

1. Test with actual code changes to ensure Gatsby builds correctly
2. Verify map tiles and data sources load (DATA_SOURCE=cdn)
3. Test routing and navigation
4. Test on mobile and different browsers

## Phase 5: Documentation Updates

### 5.1 Update workflow documentation

Update `.github/workflows/README.md` to document new preview deployment workflow

### 5.2 Update ENVIRONMENT_VARIABLES.md

Document the new secrets and their purposes

### 5.3 Update ADR 0009

Update `docs/decisions/0009-preview-deployment-links.md` with implementation details and actual costs

## Key Files to Create/Modify

### New Files:

- `.github/workflows/deploy-preview.yml` - Main preview deployment workflow (✅ COMPLETED)
- `.github/workflows/cleanup-preview.yml` - Cleanup on PR close

### Files to Update:

- `.github/workflows/README.md` - Document new workflows
- `.github/workflows/ENVIRONMENT_VARIABLES.md` - Document new secrets
- `docs/decisions/0009-preview-deployment-links.md` - Update with implementation

## Critical Lessons Learned

### 1. **CloudFront Origin Path Configuration**

- **MUST be empty** - Do not set origin path to `/j40-cejst-2`
- **Why**: CloudFront adds origin path + URL path, causing doubled paths like `/j40-cejst-2/j40-cejst-2/`
- **Result**: 404 errors and broken deployments

### 2. **S3 Bucket Cleanup**

- **Remove all test files** from S3 root before testing
- **Why**: CloudFront serves root files instead of path-specific files
- **Result**: Old test content instead of actual Gatsby build

### 3. **Performance Requirements**

- **S3-only is insufficient** - 55+ second load times
- **CloudFront is essential** - 4 second load times
- **CORS headers required** - Map tiles fail without CloudFront
- **Result**: CloudFront is mandatory, not optional

### 4. **Cache Invalidation**

- **Required for fresh deployments** - CloudFront caches aggressively
- **Use wildcard paths** - `/*` for complete invalidation
- **IAM permissions needed** - `cloudfront:CreateInvalidation` required

### 5. **Path Structure**

- **Use `pr-{number}/` format** - Avoid confusion with S3 prefixes
- **Match Gatsby PATH_PREFIX** - Upload to `/j40-cejst-2/` for production parity
- **Result**: Consistent URL structure and proper asset loading

## Important Notes

1. **Path Structure**: Use `pr-{number}/` not `pr/{number}/` to avoid confusion with S3 prefixes
2. **CloudFront Origin**: Use S3 website endpoint, not REST endpoint, for proper SPA routing
3. **CORS Headers**: Essential for map tiles - configure in CloudFront response headers policy
4. **Cost Monitoring**: Set up AWS billing alerts for unexpected charges
5. **No Terraform**: Manual setup is acceptable for this simple use case
6. **Production Unchanged**: GitHub Pages deployment on main branch remains untouched

## Success Criteria

- [x] AWS infrastructure configured and tested
- [x] CloudFront distribution working (4 second load times)
- [x] S3 bucket properly configured for static hosting
- [x] IAM policies created with correct permissions
- [ ] PR preview deployments work automatically on PR creation
- [ ] Each PR gets a unique URL in PR comments
- [ ] Preview sites function identically to production
- [ ] Cleanup workflow removes old preview deployments
- [ ] No impact on existing GitHub Pages production deployment
- [ ] Total cost stays under $15/month

## Current Status

### ✅ Completed:

- S3 bucket configured for static hosting
- CloudFront distribution created and working
- IAM user and policies created
- Manual testing successful (4 second load times)
- Performance optimized (93% improvement over S3-only)
- **GitHub workflow created** (`.github/workflows/deploy-preview.yml`)
- **Workflow optimized** with combined build-and-deploy job
- **Environment variables configured** for preview deployments

### 🔄 Next Steps:

- Add GitHub secrets for AWS credentials
- Test workflow with actual PRs
- Create cleanup workflows
- Update documentation

## Troubleshooting Guide

### Common Issues and Solutions:

1. **504 Gateway Timeout**

   - **Cause**: CloudFront origin path set incorrectly
   - **Solution**: Set origin path to empty, not `/j40-cejst-2`

2. **404 Not Found with doubled paths**

   - **Cause**: CloudFront looking for `/j40-cejst-2/j40-cejst-2/index.html`
   - **Solution**: Clear origin path in CloudFront distribution

3. **Old test content showing**

   - **Cause**: Test files in S3 root
   - **Solution**: Remove all files from S3 root, invalidate CloudFront cache

4. **403 Forbidden errors**

   - **Cause**: S3-only deployment without CORS headers
   - **Solution**: Use CloudFront with CORS-With-Preflight policy

5. **Slow loading (55+ seconds)**

   - **Cause**: S3-only deployment
   - **Solution**: Use CloudFront for CDN performance

6. **AccessDenied for CloudFront invalidation**
   - **Cause**: Missing IAM permissions
   - **Solution**: Add `cloudfront:CreateInvalidation` to IAM policy

## Implementation Checklist

### ✅ Completed:

- [x] Configure AWS infrastructure (S3 bucket, CloudFront, IAM)
- [x] Create deploy-preview.yml workflow file
- [x] Test S3 and CloudFront manually before workflow
- [x] Optimize workflow with combined build-and-deploy job
- [x] Configure environment variables for preview deployments

### 🔄 Remaining Tasks:

- [ ] Add GitHub secrets for AWS credentials
- [ ] Create cleanup-preview.yml workflow file
- [ ] Test workflows with actual PR
- [ ] Update workflow documentation and ADR
