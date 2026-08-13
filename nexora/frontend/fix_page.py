import re

with open('src/app/page.tsx', 'r') as f:
    content = f.read()

# The section to remove starts at:
#      {/* ══════════════════════════════════════════════════════════
#          7.  TOP-RATED PROFESSIONALS
#      ══════════════════════════════════════════════════════════ */}
#      <section className="bg-white py-20 border-y border-gold/15">
# and ends at the corresponding </section>
# Let's extract it using regex.

match = re.search(r'(      \{\/\* ══════════════════════════════════════════════════════════\n          7\.  TOP-RATED PROFESSIONALS\n      ══════════════════════════════════════════════════════════ \*\/}\n      <section className="bg-white py-20 border-y border-gold\/15">.*?      </section>\n)', content, re.DOTALL)

if match:
    top_rated_block = match.group(1)
    
    # We want to convert the <section className="..."> to <div className="my-8 py-10 bg-white rounded-3xl border border-gold/15 shadow-sm px-6 sm:px-10">
    # And remove the <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl"> wrapper inside it.
    
    # Actually, we can just replace the <section ...> with <div className="my-8 py-10 bg-white rounded-3xl border border-gold/15 shadow-sm px-6 sm:px-10">
    # and </section> with </div>.
    
    new_block = top_rated_block.replace('<section className="bg-white py-20 border-y border-gold/15">', '<div className="my-8 py-10 bg-white rounded-3xl border border-gold/15 shadow-sm px-6 sm:px-10">')
    new_block = new_block.replace('      </section>', '      </div>')
    # Remove the container div
    new_block = new_block.replace('        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">\n', '')
    # We need to remove the matching closing </div> for the container.
    # The last </div> before </div> (which was </section>) is the container closing.
    new_block = new_block.rsplit('        </div>\n      </div>', 1)[0] + '      </div>'
    
    # Also we want to wrap it in the condition: {catSection.title === 'Home Painting' && ( ... )}
    inserted_code = f"""
                {{/* Dynamically insert Top-Rated Professionals under Home Painting */}}
                {{catSection.title === 'Home Painting' && (
{new_block}
                )}}"""
                
    # Remove the old block from the content
    content = content.replace(top_rated_block, '')
    
    # Insert the new code right after the AC & Appliance Repair block ends.
    # We look for:
    #                 )}
    #               </React.Fragment>
    
    target = "                )}\n              </React.Fragment>"
    if target in content:
        content = content.replace(target, "                )}\n" + inserted_code + "\n              </React.Fragment>")
        with open('src/app/page.tsx', 'w') as f:
            f.write(content)
        print("Success")
    else:
        print("Could not find insertion target.")
else:
    print("Could not find Top-Rated Professionals block.")

