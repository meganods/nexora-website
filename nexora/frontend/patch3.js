const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// The closing tags that broke:
content = content.replace(
  `        </div>
      </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          3.5.  BEST DEALS FOR YOU SECTION`,
  `        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          3.5.  BEST DEALS FOR YOU SECTION`
);

content = content.replace(
  `        </div>
      </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          5.  HOW NEXORA WORKS`,
  `        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          5.  HOW NEXORA WORKS`
);

// We keep the opening tag for displayDeals, so we should keep its closing tag
// Let's check if `{displayDeals.length > 0 && (` is present
