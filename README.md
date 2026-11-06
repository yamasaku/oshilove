# OshiLove & Oshi Pocket website

Official website: https://oshilovepocket.com

The site supports Japanese, Traditional Chinese and English, with shared privacy and support pages. Static pages are served by Cloudflare Workers Assets. The resources page uses an R2 binding for original PNG and ZIP downloads.

## Resources

- `resources.html`, `resources.css`, `resources.js`: search, filters, annual-occasion calendar and preview dialog.
- `resources-core.mjs`: shared filtering logic.
- `resources-data.json`: public catalogue and versioned download paths.
- `material-previews/`: small WebP previews; original PNG and ZIP files stay in R2.
- `materials-worker.js`: streams only downloads listed in the public catalogue. The R2 bucket has no public listing endpoint.

Original materials are maintained locally in `D:\X material`. **Ignore every source file or directory whose path contains `-oshideco`, and leave those original files unchanged.** Do not include them in previews, the public catalogue or ZIP downloads. `.stamp` authoring files are also excluded.

When adding resources, use the source filenames to identify colours, preserve original PNG bytes and transparency, and assign calendar dates to the material's annual occasion rather than its upload date. Resources without a specific occasion have `eventDate: null`. Upload new PNG and ZIP objects before publishing their catalogue entries. Object paths include content hashes and can be cached immutably.

## Build and deploy

Requires Node.js and Wrangler. Run from this directory:

```powershell
node --test tests/materials.test.mjs
node tools/build-site.mjs
npx wrangler versions upload --config wrangler.jsonc --profile oshilove
npx wrangler versions deploy <VERSION_ID>@100% --yes --config wrangler.jsonc --profile oshilove
```

The build recreates `.dist` using an explicit list of public files. Worker source, tests, local work files and original material files are excluded. Deploy using this Worker's configuration so the `MATERIALS` R2 binding and `/materials/*` routing are retained; a static-only deployment would disable downloads.

The Worker uses the `oshilove-materials` bucket in the OshiLove Cloudflare account. Authentication belongs to the local Wrangler profile and is not stored in this repository.

After deploying, check search, combined filters, calendar selection and preview downloads in all three languages. Confirm PNG/ZIP responses return the expected content type, attachment filename and size. Unlisted object paths must return 404.

The site uses bundled fonts. Google Analytics loads only after the visitor accepts analytics; no analytics requests are sent before a choice or after refusal. Advertising storage and personalisation remain disabled.
