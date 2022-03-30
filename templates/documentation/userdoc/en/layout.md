### {{displayName}}

::: .description
{{summary}}
:::

{{#if image}}
{{#each image}}
![{{../displayName}}]({{{this}}} "{{../displayName}}")
{{/each}}
{{/if}}

#### Innholdsfelter

{{#fields}}
{{> field.md }}
{{/fields}}

