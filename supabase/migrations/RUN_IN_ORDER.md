# Supabase Migrations — Run in order

Go to: Supabase Dashboard → your project → SQL Editor → New query

Paste + run each file in order:

1. `001_user_profiles.sql`
2. `002_tax_declarations.sql`  
3. `003_tasks.sql`

> Note: `002` and `003` depend on the `set_updated_at()` function created in `001`.
> Run `001` first.
