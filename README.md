# Data Export App

A Contentful app for exporting content types and their associated entries with references.

## Features

- List all available content types in your Contentful space
- Select specific content types for export
- Choose locale for content export
- Download complete content export including references and assets
- Built with Contentful UI library (@contentful/f36-components)
- Next.js 15 app directory structure

## Setup

### 1. Install Dependencies

```bash
yarn install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Contentful Configuration
CONTENTFUL_MANAGEMENT_TOKEN=your_management_token_here
```

**How to get these values:**

- **MANAGEMENT_TOKEN**: Generate in Contentful under Settings > API keys > Content management tokens

**Note**: Space ID and Environment ID are automatically detected from the frontend context and don't need to be configured.

### 3. Run Development Server

```bash
yarn dev
```

The app will be available at `http://localhost:3000`

## Usage

1. **Select Locale**: Choose the locale for content export
2. **Select Content Types**: Check the content types you want to export
3. **Export**: Click the export button to download all content as JSON

## Export Format

The exported JSON file contains:

- Export metadata (date, locale)
- Selected content types with field definitions
- All entries for selected content types
- Referenced assets (images, files)
- Reference tracking for nested content

## API Endpoints

- `POST /api/export` - Handles content export requests

## Development

### Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn test` - Run tests
- `yarn lint` - Run linting

### Contentful App Integration

This app is designed to work as a Contentful app. Use the following commands:

- `yarn create-app-definition` - Create app definition
- `yarn add-locations` - Add app locations

## Dependencies

- Next.js 15
- React 19
- Contentful UI library (@contentful/f36-components)
- Contentful Management SDK
- TypeScript

## Security Notes

- Never commit your `.env.local` file
- Keep your management token secure
- The management token has full access to your space
- Consider using environment-specific tokens for different deployments
