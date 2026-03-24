import type { ExtractTablesWithRelations } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import { withReplicas } from "./replicas";
import * as schema from "./schema";

const isDevelopment = process.env.NODE_ENV === "development";

const connectionConfig = {
  max: isDevelopment ? 8 : 12,
  idleTimeoutMillis: isDevelopment ? 5000 : 60000,
  connectionTimeoutMillis: 15000,
  maxUses: isDevelopment ? 100 : 0,
  allowExitOnIdle: true,
};

/**
 * Create a Pool that strips prepared statement names from queries.
 * Supabase's transaction pooler (PgBouncer) does not support prepared
 * statements. By removing the `name` field from query configs, pg falls
 * back to the simple query protocol which works with any pooler.
 */
function createPool(connectionString: string) {
  const pool = new Pool({
    connectionString,
    ...connectionConfig,
  });

  // Wrap the pool's query to strip prepared statement names
  const originalQuery = pool.query.bind(pool);
  // @ts-expect-error — overloaded signature, safe at runtime
  pool.query = (configOrText: any, ...args: any[]) => {
    if (
      typeof configOrText === "object" &&
      configOrText !== null &&
      "name" in configOrText
    ) {
      const { name, ...rest } = configOrText;
      return originalQuery(rest, ...args);
    }
    return originalQuery(configOrText, ...args);
  };

  return pool;
}

const primaryPool = createPool(
  process.env.DATABASE_PRIMARY_URL || process.env.DATABASE_URL!,
);

export const primaryDb = drizzle(primaryPool, {
  schema,
  casing: "snake_case",
});

const hasReplicas = Boolean(
  process.env.DATABASE_FRA_URL &&
    process.env.DATABASE_SJC_URL &&
    process.env.DATABASE_IAD_URL,
);

function createDb() {
  if (!hasReplicas) {
    // No replicas — return primaryDb with $primary compat property
    return Object.assign(primaryDb, {
      $primary: primaryDb,
      usePrimaryOnly: () => primaryDb,
    });
  }

  const fraPool = createPool(process.env.DATABASE_FRA_URL!);
  const sjcPool = createPool(process.env.DATABASE_SJC_URL!);
  const iadPool = createPool(process.env.DATABASE_IAD_URL!);

  const getReplicaIndexForRegion = () => {
    switch (process.env.FLY_REGION) {
      case "fra":
        return 0;
      case "iad":
        return 1;
      case "sjc":
        return 2;
      default:
        return 0;
    }
  };

  const replicaIndex = getReplicaIndexForRegion();

  return withReplicas(
    primaryDb,
    [
      drizzle(fraPool, { schema, casing: "snake_case" }),
      drizzle(iadPool, { schema, casing: "snake_case" }),
      drizzle(sjcPool, { schema, casing: "snake_case" }),
    ],
    (replicas) => replicas[replicaIndex]!,
  );
}

export const db = createDb();

// Keep connectDb for backward compatibility, but just return the singleton
export const connectDb = async () => {
  return db;
};

export type Database = Awaited<ReturnType<typeof connectDb>>;

export type TransactionClient = PgTransaction<
  NodePgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

/** Use in query functions that should work both standalone and within transactions */
export type DatabaseOrTransaction = Database | TransactionClient;

export type DatabaseWithPrimary = Database & {
  $primary?: Database;
  usePrimaryOnly?: () => Database;
};
