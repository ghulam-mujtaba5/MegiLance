import re

input_file = 'docs/ALL_PAGES.md'
output_file = 'docs/ALL_PAGES.md'

# Known updated pages (based on conversation history)
updated_pages = [
    '/', '/about', '/blog', '/careers', '/community', '/contact', '/cookies', 
    '/enterprise', '/faq', '/forgot-password', '/freelancers', '/how-it-works', 
    '/jobs', '/login', '/passwordless', '/press', '/pricing', '/referral', 
    '/security', '/signup', '/verify-email', '/not-found', '/global-error'
]

# Portal patterns
portal_patterns = [
    '/admin', '/client/', '/freelancer/', '/dashboard', '/auth-dashboard', 
    '/portal', '/settings', '/messages', '/notifications', '/invoices', 
    '/contracts', '/disputes', '/payments', '/refunds'
]

def get_status(route):
    if route in updated_pages:
        return '✅ Updated'
    
    for pattern in portal_patterns:
        if route.startswith(pattern) or pattern in route:
            return '🔒 Portal (Skipped)'
            
    return '⏳ Pending'

with open(input_file, 'r') as f:
    lines = f.readlines()

new_lines = []
header_processed = False

for line in lines:
    if line.startswith('| Route | Description |'):
        new_lines.append('| Route | Description | Status |\n')
        new_lines.append('|-------|-------------|--------|\n')
        header_processed = True
        continue
    
    if line.startswith('|-------|'):
        continue
        
    if line.startswith('| `'):
        parts = line.split('|')
        if len(parts) >= 3:
            route = parts[1].strip().strip('`')
            desc = parts[2].strip()
            status = get_status(route)
            new_lines.append(f"| `{route}` | {desc} | {status} |\n")
    else:
        new_lines.append(line)

with open(output_file, 'w') as f:
    f.writelines(new_lines)

print("Updated docs/ALL_PAGES.md with status column")
