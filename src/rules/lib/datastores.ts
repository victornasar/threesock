// Data stores defined in Terraform, by family.
import type { FileIndex } from '../../engine/types.js';
import { resources, type TfBlock } from './terraform.js';

export const RELATIONAL =
  /^aws_(?:db_instance|rds_cluster)$|^google_sql_database_instance$|^azurerm_(?:postgresql|mysql|mssql)_(?:flexible_)?server$/;
export const ANY_STORE =
  /^aws_(?:db_instance|rds_cluster|dynamodb_table|docdb_cluster|neptune_cluster|elasticache_replication_group|redshift_cluster|efs_file_system|ebs_volume|s3_bucket|opensearch_domain|elasticsearch_domain)$|^google_(?:sql_database_instance|storage_bucket|bigtable_instance|spanner_instance|redis_instance)$|^azurerm_(?:postgresql|mysql|mssql)_(?:flexible_)?server$|^azurerm_storage_account$/;

export function stores(files: FileIndex, re: RegExp = ANY_STORE): TfBlock[] {
  return resources(files, re);
}

export function nested(b: TfBlock, ...path: string[]): TfBlock | undefined {
  let cur: TfBlock | undefined = b;
  for (const kind of path) cur = cur?.children.find((c) => c.kind === kind);
  return cur;
}
