const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// Wrap Popular Services section
content = content.replace(
  '<section className="py-16 md:py-24 relative group/popular">',
  '{popularServices.length > 0 && (\n      <section className="py-16 md:py-24 relative group/popular">'
).replace(
  `        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          3.5.  BEST DEALS FOR YOU SECTION`,
  `        </div>
      </section>\n      )}\n\n      {/* ══════════════════════════════════════════════════════════\n          3.5.  BEST DEALS FOR YOU SECTION`
);

// Wrap Best Deals For You section
content = content.replace(
  '<section className="bg-beige/40 py-20 border-t border-b border-gold/10 relative group/deals">',
  '{displayDeals.length > 0 && (\n      <section className="bg-beige/40 py-20 border-t border-b border-gold/10 relative group/deals">'
).replace(
  `        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          3.5.5. CUSTOM VALUE BANNER`,
  `        </div>
      </section>\n      )}\n\n      {/* ══════════════════════════════════════════════════════════\n          3.5.5. CUSTOM VALUE BANNER`
);

// Wrap displayPackages section
content = content.replace(
  '<section className="py-16 md:py-24 bg-beige/30">',
  '{displayPackages.length > 0 && (\n      <section className="py-16 md:py-24 bg-beige/30">'
).replace(
  `        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          5.  HOW NEXORA WORKS`,
  `        </div>
      </section>\n      )}\n\n      {/* ══════════════════════════════════════════════════════════\n          5.  HOW NEXORA WORKS`
);

fs.writeFileSync('src/app/page.tsx', content);
