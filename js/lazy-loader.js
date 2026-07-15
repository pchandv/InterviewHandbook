/* ═══════════════════════════════════════════════════════════════════
   LAZY-LOADER.JS — On-demand Script Injection for Data Modules
   ═══════════════════════════════════════════════════════════════════
   Loads data files (topic modules) on demand via dynamic <script>
   tag injection. Prevents duplicate loads and deduplicates concurrent
   requests for the same file.

   Dependencies: SiteMap (must be loaded before this module)
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

const LazyLoader = (() => {
    const LOAD_TIMEOUT_MS = 10000;

    const loaded = new Set();     // Paths that have been successfully loaded
    const loading = new Map();    // In-flight loads: path → Promise

    /**
     * Load a single data file by path via script injection.
     * Returns a Promise that resolves when the script has executed.
     * Rejects on network error or if loading exceeds 10 seconds.
     * @param {string} filePath - Relative path to the JS data file
     * @returns {Promise<void>}
     */
    function loadFile(filePath) {
        if (loaded.has(filePath)) return Promise.resolve();
        if (loading.has(filePath)) return loading.get(filePath);

        const promise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = filePath;

            const timeout = setTimeout(() => {
                loading.delete(filePath);
                script.onload = null;
                script.onerror = null;
                reject(new Error(`Timeout loading: ${filePath}`));
            }, LOAD_TIMEOUT_MS);

            script.onload = () => {
                clearTimeout(timeout);
                loaded.add(filePath);
                loading.delete(filePath);
                resolve();
            };

            script.onerror = () => {
                clearTimeout(timeout);
                loading.delete(filePath);
                reject(new Error(`Failed to load: ${filePath}`));
            };

            document.head.appendChild(script);
        });

        loading.set(filePath, promise);
        return promise;
    }

    /**
     * Load a specific page's data file by resolving its path from SiteMap.
     * @param {string} pageId - The page identifier
     * @returns {Promise<void>}
     */
    function loadPage(pageId) {
        const filePath = SiteMap.getDataFilePath(pageId);
        if (!filePath) return Promise.reject(new Error(`No data file for: ${pageId}`));
        return loadFile(filePath);
    }

    /**
     * Preload all data files for a given level.
     * @param {number} levelNum - Level number (0-16)
     * @returns {Promise<void[]>}
     */
    function preloadLevel(levelNum) {
        const items = SiteMap.getLevelItems(levelNum);
        const paths = items.map(item => SiteMap.getDataFilePath(item.id)).filter(Boolean);
        return Promise.all(paths.map(p => loadFile(p)));
    }

    /**
     * Check whether a file path has already been loaded.
     * @param {string} filePath - Relative path to check
     * @returns {boolean}
     */
    function isLoaded(filePath) {
        return loaded.has(filePath);
    }

    console.log('[LazyLoader] initialized');

    return { loadFile, loadPage, preloadLevel, isLoaded };
})();
