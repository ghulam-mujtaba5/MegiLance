import os
import re

file_list = r"""
E:\MegiLance\frontend\app\page.tsx
E:\MegiLance\frontend\app\(auth)\auth-dashboard\page.tsx
E:\MegiLance\frontend\app\(auth)\auth-dashboard\(dashboard)\analytics\page.tsx
E:\MegiLance\frontend\app\(auth)\auth-dashboard\(dashboard)\community\page.tsx
E:\MegiLance\frontend\app\(auth)\auth-dashboard\(dashboard)\dashboard\page.tsx
E:\MegiLance\frontend\app\(auth)\auth-dashboard\(dashboard)\messages\page.tsx
E:\MegiLance\frontend\app\(auth)\auth-dashboard\(dashboard)\projects\page.tsx
E:\MegiLance\frontend\app\(auth)\auth-dashboard\(dashboard)\wallet\page.tsx
E:\MegiLance\frontend\app\(auth)\forgot-password\page.tsx
E:\MegiLance\frontend\app\(auth)\login\page.tsx
E:\MegiLance\frontend\app\(auth)\passwordless\page.tsx
E:\MegiLance\frontend\app\(auth)\reset-password\page.tsx
E:\MegiLance\frontend\app\(auth)\signup\page.tsx
E:\MegiLance\frontend\app\(auth)\verify-email\page.tsx
E:\MegiLance\frontend\app\(main)\page.tsx
E:\MegiLance\frontend\app\(main)\about\page.tsx
E:\MegiLance\frontend\app\(main)\careers\page.tsx
E:\MegiLance\frontend\app\(main)\clients\[id]\page.tsx
E:\MegiLance\frontend\app\(main)\community\page.tsx
E:\MegiLance\frontend\app\(main)\contact\page.tsx
E:\MegiLance\frontend\app\(main)\enterprise\page.tsx
E:\MegiLance\frontend\app\(main)\faq\page.tsx
E:\MegiLance\frontend\app\(main)\freelancers\page.tsx
E:\MegiLance\frontend\app\(main)\freelancers\[id]\page.tsx
E:\MegiLance\frontend\app\(main)\jobs\page.tsx
E:\MegiLance\frontend\app\(main)\jobs\[id]\page.tsx
E:\MegiLance\frontend\app\(main)\press\page.tsx
E:\MegiLance\frontend\app\(main)\pricing\page.tsx
E:\MegiLance\frontend\app\(main)\status\page.tsx
E:\MegiLance\frontend\app\(portal)\admin\ai-monitoring\page.tsx
E:\MegiLance\frontend\app\(portal)\admin\analytics\page.tsx
E:\MegiLance\frontend\app\(portal)\admin\api-keys\page.tsx
E:\MegiLance\frontend\app\(portal)\admin\audit\page.tsx
E:\MegiLance\frontend\app\(portal)\admin\billing\page.tsx
E:\MegiLance\frontend\app\(portal)\admin\branding\page.tsx
E:\MegiLance\frontend\app\(portal)\admin\calendar\page.tsx
E:\MegiLance\frontend\app\(portal)\admin\compliance\page.tsx
E:\MegiLance\frontend\app\(portal)\admin\dashboard\page.tsx
E:\MegiLance\frontend\app\(portal)\admin\disputes\page.tsx
E:\MegiLance\frontend\app\(portal)\admin\disputes\[id]\page.tsx
E:\MegiLance\frontend\app\(portal)\admin\export\page.tsx
E:\MegiLance\frontend\app\(portal)\admin\feedback\page.tsx
E:\MegiLance\frontend\app\(portal)\admin\fraud-detection\page.tsx
E:\MegiLance\frontend\app\(portal)\admin\help\page.tsx
E:\MegiLance\frontend\app\(portal)\admin\messages\page.tsx
E:\MegiLance\frontend\app\(portal)\admin\metrics\page.tsx
E:\MegiLance\frontend\app\(portal)\admin\payments\page.tsx
E:\MegiLance\frontend\app\(portal)\admin\payments\invoices\page.tsx
E:\MegiLance\frontend\app\(portal)\admin\payments\refunds\page.tsx
E:\MegiLance\frontend\app\(portal)\admin\profile\page.tsx
E:\MegiLance\frontend\app\(portal)\admin\projects\page.tsx
E:\MegiLance\frontend\app\(portal)\admin\search-analytics\page.tsx
E:\MegiLance\frontend\app\(portal)\admin\settings\page.tsx
E:\MegiLance\frontend\app\(portal)\admin\skills\page.tsx
E:\MegiLance\frontend\app\(portal)\admin\support\page.tsx
E:\MegiLance\frontend\app\(portal)\admin\users\page.tsx
E:\MegiLance\frontend\app\(portal)\admin\webhooks\page.tsx
E:\MegiLance\frontend\app\(portal)\audit-logs\page.tsx
E:\MegiLance\frontend\app\(portal)\client\analytics\page.tsx
E:\MegiLance\frontend\app\(portal)\client\contracts\page.tsx
E:\MegiLance\frontend\app\(portal)\client\contracts\[id]\page.tsx
E:\MegiLance\frontend\app\(portal)\client\dashboard\page.tsx
E:\MegiLance\frontend\app\(portal)\client\freelancers\page.tsx
E:\MegiLance\frontend\app\(portal)\client\help\page.tsx
E:\MegiLance\frontend\app\(portal)\client\hire\page.tsx
E:\MegiLance\frontend\app\(portal)\client\messages\page.tsx
E:\MegiLance\frontend\app\(portal)\client\payments\page.tsx
E:\MegiLance\frontend\app\(portal)\client\post-job\page.tsx
E:\MegiLance\frontend\app\(portal)\client\profile\page.tsx
E:\MegiLance\frontend\app\(portal)\client\projects\page.tsx
E:\MegiLance\frontend\app\(portal)\client\projects\[id]\page.tsx
E:\MegiLance\frontend\app\(portal)\client\reviews\page.tsx
E:\MegiLance\frontend\app\(portal)\client\settings\page.tsx
E:\MegiLance\frontend\app\(portal)\client\wallet\page.tsx
E:\MegiLance\frontend\app\(portal)\complete-profile\page.tsx
E:\MegiLance\frontend\app\(portal)\contracts\create\page.tsx
E:\MegiLance\frontend\app\(portal)\contracts\[contractId]\review\page.tsx
E:\MegiLance\frontend\app\(portal)\create-project\page.tsx
E:\MegiLance\frontend\app\(portal)\dashboard\page.tsx
E:\MegiLance\frontend\app\(portal)\dashboard\analytics\page.tsx
E:\MegiLance\frontend\app\(portal)\dashboard\community\page.tsx
E:\MegiLance\frontend\app\(portal)\dashboard\projects\page.tsx
E:\MegiLance\frontend\app\(portal)\dashboard\wallet\page.tsx
E:\MegiLance\frontend\app\(portal)\disputes\create\page.tsx
E:\MegiLance\frontend\app\(portal)\disputes\[id]\page.tsx
E:\MegiLance\frontend\app\(portal)\favorites\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\activity\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\analytics\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\assessments\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\assessments\new\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\availability\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\calls\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\career\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\communication\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\contracts\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\contracts\[id]\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\dashboard\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\feedback\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\file-versions\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\files\versions\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\gamification\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\help\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\integrations\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\invoices\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\job-alerts\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\jobs\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\jobs\saved-searches\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\legal\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\messages\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\my-jobs\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\notes\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\portfolio\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\portfolio\add\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\portfolio\showcase\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\portfolio-showcase\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\profile\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\projects\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\projects\[id]\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\proposals\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\rank\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\rate-cards\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\referrals\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\reviews\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\settings\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\settings\currency\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\settings\notifications\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\settings\password\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\settings\security\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\submit-proposal\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\subscription\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\support\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\support\knowledge-base\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\teams\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\templates\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\time-entries\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\time-tracking\[id]\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\verification\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\wallet\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\withdraw\page.tsx
E:\MegiLance\frontend\app\(portal)\freelancer\workflows\page.tsx
E:\MegiLance\frontend\app\(portal)\help\page.tsx
E:\MegiLance\frontend\app\(portal)\invoices\create\page.tsx
E:\MegiLance\frontend\app\(portal)\messages\page.tsx
E:\MegiLance\frontend\app\(portal)\messages\new\page.tsx
E:\MegiLance\frontend\app\(portal)\notifications\page.tsx
E:\MegiLance\frontend\app\(portal)\onboarding\tour\page.tsx
E:\MegiLance\frontend\app\(portal)\payments\page.tsx
E:\MegiLance\frontend\app\(portal)\payments\add-funds\page.tsx
E:\MegiLance\frontend\app\(portal)\projects\page.tsx
E:\MegiLance\frontend\app\(portal)\refunds\create\page.tsx
E:\MegiLance\frontend\app\(portal)\search\page.tsx
E:\MegiLance\frontend\app\(portal)\settings\page.tsx
E:\MegiLance\frontend\app\(portal)\settings\notifications\page.tsx
E:\MegiLance\frontend\app\(portal)\settings\payout-methods\add\page.tsx
E:\MegiLance\frontend\app\(portal)\settings\security\2fa\page.tsx
E:\MegiLance\frontend\app\(portal)\support\new\page.tsx
E:\MegiLance\frontend\app\ai\chatbot\page.tsx
E:\MegiLance\frontend\app\ai\fraud-check\page.tsx
E:\MegiLance\frontend\app\ai\price-estimator\page.tsx
E:\MegiLance\frontend\app\analytics\page.tsx
E:\MegiLance\frontend\app\blog\page.tsx
E:\MegiLance\frontend\app\blog\search\page.tsx
E:\MegiLance\frontend\app\blog\[slug]\page.tsx
E:\MegiLance\frontend\app\clients\page.tsx
E:\MegiLance\frontend\app\cookies\page.tsx
E:\MegiLance\frontend\app\home\page.tsx
E:\MegiLance\frontend\app\how-it-works\page.tsx
E:\MegiLance\frontend\app\install\page.tsx
E:\MegiLance\frontend\app\legal\privacy\page.tsx
E:\MegiLance\frontend\app\legal\terms\page.tsx
E:\MegiLance\frontend\app\logout\page.tsx
E:\MegiLance\frontend\app\onboarding\page.tsx
E:\MegiLance\frontend\app\privacy\page.tsx
E:\MegiLance\frontend\app\profile\page.tsx
E:\MegiLance\frontend\app\referral\page.tsx
E:\MegiLance\frontend\app\security\page.tsx
E:\MegiLance\frontend\app\support\page.tsx
E:\MegiLance\frontend\app\talent\page.tsx
E:\MegiLance\frontend\app\teams\page.tsx
E:\MegiLance\frontend\app\terms\page.tsx
E:\MegiLance\frontend\app\test-login\page.tsx
E:\MegiLance\frontend\app\testimonials\page.tsx
E:\MegiLance\frontend\app\user-management\page.tsx
E:\MegiLance\frontend\app\wallet\page.tsx
"""

lines = file_list.strip().split('\n')
routes = []

for line in lines:
    # Normalize path separators
    path = line.replace('\\', '/')
    
    # Remove prefix
    if 'frontend/app/' in path:
        path = path.split('frontend/app/')[1]
    
    # Remove page.tsx
    path = path.replace('/page.tsx', '')
    if path == 'page.tsx':
        path = '/'
    
    # Handle route groups (remove (groupname))
    # We want to remove segments that start with ( and end with )
    segments = path.split('/')
    clean_segments = [s for s in segments if not (s.startswith('(') and s.endswith(')'))]
    
    route = '/' + '/'.join(clean_segments)
    
    # Handle root path case
    if route == '//':
        route = '/'
    
    # Clean up double slashes if any
    route = route.replace('//', '/')
    
    # If empty after cleaning (e.g. just route groups), it's root
    if route == '':
        route = '/'

    routes.append(route)

# Sort and remove duplicates
routes = sorted(list(set(routes)))

# Generate Markdown
md_content = "# All Application Pages\n\n"
md_content += f"Total Pages: {len(routes)}\n\n"
md_content += "| Route | Description |\n"
md_content += "|-------|-------------|\n"

for route in routes:
    md_content += f"| `{route}` | |\n"

with open('e:/MegiLance/docs/ALL_PAGES.md', 'w') as f:
    f.write(md_content)

print("Markdown file generated at docs/ALL_PAGES.md")
