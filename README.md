# xptool 2.0.0-B12
```xptool``` is a tool for daily development needs in Enonic XP.

```npm install -g @bouvet-apps/xp-tool```

## build:generate-xptool-readme
Generates README.md for xptool.


**Syntax:**
```
xptool build generate-xptool-readme
```  
  
## content-type:create
Creates a content type from a set of templates.


**Syntax:**
```
xptool content-type create
```  
  
## content-type:list
Lists all content types in the project.


**Syntax:**
```
xptool content-type list
```  
  
## documentation:generate-legacy
Generates user documentation for the project using XML files in /code dir.

The documentation will be generated to markdown in the build folder, and rendered to HTML accessible for the userdoc admin tool.


**Syntax:**
```
xptool documentation generate-legacy
```  
  
## documentation:generate
Generates user documentation for the project.

The documentation will be generated to markdown in the build folder, and rendered to HTML accessible for the userdoc admin tool.


**Syntax:**
```
xptool documentation generate
```  
  
## job:create
Creates and schedules a job from a set of templates.


**Syntax:**
```
xptool job create
```  
  
## job:list
Lists all jobs in the project.


**Syntax:**
```
xptool job list
```  
  
## jsx-xml:build
Compile all *.xml.jsx files to XML in build folder.


**Syntax:**
```
xptool jsx-xml build
```  
  
## jsx-xml:convert
Converts all XML files in /site directory to JSX.


**Syntax:**
```
xptool jsx-xml convert
```  
  
## jsx-xml:watch
Starts a watcher on *.xml.jsx files


**Syntax:**
```
xptool jsx-xml watch
```  
  
## layout:create
Creates a layout from a set of templates. The generated layout can have 1-12 columns.


**Syntax:**
```
xptool layout create
```  
  
## layout:list
Lists all layouts in the project.


**Syntax:**
```
xptool layout list
```  
  
## mixin:list
Lists all mixins in the project.


**Syntax:**
```
xptool mixin list
```  
  
## page:create
Creates a page from a set of templates.


**Syntax:**
```
xptool page create
```  
  
## page:list
Lists all pages in the project.


**Syntax:**
```
xptool page list
```  
  
## part:create
Creates a part from a set of templates.


**Syntax:**
```
xptool part create
```  
  
## part:list
Lists all parts in the project.


**Syntax:**
```
xptool part list
```  
  
## phrase:add
Adds a phrase to all installed locales.

**Syntax:**
```
xptool phrase add
```  
  
## phrase:check-missing
Checks all phrases for usage. Reports both missing phrases and unused phrases.
You can optionally specify a ```--language=no``` switch to force a check on a specific language file.

Loops through and checks phrase usage for the following:
* Content-type XML files
* Part XML files
* Layout XML files
* X-data XML files
* Mixin XML files
* Page XML files
* Site descriptor (site.xml)
* Freemarker templates (*.ftl)
* Backend javascript (*.es6/*.js)
* Frontend javascript (*.es6/*.js/*.vue/*.jsx)

### Declaring phrase usage in javascript
There are two supported options for declaring phrase usage in javascript.
#### Phrases files
You can have a file named ****phrases.[es6|js]** with an array of phrase key strings in the default export.
**Example:**
```js
const phrases = ["my.key", "my.other.key"];
export default phrases;
```
#### JSDoc comments
You can add a custom ```@phrases``` JSDoc comment for the functions where you are using i18n phrases.
**Example:**
```js
/**
 * My function description
 *
 * @param {*} param1 The parameter
* @returns Description of return value
 * @phrases ["my.key", "my.other.key"]
 */
```

**Syntax:**
```
xptool phrase check-missing
```  
  
## phrase:edit
Edits a single phrase in all ```i18n/phrases[_language].properties``` files simultaneously.


**Syntax:**
```
xptool phrase edit
```  
  
## phrase:list-languages
Lists all languages in the project. The list of languages is determined by reading the ```i18n/phrases[_language].properties``` files from the site directory.

**Syntax:**
```
xptool phrase list-languages
```  
  
## phrase:prune
Cleans up ```i18n/phrases[_language].properties``` files by removing unused phrases.


**Syntax:**
```
xptool phrase prune
```  
  
## phrase:sync
Checks consistency between all phrases files and adds any missing phrases to them.


**Syntax:**
```
xptool phrase sync
```  
  
## phrase:tidy
Sorts, groups and cleans up the ```i18n/phrases[_language].properties``` files.

The phrases are grouped in the following way:
* **Glossary** single word phrases.
* **Mime types** mime type phrases
* **Regular phrases** grouped by first segment in the phrase key (**my-part**.label)


**Syntax:**
```
xptool phrase tidy
```  
  
## phrase:validate
Checks consistency between all phrases files.


**Syntax:**
```
xptool phrase validate
```  
  
## project:set-version
Sets project version in gradle.properties.


**Syntax:**
```
xptool project set-version
```  
  
## project:set-xpversion
Sets Enonic XP version number in Dockerfile and gradle.properties. The version list is fetched from enonic/xp-app on Github, so only released and valid veresions are available.


**Syntax:**
```
xptool project set-xpversion
```  
  
## project:upgrade-xp7
Update project from XP6 to XP7 syntax and structure.


**Syntax:**
```
xptool project upgrade-xp7
```  
  
## service:create
Creates a service from a set of templates.


**Syntax:**
```
xptool service create
```  
  
## service:list
Lists all services in the project.


**Syntax:**
```
xptool service list
```  
  
## subproject:build
Builds current subproject. You need to run this command from within a subproject folder.


**Syntax:**
```
xptool subproject build
```  
  
## subproject:watch
Watches current subproject. You need to run this command from within a subproject folder.


**Syntax:**
```
xptool subproject watch
```  
  
## task:create
Creates a task from a set of templates.


**Syntax:**
```
xptool task create
```  
  
## task:list
Lists all tasks in the project.


**Syntax:**
```
xptool task list
```  
  
## xdata:list
Lists all x-data in the project.


**Syntax:**
```
xptool xdata list
```  
  
