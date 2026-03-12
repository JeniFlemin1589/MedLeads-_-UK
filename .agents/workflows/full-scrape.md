---
description: how to run the full-scale Doctify scrape to populate the database
---

# Full-Scale Doctify Scraping

This workflow scrapes ALL Doctify data across 5 entity types into the Supabase `scraped_leads` table.

## Estimated Scale
| Type | Records | Est Time (1.5s delay) |
|---|---|---|
| Practices | ~22,296 | ~9 hours |
| Specialists | ~42,144 | ~17 hours |
| Hospitals | TBD | TBD |
| Pharmacies | TBD | TBD |
| Care Homes | TBD | TBD |

## Running the Full Scrape

### Option A: All types sequentially (recommended)
// turbo
```
cd e:\10qbit\leads
npx tsx scripts/scrape-doctify.ts --all --resume
```
This will scrape all 5 types in order. The `--resume` flag skips already-scraped URLs.

### Option B: One type at a time
// turbo
```
npx tsx scripts/scrape-doctify.ts --type practices --resume
npx tsx scripts/scrape-doctify.ts --type specialists --resume
npx tsx scripts/scrape-doctify.ts --type hospitals --resume
npx tsx scripts/scrape-doctify.ts --type pharmacies --resume
npx tsx scripts/scrape-doctify.ts --type carehomes --resume
```

### Option C: Limited batch (for testing)
// turbo
```
npx tsx scripts/scrape-doctify.ts --type specialists --limit 100 --resume
```

## Resuming After Interruption
The scraper tracks progress in `scripts/scrape-progress.json` and uses `--resume` to skip already-scraped URLs from Supabase. Just re-run the same command.

## Monitoring
- Progress is logged in the terminal
- Records are saved to Supabase in real-time
- Check database count: Go to Supabase dashboard → Table Editor → `scraped_leads`

## Options
- `--visible` — show the browser window (useful for debugging)
- `--dry-run` — preview URLs without scraping
- `--category <keyword>` — filter URLs containing keyword
- `--limit <N>` — scrape at most N records
