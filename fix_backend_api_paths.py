#!/usr/bin/env python3
"""
Script to replace all /backend/api paths with /api in the frontend codebase.
This ensures the Next.js rewrite rules work correctly.
"""

import os
import re
from pathlib import Path

# Patterns to find and replace
FIND_PATTERN = r'/backend/api'
REPLACE_PATTERN = r'/api'

# Directories to search (relative to script location)
SEARCH_DIRS = [
    'frontend/app',
    'frontend/components',
    'frontend/hooks',
    'frontend/lib',
    'frontend/public',
]

# File extensions to process
FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']

def should_process_file(filepath):
    """Check if file should be processed based on extension."""
    return any(filepath.endswith(ext) for ext in FILE_EXTENSIONS)

def replace_in_file(filepath):
    """Replace /backend/api with /api in a single file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Count occurrences
        count = content.count(FIND_PATTERN)
        if count == 0:
            return 0
        
        # Perform replacement
        new_content = content.replace(FIND_PATTERN, REPLACE_PATTERN)
        
        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        return count
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return 0

def main():
    """Main function to process all files."""
    script_dir = Path(__file__).parent
    total_replacements = 0
    files_modified = 0
    
    print("Searching for files to process...")
    
    for search_dir in SEARCH_DIRS:
        dir_path = script_dir / search_dir
        
        if not dir_path.exists():
            print(f"Warning: Directory not found: {dir_path}")
            continue
        
        print(f"\nProcessing directory: {search_dir}")
        
        for root, dirs, files in os.walk(dir_path):
            for filename in files:
                if should_process_file(filename):
                    filepath = os.path.join(root, filename)
                    rel_path = os.path.relpath(filepath, script_dir)
                    
                    count = replace_in_file(filepath)
                    if count > 0:
                        print(f"  ✓ {rel_path}: {count} replacements")
                        total_replacements += count
                        files_modified += 1
    
    print(f"\n{'='*60}")
    print(f"Summary:")
    print(f"  Files modified: {files_modified}")
    print(f"  Total replacements: {total_replacements}")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
