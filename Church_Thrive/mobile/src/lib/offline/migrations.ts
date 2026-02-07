import { schemaMigrations, createTable, addColumns } from '@nozbe/watermelondb/Schema/migrations';

/**
 * WatermelonDB Schema Migrations
 *
 * When you need to change the database schema, add a new migration here.
 * NEVER modify the base schema directly after release - always add migrations.
 *
 * Version history:
 * - v1: Initial schema
 */

export const migrations = schemaMigrations({
  migrations: [
    // Example migration for future use:
    // {
    //   toVersion: 2,
    //   steps: [
    //     addColumns({
    //       table: 'sermon_notes',
    //       columns: [
    //         { name: 'shared_with', type: 'string', isOptional: true },
    //         { name: 'is_public', type: 'boolean', isOptional: true },
    //       ],
    //     }),
    //   ],
    // },
    // {
    //   toVersion: 3,
    //   steps: [
    //     createTable({
    //       name: 'prayer_requests',
    //       columns: [
    //         { name: 'member_id', type: 'string', isIndexed: true },
    //         { name: 'title', type: 'string' },
    //         { name: 'content', type: 'string' },
    //         { name: 'is_answered', type: 'boolean' },
    //         { name: 'answered_at', type: 'number', isOptional: true },
    //         { name: 'sync_status', type: 'string' },
    //         { name: 'server_updated_at', type: 'number', isOptional: true },
    //         { name: 'created_at', type: 'number' },
    //         { name: 'updated_at', type: 'number' },
    //       ],
    //     }),
    //   ],
    // },
  ],
});

/**
 * How to add a new migration:
 *
 * 1. Increment the version number
 * 2. Add migration steps (addColumns, createTable, etc.)
 * 3. Update the schema.ts file to match
 * 4. Test thoroughly before releasing
 *
 * Example:
 *
 * {
 *   toVersion: 2,
 *   steps: [
 *     addColumns({
 *       table: 'sermon_notes',
 *       columns: [
 *         { name: 'new_field', type: 'string', isOptional: true },
 *       ],
 *     }),
 *   ],
 * }
 *
 * Then update schema.ts:
 *
 * export const schema = appSchema({
 *   version: 2, // <-- increment this
 *   tables: [
 *     tableSchema({
 *       name: 'sermon_notes',
 *       columns: [
 *         // ... existing columns
 *         { name: 'new_field', type: 'string', isOptional: true }, // <-- add this
 *       ],
 *     }),
 *   ],
 * });
 */
