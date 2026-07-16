# Development

**Requires Node.js >= 22.**

To start developing in xp-tool, install dependencies with `npm ci --ignore-scripts` (if you update packages in package.json, run `npm install --ignore-scripts`), and run this version with `npm start` to test your code.

If you want to run the version you are working on locally from another project, you can run it by using `<path-to-local-repo>/xptool.js`.

## Regenerating the README

The task-list section of `README.md` is auto-generated from task JSON descriptors. After adding or changing a task descriptor, run:

```
npm start -- build generate-xptool-readme
```

Do not hand-edit the generated task sections — they will be overwritten on the next run. Only the header section (above the first `##` heading) is static.

## dist/components

`dist/components/` contains pre-transpiled CJS versions of the three built-in JSX components (`Summary`, `Image`, `Description`). These files are committed to git and are injected into every user-transpiled `.xml.jsx` file at build time, making the components available without an explicit import.

They are generated from `templates/jsx/` by running:

```
node prepublish.js
```

This runs automatically before `npm publish` via the `prepublishOnly` script. If you change a built-in component template, run `node prepublish.js` and commit the updated `dist/components/` files alongside the template change.
