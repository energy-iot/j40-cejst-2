# CEJST2 Github Actions Workflows

This directory contains the GitHub Actions workflows for the CEJST2 (Climate and Economic Justice Screening Tool) project.

The project uses GitHub Actions to automate the build, test, and deployment processes for both the frontend client and backend data pipeline.

## List of Current Workflows

### Build and Deploy to prod (Github pages)

- **File**: `deploy-production.yml`
- **Trigger**: Push to main branch with changes to `client/**/*`
- **Purpose**: Builds and deploys the frontend to GitHub Pages for production
- **Jobs**: Build, test, lint, translations, deploy to GitHub Pages

### Deploy CEJST Preview

- **File**: `deploy-preview.yml`
- **Trigger**: Pull requests targeting main branch with changes to `client/**/*`
- **Purpose**: Creates preview deployments for pull requests using AWS S3 and CloudFront
- **Jobs**: Setup, build, test, lint, deploy to S3, invalidate CloudFront cache, comment on PR
- **Output**: Preview URL posted as PR comment

### Cleanup Preview Deployment

- **File**: `cleanup-preview.yml`
- **Trigger**: Pull request closed (merged or closed without merging)
- **Purpose**: Cleans up S3 folders and CloudFront cache for closed pull requests
- **Jobs**: Delete all PR-specific S3 folders, invalidate CloudFront cache, comment on PR

### Pull Request Backend

- **File**: `pr_backend.yml`
- **Trigger**: Pull requests with changes to `data/**/*`
- **Purpose**: Builds and tests the backend data pipeline for pull requests

### Check Markdown Links

- **Trigger**: Pull requests
- **Purpose**: Runs Linkspector with Reviewdog to identify and report dead hyperlinks

### CodeQL

- **Trigger**: Pull requests and pushes
- **Purpose**: Runs GitHub's CodeQL engine to check for security vulnerabilities

### Compile Mermaid to MD

- **Purpose**: Compiles Mermaid markdown into images (deprecated)

### Ping Check

- **Purpose**: Runs a health check on the website to verify status 200 response

## Deployment Architecture

### Production Deployment

- **Target**: GitHub Pages
- **URL**: https://public-environmental-data-partners.github.io/j40-cejst-2/
- **Trigger**: Main branch pushes

### Preview Deployments

- **Target**: AWS S3 + CloudFront
- **URL Pattern**: `https://{cloudfront-domain}/j40-cejst-2/pr-{pr-number}-{commit-hash}/`
- **Trigger**: Pull requests
- **Cleanup**: Automatic cleanup when PR is closed

## Required Secrets and Variables

### Repository Secrets

- `STAGING_AWS_ACCESS_KEY_ID`: AWS access key for S3/CloudFront
- `STAGING_AWS_SECRET_ACCESS_KEY`: AWS secret key for S3/CloudFront
- `STAGING_CLOUDFRONT_DISTRIBUTION_ID`: CloudFront distribution ID

### Repository Variables

- `STAGING_AWS_REGION`: AWS region for S3 bucket
- `SITE_URL`: Production site URL
- `PATH_PREFIX`: Base path for the application

For detailed setup instructions, see [AWS Infrastructure Setup Guide](../../docs/architecture/aws-infrastructure-setup.md).
