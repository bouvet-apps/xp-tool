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

## Built-in JSX components

The `jsx-yaml` compiler ships three built-in documentation components (`Summary`,
`Description`, `Image`). They live in [lib/jsx-yaml/runtime.cjs](../lib/jsx-yaml/runtime.cjs)
and are made available to every compiled descriptor by the boilerplate wrapper — no
explicit import and no pre-transpiled `dist/` artifacts are needed.
