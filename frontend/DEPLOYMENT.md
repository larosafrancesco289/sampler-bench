# Deployment Guide

## Vercel Deployment (Recommended)

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/sampler-bench)

### Manual Deployment

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy from frontend directory**:
   ```bash
   cd frontend
   vercel
   ```

3. **Follow the prompts**:
   - Choose "yes" to create a new project
   - Select your account/team
   - Choose project name
   - Select "frontend" as the root directory
   - Override build command: `npm run build`
   - Override output directory: `.next`

### Environment Variables

Set up the following environment variables in Vercel dashboard:

- `NEXT_PUBLIC_API_URL`: URL of your backend API
- `NODE_ENV`: `production`

### Custom Domain

1. Go to your Vercel project dashboard
2. Navigate to "Settings" → "Domains"
3. Add your custom domain
4. Configure DNS records as instructed

### Auto-Deploy from Git

1. Connect your GitHub repository to Vercel
2. Set up automatic deployments on push to main branch
3. Configure preview deployments for pull requests

## Alternative Deployments

### Netlify

1. Build the project:
   ```bash
   npm run build
   ```

2. Upload the `.next` folder to Netlify

### Self-Hosted

1. **Build for production**:
   ```bash
   npm run build
   ```

2. **Start production server**:
   ```bash
   npm start
   ```

3. **Using PM2** (recommended):
   ```bash
   npm install -g pm2
   pm2 start npm --name "sampler-bench-frontend" -- start
   ```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t sampler-bench-frontend .
docker run -p 3000:3000 sampler-bench-frontend
```

## Performance Optimizations

- **Image Optimization**: Next.js automatically optimizes images
- **Code Splitting**: Automatic code splitting by route
- **Caching**: Configure CDN caching for static assets
- **Compression**: Enable gzip/brotli compression
- **Bundle Analysis**: Use `npm run build` to see bundle size

## Monitoring

- **Vercel Analytics**: Built-in performance monitoring
- **Error Tracking**: Consider Sentry for error tracking
- **Performance**: Use Next.js built-in performance metrics
- **Uptime**: Set up uptime monitoring service

## Environment Setup

### Production Environment Variables

```bash
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NODE_ENV=production
```

### Development Environment Variables

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NODE_ENV=development
```

## Troubleshooting

### Build Errors

1. **Check Node.js version**: Ensure Node.js 18+ is installed
2. **Clear cache**: `rm -rf .next && npm run build`
3. **Check dependencies**: `npm ci` to reinstall clean dependencies

### Runtime Errors

1. **Check environment variables**: Ensure all required variables are set
2. **API connectivity**: Verify backend API is accessible
3. **CORS issues**: Configure CORS headers on backend

### Performance Issues

1. **Bundle size**: Use `npm run build` to analyze bundle
2. **Image optimization**: Ensure images are properly optimized
3. **Caching**: Configure proper caching headers
4. **CDN**: Use a CDN for static assets

## Security

- **Environment Variables**: Never commit sensitive data to git
- **HTTPS**: Always use HTTPS in production
- **Content Security Policy**: Configure CSP headers
- **Dependencies**: Regularly update dependencies for security patches 