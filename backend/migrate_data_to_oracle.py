"""
MegiLance Database Migration Script
Migrates data from AWS RDS PostgreSQL to Oracle Autonomous Database
"""

import os
import sys
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
import logging
from datetime import datetime
import json

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DatabaseMigrator:
    def __init__(self, source_url: str, target_url: str):
        """
        Initialize database migrator
        
        Args:
            source_url: Source database connection string (AWS RDS)
            target_url: Target database connection string (Oracle ADB)
        """
        self.source_url = source_url
        self.target_url = target_url
        self.source_engine = None
        self.target_engine = None
        self.migration_stats = {
            'tables_migrated': 0,
            'total_rows': 0,
            'errors': [],
            'start_time': datetime.now(),
            'end_time': None
        }
        
    def connect(self):
        """Establish connections to source and target databases"""
        try:
            logger.info("Connecting to source database (AWS RDS)...")
            self.source_engine = create_engine(self.source_url, echo=False)
            
            logger.info("Connecting to target database (Oracle ADB)...")
            self.target_engine = create_engine(self.target_url, echo=False)
            
            # Test connections
            with self.source_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("✓ Source database connected")
            
            with self.target_engine.connect() as conn:
                conn.execute(text("SELECT 1 FROM DUAL"))
            logger.info("✓ Target database connected")
            
            return True
            
        except Exception as e:
            logger.error(f"Connection failed: {e}")
            return False
    
    def get_tables(self):
        """Get list of tables from source database"""
        inspector = inspect(self.source_engine)
        tables = inspector.get_table_names()
        
        # Filter out alembic version table
        tables = [t for t in tables if t != 'alembic_version']
        
        logger.info(f"Found {len(tables)} tables to migrate: {', '.join(tables)}")
        return tables
    
    def migrate_table(self, table_name: str) -> bool:
        """
        Migrate a single table from source to target
        
        Args:
            table_name: Name of table to migrate
            
        Returns:
            True if successful, False otherwise
        """
        try:
            logger.info(f"Migrating table: {table_name}")
            
            # Read data from source
            source_conn = self.source_engine.connect()
            result = source_conn.execute(text(f"SELECT * FROM {table_name}"))
            rows = result.fetchall()
            columns = result.keys()
            
            if len(rows) == 0:
                logger.info(f"  ⚠ Table {table_name} is empty, skipping data migration")
                source_conn.close()
                return True
            
            logger.info(f"  Found {len(rows)} rows to migrate")
            
            # Prepare insert statement for target
            column_names = ', '.join(columns)
            placeholders = ', '.join([f':{col}' for col in columns])
            insert_sql = f"INSERT INTO {table_name} ({column_names}) VALUES ({placeholders})"
            
            # Insert data into target
            target_conn = self.target_engine.connect()
            trans = target_conn.begin()
            
            try:
                # Convert rows to dictionaries
                data = [dict(zip(columns, row)) for row in rows]
                
                # Batch insert
                target_conn.execute(text(insert_sql), data)
                trans.commit()
                
                logger.info(f"  ✓ Successfully migrated {len(rows)} rows")
                self.migration_stats['total_rows'] += len(rows)
                self.migration_stats['tables_migrated'] += 1
                
            except Exception as e:
                trans.rollback()
                logger.error(f"  ✗ Error inserting data: {e}")
                self.migration_stats['errors'].append({
                    'table': table_name,
                    'error': str(e)
                })
                return False
            finally:
                target_conn.close()
                source_conn.close()
            
            return True
            
        except Exception as e:
            logger.error(f"  ✗ Error migrating table {table_name}: {e}")
            self.migration_stats['errors'].append({
                'table': table_name,
                'error': str(e)
            })
            return False
    
    def migrate_all(self):
        """Migrate all tables from source to target"""
        logger.info("=" * 60)
        logger.info("Starting database migration")
        logger.info("=" * 60)
        
        if not self.connect():
            logger.error("Failed to connect to databases. Aborting migration.")
            return False
        
        tables = self.get_tables()
        
        # Define table order for foreign key constraints
        # Tables with no dependencies first, then tables that depend on them
        table_order = [
            'users',
            'skills',
            'user_skills',
            'projects',
            'proposals',
            'contracts',
            'milestones',
            'payments',
            'portfolio_items',
            'conversations',
            'messages',
            'notifications',
            'reviews',
            'disputes',
            'user_sessions',
            'audit_logs'
        ]
        
        # Add any remaining tables not in the predefined order
        for table in tables:
            if table not in table_order:
                table_order.append(table)
        
        # Migrate tables in order
        for table in table_order:
            if table in tables:
                self.migrate_table(table)
        
        # Record end time
        self.migration_stats['end_time'] = datetime.now()
        duration = self.migration_stats['end_time'] - self.migration_stats['start_time']
        
        # Print summary
        logger.info("=" * 60)
        logger.info("Migration Summary")
        logger.info("=" * 60)
        logger.info(f"Tables migrated: {self.migration_stats['tables_migrated']} / {len(tables)}")
        logger.info(f"Total rows migrated: {self.migration_stats['total_rows']}")
        logger.info(f"Duration: {duration}")
        
        if self.migration_stats['errors']:
            logger.warning(f"Errors encountered: {len(self.migration_stats['errors'])}")
            for error in self.migration_stats['errors']:
                logger.warning(f"  - {error['table']}: {error['error']}")
        else:
            logger.info("✓ Migration completed successfully with no errors!")
        
        # Save migration report
        report_file = f"migration-report-{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            # Convert datetime objects to strings
            stats = self.migration_stats.copy()
            stats['start_time'] = stats['start_time'].isoformat()
            stats['end_time'] = stats['end_time'].isoformat()
            json.dump(stats, f, indent=2)
        logger.info(f"Migration report saved to: {report_file}")
        
        return len(self.migration_stats['errors']) == 0


def main():
    """Main migration entry point"""
    
    # Check if running from correct directory
    if not os.path.exists('alembic.ini'):
        logger.error("Please run this script from the backend directory")
        sys.exit(1)
    
    # Get database URLs from environment or arguments
    source_url = os.getenv('SOURCE_DATABASE_URL')
    target_url = os.getenv('DATABASE_URL')
    
    if len(sys.argv) >= 3:
        source_url = sys.argv[1]
        target_url = sys.argv[2]
    
    if not source_url or not target_url:
        logger.error("Database URLs not provided")
        logger.info("Usage:")
        logger.info("  Set environment variables:")
        logger.info("    SOURCE_DATABASE_URL - AWS RDS PostgreSQL connection string")
        logger.info("    DATABASE_URL - Oracle ADB connection string (from .env)")
        logger.info("  OR pass as arguments:")
        logger.info("    python migrate_data_to_oracle.py <source_url> <target_url>")
        sys.exit(1)
    
    # Confirm migration
    print("\n" + "=" * 60)
    print("DATABASE MIGRATION CONFIRMATION")
    print("=" * 60)
    print(f"Source: {source_url[:50]}...")
    print(f"Target: {target_url[:50]}...")
    print("\nThis will:")
    print("  1. Read all data from source database")
    print("  2. Insert data into target database")
    print("  3. Preserve all relationships and constraints")
    print("\n⚠ WARNING: This will overwrite existing data in target database!")
    print("=" * 60)
    
    confirm = input("\nProceed with migration? (yes/no): ")
    if confirm.lower() != 'yes':
        logger.info("Migration cancelled by user")
        sys.exit(0)
    
    # Run migration
    migrator = DatabaseMigrator(source_url, target_url)
    success = migrator.migrate_all()
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
