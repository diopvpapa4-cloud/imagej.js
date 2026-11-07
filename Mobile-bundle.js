/*
 * mobile-bundle.js — Mobile UX + Plugin Store for ImageJ.JS (single-file edition)
 * -----------------------------------------------------------------------------
 * Drop this ONE file next to index.html and add this line to index.html,
 * just before the <script type="module"> tag:
 *
 *     <script src="mobile-bundle.js"></script>
 *
 * Everything is self-contained: no other files needed.
 *
 * What it adds:
 *   1. Single Window Mode — tabs at the top, no floating pop-up windows
 *   2. UI Scale — 100/125/150% interface size for phones
 *   3. Touch-friendly window chrome (bigger buttons, safe-area support)
 *   4. Plugin Store — categorized one-tap plugin install, persisted and
 *      preloaded automatically on every start (Extensions-like menu: "Mobile")
 *   5. Bundled forensic / lab macro tools (Plugins > Macros)
 *
 * How it works without modifying the boot script: this bundle wraps
 * cheerpjInit to (a) preload installed plugin JARs from the browser cache,
 * (b) point plugins.dir at the in-memory /plugins filesystem it mounts, and
 * (c) register the /plugins mount. It then installs a "Mobile" menu on
 * ImageJ's menu bar once ImageJ has started.
 */
(function () {
  'use strict';

  /* ================= catalog & macros (embedded) ================= */

  const CATALOG = {
    version: 1,
    categories: [
      { id: 'forensics', name: 'Forensics' },
      { id: 'lab-research', name: 'Lab & Research' },
      { id: 'color-analysis', name: 'Color Analysis' },
      { id: '2d-analysis', name: '2D Analysis' },
      { id: '3d-analysis', name: '3D & Stacks' },
      { id: 'ml-ai', name: 'ML / AI' },
      { id: 'macros', name: 'Macros' },
      { id: 'utilities', name: 'Utilities' },
      { id: 'custom', name: 'Installed by me' }
    ],
    plugins: [
      { id: 'morpholibj', name: 'MorphoLibJ', category: '2d-analysis',
        description: 'Morphological operations, watershed segmentation, region analysis and labeling for 2D and 3D images.',
        url: 'https://github.com/ijpb/MorphoLibJ/releases/download/v1.4.2.1/MorphoLibJ_-1.4.2.1.jar',
        homepage: 'https://imagej.net/plugins/morpholibj', preloaded: true },
      { id: 'actionbar', name: 'Action Bar', category: 'utilities',
        description: 'Configurable toolbar launcher: your most-used commands in one touch-friendly bar.',
        url: 'https://sites.imagej.net/Mutterer/plugins/action_bar.jar-20210614214121',
        homepage: 'https://imagej.net/plugins/action-bar', preloaded: true },
      { id: 'bioformats', name: 'Bio-Formats', category: 'lab-research',
        description: 'Reads/writes 150+ microscopy formats, all color types, 8/16/32-bit RGB stacks. Big download (~30 MB), cached afterwards.',
        url: 'https://downloads.openmicroscopy.org/bio-formats/7.0.1/artifacts/bioformats_package.jar',
        homepage: 'https://imagej.net/software/bio-formats', preloaded: false },
      { id: 'thunderstorm', name: 'ThunderSTORM', category: 'lab-research',
        description: 'Super-resolution microscopy (SMLM) reconstruction and analysis.',
        url: 'https://github.com/zitmen/thunderstorm/releases/download/v1.3/Thunder_STORM.jar',
        homepage: 'https://imagej.net/plugins/thunder-storm', preloaded: false },
      { id: 'deepimagej', name: 'DeepImageJ.js', category: 'ml-ai',
        description: 'Run deep-learning models (segmentation, denoising) directly in the browser.',
        url: 'https://github.com/deepimagej/deepimagej.js/releases/download/v2.0.1/DeepImageJ_JS_-2.0.1-SNAPSHOT.jar',
        homepage: 'https://deepimagej.github.io', preloaded: false },
      { id: 'trainable-weka', name: 'Trainable Weka Segmentation', category: 'ml-ai',
        description: 'Machine-learning segmentation trained by example. No direct JAR link: open Info for install instructions, or paste the JAR URL below.',
        url: null, homepage: 'https://imagej.net/plugins/tws/', preloaded: false },
      { id: 'orientationj', name: 'OrientationJ', category: 'forensics',
        description: 'Orientation / fiber / ridge analysis via gradient structure tensors. Manual download from the EPFL BIG site (see Info).',
        url: null, homepage: 'https://bigwww.epfl.ch/demo/orientation/', preloaded: false },
      { id: 'mcib3d-suite', name: '3D ImageJ Suite (mcib3d)', category: '3d-analysis',
        description: '3D segmentation, object measurement and colocalization for stacks. Manual download (see Info).',
        url: null, homepage: 'https://mcib3d.frama.io/3d-suite-imagej/', preloaded: false },
      { id: 'featurej', name: 'FeatureJ', category: 'forensics',
        description: 'Feature extraction: edges, ridges, corners, scale-space analysis. Manual download from imagescience.org (see Info).',
        url: null, homepage: 'https://imagescience.org/meijering/software/featurej/', preloaded: false },
      { id: 'macro-forensic-enhance', name: 'Forensic Enhance (macro)', category: 'macros',
        description: 'One-tap enhancement: bandpass filter, contrast, sharpening, edges.',
        url: 'embedded:plugin-macros/ForensicEnhance.ijm', homepage: null, preloaded: true },
      { id: 'macro-particle-2d', name: '2D Particle Analysis (macro)', category: 'macros',
        description: 'Otsu threshold + watershed + full measurement table (CSV export).',
        url: 'embedded:plugin-macros/ParticleAnalysis2D.ijm', homepage: null, preloaded: true },
      { id: 'macro-color-analysis', name: 'Color Analysis RGB+HSB (macro)', category: 'macros',
        description: 'Splits RGB and HSB channels, red/green colocalization report.',
        url: 'embedded:plugin-macros/ColorAnalysis.ijm', homepage: null, preloaded: true }
    ]
  };

  const EMBEDDED_MACROS = {
    'plugin-macros/ForensicEnhance.ijm':
      '// Forensic Enhance: bandpass + contrast + sharpen + edges\n' +
      'macro "Forensic Enhance" {\n' +
      '    if (nImages()==0) exit("Open an image first.");\n' +
      '    run("Duplicate...", "title=Enhanced");\n' +
      '    run("32-bit");\n' +
      '    run("Bandpass Filter...", "filter_large=40 filter_small=2 suppress=None tolerance=5");\n' +
      '    run("Enhance Contrast", "saturated=0.4");\n' +
      '    run("Convolve...", "text1=[0 -1 0\\n-1 5 -1\\n0 -1 0] normalize");\n' +
      '    run("Find Edges");\n' +
      '    run("RGB Color");\n' +
      '    showMessage("Forensic Enhance", "Applied: bandpass, contrast,\\nsharpening and edge detection.");\n' +
      '}\n',
    'plugin-macros/ParticleAnalysis2D.ijm':
      '// 2D Particle Analysis: Otsu + watershed + measurements\n' +
      'macro "2D Particle Analysis" {\n' +
      '    if (nImages()==0) exit("Open an image first.");\n' +
      '    run("Duplicate...", "title=Analysis");\n' +
      '    if (bitDepth()==24) run("8-bit");\n' +
      '    run("Auto Threshold", "method=Otsu");\n' +
      '    run("Watershed");\n' +
      '    run("Set Measurements...", "area bounding center perimeter shape feret display redirect=None decimal=3");\n' +
      '    run("Analyze Particles...", "size=10-Infinity circularity=0.00-1.00 show=Outlines display exclude clear summarize");\n' +
      '}\n',
    'plugin-macros/ColorAnalysis.ijm':
      '// Color Analysis: RGB/HSB split + colocalization\n' +
      'macro "Color Analysis (RGB + HSB)" {\n' +
      '    if (nImages()==0) exit("Open an image first.");\n' +
      '    if (bitDepth()!=24) exit("This macro expects an RGB color image.");\n' +
      '    run("Duplicate...", "title=ColorCopy");\n' +
      '    selectImage("ColorCopy");\n' +
      '    run("RGB Split");\n' +
      '    run("HSB Stack");\n' +
      '    if (isOpen("ColorCopy (red)") && isOpen("ColorCopy (green)"))\n' +
      '        run("Colocalization...", "red=ColorCopy (red) green=ColorCopy (green) pearson rank=1 display");\n' +
      '}\n'
  };

  /* ================= styles (injected) ================= */

  (function injectStyles() {
    const style = document.createElement('style');
    style.textContent = [
      /* Tab bar (Single Window Mode) */
      '#ijTabBar{position:fixed;top:0;left:0;right:0;height:44px;display:flex;align-items:center;gap:6px;',
      'padding:4px 6px;padding-left:max(6px,env(safe-area-inset-left));padding-right:max(6px,env(safe-area-inset-right));',
      'background:#1f2937;overflow-x:auto;overflow-y:hidden;z-index:21000;-webkit-overflow-scrolling:touch;',
      'box-shadow:0 2px 6px rgba(0,0,0,0.25);}#ijTabBar::-webkit-scrollbar{display:none;}',
      '#ijTabBar .ijTab{flex-shrink:0;display:inline-flex;align-items:center;gap:6px;max-width:180px;padding:6px 12px;',
      'border-radius:8px;background:rgba(255,255,255,0.08);color:#d1d5db;font-family:system-ui,-apple-system,sans-serif;',
      'font-size:0.8rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;touch-action:manipulation;}',
      '#ijTabBar .ijTab.active{background:#3b82f6;color:#fff;font-weight:600;}',
      '#ijTabBar .ijTabClose{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;',
      'border-radius:50%;background:rgba(0,0,0,0.25);font-size:0.65rem;}',
      /* Touch-friendly CheerpJ chrome */
      '.cjTitleBar{height:30px!important;padding:4px 8px!important;}',
      '.cjTitleBarText{font-size:13px!important;line-height:22px!important;}',
      '.cjControls{width:24px!important;height:24px!important;padding:4px!important;margin-left:8px!important;}',
      '@media (max-width:640px){.cjWindow{max-width:100vw!important;}}',
      '#cheerpjDisplay{-webkit-user-select:none;user-select:none;}'
    ].join('');
    document.head.appendChild(style);
  })();

  /* ================= in-memory /plugins filesystem ================= */

  function PluginFS() {
    this.files = new Map();
    this.directories = new Set();
  }
  PluginFS.prototype.addFile = function (path, data) {
    this.files.set(path, data);
    const parts = path.split('/');
    let cur = '';
    for (let i = 0; i < parts.length - 1; i++) { cur += (cur ? '/' : '') + parts[i]; this.directories.add(cur); }
  };
  PluginFS.prototype.removeFile = function (path) { this.files.delete(path); };
  PluginFS.prototype.getFile = function (path) { return this.files.get(path) || null; };
  PluginFS.prototype.isDirectory = function (path) { return this.directories.has(path); };
  PluginFS.prototype.listDirectory = function (path) {
    const entries = [];
    const prefix = path ? path + '/' : '';
    const pl = prefix.length;
    this.files.forEach((_, fp) => {
      if (fp.startsWith(prefix)) {
        const rem = fp.substring(pl);
        const s = rem.indexOf('/');
        if (s === -1) { if (!entries.includes(rem)) entries.push(rem); }
        else { const d = rem.substring(0, s); if (!entries.includes(d)) entries.push(d); }
      }
    });
    this.directories.forEach((dp) => {
      if (dp.startsWith(prefix) && dp !== path) {
        const rem = dp.substring(pl);
        const s = rem.indexOf('/');
        const d = s === -1 ? rem : rem.substring(0, s);
        if (d && !entries.includes(d)) entries.push(d);
      }
    });
    return entries;
  };

  const pluginFS = new PluginFS();
  window.pluginFS = pluginFS;

  /* --- CheerpJ mount ops (mirrors the app's /local pattern) --- */

  function pluginStatAsync(mp, path, fileRef, cb) {
    const rel = path === '' || path === '/' ? '' : path.substring(1);
    if (rel === '') {
      fileRef.inodeId = Math.floor(Math.random() * 1000000);
      fileRef.uid = 0; fileRef.gid = 0;
      fileRef.permType = CheerpJFileData.S_IFDIR | 0o777;
      fileRef.lastModified = Math.floor(Date.now() / 1000);
      return cb();
    }
    const f = pluginFS.getFile(rel);
    if (f) {
      fileRef.inodeId = Math.floor(Math.random() * 1000000);
      fileRef.uid = 0; fileRef.gid = 0;
      fileRef.permType = CheerpJFileData.S_IFREG | 0o444;
      fileRef.fileLength = f.length;
      fileRef.lastModified = Math.floor(Date.now() / 1000);
      return cb();
    }
    if (pluginFS.isDirectory(rel)) {
      fileRef.inodeId = Math.floor(Math.random() * 1000000);
      fileRef.uid = 0; fileRef.gid = 0;
      fileRef.permType = CheerpJFileData.S_IFDIR | 0o777;
      fileRef.lastModified = Math.floor(Date.now() / 1000);
      return cb();
    }
    fileRef.permType = 0;
    return cb();
  }

  function pluginListAsync(mp, path, fileRef, cb) {
    const rel = path === '' || path === '/' ? '' : path.substring(1);
    try { pluginFS.listDirectory(rel).forEach((e) => fileRef.push(e)); } catch (e) {}
    return cb();
  }

  function pluginFileReadAsync(fileData, fileOffset, buf, off, len, flags, cb) {
    if (fileOffset >= fileData.length) return cb(0);
    if (fileOffset + len > fileData.length) len = fileData.length - fileOffset;
    if (len <= 0) return cb(0);
    const d = fileData.pluginData;
    if (!d) return cb(0);
    for (let i = 0; i < len; i++) buf[off + i] = d[fileOffset + i];
    return cb(len);
  }

  function pluginMakeFileData(mp, path, mode, uid, gid, cb) {
    const rel = path === '' || path === '/' ? '' : path.substring(1);
    if (rel === '') {
      const fd = new CheerpJFileData(mp, path, 0, Math.floor(Math.random() * 1000000),
        CheerpJFileData.S_IFDIR | 0o777, Math.floor(Date.now() / 1000), uid, gid);
      fd.mount = mp.inodeOps;
      return cb(fd);
    }
    if (mode === 'r') {
      const f = pluginFS.getFile(rel);
      if (!f) return cb(null);
      const fd = new CheerpJFileData(mp, path, f.length, Math.floor(Math.random() * 1000000),
        CheerpJFileData.S_IFREG | 0o444, Math.floor(Date.now() / 1000), uid, gid);
      fd.pluginData = f;
      fd.data = f;
      fd.mount = mp.inodeOps;
      return cb(fd);
    }
    return cb(null); // /plugins is read-only
  }

  const PluginOps = {
    statAsync: pluginStatAsync, listAsync: pluginListAsync, makeFileData: pluginMakeFileData,
    createDirAsync: null, renameAsync: null, linkAsync: null, unlinkAsync: null
  };
  const PluginInodeOps = { readAsync: pluginFileReadAsync, writeAsync: null, close: null };

  function CheerpJPluginFolder(mp) {
    this.mountPoint = mp;
    this.isSplit = false;
    this.mountOps = PluginOps;
    this.inodeOps = PluginInodeOps;
    this.devId = 300;
    this.fileCache = {};
    this.cacheThreads = {};
    this.inodeCache = [];
  }
  CheerpJPluginFolder.prototype.getCached = function (f) {
    const c = this.fileCache;
    if (!c.hasOwnProperty(f)) return null;
    return this.inodeCache[c[f]];
  };
  CheerpJPluginFolder.prototype.setCached = function (f, d) {
    this.fileCache[f] = d.inodeId;
    this.inodeCache[d.inodeId] = d;
  };
  CheerpJPluginFolder.prototype.clearCached = function (f) {
    if (this.fileCache.hasOwnProperty(f)) delete this.fileCache[f];
  };
  CheerpJPluginFolder.prototype.decRefCached = function () {};

  function createPluginFileSystemPatches() {
    try {
      const folder = new CheerpJPluginFolder('/plugins/');
      const rootIndex = cheerpjFSMounts.findIndex((m) => m.mountPoint === '/');
      if (rootIndex !== -1) cheerpjFSMounts.splice(rootIndex, 0, folder);
      else cheerpjFSMounts.push(folder);
      console.log('[mobile-bundle] /plugins mount registered');
    } catch (e) {
      console.warn('[mobile-bundle] failed to register /plugins mount:', e);
    }
  }

  /* ================= plugin store core ================= */

  const STORAGE_KEY = 'imagejjs.pluginStore.installed';
  const CACHE_NAME = 'imagejjs-plugin-jars-v1';
  const installed = new Map(); // id -> {id,name,category,url,path}

  function readInstalled() {
    try { (JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')).forEach((e) => installed.set(e.id, e)); }
    catch (e) {}
  }
  function writeInstalled() { localStorage.setItem(STORAGE_KEY, JSON.stringify([...installed.values()])); }

  async function fetchJarBytes(url) {
    if (url.startsWith('embedded:')) {
      const text = EMBEDDED_MACROS[url.substring('embedded:'.length)];
      if (!text) throw new Error('embedded file not found');
      return new TextEncoder().encode(text);
    }
    if ('caches' in window) {
      try {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(url);
        if (cached) return new Uint8Array(await cached.arrayBuffer());
        const resp = await fetch(url, { mode: 'cors' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        await cache.put(url, resp.clone());
        return new Uint8Array(await resp.arrayBuffer());
      } catch (e) { console.warn('[mobile-bundle] cache error, direct fetch:', e.message); }
    }
    const resp = await fetch(url, { mode: 'cors' });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    return new Uint8Array(await resp.arrayBuffer());
  }

  function pathFor(entry) {
    const fileName = entry.url.split('/').pop().split('?')[0];
    return entry.category + '/' + fileName;
  }

  async function installEntry(entry, opts) {
    opts = opts || {};
    if (!entry.url) throw new Error('No direct download URL. Open "Info" for the download page, then use "Install from URL".');
    const bytes = await fetchJarBytes(entry.url);
    const path = pathFor(entry);
    pluginFS.addFile(path, bytes);
    installed.set(entry.id, { id: entry.id, name: entry.name, category: entry.category, url: entry.url, path });
    writeInstalled();
    if (!opts.silent) toast(entry.name + ' installed (' + (bytes.length / 1048576).toFixed(1) + ' MB). Reload the page to activate.');
    return bytes.length;
  }

  async function installFromUrl(url, name) {
    const fileName = url.split('/').pop().split('?')[0];
    const bytes = await fetchJarBytes(url);
    const path = 'custom/' + fileName;
    pluginFS.addFile(path, bytes);
    const id = 'custom:' + url;
    installed.set(id, { id, name: name || fileName, category: 'custom', url, path });
    writeInstalled();
    toast(fileName + ' installed. Reload the page to activate.');
    renderStorePanel();
  }

  function removeEntry(id) {
    const e = installed.get(id);
    if (!e) return;
    pluginFS.removeFile(e.path);
    installed.delete(id);
    writeInstalled();
    if ('caches' in window) caches.open(CACHE_NAME).then((c) => c.delete(e.url)).catch(() => {});
    toast(e.name + ' removed. Reload the page to finish.');
    renderStorePanel();
  }

  // Runs inside the wrapped cheerpjInit, BEFORE ImageJ starts.
  async function preload() {
    readInstalled();
    if (installed.size === 0) {
      // First run: install the curated default set (works offline for macros)
      for (const p of CATALOG.plugins) {
        if (p.preloaded) {
          try { await installEntry(p, { silent: true }); console.log('[mobile-bundle] preloaded', p.name); }
          catch (e) { console.warn('[mobile-bundle] preload failed for', p.name, e.message); }
        }
      }
    } else {
      await Promise.allSettled([...installed.values()].map(async (e) => {
        try { pluginFS.addFile(e.path, await fetchJarBytes(e.url)); }
        catch (err) { console.warn('[mobile-bundle] could not restore', e.name, err.message); }
      }));
    }
    return pluginFS.files.size;
  }

  /* ================= store UI (mobile bottom sheet) ================= */

  let activeCategory = 'all';

  function ensurePanelDom() {
    let el = document.getElementById('pluginStorePanel');
    if (el) return el;
    const style = document.createElement('style');
    style.textContent = [
      '#pluginStorePanel{position:fixed;inset:0;z-index:30000;display:none;}',
      '#pluginStorePanel.open{display:block;}',
      '#pluginStorePanel .ps-backdrop{position:absolute;inset:0;background:rgba(0,0,0,0.45);}',
      '#pluginStorePanel .ps-sheet{position:absolute;left:0;right:0;bottom:0;max-height:85vh;background:#fff;',
      'border-radius:16px 16px 0 0;display:flex;flex-direction:column;box-shadow:0 -4px 24px rgba(0,0,0,0.3);font-family:system-ui,sans-serif;}',
      '#pluginStorePanel .ps-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;b
