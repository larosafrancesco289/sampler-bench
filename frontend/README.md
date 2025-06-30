# Sampler Bench Frontend

A beautiful Next.js frontend for the Sampler Bench LLM sampling strategy leaderboard focused on **hardware-agnostic quality evaluation**.

## Features

- 🎨 **Beautiful UI** - Built with shadcn/ui and Tailwind CSS
- 📊 **Quality-Focused Charts** - Radar charts for criteria analysis and bar charts for overall scores
- 📱 **Responsive Design** - Works perfectly on desktop and mobile
- ⚡ **Fast & Modern** - Next.js 13+ with App Router
- 🎯 **TypeScript** - Full type safety for better development experience
- 🔬 **Hardware Agnostic** - Focuses purely on text quality, not generation speed

## Tech Stack

- **Framework**: Next.js 13+ (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Charts**: Recharts (Bar charts, Radar charts)
- **Language**: TypeScript
- **Deployment**: Vercel (optimized)

## Quality Evaluation Focus

The frontend evaluates sampling strategies based on **5 quality criteria**:

1. **Narrative Coherence** (25%) - Story flow and consistency
2. **Creativity & Originality** (25%) - Unique ideas and expression  
3. **Character Development** (20%) - Character depth and believability
4. **Engagement & Readability** (20%) - Reader interest and accessibility
5. **Stylistic Quality** (10%) - Writing technique and language use

**Hardware performance metrics are excluded** to ensure fair comparison across different setups.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev -- -H 0.0.0.0
   ```

3. **Open** [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles with Tailwind
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Quality-focused dashboard
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── leaderboard-table.tsx  # Quality rankings table
│   ├── score-chart.tsx        # Overall scores bar chart
│   └── quality-criteria-chart.tsx  # Radar chart for criteria
├── lib/                   # Utilities
│   ├── utils.ts          # Helper functions
│   └── data-processor.ts  # Benchmark data processing
├── types/                 # TypeScript type definitions
│   └── benchmark.ts      # Quality-focused data types
└── public/               # Static assets
```

## Key Components

### Quality Dashboard (`app/page.tsx`)
Main dashboard displaying:
- Quality overview statistics
- Overall quality score comparison
- Quality criteria radar chart
- Detailed quality leaderboard

### Quality Leaderboard (`components/leaderboard-table.tsx`)
Interactive table showing:
- Sampler rankings by quality score
- Detailed criteria breakdowns with progress bars
- Average word count (quality metric)
- Sampling parameters

### Charts
- **Score Chart**: Bar chart comparing overall quality scores
- **Quality Criteria Chart**: Radar chart showing performance across all 5 criteria

## Quality-Focused Features

### ✅ What's Included:
- Overall quality scores (1-10 scale)
- Detailed criteria breakdowns
- Word count analysis
- Sampling parameter comparison
- Beautiful visualizations

### ❌ What's Excluded (Hardware-Dependent):
- Generation speed (tokens/sec)
- Processing time
- Memory usage
- GPU metrics

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Manual Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Data Integration

Currently uses mock data. To integrate with real backend:

1. **Update data fetching** in components to use your API endpoints
2. **Configure environment variables** for API URLs
3. **Use the data processor** (`lib/data-processor.ts`) to convert benchmark results
4. **Focus on quality metrics only** - no performance data needed

## Customization

### Adding New Quality Criteria
1. Update `types/benchmark.ts` for new criteria types
2. Modify `quality-criteria-chart.tsx` for visualization
3. Update `leaderboard-table.tsx` for display

### Styling
- Modify `app/globals.css` for global styles
- Update `tailwind.config.js` for theme customization
- Use shadcn/ui theme variables

## Performance

- **Next.js optimizations**: Automatic code splitting, image optimization
- **Tailwind CSS**: Purged CSS for minimal bundle size  
- **shadcn/ui**: Tree-shakeable component library
- **TypeScript**: Compile-time optimizations
- **Quality focus**: No expensive performance monitoring needed

## Contributing

1. **Code Style**: Follow TypeScript and React best practices
2. **Quality Focus**: Ensure all features relate to text quality, not hardware performance
3. **Components**: Use shadcn/ui patterns for consistency
4. **Testing**: Add tests for quality evaluation logic

## Philosophy

This frontend embraces a **hardware-agnostic approach** to LLM evaluation, recognizing that:

- Quality is more important than speed for most applications
- Hardware differences shouldn't influence algorithm comparison
- Focus should be on what the model produces, not how fast it produces it
- Fair evaluation requires removing hardware variables

## License

Part of the Sampler Bench project. 