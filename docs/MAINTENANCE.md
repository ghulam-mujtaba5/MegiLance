# Maintenance Guide

This directory contains scripts and tools for maintaining the MegiLance project.

## Directory Structure

- `scripts/`: General utility scripts (e.g., cleanup).
- `scripts/maintenance/`: Database and schema maintenance scripts.
- `tests/scripts/`: Ad-hoc test scripts and legacy test runners.
- `docs/`: All project documentation.

## Common Tasks

### Cleanup Workspace
Remove logs, temporary files, and old reports:
```powershell
pwsh -File scripts/cleanup_workspace.ps1
```

### Run System Tests
Execute the comprehensive system test suite:
```bash
python comprehensive_test.py
```

### Verify Builds
Check frontend and backend builds:
```powershell
.\test-all-builds.ps1
```

### Database Maintenance
Scripts for database fixes and schema verification are located in `scripts/maintenance/`.
Example:
```bash
python scripts/maintenance/verify_schema.py
```
