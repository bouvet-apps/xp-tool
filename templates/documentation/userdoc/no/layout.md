### {{displayName}}

::: .description
{{summary}}
:::

{{#if image}}
{{#each image}}
![{{../displayName}}]({{{this}}} "{{../displayName}}")
{{/each}}
{{/if}}

{{#if fields.length}}
#### Innholdsfelter
{{/if}}

{{#fields}}
{{> field.md }}
{{/fields}}

