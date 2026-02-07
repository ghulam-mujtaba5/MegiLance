import json

# Load the spec
with open('do-app-spec-final.json', 'r') as f:
    spec = json.load(f)

# Remove the ingress section completely to let DO regenerate it or use default
# The error suggests a conflict, and sometimes removing it allows DO to re-apply defaults
# OR we can try to simplify it.
# But wait, the error says "rule matching path prefix "/" already in use by rule with component: "frontend""
# This is weird because the spec defines it exactly once.
# It might be that the API sees the *existing* rule and thinks the *new* rule conflicts, even though they are the same.

# Let's try to remove the ingress block entirely and see if DO accepts it.
# If we remove it, DO might default to exposing services on random ports or not at all.
# BUT, for App Platform, if you have services with HTTP ports, it usually tries to expose them.

# Alternative strategy:
# The error might be because we are sending the FULL spec including the ingress rules that are already there.
# Let's try to keep the ingress rules but ensure they are identical. They look identical.

# Let's try to remove the 'ingress' key and see if the update works.
# If it works, we can check if the routes are still there.
if 'ingress' in spec:
    del spec['ingress']

# Save as do-app-spec-no-ingress.json
with open('do-app-spec-no-ingress.json', 'w') as f:
    json.dump(spec, f, indent=2)

print("Generated do-app-spec-no-ingress.json")
